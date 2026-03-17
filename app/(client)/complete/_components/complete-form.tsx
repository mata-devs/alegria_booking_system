"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "@/app/(client)/_components/layout/Navbar";
import { firestore } from "@/lib/firebase";
import { createBooking } from "@/lib/booking-service";
import { toISODate, toTimeSlot } from "@/lib/date-utils";

const DRAFT_STORAGE_KEY = "guestBookingDraft";
const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // Image uploads are limited to 5MB.
type PaymentMethod = "Gcash / Maya" | "BDO" | "BPI";
type UnknownRecord = Record<string, unknown>;

interface GuestBookingDraft {
    bookingDate: string;
    bookingTime: string;
    selectedActivityId: string;
    selectedTimeSlotId: string;
    guestCount: number;
    paymentMethod: PaymentMethod;
    appliedPromo?: string;
    formData: {
        repName: string;
        repAge: string;
        repGender: string;
        repEmail: string;
        repPhone: string;
        repNationality: string;
        tourOperator?: string;
        idempotencyKey: string;
    };
    guests: { name: string; age: string; gender: string; nationality: string }[];
    idempotencyKey: string; // required: always promoted from formData.idempotencyKey in guestbooking handleSubmit
}

function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read the selected file."));
        reader.readAsDataURL(file);
    });
}

function asRecord(value: unknown): UnknownRecord | null {
    return typeof value === "object" && value !== null ? (value as UnknownRecord) : null;
}

function getPaymentInstruction(activityData: UnknownRecord | undefined, paymentMethod: PaymentMethod) {
    const normalizedKeys: Record<PaymentMethod, string[]> = {
        "Gcash / Maya": ["Gcash / Maya", "gcashMaya", "gcash_maya", "gcashmaya"],
        BDO: ["BDO", "bdo"],
        BPI: ["BPI", "bpi"],
    };

    const sources = [
        asRecord(activityData?.paymentInstructions),
        asRecord(activityData?.paymentMethods),
        asRecord(activityData?.paymentInstructionImages),
    ].filter((source): source is UnknownRecord => Boolean(source));

    for (const source of sources) {
        for (const key of normalizedKeys[paymentMethod]) {
            const value = source[key];
            if (!value) continue;
            if (typeof value === "string") {
                return { imageUrl: value, notes: null };
            }
            const valueRecord = asRecord(value);
            if (!valueRecord) continue;
            return {
                imageUrl: typeof valueRecord.imageUrl === "string"
                    ? valueRecord.imageUrl
                    : typeof valueRecord.image === "string"
                        ? valueRecord.image
                        : typeof valueRecord.qrImageUrl === "string"
                            ? valueRecord.qrImageUrl
                            : null,
                notes: typeof valueRecord.notes === "string"
                    ? valueRecord.notes
                    : typeof valueRecord.instructions === "string"
                        ? valueRecord.instructions
                        : null,
            };
        }
    }

    const directImageMap: Record<PaymentMethod, string | null | undefined> = {
        "Gcash / Maya": typeof activityData?.gcashMayaImageUrl === "string" ? activityData.gcashMayaImageUrl : null,
        BDO: typeof activityData?.bdoImageUrl === "string" ? activityData.bdoImageUrl : null,
        BPI: typeof activityData?.bpiImageUrl === "string" ? activityData.bpiImageUrl : null,
    };

    return {
        imageUrl: directImageMap[paymentMethod] || null,
        notes: typeof activityData?.paymentInstructionNote === "string" ? activityData.paymentInstructionNote : null,
    };
}

