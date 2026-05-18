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
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(s) ? next.delete(s) : next.add(s);
      return { ...prev, status: next };
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex lg:left-[4.5rem]" role="dialog" aria-modal="true" aria-label="History filters">
      <style jsx>{`
        @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInLeft { from { transform: translateX(-12px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        .anim-fade { animation: fadeInOverlay 180ms ease-out both }
        .anim-slide { animation: slideInLeft 220ms cubic-bezier(0.22,1,0.36,1) both }
      `}</style>
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-neutral-900/30 backdrop-blur-sm"
      />

      <aside className="anim-slide relative ml-0 flex h-full w-full max-w-sm flex-col overflow-hidden border-r border-white/40 bg-white/70 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/70 text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <span aria-hidden className="text-base leading-none">×</span>
        </button>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Filters</h3>
            <button className="text-xs font-semibold text-[#558B2F] hover:text-[#4a7a28] transition-colors" onClick={onClear}>
              Clear all
            </button>
          </div>

          {/* Status */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900">Status</p>

            {(['Completed', 'Cancelled'] as Status[]).map((s) => (
              <label key={s} className="mt-1.5 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.status.has(s)}
                  onChange={() => toggleStatus(s)}
                  className="h-3.5 w-3.5 rounded-[3px] border border-gray-300 accent-[#558B2F]"
                />
                {s}
              </label>
            ))}
          </div>

          {/* Guests */}
          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-700">No. of Guests</p>
            <input
              className="mt-1.5 h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
              type="number"
              placeholder="Input number"
              value={filters.guests}
              onChange={(e) =>
                setFilters((p) => ({ ...p, guests: e.target.value }))
              }
            />
          </div>

          {/* Schedule */}
          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-700">Schedule</p>
            <p className="mt-1.5 text-xs text-gray-500">From</p>
            <input
              className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
              type="date"
              value={filters.scheduleFrom}
              onChange={(e) =>
                setFilters((p) => ({ ...p, scheduleFrom: e.target.value }))
              }
            />
            <p className="mt-2 text-xs text-gray-500">To</p>
            <input
              className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
              type="date"
              value={filters.scheduleTo}
              onChange={(e) =>
                setFilters((p) => ({ ...p, scheduleTo: e.target.value }))
              }
            />
          </div>

          {/* Request Date */}
          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-700">Request Date</p>
            <p className="mt-1.5 text-xs text-gray-500">From</p>
            <input
              className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
              type="date"
              value={filters.requestFrom}
              onChange={(e) =>
                setFilters((p) => ({ ...p, requestFrom: e.target.value }))
              }
            />
            <p className="mt-2 text-xs text-gray-500">To</p>
            <input
              className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
              type="date"
              value={filters.requestTo}
              onChange={(e) =>
                setFilters((p) => ({ ...p, requestTo: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="border-t border-white/60 px-5 py-4">
          <button
            className="w-full rounded-xl bg-[#558B2F] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4a7a28]"
            onClick={onApply}
          >
            Apply Filters
          </button>
        </div>
      </aside>
    </div>
  );
}