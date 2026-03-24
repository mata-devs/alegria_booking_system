"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { representativeFormSchema, guestSchema } from "@/lib/schema";

// Components
/*import { ProgressIndicator } from "./_components/ProgressIndicator";*/
import { RepresentativeForm } from "./_components/RepresentativeForm";
import { GuestsList } from "./_components/GuestsList";
import { BookingSidebar } from "@/app/(with top navigation)/guestbooking/_components/BookingSidebar";
import { TourOperatorDropdown } from "./_components/TourOperatorDropdown";
import { FormActions } from "./_components/FormActions";
import { Loader2 } from "lucide-react";

// Hooks
import { useSessionStorage } from "@/hooks/useSessionStorage";

const MAX_GUESTS = 30;

interface GuestFormData {
    repName: string;
    repAge: string;
    repGender: string;
    repEmail: string;
    repPhone: string;
    repNationality: string;
    tourOperator: string;
    idempotencyKey: string;
}

interface AdditionalGuest {
    name: string;
    age: string;
    gender: string;
    nationality: string;
}

interface GuestBookingMainProps {
    bookingDate: string;
    bookingTime: string;
    guestCount: number;
    selectedActivityId: string;
    selectedTimeSlotId: string;
    formData: GuestFormData;
    setFormData: (val: GuestFormData | ((prev: GuestFormData) => GuestFormData)) => void;
    guests: AdditionalGuest[];
    setGuests: (val: AdditionalGuest[] | ((prev: AdditionalGuest[]) => AdditionalGuest[])) => void;
    appliedPromo: string;
    paymentMethod: string;
    setPaymentMethod: (val: string) => void;
}

const createEmptyGuest = (): AdditionalGuest => ({
    name: "",
    age: "",
    gender: "",
    nationality: "PH",
});

const normalizeGuestCount = (count: number) => {
    if (Number.isNaN(count) || count < 1) return 1;
    return Math.min(count, MAX_GUESTS);
};

const syncGuestsToCount = (currentGuests: AdditionalGuest[], totalGuestCount: number) => {
    const targetGuestRows = Math.max(0, normalizeGuestCount(totalGuestCount) - 1);
    return Array.from(
        { length: targetGuestRows },
        (_, index) => currentGuests[index] ?? createEmptyGuest()
    );
};

const getInitialGuests = (totalGuestCount: number) => {
    const emptyGuests = syncGuestsToCount([], totalGuestCount);

    if (typeof window === "undefined") {
        return emptyGuests;
    }

    try {
        const storedGuests = window.sessionStorage.getItem("guestFormGuests");
        if (!storedGuests) return emptyGuests;

        const parsedGuests = JSON.parse(storedGuests);
        return syncGuestsToCount(Array.isArray(parsedGuests) ? parsedGuests : [], totalGuestCount);
    } catch {
        return emptyGuests;
    }
};

