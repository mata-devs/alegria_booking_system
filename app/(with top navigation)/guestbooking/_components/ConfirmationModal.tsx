"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

interface ConfirmationModalProps {
    bookingId: string;
}

export const ConfirmationModal = ({ bookingId }: ConfirmationModalProps) => {
    return (
        <div className="mt-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
                <p className="text-green-800 font-bold text-sm">Booking Confirmed!</p>
                <p className="text-green-700 text-xs mt-0.5">
                    Your booking ID is{" "}
                    <span className="font-bold">{bookingId}</span>.
                    You will receive an email confirmation shortly.
                </p>
            </div>
        </div>
    );
};
