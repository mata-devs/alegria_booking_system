'use client';

import React, { useMemo, useState } from 'react';
import BookingRequestsPanel from '@/app/(operator)/operator/bookings/list';
import BookingDetailsCard, { type Booking, type BookingStatus } from '@/app/(operator)/operator/bookings/details';
import CalendarAvailability from '@/app/(operator)/operator/bookings/calendar';
import FilterModal, {
  createEmptyFilters,
  type BookingFilters,
  type Status,
} from '@/app/(operator)/operator/bookings/modalfilter';import { useOperatorBookings, type FirestoreBooking } from '@/app/hooks/useOperatorBookings';
import { useAuth } from '@/app/context/AuthContext';

/* ── Map Firestore document → UI Booking type ─────────────── */

function firestoreToBooking(doc: FirestoreBooking): Booking {
  const tourDate = doc.tourDate?.toDate?.();
  const createdAt = doc.createdAt?.toDate?.();

  const scheduleLabel = tourDate
    ? `${tourDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}  ${doc.timeSlot === 'AM' ? '8 AM' : '1 PM'}`
    : '—';

  const requestDate = createdAt
    ? createdAt.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
    : '—';

  const statusMap: Record<string, BookingStatus> = {
    reserved: 'Reserved',
    paid: 'Paid',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return {
    id: doc.bookingId,
    bookingIdLabel: doc.bookingId,
    scheduleLabel,
    requestDate,
    representative: {
      name: doc.representative.fullName,
      age: doc.representative.age,
      gender: doc.representative.gender,
      email: doc.representative.email,
      mobile: doc.representative.phoneNumber,
    },
    otherGuests: doc.guests.map((g) => ({
      name: g.fullName,
      age: g.age,
      gender: g.gender,
    })),
    payment: {
      pricePerPerson: doc.pricePerGuest,
      qty: doc.numberOfGuests,
      serviceCharge: doc.serviceCharge,
      option: doc.paymentMethod,
    },
    status: statusMap[doc.status] ?? 'Reserved',
    uploads: doc.receiptUrl ? [{ id: 'receipt', name: 'Payment Receipt' }] : [],
  };
}

export default function Page() {
  const { authState } = useAuth();
  const operatorUid = authState.status === 'authenticated' ? authState.user.uid : undefined;
  const { bookings: firestoreBookings, loading, error } = useOperatorBookings(operatorUid);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filtersDraft, setFiltersDraft] = useState<BookingFilters>(createEmptyFilters());
  const [filtersApplied, setFiltersApplied] = useState<BookingFilters>(createEmptyFilters());

  const bookingsById = useMemo<Record<string, Booking>>(() => {
    const record: Record<string, Booking> = {};
    for (const doc of firestoreBookings) {
      const b = firestoreToBooking(doc);
      record[b.id] = b;
    }
    return record;
  }, [firestoreBookings]);

  const bookings = useMemo(() => Object.values(bookingsById), [bookingsById]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const selectedBooking = selectedId ? bookingsById[selectedId] : undefined;
  const [searchBy, setSearchBy] = useState<'Representative' | 'Booking ID'>('Representative');
  const [query, setQuery] = useState('');

  const filteredBookings = useMemo(() => {
    const q = query.trim().toLowerCase();

    const toDateOnly = (s?: string) => {
      if (!s) return null;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const schedFrom = toDateOnly(filtersApplied.scheduleFrom);
    const schedTo = toDateOnly(filtersApplied.scheduleTo);
    const reqFrom = toDateOnly(filtersApplied.requestFrom);
    const reqTo = toDateOnly(filtersApplied.requestTo);

    return bookings.filter((b) => {
      const matchesSearch =
        !q ||
        (searchBy === 'Representative'
          ? (b.representative?.name ?? '').toLowerCase().includes(q)
          : (b.bookingIdLabel ?? b.id).toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filtersApplied.status.size > 0) {
        if (!filtersApplied.status.has(b.status as Status)) return false;
      }

      if (filtersApplied.guests.trim() !== '') {
        const g = Number(filtersApplied.guests);
        if (!Number.isNaN(g) && b.payment.qty !== g) return false;
      }

      const sched = toDateOnly(b.scheduleLabel);
      if (schedFrom && sched && sched < schedFrom) return false;
      if (schedTo && sched && sched > schedTo) return false;

      const req = toDateOnly(b.requestDate);
      if (reqFrom && req && req < reqFrom) return false;
      if (reqTo && req && req > reqTo) return false;

      return true;
    });
  }, [bookings, query, searchBy, filtersApplied]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="text-sm text-gray-500">Loading bookings…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="text-sm text-red-500">Failed to load bookings: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:h-[calc(100vh-3rem)]">
      {/* Left panel — Booking List */}
      <div className="flex-1 min-w-0 min-h-0">
        <BookingRequestsPanel
          bookings={filteredBookings}
          selectedId={selectedId}
          onSelect={(id: string) => setSelectedId(id)}
          searchBy={searchBy}
          setSearchBy={setSearchBy}
          query={query}
          setQuery={setQuery}
          onOpenFilters={() => setIsFilterOpen(true)}
        />
      </div>

      {/* Right panel — Details + Calendar (desktop) */}
      <div className="hidden lg:flex w-96 shrink-0 flex-col gap-4 overflow-y-auto">
        <BookingDetailsCard
          booking={selectedBooking}
          onClose={selectedBooking ? () => setSelectedId(undefined) : undefined}
        />
        <CalendarAvailability />
      </div>

      {/* Calendar on mobile (always visible) */}
      <div className="lg:hidden">
        <CalendarAvailability />
      </div>

      {/* Mobile slide-in details panel */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedId(undefined)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <BookingDetailsCard
              booking={selectedBooking}
              onClose={() => setSelectedId(undefined)}
            />
          </div>
        </div>
      )}

      <FilterModal
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filtersDraft}
        setFilters={setFiltersDraft}
        onClear={() => setFiltersDraft(createEmptyFilters())}
        onApply={() => {
          setFiltersApplied(filtersDraft);
          setIsFilterOpen(false);
        }}
      />
    </div>
  );
}