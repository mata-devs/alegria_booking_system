"use client";


/*use this on superadmin*/
import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || "http://localhost:5001/alegria-booking-system/asia-southeast1/api";

interface EntityOption {
    entityId: string;
    entityName: string;
}

interface VoucherResponse {
    voucherId: string;
    code: string;
    discount: number;
    numberOfUsesAllowed: number;
    usageCount: number;
    operatorUid: string | null;
    expirationDate: string | null;
    voucherStatus: string;
    entityId: string;
}

export default function Page() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/voucher-codes`);
            if (res.ok) {
                const data = await res.json();
                setVouchers(data);
            }
        } catch (err) {
            console.error("Failed to fetch voucher codes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    return (
        <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center">
            <div className="w-full max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold font-poppins text-[#636363]">Voucher Codes Management</h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-[#178893] text-white rounded-[10px] font-poppins font-medium hover:bg-[#13707a] transition-colors"
                    >
                        + Create New Code
                    </button>
                </div>

                {/* Voucher List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-[#178893]" size={32} />
                        <span className="ml-3 text-gray-500 font-poppins">Loading voucher codes...</span>
                    </div>
                ) : vouchers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-poppins">
                        No voucher codes yet. Click &quot;Create New Code&quot; to add one.
                    </div>
                ) : (
                    <div className="bg-white rounded-[12px] shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 text-sm font-poppins font-semibold text-gray-500">Code</th>
                                    <th className="text-left px-4 py-3 text-sm font-poppins font-semibold text-gray-500">Discount</th>
                                    <th className="text-left px-4 py-3 text-sm font-poppins font-semibold text-gray-500">Usage</th>
                                    <th className="text-left px-4 py-3 text-sm font-poppins font-semibold text-gray-500">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-poppins font-semibold text-gray-500">Expires</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vouchers.map((v) => (
                                    <tr key={v.voucherId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4 font-poppins text-sm text-gray-800 font-bold">{v.code}</td>
                                        <td className="px-4 py-4 font-poppins text-sm text-gray-600">{v.discount}%</td>
                                        <td className="px-4 py-4 font-poppins text-sm text-gray-600">{v.usageCount}/{v.numberOfUsesAllowed}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 text-xs font-poppins font-semibold rounded-full ${v.voucherStatus === "Active"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}>
                                                {v.voucherStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 font-poppins text-sm text-gray-600">
                                            {v.expirationDate ? new Date(v.expirationDate).toLocaleDateString() : "Never"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateNewCodeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={() => {
                    setIsModalOpen(false);
                    fetchVouchers();
                }}
            />
        </div>
    );
}

interface CreateNewCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

function CreateNewCodeModal({ isOpen, onClose, onSaved }: CreateNewCodeModalProps) {
    const [formData, setFormData] = useState({
        code: '',
        discount: '',
        numberOfUsesAllowed: '',
        entityId: '',
        operatorUid: '',
        expirationDate: '',
        createdByUid: '',
    });
    const [entities, setEntities] = useState<EntityOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Fetch entities for the dropdown
    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            try {
                const res = await fetch(`${API_URL}/entities`);
                if (res.ok) {
                    const data = await res.json();
                    setEntities(data);
                }
            } catch (err) {
                console.error("Failed to fetch entities:", err);
            }
        })();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError(null);
    };

    const handleGenerate = () => {
        // Generate a random 8-char code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code }));
    };

    const handleSave = async () => {
        setError(null);
        setSubmitting(true);

        try {
            const payload = {
                code: formData.code,
                discount: parseInt(formData.discount) || 0,
                numberOfUsesAllowed: parseInt(formData.numberOfUsesAllowed) || 0,
                entityId: formData.entityId,
                createdByUid: formData.createdByUid,
                operatorUid: formData.operatorUid || undefined,
                expirationDate: formData.expirationDate || undefined,
            };

            const res = await fetch(`${API_URL}/voucher-codes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create voucher code");
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    code: '', discount: '', numberOfUsesAllowed: '',
                    entityId: '', operatorUid: '', expirationDate: '', createdByUid: '',
                });
                onSaved();
            }, 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Network error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-[890px] min-h-[509px] bg-white rounded-[20px] shadow-2xl p-8 md:p-10 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">

                {/* Header / Dismiss */}
                <div className="absolute top-6 right-6">
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Title */}
                <h2 className="text-[28px] font-semibold text-[#636363] font-poppins mb-4">
                    Create new code
                </h2>

                {/* Status Messages */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-[10px] text-red-700 font-poppins text-sm">
                        <AlertCircle size={18} className="flex-shrink-0" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-[10px] text-green-700 font-poppins text-sm">
                        <CheckCircle size={18} />
                        Voucher code created successfully!
                    </div>
                )}

                {/* Content Layout */}
                <div className="flex flex-col md:flex-row gap-8 lg:gap-[50px] flex-1">
                    {/* Left Column */}
                    <div className="flex flex-col gap-[24px] w-full md:w-1/2">

                        {/* Code + Generate */}
                        <div className="flex gap-2 sm:gap-[7px] items-end">
                            <div className="flex flex-col gap-2 flex-1">
                                <label className="text-[#525252] font-poppins font-medium text-sm">Code Value</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="Enter code (auto-uppercased)"
                                    disabled={submitting}
                                    className="w-full h-[37px] px-3 rounded-[9px] border-[2px] border-[#9D9D9D] focus:outline-none focus:border-[#178893] transition-colors font-poppins text-black uppercase disabled:opacity-50"
                                />
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={submitting}
                                className="h-[37px] w-[120px] bg-[#178893] hover:bg-[#13707a] text-white rounded-[10px] font-poppins font-medium transition-transform active:scale-95 shadow-sm text-sm disabled:opacity-50"
                            >
                                Generate
                            </button>
                        </div>

                        {/* Entity Dropdown */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#525252] font-poppins font-medium text-sm">Entity</label>
                            <div className="relative w-full">
                                <select
                                    name="entityId"
                                    value={formData.entityId}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    className="w-full h-[37px] pl-3 pr-8 rounded-[9px] border-[2px] border-[#9D9D9D] appearance-none focus:outline-none focus:border-[#7BCA0D] bg-white transition-colors font-poppins text-black cursor-pointer disabled:opacity-50"
                                >
                                    <option value="">Select Entity</option>
                                    {entities.map((ent) => (
                                        <option key={ent.entityId} value={ent.entityId}>
                                            {ent.entityName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9D9D9D] pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Discount */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#525252] font-poppins font-medium text-sm">Discount (%)</label>
                            <input
                                type="number"
                                name="discount"
                                min="1"
                                max="100"
                                value={formData.discount}
                                onChange={handleChange}
                                placeholder="e.g. 20"
                                disabled={submitting}
                                className="w-full sm:w-[150px] h-[37px] px-3 rounded-[9px] border-[2px] border-[#9D9D9D] focus:outline-none focus:border-[#7BCA0D] transition-colors font-poppins text-black disabled:opacity-50"
                            />
                        </div>

                        {/* Number of Users Allowed */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#525252] font-poppins font-medium text-sm">Max Users Allowed</label>
                            <input
                                type="number"
                                name="numberOfUsesAllowed"
                                min="1"
                                value={formData.numberOfUsesAllowed}
                                onChange={handleChange}
                                placeholder="e.g. 100"
                                disabled={submitting}
                                className="w-full sm:w-[150px] h-[37px] px-3 rounded-[9px] border-[2px] border-[#9D9D9D] focus:outline-none focus:border-[#7BCA0D] transition-colors font-poppins text-black disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-[24px] w-full md:w-1/2">

                        {/* Expiration Date */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#525252] font-poppins font-medium text-sm">Valid Until (optional)</label>
                            <input
                                type="date"
                                name="expirationDate"
                                value={formData.expirationDate}
                                onChange={handleChange}
                                disabled={submitting}
                                className="w-full h-[37px] px-3 rounded-[9px] border-[2px] border-[#9D9D9D] focus:outline-none focus:border-[#7BCA0D] transition-colors font-poppins text-black disabled:opacity-50"
                            />
                            <span className="text-xs text-gray-400 font-poppins">Leave empty for no expiration</span>
                        </div>

                        {/* Operator UID (optional) */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#525252] font-poppins font-medium text-sm">Linked Operator UID (optional)</label>
                            <input
                                type="text"
                                name="operatorUid"
                                value={formData.operatorUid}
                                onChange={handleChange}
                                placeholder="e.g. U002"
                                disabled={submitting}
                                className="w-full h-[37px] px-3 rounded-[9px] border-[2px] border-[#9D9D9D] focus:outline-none focus:border-[#7BCA0D] transition-colors font-poppins text-black disabled:opacity-50"
                            />
                            <span className="text-xs text-gray-400 font-poppins">If set, bookings using this code auto-assign to this operator</span>
                        </div>

                        {/* Created By UID */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#525252] font-poppins font-medium text-sm">Created By (Admin UID)</label>
                            <input
                                type="text"
                                name="createdByUid"
                                value={formData.createdByUid}
                                onChange={handleChange}
                                placeholder="e.g. admin user UID"
                                disabled={submitting}
                                className="w-full h-[37px] px-3 rounded-[9px] border-[2px] border-[#9D9D9D] focus:outline-none focus:border-[#7BCA0D] transition-colors font-poppins text-black disabled:opacity-50"
                            />
                            <span className="text-xs text-gray-400 font-poppins">Must be a user with &quot;admin&quot; role</span>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-center gap-4 sm:gap-[70px] mt-8 items-center">
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="w-full sm:w-[229px] h-[47px] bg-[#7BCA0D] hover:bg-[#68ab0b] text-white rounded-[12px] font-poppins font-semibold text-lg transition-transform active:scale-95 shadow-[0_4px_8px_rgba(123,202,13,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        className="w-full sm:w-[226px] h-[44px] bg-[#EDEDED] hover:bg-[#e0e0e0] border-[3px] border-[#929292] text-[#929292] hover:text-[#707070] hover:border-[#707070] rounded-[10.5px] font-poppins font-semibold text-lg transition-all active:scale-95 shadow-[0_4px_8px_rgba(146,146,146,0.3)] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
