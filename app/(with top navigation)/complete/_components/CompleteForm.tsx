"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { createBooking, type PaymentMethod } from "@/lib/booking-service";
import { TripDetails } from "@/app/(with top navigation)/complete/_components/TripDetails";
import { PaymentInstructions } from "@/app/(with top navigation)/complete/_components/PaymentInstructions";
import { BookingSummary } from "@/app/(with top navigation)/complete/_components/BookingSummary";
import { UploadPayment } from "@/app/(with top navigation)/complete/_components/UploadPayment";

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;
type UnknownRecord = Record<string, unknown>;

interface BookingContext {
    bookingDate: string;
    bookingTime: string;
    selectedActivityId: string;
    selectedTimeSlotId?: string;
    guestCount: number;
    promoCode?: string;
    tourOperatorUid?: string;
    paymentMethod: PaymentMethod;
}

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

function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read the selected file."));
        reader.readAsDataURL(file);
    });
}

function parseTimeSlot(display: string): "AM" | "PM" {
    return display.trim().toUpperCase().includes("PM") ? "PM" : "AM";
}

type OperatorPaymentInfo = { imageUrl: string | null; accountName: string | null; accountNumber: string | null };
type PricingInfo = { totalAmount: number | null };
type OperatorMeta = { companyName: string | null; phoneNumber: string | null };

const SERVICE_CHARGE = 500;
const MATA_SERVICE_FEE = 500;
const LGU_SERVICE_FEE = 500;

function asRecord(value: unknown): UnknownRecord | null {
    return typeof value === "object" && value !== null ? (value as UnknownRecord) : null;
}

function getOperatorPaymentInfoFromUserDoc(userData: UnknownRecord | undefined, method: PaymentMethod): OperatorPaymentInfo {
    const methods = userData?.paymentMethods;
    if (!Array.isArray(methods)) return { imageUrl: null, accountName: null, accountNumber: null };

    const indexByMethod: Record<PaymentMethod, number> = {
        "Gcash / Maya": 0,
        BDO: 1,
        BPI: 2,
    };
    const entry = asRecord(methods[indexByMethod[method]]);
    if (!entry) return { imageUrl: null, accountName: null, accountNumber: null };

    if (method === "Gcash / Maya") {
        return {
            imageUrl: typeof entry.gcashMayaImageUrl === "string" ? entry.gcashMayaImageUrl : null,
            accountName: typeof entry.gcashMayaAccountName === "string" ? entry.gcashMayaAccountName : null,
            accountNumber: typeof entry.gcashMayaAccountNumber === "string" ? entry.gcashMayaAccountNumber : null,
        };
    }
    if (method === "BDO") {
        return {
            imageUrl: typeof entry.bdoImageUrl === "string" ? entry.bdoImageUrl : null,
            accountName: typeof entry.bdoAccountName === "string" ? entry.bdoAccountName : null,
            accountNumber: typeof entry.bdoAccountNumber === "string" ? entry.bdoAccountNumber : null,
        };
    }
    return {
        imageUrl: typeof entry.bpiImageUrl === "string" ? entry.bpiImageUrl : null,
        accountName: typeof entry.bpiAccountName === "string" ? entry.bpiAccountName : null,
        accountNumber: typeof entry.bpiAccountNumber === "string" ? entry.bpiAccountNumber : null,
    };
}

function loadSessionData(): { context: BookingContext; formData: GuestFormData; guests: AdditionalGuest[] } | null {
    try {
        const ctxRaw = sessionStorage.getItem("bookingContext");
        const formRaw = sessionStorage.getItem("guestFormData");
        const guestsRaw = sessionStorage.getItem("guestFormGuests");
        if (!ctxRaw || !formRaw) return null;

        const context = JSON.parse(ctxRaw) as BookingContext;
        const formData = JSON.parse(formRaw) as GuestFormData;
        const guests: AdditionalGuest[] = guestsRaw ? JSON.parse(guestsRaw) : [];

        if (!context.selectedActivityId || !context.bookingDate || !context.bookingTime) return null;
        if (!formData.repName || !formData.repEmail) return null;

        return { context, formData, guests };
    } catch {
        return null;
    }
}

