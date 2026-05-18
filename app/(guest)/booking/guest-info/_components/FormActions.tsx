"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface FormActionsProps {
    onGoBack: () => void;
    onSubmit: () => void;
    submitting: boolean;
    error: string | null;
}

export const FormActions = ({ onGoBack, onSubmit, submitting, error }: FormActionsProps) => {
    return (
        <div className="flex flex-col gap-4 mt-8">
            {error && (
                <div className="w-full flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-700 text-xs font-medium leading-snug">{error}</p>
                </div>
            )}

            <div className="flex flex-row items-center gap-3 sm:gap-4">
                <button
                    onClick={onGoBack}
                    disabled={submitting}
                    className="flex-1 sm:flex-none bg-white border-2 border-gray-300 text-black px-4 sm:px-12 py-3 sm:py-3.5 rounded-full font-bold hover:bg-gray-50 transition shadow-sm disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                >
                    Go Back
                </button>

                <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="flex-[2] sm:flex-none bg-[#74C00F] text-white px-4 sm:px-12 py-3 sm:py-3.5 rounded-full font-bold hover:bg-[#62a30d] transition shadow-lg shadow-[#74C00F]/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                    {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Submitting...</>
                    ) : (
                        "Continue to Payment"
                    )}
                </button>
            </div>
        </div>
    );
};
