'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, RefreshCw, Tag, Loader2, Copy, Check,
  Building2, Users, ChevronLeft, ChevronRight, Plus, X, AlertCircle, CheckCircle,
} from 'lucide-react';
import {
  collection, getDocs, query, where, Timestamp, addDoc, serverTimestamp, updateDoc, deleteDoc, doc, arrayUnion,
} from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';

const ROWS_PER_PAGE = 10;

interface VoucherCode {
  voucherId: string;
  code: string;
  discount: number;
  numberOfUsersAllowed: number;
  numberOfUsersUsed: number;
  operatorUid: string | null;
  expirationDate: string | null;
  voucherStatus: string;
  entityId: string;
  entityName?: string;
  createdAt?: string;
}

interface EntityOption {
  entityId: string;
  entityName: string;
  representative?: string;
  representativeEmail?: string;
  phoneNumber?: string;
}

type StatusFilter = 'All' | 'Active' | 'Expired';

function tsToIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return null;
}

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
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      title="Copy code"
      className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
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

function VoucherDetailPanel({
  voucher,
  savingStatus,
  deletingId,
  onStatusChange,
  onDelete,
}: {
  voucher: VoucherCode;
  savingStatus: boolean;
  deletingId: string | null;
  onStatusChange: (status: string) => void;
  onDelete: (voucherId: string) => void;
}) {
  const usagePct = voucher.numberOfUsersAllowed > 0
    ? Math.min(100, Math.round((voucher.numberOfUsersUsed / voucher.numberOfUsersAllowed) * 100))
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
          <DetailItem
            label="Expiration Date"
            value={formatDate(voucher.expirationDate)}
            highlight={voucher.expirationDate ? new Date(voucher.expirationDate) < new Date() : false}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Users size={12} /> Usage
            </span>
            <span className="text-xs font-bold text-gray-700">
              {voucher.numberOfUsersUsed} / {voucher.numberOfUsersAllowed}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePct >= 90 ? 'bg-red-400' : usagePct >= 60 ? 'bg-yellow-400' : 'bg-[#7BCA0D]'
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{usagePct}% used</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Change Status</label>
          <div className="flex gap-2">
            {['Active', 'Expired'].map((s) => (
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
          {deletingId === voucher.voucherId ? <Loader2 size={14} className="animate-spin" /> : 'Delete Voucher'}
        </button>
      </div>
    </div>
  );
}

function CreateOperatorVoucherModal({
  operatorUid,
  onClose,
  onSaved,
}: {
  operatorUid: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: '',
    discount: '',
    numberOfUsersAllowed: '',
    entityId: '',
    expirationDate: '',
  });
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      if (!operatorUid) return;
      try {
        const [createdSnap, associatedSnap] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'entities'), where('createdByUid', '==', operatorUid))),
          getDocs(query(collection(firebaseDb, 'entities'), where('associatedOperatorUids', 'array-contains', operatorUid))),
        ]);
        const merged = new Map<string, EntityOption>();
        [...createdSnap.docs, ...associatedSnap.docs].forEach((d) => {
          merged.set(d.id, {
            entityId: d.id,
            entityName: (d.data().entityName as string) ?? '',
          });
        });
        setEntities(
          Array.from(merged.values()),
        );
      } catch (err) {
        console.error('Failed to load entities:', err);
      }
    })();
  }, [operatorUid]);

  const handleGenerate = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generated = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm((prev) => ({ ...prev, code: generated }));
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      setError('Code is required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const dup = await getDocs(query(collection(firebaseDb, 'voucherCodes'), where('code', '==', form.code.trim())));
      if (!dup.empty) {
        setError('Code already exists');
        return;
      }

      await addDoc(collection(firebaseDb, 'voucherCodes'), {
        code: form.code.trim().toUpperCase(),
        discount: parseInt(form.discount, 10) || 0,
        numberOfUsersAllowed: parseInt(form.numberOfUsersAllowed, 10) || 0,
        numberOfUsersUsed: 0,
        operatorUid,
        entityId: form.entityId || null,
        expirationDate: form.expirationDate ? Timestamp.fromDate(new Date(form.expirationDate)) : null,
        voucherStatus: 'Active',
        createdByUid: operatorUid,
        createdAt: serverTimestamp(),
      });
      if (form.entityId) {
        await updateDoc(doc(firebaseDb, 'entities', form.entityId), {
          associatedOperatorUids: arrayUnion(operatorUid),
          updatedAt: serverTimestamp(),
        });
      }
      setSuccess(true);
      setTimeout(onSaved, 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save voucher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Create Voucher Code" onClose={onClose}>
      {error && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">Voucher created successfully.</AlertBanner>}

      <div className="space-y-4">
        <div>
          <label className="field-label">Code</label>
          <div className="flex gap-2">
            <input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              className="flex-1 field-input font-mono uppercase tracking-widest"
              placeholder="e.g. SUMMER25"
              disabled={submitting}
            />
            <button
              onClick={handleGenerate}
              disabled={submitting}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition border border-gray-200"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Discount (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={form.discount}
              onChange={(e) => setForm((prev) => ({ ...prev, discount: e.target.value }))}
              className="w-full field-input"
              placeholder="20"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="field-label">Max Uses</label>
            <input
              type="number"
              min="1"
              value={form.numberOfUsersAllowed}
              onChange={(e) => setForm((prev) => ({ ...prev, numberOfUsersAllowed: e.target.value }))}
              className="w-full field-input"
              placeholder="100"
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Affiliated Entity</label>
          <select
            value={form.entityId}
            onChange={(e) => setForm((prev) => ({ ...prev, entityId: e.target.value }))}
            className="w-full field-input"
            disabled={submitting}
          >
            <option value="">— Select entity —</option>
            {entities.map((e) => (
              <option key={e.entityId} value={e.entityId}>
                {e.entityName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">Expiration Date</label>
          <input
            type="date"
            value={form.expirationDate}
            onChange={(e) => setForm((prev) => ({ ...prev, expirationDate: e.target.value }))}
            className="w-full field-input"
            disabled={submitting}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-lg bg-[#7BCA0D] text-white font-semibold text-sm hover:bg-[#68ab0b] disabled:opacity-50 transition"
        >
          {submitting ? 'Saving…' : 'Create Voucher'}
        </button>
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

function CreateOperatorEntityModal({
  operatorUid,
  onClose,
  onSaved,
}: {
  operatorUid: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    entityName: '',
    representative: '',
    representativeEmail: '',
    phoneNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!form.entityName.trim()) {
      setError('Entity name is required');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await addDoc(collection(firebaseDb, 'entities'), {
        ...form,
        createdByUid: operatorUid,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(onSaved, 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save entity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Create Entity" onClose={onClose}>
      {error && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">Entity created successfully.</AlertBanner>}

      <div className="space-y-4">
        <div>
          <label className="field-label">Entity Name</label>
          <input
            value={form.entityName}
            onChange={(e) => setForm((prev) => ({ ...prev, entityName: e.target.value }))}
            className="w-full field-input"
            placeholder="e.g. TerraQuest Tours"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="field-label">Representative</label>
          <input
            value={form.representative}
            onChange={(e) => setForm((prev) => ({ ...prev, representative: e.target.value }))}
            className="w-full field-input"
            placeholder="Full name"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input
            type="email"
            value={form.representativeEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, representativeEmail: e.target.value }))}
            className="w-full field-input"
            placeholder="name@company.com"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="field-label">Phone Number</label>
          <input
            value={form.phoneNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            className="w-full field-input"
            placeholder="+63 9XX XXX XXXX"
            disabled={submitting}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-lg bg-[#7BCA0D] text-white font-semibold text-sm hover:bg-[#68ab0b] disabled:opacity-50 transition"
        >
          {submitting ? 'Saving…' : 'Create Entity'}
        </button>
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

function ManageEntitiesModal({
  operatorUid,
  onClose,
  onUpdated,
}: {
  operatorUid: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    entityName: '',
    representative: '',
    representativeEmail: '',
    phoneNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(firebaseDb, 'entities'), where('createdByUid', '==', operatorUid)));
      const rows = snap.docs.map((d) => ({
        entityId: d.id,
        entityName: (d.data().entityName as string) ?? '',
        representative: (d.data().representative as string) ?? '',
        representativeEmail: (d.data().representativeEmail as string) ?? '',
        phoneNumber: (d.data().phoneNumber as string) ?? '',
      }));
      setEntities(rows);
      if (rows.length > 0 && !selectedId) {
        setSelectedId(rows[0].entityId);
        setForm({
          entityName: rows[0].entityName,
          representative: rows[0].representative ?? '',
          representativeEmail: rows[0].representativeEmail ?? '',
          phoneNumber: rows[0].phoneNumber ?? '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedId, operatorUid]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = entities.find((e) => e.entityId === selectedId) ?? null;

  const pick = (entityId: string) => {
    const e = entities.find((x) => x.entityId === entityId);
    if (!e) return;
    setSelectedId(entityId);
    setForm({
      entityName: e.entityName,
      representative: e.representative ?? '',
      representativeEmail: e.representativeEmail ?? '',
      phoneNumber: e.phoneNumber ?? '',
    });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateDoc(doc(firebaseDb, 'entities', selected.entityId), {
        entityName: form.entityName.trim(),
        representative: form.representative.trim(),
        representativeEmail: form.representativeEmail.trim(),
        phoneNumber: form.phoneNumber.trim(),
        updatedAt: serverTimestamp(),
      });
      await load();
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!confirm(`Delete entity "${selected.entityName}"?`)) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(firebaseDb, 'entities', selected.entityId));
      await load();
      onUpdated();
      if (selectedId === selected.entityId) {
        const next = entities.find((e) => e.entityId !== selected.entityId) ?? null;
        setSelectedId(next?.entityId ?? null);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
          <X size={18} />
        </button>
        <h2 className="text-base font-bold text-gray-900 mb-5">Manage Entities</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">Entities</div>
            <div className="max-h-80 overflow-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Loading…</div>
              ) : entities.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No entities found.</div>
              ) : (
                entities.map((e) => (
                  <button
                    key={e.entityId}
                    type="button"
                    onClick={() => pick(e.entityId)}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      selectedId === e.entityId ? 'bg-green-50 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {e.entityName}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            {selected ? (
              <>
                <div>
                  <label className="field-label">Entity Name</label>
                  <input className="w-full field-input" value={form.entityName} onChange={(e) => setForm((p) => ({ ...p, entityName: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Representative</label>
                  <input className="w-full field-input" value={form.representative} onChange={(e) => setForm((p) => ({ ...p, representative: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input className="w-full field-input" value={form.representativeEmail} onChange={(e) => setForm((p) => ({ ...p, representativeEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Phone</label>
                  <input className="w-full field-input" value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} />
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg bg-[#7BCA0D] text-white text-sm font-semibold hover:bg-[#68ab0b] disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button onClick={remove} disabled={deleting} className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
                    {deleting ? 'Deleting…' : 'Delete Entity'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Select an entity to edit or delete.</p>
            )}
          </div>
        </div>
      </div>
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

export default function OperatorVoucherCodesPage() {
  const { authState } = useAuth();
  const operatorUid = authState.status === 'authenticated' ? authState.user.uid : null;

  const [isCreateVoucherOpen, setIsCreateVoucherOpen] = useState(false);
  const [isCreateEntityOpen, setIsCreateEntityOpen] = useState(false);
  const [isManageEntitiesOpen, setIsManageEntitiesOpen] = useState(false);
  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherCode | null>(null);
  const [deletingVoucherId, setDeletingVoucherId] = useState<string | null>(null);
  const [savingVoucherStatus, setSavingVoucherStatus] = useState(false);

  const fetchVouchers = useCallback(async () => {
    if (!operatorUid) return;
    setLoading(true);
    try {
      const [createdEntitiesSnap, associatedEntitiesSnap, assignedSnap, globalSnap] = await Promise.all([
        getDocs(query(collection(firebaseDb, 'entities'), where('createdByUid', '==', operatorUid))),
        getDocs(query(collection(firebaseDb, 'entities'), where('associatedOperatorUids', 'array-contains', operatorUid))),
        getDocs(query(collection(firebaseDb, 'voucherCodes'), where('operatorUid', '==', operatorUid))),
        getDocs(query(collection(firebaseDb, 'voucherCodes'), where('operatorUid', '==', null))),
      ]);

      const entityMap = new Map<string, string>();
      [...createdEntitiesSnap.docs, ...associatedEntitiesSnap.docs].forEach((d) => {
        entityMap.set(d.id, (d.data().entityName as string) ?? '');
      });

      const seen = new Set<string>();
      const allDocs = [...assignedSnap.docs, ...globalSnap.docs].filter(d => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });

      const data: VoucherCode[] = allDocs.map(d => {
        const v = d.data();
        return {
          voucherId: d.id,
          code: v.code ?? '',
          discount: Number(v.discount) || 0,
          numberOfUsersAllowed: Number(v.numberOfUsersAllowed) || 0,
          numberOfUsersUsed: Number(v.numberOfUsersUsed) || 0,
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
      console.error('Failed to fetch vouchers:', err);
    } finally {
      setLoading(false);
    }
  }, [operatorUid]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const filtered = useMemo(() => vouchers.filter(v => {
    const matchSearch = v.code.toLowerCase().includes(search.toLowerCase()) ||
      (v.entityName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || v.voucherStatus === statusFilter;
    return matchSearch && matchStatus;
  }), [vouchers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const activeCount = vouchers.filter(v => v.voucherStatus === 'Active').length;
  const expiredCount = vouchers.filter(v => v.voucherStatus !== 'Active').length;

  const handleVoucherStatusChange = async (newStatus: string) => {
    if (!selectedVoucher) return;
    setSavingVoucherStatus(true);
    try {
      await updateDoc(doc(firebaseDb, 'voucherCodes', selectedVoucher.voucherId), {
        voucherStatus: newStatus,
      });
      const updated = { ...selectedVoucher, voucherStatus: newStatus };
      setSelectedVoucher(updated);
      setVouchers((prev) => prev.map((v) => (v.voucherId === updated.voucherId ? updated : v)));
    } catch (err) {
      console.error('Failed to update voucher status:', err);
    } finally {
      setSavingVoucherStatus(false);
    }
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('Delete this voucher code?')) return;
    setDeletingVoucherId(voucherId);
    try {
      await deleteDoc(doc(firebaseDb, 'voucherCodes', voucherId));
      setVouchers((prev) => prev.filter((v) => v.voucherId !== voucherId));
      setSelectedVoucher((prev) => (prev?.voucherId === voucherId ? null : prev));
    } catch (err) {
      console.error('Delete voucher failed:', err);
    } finally {
      setDeletingVoucherId(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900">Voucher Codes</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateEntityOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-[#558B2F] px-3 py-2 text-sm font-medium text-[#558B2F] hover:bg-green-50 transition-colors"
          >
            <Plus size={14} />
            Add Entity
          </button>
          <button
            type="button"
            onClick={() => setIsManageEntitiesOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Manage Entities
          </button>
          <button
            type="button"
            onClick={() => setIsCreateVoucherOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#558B2F] px-3 py-2 text-sm font-medium text-white hover:bg-[#4a7a28] transition-colors"
          >
            <Plus size={14} />
            Add Voucher
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* List panel */}
        <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Search by:</span>
            <div className="relative w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
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
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
            {(['All', 'Active', 'Expired'] as StatusFilter[]).map(f => (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setPage(1); }}
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
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400 gap-2">
                  <Tag size={28} className="text-gray-300" />
                  No voucher codes assigned to you yet.
                </div>
              ) : paginated.map(v => (
                <button
                  key={v.voucherId}
                  type="button"
                  onClick={() => setSelectedVoucher(v)}
                  className={`w-full grid grid-cols-[2fr_1fr_2fr_1.5fr_1.2fr] items-center px-4 py-3 text-left transition-colors ${
                    selectedVoucher?.voucherId === v.voucherId
                      ? 'bg-green-50 border-l-2 border-l-[#7BCA0D]'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                  }`}
                >
                  <span className="font-mono font-bold text-sm text-gray-900 tracking-wide">{v.code}</span>
                  <span className="text-sm text-gray-700 font-medium">
                    {v.discount === 100 ? <span className="text-green-600 font-bold">Free</span> : `${v.discount}%`}
                  </span>
                  <span className="text-sm text-gray-600 truncate pr-2">
                    {v.entityName || <span className="text-gray-400 italic">No entity</span>}
                  </span>
                  <span className="text-sm text-gray-500">{formatDate(v.expirationDate)}</span>
                  <StatusBadge status={v.voucherStatus} />
                </button>
              ))}
            </div>
          </div>

          {filtered.length > ROWS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/60">
              <p className="text-xs text-gray-500">
                {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`h-7 min-w-7 rounded-md px-2 text-xs font-semibold transition ${
                      page === pg ? 'bg-[#7BCA0D] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                    }`}>
                    {pg}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          {selectedVoucher ? (
            <VoucherDetailPanel
              voucher={selectedVoucher}
              savingStatus={savingVoucherStatus}
              deletingId={deletingVoucherId}
              onStatusChange={handleVoucherStatusChange}
              onDelete={handleDeleteVoucher}
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center gap-3 text-gray-400">
              <Tag size={32} className="text-gray-300" />
              <p className="text-sm text-center px-6">Select a voucher code to view details</p>
            </div>
          )}
        </div>
      </div>

      {isCreateVoucherOpen && operatorUid && (
        <CreateOperatorVoucherModal
          operatorUid={operatorUid}
          onClose={() => setIsCreateVoucherOpen(false)}
          onSaved={() => {
            setIsCreateVoucherOpen(false);
            fetchVouchers();
          }}
        />
      )}

      {isCreateEntityOpen && operatorUid && (
        <CreateOperatorEntityModal
          operatorUid={operatorUid}
          onClose={() => setIsCreateEntityOpen(false)}
          onSaved={() => {
            setIsCreateEntityOpen(false);
            fetchVouchers();
          }}
        />
      )}

      {isManageEntitiesOpen && operatorUid && (
        <ManageEntitiesModal
          operatorUid={operatorUid}
          onClose={() => setIsManageEntitiesOpen(false)}
          onUpdated={() => {
            fetchVouchers();
          }}
        />
      )}
    </div>
  );
}
