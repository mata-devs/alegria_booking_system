import Link from "next/link";
import React from "react";
import { AlertCircle, Loader2, Upload } from "lucide-react";

interface UploadProofOfPaymentProps {
    draft: {
        bookingDate: string;
        bookingTime: string;
        selectedTimeSlotId?: string;
        selectedActivityId: string;
        guestCount: number;
        promoCode?: string;
    };
    selectedFile: File | null;
    error: string | null;
    submitting: boolean;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmitPayment: () => void;
}

export function UploadPayment({
    draft,
    selectedFile,
    error,
    submitting,
    onFileChange,
    onSubmitPayment,
}: UploadProofOfPaymentProps) {
    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-gray-900">Upload proof of payment</h2>
            <p className="mt-2 text-sm text-gray-600">PNG or JPG, up to 5MB.</p>
            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#F9FAFB] px-6 py-12 transition hover:border-[#74C00F]/50 hover:bg-white">
                <Upload className="mb-3 h-10 w-10 text-[#74C00F]" />
                <span className="text-sm font-semibold text-gray-900">Tap to choose a screenshot</span>
                <span className="mt-1 text-xs text-gray-500">Image files only</span>
                <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="sr-only"
                />
            </label>
            {selectedFile && (
                <p className="mt-4 text-center text-sm font-medium text-gray-900">
                    Selected: <span className="text-[#74C00F]">{selectedFile.name}</span>
                </p>
            )}

            {error && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                    href={{
                        pathname: "/guestbooking",
                        query: {
                            date: draft.bookingDate,
                            time: draft.bookingTime,
                            slotId: draft.selectedTimeSlotId || "",
                            activityId: draft.selectedActivityId,
                            guests: draft.guestCount.toString(),
                            ...(draft.promoCode ? { promoCode: draft.promoCode } : {}),
                        },
                    }}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 text-center text-base font-bold text-gray-800 transition hover:bg-gray-50 sm:flex-none"
                >
                    Back to form
                </Link>
                <button
                    type="button"
                    onClick={onSubmitPayment}
                    disabled={submitting}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#74C00F] px-6 py-3.5 text-base font-bold text-white shadow-md shadow-[#74C00F]/20 transition hover:bg-[#62a30d] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:min-w-[180px]"
                >
                    {submitting ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting…
                        </span>
                    ) : (
                        "Submit payment"
                    )}
                </button>
            </div>
        </section>
    );
}
