"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { representativeFormSchema, guestSchema } from "@/app/lib/schema";
import type { PaymentMethod } from "@/app/lib/booking-service";
import { useSessionStorage } from "@/app/hooks/useSessionStorage";
import { RepresentativeForm } from "./_components/RepresentativeForm";
import { GuestsList } from "./_components/GuestsList";
import { BookingSidebar } from "./_components/BookingSidebar";
import { TourOperatorDropdown } from "./_components/TourOperatorDropdown";
import { FormActions } from "./_components/FormActions";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { Loader2 } from "lucide-react";

const MAX_GUESTS = 30;
const PAYMENT_METHODS: PaymentMethod[] = ["Gcash / Maya", "BDO", "BPI"];

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

const createEmptyGuest = (): AdditionalGuest => ({ name: "", age: "", gender: "", nationality: "PH" });

const normalizeGuestCount = (count: number) => {
    if (Number.isNaN(count) || count < 1) return 1;
    return Math.min(count, MAX_GUESTS);
};

const syncGuestsToCount = (current: AdditionalGuest[], total: number) => {
    const target = Math.max(0, normalizeGuestCount(total) - 1);
    return Array.from({ length: target }, (_, i) => current[i] ?? createEmptyGuest());
};

const getInitialGuests = (total: number) => {
    const empty = syncGuestsToCount([], total);
    if (typeof window === "undefined") return empty;
    try {
        const stored = window.sessionStorage.getItem("guestFormGuests");
        if (!stored) return empty;
        const parsed = JSON.parse(stored);
        return syncGuestsToCount(Array.isArray(parsed) ? parsed : [], total);
    } catch {
        return empty;
    }
};

function GuestBookingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const selectedActivityId = searchParams.get("activityId") || "";
    const activityName = searchParams.get("activityName") || undefined;
    const [bookingDate, setBookingDate] = useState(() => searchParams.get("date") || "");
    const rawGuests = searchParams.get("guests");
    const initialGuestCount = rawGuests ? parseInt(rawGuests, 10) : 1;
    const requestedGuestCount = normalizeGuestCount(initialGuestCount);
    const priceOverride = searchParams.get("price") ? Number(searchParams.get("price")) : undefined;
    const minGuests = searchParams.get("minGuests") ? Number(searchParams.get("minGuests")) : undefined;
    const maxGuests = searchParams.get("maxGuests") ? Number(searchParams.get("maxGuests")) : undefined;
    const sourceType = (searchParams.get("sourceType") as "activity" | "tourPackage" | null) ?? "activity";
    const packageOperatorId = searchParams.get("packageOperatorId") || undefined;

    const [isMounted, setIsMounted] = useState(false);
    const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
    const [promoOperatorUid, setPromoOperatorUid] = useState<string | null>(null);
    const [continuing, setContinuing] = useState(false);
    const [continueError, setContinueError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [repErrors, setRepErrors] = useState<Partial<Record<string, string>>>({});
    const [guestErrors, setGuestErrors] = useState<Record<number, Partial<Record<string, string>>>>({});

    const [formData, setFormData] = useSessionStorage<GuestFormData>("guestFormData", {
        repName: "", repAge: "", repGender: "", repEmail: "", repPhone: "", repNationality: "PH",
        tourOperator: "", idempotencyKey: "",
    });
    const [guests, setGuests] = useState<AdditionalGuest[]>(() => getInitialGuests(requestedGuestCount));
    const [appliedPromo, setAppliedPromo] = useState<string>(searchParams.get("promoCode") || "");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Gcash / Maya");
    const guestCount = guests.length + 1;

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        try {
            const ctxRaw = window.sessionStorage.getItem("bookingContext");
            if (!ctxRaw) return;
            const ctx = JSON.parse(ctxRaw) as { paymentMethod?: unknown };
            if (typeof ctx.paymentMethod === "string" && PAYMENT_METHODS.includes(ctx.paymentMethod as PaymentMethod)) {
                setPaymentMethod(ctx.paymentMethod as PaymentMethod);
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!formData.idempotencyKey) {
            setFormData((prev) => ({ ...prev, idempotencyKey: crypto.randomUUID() }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-lock operator for tour packages
    useEffect(() => {
        if (sourceType === "tourPackage" && packageOperatorId) {
            setFormData((prev) => ({ ...prev, tourOperator: packageOperatorId }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceType, packageOperatorId]);

    useEffect(() => {
        try { window.sessionStorage.setItem("guestFormGuests", JSON.stringify(guests)); } catch { /* ignore */ }
    }, [guests]);

    const handleGuestCountChange = (nextCount: number) => {
        setGuests((prev) => syncGuestsToCount(prev, nextCount));
    };

    const handleSubmit = async () => {
        setContinueError(null);
        setSubmitted(true);

        if (!selectedActivityId) {
            setContinueError("Missing activity. Please go back and choose an activity.");
            return;
        }
        if (!bookingDate) {
            setContinueError("Missing booking date.");
            return;
        }

        const repResult = representativeFormSchema.safeParse(formData);
        const nextRepErrors: Partial<Record<string, string>> = {};
        if (!repResult.success) {
            for (const issue of repResult.error.issues) {
                const key = String(issue.path[0]);
                if (!nextRepErrors[key]) nextRepErrors[key] = issue.message;
            }
        }
        setRepErrors(nextRepErrors);

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

        if (Object.keys(nextRepErrors).length > 0 || Object.keys(nextGuestErrors).length > 0) {
            setContinueError("Please fix the highlighted errors before continuing.");
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
                selectedActivityId,
                activityName,
                guestCount,
                promoCode: appliedPromo || undefined,
                tourOperatorUid: formData.tourOperator || undefined,
                paymentMethod,
                sourceType,
            }));
            router.push("/booking/payment");
        } catch {
            setContinuing(false);
            setContinueError("Failed to continue to payment. Please try again.");
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    if (!isMounted) return null;

    const sidebarProps = {
        bookingDate,
        selectedActivityId,
        activityName,
        guestCount,
        showPaymentMethods: true,
        onGuestCountChange: handleGuestCountChange,
        paymentMethod,
        onPaymentMethodChange: setPaymentMethod,
        onContinue: handleSubmit,
        initialPromoCode: appliedPromo,
        priceOverride,
        minGuests,
        maxGuests,
        packageOperatorId,
        onDateChange: setBookingDate,
        sourceType,
        onPromoApplied: (promo: { code: string; discount: number; operatorUid?: string }) => {
            setAppliedPromo(promo.code);
            if (promo.operatorUid) {
                setFormData((prev) => ({ ...prev, tourOperator: promo.operatorUid || "" }));
                setPromoOperatorUid(promo.operatorUid);
            } else {
                setPromoOperatorUid(null);
            }
        },
        onPromoRemoved: () => {
            setAppliedPromo("");
            setPromoOperatorUid(null);
            setFormData((prev) => ({ ...prev, tourOperator: "" }));
        },
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-poppins pb-24 lg:pb-20">
            <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-8">
                <div className="lg:col-span-8 flex flex-col gap-8 order-1">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-black">Guest Information</h1>
                        <p className="text-gray-500 mb-8">Please fill in the details for all guests attending the tour</p>
                        <RepresentativeForm
                            formData={formData}
                            onChange={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
                            errors={repErrors}
                            submitted={submitted}
                        />
                        <GuestsList
                            guests={guests}
                            onUpdateGuest={(idx, field, val) => {
                                const n = [...guests];
                                n[idx] = { ...n[idx], [field]: val };
                                setGuests(n);
                            }}
                            onAddGuest={() => setGuests((prev) => syncGuestsToCount(prev, guestCount + 1))}
                            onRemoveGuest={(idx) => setGuests((prev) => prev.filter((_, i) => i !== idx))}
                            guestErrors={guestErrors}
                            submitted={submitted}
                        />
                        {sourceType !== "tourPackage" && (
                            <TourOperatorDropdown
                                value={formData.tourOperator}
                                onChange={(val) => setFormData((prev) => ({ ...prev, tourOperator: val }))}
                                lockedByPromo={!!promoOperatorUid}
                            />
                        )}
                    </div>
                </div>

                {/* Desktop sidebar */}
                <div className="hidden lg:flex lg:col-span-4 order-2 min-w-0 w-full justify-center lg:sticky lg:top-8 lg:z-20 lg:h-fit lg:self-start">
                    <BookingSidebar {...sidebarProps} />
                </div>

                <div className="lg:col-span-8 order-3">
                    <FormActions onGoBack={handleGoBack} onSubmit={handleSubmit} submitting={continuing} error={continueError} />
                </div>
            </main>

            {/* Mobile sticky bottom bar */}
            <div className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-2xl px-4 py-3 flex items-center gap-3 ${summaryDrawerOpen ? "hidden" : ""}`}>
                <div className="flex-1 min-w-0">
                    {activityName && (
                        <p className="text-xs text-gray-400 truncate leading-none mb-0.5">{activityName}</p>
                    )}
                    <p className="text-sm font-bold text-gray-800 truncate">
                        {guestCount} {guestCount === 1 ? "guest" : "guests"}{bookingDate ? ` · ${new Date(bookingDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                    </p>
                </div>
                <button
                    onClick={() => setSummaryDrawerOpen(true)}
                    className="shrink-0 border border-green-500 text-green-600 font-semibold px-4 py-2.5 rounded-full text-sm transition-colors hover:bg-green-50"
                >
                    Summary
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={continuing}
                    className="shrink-0 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all shadow-md disabled:opacity-60"
                >
                    {continuing ? "..." : "Continue"}
                </button>
            </div>

            {/* Mobile booking summary drawer */}
            <Drawer open={summaryDrawerOpen} onOpenChange={setSummaryDrawerOpen}>
                <DrawerContent className="pb-6">
                    <DrawerHeader className="text-left shrink-0">
                        <DrawerTitle>Booking Summary</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 64px)" }}>
                        <BookingSidebar {...sidebarProps} />
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

export default function GuestInformationFormPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin w-10 h-10 text-[#74C00F]" />
            </div>
        }>
            <GuestBookingContent />
        </Suspense>
    );
}
