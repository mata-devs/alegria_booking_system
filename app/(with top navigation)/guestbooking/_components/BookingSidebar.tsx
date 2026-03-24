"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Calendar, Clock, ChevronDown, X, Users } from "lucide-react";
import type { CalendarSlotStatus } from "@/lib/calendar-types";

// ─── Constants , should be transfered to `activities` collection (fetch, need further research as it may cause additional reads)
const SERVICE_CHARGE = 500; //should be transfered to `activities` collection
const MATA_SERVICE_FEE = 500; //should be transfered to `activities` collection
const LGU_SERVICE_FEE = 500; //should be transfered to `activities` collection
const PRESET_GUESTS = [1, 2, 3, 4, 5] as const; //dropdown
const MAX_GUESTS = 30; // hard cap — matches activity timeslot AM or PM for a total of 60
// ─── Helpers ──────────────────────────────────────────────────────────────────
const peso = (n: number) =>
    `₱ ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Props ────────────────────────────────────────────────────────────────────
interface BookingSidebarProps {
    bookingDate: string;
    bookingTime: string;
    selectedTimeSlotId: string;
    selectedActivityId: string;
    initialGuestCount?: number;
    guestCount?: number;
    /**
     * How many slots are still available on the selected timeslot.
     * null = no timeslot selected yet → no slot-based cap is applied.
     */
    slotsAvailable: number | null;
    /** Called when the guest clicks the Date or Time pill — scrolls the calendar into view */
    onScrollToCalendar?: () => void;
    /** Live status of the selected timeslot, if known. */
    selectedSlotStatus?: CalendarSlotStatus | null;
    showPaymentMethods?: boolean;
    onGuestCountChange?: (count: number) => void;
    onPaymentMethodChange?: (method: string) => void;
    onContinue?: () => void;
    initialPromoCode?: string;
    onPromoApplied?: (promo: { code: string; discount: number; operatorUid?: string }) => void;
}

// ─── BookingSidebar ───────────────────────────────────────────────────────────
/**
 * Sticky right-column sidebar for the Booking page.
 *
 * - Fetches `pricePerGuest` from Firestore `activities/{activityId}` on mount
 * - Guest picker: preset 1-5 options + "Custom" which opens a validated modal
 * - Live pricing breakdown: (pricePerGuest × guests) + service charge = total
 * - Reserve Now navigates to /GuestBooking with all required URL params
 */
export function BookingSidebar({
    bookingDate,
    bookingTime,
    selectedTimeSlotId,
    selectedActivityId,
    initialGuestCount = 1,
    guestCount: controlledGuestCount,
    slotsAvailable,
    onScrollToCalendar,
    selectedSlotStatus = null,
    showPaymentMethods = false,
    onGuestCountChange,
    onPaymentMethodChange,
    onContinue,
    initialPromoCode,
    onPromoApplied,
}: BookingSidebarProps) {
    const router = useRouter();

    // ── Firestore price fetch ──────────────────────────────────────────────────
    const [pricePerGuest, setPricePerGuest] = useState<number | null>(null);
    const [priceLoading, setPriceLoading] = useState(true);

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("Gcash / Maya");

    // ── Promo Code state ──────────────────────────────────────────────────────
    const [promoInput, setPromoInput] = useState(initialPromoCode || "");
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState("");

    useEffect(() => {
        if (onPaymentMethodChange) {
            onPaymentMethodChange(selectedPaymentMethod);
        }
    }, [selectedPaymentMethod, onPaymentMethodChange]);

    useEffect(() => {
        if (!selectedActivityId) return;
        let cancelled = false;

        (async () => {
            try {
                const snap = await getDoc(doc(firestore, "activities", selectedActivityId));
                if (!cancelled && snap.exists()) {
                    setPricePerGuest(snap.data().pricePerGuest ?? null);
                }
            } catch (err) {
                console.error("[BookingSidebar] Failed to fetch activity price:", err);
            } finally {
                if (!cancelled) setPriceLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [selectedActivityId]);

    // ── Guest selection state ──────────────────────────────────────────────────
    // effectiveCap: max guests allowed for the currently selected timeslot.
    // Falls back to MAX_GUESTS when no timeslot is selected yet.
    const effectiveCap = slotsAvailable !== null ? slotsAvailable : MAX_GUESTS;
    const isSelectedSlotFull = selectedSlotStatus === "full";

    const [internalGuestCount, setInternalGuestCount] = useState(Math.max(1, initialGuestCount));
    const [showDropdown, setShowDropdown] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [customInput, setCustomInput] = useState("");
    const [customError, setCustomError] = useState("");   // blocks submit
    const [customWarning, setCustomWarning] = useState("");   // soft — allows submit
    const dropdownRef = useRef<HTMLDivElement>(null);
    const customInputRef = useRef<HTMLInputElement>(null);
    const guestCount = controlledGuestCount !== undefined
        ? Math.max(1, controlledGuestCount)
        : internalGuestCount;
    const hasInsufficientCapacity = !isSelectedSlotFull && guestCount > effectiveCap;
    const isReserveDisabled = !bookingDate || !bookingTime || isSelectedSlotFull || hasInsufficientCapacity;

    const updateGuestCount = useCallback((nextCount: number) => {
        const normalizedCount = Math.max(1, nextCount);
        if (controlledGuestCount === undefined) {
            setInternalGuestCount(normalizedCount);
        }
        onGuestCountChange?.(normalizedCount);
    }, [controlledGuestCount, onGuestCountChange]);

    useEffect(() => {
        if (controlledGuestCount === undefined) {
            setInternalGuestCount(Math.max(1, initialGuestCount));
        }
    }, [controlledGuestCount, initialGuestCount]);

    useEffect(() => {
        if (!isSelectedSlotFull) return;
        setShowDropdown(false);
        setShowModal(false);
        setCustomError("");
        setCustomWarning("");
    }, [isSelectedSlotFull]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Auto-focus the custom input when modal opens
    useEffect(() => {
        if (showModal) {
            setTimeout(() => customInputRef.current?.focus(), 50);
        }
    }, [showModal]);

    const handleGuestSelect = (value: number | "custom") => {
        if (isSelectedSlotFull) {
            setShowDropdown(false);
            return;
        }

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

        // ── Hard errors — block submit ─────────────────────────────────────────
        if (!customInput.trim() || isNaN(parsed)) {
            setCustomError("Please enter a valid number.");
            return;
        }
        if (parsed < 1) {
            setCustomError("Minimum is 1 guest.");
            return;
        }
        // Slot capacity hard block
        if (parsed > effectiveCap) {
            setCustomError(
                `Only ${effectiveCap} slot${effectiveCap === 1 ? "" : "s"} remaining on this timeslot.`
            );
            return;
        }

        // ── Soft warning — over global activity cap ────────────────────────────
        if (parsed > MAX_GUESTS) {
            setCustomWarning(
                `${parsed} guests exceeds a single slot's capacity (${MAX_GUESTS}). ` +
                `You may need to book an additional slot. Proceed?`
            );
            if (customWarning) {
                updateGuestCount(parsed);
                setShowModal(false);
                setCustomWarning("");
            }
            return;
        }

        // ── No issues ─────────────────────────────────────────────────────────
        setCustomError("");
        setCustomWarning("");
        updateGuestCount(parsed);
        setShowModal(false);
    };

    // ── Promo Code validation ─────────────────────────────────────────────────
    const handleApplyPromo = async () => {
        if (!promoInput.trim()) {
            setPromoError("Please enter a promo code.");
            return;
        }

        setPromoLoading(true);
        setPromoError("");

        try {
            const codeUpper = promoInput.trim().toUpperCase();
            const q = query(collection(firestore, "voucherCodes"), where("code", "==", codeUpper));
            const snap = await getDocs(q);

            if (snap.empty) {
                throw new Error("Invalid promo code. Please check and try again.");
            }

            const voucherDoc = snap.docs[0];
            const voucherData = voucherDoc.data();

            // 1. Check status
            if (voucherData.voucherStatus !== "Active") {
                throw new Error("This promo code is no longer active.");
            }

            // 2. Check usage count
            if (
                voucherData.numberOfUsesAllowed !== undefined &&
                voucherData.usageCount !== undefined &&
                voucherData.usageCount >= voucherData.numberOfUsesAllowed
            ) {
                throw new Error("This promo code has reached its usage limit.");
            }

            // 3. Check expiration
            if (voucherData.expirationDate) {
                const expiry = voucherData.expirationDate.toDate();
                if (new Date() > expiry) {
                    throw new Error("This promo code has expired.");
                }
            }

            // 4. Check associated operator
            if (voucherData.operatorUid) {
                const opSnap = await getDoc(doc(firestore, "users", voucherData.operatorUid));
                if (!opSnap.exists()) {
                    throw new Error("The associated operator for this voucher was not found.");
                }
                const opData = opSnap.data();
                if (!opData.isActive) {
                    throw new Error("The operator associated with this voucher is currently inactive.");
                }
                // Automatically assign it to the operator in the users collection?
                // Per instructions, we ensure it's valid/active. The backend handles the actual assignment logic during booking.
            }

            setAppliedPromo({
                id: voucherDoc.id,
                ...voucherData
            });
            setPromoError("");

            if (onPromoApplied) {
                onPromoApplied({
                    code: voucherData.code,
                    discount: voucherData.discount,
                    operatorUid: voucherData.operatorUid
                });
            }
        } catch (err: any) {
            setPromoError(err.message || "Failed to validate promo code.");
            setAppliedPromo(null);
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoInput("");
        setPromoError("");
    };

    // ── Auto-apply initial promo ──────────────────────────────────────────────
    useEffect(() => {
        if (initialPromoCode && !appliedPromo && !promoLoading) {
            handleApplyPromo();
        }
    }, [initialPromoCode]);

    // ── Pricing calculations ───────────────────────────────────────────────────
    const price = pricePerGuest ?? 0;
    const baseSubtotal = price * guestCount;
    const discountAmount = appliedPromo ? (baseSubtotal * (appliedPromo.discount / 100)) : 0;
    const subtotal = baseSubtotal - discountAmount;
    const total = subtotal + SERVICE_CHARGE + LGU_SERVICE_FEE + MATA_SERVICE_FEE;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="w-full lg:w-[380px] xl:w-[400px] shrink-0">
                <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/5 border border-gray-100">

                    {/* ── Price per guest ─────────────────────────────────── */}
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
                        {/* Date + Time — clicking either pill scrolls to the calendar */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={onScrollToCalendar}
                                className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-1 group cursor-pointer hover:border-[#74C00F] hover:ring-1 hover:ring-[#74C00F] transition text-left w-full"
                            >
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-black text-sm truncate pr-1">
                                        {bookingDate || <span className="text-gray-300">—</span>}
                                    </span>
                                    <Calendar className="w-4 h-4 text-gray-400 group-hover:text-[#74C00F] transition shrink-0" />
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={onScrollToCalendar}
                                className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-1 group cursor-pointer hover:border-[#74C00F] hover:ring-1 hover:ring-[#74C00F] transition text-left w-full"
                            >
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</span>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-black text-sm truncate pr-1">
                                        {bookingTime || <span className="text-gray-300">—</span>}
                                    </span>
                                    <Clock className="w-4 h-4 text-gray-400 group-hover:text-[#74C00F] transition shrink-0" />
                                </div>
                            </button>
                        </div>

                        {isSelectedSlotFull && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                The selected <span className="font-semibold">{bookingTime}</span> slot on <span className="font-semibold">{bookingDate}</span> is already full. Please choose another time in the calendar.
                            </div>
                        )}

                        {hasInsufficientCapacity && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                This timeslot only has <span className="font-semibold">{effectiveCap} slot{effectiveCap === 1 ? "" : "s"}</span> remaining, but your booking is currently set to <span className="font-semibold">{guestCount} guest{guestCount === 1 ? "" : "s"}</span>. Choose another slot or reduce the guest count to continue.
                            </div>
                        )}

                        {/* ── Guests dropdown ─────────────────────────────── */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => {
                                    if (isSelectedSlotFull) return;
                                    setShowDropdown((p) => !p);
                                }}
                                disabled={isSelectedSlotFull}
                                className={`w-full border rounded-2xl p-4 flex items-center justify-between transition group ${isSelectedSlotFull
                                    ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-70"
                                    : "border-gray-200 hover:border-[#74C00F] hover:ring-1 hover:ring-[#74C00F] cursor-pointer"
                                    }`}
                            >
                                <div className="flex flex-col items-start gap-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guests</span>
                                    <span className="font-semibold text-black">
                                        {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
                                    </span>
                                </div>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 group-hover:text-[#74C00F] transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                                />
                            </button>

                            {/* Dropdown menu */}
                            {showDropdown && (
                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-black/10 z-30 overflow-hidden">
                                    {PRESET_GUESTS
                                        .filter((n) => n <= effectiveCap)
                                        .map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => handleGuestSelect(n)}
                                                className={`w-full px-5 py-3 text-left text-sm font-semibold flex items-center justify-between transition
                                                ${guestCount === n
                                                        ? "bg-[#f0fce0] text-[#74C00F]"
                                                        : "text-black hover:bg-gray-50"
                                                    }`}
                                            >
                                                <span>{n} {n === 1 ? "Guest" : "Guests"}</span>
                                                {guestCount === n && (
                                                    <span className="text-[#74C00F] text-xs font-black">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    {/* Custom option — disabled when no slots remain beyond the preset list */}
                                    {effectiveCap > (PRESET_GUESTS[PRESET_GUESTS.length - 1] ?? 0) ? (
                                        <button
                                            onClick={() => handleGuestSelect("custom")}
                                            className="w-full px-5 py-3 text-left text-sm font-semibold text-[#00A3A3] hover:bg-teal-50 border-t border-gray-100 flex items-center gap-2 transition"
                                        >
                                            <Users size={14} />
                                            Custom number...
                                        </button>
                                    ) : (
                                        <div className="w-full px-5 py-3 text-left text-sm font-semibold text-gray-300 border-t border-gray-100 flex items-center gap-2 cursor-not-allowed select-none">
                                            <Users size={14} />
                                            <span>Custom number</span>
                                            <span className="ml-auto text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                                                {effectiveCap} max
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Promo Code ──────────────────────────────────────── */}
                    <div className="mt-6 border-t border-gray-100 pt-6">
                        <label className="block font-bold text-black mb-1">Promo Code</label>
                        <p className="text-xs text-gray-400 mb-3">Enter your promo code here (optional)</p>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Promo code"
                                value={promoInput}
                                onChange={(e) => {
                                    setPromoInput(e.target.value);
                                    if (promoError) setPromoError("");
                                }}
                                disabled={!!appliedPromo || promoLoading}
                                className={`w-full border rounded-xl pl-4 pr-24 py-3.5 outline-none transition text-black bg-[#F9FAFB] focus:bg-white
                                    ${promoError ? "border-red-400 ring-2 ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F]"}
                                    ${appliedPromo ? "border-[#74C00F] bg-green-50 text-[#74C00F] font-bold" : ""}
                                `}
                            />
                            {appliedPromo ? (
                                <button
                                    onClick={handleRemovePromo}
                                    className="absolute right-4 top-3.5 text-red-500 font-bold text-sm hover:text-red-700 transition"
                                >
                                    Remove
                                </button>
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
                        {promoError && (
                            <p className="text-red-500 text-[11px] mt-2 font-semibold flex items-center gap-1">
                                <span>⚠</span> {promoError}
                            </p>
                        )}
                        {appliedPromo && (
                            <p className="text-[#74C00F] text-[11px] mt-2 font-semibold flex items-center gap-1">
                                <span>✓</span> Code Applied! ({appliedPromo.discount}% off)
                            </p>
                        )}
                    </div>

                    {/* ── Pricing breakdown ───────────────────────────────── */}
                    <div className="mt-8 space-y-4">
                        <div className="flex justify-between text-gray-500 font-medium text-sm">
                            <span>
                                {priceLoading
                                    ? "Loading..."
                                    : `₱${(pricePerGuest ?? 0).toLocaleString("en-PH")} × ${guestCount} ${guestCount === 1 ? "person" : "persons"}`
                                }
                            </span>
                            <span className="text-black">
                                {priceLoading ? "—" : peso(baseSubtotal)}
                            </span>
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
                        <div className="flex justify-between text-gray-500 font-medium text-sm">
                            <span>LGU</span>
                            <span className="text-black">{peso(LGU_SERVICE_FEE)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 font-medium text-sm">
                            <span>MATA</span>
                            <span className="text-black">{peso(MATA_SERVICE_FEE)}</span>
                        </div>
                    </div>

                    {/* ── Payment Method ──────────────────────────────────── */}
                    {showPaymentMethods && (
                        <div className="mt-6 border-t border-gray-100 pt-6">
                            <label className="block font-bold text-black mb-3">Select Payment Method</label>
                            <div className="space-y-3">
                                {["Gcash / Maya", "BDO", "BPI"].map((method) => (
                                    <button
                                        type="button"
                                        key={method}
                                        onClick={() => setSelectedPaymentMethod(method)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition
                                        ${selectedPaymentMethod === method
                                                ? "border-[#74C00F] bg-[#f0fce0] ring-1 ring-[#74C00F]"
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                ${selectedPaymentMethod === method ? "border-[#74C00F]" : "border-gray-300"}`}>
                                                {selectedPaymentMethod === method && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#74C00F]" />
                                                )}
                                            </div>
                                            <span className={`font-semibold ${selectedPaymentMethod === method ? "text-black" : "text-gray-600"}`}>
                                                {method}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Total ───────────────────────────────────────────── */}
                    <div className="mt-6 pt-6 border-t-[1.5px] border-dashed border-gray-200">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-500 font-bold">Total</span>
                            <span className="text-3xl font-black text-black tracking-tight">
                                {priceLoading ? "—" : peso(total)}
                            </span>
                        </div>
                    </div>

                    {/* ── Reserve Now ─────────────────────────────────────── */}
                    <button
                        onClick={() => {
                            if (isReserveDisabled) return;
                            if (showPaymentMethods) {
                                onContinue?.();
                                return;
                            }
                            router.push(
                                `/guestbooking?date=${encodeURIComponent(bookingDate)}` +
                                `&time=${encodeURIComponent(bookingTime)}` +
                                `&slotId=${encodeURIComponent(selectedTimeSlotId)}` +
                                `&activityId=${encodeURIComponent(selectedActivityId)}` +
                                `&guests=${guestCount}` +
                                (appliedPromo ? `&promoCode=${encodeURIComponent(appliedPromo.code)}` : "")
                            );
                        }}
                        disabled={isReserveDisabled}
                        className="w-full mt-8 bg-[#74C00F] text-white py-4 rounded-full font-bold text-lg hover:bg-[#62a30d] transition shadow-xl shadow-[#74C00F]/30 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isSelectedSlotFull
                            ? "Selected Slot Full"
                            : hasInsufficientCapacity
                                ? "Not Enough Slots"
                            : showPaymentMethods ? "Continue to Payment" : "Reserve Now"}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">You won&#39;t be charged yet</p>

                </div>
            </div>

            {/* ── Custom guest modal ──────────────────────────────────────── */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-black">Custom Guest Count</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-black transition p-1 rounded-full hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Enter the number of guests{" "}
                            <span className="font-semibold text-black">(1 – {effectiveCap})</span>
                            {slotsAvailable !== null && slotsAvailable < MAX_GUESTS && (
                                <span className="ml-1 text-orange-500 font-semibold">
                                    · {slotsAvailable} slots left
                                </span>
                            )}
                        </p>

                        {/* Input */}
                        <input
                            ref={customInputRef}
                            type="number"
                            min={1}
                            value={customInput}
                            onChange={(e) => {
                                setCustomInput(e.target.value);
                                setCustomError("");
                                setCustomWarning("");
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleCustomConfirm()}
                            placeholder="e.g. 12"
                            className={`w-full border rounded-xl px-4 py-3.5 outline-none text-black text-xl font-bold tracking-wide transition
                                ${customError
                                    ? "border-red-400 ring-2 ring-red-100"
                                    : customWarning
                                        ? "border-amber-400 ring-2 ring-amber-100"
                                        : "border-gray-300 focus:border-[#74C00F] focus:ring-2 focus:ring-[#74C00F]/20"
                                }`}
                        />

                        {/* Hard error */}
                        {customError && (
                            <p className="text-red-500 text-xs mt-2 font-semibold flex items-center gap-1">
                                <span>⚠</span> {customError}
                            </p>
                        )}

                        {/* Soft warning — over capacity */}
                        {customWarning && !customError && (
                            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                                <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
                                <div>
                                    <p className="text-amber-700 text-xs font-bold leading-snug">
                                        Exceeds single-slot capacity ({MAX_GUESTS} guests)
                                    </p>
                                    <p className="text-amber-600 text-xs mt-0.5 leading-snug">
                                        You may need an additional slot. Click <strong>Confirm</strong> again to proceed anyway.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Live price preview */}
                        {!customError && !customWarning && customInput && !isNaN(parseInt(customInput)) && pricePerGuest !== null && (
                            <p className="text-xs text-gray-400 mt-2">
                                Estimated:{" "}
                                <span className="font-bold text-[#74C00F]">
                                    {peso(pricePerGuest * parseInt(customInput))}
                                </span>{" "}
                                + {peso(SERVICE_CHARGE)} service charge
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 border-2 border-gray-200 rounded-full font-bold text-black hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCustomConfirm}
                                className={`flex-1 py-3 rounded-full font-bold text-white transition shadow-lg ${customWarning
                                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-300/40"
                                    : "bg-[#74C00F] hover:bg-[#62a30d] shadow-[#74C00F]/30"
                                    }`}
                            >
                                {customWarning ? "Confirm anyway" : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
