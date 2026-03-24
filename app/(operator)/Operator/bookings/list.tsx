import React from 'react';
import { Filter, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Booking } from '@/app/(operator)/Operator/bookings/details';

type BookingStatus =
  | 'Reserved'
  | 'Paid'
  | 'Processing'
  | 'Cancelled'
  | 'Completed';

const statusStyles: Record<
  BookingStatus,
  { dot: string; text: string }
> = {
  Reserved: { dot: 'bg-yellow-300', text: 'text-yellow-700' },
  Paid: { dot: 'bg-green-500', text: 'text-green-700' },
  Processing: { dot: 'bg-orange-500', text: 'text-orange-700' },
  Completed: { dot: 'bg-green-500', text: 'text-green-700' },
  Cancelled: { dot: 'bg-red-500', text: 'text-red-700' },
};

const ROWS_PER_PAGE = 10;

function pesoShort(n: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BookingRequestsPanel({
  bookings,
  onSelect,
  selectedId,
  searchBy,
  setSearchBy,
  query,
  setQuery,
  onOpenFilters,
}: {
  bookings: Booking[];
  onSelect?: (id: string) => void;
  selectedId?: string;
  searchBy: 'Representative' | 'Booking ID';
  setSearchBy: (v: 'Representative' | 'Booking ID') => void;
  query: string;
  setQuery: (v: string) => void;
  onOpenFilters?: () => void;
}) {
  const newBookings24h = 12;
  const totalRequests = 30;

  const [openSearchBy, setOpenSearchBy] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, searchBy, bookings.length]);

  const totalItems = bookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalItems);
  const paginatedBookings = bookings.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Booking Requests</h2>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{newBookings24h}</div>
              <div className="text-sm font-medium text-gray-900">New Bookings (24h)</div>
            </div>

            <div className="h-10 w-px bg-gray-300" />

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{totalRequests}</div>
              <div className="text-sm font-medium text-gray-900">Total Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table panel */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-[#558B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a7a28] transition-colors"
            onClick={() => onOpenFilters?.()}
          >
            <Filter size={16} />
            Filters
          </button>

          <span className="text-sm font-medium text-gray-700">Search by:</span>

          {/* Search-field dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenSearchBy((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#558B2F] px-4 py-1.5 text-sm font-medium text-[#558B2F] hover:bg-green-50 transition-colors"
            >
              {searchBy}
              <ChevronDown size={14} />
            </button>
            {openSearchBy && (
              <div
                className="absolute left-0 top-full z-10 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                onMouseLeave={() => setOpenSearchBy(false)}
              >
                {(['Representative', 'Booking ID'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSearchBy(opt);
                      setOpenSearchBy(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      searchBy === opt ? 'text-[#558B2F] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="rounded-md border border-gray-300 py-1.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
            />
          </div>
        </div>

        {/* Column headers — desktop */}
        <div className="mt-5 hidden md:grid grid-cols-[1fr_0.9fr_1.3fr_1.2fr_0.5fr_0.7fr_0.8fr] gap-0">
          <span className="px-3 text-xs font-bold text-gray-900 truncate">Booking ID</span>
          <span className="px-3 text-xs font-bold text-gray-900 truncate">Request Date</span>
          <span className="px-3 text-xs font-bold text-gray-900 truncate">Representative</span>
          <span className="px-3 text-xs font-bold text-gray-900 truncate">Schedule</span>
          <span className="px-3 text-xs font-bold text-gray-900 text-center truncate">Guests</span>
          <span className="px-3 text-xs font-bold text-gray-900 truncate">Total</span>
          <span className="px-3 text-xs font-bold text-gray-900 truncate">Status</span>
        </div>

        {/* Rows */}
        <div className="mt-3 flex flex-col gap-2">
          {bookings.length === 0 ? (
            <div className="rounded-lg bg-gray-100 px-4 py-4 text-center text-sm text-gray-400">
              No bookings found.
            </div>
          ) : (
            paginatedBookings.map((b) => {
              const s = statusStyles[b.status];
              const subtotal = b.payment.pricePerPerson * b.payment.qty;
              const total = subtotal + b.payment.serviceCharge;

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelect?.(b.id)}
                  className={`rounded-lg text-left transition-colors ${
                    selectedId === b.id
                      ? 'bg-green-100 ring-1 ring-green-300'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[1fr_0.9fr_1.3fr_1.2fr_0.5fr_0.7fr_0.8fr] items-center gap-0">
                    <span className="border-r border-gray-300 px-3 py-3 text-xs text-gray-700 truncate">
                      {b.bookingIdLabel ?? b.id}
                    </span>
                    <span className="border-r border-gray-300 px-3 py-3 text-xs text-gray-700 truncate">
                      {b.requestDate}
                    </span>
                    <span className="border-r border-gray-300 px-3 py-3 text-xs text-gray-700 truncate">
                      {b.representative.name}
                    </span>
                    <span className="border-r border-gray-300 px-3 py-3 text-xs text-gray-700 truncate">
                      {b.scheduleLabel}
                    </span>
                    <span className="border-r border-gray-300 px-3 py-3 text-xs text-gray-700 text-center truncate">
                      {b.payment.qty}
                    </span>
                    <span className="border-r border-gray-300 px-3 py-3 text-xs text-gray-700 truncate">
                      {pesoShort(total)}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-3 text-xs">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />
                      <span className={`truncate ${s.text}`}>{b.status}</span>
                    </span>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {b.representative.name}
                      </span>
                      <span className={`flex items-center gap-1.5 text-xs shrink-0 ml-2 ${s.text}`}>
                        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>ID: {b.bookingIdLabel ?? b.id}</span>
                      <span>{b.scheduleLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{b.payment.qty} guest{b.payment.qty !== 1 ? 's' : ''}</span>
                      <span className="font-medium text-gray-700">{pesoShort(total)}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalItems > ROWS_PER_PAGE && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500">
              Showing {startIndex + 1}–{endIndex} of {totalItems}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 min-w-7 rounded-md px-2 text-xs font-medium transition-colors ${
                    safeCurrentPage === page
                      ? 'bg-[#558B2F] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}