const GuestBookingMain = ({
    bookingDate, bookingTime, guestCount, selectedActivityId, selectedTimeSlotId,
    formData, setFormData, guests, setGuests,
    appliedPromo,
    paymentMethod, setPaymentMethod,
}: GuestBookingMainProps) => {
    const router = useRouter();
    const [continuing, setContinuing] = useState(false);
    const [continueError, setContinueError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [repErrors, setRepErrors] = useState<Partial<Record<string, string>>>({});
    const [guestErrors, setGuestErrors] = useState<Record<number, Partial<Record<string, string>>>>({});

    const handleGuestCountChange = (nextCount: number) => {
        setGuests((prev) => syncGuestsToCount(prev, nextCount));
    };

    const handleAddGuest = () => {
        setGuests((prev) => syncGuestsToCount(prev, guestCount + 1));
    };

    const handleRemoveGuest = (idx: number) => {
        setGuests((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        setContinueError(null);
        setSubmitted(true);

        if (!selectedActivityId) {
            setContinueError("Missing activity selection. Please go back and choose an activity.");
            return;
        }

        if (!bookingDate || !bookingTime) {
            setContinueError("Missing booking date or time.");
            return;
        }

        // ── Validate representative ──────────────────────────────────────────
        const repResult = representativeFormSchema.safeParse(formData);
        const nextRepErrors: Partial<Record<string, string>> = {};
        if (!repResult.success) {
            for (const issue of repResult.error.issues) {
                const key = String(issue.path[0]);
                if (!nextRepErrors[key]) nextRepErrors[key] = issue.message;
            }
        }
        setRepErrors(nextRepErrors);

        // ── Validate each additional guest ───────────────────────────────────
        const nextGuestErrors: Record<number, Partial<Record<string, string>>> = {};
        for (let i = 0; i < guests.length; i++) {
            const gResult = guestSchema.safeParse(guests[i]);
            if (!gResult.success) {
                const errs: Partial<Record<string, string>> = {};
                for (const issue of gResult.error.issues) {
                    const key = String(issue.path[0]);
                    if (!errs[key]) errs[key] = issue.message;
                }
                nextGuestErrors[i] = errs;
            }
        }
        setGuestErrors(nextGuestErrors);

        const hasRepErrors = Object.keys(nextRepErrors).length > 0;
        const hasGuestErrors = Object.keys(nextGuestErrors).length > 0;
        if (hasRepErrors || hasGuestErrors) {
            setContinueError("Please fix the highlighted errors before continuing.");
            // Scroll to the first error
            setTimeout(() => {
                const el = document.querySelector('[role="alert"]');
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
            return;
        }

        try {
            setContinuing(true);

            sessionStorage.setItem("bookingContext", JSON.stringify({
                bookingDate,
                bookingTime,
                selectedActivityId,
                selectedTimeSlotId,
                guestCount,
                promoCode: appliedPromo || undefined,
                tourOperatorUid: formData.tourOperator || undefined,
                paymentMethod,
            }));

            router.push("/complete");
        } catch {
            setContinuing(false);
            setContinueError("Failed to continue to payment. Please try again.");
        }
    };

    const handleGoBack = () => {
        const params = new URLSearchParams({
            date: bookingDate,
            time: bookingTime,
            slotId: selectedTimeSlotId,
            activityId: selectedActivityId,
            guests: guestCount.toString()
        });
        router.push(`/booking?${params.toString()}`);
    };

    return (
        <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-8 order-1 lg:pt-7">
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2 text-black">Guest Information</h1>
                    <p className="text-gray-500 mb-8">Please fill in the details for all guests attending the tour</p>
                    <RepresentativeForm
                        formData={formData}
                        onChange={(field, val) => setFormData((prev: typeof formData) => ({ ...prev, [field]: val }))}
                        errors={repErrors}
                        submitted={submitted}
                    />
                    <GuestsList
                        guests={guests}
                        onUpdateGuest={(idx, field, val) => { const n = [...guests]; n[idx] = { ...n[idx], [field]: val }; setGuests(n); }}
                        onAddGuest={handleAddGuest}
                        onRemoveGuest={handleRemoveGuest}
                        guestErrors={guestErrors}
                        submitted={submitted}
                    />
                    <TourOperatorDropdown value={formData.tourOperator} onChange={(val) => setFormData((prev: typeof formData) => ({ ...prev, tourOperator: val }))} />
                </div>
            </div>

            <div className="lg:col-span-4 order-2 min-w-0 w-full flex justify-center lg:sticky lg:top-28 lg:z-20 lg:h-fit lg:self-start">
                <BookingSidebar
                    bookingDate={bookingDate}
                    bookingTime={bookingTime}
                    selectedActivityId={selectedActivityId}
                    selectedTimeSlotId={selectedTimeSlotId}
                    guestCount={guestCount}
                    slotsAvailable={null}
                    showPaymentMethods={true}
                    onGuestCountChange={handleGuestCountChange}
                    onPaymentMethodChange={setPaymentMethod}
                    onContinue={handleSubmit}
                    initialPromoCode={appliedPromo}
                    onPromoApplied={(promo) => {
                        if (promo.operatorUid) {
                            setFormData(prev => ({ ...prev, tourOperator: promo.operatorUid || "" }));
                        }
                    }}
                />
            </div>

            <div className="lg:col-span-8 order-3">
                <FormActions onGoBack={handleGoBack} onSubmit={handleSubmit} submitting={continuing} error={continueError} />
            </div>
        </main>
    );
};

function GuestBookingContent() {
    const searchParams = useSearchParams();

    // ── Context ───────────────────────────────────────────────────────────────
    const bookingDate = searchParams.get("date") || "January 18, 2026";
    const bookingTime = searchParams.get("time") || "8:00 AM";
    const selectedTimeSlotId = searchParams.get("slotId") || "";
    const selectedActivityId = searchParams.get("activityId") || "";

    const rawGuests = searchParams.get("guests");
    const initialGuestCount = rawGuests ? parseInt(rawGuests, 10) : 1;
    const requestedGuestCount = normalizeGuestCount(initialGuestCount);

    const [isMounted, setIsMounted] = useState(false);

    // ── Form State ────────────────────────────────────────────────────────────
    const [formData, setFormData] = useSessionStorage<GuestFormData>("guestFormData", {
        repName: "", repAge: "", repGender: "", repEmail: "", repPhone: "", repNationality: "PH", tourOperator: "",
        idempotencyKey: "" // populated by useEffect below — empty string avoids SSR/crypto mismatch
    });
    const [guests, setGuests] = useState<AdditionalGuest[]>(() => getInitialGuests(requestedGuestCount));
    const [appliedPromo, setAppliedPromo] = useState<string>(searchParams.get("promoCode") || "");
    const [paymentMethod, setPaymentMethod] = useState("Gcash / Maya");
    const guestCount = guests.length + 1;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // ── Idempotency key: generate once per booking session, client-side only ──
    // useEffect guarantees this never runs on the server (Next.js 16 SSR safe).
    // crypto.randomUUID() is the Web Crypto API — no import needed in client components.
    // A new key is only generated when the stored key is blank (first visit or post-success rotation).
    useEffect(() => {
        if (!formData.idempotencyKey) {
            setFormData(prev => ({ ...prev, idempotencyKey: crypto.randomUUID() }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try {
            window.sessionStorage.setItem("guestFormGuests", JSON.stringify(guests));
        } catch (error) {
            console.error("Error writing guestFormGuests to session storage:", error);
        }
    }, [guests]);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-poppins pb-20">
            <GuestBookingMain
                bookingDate={bookingDate} bookingTime={bookingTime} guestCount={guestCount}
                selectedActivityId={selectedActivityId} selectedTimeSlotId={selectedTimeSlotId}
                formData={formData} setFormData={setFormData}
                guests={guests} setGuests={setGuests}
                appliedPromo={appliedPromo}
                paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
            />
        </div>
    );
}

export default function GuestInformationFormPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-[#74C00F]" /></div>}>
            <GuestBookingContent />
        </Suspense>
    );
}
