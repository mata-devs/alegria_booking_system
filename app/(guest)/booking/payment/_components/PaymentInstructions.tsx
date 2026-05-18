"use client";

import Image from "next/image";
import type { PaymentMethod } from "@/app/lib/booking-service";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";

interface PaymentInstructionsProps {
    paymentMethod: PaymentMethod;
    paymentImageUrl: string | null;
    accountName: string | null;
    accountNumber: string | null;
    onPaymentMethodChange?: (method: PaymentMethod) => void;
    totalAmount?: number | null;
}

export function PaymentInstructions({
    paymentMethod,
    paymentImageUrl,
    accountName,
    accountNumber,
    onPaymentMethodChange,
    totalAmount,
}: PaymentInstructionsProps) {
    const PAYMENT_METHODS: PaymentMethod[] = ["Gcash / Maya", "BDO", "BPI"];
    const canEditMethod = Boolean(onPaymentMethodChange);
    const [showMethodDropdown, setShowMethodDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!dropdownRef.current?.contains(e.target as Node)) setShowMethodDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const peso = (n: number) =>
        `₱ ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const methodIcon = useMemo(() => {
        if (paymentMethod === "Gcash / Maya") {
            return (
                <span className="inline-flex items-center gap-1.5">
                    <Image src="/gcashIcon.png" alt="GCash" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                    <Image src="/mayaIcon.png" alt="Maya" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                </span>
            );
        }
        if (paymentMethod === "BDO") {
            return <Image src="/BDOIcon.png" alt="BDO" width={18} height={18} className="h-[18px] w-[18px] object-contain" />;
        }
        return <Image src="/BPIIcon.png" alt="BPI" width={18} height={18} className="h-[18px] w-[18px] object-contain" />;
    }, [paymentMethod]);

    const handleDownload = async () => {
        if (!paymentImageUrl) return;
        const safeMethod = paymentMethod.toLowerCase().replace(/\s+|\/+/g, "-").replace(/[^a-z0-9-]/g, "");
        const filename = `payment-${safeMethod || "instructions"}.jpg`;
        try {
            const res = await fetch(`/api/payment-image?url=${encodeURIComponent(paymentImageUrl)}&filename=${encodeURIComponent(filename)}`);
            if (!res.ok) throw new Error("Failed to fetch image");
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch {
            // silently fail — CORS may block some environments
        }
    };

    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-bold text-gray-900">Payment Instruction</h2>
            <p className="mt-2 text-sm text-gray-600">Upload your payment screenshot so the operator can manually verify it.</p>

            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
                Your booking will be reserved and your payment will be marked <span className="font-semibold">pending</span> until an operator verifies it.
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Payment Method</p>
                <div ref={dropdownRef} className="relative mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {methodIcon}
                        <span className="font-semibold text-gray-900">{paymentMethod}</span>
                    </div>

                    <button
                        type="button"
                        disabled={!canEditMethod}
                        onClick={() => { if (!canEditMethod) return; setShowMethodDropdown((p) => !p); }}
                        className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            canEditMethod ? "border-gray-200 bg-white text-gray-900 hover:bg-gray-50" : "border-gray-100 bg-gray-50 text-gray-400 cursor-default"
                        }`}
                    >
                        Change
                        {canEditMethod && <ChevronDown className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${showMethodDropdown ? "rotate-180" : ""}`} />}
                    </button>

                    {canEditMethod && showMethodDropdown && (
                        <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10">
                            {PAYMENT_METHODS.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => { onPaymentMethodChange?.(m); setShowMethodDropdown(false); }}
                                    className={`w-full px-4 py-3 text-left text-sm font-semibold transition ${paymentMethod === m ? "bg-[#f0fce0] text-[#74C00F]" : "text-gray-900 hover:bg-gray-50"}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <p className="text-sm font-bold text-gray-900">Payment Instructions</p>
                <ol className="mt-3 space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2"><span className="font-bold text-gray-400">1.</span><span>Double-check the account name and number below.</span></li>
                    <li className="flex gap-2"><span className="font-bold text-gray-400">2.</span><span>Scan the QR code below using your payment app.</span></li>
                    <li className="flex gap-2">
                        <span className="font-bold text-gray-400">3.</span>
                        <span>
                            Send the exact amount{" "}
                            {typeof totalAmount === "number" ? <span className="font-bold text-gray-900">({peso(totalAmount)})</span> : null}.
                        </span>
                    </li>
                    <li className="flex gap-2"><span className="font-bold text-gray-400">4.</span><span>Upload a screenshot of your successful payment.</span></li>
                </ol>
            </div>

            <div className="mt-6">
                <p className="text-sm font-bold text-gray-900">Scan QR Code to pay</p>
                <div className="group relative mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-[#F9FAFB]">
                    {paymentImageUrl ? (
                        <>
                            <Image
                                src={paymentImageUrl}
                                alt={`${paymentMethod} payment instructions`}
                                width={1200}
                                height={800}
                                className="h-auto w-full object-contain"
                            />
                            <button
                                type="button"
                                onClick={handleDownload}
                                aria-label="Download payment QR image"
                                title="Download image"
                                className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg shadow-black/20 backdrop-blur-sm transition hover:bg-black/70 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                            >
                                <Download className="h-5 w-5" />
                            </button>
                        </>
                    ) : (
                        <div className="p-8 text-center text-sm text-gray-500">
                            No payment instruction image configured for this operator yet.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Account name</p>
                    <p className="mt-1 break-words text-base font-semibold text-gray-900">{accountName ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Account number</p>
                    <p className="mt-1 break-words font-mono text-sm font-bold text-gray-900">{accountNumber ?? "—"}</p>
                </div>
            </div>
        </section>
    );
}
