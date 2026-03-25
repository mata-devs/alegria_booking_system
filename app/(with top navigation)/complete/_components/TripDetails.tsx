"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Clock, CreditCard, Users, ChevronDown } from "lucide-react";
import type { PaymentMethod } from "@/lib/booking-service";

const PAYMENT_METHODS: PaymentMethod[] = ["Gcash / Maya", "BDO", "BPI"];

interface TripDetailsProps {
    bookingDate: string;
    bookingTime: string;
    guestTotal?: number;
    paymentMethod?: PaymentMethod;
    onPaymentMethodChange?: (method: PaymentMethod) => void;
}

export function TripDetails({
    bookingDate,
    bookingTime,
    guestTotal,
    paymentMethod,
    onPaymentMethodChange,
}: TripDetailsProps) {
    const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedPaymentMethod = useMemo<PaymentMethod>(() => {
        if (paymentMethod && PAYMENT_METHODS.includes(paymentMethod)) return paymentMethod;
        return PAYMENT_METHODS[0];
    }, [paymentMethod]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!dropdownRef.current) return;
            if (!dropdownRef.current.contains(e.target as Node)) {
                setShowPaymentDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const canEdit = Boolean(onPaymentMethodChange);

    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-gray-900">Trip details</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-[#74C00F]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</p>
                        <p className="font-semibold text-gray-900">{bookingDate}</p>
                    </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#74C00F]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</p>
                        <p className="font-semibold text-gray-900">{bookingTime}</p>
                    </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#74C00F]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Guests</p>
                        <p className="font-semibold text-gray-900">{guestTotal}</p>
                    </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-gray-100 bg-[#F9FAFB] p-4">
                    <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#74C00F]" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Method</p>
                        <div ref={dropdownRef} className="relative">
                            <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => {
                                    if (!canEdit) return;
                                    setShowPaymentDropdown((p) => !p);
                                }}
                                className={`font-semibold text-gray-900 inline-flex items-center gap-2 ${
                                    canEdit ? "cursor-pointer hover:opacity-90" : "cursor-default"
                                }`}
                            >
                                <span>{selectedPaymentMethod}</span>
                                {canEdit && (
                                    <ChevronDown
                                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                            showPaymentDropdown ? "rotate-180" : ""
                                        }`}
                                    />
                                )}
                            </button>

                            {canEdit && showPaymentDropdown && (
                                <div className="absolute left-0 mt-2 w-full min-w-[14rem] rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10 z-30 overflow-hidden">
                                    {PAYMENT_METHODS.map((method) => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => {
                                                onPaymentMethodChange?.(method);
                                                setShowPaymentDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left text-sm font-semibold flex items-center justify-between transition ${
                                                selectedPaymentMethod === method
                                                    ? "bg-[#f0fce0] text-[#74C00F]"
                                                    : "text-black hover:bg-gray-50"
                                            }`}
                                        >
                                            <span>{method}</span>
                                            {selectedPaymentMethod === method && (
                                                <span className="text-[#74C00F] text-xs font-black">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
