'use client';

import React from 'react';

export type Status = 'Pending' | 'Confirmed' | 'Complete' | 'Cancelled';

export type BookingFilters = {
  status: Set<Status>;
  guests: string;
  scheduleFrom: string;
  scheduleTo: string;
  requestFrom: string;
  requestTo: string;
};

export function createEmptyFilters(): BookingFilters {
  return {
    status: new Set<Status>(),
    guests: '',
    scheduleFrom: '',
    scheduleTo: '',
    requestFrom: '',
    requestTo: '',
  };
}

export default function FilterModal({
  open,
  onClose,
  filters,
  setFilters,
  onClear,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: BookingFilters;
  setFilters: React.Dispatch<React.SetStateAction<BookingFilters>>;
  onClear: () => void;
  onApply: () => void;
}) {
  if (!open) return null;

  const toggleStatus = (s: Status) => {
    setFilters((prev) => {
      const next = new Set(prev.status);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(s) ? next.delete(s) : next.add(s);
      return { ...prev, status: next };
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] rounded-lg border border-gray-200 bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Filters</h3>
          <button className="text-sm text-[#558B2F] hover:text-[#4a7a28] transition-colors" onClick={onClear}>
            Clear all
          </button>
        </div>

        {/* Status */}
        <div className="mt-3">
          <p className="text-sm font-semibold text-gray-900">Status</p>

          {(['Pending', 'Confirmed', 'Complete', 'Cancelled'] as Status[]).map((s) => (
            <label key={s} className="mt-1.5 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters.status.has(s)}
                onChange={() => toggleStatus(s)}
                className="accent-[#558B2F]"
              />
              {s}
            </label>
          ))}
        </div>

        {/* Guests */}
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700">No. of Guests</p>
          <input
            className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
            type="number"
            placeholder="Input number"
            value={filters.guests}
            onChange={(e) =>
              setFilters((p) => ({ ...p, guests: e.target.value }))
            }
          />
        </div>

        {/* Schedule */}
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700">Schedule</p>
          <p className="mt-1.5 text-xs text-gray-500">From</p>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
            type="date"
            value={filters.scheduleFrom}
            onChange={(e) =>
              setFilters((p) => ({ ...p, scheduleFrom: e.target.value }))
            }
          />
          <p className="mt-2 text-xs text-gray-500">To</p>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
            type="date"
            value={filters.scheduleTo}
            onChange={(e) =>
              setFilters((p) => ({ ...p, scheduleTo: e.target.value }))
            }
          />
        </div>

        {/* Request Date */}
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700">Request Date</p>
          <p className="mt-1.5 text-xs text-gray-500">From</p>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
            type="date"
            value={filters.requestFrom}
            onChange={(e) =>
              setFilters((p) => ({ ...p, requestFrom: e.target.value }))
            }
          />
          <p className="mt-2 text-xs text-gray-500">To</p>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#558B2F] focus:outline-none focus:ring-1 focus:ring-[#558B2F]"
            type="date"
            value={filters.requestTo}
            onChange={(e) =>
              setFilters((p) => ({ ...p, requestTo: e.target.value }))
            }
          />
        </div>
        <button
          className="mt-5 w-full rounded-md bg-[#558B2F] py-2 text-sm font-medium text-white hover:bg-[#4a7a28] transition-colors"
          onClick={onApply}
        >
          Apply
        </button>

      </div>
    </div>
  );
}