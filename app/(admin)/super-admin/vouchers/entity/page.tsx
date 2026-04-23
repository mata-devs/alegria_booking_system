"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Loader2, CheckCircle, AlertCircle, Plus, Search,
    ChevronLeft, ChevronRight, Check, Trash2,
    Building2, RefreshCw
} from 'lucide-react';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';

const ROWS_PER_PAGE = 10;

interface EntityResponse {
    entityId: string;
    entityName: string;
    representative: string;
    representativeEmail: string;
    phoneNumber: string;
}

export default function Page() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entities, setEntities] = useState<EntityResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState<EntityResponse | null>(null);
    const [searchEntity, setSearchEntity] = useState('');
    const [entityPage, setEntityPage] = useState(1);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchEntities = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(firebaseDb, 'entities'));
            const data: EntityResponse[] = snap.docs.map(d => {
                const e = d.data();
                return {
                    entityId: d.id,
                    entityName: e.entityName ?? '',
                    representative: e.representative ?? '',
                    representativeEmail: e.representativeEmail ?? '',
                    phoneNumber: e.phoneNumber ?? '',
                };
            });
            setEntities(data);
            if (data.length > 0) setSelectedEntity(data[0]);
        } catch (err) {
            console.error("Failed to fetch entities:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEntities(); }, [fetchEntities]);

    const filteredEntities = entities.filter(e =>
        e.entityName.toLowerCase().includes(searchEntity.toLowerCase()) ||
        e.representative.toLowerCase().includes(searchEntity.toLowerCase())
    );

    const entityTotalPages = Math.max(1, Math.ceil(filteredEntities.length / ROWS_PER_PAGE));
    const paginatedEntities = filteredEntities.slice((entityPage - 1) * ROWS_PER_PAGE, entityPage * ROWS_PER_PAGE);

    const handleDeleteEntity = async (entityId: string) => {
        if (!confirm('Delete this entity?')) return;
        setDeletingId(entityId);
        try {
            await deleteDoc(doc(firebaseDb, 'entities', entityId));
            await fetchEntities();
            setSelectedEntity(null);
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setDeletingId(null);
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
                                value={searchEntity}
                                onChange={e => { setSearchEntity(e.target.value); setEntityPage(1); }}
                                className="w-full rounded-md border border-gray-300 py-1 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F] transition"
                            />
                        </div>

                        <button
                            onClick={fetchEntities}
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
                            Add New Entity
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-[2fr_2fr_2fr_1.5fr] px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <span>Entity Name</span>
                            <span>Representative</span>
                            <span>Email</span>
                            <span>Phone</span>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
                                    <Loader2 className="animate-spin" size={16} /> Loading…
                                </div>
                            ) : filteredEntities.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400 gap-2">
                                    <Building2 size={28} className="text-gray-300" />
                                    No entities found.
                                </div>
                            ) : paginatedEntities.map(e => (
                                <button
                                    key={e.entityId}
                                    type="button"
                                    onClick={() => setSelectedEntity(e)}
                                    className={`w-full grid grid-cols-[2fr_2fr_2fr_1.5fr] items-center px-4 py-3 text-left transition-colors ${
                                        selectedEntity?.entityId === e.entityId
                                            ? 'bg-green-50 border-l-2 border-l-[#7BCA0D]'
                                            : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                                    }`}
                                >
                                    <span className="text-sm font-semibold text-gray-900">{e.entityName}</span>
                                    <span className="text-sm text-gray-700">{e.representative}</span>
                                    <span className="text-sm text-gray-500 truncate pr-2">{e.representativeEmail}</span>
                                    <span className="text-sm text-gray-500">{e.phoneNumber}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredEntities.length > ROWS_PER_PAGE && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                            <p className="text-xs text-gray-500">
                                {(entityPage - 1) * ROWS_PER_PAGE + 1}–{Math.min(entityPage * ROWS_PER_PAGE, filteredEntities.length)} of {filteredEntities.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setEntityPage(p => Math.max(1, p - 1))}
                                    disabled={entityPage === 1}
                                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                {Array.from({ length: entityTotalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setEntityPage(page)}
                                        className={`h-7 min-w-7 rounded-md px-2 text-xs font-semibold transition ${
                                            entityPage === page
                                                ? 'bg-[#7BCA0D] text-white shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setEntityPage(p => Math.min(entityTotalPages, p + 1))}
                                    disabled={entityPage === entityTotalPages}
                                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                    {selectedEntity ? (
                        <EntityDetailPanel
                            entity={selectedEntity}
                            deletingId={deletingId}
                            onDelete={handleDeleteEntity}
                            onUpdated={fetchEntities}
                        />
                    ) : (
                        <EmptyDetailPanel icon={<Building2 size={32} className="text-gray-300" />} text="Select an entity to view details" />
                    )}
                </div>
            </div>

            {isModalOpen && (
                <CreateEntityModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaved={() => { setIsModalOpen(false); fetchEntities(); }}
                />
            )}
        </div>
    );
}

function EntityDetailPanel({
    entity, deletingId, onDelete, onUpdated
}: {
    entity: EntityResponse;
    deletingId: string | null;
    onDelete: (id: string) => void;
    onUpdated: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ ...entity });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setForm({ ...entity });
        setEditing(false);
    }, [entity.entityId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(firebaseDb, 'entities', entity.entityId), {
                entityName: form.entityName,
                representative: form.representative,
                representativeEmail: form.representativeEmail,
                phoneNumber: form.phoneNumber,
                updatedAt: serverTimestamp(),
            });
            setSaved(true);
            setEditing(false);
            onUpdated();
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Update failed:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Entity Details</p>
                    <p className="font-bold text-gray-900 mt-0.5 text-base">{entity.entityName}</p>
                </div>
                <button
                    onClick={() => { setEditing(e => !e); setForm({ ...entity }); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        editing
                            ? 'bg-gray-100 text-gray-600 border-gray-200'
                            : 'bg-white text-[#7BCA0D] border-[#7BCA0D] hover:bg-green-50'
                    }`}
                >
                    {editing ? 'Cancel' : 'Edit'}
                </button>
            </div>

            <div className="flex-1 p-5 space-y-4 overflow-auto">
                {saved && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        <CheckCircle size={15} /> Saved successfully!
                    </div>
                )}

                {editing ? (
                    <div className="space-y-3">
                        {[
                            { key: 'entityName', label: 'Entity Name' },
                            { key: 'representative', label: 'Representative' },
                            { key: 'representativeEmail', label: 'Email', type: 'email' },
                            { key: 'phoneNumber', label: 'Phone' },
                        ].map(f => (
                            <div key={f.key}>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                                <input
                                    type={f.type || 'text'}
                                    value={form[f.key as keyof EntityResponse]}
                                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#7BCA0D] focus:outline-none focus:ring-1 focus:ring-[#7BCA0D] bg-gray-50 focus:bg-white transition"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <DetailItem label="Entity Name" value={entity.entityName} icon={<Building2 size={14} />} />
                        <DetailItem label="Representative" value={entity.representative} />
                        <DetailItem label="Email" value={entity.representativeEmail} />
                        <DetailItem label="Phone" value={entity.phoneNumber} />
                    </div>
                )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60 flex gap-2">
                {editing ? (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2 rounded-lg bg-[#7BCA0D] text-white text-sm font-semibold hover:bg-[#68ab0b] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                ) : (
                    <button
                        onClick={() => onDelete(entity.entityId)}
                        disabled={deletingId === entity.entityId}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                        {deletingId === entity.entityId
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />}
                        Delete Entity
                    </button>
                )}
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

interface CreateEntityModalProps { isOpen: boolean; onClose: () => void; onSaved: () => void; }

function CreateEntityModal({ isOpen, onClose, onSaved }: CreateEntityModalProps) {
    const [formData, setFormData] = useState({ entityName: '', representative: '', representativeEmail: '', phoneNumber: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSave = async () => {
        if (!formData.entityName) { setError('Entity name is required'); return; }
        setError(null);
        setSubmitting(true);
        try {
            await addDoc(collection(firebaseDb, 'entities'), {
                ...formData,
                createdAt: serverTimestamp(),
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({ entityName: '', representative: '', representativeEmail: '', phoneNumber: '' });
                onSaved();
            }, 1400);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell title="Create New Entity" onClose={onClose}>
            {error && <AlertBanner type="error">{error}</AlertBanner>}
            {success && <AlertBanner type="success">Entity created successfully!</AlertBanner>}

            <div className="space-y-4">
                {[
                    { name: 'entityName', label: 'Entity Name', placeholder: 'e.g. TerraQuest Tours' },
                    { name: 'representative', label: 'Representative', placeholder: 'Full name' },
                    { name: 'representativeEmail', label: 'Email', type: 'email', placeholder: 'name@company.com' },
                    { name: 'phoneNumber', label: 'Phone Number', placeholder: '+63 9XX XXX XXXX' },
                ].map(f => (
                    <div key={f.name}>
                        <label className="field-label">{f.label}</label>
                        <input type={f.type || 'text'} name={f.name} value={formData[f.name as keyof typeof formData]}
                            onChange={handleChange} placeholder={f.placeholder} disabled={submitting} className="w-full field-input" />
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mt-5">
                <button onClick={handleSave} disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-[#7BCA0D] text-white font-semibold text-sm hover:bg-[#68ab0b] disabled:opacity-50 transition flex items-center justify-center gap-2">
                    {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Create Entity'}
                </button>
                <button onClick={onClose} disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition">
                    Cancel
                </button>
            </div>
        </ModalShell>
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
