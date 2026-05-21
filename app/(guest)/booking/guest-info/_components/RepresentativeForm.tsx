"use client";

import React, { useState, useCallback } from "react";
import { Users, Mail } from "lucide-react";
import { CountryDropdown } from "./CountryDropdown";
import { PhPhoneInput } from "@/app/components/ui/PhPhoneInput";
import { representativeFormSchema } from "@/app/lib/schema";
import type { ZodIssue } from "zod";

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
    errors?: Partial<Record<string, string>>;
    submitted?: boolean;
}

function validateField(field: string, value: string): string | undefined {
    const defaults = {
        repName: "A", repAge: "1", repGender: "Male",
        repEmail: "a@b.com", repPhone: "+639000000000", repNationality: "PH",
    };
    const result = representativeFormSchema.safeParse({ ...defaults, [field]: value });
    if (result.success) return undefined;
    const issue = result.error.issues.find((i: ZodIssue) => i.path[0] === field);
    return issue?.message;
}

const FieldError = ({ message }: { message?: string }) =>
    message ? (
        <p role="alert" className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
            <span aria-hidden="true">⚠</span> {message}
        </p>
    ) : null;

const inputCls = (hasError: boolean) =>
    `w-full border rounded-xl px-4 py-2.5 outline-none focus:ring-2 transition text-black placeholder:text-gray-300 ${
        hasError
            ? "border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50"
            : "border-gray-300 focus:ring-[#74C00F]/20 focus:border-[#74C00F]"
    }`;

export const RepresentativeForm = ({
    formData,
    onChange,
    errors: externalErrors = {},
    submitted = false,
}: RepresentativeFormProps) => {
    const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
    const [liveErrors, setLiveErrors] = useState<Partial<Record<string, string>>>({});

    const markTouched = useCallback((field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    }, []);

    const handleBlur = useCallback((field: string, value: string) => {
        markTouched(field);
        const msg = validateField(field, value);
        setLiveErrors((prev) => ({ ...prev, [field]: msg }));
    }, [markTouched]);

    const handleChange = useCallback((field: string, value: string) => {
        onChange(field, value);
        markTouched(field);
        const msg = validateField(field, value);
        setLiveErrors((prev) => ({ ...prev, [field]: msg }));
    }, [onChange, markTouched]);

    const getError = (field: string) => {
        if (touched[field]) return liveErrors[field];
        if (submitted) return externalErrors[field];
        return undefined;
    };

    return (
        <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#74C00F]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#74C00F]" />
                </div>
                <h2 className="text-lg font-semibold text-black">Representative Information</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">Primary contact person for this booking</p>

            <div className="grid grid-cols-2 gap-4 mb-4 items-start">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

                <PhPhoneInput
                    id="rep-phone-input"
                    label={
                        <>
                            Phone Number <span className="text-red-400">*</span>
                        </>
                    }
                    valueE164={formData.repPhone}
                    onChangeE164={(v) => handleChange("repPhone", v)}
                    error={getError("repPhone")}
                    onBlur={() => handleBlur("repPhone", formData.repPhone)}
                    accent="booking"
                    labelClassName="block text-xs font-semibold tracking-wide text-gray-400 mb-1.5 uppercase"
                />
            </div>

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
