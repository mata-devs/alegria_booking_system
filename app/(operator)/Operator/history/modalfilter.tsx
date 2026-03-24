'use client';

import React from 'react';

export type Status = 'Completed' | 'Cancelled' ;

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
      next.has(s) ? next.delete(s) : next.add(s);
      return { ...prev, status: next };
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* modal */}
      <div className="absolute left-78 top-53 w-[340px] rounded-xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Filters</h3>
          <button className="text-sm text-green-600" onClick={onClear}>
            clear all
          </button>
        </div>

        {/* Status */}
        <div className="mt-1">
          <p className="font-semibold text-neutral-900">Status</p>

          {(['Completed', 'Cancelled'] as Status[]).map((s) => (
            <label key={s} className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={filters.status.has(s)}
                onChange={() => toggleStatus(s)}
              />
              {s}
            </label>
          ))}
        </div>

        {/* Guests */}
        <div className="mt-5">
          <p className="font-semibold text-neutral-700">No. of Guests</p>
          <input
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
            type="number"
            placeholder="Input number"
            value={filters.guests}
            onChange={(e) =>
              setFilters((p) => ({ ...p, guests: e.target.value }))
            }
          />
        </div>

        {/* Schedule */}
        <div className="mt-6">
          <p className="font-semibold text-neutral-700">Schedule</p>
          <p className="mt-2 text-xs text-neutral-500">From</p>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            type="date"
            value={filters.scheduleFrom}
            onChange={(e) =>
              setFilters((p) => ({ ...p, scheduleFrom: e.target.value }))
            }
          />
          <p className="mt-3 text-xs text-neutral-500">To</p>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            type="date"
            value={filters.scheduleTo}
            onChange={(e) =>
              setFilters((p) => ({ ...p, scheduleTo: e.target.value }))
            }
          />
        </div>

        {/* Request Date */}
        <div className="mt-6">
          <p className="font-semibold text-neutral-700">Request Date</p>
          <p className="mt-2 text-xs text-neutral-500">From</p>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            type="date"
            value={filters.requestFrom}
            onChange={(e) =>
              setFilters((p) => ({ ...p, requestFrom: e.target.value }))
            }
          />
          <p className="mt-3 text-xs text-gray-500">To</p>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            type="date"
            value={filters.requestTo}
            onChange={(e) =>
              setFilters((p) => ({ ...p, requestTo: e.target.value }))
            }
          />
        </div>
        <button
          className="mt-6 w-full rounded-lg bg-green-600 py-2 text-white"
          onClick={onApply}
        >
          Apply
        </button>

      </div>
    </div>
  );
}