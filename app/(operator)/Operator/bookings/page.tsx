'use client';

import React, { useMemo, useState } from 'react';
import BookingRequestsPanel from '@/app/(operator)/Operator/bookings/list';
import BookingDetailsCard, { type Booking } from '@/app/(operator)/Operator/bookings/details';
import CalendarAvailability from '@/app/(operator)/Operator/bookings/calendar';
import FilterModal, {
  createEmptyFilters,
  type BookingFilters,
  type Status,
} from '@/app/(operator)/Operator/bookings/modalfilter';


export default function Page() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filtersDraft, setFiltersDraft] = useState<BookingFilters>(createEmptyFilters());
  const [filtersApplied, setFiltersApplied] = useState<BookingFilters>(createEmptyFilters());
  const bookingsById = useMemo<Record<string, Booking>>(
  () => ({
    t22542: {
      id: 't22542',
      bookingIdLabel: 't22542',
      scheduleLabel: 'Jan 6, 2026  8 AM',
      requestDate: '12/5/25',
      representative: {
        name: 'Jane Doe',
        age: 28,
        gender: 'Female',
        email: 'jane@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest 1', age: 20, gender: 'Male' },
        { name: 'Guest 2', age: 22, gender: 'Female' },
      ],
      payment: { pricePerPerson: 200, qty: 5, serviceCharge: 205, option: 'GCash' },
      status: 'Reserved',
      uploads: [{ id: 'f1', name: 'valid-id.jpg' }],
    },

    321521: {
      id: '321521',
      bookingIdLabel: '321521',
      scheduleLabel: 'Feb 28, 2026  9 AM',
      requestDate: '12/5/25',
      representative: {
        name: 'Juan Dela Cruz',
        age: 31,
        gender: 'Male',
        email: 'juan@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest A', age: 22, gender: 'Female' },
        { name: 'Guest B', age: 26, gender: 'Female' },
      ],
      payment: { pricePerPerson: 150, qty: 7, serviceCharge: 155, option: 'Cash' },
      status: 'Paid',
      uploads: [{ id: 'f2', name: 'receipt.pdf' }],
    },

    9563214: {
      id: '9563214',
      bookingIdLabel: '9563214',
      scheduleLabel: 'Jan 10, 2026  10 AM',
      requestDate: '12/6/25',
      representative: {
        name: 'Michael TF',
        age: 28,
        gender: 'Male',
        email: 'michael@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest 1', age: 24, gender: 'Male' },
        { name: 'Guest 2', age: 23, gender: 'Female' },
      ],
      payment: { pricePerPerson: 200, qty: 5, serviceCharge: 205, option: 'GCash' },
      status: 'Reserved',
      uploads: [{ id: 'f3', name: 'payment.jpg' }],
    },

    9563212: {
      id: '9563212',
      bookingIdLabel: '9563212',
      scheduleLabel: 'Jan 12, 2026  1 PM',
      requestDate: '12/6/25',
      representative: {
        name: 'Alex Rivera',
        age: 27,
        gender: 'Male',
        email: 'alex@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [{ name: 'Guest 1', age: 21, gender: 'Female' }],
      payment: { pricePerPerson: 180, qty: 4, serviceCharge: 150, option: 'Card' },
      status: 'Processing',
      uploads: [{ id: 'f4', name: 'receipt.jpg' }],
    },

    b10001: {
      id: 'b10001',
      bookingIdLabel: 'b10001',
      scheduleLabel: 'Jan 13, 2026  7 AM',
      requestDate: '12/7/25',
      representative: {
        name: 'Mia Santos',
        age: 26,
        gender: 'Female',
        email: 'mia@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Tony Stark', age: 30, gender: 'Male' },
        { name: 'Tom Jerry', age: 26, gender: 'Male' },
      ],
      payment: { pricePerPerson: 210, qty: 6, serviceCharge: 300, option: 'Cash' },
      status: 'Paid',
      uploads: [
        { id: 'f5', name: 'payment.jpg' },
        { id: 'f6', name: 'valid-id.jpg' },
      ],
    },

    b10002: {
      id: 'b10002',
      bookingIdLabel: 'b10002',
      scheduleLabel: 'Jan 14, 2026  9 AM',
      requestDate: '12/7/25',
      representative: {
        name: 'Noah Lim',
        age: 29,
        gender: 'Male',
        email: 'noah@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [{ name: 'Guest A', age: 33, gender: 'Male' }],
      payment: { pricePerPerson: 160, qty: 3, serviceCharge: 120, option: 'GCash' },
      status: 'Reserved',
      uploads: [{ id: 'f7', name: 'id.png' }],
    },

    b10003: {
      id: 'b10003',
      bookingIdLabel: 'b10003',
      scheduleLabel: 'Jan 15, 2026  3 PM',
      requestDate: '12/8/25',
      representative: {
        name: 'Ava Chen',
        age: 24,
        gender: 'Female',
        email: 'ava@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest 1', age: 25, gender: 'Female' },
        { name: 'Guest 2', age: 27, gender: 'Male' },
        { name: 'Guest 3', age: 19, gender: 'Male' },
      ],
      payment: { pricePerPerson: 190, qty: 8, serviceCharge: 350, option: 'Card' },
      status: 'Processing',
      uploads: [{ id: 'f8', name: 'deposit.pdf' }],
    },

    b10004: {
      id: 'b10004',
      bookingIdLabel: 'b10004',
      scheduleLabel: 'Jan 16, 2026  8 AM',
      requestDate: '12/8/25',
      representative: {
        name: 'Liam Cruz',
        age: 32,
        gender: 'Male',
        email: 'liam@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [],
      payment: { pricePerPerson: 220, qty: 2, serviceCharge: 100, option: 'Cash' },
      status: 'Reserved',
      uploads: [],
    },

    b10005: {
      id: 'b10005',
      bookingIdLabel: 'b10005',
      scheduleLabel: 'Jan 17, 2026  10 AM',
      requestDate: '12/9/25',
      representative: {
        name: 'Sophia Reyes',
        age: 30,
        gender: 'Female',
        email: 'sophia@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [{ name: 'Guest A', age: 28, gender: 'Female' }],
      payment: { pricePerPerson: 175, qty: 5, serviceCharge: 200, option: 'GCash' },
      status: 'Paid',
      uploads: [{ id: 'f9', name: 'payment.png' }],
    },

    b10006: {
      id: 'b10006',
      bookingIdLabel: 'b10006',
      scheduleLabel: 'Jan 18, 2026  2 PM',
      requestDate: '12/9/25',
      representative: {
        name: 'Ethan Tan',
        age: 27,
        gender: 'Male',
        email: 'ethan@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest 1', age: 20, gender: 'Male' },
        { name: 'Guest 2', age: 21, gender: 'Male' },
      ],
      payment: { pricePerPerson: 160, qty: 6, serviceCharge: 250, option: 'Card' },
      status: 'Processing',
      uploads: [{ id: 'f10', name: 'receipt.png' }],
    },

    b10007: {
      id: 'b10007',
      bookingIdLabel: 'b10007',
      scheduleLabel: 'Jan 19, 2026  11 AM',
      requestDate: '12/10/25',
      representative: {
        name: 'Isabella Ong',
        age: 25,
        gender: 'Female',
        email: 'isabella@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [{ name: 'Guest A', age: 40, gender: 'Male' }],
      payment: { pricePerPerson: 200, qty: 4, serviceCharge: 180, option: 'Cash' },
      status: 'Reserved',
      uploads: [{ id: 'f11', name: 'id.jpg' }],
    },

    b10008: {
      id: 'b10008',
      bookingIdLabel: 'b10008',
      scheduleLabel: 'Jan 20, 2026  9 AM',
      requestDate: '12/10/25',
      representative: {
        name: 'Daniel Yu',
        age: 33,
        gender: 'Male',
        email: 'daniel@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest 1', age: 29, gender: 'Female' },
        { name: 'Guest 2', age: 30, gender: 'Male' },
      ],
      payment: { pricePerPerson: 155, qty: 7, serviceCharge: 260, option: 'GCash' },
      status: 'Paid',
      uploads: [{ id: 'f12', name: 'payment.jpg' }],
    },

    b10009: {
      id: 'b10009',
      bookingIdLabel: 'b10009',
      scheduleLabel: 'Jan 21, 2026  4 PM',
      requestDate: '12/11/25',
      representative: {
        name: 'Chloe Park',
        age: 22,
        gender: 'Female',
        email: 'chloe@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest A', age: 23, gender: 'Female' },
        { name: 'Guest B', age: 23, gender: 'Male' },
        { name: 'Guest C', age: 24, gender: 'Male' },
      ],
      payment: { pricePerPerson: 170, qty: 10, serviceCharge: 400, option: 'Card' },
      status: 'Processing',
      uploads: [{ id: 'f13', name: 'deposit.jpg' }],
    },

    b10010: {
      id: 'b10010',
      bookingIdLabel: 'b10010',
      scheduleLabel: 'Jan 22, 2026  8 AM',
      requestDate: '12/11/25',
      representative: {
        name: 'Oliver Goh',
        age: 35,
        gender: 'Male',
        email: 'oliver@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [],
      payment: { pricePerPerson: 250, qty: 2, serviceCharge: 120, option: 'Cash' },
      status: 'Reserved',
      uploads: [{ id: 'f14', name: 'id.png' }],
    },

    b10011: {
      id: 'b10011',
      bookingIdLabel: 'b10011',
      scheduleLabel: 'Jan 23, 2026  7 AM',
      requestDate: '12/12/25',
      representative: {
        name: 'Emily Torres',
        age: 29,
        gender: 'Female',
        email: 'emily@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [{ name: 'Guest 1', age: 31, gender: 'Male' }],
      payment: { pricePerPerson: 180, qty: 3, serviceCharge: 130, option: 'GCash' },
      status: 'Paid',
      uploads: [{ id: 'f15', name: 'receipt.pdf' }],
    },

    b10012: {
      id: 'b10012',
      bookingIdLabel: 'b10012',
      scheduleLabel: 'Jan 24, 2026  10 AM',
      requestDate: '12/12/25',
      representative: {
        name: 'William Sy',
        age: 30,
        gender: 'Male',
        email: 'william@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest A', age: 20, gender: 'Female' },
        { name: 'Guest B', age: 21, gender: 'Female' },
      ],
      payment: { pricePerPerson: 165, qty: 6, serviceCharge: 240, option: 'Card' },
      status: 'Processing',
      uploads: [{ id: 'f16', name: 'payment.png' }],
    },

    b10013: {
      id: 'b10013',
      bookingIdLabel: 'b10013',
      scheduleLabel: 'Jan 25, 2026  1 PM',
      requestDate: '12/13/25',
      representative: {
        name: 'Grace Lee',
        age: 26,
        gender: 'Female',
        email: 'grace@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [{ name: 'Guest 1', age: 27, gender: 'Male' }],
      payment: { pricePerPerson: 190, qty: 4, serviceCharge: 160, option: 'Cash' },
      status: 'Reserved',
      uploads: [{ id: 'f17', name: 'id.jpg' }],
    },

    b10014: {
      id: 'b10014',
      bookingIdLabel: 'b10014',
      scheduleLabel: 'Jan 26, 2026  9 AM',
      requestDate: '12/13/25',
      representative: {
        name: 'Benjamin Co',
        age: 34,
        gender: 'Male',
        email: 'benjamin@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest A', age: 45, gender: 'Male' },
        { name: 'Guest B', age: 38, gender: 'Female' },
      ],
      payment: { pricePerPerson: 210, qty: 5, serviceCharge: 210, option: 'GCash' },
      status: 'Paid',
      uploads: [{ id: 'f18', name: 'payment.jpg' }],
    },

    b10015: {
      id: 'b10015',
      bookingIdLabel: 'b10015',
      scheduleLabel: 'Jan 27, 2026  3 PM',
      requestDate: '12/14/25',
      representative: {
        name: 'Hannah Go',
        age: 23,
        gender: 'Female',
        email: 'hannah@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest 1', age: 20, gender: 'Female' },
        { name: 'Guest 2', age: 21, gender: 'Female' },
        { name: 'Guest 3', age: 22, gender: 'Male' },
      ],
      payment: { pricePerPerson: 150, qty: 9, serviceCharge: 380, option: 'Card' },
      status: 'Processing',
      uploads: [{ id: 'f19', name: 'deposit.pdf' }],
    },

    b10016: {
      id: 'b10016',
      bookingIdLabel: 'b10016',
      scheduleLabel: 'Jan 28, 2026  8 AM',
      requestDate: '12/14/25',
      representative: {
        name: 'Jacob Ramos',
        age: 31,
        gender: 'Male',
        email: 'jacob@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [],
      payment: { pricePerPerson: 230, qty: 2, serviceCharge: 110, option: 'Cash' },
      status: 'Reserved',
      uploads: [{ id: 'f20', name: 'id.png' }],
    },

    b10017: {
      id: 'b10017',
      bookingIdLabel: 'b10017',
      scheduleLabel: 'Jan 29, 2026  10 AM',
      requestDate: '12/15/25',
      representative: {
        name: 'Zoe Kim',
        age: 25,
        gender: 'Female',
        email: 'zoe@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [{ name: 'Guest A', age: 26, gender: 'Male' }],
      payment: { pricePerPerson: 180, qty: 5, serviceCharge: 190, option: 'GCash' },
      status: 'Paid',
      uploads: [{ id: 'f21', name: 'payment.png' }],
    },

    b10018: {
      id: 'b10018',
      bookingIdLabel: 'b10018',
      scheduleLabel: 'Jan 30, 2026  2 PM',
      requestDate: '12/15/25',
      representative: {
        name: 'Nathan Wee',
        age: 28,
        gender: 'Male',
        email: 'nathan@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest 1', age: 29, gender: 'Male' },
        { name: 'Guest 2', age: 27, gender: 'Female' },
      ],
      payment: { pricePerPerson: 160, qty: 7, serviceCharge: 260, option: 'Card' },
      status: 'Processing',
      uploads: [{ id: 'f22', name: 'receipt.jpg' }],
    },

    b10019: {
      id: 'b10019',
      bookingIdLabel: 'b10019',
      scheduleLabel: 'Jan 31, 2026  9 AM',
      requestDate: '12/16/25',
      representative: {
        name: 'Paula Dizon',
        age: 27,
        gender: 'Female',
        email: 'paula@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [{ name: 'Guest A', age: 33, gender: 'Female' }],
      payment: { pricePerPerson: 170, qty: 4, serviceCharge: 150, option: 'Cash' },
      status: 'Reserved',
      uploads: [{ id: 'f23', name: 'id.jpg' }],
    },

    b10020: {
      id: 'b10020',
      bookingIdLabel: 'b10020',
      scheduleLabel: 'Feb 1, 2026  4 PM',
      requestDate: '12/16/25',
      representative: {
        name: 'Chris Tan',
        age: 36,
        gender: 'Male',
        email: 'chris@example.com',
        mobile: '09xx-xxx-xxxx',
      },
      otherGuests: [
        { name: 'Guest A', age: 34, gender: 'Male' },
        { name: 'Guest B', age: 30, gender: 'Female' },
      ],
      payment: { pricePerPerson: 200, qty: 6, serviceCharge: 280, option: 'GCash' },
      status: 'Paid',
      uploads: [{ id: 'f24', name: 'payment.jpg' }],
    },
  }),
  []
);
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
    // ---- SEARCH ----
    const matchesSearch =
      !q ||
      (searchBy === 'Representative'
        ? (b.representative?.name ?? '').toLowerCase().includes(q)
        : (b.bookingIdLabel ?? b.id).toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // ---- STATUS (Reserved/Processing/Paid only) ----
    if (filtersApplied.status.size > 0) {
      if (!filtersApplied.status.has(b.status as Status)) return false;
    }

    // ---- GUESTS (exact match) ----
    if (filtersApplied.guests.trim() !== '') {
      const g = Number(filtersApplied.guests);
      if (!Number.isNaN(g) && b.payment.qty !== g) return false;
    }

    // ---- SCHEDULE range (scheduleLabel like "Jan 6, 2026  8 AM") ----
    const sched = toDateOnly(b.scheduleLabel);
    if (schedFrom && sched && sched < schedFrom) return false;
    if (schedTo && sched && sched > schedTo) return false;

    // ---- REQUEST DATE range (requestDate like "12/5/25") ----
    const req = toDateOnly(b.requestDate);
    if (reqFrom && req && req < reqFrom) return false;
    if (reqTo && req && req > reqTo) return false;

    return true;
  });
}, [bookings, query, searchBy, filtersApplied]);

  return (
  <div className="h-full w-full bg-gray-200 flex items-center justify-center hide-scrollbar">
    <div className="h-[95%] w-[95%] bg-gray-200 flex flex-col md:flex-row gap-5 min-w-0">
      
      <div className="h-full flex-[1.9] min-w-0 bg-gray-200">
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

      <div className="h-full flex-1 min-w-0 bg-gray-200">
        <div className="h-full w-full bg-gray-200 flex flex-col gap-5">
          <div className="h-110 w-full bg-gray-200">
            <BookingDetailsCard booking={selectedBooking} />
          </div>

          <div className="h-105 w-full bg-gray-200">
            <CalendarAvailability />
          </div>
        </div>
      </div>

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
  </div>
);
}