"use client";

import React, { useEffect, useState } from "react";
import { MapPin, ChevronDown, Lock } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface TourOperatorDropdownProps {
    value: string;
    onChange: (val: string) => void;
    /** When true, selection is fixed by an applied promo voucher with operatorUid — use Remove promo to change. */
    lockedByPromo?: boolean;
}

interface TourOperatorOption {
    uid: string;
    label: string;
}

export const TourOperatorDropdown = ({ value, onChange, lockedByPromo = false }: TourOperatorDropdownProps) => {
    const [operators, setOperators] = useState<TourOperatorOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const usersRef = collection(firestore, "users");
                const operatorsQuery = query(
                    usersRef,
                    where("role", "==", "operator"),
                    where("status", "==", "active")
                );

                const snapshot = await getDocs(operatorsQuery);
                if (cancelled) return;

                const nextOperators = snapshot.docs
                    .map((operatorDoc) => {
                        const data = operatorDoc.data() as {
                            companyName?: string;
                            name?: string;
                        };
                        const label =
                            data.companyName?.trim()
                            || data.name?.trim()
                            || "Unnamed operator";

                        return {
                            uid: operatorDoc.id,
                            label,
                        };
                    })
                    .sort((a, b) => a.label.localeCompare(b.label));

                setOperators(nextOperators);
            } catch (error) {
                console.error("[TourOperatorDropdown] Failed to fetch operators:", error);
                if (!cancelled) setOperators([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-gray-500" />
                </div>
                <h2 className="text-lg font-semibold text-black">Tour Operator</h2>
                <span className="text-xs text-gray-400 font-medium uppercase">(Optional)</span>
                {lockedByPromo && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#74C00F] bg-[#74C00F]/10 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        Set by promo
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500 mb-4">
                {lockedByPromo
                    ? "This operator is required by your promo code. Remove the promo in the order summary to choose a different operator."
                    : "Select a tour operator if you have a preferred guide"}
            </p>
            <div className="relative">
                <select
                    aria-label="Select tour operator"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={loading || lockedByPromo}
                    className={`w-full border border-gray-300 rounded-xl px-4 py-3 appearance-none outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-gray-700 font-medium ${
                        lockedByPromo ? "bg-gray-50 cursor-not-allowed opacity-90" : "bg-white"
                    }`}>
                    <option value="">
                        {loading
                            ? "Loading tour operators..."
                            : operators.length > 0
                                ? "Select tour operator"
                                : "No tour operators available"}
                    </option>
                    {operators.map((operator) => (
                        <option key={operator.uid} value={operator.uid}>
                            {operator.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
        </div>
    );
};
