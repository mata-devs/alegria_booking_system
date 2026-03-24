"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
/*use this on superadmin*/
const API_URL = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || "http://localhost:5001/alegria-booking-system/asia-southeast1/api";

interface EntityResponse {
    entityId: string;
    entityName: string;
    representative: string;
    representativeEmail: string;
    phoneNumber: string;
    createdAt?: any;
}

export default function Page() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entities, setEntities] = useState<EntityResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEntities = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/entities`);
            if (res.ok) {
                const data = await res.json();
                setEntities(data);
            }
        } catch (err) {
            console.error("Failed to fetch entities:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntities();
    }, []);

    return (
        <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold font-poppins text-[#636363]">Entity Management</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-[#7BCA0D] text-white rounded-[10px] font-poppins font-medium hover:bg-[#68ab0b] transition-colors"
                    >
                        + Create New Entity
                    </button>
                </div>

                {/* Entity List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-[#7BCA0D]" size={32} />
                        <span className="ml-3 text-gray-500 font-poppins">Loading entities...</span>
                    </div>
                ) : entities.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-poppins">
                        No entities yet. Click &quot;Create New Entity&quot; to add one.
                    </div>
                ) : (
                    <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-6 py-3 text-sm font-poppins font-semibold text-gray-500">Entity Name</th>
                                    <th className="text-left px-6 py-3 text-sm font-poppins font-semibold text-gray-500">Representative</th>
                                    <th className="text-left px-6 py-3 text-sm font-poppins font-semibold text-gray-500">Email</th>
                                    <th className="text-left px-6 py-3 text-sm font-poppins font-semibold text-gray-500">Phone</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entities.map((entity) => (
                                    <tr key={entity.entityId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-poppins text-sm text-gray-800 font-medium">{entity.entityName}</td>
                                        <td className="px-6 py-4 font-poppins text-sm text-gray-600">{entity.representative}</td>
                                        <td className="px-6 py-4 font-poppins text-sm text-gray-600">{entity.representativeEmail}</td>
                                        <td className="px-6 py-4 font-poppins text-sm text-gray-600">{entity.phoneNumber}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateNewEntityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={() => {
                    setIsModalOpen(false);
                    fetchEntities(); // Refresh list after create
                }}
            />
        </div>
    );
}

export interface EntityField {
    id: string;
    label: string;
    placeholder?: string;
    type?: React.HTMLInputTypeAttribute;
}

export interface CreateNewEntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    title?: string;
    fields?: EntityField[];
}

export function CreateNewEntityModal({
    isOpen,
    onClose,
    onSaved,
    title = "Create New Entity",
    fields = [
        { id: 'entityName', label: 'Entity Name', placeholder: 'Enter the name of the entity (e.g. Mr Beast)' },
        { id: 'representative', label: 'Representative', placeholder: 'Enter the representative name (e.g. James Stephen Donaldson)' },
        { id: 'representativeEmail', label: 'Representative Email', placeholder: 'Enter the representative email (e.g. jamesdonaldson@gmail.com)', type: 'email' },
        { id: 'phoneNumber', label: 'Representative Contact Number', placeholder: 'e.g. +639123456789' },
    ]
}: CreateNewEntityModalProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setError(null); // Clear error on input change
    };

    const handleSave = async () => {
        setError(null);
        setSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/entities`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create entity");
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({});
                onSaved();
            }, 1500);
        } catch (err: any) {
            setError(err?.message || "Network error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-[678px] bg-white rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-4">
                    <h2 className="text-2xl font-semibold text-[#636363] font-poppins">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mx-8 mb-2 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-[10px] text-red-700 font-poppins text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mx-8 mb-2 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-[10px] text-green-700 font-poppins text-sm">
                        <CheckCircle size={18} />
                        Entity created successfully!
                    </div>
                )}

                {/* Body */}
                <div className="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto w-full">
                    {fields.map((field) => (
                        <div key={field.id} className="flex flex-col gap-2">
                            <label
                                htmlFor={field.id}
                                className="text-[#636363] font-poppins font-medium text-sm md:text-base "
                            >
                                {field.label}
                            </label>
                            <input
                                id={field.id}
                                name={field.id}
                                type={field.type || "text"}
                                placeholder={field.placeholder}
                                value={formData[field.id] || ''}
                                onChange={handleChange}
                                disabled={submitting}
                                className="w-full h-[47px] px-4 rounded-[9px] border-[2px] border-[#9D9D9D] focus:outline-none focus:border-[#7BCA0D] transition-colors font-poppins text-black disabled:opacity-50"
                            />
                        </div>
                    ))}
                </div>

                {/* Footer Buttons */}
                <div className="px-8 pb-8 pt-6 flex flex-col-reverse sm:flex-row gap-4 sm:gap-0 sm:justify-between items-center w-full">
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="w-full sm:w-[233px] h-[47px] bg-[#7BCA0D] hover:bg-[#68ab0b] text-white rounded-[12px] font-poppins font-semibold text-lg transition-transform active:scale-95 shadow-[0_4px_8px_rgba(123,202,13,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="w-full sm:w-[233px] h-[47px] bg-[#F5452D] hover:bg-[#d93b26] text-white rounded-[12px] font-poppins font-semibold text-lg transition-transform active:scale-95 shadow-[0_4px_8px_rgba(245,69,45,0.3)] disabled:opacity-50"
                    >
                        Discard
                    </button>
                </div>

            </div>
        </div>
    );
}
