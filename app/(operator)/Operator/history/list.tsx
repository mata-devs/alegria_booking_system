import React from 'react';
import type { Booking } from '@/app/(operator)/Operator/history/details';

type BookingStatus = 'Reserved' | 'Paid' | 'Processing' | 'Cancelled' | 'Completed';

const statusStyles: Record<
  BookingStatus,
  { dot: string; pill: string; text: string }
> = {
  Reserved: {
    dot: 'bg-yellow-300',
    pill: 'bg-neutral-100',
    text: 'text-neutral-700',
  },
  Paid: {
    dot: 'bg-green-500',
    pill: 'bg-neutral-100',
    text: 'text-neutral-700',
  },
  Processing: {
    dot: 'bg-orange-500',
    pill: 'bg-neutral-100',
    text: 'text-neutral-700',
  },
  Completed: {
    dot: 'bg-green-500',
    pill: 'bg-neutral-100',
    text: 'text-neutral-700',
  },
  Cancelled: {
    dot: 'bg-orange-500',
    pill: 'bg-neutral-100',
    text: 'text-neutral-700',
  },
};

function pesoShort(n: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 5h16l-6.5 7.4v5.2l-3 1.4v-6.6L4 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 21l-4.3-4.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.7a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M12.78 15.03a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 1 1 1.06 1.06L9.06 10l3.72 3.72a.75.75 0 0 1 0 1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M7.22 15.03a.75.75 0 0 1 0-1.06L10.94 10 7.22 6.28a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function BookingHistoryPanel({
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
  const cancelled = 14;
  const completed = 54;
  const totalBookings = 68;

  const [openSearchBy, setOpenSearchBy] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  const ITEMS_PER_PAGE = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, searchBy, bookings.length]);

  const totalItems = bookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedBookings = bookings.slice(startIndex, endIndex);

  const pageNumbers = React.useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="w-full min-w-0 flex flex-col gap-5">
      <div className="rounded-xl border border-neutral-200 bg-white py-3 sm:px-6 sm:py-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="text-2xl font-semibold text-neutral-900">Booking History</div>

          <div className="w-full md:flex-1 md:flex md:justify-end md:px-20">
            <div className="flex w-full flex-row items-center gap-4 sm:gap-4">
              <div className="text-center flex w-full flex-row items-center">
                <div className="text-center flex w-full flex-row items-center">
                  <div className="text-center flex w-full flex-col items-center">
                    <div className="text-1xl font-bold text-gray-600 sm:text-2xl">{cancelled}</div>
                    <div className="text-base font-semibold text-gray-600 sm:text-xl">Cancelled</div>
                  </div>

                  <div className="h-px w-full bg-gray-200 md:h-14 md:w-px md:bg-gray-400" />

                  <div className="text-center flex w-full flex-col items-center">
                    <div className="text-1xl font-bold text-gray-600 sm:text-2xl">{completed}</div>
                    <div className="text-base font-semibold text-gray-600 sm:text-xl">Completed</div>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-200 md:h-20 md:w-1 md:bg-gray-400" />

              <div className="flex w-70 flex-col justify-center gap-4 pl-1 text-center">
                <div className="text-2xl font-bold text-gray-600 sm:text-3xl">{totalBookings}</div>
                <div className="text-base font-semibold text-gray-900 sm:text-xl">Total bookings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="px-3 pt-1 pb-0">
          <div className="flex flex-row gap-4">
            <button
              type="button"
              className="inline-flex w-[15%] items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-[13px] font-semibold text-white hover:bg-green-700"
              onClick={() => onOpenFilters?.()}
            >
              <FilterIcon className="h-4 w-4" />
              Filters
            </button>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="text-[13px] font-semibold text-neutral-900">Search by:</div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenSearchBy((v) => !v)}
                  className="inline-flex min-w-[180px] items-center justify-between gap-3 rounded-lg border-2 border-green-600 bg-white px-4 py-2 text-[13px] font-semibold text-green-700"
                >
                  <span>{searchBy}</span>
                  <ChevronDownIcon className="h-4 w-4 text-green-700" />
                </button>

                {openSearchBy && (
                  <div
                    className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-lg border-2 border-green-600 bg-white"
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
                        className="w-full px-4 py-3 text-left text-[13px] font-semibold text-green-700 hover:bg-green-50"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative w-full sm:w-[340px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="h-10 w-full rounded-lg border-2 border-neutral-400 pl-10 pr-3 text-[13px] text-neutral-600 outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          </div>

          <div className="px-3 pb-4 pt-3">
            <div className="grid grid-cols-7 gap-3 text-[13px] font-semibold text-gray-900">
              <div className="col-span-1">Booking Id</div>
              <div className="col-span-1">Request Date</div>
              <div className="col-span-1">Representative</div>
              <div className="col-span-1">Schedule</div>
              <div className="col-span-1 text-center">No. of Guests</div>
              <div className="col-span-1">Total</div>
              <div className="col-span-1">Status</div>
            </div>
          </div>

          <div className="space-y-2.5">
            {paginatedBookings.map((b) => {
              const s = statusStyles[b.status];
              const subtotal = b.payment.pricePerPerson * b.payment.qty;
              const total = subtotal + b.payment.serviceCharge;

              return (
                <div
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect?.(b.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelect?.(b.id);
                  }}
                  className={[
                    'cursor-pointer rounded-xl bg-neutral-100 px-4 py-2 transition-colors hover:bg-neutral-200',
                    selectedId === b.id ? 'ring-2 ring-neutral-400' : '',
                  ].join(' ')}
                >
                  <div className="grid grid-cols-7 items-center font-semibold gap-3 text-[14px] text-neutral-800">
                    <div className="col-span-1 truncate">{b.bookingIdLabel ?? b.id}</div>

                    <div className="col-span-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-7 w-px bg-neutral-300" />
                        <span className="truncate">{b.requestDate}</span>
                      </div>
                    </div>

                    <div className="col-span-1 truncate">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-7 w-px bg-neutral-300" />
                        <span className="truncate">{b.representative.name}</span>
                      </div>
                    </div>

                    <div className="col-span-1 truncate">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-7 w-px bg-neutral-300" />
                        <span className="truncate">{b.scheduleLabel}</span>
                      </div>
                    </div>

                    <div className="col-span-1 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="inline-block h-7 w-px bg-neutral-300" />
                        <span>{b.payment.qty}</span>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-7 w-px bg-neutral-300" />
                        <span>{pesoShort(total)}</span>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="flex items-center justify-between">
                        <div
                          className={[
                            'inline-flex items-center gap-2 rounded-full px-3 py-1',
                            s.pill,
                          ].join(' ')}
                        >
                          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                          <span className={`text-[15px] ${s.text}`}>{b.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-neutral-200 pt-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-neutral-500">
                {totalItems === 0
                  ? 'Showing 0 of 0'
                  : `Showing ${startIndex + 1}–${endIndex} of ${totalItems}`}
              </div>

              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                {pageNumbers.map((page) => {
                  const isActive = page === safeCurrentPage;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={[
                        'inline-flex h-10 min-w-[40px] items-center justify-center rounded-lg px-3 text-base font-medium transition-colors',
                        isActive
                          ? 'bg-[#6EA43A] text-white'
                          : 'text-neutral-600 hover:bg-neutral-100',
                      ].join(' ')}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}