export function CompleteForm() {
    const searchParams = useSearchParams();
    const existingBookingId = searchParams.get("bookingId");
    const [draft, setDraft] = useState<GuestBookingDraft | null>(null);
    const [draftLoading, setDraftLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submittedBookingId, setSubmittedBookingId] = useState<string | null>(existingBookingId);
    const [paymentImageUrl, setPaymentImageUrl] = useState<string | null>(null);
    const [paymentNotes, setPaymentNotes] = useState<string | null>(null);

    useEffect(() => {
        try {
            const rawDraft = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
            if (rawDraft) {
                setDraft(JSON.parse(rawDraft));
            }
        } catch {
            setError("Failed to load your booking details. Please go back and try again.");
        } finally {
            setDraftLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!draft?.selectedActivityId) return;
        let cancelled = false;

        (async () => {
            try {
                const snap = await getDoc(doc(firestore, "activities", draft.selectedActivityId));
                if (!snap.exists() || cancelled) return;
                const instruction = getPaymentInstruction(snap.data() as UnknownRecord, draft.paymentMethod);
                if (!cancelled) {
                    setPaymentImageUrl(instruction.imageUrl);
                    setPaymentNotes(instruction.notes);
                }
            } catch {
                if (!cancelled) {
                    setPaymentImageUrl(null);
                    setPaymentNotes(null);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [draft]);

    const summary = useMemo(() => {
        if (!draft) return null;
        return {
            activityId: draft.selectedActivityId,
            guestTotal: (draft.guests?.length || 0) + 1,
            paymentMethod: draft.paymentMethod,
        };
    }, [draft]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setError(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (!file.type.startsWith("image/")) {
            setSelectedFile(null);
            setError("Please upload an image file only.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_RECEIPT_SIZE_BYTES) {
            setSelectedFile(null);
            setError("Receipt image must be 5MB or smaller.");
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmitPayment = async () => {
        if (!draft) {
            setError("Booking details are missing. Please go back and try again.");
            return;
        }

        if (!draft.selectedActivityId) {
            setError("Missing activity selection. Please go back and choose an activity.");
            return;
        }

        if (!selectedFile) {
            setError("Please upload your payment screenshot before submitting.");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const receiptDataUrl = await readFileAsDataUrl(selectedFile);
            const result = await createBooking({
                tourDate: toISODate(draft.bookingDate),
                timeSlot: toTimeSlot(draft.bookingTime),
                activityId: draft.selectedActivityId,
                representative: {
                    fullName: draft.formData.repName.trim(),
                    email: draft.formData.repEmail.trim(),
                    phoneNumber: draft.formData.repPhone.trim(),
                    age: parseInt(draft.formData.repAge, 10),
                    gender: draft.formData.repGender as "Male" | "Female" | "Prefer not to say",
                    nationality: draft.formData.repNationality,
                },
                guests: (draft.guests || []).map((guest) => ({
                    fullName: guest.name.trim(),
                    age: parseInt(guest.age, 10),
                    gender: guest.gender as "Male" | "Female" | "Prefer not to say",
                    nationality: guest.nationality,
                })),
                promoCode: draft.appliedPromo || undefined,
                paymentMethod: draft.paymentMethod,
                receiptDataUrl,
                idempotencyKey: draft.idempotencyKey, // single source of truth — always set by guestbooking handleSubmit
            });

            window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
            
            // Rotate the idempotency key for the next potential booking attempt
            // We keep the rest of the form data as requested, but ensure the "fingerprint" is fresh.
            try {
                const rawFormData = window.sessionStorage.getItem("guestFormData");
                if (rawFormData) {
                    const parsed = JSON.parse(rawFormData);
                    parsed.idempotencyKey = crypto.randomUUID(); // fresh UUID v4 for the next booking session
                    window.sessionStorage.setItem("guestFormData", JSON.stringify(parsed));
                }
            } catch (err) {
                console.error("Failed to rotate idempotency key:", err);
            }

            setDraft(null);
            setSelectedFile(null);
            setSubmittedBookingId(result.bookingId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit your payment.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submittedBookingId) {
        return (
            <div className="min-h-screen bg-white font-poppins">
                <Navbar />
                <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center text-center">
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-[#74C00F] rounded-full flex items-center justify-center shadow-lg shadow-[#74C00F]/30">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-6">Payment Submitted!</h1>
                    <div className="space-y-4 mb-10 max-w-xl">
                        <p className="text-lg font-semibold text-gray-800">
                            Your booking is reserved and waiting for manual payment verification.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            An operator will review your uploaded payment proof and update the payment once it has been verified.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            Check your email for additional details.
                        </p>
                    </div>
                    <div className="mb-10 text-xl">
                        <span className="text-gray-500">Booking ID: </span>
                        <span className="font-black text-black">{submittedBookingId}</span>
                    </div>
                    <div className="w-full max-w-2xl bg-[#f0f9ff] border border-[#bae6fd] rounded-2xl p-6 mb-12 flex flex-col items-center gap-3">
                        <p className="text-[#0369a1] text-sm md:text-base font-medium leading-relaxed">
                            Keep this booking ID for reference while your payment is being reviewed by the operator, this would take a maximum of 24 hours.
                        </p>
                    </div>
                    <Link 
                        href="/" 
                        onClick={() => {
                            // Clear all sessionStorage data, once clicking the Return to Home Page button
                            window.sessionStorage.removeItem("guestFormData");
                            window.sessionStorage.removeItem("guestFormGuests");
                            window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                        }}
                        className="text-[#74C00F] text-xl font-black underline decoration-2 underline-offset-8 hover:text-[#62a30d] transition">
                        Return to Home Page
                    </Link>
                </div>
            </div>
        );
    }

    if (draftLoading) {
        return (
            <div className="min-h-screen bg-white font-poppins">
                <Navbar />
                <div className="max-w-3xl mx-auto px-4 py-20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#74C00F]" />
                </div>
            </div>
        );
    }

    if (!draft) {
        return (
            <div className="min-h-screen bg-white font-poppins">
                <Navbar />
                <div className="max-w-3xl mx-auto px-4 py-20">
                    <div className="border border-gray-200 rounded-3xl p-8 text-center shadow-sm">
                        <h1 className="text-3xl font-bold text-black mb-4">No booking draft found</h1>
                        <p className="text-gray-600 mb-6">
                            Please go back to the guest booking form and continue to payment again.
                        </p>
                        <Link href="/guestbooking" className="inline-flex bg-[#74C00F] text-white px-6 py-3 rounded-full font-bold hover:bg-[#62a30d] transition">
                            Back to Guest Booking
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-poppins">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                    <h1 className="text-3xl font-bold text-black mb-2">Complete Your Payment</h1>
                    <p className="text-gray-600 mb-8">
                        Upload your payment screenshot so the operator can manually verify it.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 mb-8">
                        <div className="rounded-2xl border border-gray-200 p-4 bg-[#F9FAFB]">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Payment Method</p>
                            <p className="text-lg font-semibold text-black">{summary?.paymentMethod}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-4 bg-[#F9FAFB]">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Guests</p>
                            <p className="text-lg font-semibold text-black">{summary?.guestTotal}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-4 bg-[#F9FAFB]">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Date</p>
                            <p className="text-lg font-semibold text-black">{draft.bookingDate}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-4 bg-[#F9FAFB]">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Time</p>
                            <p className="text-lg font-semibold text-black">{draft.bookingTime}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-black mb-3">Payment Instructions</h2>
                        {paymentImageUrl ? (
                            <img
                                src={paymentImageUrl}
                                alt={`${draft.paymentMethod} payment instructions`}
                                className="w-full rounded-2xl border border-gray-200 object-cover"
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-[#F9FAFB] p-6 text-gray-500">
                                No payment instruction image is configured yet for this method.
                            </div>
                        )}
                        {paymentNotes && (
                            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{paymentNotes}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-black mb-2">Upload Payment Screenshot</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#74C00F] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#62a30d]"
                        />
                        <p className="mt-2 text-xs text-gray-500">Image files only, maximum 5MB.</p>
                        {selectedFile && (
                            <p className="mt-3 text-sm font-medium text-black">Selected file: {selectedFile.name}</p>
                        )}
                    </div>

                    {error && (
                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            href={{
                                pathname: "/guestbooking",
                                query: draft ? {
                                    date: draft.bookingDate,
                                    time: draft.bookingTime,
                                    slotId: draft.selectedTimeSlotId,
                                    activityId: draft.selectedActivityId,
                                    guests: draft.guestCount.toString(),
                                    ...(draft.appliedPromo ? { promoCode: draft.appliedPromo } : {})
                                } : {}
                            }}
                            className="inline-flex items-center justify-center rounded-full border-2 border-gray-300 px-6 py-3 font-bold text-black hover:bg-gray-50 transition"
                        >
                            Back to Form
                        </Link>
                        <button
                            type="button"
                            onClick={handleSubmitPayment}
                            disabled={submitting}
                            className="inline-flex items-center justify-center rounded-full bg-[#74C00F] px-6 py-3 font-bold text-white hover:bg-[#62a30d] transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Submitting...</span>
                            ) : (
                                "Submit Payment"
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-black mb-4">Booking Summary</h2>
                    <div className="space-y-4 text-sm text-gray-600">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Activity</p>
                            <p className="font-semibold text-black break-all">{summary?.activityId}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Representative</p>
                            <p className="font-semibold text-black">{draft.formData.repName || "—"}</p>
                            <p>{draft.formData.repEmail || "—"}</p>
                            <p>{draft.formData.repPhone || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Promo Code</p>
                            <p className="font-semibold text-black">{draft.appliedPromo || "None"}</p>
                        </div>
                        <div className="rounded-2xl bg-[#F9FAFB] p-4 border border-gray-200 text-gray-600">
                            Your booking will be created as <span className="font-semibold text-black">reserved</span> and your payment will be marked <span className="font-semibold text-black">pending</span> until an operator manually verifies it.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}