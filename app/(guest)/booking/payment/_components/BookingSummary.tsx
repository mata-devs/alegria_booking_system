"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/app/lib/firebase";
import type { PaymentMethod } from "@/app/lib/booking-service";

// ─── Pricing constants ─────────────────────────────────────────────────────────
// TODO: Move to a global config or fetch from Firestore `activities` collection
const SERVICE_CHARGE = 500;

const peso = (n: number) =>
    `₱ ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface BookingSummaryProps {
    activityId?: string;
    activityName?: string;
    bookingDate?: string;
    guestTotal?: number;
    paymentMethod?: PaymentMethod;
    representativeName?: string;
    representativeEmail?: string;
    representativePhone?: string;
    appliedPromo?: string;
    sourceType?: "activity" | "tourPackage";
}

export function BookingSummary({
    activityId,
    activityName,
    bookingDate,
    guestTotal,
    paymentMethod,
    representativeName,
    representativeEmail,
    representativePhone,
    appliedPromo,
    sourceType = "activity",
}: BookingSummaryProps) {
    const [pricePerGuest, setPricePerGuest] = useState<number | null>(null);
    const [discountPercent, setDiscountPercent] = useState<number | null>(null);

    useEffect(() => {
        if (!activityId) { setPricePerGuest(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const isTourPackage = sourceType === "tourPackage";
                const collectionName = isTourPackage ? "tourPackages" : "activities";
                const priceField = isTourPackage ? "pricePerPerson" : "pricePerGuest";
                const snap = await getDoc(doc(firestore, collectionName, activityId));
                if (!snap.exists() || cancelled) return;
                const data = snap.data() as Record<string, unknown>;
                if (!cancelled) setPricePerGuest(typeof data[priceField] === "number" ? data[priceField] as number : null);
            } catch {
                if (!cancelled) setPricePerGuest(null);
            }
        })();
        return () => { cancelled = true; };
    }, [activityId, sourceType]);

    useEffect(() => {
        if (!appliedPromo) { setDiscountPercent(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const codeUpper = appliedPromo.trim().toUpperCase();
                const snap = await getDocs(query(collection(firestore, "voucherCodes"), where("code", "==", codeUpper)));
                if (cancelled || snap.empty) return;
                const voucher = snap.docs[0].data() as Record<string, unknown>;
                if (!cancelled) setDiscountPercent(typeof voucher.discount === "number" ? voucher.discount : null);
            } catch {
                if (!cancelled) setDiscountPercent(null);
            }
        })();
        return () => { cancelled = true; };
    }, [appliedPromo]);

    const pricing = useMemo(() => {
        const guests = typeof guestTotal === "number" && guestTotal > 0 ? guestTotal : null;
        const price = pricePerGuest;
        if (!guests || !price) return null;

        const baseSubtotal = price * guests;
        const discountAmount = discountPercent ? (baseSubtotal * (discountPercent / 100)) : 0;
        const subtotal = baseSubtotal - discountAmount;
        const total = subtotal + SERVICE_CHARGE;

        return { guests, price, baseSubtotal, discountAmount, discountPercent, subtotal, total };
    }, [guestTotal, pricePerGuest, discountPercent]);

    return (
        <aside className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8 lg:max-w-none">
            <h2 className="text-center text-lg font-extrabold text-gray-900">Booking Summary</h2>

            {activityName && (
                <div className="mt-4 rounded-2xl bg-[#f0fce0] border border-[#74C00F]/20 px-4 py-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Activity</p>
                    <p className="text-sm font-bold text-[#74C00F] truncate">{activityName}</p>
                </div>
            )}

            <div className="mt-6 space-y-5 text-sm text-gray-700">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Schedule</p>
                    <p className="mt-1 font-semibold text-gray-900">{bookingDate || "—"}</p>
                </div>

                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Guests</p>
                    <p className="mt-1 font-semibold text-gray-900">
                        {typeof guestTotal === "number" ? `${guestTotal} Guest${guestTotal === 1 ? "" : "s"}` : "—"}
                    </p>
                </div>

                {appliedPromo && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Promo Code</p>
                        <p className="mt-1 font-semibold text-gray-900">{appliedPromo}</p>
                    </div>
                )}

                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Payment Method</p>
                    <p className="mt-1 font-semibold text-gray-900">{paymentMethod || "—"}</p>
                </div>

                {(representativeName || representativeEmail || representativePhone) && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Representative</p>
                        {representativeName && <p className="mt-1 font-semibold text-gray-900">{representativeName}</p>}
                        {representativeEmail && <p className="text-xs text-gray-500">{representativeEmail}</p>}
                        {representativePhone && <p className="text-xs text-gray-500">{representativePhone}</p>}
                    </div>
                )}

                <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Price Details</p>
                    <div className="mt-3 space-y-2">
                        <div className="flex items-baseline justify-between gap-4">
                            <span className="font-semibold text-gray-900">
                                {pricing ? `₱${pricing.price.toLocaleString("en-PH")} x ${pricing.guests}` : "—"}
                            </span>
                            <span className="font-mono text-sm font-bold text-gray-900">
                                {pricing ? peso(pricing.baseSubtotal) : "—"}
                            </span>
                        </div>
                        {pricing?.discountPercent ? (
                            <div className="flex items-baseline justify-between gap-4">
                                <span className="font-semibold text-[#74C00F]">Discount ({pricing.discountPercent}%)</span>
                                <span className="font-mono text-sm font-bold text-[#74C00F]">-{peso(pricing.discountAmount)}</span>
                            </div>
                        ) : null}
                        <div className="flex items-baseline justify-between gap-4">
                            <span className="font-semibold text-gray-900">Service charge</span>
                            <span className="font-mono text-sm font-bold text-gray-900">{peso(SERVICE_CHARGE)}</span>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                        <div className="flex items-baseline justify-between gap-4">
                            <span className="text-base font-extrabold text-gray-900">Total</span>
                            <span className="font-mono text-lg font-black text-gray-900">
                                {pricing ? peso(pricing.total) : "—"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-emerald-950 text-sm leading-relaxed">
                    Your booking will be <span className="font-semibold">reserved</span> and payment{" "}
                    <span className="font-semibold">pending</span> until an operator verifies your screenshot.
                </div>
            </div>
        </aside>
    );
}
