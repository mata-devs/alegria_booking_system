"use client";

import React from "react";
import { Calendar, Clock, Users } from "lucide-react";
import { PricingResponse } from "@/lib/booking-service";

interface PricingCardProps {
    bookingDate: string;
    bookingTime: string;
    guestCount: number;
    pricing: PricingResponse | null;
    pricingLoading: boolean;
    promoCode: string;
    onPromoCodeChange: (val: string) => void;
    onApplyPromo: () => void;
}

const PricingItem = ({ label, amount, isDiscount = false }: { label: string; amount: number; isDiscount?: boolean }) => (
    <div className={`flex justify-between text-sm ${isDiscount ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
        <span>{label}</span>
        <span className={isDiscount ? '' : 'font-semibold text-black'}>
            {isDiscount ? '-' : ''} ₱ {amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </span>
    </div>
);

const PricingDetails = ({ pricing, guestCount }: { pricing: PricingResponse; guestCount: number }) => (
    <>
        <PricingItem 
            label={`₱${pricing.pricePerGuest.toLocaleString("en-PH")} × ${guestCount} ${guestCount === 1 ? "person" : "persons"}`}
            amount={pricing.subtotal} 
        />
        <PricingItem label="Service charge" amount={pricing.serviceCharge} />
        {pricing.lguServiceFee > 0 && <PricingItem label="LGU Service Fee" amount={pricing.lguServiceFee} />}
        {pricing.mataServiceFee > 0 && <PricingItem label="Mata Service Fee" amount={pricing.mataServiceFee} />}
        {pricing.discount && pricing.discount > 0 && (
            <PricingItem label={`Discount (${pricing.promoCode})`} amount={pricing.discount} isDiscount />
        )}
        <div className="flex justify-between text-black font-bold text-xl pt-4 border-t border-gray-200 border-dashed">
            <span>Total</span>
            <span>₱ {pricing.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
        </div>
    </>
);

export const PricingCard = ({
    bookingDate,
    bookingTime,
    guestCount,
    pricing,
    pricingLoading,
    promoCode,
    onPromoCodeChange,
    onApplyPromo
}: PricingCardProps) => {
    return (
        <div className="w-full flex flex-col shrink-0">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-black mb-6">Booking Summary</h2>

                {/* Booking Details */}
                <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 mb-6">
                    <SummaryItem icon={<Calendar className="w-5 h-5 text-gray-500" />} label="Tour Date" value={bookingDate} />
                    <SummaryItem icon={<Clock className="w-5 h-5 text-gray-500" />} label="Start Time" value={bookingTime} />
                    <SummaryItem icon={<Users className="w-5 h-5 text-gray-500" />} label="Number of Guests" value={`${guestCount} ${guestCount === 1 ? 'Guest' : 'Guests'}`} />
                </div>

                {/* Promo Code */}
                <div className="mb-6 border-b border-gray-100 pb-6">
                    <label className="block font-bold text-black mb-1">Promo Code</label>
                    <p className="text-sm text-gray-400 mb-3">Have a discount code? Enter it here</p>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Enter promo code"
                            value={promoCode}
                            onChange={(e) => onPromoCodeChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl pl-4 pr-24 py-3 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black bg-[#F9FAFB] focus:bg-white placeholder:text-gray-300"
                        />
                        <button 
                            onClick={onApplyPromo}
                            className="absolute right-4 top-3 text-[#00A3A3] font-bold text-sm hover:text-teal-800 transition"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                    {pricingLoading ? (
                        <div className="text-gray-500 text-sm animate-pulse">Calculating price...</div>
                    ) : pricing ? (
                        <PricingDetails pricing={pricing} guestCount={guestCount} />
                    ) : (
                        <div className="text-gray-400 text-sm italic">Enter guest details to see pricing</div>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-800 leading-relaxed">
                        <strong>Note:</strong> Final pricing and availability will be confirmed after submission. You&apos;ll receive a confirmation email within 24 hours.
                    </p>
                </div>
            </div>
        </div>
    );
};

const SummaryItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-center gap-4 text-gray-700">
        <div className="w-12 h-12 bg-[#F9FAFB] rounded-full flex items-center justify-center border border-gray-100">
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">{label}</span>
            <span className="font-semibold text-black text-lg">{value}</span>
        </div>
    </div>
);
