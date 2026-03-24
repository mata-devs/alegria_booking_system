'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Filter,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import type { Booking, BookingStatus } from '@/lib/types';

type SearchField = 'representative' | 'id';

const SEARCH_FIELD_LABELS: Record<SearchField, string> = {
  representative: 'Representative',
  id: 'Booking ID',
};

const STATUS_DOT: Record<BookingStatus, string> = {
  reserved: 'bg-green-500',
  paid: 'bg-green-500',
  processing: 'bg-amber-500',
  cancelled: 'bg-red-500',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  reserved: 'Reserved',
  paid: 'Paid',
  processing: 'Processing',
  cancelled: 'Cancelled',
};

const ROWS_PER_PAGE = 10;

// ─── Calendar helpers ───────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday‑based (Mon=0 ... Sun=6)
  return day === 0 ? 6 : day - 1;
}
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Component ──────────────────────────────────────────────────
export default function OperatorBookingsPage() {
  const { authState } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('representative');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  const operatorUid =
    authState.status === 'authenticated' ? authState.profile.uid : null;

  // ── Real‑time listener ────────────────────────────────────────
  useEffect(() => {
    if (!operatorUid) return;

    const q = query(
      collection(firebaseDb, 'bookings'),
      where('operatorId', '==', operatorUid),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: Booking[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            bookingId: data.bookingId ?? d.id.slice(0, 6),
            operatorId: data.operatorId ?? '',
            representativeName: data.representativeName ?? '',
            representativeAge: data.representativeAge ?? '',
            representativeGender: data.representativeGender ?? '',
            representativeEmail: data.representativeEmail ?? '',
            representativePhone: data.representativePhone ?? '',
            guests: Array.isArray(data.guests) ? data.guests : [],
            schedule: data.schedule ?? '',
            scheduleTime: data.scheduleTime ?? '',
            numberOfGuests: data.numberOfGuests ?? 0,
            totalPrice: data.totalPrice ?? 0,
            paymentMethod: data.paymentMethod ?? 'cash',
            status: data.status ?? 'processing',
            specialRequests: data.specialRequests ?? '',
            promoCode: data.promoCode ?? '',
            maxCapacity: data.maxCapacity ?? 70,
            currentCapacity: data.currentCapacity ?? 0,
            requestDate:
              data.requestDate instanceof Timestamp
                ? data.requestDate.toDate()
                : null,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : null,
          };
        });

        setBookings(results);
        if (results.length > 0 && !selectedId) {
          setSelectedId(results[0].id);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Failed to fetch bookings:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatorUid]);

  // ── New bookings in last 24 h ─────────────────────────────────
  useEffect(() => {
    if (!operatorUid) return;
    const yesterday = Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );
    const q = query(
      collection(firebaseDb, 'bookings'),
      where('operatorId', '==', operatorUid),
      where('createdAt', '>=', yesterday),
    );
    const unsubscribe = onSnapshot(q, (snap) => setNewBookingsCount(snap.size));
    return () => unsubscribe();
  }, [operatorUid]);

  // ── Filtering + pagination ────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter((b) => {
      if (searchField === 'representative')
        return b.representativeName.toLowerCase().includes(q);
      return b.bookingId.toLowerCase().includes(q);
    });
  }, [bookings, searchQuery, searchField]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, searchField]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  );

  const selectedBooking = bookings.find((b) => b.id === selectedId) ?? null;

  // ── Helpers ───────────────────────────────────────────────────
  function formatRequestDate(date: Date | null): string {
    if (!date) return '—';
    const m = String(date.getMonth() + 1);
    const d = String(date.getDate());
    const y = String(date.getFullYear()).slice(-2);
    return `${m}/${d}/${y}`;
  }

  async function updateBookingStatus(bookingId: string, newStatus: BookingStatus) {
    setStatusUpdating(true);
    setStatusDropdownId(null);
    try {
      await updateDoc(doc(firebaseDb, 'bookings', bookingId), {
        status: newStatus,
      });
    } catch (error) {
      console.error('Failed to update booking status:', error);
    } finally {
      setStatusUpdating(false);
    }
  }

  // ── Parse schedule date for calendar highlighting ─────────────
  const selectedScheduleDate = useMemo(() => {
    if (!selectedBooking?.schedule) return null;
    const parsed = new Date(selectedBooking.schedule);
    return isNaN(parsed.getTime()) ? null : parsed;
  }, [selectedBooking]);

  // When a booking is selected, navigate calendar to its month
  useEffect(() => {
    if (selectedScheduleDate) {
      setCalMonth(selectedScheduleDate.getMonth());
      setCalYear(selectedScheduleDate.getFullYear());
    }
  }, [selectedScheduleDate]);

  // ── Calendar rendering data ───────────────────────────────────
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const prevMonthDays = getDaysInMonth(
      calMonth === 0 ? calYear - 1 : calYear,
      calMonth === 0 ? 11 : calMonth - 1,
    );

    const cells: { day: number; inMonth: boolean; isHighlighted: boolean }[] = [];
    // Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, inMonth: false, isHighlighted: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const isHighlighted =
        selectedScheduleDate !== null &&
        selectedScheduleDate.getFullYear() === calYear &&
        selectedScheduleDate.getMonth() === calMonth &&
        selectedScheduleDate.getDate() === d;
      cells.push({ day: d, inMonth: true, isHighlighted });
    }
    // Trailing days
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, inMonth: false, isHighlighted: false });
      }
    }
    return cells;
  }, [calYear, calMonth, selectedScheduleDate]);

  // Count bookings on a given date for highlighting
  const bookingDateSet = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (b.schedule) {
        const d = new Date(b.schedule);
        if (!isNaN(d.getTime())) {
          set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        }
      }
    });
    return set;
  }, [bookings]);

  const navigateMonth = useCallback((delta: number) => {
    setCalMonth((prev) => {
      let newMonth = prev + delta;
      if (newMonth > 11) {
        setCalYear((y) => y + 1);
        newMonth = 0;
      } else if (newMonth < 0) {
        setCalYear((y) => y - 1);
        newMonth = 11;
      }
      return newMonth;
    });
  }, []);

  // ── Capacity percentage for the donut ─────────────────────────
  const capacity = selectedBooking
    ? { current: selectedBooking.currentCapacity, max: selectedBooking.maxCapacity }
    : { current: 0, max: 70 };
  const capacityPct = capacity.max > 0 ? (capacity.current / capacity.max) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Stats Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch rounded-lg border border-gray-200 bg-white">
        <div className="flex-1 px-6 py-4">
          <h1 className="text-lg font-bold text-gray-900">Booking Requests</h1>
        </div>
        <div className="flex items-center border-t sm:border-t-0 sm:border-l border-gray-200 px-6 py-4 gap-3">
          <span className="text-2xl font-bold text-gray-900">{newBookingsCount}</span>
          <span className="text-sm text-gray-500">New Bookings last 24 hours</span>
        </div>
        <div className="flex items-center border-t sm:border-t-0 sm:border-l border-gray-200 px-6 py-4 gap-3">
          <span className="text-2xl font-bold text-gray-900">{bookings.length}</span>
          <span className="text-sm text-gray-500">Total booking requests</span>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* ── Left: Table ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white p-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button className="inline-flex items-center gap-2 rounded-md bg-[#558B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a7a28] transition-colors">
              <Filter size={16} />
              Filters
            </button>

            <span className="hidden sm:inline text-sm font-medium text-gray-700">Search by:</span>

            {/* Search field dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#558B2F] px-3 sm:px-4 py-1.5 text-sm font-medium text-[#558B2F] hover:bg-green-50 transition-colors"
              >
                {SEARCH_FIELD_LABELS[searchField]}
                <ChevronDown size={14} />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {(Object.keys(SEARCH_FIELD_LABELS) as SearchField[]).map((field) => (
                    <button
                      key={field}
                      onClick={() => {
                        setSearchField(field);
                        setDropdownOpen(false);
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        searchField === field ? 'text-[#558B2F] font-medium' : 'text-gray-700'
                      }`}
                    >
                      {SEARCH_FIELD_LABELS[field]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-auto rounded-md border border-gray-300 py-1.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
              />
            </div>
          </div>

          {/* Column headers */}
          <div className="mt-5 hidden lg:grid grid-cols-[1fr_0.8fr_1.2fr_1.6fr_0.6fr_0.7fr_1.1fr] gap-0 border-b border-gray-200 pb-2">
            <span className="px-3 text-xs font-bold text-gray-900">Booking Id</span>
            <span className="px-3 text-xs font-bold text-gray-900">Request Date</span>
            <span className="px-3 text-xs font-bold text-gray-900">Representative</span>
            <span className="px-3 text-xs font-bold text-gray-900">Schedule</span>
            <span className="px-3 text-xs font-bold text-gray-900 text-center">No. of Guests</span>
            <span className="px-3 text-xs font-bold text-gray-900">Total</span>
            <span className="px-3 text-xs font-bold text-gray-900">Status</span>
          </div>

          {/* Rows */}
          <div className="mt-3 flex flex-col gap-2">
            {loading ? (
              <div className="rounded-lg bg-gray-100 px-4 py-4 text-center text-sm text-gray-400">
                Loading bookings…
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg bg-gray-100 px-4 py-4 text-center text-sm text-gray-400">
                No bookings found.
              </div>
            ) : (
              paginated.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(booking.id);
                    setStatusDropdownId(null);
                    setMobileDetailOpen(true);
                  }}
                  className={`rounded-lg text-left transition-colors ${
                    selectedId === booking.id
                      ? 'bg-green-100 ring-1 ring-green-300'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {/* Desktop row */}
                  <div className="hidden lg:grid grid-cols-[1fr_0.8fr_1.2fr_1.6fr_0.6fr_0.7fr_1.1fr] items-center gap-0">
                    <span className="border-r border-gray-200 px-3 py-3 text-xs text-gray-700">
                      {booking.bookingId}
                    </span>
                    <span className="border-r border-gray-200 px-3 py-3 text-xs text-gray-700">
                      {formatRequestDate(booking.requestDate ?? booking.createdAt)}
                    </span>
                    <span className="border-r border-gray-200 px-3 py-3 text-xs text-gray-700 truncate">
                      {booking.representativeName}
                    </span>
                    <span className="border-r border-gray-200 px-3 py-3 text-xs text-gray-700">
                      {booking.schedule} {booking.scheduleTime}
                    </span>
                    <span className="border-r border-gray-200 px-3 py-3 text-xs text-gray-700 text-center">
                      {booking.numberOfGuests}
                    </span>
                    <span className="border-r border-gray-200 px-3 py-3 text-xs text-gray-700">
                      ₱{booking.totalPrice.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-2 px-3 py-3 text-xs text-gray-700">
                      <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[booking.status]}`} />
                      {STATUS_LABEL[booking.status]}
                      {/* Inline status dropdown toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusDropdownId(
                            statusDropdownId === booking.id ? null : booking.id,
                          );
                        }}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown size={14} />
                      </button>
                      {/* Status dropdown */}
                      {statusDropdownId === booking.id && (
                        <div
                          className="absolute right-4 z-20 mt-28 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBookingStatus(booking.id, s);
                              }}
                              disabled={statusUpdating}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                booking.status === s ? 'font-medium text-[#558B2F]' : 'text-gray-700'
                              }`}
                            >
                              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} />
                              {STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                  </div>

                  {/* Mobile card */}
                  <div className="lg:hidden px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {booking.representativeName}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0 ml-2">
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[booking.status]}`} />
                        {STATUS_LABEL[booking.status]}
                        <ChevronDown size={12} className="text-gray-400" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>ID: {booking.bookingId}</span>
                      <span>{booking.schedule} · {booking.numberOfGuests} guests</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>₱{booking.totalPrice.toLocaleString()}</span>
                      <span>{formatRequestDate(booking.requestDate ?? booking.createdAt)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {filtered.length > ROWS_PER_PAGE && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`h-7 min-w-7 rounded-md px-2 text-xs font-medium transition-colors ${
                      page === pg ? 'bg-[#558B2F] text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Detail Panel ─────────────────────────────── */}
        {selectedBooking && (
          <>
          {/* Mobile overlay backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity xl:hidden ${
              mobileDetailOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMobileDetailOpen(false)}
          />
          <div className={`
            fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-gray-50 shadow-xl transition-transform duration-300 xl:relative xl:inset-auto xl:z-auto xl:w-[22rem] xl:max-w-none xl:translate-x-0 xl:shadow-none xl:bg-transparent
            ${mobileDetailOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}
            shrink-0 flex flex-col gap-4 p-4 xl:p-0
          `}>
            {/* ── Booking Info Card ────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              {/* Close button (mobile only) */}
              <button
                onClick={() => setMobileDetailOpen(false)}
                className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 xl:hidden"
              >
                <ChevronLeft size={16} />
                Back to list
              </button>
              {/* Header row */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-400 leading-tight min-w-0">
                  <span>Booking Id:</span><br />
                  <span className="font-semibold text-gray-700 break-all">{selectedBooking.bookingId}</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="shrink-0 rounded-full bg-[#558B2F] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4a7a28] transition-colors"
                >
                  preview printable
                </button>
              </div>

              {/* Tour Schedule */}
              <div className="mt-4">
                <span className="text-sm text-gray-500">Tour Schedule: </span>
                <span className="text-sm font-bold text-gray-900">
                  {selectedBooking.schedule} {selectedBooking.scheduleTime}
                </span>
              </div>

              {/* Representative */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900">Representative:</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex gap-6">
                    <div>
                      <span className="text-sm text-gray-500">Name: </span>
                      <span className="text-sm font-bold text-gray-900">{selectedBooking.representativeName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Age: </span>
                      <span className="text-sm font-bold text-gray-900">{selectedBooking.representativeAge || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Gender: </span>
                    <span className="text-sm font-bold text-gray-900">{selectedBooking.representativeGender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email: </span>
                    <span className="text-sm font-bold text-gray-900">{selectedBooking.representativeEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Mobile Number: </span>
                    <span className="text-sm font-bold text-gray-900">{selectedBooking.representativePhone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Other Guests */}
              {selectedBooking.guests.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-900">Other Guests</h3>
                  {/* Guest table header */}
                  <div className="mt-2 grid grid-cols-[1.5fr_0.6fr_1fr] text-xs font-bold text-gray-500">
                    <span className="text-center">Name</span>
                    <span className="text-center">Age</span>
                    <span className="text-center">Gender</span>
                  </div>
                  {/* Guest rows */}
                  {selectedBooking.guests.map((guest, idx) => (
                    <div key={idx} className="grid grid-cols-[1.5fr_0.6fr_1fr] py-1 text-sm">
                      <span className="font-bold text-gray-900 text-center">{guest.name || '—'}</span>
                      <span className="font-bold text-gray-900 text-center">{guest.age || '—'}</span>
                      <span className="font-bold text-gray-900 text-center">{guest.gender || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Calendar Availability Card ──────────────────── */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-center text-lg font-bold text-gray-900">Calendar Availability</h3>

              {/* Month dropdown */}
              <div className="mt-2 flex justify-end">
                <span className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-xs text-gray-600">
                  Month
                  <ChevronDown size={12} />
                </span>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row gap-4">
                {/* Calendar grid */}
                <div className="flex-1 min-w-0">
                  {/* Month navigation */}
                  <div className="flex items-center justify-center gap-2 rounded-full bg-[#558B2F] py-1.5 text-white">
                    <button onClick={() => navigateMonth(-1)} className="px-2 hover:opacity-80">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold">
                      {MONTH_NAMES[calMonth]}, {calYear}
                    </span>
                    <button onClick={() => navigateMonth(1)} className="px-2 hover:opacity-80">
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold text-gray-500">
                    {DAY_HEADERS.map((d) => (
                      <span key={d} className="py-1">{d}</span>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 text-center text-xs">
                    {calendarDays.map((cell, i) => {
                      const dateKey = `${calYear}-${calMonth}-${cell.day}`;
                      const hasBooking = cell.inMonth && bookingDateSet.has(dateKey);
                      return (
                        <span
                          key={i}
                          className={`py-1 rounded-full ${
                            cell.isHighlighted
                              ? 'bg-[#558B2F] text-white font-bold'
                              : hasBooking
                                ? 'bg-orange-400 text-white font-semibold'
                                : cell.inMonth
                                  ? 'text-gray-700'
                                  : 'text-gray-300'
                          }`}
                        >
                          {cell.day}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Day + Capacity donut */}
                <div className="flex w-full sm:w-24 flex-row sm:flex-col items-center justify-center gap-4 sm:gap-2">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">
                      {selectedScheduleDate
                        ? MONTH_NAMES[selectedScheduleDate.getMonth()]
                        : MONTH_NAMES[calMonth]}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {selectedScheduleDate
                        ? selectedScheduleDate.getDate()
                        : new Date().getDate()}
                    </p>
                  </div>

                  {/* Donut chart */}
                  <div className="relative h-20 w-20">
                    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="3"
                        strokeDasharray={`${capacityPct} ${100 - capacityPct}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-gray-900 leading-none">
                        {capacity.current}/{capacity.max}
                      </span>
                      <Users size={14} className="mt-0.5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
