"use client";

import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/app/lib/firebase";
import type { PaymentMethod } from "@/app/lib/booking-service";

import {
    subscribePlatformPricing,
    computeBookingTotals,
    DEFAULT_SERVICE_CHARGE_PER_BOOKING,
} from '@/app/lib/platform-pricing';
import {
    formatVoucherDiscountDetail,
    parseVoucherDiscount,
    type VoucherDiscount,
} from '@/app/lib/voucher-discount';
import {
    resolveTier,
    computeTierBase,
    type PricingMode,
    type PricingTier,
} from '@/app/lib/pricing-tiers';
import { ItemDetailModal } from '@/app/(guest)/booking/_components/ItemDetailModal';

const peso = (n: number) =>
    `₱ ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface BookingSummaryProps {
    activityId?: string;
    activityName?: string;
    bookingDate?: string;
    guestTotal?: number;
    adultCount?: number;
    childCount?: number;
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
    adultCount,
    childCount,
    paymentMethod,
    representativeName,
    representativeEmail,
    representativePhone,
    appliedPromo,
    sourceType = "activity",
}: BookingSummaryProps) {
    const [showItemModal, setShowItemModal] = useState(false);
    const [pricePerGuest, setPricePerGuest] = useState<number | null>(null);
    const [pricingMode, setPricingMode] = useState<PricingMode>('standard');
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
    const [appliedDiscount, setAppliedDiscount] = useState<VoucherDiscount | null>(null);
    const [serviceChargePerBooking, setServiceChargePerBooking] = useState<number | null>(null);

    useEffect(() => {
        const unsub = subscribePlatformPricing((p) => setServiceChargePerBooking(p.serviceChargePerBooking));
        return unsub;
    }, []);

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
                if (!cancelled) {
                    setPricePerGuest(typeof data[priceField] === "number" ? data[priceField] as number : null);
                    setPricingMode(data.pricingMode === "adultChild" ? "adultChild" : "standard");
                    setPricingTiers(Array.isArray(data.pricingTiers) ? (data.pricingTiers as PricingTier[]) : []);
                }
            } catch {
                if (!cancelled) setPricePerGuest(null);
            }
        })();
        return () => { cancelled = true; };
    }, [activityId, sourceType]);

    useEffect(() => {
        if (!appliedPromo) { setAppliedDiscount(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const codeUpper = appliedPromo.trim().toUpperCase();
                const snap = await getDocs(query(collection(firestore, "voucherCodes"), where("code", "==", codeUpper)));
                if (cancelled || snap.empty) return;
                const voucher = snap.docs[0].data() as Record<string, unknown>;
                const parsed = parseVoucherDiscount(voucher);
                if (!cancelled) {
                    setAppliedDiscount(parsed.discountValue > 0 ? parsed : null);
                }
            } catch {
                if (!cancelled) setAppliedDiscount(null);
            }
        })();
        return () => { cancelled = true; };
    }, [appliedPromo]);

    const pricing = useMemo(() => {
        const guests = typeof guestTotal === "number" && guestTotal > 0 ? guestTotal : null;
        if (!guests || serviceChargePerBooking === null) return null;

        const hasTiers = pricingTiers.length > 0;
        const adults = typeof adultCount === "number" ? adultCount : guests;
        const children = typeof childCount === "number" ? childCount : 0;
        const activeTier = hasTiers ? resolveTier(pricingTiers, guests) : null;

        if (!hasTiers && !pricePerGuest) return null;

        const baseAmount = hasTiers
            ? computeTierBase(pricingMode, activeTier, adults, children)
            : (pricePerGuest ?? 0) * guests;
        const charge = serviceChargePerBooking ?? DEFAULT_SERVICE_CHARGE_PER_BOOKING;
        const totals = computeBookingTotals(baseAmount, charge, appliedDiscount);

        return {
            guests,
            adults,
            children,
            hasTiers,
            pricingMode,
            activeTier,
            price: pricePerGuest ?? 0,
            baseAmount,
            discountAmount: totals.discountAmount,
            appliedDiscount,
            serviceCharge: totals.serviceCharge,
            total: totals.total,
        };
    }, [guestTotal, adultCount, childCount, pricePerGuest, pricingMode, pricingTiers, appliedDiscount, serviceChargePerBooking]);

    return (
        <aside className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8 lg:max-w-none">
            <h2 className="text-center text-lg font-extrabold text-gray-900">Booking Summary</h2>

            {activityName && (
                <button
                    type="button"
                    onClick={() => setShowItemModal(true)}
                    className="mt-4 w-full rounded-2xl bg-[#f0fce0] border border-[#74C00F]/20 px-4 py-3 text-left transition hover:bg-[#e6fad0] hover:border-[#74C00F]/40 group"
                >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        {sourceType === 'tourPackage' ? 'Tour Package' : 'Activity'}
                    </p>
                    <p className="text-sm font-bold text-[#74C00F] truncate group-hover:underline">{activityName}</p>
                    <p className="text-[10px] text-[#74C00F]/60 mt-0.5">Tap to view details</p>
                </button>
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
                        {pricing?.hasTiers && pricing.activeTier && (
                            <span className="inline-flex items-center gap-1.5 bg-[#f0fce0] text-[#5a9608] text-[11px] font-bold px-3 py-1 rounded-full">
                                ★ {pricing.activeTier.minPax} to {pricing.activeTier.maxPax} pax bracket
                            </span>
                        )}
                        {pricing?.hasTiers && pricing.pricingMode === 'adultChild' && pricing.activeTier ? (
                            <>
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-semibold text-gray-900">
                                        ₱{(pricing.activeTier.priceAdult ?? 0).toLocaleString("en-PH")} x {pricing.adults} {pricing.adults === 1 ? "adult" : "adults"}
                                    </span>
                                    <span className="font-mono text-sm font-bold text-gray-900">
                                        {peso((pricing.activeTier.priceAdult ?? 0) * pricing.adults)}
                                    </span>
                                </div>
                                {pricing.children > 0 && (
                                    <div className="flex items-baseline justify-between gap-4">
                                        <span className="font-semibold text-gray-900">
                                            ₱{(pricing.activeTier.priceChild ?? 0).toLocaleString("en-PH")} x {pricing.children} {pricing.children === 1 ? "child" : "children"}
                                        </span>
                                        <span className="font-mono text-sm font-bold text-gray-900">
                                            {peso((pricing.activeTier.priceChild ?? 0) * pricing.children)}
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-baseline justify-between gap-4">
                                <span className="font-semibold text-gray-900">
                                    {pricing
                                        ? `₱${(pricing.hasTiers && pricing.activeTier ? (pricing.activeTier.price ?? 0) : pricing.price).toLocaleString("en-PH")} x ${pricing.guests}`
                                        : "—"}
                                </span>
                                <span className="font-mono text-sm font-bold text-gray-900">
                                    {pricing ? peso(pricing.baseAmount) : "—"}
                                </span>
                            </div>
                        )}
                        <div className="flex items-baseline justify-between gap-4">
                            <span className="font-semibold text-gray-900">Convenience fee</span>
                            <span className="font-mono text-sm font-bold text-gray-900">
                                {pricing ? peso(pricing.serviceCharge) : "—"}
                            </span>
                        </div>
                        {pricing?.appliedDiscount && pricing.discountAmount > 0 ? (
                            <div className="flex items-baseline justify-between gap-4">
                                <span className="font-semibold text-[#74C00F]">
                                    Discount ({formatVoucherDiscountDetail(pricing.appliedDiscount)})
                                </span>
                                <span className="font-mono text-sm font-bold text-[#74C00F]">-{peso(pricing.discountAmount)}</span>
                            </div>
                        ) : null}
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

            {showItemModal && activityId && (
                <ItemDetailModal
                    itemId={activityId}
                    sourceType={sourceType}
                    onClose={() => setShowItemModal(false)}
                />
            )}
        </aside>
    );
}
