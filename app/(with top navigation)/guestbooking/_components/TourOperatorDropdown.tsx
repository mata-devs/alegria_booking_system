"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, ChevronDown, Lock, Check, Search, User } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { firestore, firebaseStorage } from "@/lib/firebase";

interface TourOperatorDropdownProps {
    value: string;
    onChange: (val: string) => void;
    lockedByPromo?: boolean;
}

interface TourOperatorOption {
    uid: string;
    label: string;
    initials: string;
    imageUrl: string | null;
}

export const TourOperatorDropdown = ({ value, onChange, lockedByPromo = false }: TourOperatorDropdownProps) => {
    const [operators, setOperators] = useState<TourOperatorOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

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

                const baseOperators = snapshot.docs
                    .map((operatorDoc) => {
                        const data = operatorDoc.data() as {
                            companyName?: string;
                            name?: string;
                            firstName?: string;
                            lastName?: string;
                            profileImage?: string;
                        };
                        const fullName = [data.firstName, data.lastName]
                            .filter(Boolean)
                            .join(" ")
                            .trim();
                        const label =
                            fullName
                            || data.name?.trim()
                            || data.companyName?.trim()
                            || "Unnamed operator";

                        const words = label.split(/\s+/).filter(Boolean);
                        const initials = words.length >= 2
                            ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
                            : label.slice(0, 2).toUpperCase();

                        return { uid: operatorDoc.id, label, initials, imageUrl: data.profileImage ?? null };
                    })
                    .sort((a, b) => a.label.localeCompare(b.label));

                // Resolve profile images from Storage for operators without a profileImage field
                const withImages = await Promise.all(
                    baseOperators.map(async (op) => {
                        if (op.imageUrl) return op;
                        try {
                            const url = await getDownloadURL(
                                ref(firebaseStorage, `profile-pictures/${op.uid}.jpg`)
                            );
                            return { ...op, imageUrl: url };
                        } catch {
                            return op;
                        }
                    })
                );
                if (cancelled) return;

                setOperators(withImages);
            } catch (error) {
                console.error("[TourOperatorDropdown] Failed to fetch operators:", error);
                if (!cancelled) setOperators([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (open) searchRef.current?.focus();
    }, [open]);

    const selectedOperator = operators.find((o) => o.uid === value);
    const filtered = operators.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

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

            {/* Custom dropdown */}
            <div className="relative" ref={containerRef}>
                {/* Trigger button */}
                <button
                    type="button"
                    onClick={() => { if (!lockedByPromo && !loading) { setOpen(!open); setSearch(""); } }}
                    disabled={loading || lockedByPromo}
                    className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-all ${
                        open
                            ? "border-[#74C00F] ring-2 ring-[#74C00F]/20"
                            : "border-gray-300 hover:border-gray-400"
                    } ${lockedByPromo ? "bg-gray-50 cursor-not-allowed opacity-90" : "bg-white cursor-pointer"}`}
                >
                    {selectedOperator ? (
                        <>
                            <div className="w-8 h-8 rounded-full bg-[#558B2F]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {selectedOperator.imageUrl ? (
                                    <Image src={selectedOperator.imageUrl} alt={selectedOperator.label} width={32} height={32} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-[#558B2F]">{selectedOperator.initials}</span>
                                )}
                            </div>
                            <span className="text-gray-800 font-medium truncate flex-1">{selectedOperator.label}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-gray-400 flex-1">
                                {loading ? "Loading operators..." : "Select tour operator"}
                            </span>
                        </>
                    )}
                    <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown panel */}
                {open && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* Search */}
                        <div className="p-2 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search operators..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#74C00F] focus:ring-1 focus:ring-[#74C00F]/20 transition bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Options list */}
                        <div className="max-h-60 overflow-y-auto py-1">
                            {/* None / clear option */}
                            <button
                                type="button"
                                onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                                    !value ? "bg-[#74C00F]/5" : ""
                                }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-gray-400" />
                                </div>
                                <span className="text-sm text-gray-500 flex-1">No preference</span>
                                {!value && <Check className="w-4 h-4 text-[#74C00F] flex-shrink-0" />}
                            </button>

                            {filtered.length === 0 && search && (
                                <div className="px-4 py-6 text-center text-sm text-gray-400">
                                    No operators matching &ldquo;{search}&rdquo;
                                </div>
                            )}

                            {filtered.map((operator) => {
                                const isSelected = value === operator.uid;
                                return (
                                    <button
                                        key={operator.uid}
                                        type="button"
                                        onClick={() => { onChange(operator.uid); setOpen(false); setSearch(""); }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                                            isSelected ? "bg-[#74C00F]/5" : ""
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[#558B2F]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {operator.imageUrl ? (
                                                <Image src={operator.imageUrl} alt={operator.label} width={32} height={32} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-[#558B2F]">{operator.initials}</span>
                                            )}
                                        </div>
                                        <span className={`text-sm flex-1 truncate ${isSelected ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                                            {operator.label}
                                        </span>
                                        {isSelected && <Check className="w-4 h-4 text-[#74C00F] flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
