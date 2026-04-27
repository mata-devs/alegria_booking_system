"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/app/lib/firebase";
import { ChevronDown, X, Users } from "lucide-react";
import type { PaymentMethod } from "@/app/lib/booking-service";

// ─── Pricing constants ────────────────────────────────────────────────────────
// TODO: Move to a global config or fetch from Firestore `activities` collection
const SERVICE_CHARGE = 500;

const MAX_GUESTS = 30;
const PAYMENT_METHODS: PaymentMethod[] = ["Gcash / Maya", "BDO", "BPI"];

const peso = (n: number) =>
    `₱ ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type AppliedPromo = {
    id: string;
    code: string;
    discount: number;
    operatorUid?: string;
} & Record<string, unknown>;

interface BookingSidebarProps {
    bookingDate: string;
    selectedActivityId: string;
    activityName?: string;
    guestCount?: number;
    showPaymentMethods?: boolean;
    onGuestCountChange?: (count: number) => void;
    paymentMethod?: PaymentMethod;
    onPaymentMethodChange?: (method: PaymentMethod) => void;
    onContinue?: () => void;
    initialPromoCode?: string;
    onPromoApplied?: (promo: { code: string; discount: number; operatorUid?: string }) => void;
    onPromoRemoved?: () => void;
    priceOverride?: number;
    minGuests?: number;
    maxGuests?: number;
}

export function BookingSidebar({
    bookingDate,
    selectedActivityId,
    activityName,
    guestCount: controlledGuestCount,
    showPaymentMethods = false,
    onGuestCountChange,
    paymentMethod,
    onPaymentMethodChange,
    onContinue,
    initialPromoCode,
    onPromoApplied,
    onPromoRemoved,
    priceOverride,
    minGuests,
    maxGuests,
}: BookingSidebarProps) {
    const effectiveMin = Math.max(1, minGuests ?? 1);
    const effectiveMax = Math.min(maxGuests ?? MAX_GUESTS, MAX_GUESTS);
    const presetGuests = Array.from(
        { length: Math.min(5, effectiveMax - effectiveMin + 1) },
        (_, i) => effectiveMin + i,
    );

    const [pricePerGuest, setPricePerGuest] = useState<number | null>(priceOverride ?? null);
    const [priceLoading, setPriceLoading] = useState(priceOverride === undefined);

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(paymentMethod ?? "Gcash / Maya");

    useEffect(() => {
        if (!paymentMethod) return;
        if (PAYMENT_METHODS.includes(paymentMethod) && paymentMethod !== selectedPaymentMethod) {
            setSelectedPaymentMethod(paymentMethod);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentMethod]);

    const [promoInput, setPromoInput] = useState(initialPromoCode || "");
    const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState("");

    useEffect(() => {
        if (onPaymentMethodChange) onPaymentMethodChange(selectedPaymentMethod);
    }, [selectedPaymentMethod, onPaymentMethodChange]);

    useEffect(() => {
        if (priceOverride !== undefined) return;
        if (!selectedActivityId) return;
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDoc(doc(firestore, "activities", selectedActivityId));
                if (!cancelled && snap.exists()) {
                    setPricePerGuest(snap.data().pricePerGuest ?? null);
                }
            } catch {
                // price stays null
            } finally {
                if (!cancelled) setPriceLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedActivityId, priceOverride]);

    const [internalGuestCount, setInternalGuestCount] = useState(effectiveMin);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [customInput, setCustomInput] = useState("");
    const [customError, setCustomError] = useState("");
    const [customWarning, setCustomWarning] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);

    const guestCount = controlledGuestCount !== undefined
        ? Math.max(1, controlledGuestCount)
        : internalGuestCount;

    const updateGuestCount = useCallback((nextCount: number) => {
        const n = Math.min(effectiveMax, Math.max(effectiveMin, nextCount));
        if (controlledGuestCount === undefined) setInternalGuestCount(n);
        onGuestCountChange?.(n);
    }, [controlledGuestCount, onGuestCountChange, effectiveMin, effectiveMax]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (showModal) setTimeout(() => customInputRef.current?.focus(), 50);
    }, [showModal]);

    const handleGuestSelect = (value: number | "custom") => {
        setShowDropdown(false);
        if (value === "custom") {
            setCustomInput("");
            setCustomError("");
            setCustomWarning("");
            setShowModal(true);
        } else {
            updateGuestCount(value);
        }
    };

    const handleCustomConfirm = () => {
        const parsed = parseInt(customInput.trim(), 10);
        if (!customInput.trim() || isNaN(parsed)) { setCustomError("Please enter a valid number."); return; }
        if (parsed < 1) { setCustomError("Minimum is 1 guest."); return; }
        if (parsed > MAX_GUESTS) {
            setCustomWarning(`${parsed} guests exceeds ${MAX_GUESTS}. Proceed?`);
            if (customWarning) { updateGuestCount(parsed); setShowModal(false); setCustomWarning(""); }
            return;
        }
        setCustomError(""); setCustomWarning("");
        updateGuestCount(parsed);
        setShowModal(false);
    };

    const handleApplyPromo = async () => {
        if (!promoInput.trim()) { setPromoError("Please enter a promo code."); return; }
        setPromoLoading(true);
        setPromoError("");
        try {
            const codeUpper = promoInput.trim().toUpperCase();
            const snap = await getDocs(query(collection(firestore, "voucherCodes"), where("code", "==", codeUpper)));
            if (snap.empty) throw new Error("Invalid promo code. Please check and try again.");

            const voucherDoc = snap.docs[0];
            const vd = voucherDoc.data();
            if (vd.voucherStatus !== "Active") throw new Error("This promo code is no longer active.");
            if (vd.numberOfUsesAllowed !== undefined && vd.usageCount !== undefined && vd.usageCount >= vd.numberOfUsesAllowed) {
                throw new Error("This promo code has reached its usage limit.");
            }
            if (vd.expirationDate && new Date() > vd.expirationDate.toDate()) {
                throw new Error("This promo code has expired.");
            }
            if (vd.operatorUid) {
                const opSnap = await getDoc(doc(firestore, "users", vd.operatorUid));
                if (!opSnap.exists()) throw new Error("The associated operator for this voucher was not found.");
                const opData = opSnap.data();
                const active = opData.isActive === true || (typeof opData.status === "string" && opData.status.toLowerCase() === "active");
                if (!active) throw new Error("The operator associated with this voucher is currently inactive.");
            }

            setAppliedPromo({ id: voucherDoc.id, ...vd } as AppliedPromo);
            setPromoError("");
            onPromoApplied?.({ code: vd.code, discount: vd.discount, operatorUid: vd.operatorUid });
        } catch (err) {
            setPromoError(err instanceof Error ? err.message : "Failed to validate promo code.");
            setAppliedPromo(null);
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoInput("");
        setPromoError("");
        onPromoRemoved?.();
    };

    useEffect(() => {
        if (initialPromoCode && !appliedPromo && !promoLoading) handleApplyPromo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPromoCode]);

    const price = pricePerGuest ?? 0;
    const baseSubtotal = price * guestCount;
    const discountAmount = appliedPromo ? (baseSubtotal * (appliedPromo.discount / 100)) : 0;
    const subtotal = baseSubtotal - discountAmount;
    const total = subtotal + SERVICE_CHARGE;

    return (
        <>
            <div className="w-full lg:w-[380px] xl:w-[400px] shrink-0">
                <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/5 border border-gray-100">

                    {/* Activity name banner */}
                    {activityName && (
                        <div className="mb-6 rounded-2xl bg-[#f0fce0] border border-[#74C00F]/20 px-4 py-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Booking for</p>
                            <p className="text-sm font-bold text-[#74C00F] truncate">{activityName}</p>
                        </div>
                    )}

                    {/* Price per guest */}
                    <div className="mb-8 flex items-end gap-2 min-h-[44px]">
                        {priceLoading ? (
                            <div className="h-10 w-36 bg-gray-100 rounded-xl animate-pulse" />
                        ) : (
                            <>
                                <span className="text-4xl font-extrabold text-black">
                                    ₱ {(pricePerGuest ?? 0).toLocaleString("en-PH")}
                                </span>
                                <span className="text-gray-500 font-medium mb-1.5">/ person</span>
                            </>
                        )}
                    </div>

                    <div className="space-y-5">
                        {/* Date pill */}
                        <div className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                            <span className="font-semibold text-black text-sm">
                                {bookingDate
                                    ? new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                    : <span className="text-gray-300">—</span>}
                            </span>
                        </div>

                        {/* Guests dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown((p) => !p)}
                                className="w-full border border-gray-200 hover:border-[#74C00F] hover:ring-1 hover:ring-[#74C00F] rounded-2xl p-4 flex items-center justify-between transition group cursor-pointer"
                            >
                                <div className="flex flex-col items-start gap-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guests</span>
                                    <span className="font-semibold text-black">
                                        {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
                                    </span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 group-hover:text-[#74C00F] transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
                            </button>
                            {(effectiveMin > 1 || effectiveMax < MAX_GUESTS) && (
                                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                                    {effectiveMin > 1 && `Min ${effectiveMin}`}{effectiveMin > 1 && effectiveMax < MAX_GUESTS && " · "}{effectiveMax < MAX_GUESTS && `Max ${effectiveMax}`} guests
                                </p>
                            )}

                            {showDropdown && (
                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-black/10 z-30 overflow-hidden">
                                    {presetGuests.map((n) => (
                                        <button
                                            key={n}
                                            onClick={() => handleGuestSelect(n)}
                                            className={`w-full px-5 py-3 text-left text-sm font-semibold flex items-center justify-between transition ${
                                                guestCount === n ? "bg-[#f0fce0] text-[#74C00F]" : "text-black hover:bg-gray-50"
                                            }`}
                                        >
                                            <span>{n} {n === 1 ? "Guest" : "Guests"}</span>
                                            {guestCount === n && <span className="text-[#74C00F] text-xs font-black">✓</span>}
                                        </button>
                                    ))}
                                    {effectiveMax > effectiveMin + 4 && (
                                        <button
                                            onClick={() => handleGuestSelect("custom")}
                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-[#00A3A3] hover:bg-teal-50 border-t border-gray-100 flex items-center gap-2 transition"
                                        >
                                            <Users size={14} />
                                            Custom number...
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Promo Code */}
                    <div className="mt-6 border-t border-gray-100 pt-6">
                        <label className="block font-bold text-black mb-1">Promo Code</label>
                        <p className="text-xs text-gray-400 mb-3">Enter your promo code here (optional)</p>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Promo code"
                                value={promoInput}
                                onChange={(e) => { setPromoInput(e.target.value); if (promoError) setPromoError(""); }}
                                disabled={!!appliedPromo || promoLoading}
                                className={`w-full border rounded-xl pl-4 pr-24 py-3.5 outline-none transition text-black bg-[#F9FAFB] focus:bg-white ${
                                    promoError ? "border-red-400 ring-2 ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F]"
                                } ${appliedPromo ? "border-[#74C00F] bg-green-50 text-[#74C00F] font-bold" : ""}`}
                            />
                            {appliedPromo ? (
                                <button onClick={handleRemovePromo} className="absolute right-4 top-3.5 text-red-500 font-bold text-sm hover:text-red-700 transition">Remove</button>
                            ) : (
                                <button
                                    onClick={handleApplyPromo}
                                    disabled={!promoInput || promoLoading}
                                    className="absolute right-4 top-3.5 text-[#00A3A3] font-bold text-sm hover:text-teal-800 disabled:text-gray-300 transition"
                                >
                                    {promoLoading ? "Applying..." : "Apply"}
                                </button>
                            )}
                        </div>
                        {promoError && <p className="text-red-500 text-[11px] mt-2 font-semibold flex items-center gap-1"><span>⚠</span> {promoError}</p>}
                        {appliedPromo && <p className="text-[#74C00F] text-[11px] mt-2 font-semibold flex items-center gap-1"><span>✓</span> Code Applied! ({appliedPromo.discount}% off)</p>}
                    </div>

                    {/* Pricing breakdown */}
                    <div className="mt-8 space-y-4">
                        <div className="flex justify-between text-gray-500 font-medium text-sm">
                            <span>{priceLoading ? "Loading..." : `₱${(pricePerGuest ?? 0).toLocaleString("en-PH")} × ${guestCount} ${guestCount === 1 ? "person" : "persons"}`}</span>
                            <span className="text-black">{priceLoading ? "—" : peso(baseSubtotal)}</span>
                        </div>
                        {appliedPromo && (
                            <div className="flex justify-between text-[#74C00F] font-medium text-sm">
                                <span>Discount ({appliedPromo.discount}%)</span>
                                <span>-{peso(discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-500 font-medium text-sm">
                            <span>Service Charge</span>
                            <span className="text-black">{peso(SERVICE_CHARGE)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    {showPaymentMethods && (
                        <div className="mt-6 border-t border-gray-100 pt-6">
                            <label className="block font-bold text-black mb-3">Select Payment Method</label>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((method) => (
                                    <button
                                        type="button"
                                        key={method}
                                        onClick={() => setSelectedPaymentMethod(method)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                                            selectedPaymentMethod === method
                                                ? "border-[#74C00F] bg-[#f0fce0] ring-1 ring-[#74C00F]"
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === method ? "border-[#74C00F]" : "border-gray-300"}`}>
                                                {selectedPaymentMethod === method && <div className="w-2.5 h-2.5 rounded-full bg-[#74C00F]" />}
                                            </div>
                                            <span className={`font-semibold ${selectedPaymentMethod === method ? "text-black" : "text-gray-600"}`}>
                                                {method === "Gcash / Maya" ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Image src="/gcashIcon.png" alt="GCash" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                                                            <Image src="/mayaIcon.png" alt="Maya" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                                                        </span>
                                                        <span>{method}</span>
                                                    </span>
                                                ) : method === "BDO" ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <Image src="/BDOIcon.png" alt="BDO" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                                                        <span>{method}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2">
                                                        <Image src="/BPIIcon.png" alt="BPI" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                                                        <span>{method}</span>
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    <div className="mt-6 pt-6 border-t-[1.5px] border-dashed border-gray-200">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-500 font-bold">Total</span>
                            <span className="text-3xl font-black text-black tracking-tight">
                                {priceLoading ? "—" : peso(total)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => { if (showPaymentMethods) onContinue?.(); }}
                        disabled={!bookingDate}
                        className="w-full mt-8 bg-[#74C00F] text-white py-4 rounded-full font-bold text-lg hover:bg-[#62a30d] transition shadow-xl shadow-[#74C00F]/30 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {showPaymentMethods ? "Continue to Payment" : "Reserve Now"}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">You won&#39;t be charged yet</p>
                </div>
            </div>

            {/* Custom guest modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-black">Custom Guest Count</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black transition p-1 rounded-full hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Enter the number of guests (1 – {MAX_GUESTS})</p>
                        <input
                            ref={customInputRef}
                            type="number"
                            min={1}
                            value={customInput}
                            onChange={(e) => { setCustomInput(e.target.value); setCustomError(""); setCustomWarning(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleCustomConfirm()}
                            placeholder="e.g. 12"
                            className={`w-full border rounded-xl px-4 py-3.5 outline-none text-black text-xl font-bold tracking-wide transition ${
                                customError ? "border-red-400 ring-2 ring-red-100" : customWarning ? "border-amber-400 ring-2 ring-amber-100" : "border-gray-300 focus:border-[#74C00F] focus:ring-2 focus:ring-[#74C00F]/20"
                            }`}
                        />
                        {customError && <p className="text-red-500 text-xs mt-2 font-semibold flex items-center gap-1"><span>⚠</span> {customError}</p>}
                        {customWarning && !customError && (
                            <p className="text-amber-600 text-xs mt-2 font-semibold">{customWarning}</p>
                        )}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-full font-bold text-black hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleCustomConfirm} className="flex-1 py-3 rounded-full font-bold text-white bg-[#74C00F] hover:bg-[#62a30d] transition shadow-lg shadow-[#74C00F]/30">
                                {customWarning ? "Confirm anyway" : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
