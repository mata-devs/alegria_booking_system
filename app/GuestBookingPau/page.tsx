"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Calendar, Clock, Users, ChevronDown, Check, Phone, Mail, MapPin } from "lucide-react";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";

// Custom inline functional component for country dropdown with flags
const CountryDropdown = ({
    placeholder = "Select country",
    defaultValue,
    onChange
}: {
    placeholder?: string;
    defaultValue?: string;
    onChange?: (val: string) => void;
}) => {
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
        return countries.all.filter((c: any) => c.status !== "deleted" && c.alpha2);
    }, []);

    // Apply search filter
    const filteredCountries = activeCountries.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedCountry = useMemo(() => {
        return activeCountries.find((c: any) => c.alpha2 === selectedAlpha2);
    }, [activeCountries, selectedAlpha2]);

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
                            filteredCountries.map((country: any) => (
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

export default function GuestInformationFormPage() {
    const router = useRouter();

    // Default initial states
    const [guests, setGuests] = useState([{ name: "", age: "", nationality: "PH" }]);
    const [formData, setFormData] = useState({
        repName: "",
        repAge: "",
        repEmail: "",
        repPhone: "",
        repNationality: "PH",
        tourOperator: "",
        specialRequests: ""
    });

    const [bookingDate, setBookingDate] = useState("January 18, 2026");
    const [bookingTime, setBookingTime] = useState("8:00 AM");

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Load data from URL
        const params = new URLSearchParams(window.location.search);
        if (params.get("date")) setBookingDate(params.get("date")!);
        if (params.get("time")) setBookingTime(params.get("time")!);

        // Load temporary form values from sessionStorage so they aren't erased
        const savedForm = sessionStorage.getItem("guestFormData");
        const savedGuests = sessionStorage.getItem("guestFormGuests");
        if (savedForm) setFormData(JSON.parse(savedForm));
        if (savedGuests) setGuests(JSON.parse(savedGuests));

        setIsMounted(true);
    }, []);

    // Save temporary form values whenever they change
    useEffect(() => {
        if (isMounted) {
            sessionStorage.setItem("guestFormData", JSON.stringify(formData));
            sessionStorage.setItem("guestFormGuests", JSON.stringify(guests));
        }
    }, [formData, guests, isMounted]);

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateGuest = (index: number, field: string, value: string) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
    };

    const addGuest = () => setGuests([...guests, { name: "", age: "", nationality: "PH" }]);
    const removeGuest = (index: number) => {
        if (guests.length > 1) {
            setGuests(guests.filter((_, idx) => idx !== index));
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-poppins pb-20">
            {/* Navbar */}
            <nav className="w-full bg-white px-6 md:px-12 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-[#74C00F] tracking-tight leading-none">Alegria</span>
                    <span className="text-[10px] font-bold text-gray-500 tracking-wider">CANYONEERING</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <a href="/" className="font-medium text-black hover:text-[#74C00F] transition">Home</a>
                    <a href="/TourGuides" className="font-medium text-black hover:text-[#74C00F] transition">Tour Guides</a>
                    <button className="bg-[#74C00F] text-white px-6 py-2 rounded-full font-medium hover:bg-[#62a30d] transition">
                        Book Now
                    </button>
                </div>
                {/* Mobile Menu Button */}
                <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Toggle menu">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </nav>

            {/* Progress Indicator */}
            <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#74C00F] text-white flex items-center justify-center font-bold text-sm">1</div>
                        <span className="font-semibold text-black hidden sm:inline">Select Tour</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-[#74C00F] mx-2"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#74C00F] text-white flex items-center justify-center font-bold text-sm">2</div>
                        <span className="font-semibold text-black hidden sm:inline">Guest Info</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center font-bold text-sm">3</div>
                        <span className="font-medium text-gray-400 hidden sm:inline">Payment</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-8">

                {/* Left Column: Form */}
                <div className="flex-1 w-full flex flex-col">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-black">Guest Information</h1>
                        <p className="text-gray-500 mb-8">Please fill in the details for all guests attending the tour</p>

                        {/* Representative Information */}
                        <div className="mb-8 pb-8 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-[#74C00F]/10 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-[#74C00F]" />
                                </div>
                                <h2 className="text-lg font-semibold text-black">Representative Information</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Primary contact person for this booking</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter full name"
                                        value={formData.repName}
                                        onChange={(e) => handleFormChange("repName", e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black placeholder:text-gray-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">Age</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Age"
                                        value={formData.repAge}
                                        onChange={(e) => handleFormChange("repAge", e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={formData.repEmail}
                                            onChange={(e) => handleFormChange("repEmail", e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            placeholder="+63 912 345 6789"
                                            value={formData.repPhone}
                                            onChange={(e) => handleFormChange("repPhone", e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">Nationality</label>
                                <CountryDropdown
                                    placeholder="Select your country"
                                    defaultValue={formData.repNationality}
                                    onChange={(val) => handleFormChange("repNationality", val)}
                                />
                            </div>
                        </div>

                        {/* Additional Guests Information */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-[#74C00F]/10 flex items-center justify-center">
                                    <UserPlus className="w-4 h-4 text-[#74C00F]" />
                                </div>
                                <h2 className="text-lg font-semibold text-black">Additional Guests</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Add information for each guest joining the tour</p>

                            {guests.map((guest, idx) => (
                                <div key={idx} className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-black">Guest {idx + 1}</h3>
                                        {guests.length > 1 && (
                                            <button
                                                onClick={() => removeGuest(idx)}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">Full Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter full name"
                                                value={guest.name}
                                                onChange={(e) => updateGuest(idx, "name", e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">Age</label>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Age"
                                                value={guest.age}
                                                onChange={(e) => updateGuest(idx, "age", e.target.value)}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">Nationality</label>
                                        <CountryDropdown
                                            placeholder="Select country"
                                            defaultValue={guest.nationality}
                                            onChange={(val) => updateGuest(idx, "nationality", val)}
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addGuest}
                                className="flex items-center gap-2 text-[#74C00F] hover:text-[#62a30d] font-semibold text-sm mt-4 transition"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add another guest
                            </button>
                        </div>

                        {/* Tour Operator */}
                        <div className="mb-8 pb-8 border-b border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-black">Tour Operator</h2>
                                <span className="text-xs text-gray-400 font-medium uppercase">(Optional)</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Select a tour operator if you have a preferred guide</p>
                            <div className="relative">
                                <select
                                    aria-label="Select tour operator"
                                    value={formData.tourOperator}
                                    onChange={(e) => handleFormChange("tourOperator", e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 appearance-none outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition bg-white text-gray-700 font-medium">
                                    <option value="">Select tour operator</option>
                                    <option value="op1">Action Canyoneering</option>
                                    <option value="op2">Alegria Tours</option>
                                    <option value="op3">Kawasan Adventurers</option>
                                    <option value="op4">Cebu Adventure Specialists</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>

                        {/* Special Requests */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-lg font-semibold text-black">Special Requests</h2>
                                <span className="text-xs text-gray-400 font-medium uppercase">(Optional)</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Any dietary restrictions, medical conditions, or special requirements</p>
                            <textarea
                                rows={4}
                                placeholder="Enter any special requests or requirements..."
                                value={formData.specialRequests}
                                onChange={(e) => handleFormChange("specialRequests", e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black placeholder:text-gray-300 resize-none"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                        <button
                            onClick={() => router.push(`/Booking?date=${encodeURIComponent(bookingDate)}&time=${encodeURIComponent(bookingTime)}`)}
                            className="w-full sm:w-auto bg-white border-2 border-gray-300 text-black px-12 py-3.5 rounded-full font-bold hover:bg-gray-50 transition shadow-sm">
                            Go Back
                        </button>
                        <button className="w-full sm:w-auto bg-[#74C00F] text-white px-12 py-3.5 rounded-full font-bold hover:bg-[#62a30d] transition shadow-lg shadow-[#74C00F]/30">
                            Continue to Payment
                        </button>
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div className="w-full lg:w-[420px] flex flex-col shrink-0">
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm lg:sticky lg:top-24">

                        <h2 className="text-xl font-bold text-black mb-6">Booking Summary</h2>

                        {/* Booking Details */}
                        <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 mb-6">
                            <div className="flex items-center gap-4 text-gray-700">
                                <div className="w-12 h-12 bg-[#F9FAFB] rounded-full flex items-center justify-center border border-gray-100">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Tour Date</span>
                                    <span className="font-semibold text-black text-lg">{bookingDate}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-700">
                                <div className="w-12 h-12 bg-[#F9FAFB] rounded-full flex items-center justify-center border border-gray-100">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Start Time</span>
                                    <span className="font-semibold text-black text-lg">{bookingTime}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-700">
                                <div className="w-12 h-12 bg-[#F9FAFB] rounded-full flex items-center justify-center border border-gray-100">
                                    <Users className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Number of Guests</span>
                                    <span className="font-semibold text-black text-lg">{guests.length + 1} {guests.length + 1 === 1 ? 'Guest' : 'Guests'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Promo Code */}
                        <div className="mb-6 border-b border-gray-100 pb-6">
                            <label className="block font-bold text-black mb-1">Promo Code</label>
                            <p className="text-sm text-gray-400 mb-3">Have a discount code? Enter it here</p>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter promo code"
                                    className="w-full border border-gray-300 rounded-xl pl-4 pr-24 py-3 outline-none focus:ring-2 focus:ring-[#74C00F]/20 focus:border-[#74C00F] transition text-black bg-[#F9FAFB] focus:bg-white placeholder:text-gray-300"
                                />
                                <button className="absolute right-4 top-3 text-[#00A3A3] font-bold text-sm hover:text-teal-800 transition">
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-4">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>₱1,500 × {guests.length + 1}</span>
                                <span className="font-semibold text-black">₱ {(1500 * (guests.length + 1)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Service fee</span>
                                <span className="font-semibold text-black">₱ 200</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Processing fee</span>
                                <span className="font-semibold text-black">₱ 50</span>
                            </div>
                            <div className="flex justify-between text-black font-bold text-xl pt-4 border-t border-gray-200 border-dashed">
                                <span>Total</span>
                                <span>₱ {(1500 * (guests.length + 1) + 250).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Note:</strong> Final pricing and availability will be confirmed after submission. You'll receive a confirmation email within 24 hours.
                            </p>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
