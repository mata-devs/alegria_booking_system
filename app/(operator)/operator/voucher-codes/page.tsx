'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, RefreshCw, Tag, Loader2, Copy, Check,
  Building2, Users, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  collection, getDocs, query, where, Timestamp,
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

function VoucherDetailPanel({ voucher }: { voucher: VoucherCode }) {
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
      </div>
    </div>
  );
}

export default function OperatorVoucherCodesPage() {
  const { authState } = useAuth();
  const operatorUid = authState.status === 'authenticated' ? authState.user.uid : null;

  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherCode | null>(null);

  const fetchVouchers = useCallback(async () => {
    if (!operatorUid) return;
    setLoading(true);
    try {
      const [entitySnap, assignedSnap, globalSnap] = await Promise.all([
        getDocs(collection(firebaseDb, 'entities')),
        getDocs(query(collection(firebaseDb, 'voucherCodes'), where('operatorUid', '==', operatorUid))),
        getDocs(query(collection(firebaseDb, 'voucherCodes'), where('operatorUid', '==', null))),
      ]);

      const entityMap = new Map<string, string>();
      entitySnap.docs.forEach(d => entityMap.set(d.id, (d.data().entityName as string) ?? ''));

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

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900">Voucher Codes</h1>
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
            <VoucherDetailPanel voucher={selectedVoucher} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center gap-3 text-gray-400">
              <Tag size={32} className="text-gray-300" />
              <p className="text-sm text-center px-6">Select a voucher code to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
