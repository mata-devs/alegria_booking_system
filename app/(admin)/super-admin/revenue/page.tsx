'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Printer,
  Download,
  Loader2,
  FileText,
} from 'lucide-react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';

type Tab = 'individual' | 'summarized';

interface Guest {
  fullName: string;
  age: number;
  gender?: string;
  nationality?: string;
}

interface BookingRow {
  bookingId: string;
  operatorUid: string;
  operatorName: string;
  representative: Guest & { email: string; phoneNumber: string };
  guests: Guest[];
  numberOfGuests: number;
  tourDate: Date | null;
  timeSlot: 'AM' | 'PM' | string;
  pricePerGuest: number;
  serviceCharge: number;
  discountAmount: number;
  finalPrice: number;
  paymentMethod: string;
  createdAt: Date | null;
}

function peso(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtSchedule(d: Date | null, slot: string) {
  if (!d) return '—';
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = slot === 'AM' ? '8:00AM' : slot === 'PM' ? '2:00PM' : '';
  return `${date}${time ? `, ${time}` : ''}`;
}

function tsToDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === 'string') return new Date(v);
  return null;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function RevenueReportsPage() {
  const [tab, setTab] = useState<Tab>('individual');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [bSnap, uSnap] = await Promise.all([
          getDocs(collection(firebaseDb, 'bookings')),
          getDocs(collection(firebaseDb, 'users')),
        ]);

        const userMap = new Map<string, string>();
        uSnap.docs.forEach(d => {
          const u = d.data();
          const name = u.operatorName || u.companyName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || d.id;
          userMap.set(d.id, name);
        });

        const rows: BookingRow[] = bSnap.docs.map(d => {
          const b = d.data();
          return {
            bookingId: b.bookingId ?? d.id,
            operatorUid: b.operatorUid ?? '',
            operatorName: userMap.get(b.operatorUid) ?? '—',
            representative: {
              fullName: b.representative?.fullName ?? '',
              email: b.representative?.email ?? '',
              phoneNumber: b.representative?.phoneNumber ?? '',
              age: Number(b.representative?.age) || 0,
              gender: b.representative?.gender,
              nationality: b.representative?.nationality,
            },
            guests: Array.isArray(b.guests) ? b.guests : [],
            numberOfGuests: Number(b.numberOfGuests) || 0,
            tourDate: tsToDate(b.tourDate),
            timeSlot: b.timeSlot ?? 'AM',
            pricePerGuest: Number(b.pricePerGuest) || 0,
            serviceCharge: Number(b.serviceCharge) || 0,
            discountAmount: Number(b.discountAmount) || 0,
            finalPrice: Number(b.finalPrice) || 0,
            paymentMethod: b.paymentMethod ?? 'Cash',
            createdAt: tsToDate(b.createdAt),
          };
        });
        setBookings(rows);
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex bg-white rounded-t-xl border-b border-gray-200">
        <TabButton active={tab === 'individual'} onClick={() => setTab('individual')}>Individual Bookings</TabButton>
        <TabButton active={tab === 'summarized'} onClick={() => setTab('summarized')}>Summarized report</TabButton>
      </div>

      <div className="flex-1 min-h-0 mt-4">
        {tab === 'individual'
          ? <IndividualBookings bookings={bookings} loading={loading} />
          : <SummarizedReport bookings={bookings} loading={loading} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-base font-bold transition-colors ${
        active
          ? 'text-[#558B2F] border-b-2 border-[#558B2F] bg-white'
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

/* ── INDIVIDUAL BOOKINGS ───────────────────────────────────────── */

type IndSearchField = 'Booking ID' | 'Operator' | 'Representative';

function IndividualBookings({ bookings, loading }: { bookings: BookingRow[]; loading: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchField, setSearchField] = useState<IndSearchField>('Booking ID');
  const [term, setTerm] = useState('');

  useEffect(() => {
    if (!selectedId && bookings.length > 0) setSelectedId(bookings[0].bookingId);
  }, [bookings, selectedId]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return bookings;
    return bookings.filter(b => {
      if (searchField === 'Booking ID') return b.bookingId.toLowerCase().includes(t);
      if (searchField === 'Operator') return b.operatorName.toLowerCase().includes(t);
      return b.representative.fullName.toLowerCase().includes(t);
    });
  }, [bookings, term, searchField]);

  const selected = bookings.find(b => b.bookingId === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-full">
      <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0">
        <Toolbar
          searchField={searchField}
          onSearchField={(v) => setSearchField(v as IndSearchField)}
          fields={['Booking ID', 'Operator', 'Representative']}
          term={term}
          onTerm={setTerm}
        />
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-left text-xs font-bold text-gray-700 border-b border-gray-200">
                <th className="px-6 py-3">Booking ID</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Representative</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Guests</th>
                <th className="px-4 py-3">Total price</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400"><Loader2 className="inline animate-spin mr-2" size={16} />Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">No bookings found.</td></tr>
              ) : filtered.map(b => {
                const active = b.bookingId === selectedId;
                return (
                  <tr
                    key={b.bookingId}
                    onClick={() => setSelectedId(b.bookingId)}
                    className={`cursor-pointer border-b border-gray-100 transition-colors ${active ? 'bg-[#F1F8E9]' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-3 font-mono text-gray-700">{b.bookingId}</td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[160px]">{b.operatorName}</td>
                    <td className="px-4 py-3 text-gray-700">{b.representative.fullName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtSchedule(b.tourDate, b.timeSlot)}</td>
                    <td className="px-4 py-3 text-gray-700">{b.numberOfGuests}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{peso(b.finalPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0">
        {selected ? <IndividualReportPanel b={selected} /> : <EmptyPanel text="Select a booking to view report" />}
      </div>
    </div>
  );
}

function IndividualReportPanel({ b }: { b: BookingRow }) {
  const subtotal = b.pricePerGuest * b.numberOfGuests;
  return (
    <>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Report</h2>
        <div className="flex gap-2">
          <IconBtn title="Print"><Printer className="h-4 w-4 text-[#558B2F]" /></IconBtn>
          <IconBtn title="Download"><Download className="h-4 w-4 text-[#558B2F]" /></IconBtn>
        </div>
      </div>
      <div className="px-6 py-5 overflow-auto flex-1 space-y-5 text-sm">
        <KV label="Booking ID:" value={<span className="font-semibold">{b.bookingId}</span>} />
        <KV label="Tour Operator:" value={<span className="font-semibold">{b.operatorName}</span>} />
        <KV label="Schedule:" value={<span className="font-semibold">{fmtSchedule(b.tourDate, b.timeSlot)}</span>} />

        <section>
          <p className="text-gray-500 mb-2">Representative:</p>
          <div className="pl-4 space-y-1">
            <KV label="Name:" value={<span className="font-semibold">{b.representative.fullName}</span>} right={<KV label="Age:" value={<span className="font-semibold">{b.representative.age}</span>} inline />} />
            <KV label="Email:" value={<span className="font-semibold">{b.representative.email}</span>} />
            <KV label="Mobile Number:" value={<span className="font-semibold">{b.representative.phoneNumber}</span>} />
          </div>
        </section>

        {b.guests.length > 0 && (
          <section>
            <p className="text-gray-500 mb-2">Other Guests</p>
            <div className="pl-4">
              <div className="grid grid-cols-[1fr_60px] text-xs font-semibold text-gray-500 uppercase border-b border-gray-100 pb-1">
                <span>Name</span><span>Age</span>
              </div>
              {b.guests.map((g, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px] py-1 text-sm">
                  <span className="font-semibold text-gray-800">{g.fullName}</span>
                  <span className="text-gray-700">{g.age}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <p className="text-gray-500 mb-2">Payment</p>
          <div className="pl-4 space-y-1 text-gray-700">
            <LineItem label={`${peso(b.pricePerGuest)} x ${b.numberOfGuests}`} value={peso(subtotal)} />
            <LineItem label="Service charge" value={peso(b.serviceCharge)} />
            {b.discountAmount > 0 && <LineItem label="Discount" value={`-${peso(b.discountAmount)}`} />}
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
              <span>Total</span><span>{peso(b.finalPrice)}</span>
            </div>
          </div>
        </section>

        <KV label="Payment Option:" value={<span className="font-semibold">{b.paymentMethod}</span>} />
      </div>
    </>
  );
}

/* ── SUMMARIZED REPORT ─────────────────────────────────────────── */

type RecordsBy = 'Month' | 'Year';

interface MonthRow {
  key: string;
  month: string;
  monthIndex: number;
  year: number;
  totalBookings: number;
  totalGuests: number;
  totalRevenue: number;
  pricePerGuestAvg: number;
  serviceChargeSum: number;
  bookings: BookingRow[];
}

function SummarizedReport({ bookings, loading }: { bookings: BookingRow[]; loading: boolean }) {
  const [recordsBy, setRecordsBy] = useState<RecordsBy>('Month');
  const [term, setTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows = useMemo<MonthRow[]>(() => {
    const map = new Map<string, MonthRow>();
    for (const b of bookings) {
      if (!b.tourDate) continue;
      const m = b.tourDate.getMonth();
      const y = b.tourDate.getFullYear();
      const key = recordsBy === 'Year' ? `${y}` : `${y}-${m}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalBookings += 1;
        existing.totalGuests += b.numberOfGuests;
        existing.totalRevenue += b.finalPrice;
        existing.serviceChargeSum += b.serviceCharge;
        existing.bookings.push(b);
      } else {
        map.set(key, {
          key,
          month: recordsBy === 'Year' ? 'All' : MONTHS[m],
          monthIndex: m,
          year: y,
          totalBookings: 1,
          totalGuests: b.numberOfGuests,
          totalRevenue: b.finalPrice,
          pricePerGuestAvg: b.pricePerGuest,
          serviceChargeSum: b.serviceCharge,
          bookings: [b],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.year - a.year) || (b.monthIndex - a.monthIndex));
  }, [bookings, recordsBy]);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(r => String(r.year).includes(t) || r.month.toLowerCase().includes(t));
  }, [rows, term]);

  useEffect(() => {
    if (!selectedKey && filtered.length > 0) setSelectedKey(filtered[0].key);
  }, [filtered, selectedKey]);

  const selected = rows.find(r => r.key === selectedKey) ?? null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-full">
      <div className="xl:col-span-3 flex flex-col gap-3 min-h-0">
        {/* Records by */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Records by:</span>
          <div className="relative">
            <select
              value={recordsBy}
              onChange={(e) => setRecordsBy(e.target.value as RecordsBy)}
              className="appearance-none rounded-md border border-gray-200 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7BCA0D]"
            >
              <option>Month</option>
              <option>Year</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Toolbar + Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
          <Toolbar
            searchField="Year"
            onSearchField={() => { /* fixed */ }}
            fields={['Year']}
            term={term}
            onTerm={setTerm}
            fieldReadOnly
          />
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-xs font-bold text-gray-700 border-b border-gray-200">
                  <th className="px-6 py-3">Month</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Total Bookings</th>
                  <th className="px-4 py-3">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400"><Loader2 className="inline animate-spin mr-2" size={16} />Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400">No records.</td></tr>
                ) : filtered.map(r => {
                  const active = r.key === selectedKey;
                  return (
                    <tr
                      key={r.key}
                      onClick={() => setSelectedKey(r.key)}
                      className={`cursor-pointer border-b border-gray-100 transition-colors ${active ? 'bg-[#F1F8E9]' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-3 text-gray-700">{r.month}</td>
                      <td className="px-4 py-3 text-gray-600">{r.year}</td>
                      <td className="px-4 py-3 text-gray-700">{r.totalBookings}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{peso(r.totalRevenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0">
        {selected ? <SummarizedReportPanel r={selected} recordsBy={recordsBy} /> : <EmptyPanel text="Select a period to view report" />}
      </div>
    </div>
  );
}

function SummarizedReportPanel({ r, recordsBy }: { r: MonthRow; recordsBy: RecordsBy }) {
  const lastDay = new Date(r.year, r.monthIndex + 1, 0).getDate();
  const dateRange = recordsBy === 'Year'
    ? `January 1 – December 31, ${r.year}`
    : `${r.month} 1 – ${r.month} ${lastDay}`;

  const guestRevenue = r.bookings.reduce((s, b) => s + b.pricePerGuest * b.numberOfGuests, 0);
  const serviceRevenue = r.serviceChargeSum;
  const avgPrice = r.bookings.length ? Math.round(r.bookings.reduce((s, b) => s + b.pricePerGuest, 0) / r.bookings.length) : 0;
  const lgu = r.totalBookings * 50;
  const mata = r.totalBookings * 50;

  return (
    <>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Report</h2>
        <div className="flex gap-2">
          <IconBtn title="Print"><Printer className="h-4 w-4 text-[#558B2F]" /></IconBtn>
          <IconBtn title="Download"><Download className="h-4 w-4 text-[#558B2F]" /></IconBtn>
        </div>
      </div>
      <div className="px-6 py-5 overflow-auto flex-1 space-y-4 text-sm">
        {recordsBy === 'Month' && <KV label="Month:" value={<span className="font-semibold">{r.month}</span>} />}
        <KV label="Year:" value={<span className="font-semibold">{r.year}</span>} />
        <KV label="Date Range:" value={<span className="font-semibold">{dateRange}</span>} />
        <KV label="Total Number of Bookings:" value={<span className="font-semibold">{r.totalBookings}</span>} />
        <KV label="Total Number of Guests:" value={<span className="font-semibold">{r.totalGuests}</span>} />

        <div className="pt-3">
          <p className="text-gray-500 mb-3">Revenue Breakdown</p>
          <div className="space-y-2 text-gray-700">
            <LineItem label={`${peso(avgPrice)} x ${r.totalGuests} (no. of guest)`} value={peso(guestRevenue)} />
            <LineItem label={`Service charge x ${r.totalBookings} (no. of bookings)`} value={peso(serviceRevenue)} />
            <LineItem label={`LGU (₱50) x ${r.totalBookings} (no. of bookings)`} value={peso(lgu)} />
            <LineItem label={`Mata (₱50) x ${r.totalBookings} (no. of bookings)`} value={peso(mata)} />
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
              <span>Total</span><span>{peso(r.totalRevenue)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── SHARED BITS ───────────────────────────────────────────────── */

function Toolbar({
  searchField, onSearchField, fields, term, onTerm, fieldReadOnly,
}: {
  searchField: string;
  onSearchField: (v: string) => void;
  fields: string[];
  term: string;
  onTerm: (v: string) => void;
  fieldReadOnly?: boolean;
}) {
  return (
    <div className="px-6 py-3 flex flex-wrap items-center gap-3 border-b border-gray-100">
      <button className="flex items-center gap-2 rounded-md bg-[#7BCA0D] hover:bg-[#558B2F] text-white px-3 py-2 text-sm font-semibold transition-colors">
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Search by:</span>
        <div className="relative">
          <select
            value={searchField}
            onChange={(e) => onSearchField(e.target.value)}
            disabled={fieldReadOnly}
            className="appearance-none rounded-md border border-[#7BCA0D] bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-[#558B2F] focus:outline-none focus:ring-2 focus:ring-[#7BCA0D] disabled:bg-[#F1F8E9]"
          >
            {fields.map(f => <option key={f}>{f}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#558B2F]" />
        </div>
      </div>
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={term}
          onChange={(e) => onTerm(e.target.value)}
          placeholder="Search"
          className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BCA0D]"
        />
      </div>
    </div>
  );
}

function KV({ label, value, right, inline }: { label: string; value: React.ReactNode; right?: React.ReactNode; inline?: boolean }) {
  if (inline) {
    return <span className="inline-flex items-center gap-2 ml-6"><span className="text-gray-500">{label}</span>{value}</span>;
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 min-w-[140px]">{label}</span>
        {value}
      </div>
      {right}
    </div>
  );
}

function LineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function IconBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button title={title} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
      {children}
    </button>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 p-6">
      <FileText className="h-8 w-8 text-gray-300" />
      <p className="text-sm text-center">{text}</p>
    </div>
  );
}
