"use client";

import React, { useState, useCallback } from "react";
import { Users, Mail } from "lucide-react";
import { CountryDropdown } from "./CountryDropdown";
import { representativeFormSchema } from "@/lib/schema";
import type { ZodIssue } from "zod";

// ─── Philippine flag SVG (inline, no external dep) ───────────────────────────
const PHFlag = () => (
    <svg viewBox="0 0 20 15" width="20" height="15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="20" height="7.5" fill="#0038A8" />
        <rect y="7.5" width="20" height="7.5" fill="#CE1126" />
        <polygon points="0,0 10,7.5 0,15" fill="white" />
        {/* Sun */}
        <circle cx="3.6" cy="7.5" r="1.2" fill="#FCD116" />
        {/* 8 rays (simplified) */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
                <line
                    key={deg}
                    x1={3.6 + Math.cos(rad) * 1.3}
                    y1={7.5 + Math.sin(rad) * 1.3}
                    x2={3.6 + Math.cos(rad) * 1.9}
                    y2={7.5 + Math.sin(rad) * 1.9}
                    stroke="#FCD116"
                    strokeWidth="0.35"
                />
            );
        })}
        {/* 3 stars */}
        <text x="1.5" y="4.2" fontSize="1.6" fill="#FCD116">★</text>
        <text x="5.2" y="4.2" fontSize="1.6" fill="#FCD116">★</text>
        <text x="3.3" y="13.2" fontSize="1.6" fill="#FCD116">★</text>
    </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface RepresentativeFormProps {
    formData: {
        repName: string;
        repAge: string;
        repGender: string;
        repEmail: string;
        repPhone: string;
        repNationality: string;
    };
    onChange: (field: string, value: string) => void;
    /** External errors passed from page-level validation (e.g. on submit attempt) */
    errors?: Partial<Record<string, string>>;
    /** Set to true once the user has tried to submit; enables per-field live validation */
    submitted?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format digits-only local PH number into "9XX XXX XXXX" display */
function formatPhDisplay(digits: string): string {
    // Allow up to 10 digits
    const d = digits.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** Convert a display string back to full E.164 for storage */
function toE164(display: string): string {
    const digits = display.replace(/\D/g, "").slice(0, 10);
    return digits ? `+63${digits}` : "";
}

/** Extract the local display value from the stored E.164 (or raw) value */
function fromE164ToDisplay(stored: string): string {
    const local = stored.startsWith("+63") ? stored.slice(3) : stored;
    return formatPhDisplay(local.replace(/\D/g, ""));
}

/** Run Zod on a single field and return the first error or undefined */
function validateField(field: string, value: string): string | undefined {
    const shape: Record<string, string> = { [field]: value };
    // Provide defaults for required sibling fields so partial parse still works
    const defaults = {
        repName: "A",
        repAge: "1",
        repGender: "Male",
        repEmail: "a@b.com",
        repPhone: "+639000000000",
        repNationality: "PH",
    };
    const result = representativeFormSchema.safeParse({ ...defaults, ...shape });
    if (result.success) return undefined;
    const issue = result.error.issues.find((i: ZodIssue) => i.path[0] === field);
    return issue?.message;
}

// ─── Field-level error helper ─────────────────────────────────────────────────
const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p role="alert" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
            <span aria-hidden="true">⚠</span> {message}
        </p>
    ) : null;

// ─── Input class helper ───────────────────────────────────────────────────────
const inputCls = (hasError: boolean) =>
    `w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 transition text-black placeholder:text-gray-300 ${
        hasError
            ? "border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50"
            : "border-gray-300 focus:ring-[#74C00F]/20 focus:border-[#74C00F]"
    }`;

// ─── Component ────────────────────────────────────────────────────────────────
export const RepresentativeForm = ({
    formData,
    onChange,
    errors: externalErrors = {},
    submitted = false,
}: RepresentativeFormProps) => {
    // Track which fields have been touched (blurred at least once)
    const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
    // Live field errors computed on blur / change (after touch)
    const [liveErrors, setLiveErrors] = useState<Partial<Record<string, string>>>({});

    const markTouched = useCallback(
        (field: string) => {
            setTouched((prev) => ({ ...prev, [field]: true }));
        },
        []
    );

    const handleBlur = useCallback(
        (field: string, value: string) => {
            markTouched(field);
            const msg = validateField(field, value);
            setLiveErrors((prev) => ({ ...prev, [field]: msg }));
        },
        [markTouched]
    );

    const handleChange = useCallback(
        (field: string, value: string) => {
            onChange(field, value);
            // Always mark touched + re-validate on any change so errors clear immediately
            markTouched(field);
            const msg = validateField(field, value);
            setLiveErrors((prev) => ({ ...prev, [field]: msg }));
        },
        [onChange, markTouched]
    );

    // Once a field has been touched (even post-submit), live validation wins.
    // This ensures fixing a field immediately clears its error message.
    const getError = (field: string) => {
        if (touched[field]) return liveErrors[field];          // user has interacted → trust live result
        if (submitted) return externalErrors[field];           // not yet touched → show submit-time error
        return undefined;                                      // neither submitted nor touched → silent
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Phone field local state: display value is separate from stored E.164
    // ──────────────────────────────────────────────────────────────────────────
    const [phoneDisplay, setPhoneDisplay] = useState(() =>
        fromE164ToDisplay(formData.repPhone)
    );

    const handlePhoneInput = (raw: string) => {
        // Only keep digits; strip leading 0 (user may type "0917…" — PH local habit)
        let digits = raw.replace(/\D/g, "");
        if (digits.startsWith("0")) digits = digits.slice(1);
        digits = digits.slice(0, 10);
        const display = formatPhDisplay(digits);
        setPhoneDisplay(display);
        const e164 = toE164(display);
        handleChange("repPhone", e164);
    };

    const handlePhoneBlur = () => {
        handleBlur("repPhone", formData.repPhone);
    };

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#74C00F]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#74C00F]" />
                </div>
                <h2 className="text-lg font-semibold text-black">Representative Information</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">Primary contact person for this booking</p>

            {/* Row 1: Full Name + Age & Gender */}
            <div className="grid grid-cols-2 gap-4 mb-4 items-start">
                {/* Full Name */}
                <div>
                    <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">
                        Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Enter full name"
                        value={formData.repName}
                        onChange={(e) => handleChange("repName", e.target.value)}
                        onBlur={(e) => handleBlur("repName", e.target.value)}
                        className={inputCls(!!getError("repName"))}
                        autoComplete="name"
                    />
                    <FieldError message={getError("repName")} />
                </div>

                {/* Age + Gender */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">
                            Age <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="120"
                            placeholder="Age"
                            value={formData.repAge}
                            onChange={(e) => handleChange("repAge", e.target.value)}
                            onBlur={(e) => handleBlur("repAge", e.target.value)}
                            className={inputCls(!!getError("repAge"))}
                            autoComplete="age"
                        />
                        <FieldError message={getError("repAge")} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">
                            Gender <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={formData.repGender}
                            onChange={(e) => handleChange("repGender", e.target.value)}
                            onBlur={(e) => handleBlur("repGender", e.target.value)}
                            className={`${inputCls(!!getError("repGender"))} bg-white`}
                        >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                        <FieldError message={getError("repGender")} />
                    </div>
                </div>
            </div>

            {/* Row 2: Email + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">
                        Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={formData.repEmail}
                            onChange={(e) => handleChange("repEmail", e.target.value)}
                            onBlur={(e) => handleBlur("repEmail", e.target.value)}
                            className={`${inputCls(!!getError("repEmail"))} pl-9`}
                            autoComplete="email"
                        />
                    </div>
                    <FieldError message={getError("repEmail")} />
                </div>

                {/* Phone — Philippine format with +63 prefix badge */}
                <div>
                    <label
                        htmlFor="rep-phone-input"
                        className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase"
                    >
                        Phone Number <span className="text-red-400">*</span>
                    </label>
                    <div
                        className={`flex items-stretch border rounded-xl overflow-hidden transition focus-within:ring-2 ${
                            getError("repPhone")
                                ? "border-red-400 focus-within:ring-red-200 bg-red-50"
                                : "border-gray-300 focus-within:ring-[#74C00F]/20 focus-within:border-[#74C00F]"
                        }`}
                    >
                        {/* Static PH prefix badge */}
                        <div className="flex items-center gap-1.5 px-3 bg-gray-50 border-r border-gray-200 shrink-0 select-none">
                            <PHFlag />
                            <span className="text-sm font-medium text-gray-600">+63</span>
                        </div>
                        {/* Local number input */}
                        <input
                            id="rep-phone-input"
                            type="tel"
                            inputMode="numeric"
                            placeholder="917 123 4567"
                            value={phoneDisplay}
                            onChange={(e) => handlePhoneInput(e.target.value)}
                            onBlur={handlePhoneBlur}
                            className="flex-1 px-3 py-2.5 outline-none text-black placeholder:text-gray-300 bg-transparent text-sm"
                            autoComplete="tel-national"
                            maxLength={13} /* "9XX XXX XXXX" = 12 chars */
                        />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                        Enter your 10-digit mobile number (e.g. 917 123 4567)
                    </p>
                    <FieldError message={getError("repPhone")} />
                </div>
            </div>

            {/* Row 3: Nationality */}
            <div>
                <label className="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase">
                    Nationality <span className="text-red-400">*</span>
                </label>
                <CountryDropdown
                    placeholder="Select your country"
                    defaultValue={formData.repNationality}
                    onChange={(val) => {
                        onChange("repNationality", val);
                        if (touched["repNationality"] || submitted) {
                            const msg = validateField("repNationality", val);
                            setLiveErrors((prev) => ({ ...prev, repNationality: msg }));
                        }
                        markTouched("repNationality");
                    }}
                />
                <FieldError message={getError("repNationality")} />
            </div>
        </div>
    );
};
