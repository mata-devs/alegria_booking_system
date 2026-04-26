'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, Ticket, X } from 'lucide-react';
import { collection, query, where, onSnapshot, type Timestamp } from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';

type VoucherStatus = 'active' | 'expired' | 'used' | 'disabled';
type DiscountType = 'percentage' | 'fixed';

interface VoucherCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  status: VoucherStatus;
  usageLimit: number | null;
  usedCount: number;
  validFrom: Timestamp | null;
  validUntil: Timestamp | null;
  operatorId: string;
  createdAt: Timestamp | null;
}

interface Filters {
  status: VoucherStatus | 'all';
}

const EMPTY_FILTERS: Filters = { status: 'all' };

function StatusBadge({ status }: { status: VoucherStatus }) {
  const styles: Record<VoucherStatus, string> = {
    active: 'bg-green-100 text-green-700',
    expired: 'bg-orange-100 text-orange-600',
    used: 'bg-gray-100 text-gray-500',
    disabled: 'bg-red-100 text-red-500',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatDate(ts: Timestamp | null): string {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDiscount(type: DiscountType, value: number): string {
  return type === 'percentage' ? `${value}%` : `₱${value.toLocaleString()}`;
}

// ── Filters Modal ───────────────────────────────────────────────

function FiltersModal({ open, filters, onApply, onClose }: {
  open: boolean; filters: Filters; onApply: (f: Filters) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(filters);
  useEffect(() => { if (open) setDraft(filters); }, [open, filters]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">Filters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'expired', 'used', 'disabled'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setDraft((prev) => ({ ...prev, status: s }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                    draft.status === s
                      ? 'bg-green-500 text-white border-green-500'
                      : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={() => { setDraft(EMPTY_FILTERS); onApply(EMPTY_FILTERS); onClose(); }}
            className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={() => { onApply(draft); onClose(); }}
            className="flex-1 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function OperatorVoucherCodesPage() {
  const { authState } = useAuth();
  const operatorId = authState.status === 'authenticated' ? authState.user.uid : null;

  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!operatorId) return;
    const q = query(collection(firebaseDb, 'voucherCodes'), where('operatorId', '==', operatorId));
    const unsub = onSnapshot(q, (snap) => {
      setVouchers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VoucherCode)));
      setLoading(false);
    });
    return unsub;
  }, [operatorId]);

  const hasActiveFilters = filters.status !== 'all';

  const filtered = useMemo(() => vouchers.filter((v) => {
    if (filters.status !== 'all' && v.status !== filters.status) return false;
    if (search && !v.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [vouchers, search, filters]);

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900 shrink-0">Voucher Codes</h1>

          <div className="flex items-center gap-3 flex-wrap justify-end flex-1">
            <div className="relative w-full sm:w-72 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Voucher Code"
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                hasActiveFilters
                  ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-green-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">!</span>
              )}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {!loading && vouchers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                { label: 'Total', count: vouchers.length, color: 'text-gray-900' },
                { label: 'Active', count: vouchers.filter((v) => v.status === 'active').length, color: 'text-green-600' },
                { label: 'Expired', count: vouchers.filter((v) => v.status === 'expired').length, color: 'text-orange-500' },
                { label: 'Used', count: vouchers.filter((v) => v.status === 'used').length, color: 'text-gray-500' },
              ] as const
            ).map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.count}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-400 py-16 text-center">Loading vouchers…</div>
        ) : vouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Ticket className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-400">No voucher codes assigned to you yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-400 py-16 text-center">No vouchers match your filters.</div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Code</th>
                  <th className="text-left px-4 py-3 font-semibold">Discount</th>
                  <th className="text-left px-4 py-3 font-semibold w-28">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Usage</th>
                  <th className="text-left px-4 py-3 font-semibold">Valid From</th>
                  <th className="text-left px-4 py-3 font-semibold">Valid Until</th>
                  <th className="text-left px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded tracking-widest text-xs">
                        {v.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {formatDiscount(v.discountType, v.discountValue)}
                    </td>
                    <td className="px-4 py-3 w-28">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {v.usedCount ?? 0}
                      {v.usageLimit != null ? ` / ${v.usageLimit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(v.validFrom)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(v.validUntil)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(v.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FiltersModal
        open={showFilters}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilters(false)}
      />
    </>
  );
}
