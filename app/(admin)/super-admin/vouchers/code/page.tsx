"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    X, Loader2, CheckCircle, AlertCircle, Plus, Search,
    ChevronLeft, ChevronRight, Copy, Check, Trash2,
    Tag, Building2, RefreshCw, Users, ChevronDown
} from 'lucide-react';
import {
    collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc,
    serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';

const ROWS_PER_PAGE = 10;

function tsToIso(v: unknown): string | null {
    if (!v) return null;
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString();
    return null;
}

interface EntityOption {
    entityId: string;
    entityName: string;
}

interface OperatorOption {
    uid: string;
    firstName: string;
    lastName: string;
    operatorId: string;
    email: string;
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
    entityName?: string;
    createdAt?: string;
}

type StatusFilter = 'All' | 'Active' | 'Expired';

function formatDate(date: string | null | undefined) {
    if (!date) return '—';
    try {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return date; }
}

function StatusBadge({ status }: { status: string }) {
    const isActive = status === 'Active';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-400'}`} />
            {status}
        </span>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    return (
        <button
            onClick={handleCopy}
            title="Copy code"
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
    );
}

export default function Page() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherResponse | null>(null);
    const [searchCode, setSearchCode] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
    const [codePage, setCodePage] = useState(1);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [savingStatus, setSavingStatus] = useState(false);

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        try {
            const [voucherSnap, entitySnap] = await Promise.all([
                getDocs(collection(firebaseDb, 'voucherCodes')),
                getDocs(collection(firebaseDb, 'entities')),
            ]);
            const entityMap = new Map<string, string>();
            entitySnap.docs.forEach(d => entityMap.set(d.id, (d.data().entityName as string) ?? ''));

            const data: VoucherResponse[] = voucherSnap.docs.map(d => {
                const v = d.data();
                return {
                    voucherId: d.id,
                    code: v.code ?? '',
                    discount: Number(v.discount) || 0,
                    numberOfUsesAllowed: Number(v.numberOfUsersAllowed) || 0,
                    usageCount: Number(v.numberOfUsersUsed) || 0,
                    operatorUid: v.operatorUid ?? null,
                    expirationDate: tsToIso(v.expirationDate),
                    voucherStatus: v.voucherStatus ?? 'Active',
                    entityId: v.entityId ?? '',
                    entityName: entityMap.get(v.entityId) ?? '',
                    createdAt: tsToIso(v.createdAt) ?? undefined,
                };
            });
            setVouchers(data);
            if (data.length > 0) setSelectedVoucher(data[0]);
        } catch (err) {
            console.error("Failed to fetch voucher codes:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

    const filteredVouchers = vouchers.filter(v => {
        const matchSearch = v.code.toLowerCase().includes(searchCode.toLowerCase()) ||
            (v.entityName || '').toLowerCase().includes(searchCode.toLowerCase());
        const matchStatus = statusFilter === 'All' || v.voucherStatus === statusFilter;
        return matchSearch && matchStatus;
    });

    const codeTotalPages = Math.max(1, Math.ceil(filteredVouchers.length / ROWS_PER_PAGE));
    const paginatedCodes = filteredVouchers.slice((codePage - 1) * ROWS_PER_PAGE, codePage * ROWS_PER_PAGE);

    const activeCount = vouchers.filter(v => v.voucherStatus === 'Active').length;
    const expiredCount = vouchers.filter(v => v.voucherStatus !== 'Active').length;

    const handleDeleteVoucher = async (voucherId: string) => {
        if (!confirm('Delete this voucher code?')) return;
        setDeletingId(voucherId);
        try {
            await deleteDoc(doc(firebaseDb, 'voucherCodes', voucherId));
            await fetchVouchers();
            setSelectedVoucher(null);
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedVoucher) return;
        setSavingStatus(true);
        try {
            await updateDoc(doc(firebaseDb, 'voucherCodes', selectedVoucher.voucherId), {
                voucherStatus: newStatus,
            });
            const updated = { ...selectedVoucher, voucherStatus: newStatus };
            setSelectedVoucher(updated);
            setVouchers(prev => prev.map(v => v.voucherId === updated.voucherId ? updated : v));
        } catch (err) {
            console.error("Status update failed:", err);
        } finally {
            setSavingStatus(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
                <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
                        <span className="text-sm text-gray-600 font-medium">Search by:</span>

                        <div className="relative w-56">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchCode}
                                onChange={e => { setSearchCode(e.target.value); setCodePage(1); }}
                                className="w-full rounded-md border border-gray-300 py-1 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F] transition"
                            />
                        </div>

                        <button
                            onClick={fetchVouchers}
                            title="Refresh"
                            className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <RefreshCw size={15} />
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="ml-auto inline-flex items-center gap-2 rounded-md bg-[#558B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a7a28] transition-colors"
                        >
                            <Plus size={16} />
                            Add New Voucher
                        </button>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
                        {(['All', 'Active', 'Expired'] as StatusFilter[]).map(f => (
                            <button
                                key={f}
                                onClick={() => { setStatusFilter(f); setCodePage(1); }}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    statusFilter === f
                                        ? f === 'Active'
                                            ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                                            : f === 'Expired'
                                                ? 'bg-red-100 text-red-600 ring-1 ring-red-200'
                                                : 'bg-[#7BCA0D] text-white'
                                        : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {f}
                                {f === 'Active' && <span className="ml-1 opacity-70">{activeCount}</span>}
                                {f === 'Expired' && <span className="ml-1 opacity-70">{expiredCount}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-[2fr_1fr_2fr_1.5fr_1.2fr] px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <span>Code</span>
                            <span>Discount</span>
                            <span>Entity</span>
                            <span>Expires</span>
                            <span>Status</span>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
                                    <Loader2 className="animate-spin" size={16} /> Loading…
                                </div>
                            ) : filteredVouchers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400 gap-2">
                                    <Tag size={28} className="text-gray-300" />
                                    No voucher codes found.
                                </div>
                            ) : paginatedCodes.map(v => (
                                <button
                                    key={v.voucherId}
                                    type="button"
                                    onClick={() => setSelectedVoucher(v)}
                                    className={`w-full grid grid-cols-[2fr_1fr_2fr_1.5fr_1.2fr] items-center px-4 py-3 text-left transition-colors group ${
                                        selectedVoucher?.voucherId === v.voucherId
                                            ? 'bg-green-50 border-l-2 border-l-[#7BCA0D]'
                                            : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                                    }`}
                                >
                                    <span className="font-mono font-bold text-sm text-gray-900 tracking-wide">{v.code}</span>
                                    <span className="text-sm text-gray-700 font-medium">
                                        {v.discount === 100 ? (
                                            <span className="text-green-600 font-bold">Free</span>
                                        ) : `${v.discount}%`}
                                    </span>
                                    <span className="text-sm text-gray-600 truncate pr-2">{v.entityName || <span className="text-gray-400 italic">No entity</span>}</span>
                                    <span className="text-sm text-gray-500">{formatDate(v.expirationDate)}</span>
                                    <StatusBadge status={v.voucherStatus} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredVouchers.length > ROWS_PER_PAGE && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                            <p className="text-xs text-gray-500">
                                {(codePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(codePage * ROWS_PER_PAGE, filteredVouchers.length)} of {filteredVouchers.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCodePage(p => Math.max(1, p - 1))}
                                    disabled={codePage === 1}
                                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                {Array.from({ length: codeTotalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCodePage(page)}
                                        className={`h-7 min-w-7 rounded-md px-2 text-xs font-semibold transition ${
                                            codePage === page
                                                ? 'bg-[#7BCA0D] text-white shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCodePage(p => Math.min(codeTotalPages, p + 1))}
                                    disabled={codePage === codeTotalPages}
                                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                    {selectedVoucher ? (
                        <VoucherDetailPanel
                            voucher={selectedVoucher}
                            savingStatus={savingStatus}
                            deletingId={deletingId}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteVoucher}
                        />
                    ) : (
                        <EmptyDetailPanel icon={<Tag size={32} className="text-gray-300" />} text="Select a voucher code to view details" />
                    )}
                </div>
            </div>

            {isModalOpen && (
                <CreateCodeModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaved={() => { setIsModalOpen(false); fetchVouchers(); }}
                />
            )}
        </div>
    );
}

function VoucherDetailPanel({
    voucher, savingStatus, deletingId, onStatusChange, onDelete
}: {
    voucher: VoucherResponse;
    savingStatus: boolean;
    deletingId: string | null;
    onStatusChange: (s: string) => void;
    onDelete: (id: string) => void;
}) {
    const usagePct = voucher.numberOfUsesAllowed > 0
        ? Math.min(100, Math.round((voucher.usageCount / voucher.numberOfUsesAllowed) * 100))
        : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Voucher Details</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-lg text-gray-900 tracking-wider">{voucher.code}</span>
                        <CopyButton text={voucher.code} />
                    </div>
                </div>
                <StatusBadge status={voucher.voucherStatus} />
            </div>

            <div className="flex-1 p-5 space-y-5 overflow-auto">
                <div className="rounded-lg bg-gradient-to-br from-[#f0fde4] to-[#e4f9c8] border border-green-200 p-4 text-center">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Discount</p>
                    <p className="text-3xl font-extrabold text-[#4a8c00]">
                        {voucher.discount === 100 ? 'FREE' : `${voucher.discount}%`}
                    </p>
                </div>

                <div className="space-y-3">
                    <DetailItem label="Affiliated Entity" value={voucher.entityName || '—'} icon={<Building2 size={14} />} />
                    <DetailItem label="Created" value={formatDate(voucher.createdAt)} />
                    <DetailItem label="Expiration Date" value={formatDate(voucher.expirationDate)} highlight={
                        voucher.expirationDate ? new Date(voucher.expirationDate) < new Date() : false
                    } />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <Users size={12} /> Usage
                        </span>
                        <span className="text-xs font-bold text-gray-700">{voucher.usageCount} / {voucher.numberOfUsesAllowed}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-400' : usagePct >= 60 ? 'bg-yellow-400' : 'bg-[#7BCA0D]'}`}
                            style={{ width: `${usagePct}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{usagePct}% used</p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Change Status</label>
                    <div className="flex gap-2">
                        {['Active', 'Expired'].map(s => (
                            <button
                                key={s}
                                onClick={() => onStatusChange(s)}
                                disabled={savingStatus || voucher.voucherStatus === s}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 ${
                                    voucher.voucherStatus === s
                                        ? s === 'Active'
                                            ? 'bg-green-100 text-green-700 border-green-300 cursor-default'
                                            : 'bg-red-100 text-red-600 border-red-200 cursor-default'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                {savingStatus ? <Loader2 size={12} className="animate-spin mx-auto" /> : s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60">
                <button
                    onClick={() => onDelete(voucher.voucherId)}
                    disabled={deletingId === voucher.voucherId}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                    {deletingId === voucher.voucherId
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    Delete Code
                </button>
            </div>
        </div>
    );
}

function DetailItem({ label, value, icon, highlight }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                {icon}{label}
            </span>
            <span className={`text-sm font-medium ${highlight ? 'text-red-500' : 'text-gray-800'}`}>{value}</span>
        </div>
    );
}

function EmptyDetailPanel({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            {icon}
            <p className="text-sm text-center px-6">{text}</p>
        </div>
    );
}

interface CreateCodeModalProps { isOpen: boolean; onClose: () => void; onSaved: () => void; }

function CreateCodeModal({ isOpen, onClose, onSaved }: CreateCodeModalProps) {
    const { authState } = useAuth();
    const superAdminUid = authState.status === 'authenticated' ? authState.user.uid : null;

    const [formData, setFormData] = useState({
        code: '', discount: '', numberOfUsesAllowed: '',
        entityId: '', operatorUid: '', expirationDate: '',
    });
    const [entities, setEntities] = useState<EntityOption[]>([]);
    const [operators, setOperators] = useState<OperatorOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        (async () => {
            try {
                const snap = await getDocs(collection(firebaseDb, 'entities'));
                setEntities(snap.docs.map(d => ({
                    entityId: d.id,
                    entityName: (d.data().entityName as string) ?? '',
                })));
            } catch (err) {
                console.error('Failed to load entities:', err);
            }
        })();

        (async () => {
            try {
                const q = query(
                    collection(firebaseDb, 'users'),
                    where('role', '==', 'operator'),
                    where('status', '==', 'active'),
                );
                const snap = await getDocs(q);
                setOperators(snap.docs.map(d => {
                    const data = d.data();
                    return {
                        uid: d.id,
                        firstName: data.firstName ?? '',
                        lastName: data.lastName ?? '',
                        operatorId: data.operatorId ?? d.id,
                        email: data.email ?? '',
                    };
                }));
            } catch (err) {
                console.error('Failed to load operators:', err);
            }
        })();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleGenerate = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        setFormData(prev => ({ ...prev, code: Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') }));
    };

    const handleSave = async () => {
        if (!formData.code) { setError('Code is required'); return; }
        if (!superAdminUid) { setError('Not authenticated'); return; }
        setError(null);
        setSubmitting(true);
        try {
            const dupSnap = await getDocs(query(
                collection(firebaseDb, 'voucherCodes'),
                where('code', '==', formData.code.trim()),
            ));
            if (!dupSnap.empty) { setError('Code already exists'); return; }

            await addDoc(collection(firebaseDb, 'voucherCodes'), {
                code: formData.code.trim(),
                discount: parseInt(formData.discount) || 0,
                numberOfUsersAllowed: parseInt(formData.numberOfUsesAllowed) || 0,
                numberOfUsersUsed: 0,
                entityId: formData.entityId || null,
                createdByUid: superAdminUid,
                operatorUid: formData.operatorUid || null,
                expirationDate: formData.expirationDate ? Timestamp.fromDate(new Date(formData.expirationDate)) : null,
                voucherStatus: 'Active',
                createdAt: serverTimestamp(),
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({ code: '', discount: '', numberOfUsesAllowed: '', entityId: '', operatorUid: '', expirationDate: '' });
                onSaved();
            }, 1400);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell title="Create New Voucher Code" onClose={onClose}>
            {error && <AlertBanner type="error">{error}</AlertBanner>}
            {success && <AlertBanner type="success">Voucher created successfully!</AlertBanner>}

            <div className="space-y-4">
                <div>
                    <label className="field-label">Code</label>
                    <div className="flex gap-2">
                        <input name="code" value={formData.code} onChange={handleChange} placeholder="e.g. SUMMER25" disabled={submitting}
                            className="flex-1 field-input font-mono uppercase tracking-widest" />
                        <button onClick={handleGenerate} disabled={submitting}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition border border-gray-200 whitespace-nowrap">
                            Generate
                        </button>
                    </div>
                </div>

                <div>
                    <label className="field-label">Affiliated Entity</label>
                    <select name="entityId" value={formData.entityId} onChange={handleChange} disabled={submitting} className="w-full field-input">
                        <option value="">— Select entity —</option>
                        {entities.map(e => <option key={e.entityId} value={e.entityId}>{e.entityName}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="field-label">Discount (%)</label>
                        <input type="number" name="discount" min="1" max="100" value={formData.discount} onChange={handleChange}
                            placeholder="20" disabled={submitting} className="w-full field-input" />
                    </div>
                    <div>
                        <label className="field-label">Max Uses</label>
                        <input type="number" name="numberOfUsesAllowed" min="1" value={formData.numberOfUsesAllowed} onChange={handleChange}
                            placeholder="100" disabled={submitting} className="w-full field-input" />
                    </div>
                </div>

                <div>
                    <label className="field-label">Expiration Date</label>
                    <input type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange}
                        disabled={submitting} className="w-full field-input" />
                </div>

                <div>
                    <label className="field-label">Operator <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                    <OperatorSearchSelect
                        operators={operators}
                        value={formData.operatorUid}
                        onChange={(uid) => setFormData(prev => ({ ...prev, operatorUid: uid }))}
                        disabled={submitting}
                    />
                </div>
            </div>

            <div className="flex gap-2 mt-5">
                <button onClick={handleSave} disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-[#7BCA0D] text-white font-semibold text-sm hover:bg-[#68ab0b] disabled:opacity-50 transition flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Create Code'}
                </button>
                <button onClick={onClose} disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition">
                    Cancel
                </button>
            </div>
        </ModalShell>
    );
}

function OperatorSearchSelect({
    operators, value, onChange, disabled,
}: {
    operators: OperatorOption[];
    value: string;
    onChange: (uid: string) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = useMemo(() => operators.find(o => o.uid === value) || null, [operators, value]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const filtered = useMemo(() => {
        const q = term.trim().toLowerCase();
        if (!q) return operators;
        return operators.filter(o =>
            `${o.firstName} ${o.lastName}`.toLowerCase().includes(q) ||
            o.operatorId.toLowerCase().includes(q) ||
            o.email.toLowerCase().includes(q),
        );
    }, [operators, term]);

    const label = selected
        ? `${selected.firstName} ${selected.lastName} (${selected.operatorId})`
        : '';

    return (
        <div ref={containerRef} className="relative">
            {selected ? (
                <div className="flex items-center gap-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
                    <span className="flex-1 truncate text-gray-800">{label}</span>
                    <button
                        type="button"
                        onClick={() => { onChange(''); setTerm(''); setOpen(true); }}
                        disabled={disabled}
                        className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        title="Clear"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={term}
                        onFocus={() => setOpen(true)}
                        onChange={e => { setTerm(e.target.value); setOpen(true); }}
                        placeholder="Search operator by name, ID, or email"
                        disabled={disabled}
                        className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
                    />
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            )}

            {open && !selected && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">No active operators found.</div>
                    ) : filtered.map(op => (
                        <button
                            key={op.uid}
                            type="button"
                            onClick={() => { onChange(op.uid); setOpen(false); setTerm(''); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                        >
                            <div className="font-medium text-gray-800">{op.firstName} {op.lastName}</div>
                            <div className="text-xs text-gray-500">{op.operatorId}{op.email ? ` • ${op.email}` : ''}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                    <X size={18} />
                </button>
                <h2 className="text-base font-bold text-gray-900 mb-5">{title}</h2>
                {children}
            </div>
        </div>
    );
}

function AlertBanner({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
    return (
        <div className={`mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border ${
            type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
            {type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            {children}
        </div>
    );
}