export function CompleteForm() {
    const [sessionData, setSessionData] = useState<ReturnType<typeof loadSessionData>>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submittedBookingId, setSubmittedBookingId] = useState<string | null>(null);
    const [operatorPayment, setOperatorPayment] = useState<OperatorPaymentInfo>({ imageUrl: null, accountName: null, accountNumber: null });
    const [operatorMeta, setOperatorMeta] = useState<OperatorMeta>({ companyName: null, phoneNumber: null });
    const [pricingInfo, setPricingInfo] = useState<PricingInfo>({ totalAmount: null });

    useEffect(() => {
        setSessionData(loadSessionData());
        setLoading(false);
    }, []);

    const handlePaymentMethodChange = (nextMethod: PaymentMethod) => {
        setSessionData((prev) => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                context: {
                    ...prev.context,
                    paymentMethod: nextMethod,
                },
            };
            // Keep the data source-of-truth in sync so refresh/back navigation stays consistent.
            sessionStorage.setItem("bookingContext", JSON.stringify(updated.context));
            return updated;
        });
    };

    useEffect(() => {
        if (!sessionData?.context.tourOperatorUid) {
            setOperatorPayment({ imageUrl: null, accountName: null, accountNumber: null });
            setOperatorMeta({ companyName: null, phoneNumber: null });
            return;
        }
        let cancelled = false;

        (async () => {
            try {
                const snap = await getDoc(doc(firestore, "users", sessionData.context.tourOperatorUid!));
                if (!snap.exists() || cancelled) return;
                const userData = snap.data() as UnknownRecord;
                const info = getOperatorPaymentInfoFromUserDoc(userData, sessionData.context.paymentMethod);
                if (!cancelled) {
                    setOperatorPayment(info);
                    setOperatorMeta({
                        companyName: typeof userData.companyName === "string" ? userData.companyName : null,
                        phoneNumber: typeof userData.phoneNumber === "string" ? userData.phoneNumber : null,
                    });
                }
            } catch {
                if (!cancelled) {
                    setOperatorPayment({ imageUrl: null, accountName: null, accountNumber: null });
                    setOperatorMeta({ companyName: null, phoneNumber: null });
                }
            }
        })();

        return () => { cancelled = true; };
    }, [sessionData?.context.tourOperatorUid, sessionData?.context.paymentMethod]);

    useEffect(() => {
        if (!sessionData?.context.selectedActivityId || !sessionData?.context.guestCount) {
            setPricingInfo({ totalAmount: null });
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const activitySnap = await getDoc(doc(firestore, "activities", sessionData.context.selectedActivityId));
                if (!activitySnap.exists() || cancelled) return;
                const activity = activitySnap.data() as Record<string, unknown>;
                const pricePerGuest = typeof activity.pricePerGuest === "number" ? activity.pricePerGuest : null;
                if (!pricePerGuest) {
                    setPricingInfo({ totalAmount: null });
                    return;
                }

                let discountPercent: number | null = null;
                if (sessionData.context.promoCode) {
                    const codeUpper = sessionData.context.promoCode.trim().toUpperCase();
                    const q = query(collection(firestore, "voucherCodes"), where("code", "==", codeUpper));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const voucher = snap.docs[0].data() as Record<string, unknown>;
                        discountPercent = typeof voucher.discount === "number" ? voucher.discount : null;
                    }
                }

                const baseSubtotal = pricePerGuest * sessionData.context.guestCount;
                const discountAmount = discountPercent ? (baseSubtotal * (discountPercent / 100)) : 0;
                const subtotal = baseSubtotal - discountAmount;
                const total = subtotal + SERVICE_CHARGE + MATA_SERVICE_FEE + LGU_SERVICE_FEE;

                if (!cancelled) setPricingInfo({ totalAmount: total });
            } catch {
                if (!cancelled) setPricingInfo({ totalAmount: null });
            }
        })();

        return () => { cancelled = true; };
    }, [sessionData?.context.selectedActivityId, sessionData?.context.guestCount, sessionData?.context.promoCode]);

    const summary = useMemo(() => {
        if (!sessionData) return null;
        return {
            activityId: sessionData.context.selectedActivityId,
            guestTotal: sessionData.context.guestCount,
            paymentMethod: sessionData.context.paymentMethod,
        };
    }, [sessionData]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setError(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        const allowedMimes = ["image/jpeg", "image/png"];
        if (!allowedMimes.includes(file.type)) {
            setSelectedFile(null);
            setError("Please upload a JPG or PNG image file only.");
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
        if (!sessionData) {
            setError("Booking details are missing. Please go back and try again.");
            return;
        }

        if (!selectedFile) {
            setError("Please upload your payment screenshot before submitting.");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const { context, formData, guests } = sessionData;
            const receiptDataUrl = await readFileAsDataUrl(selectedFile);

            const result = await createBooking({
                tourDate: context.bookingDate,
                timeSlot: parseTimeSlot(context.bookingTime),
                activityId: context.selectedActivityId,
                tourOperatorUid: context.tourOperatorUid || formData.tourOperator || undefined,
                representative: {
                    fullName: formData.repName.trim(),
                    email: formData.repEmail.trim(),
                    phoneNumber: formData.repPhone.trim(),
                    age: parseInt(formData.repAge, 10),
                    gender: formData.repGender as "Male" | "Female" | "Prefer not to say",
                    nationality: formData.repNationality,
                },
                guests: guests.map((g) => ({
                    fullName: g.name.trim(),
                    age: parseInt(g.age, 10),
                    gender: g.gender as "Male" | "Female" | "Prefer not to say",
                    nationality: g.nationality,
                })),
                promoCode: context.promoCode || undefined,
                paymentMethod: context.paymentMethod,
                receiptDataUrl,
                idempotencyKey: formData.idempotencyKey,
            });

            setSelectedFile(null);
            setSubmittedBookingId(result.bookingId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit your payment.");
        } finally {
            setSubmitting(false);
        }
    };
    //this will delete the guest session data from session storage after tapping the "Submit Payment"
    if (submittedBookingId) {
        const clearGuestSession = () => {
            sessionStorage.removeItem("guestFormData");
            sessionStorage.removeItem("guestFormGuests");
            sessionStorage.removeItem("bookingContext");
        };

        return (
            <div className="relative min-h-screen overflow-hidden bg-[#F9FAFB] font-poppins">
                <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#74C00F]/15 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute bottom-20 -left-24 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" aria-hidden />

                <main className="relative mx-auto max-w-lg px-4 pb-24 pt-12 md:pb-32 md:pt-16">
                    <div className="text-center">
                        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#74C00F] to-[#45A80A] shadow-xl shadow-[#74C00F]/30 ring-[10px] ring-white">
                            <CheckCircle2 className="h-14 w-14 text-white" strokeWidth={2.25} />
                        </div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#74C00F]">Reservation Received!</p>
                        <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Payment submitted</h1>
                        <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-gray-600">
                            Your booking is reserved while we verify your payment. An operator will review your proof and confirm — usually within{" "}
                            <span className="font-semibold text-gray-800">24 hours</span>. Check your email for updates.
                        </p>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Booking reference</p>
                            <p className="break-all font-mono text-lg font-bold text-gray-900">{submittedBookingId}</p>
                            <button
                                type="button"
                                className="mt-4 text-sm font-semibold text-[#74C00F] hover:underline"
                                onClick={() => {
                                    void navigator.clipboard.writeText(submittedBookingId);
                                }}
                            >
                                Copy reference
                            </button>
                        </div>

                        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/90 px-5 py-4 text-center text-sm leading-relaxed text-emerald-900">
                            Please keep this booking ID handy, as our team may ask for it while your payment is under review. We’ve also sent a confirmation email with your reservation details and instructions on how to contact us.
                            {(operatorMeta.companyName || operatorMeta.phoneNumber) && (
                                <div className="mt-3 border-t border-emerald-200/70 pt-3 text-emerald-950">
                                    {operatorMeta.companyName && (
                                        <p>
                                            <span className="font-bold">Operator:</span>{" "}
                                            <span className="font-semibold">{operatorMeta.companyName}</span>
                                        </p>
                                    )}
                                    {operatorMeta.phoneNumber && (
                                        <p className="mt-1">
                                            <span className="font-bold">Contact:</span>{" "}
                                            <span className="font-semibold">{operatorMeta.phoneNumber}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <Link
                            href="/"
                            onClick={clearGuestSession}
                            className="mt-10 inline-flex w-full items-center justify-center rounded-xl bg-[#74C00F] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#74C00F]/25 transition hover:bg-[#62a30d] md:w-auto md:min-w-[240px]"
                        >
                            Return to home
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] font-poppins px-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#74C00F]" />
                    <p className="text-sm font-medium text-gray-500">Loading your booking…</p>
                </div>
            </div>
        );
    }

    if (!sessionData) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] font-poppins px-4 py-16 md:py-24">
                <div className="mx-auto max-w-md rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">No booking details found</h1>
                    <p className="mt-3 text-gray-600 leading-relaxed">
                        Start from guest booking and continue to payment — your details are saved in this browser session.
                    </p>
                    <Link
                        href="/booking"
                        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#74C00F] px-6 py-3.5 text-base font-bold text-white shadow-md shadow-[#74C00F]/20 transition hover:bg-[#62a30d]"
                    >
                        Back to Booking
                    </Link>
                </div>
            </div>
        );
    }

    const { context, formData } = sessionData;

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-poppins pb-20">
            <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
                <header className="mb-10 max-w-2xl">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#74C00F]">Checkout</p>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Complete your payment</h1>
                    <p className="mt-3 text-base text-gray-600">
                        Follow the instructions below, then upload a screenshot so our team can verify your payment.
                    </p>
                </header>

                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                    <div className="order-2 flex flex-col gap-8 lg:order-1 lg:col-span-7">
                        {/*
                        <TripDetails
                          bookingDate={context.bookingDate}
                          bookingTime={context.bookingTime}
                          guestTotal={summary?.guestTotal}
                          paymentMethod={summary?.paymentMethod}
                          onPaymentMethodChange={handlePaymentMethodChange}
                        />
                        */}

                        <PaymentInstructions
                            paymentMethod={context.paymentMethod}
                            paymentImageUrl={operatorPayment.imageUrl}
                            accountName={operatorPayment.accountName}
                            accountNumber={operatorPayment.accountNumber}
                            onPaymentMethodChange={handlePaymentMethodChange}
                            totalAmount={pricingInfo.totalAmount}
                        />

                        <UploadPayment
                            draft={{
                                bookingDate: context.bookingDate,
                                bookingTime: context.bookingTime,
                                selectedTimeSlotId: context.selectedTimeSlotId,
                                selectedActivityId: context.selectedActivityId,
                                guestCount: context.guestCount,
                                promoCode: context.promoCode,
                            }}
                            selectedFile={selectedFile}
                            error={error}
                            submitting={submitting}
                            onFileChange={handleFileChange}
                            onSubmitPayment={handleSubmitPayment}
                        />
                    </div>

                    <div className="order-1 min-w-0 w-full lg:order-2 lg:col-span-5 lg:flex lg:justify-center lg:self-start lg:sticky lg:top-28 lg:z-10 lg:h-fit">
                        <BookingSummary
                            activityId={summary?.activityId}
                            bookingDate={context.bookingDate}
                            bookingTime={context.bookingTime}
                            guestTotal={summary?.guestTotal}
                            representativeName={formData.repName}
                            representativeEmail={formData.repEmail}
                            representativePhone={formData.repPhone}
                            appliedPromo={context.promoCode}
                            paymentMethod={context.paymentMethod}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
