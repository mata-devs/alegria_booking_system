"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";

interface CountryDropdownProps {
    placeholder?: string;
    defaultValue?: string;
    onChange?: (val: string) => void;
}

export const CountryDropdown = ({
    placeholder = "Select country",
    defaultValue,
    onChange
}: CountryDropdownProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedAlpha2, setSelectedAlpha2] = useState<string>(defaultValue || "");

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter valid countries once
    const activeCountries = useMemo(() => {
        return (countries.all as { status: string; alpha2: string; name: string }[]).filter(
            (c) => c.status !== "deleted" && c.alpha2
        );
    }, []);

    // Apply search filter
    const filteredCountries = activeCountries.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedCountry = useMemo(() => {
        return activeCountries.find((c) => c.alpha2 === selectedAlpha2);
    }, [activeCountries, selectedAlpha2]);

    // Handle external updates to defaultValue (Adjusting state when a prop changes)
    const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
    if (defaultValue !== prevDefaultValue) {
        setSelectedAlpha2(defaultValue || "");
        setPrevDefaultValue(defaultValue);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Dropdown Trigger */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition bg-white text-gray-700 hover:bg-gray-50 text-left"
            >
                <div className="flex items-center gap-3 truncate">
                    {selectedCountry ? (
                        <>
                            <CircleFlag countryCode={selectedCountry.alpha2.toLowerCase()} className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">{selectedCountry.name}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {open && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[16rem] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-gray-100 shrink-0">
                        <input
                            type="text"
                            placeholder="Search country..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#74C00F] focus:ring-1 focus:ring-[#74C00F] transition placeholder:text-gray-400"
                        />
                    </div>
                    <div className="overflow-y-auto w-full py-1 h-full scrollbar-thin">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.alpha2}
                                    type="button"
                                    onClick={() => {
                                        setSelectedAlpha2(country.alpha2);
                                        onChange?.(country.alpha2);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#F5FFE6] transition text-sm ${selectedAlpha2 === country.alpha2 ? 'bg-[#F5FFE6] font-medium text-[#74C00F]' : 'text-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <CircleFlag countryCode={country.alpha2.toLowerCase()} className="w-5 h-5 flex-shrink-0" />
                                        <span className="truncate">{country.name}</span>
                                    </div>
                                    {selectedAlpha2 === country.alpha2 && (
                                        <Check className="w-4 h-4 text-[#74C00F] flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">No country found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
