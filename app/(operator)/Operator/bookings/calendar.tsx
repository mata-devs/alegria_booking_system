'use client';

import React, { useMemo, useState } from 'react';

type SlotStatus = 'green' | 'red' | 'orange';

type WeekSlot = {
  id: string;
  dateKey: string;          // YYYY-MM-DD (which day column)
  title: string;            // "Tour 1"
  startHour: number;        // 8 = 8AM
  endHour: number;          // 12 = 12PM
  used: number;             // 20
  capacity: number;         // 30
  status: SlotStatus;       // green/red/orange
};

const WEEKDAYS_SUN0 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfWeekSunday(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // Sun=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  const startFmt = weekStart.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (sameMonth && sameYear) {
    return weekStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  return startFmt;
}

function hourLabel(h: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ampm}`;
}

// demo week events similar to screenshot
function makeDemoWeekSlots(year: number, monthIndex: number): WeekSlot[] {
  // Example: Jan 11–17 week has Tour blocks
  // You can replace this with real data later.
  const mk = (
    y: number,
    m: number,
    day: number,
    title: string,
    startHour: number,
    endHour: number,
    used: number,
    cap: number,
    status: SlotStatus
  ): WeekSlot => ({
    id: `${y}-${m + 1}-${day}-${title}-${startHour}`,
    dateKey: `${y}-${pad2(m + 1)}-${pad2(day)}`,
    title,
    startHour,
    endHour,
    used,
    capacity: cap,
    status,
  });

  return [
    mk(year, monthIndex, 11, 'Tour 1', 8, 12, 20, 30, 'green'),
    mk(year, monthIndex, 12, 'Tour 1', 8, 12, 30, 30, 'red'),
    mk(year, monthIndex, 13, 'Tour 1', 8, 12, 12, 30, 'green'),
    mk(year, monthIndex, 15, 'Tour 1', 8, 12, 25, 30, 'green'),
    mk(year, monthIndex, 16, 'Tour 1', 8, 12, 13, 30, 'green'),

    mk(year, monthIndex, 11, 'Tour 2', 13, 17, 18, 30, 'green'),
    mk(year, monthIndex, 12, 'Tour 2', 13, 17, 10, 30, 'green'),
    mk(year, monthIndex, 13, 'Tour 2', 13, 17, 22, 30, 'green'),
    mk(year, monthIndex, 15, 'Tour 2', 13, 17, 21, 30, 'green'),
    mk(year, monthIndex, 16, 'Tour 2', 13, 17, 30, 30, 'red'),
    mk(year, monthIndex, 17, 'Tour 2', 13, 17, 30, 30, 'red'),
  ];
}

const slotStyles: Record<SlotStatus, { border: string; text: string; bg: string }> = {
  green: { border: 'border-lime-600', text: 'text-lime-700', bg: 'bg-white' },
  orange: { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-white' },
  red: { border: 'border-red-600', text: 'text-red-600', bg: 'bg-white' },
};

type ViewMode = 'Month' | 'Week' | 'Day';
type DayStatus = 'none' | 'green' | 'orange' | 'red';

type DayInfo = {
  dateKey: string; // YYYY-MM-DD
  used: number;
  capacity: number;
  status: DayStatus;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------- date helpers ----------
function pad2(n: number) {
  return String(n).padStart(2, '0');
}
function toKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1);
}
function endOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0);
}
// Monday=0 ... Sunday=6
function weekdayMon0(d: Date) {
  const js = d.getDay(); // Sun=0 ... Sat=6
  return (js + 6) % 7;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
function monthOnlyLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'long' });
}

// ---------- ring ----------
function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 10,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  const dash = c * pct;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-neutral-200"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-orange-400"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center leading-tight">
          <div className="text-xl font-semibold text-neutral-700">
            {value}/{max}
          </div>
          <div className="text-3xl">👥</div>
        </div>
      </div>
    </div>
  );
}

// ---------- demo data ----------
function makeDemoData(year: number, monthIndex: number) {
  // just mock a few colored days similar to your image
  const mk = (day: number, used: number, cap: number, status: DayStatus): DayInfo => ({
    dateKey: `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`,
    used,
    capacity: cap,
    status,
  });

  return [
    mk(6, 20, 70, 'orange'),
    mk(7, 18, 70, 'orange'),
    mk(11, 22, 70, 'orange'),
    mk(12, 45, 70, 'red'),
  ];
}

export default function CalendarAvailability() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>('Month');

  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());

  const demo = useMemo(() => makeDemoData(year, monthIndex), [year, monthIndex]);
  const byKey = useMemo(() => new Map(demo.map((x) => [x.dateKey, x])), [demo]);

  // default selected = 6th if exists, otherwise today
  const defaultSelected = useMemo(() => {
    const sixth = new Date(year, monthIndex, 6);
    const sixthKey = toKey(sixth);
    return byKey.has(sixthKey) ? sixthKey : toKey(new Date(year, monthIndex, today.getDate()));
  }, [byKey, monthIndex, year, today]);

  const [selectedKey, setSelectedKey] = useState<string>(defaultSelected);

  // keep selection valid when month changes
  React.useEffect(() => {
    setSelectedKey(defaultSelected);
  }, [defaultSelected]);

  const monthStart = startOfMonth(year, monthIndex);
  const monthEnd = endOfMonth(year, monthIndex);

  const gridStart = useMemo(() => {
    // start on Monday of the week containing the 1st
    const offset = weekdayMon0(monthStart);
    return addDays(monthStart, -offset);
  }, [monthStart]);

  const days = useMemo(() => {
    // 6 rows * 7 cols = 42
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [gridStart]);

  const selected = byKey.get(selectedKey);
  const selectedDate = new Date(selectedKey);

  const goPrevMonth = () => {
    const m = monthIndex - 1;
    if (m < 0) {
      setMonthIndex(11);
      setYear((y) => y - 1);
    } else {
      setMonthIndex(m);
    }
  };

  const goNextMonth = () => {
    const m = monthIndex + 1;
    if (m > 11) {
      setMonthIndex(0);
      setYear((y) => y + 1);
    } else {
      setMonthIndex(m);
    }
  };

  const statusDotClass: Record<DayStatus, string> = {
    none: 'bg-transparent',
    green: 'bg-lime-500',
    orange: 'bg-orange-400',
    red: 'bg-red-500',
  };

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white py-5 px-5">
      {/* Title row */}
      <div className="flex items-start justify-between">
        <div className="w-full text-center text-lg font-bold text-gray-900">
          Calendar Availability
        </div>

        <div className="ml-4">
          <div className="relative">
            <select
              value={view}
              onChange={(e) => setView(e.target.value as ViewMode)}
              className="appearance-none rounded-md border border-gray-300 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 outline-none hover:bg-gray-50 transition-colors"
            >
              <option>Month</option>
              <option>Week</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600">
              ▾
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-4 flex flex-col gap-4">
        {/* Calendar */}
        <div>
          {/* Month nav bar */}
          <div className="w-full rounded-md bg-[#558B2F] px-3 py-2">
            <div className="flex items-center justify-between text-white">
              <button
                type="button"
                onClick={goPrevMonth}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/15 transition-colors"
                aria-label="Previous month"
              >
                ‹
              </button>

              <div className="text-sm font-semibold">{monthLabel(year, monthIndex)}</div>

              <button
                type="button"
                onClick={goNextMonth}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/15 transition-colors"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="mt-3 w-full">
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#558B2F]">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
              {days.map((d) => {
                const inMonth = d >= monthStart && d <= monthEnd;
                const key = toKey(d);
                const info = byKey.get(key);
                const isSelected = key === selectedKey;

                // dot color
                const dot = info?.status ?? 'none';

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={[
                      'relative mx-auto flex h-9 w-9 items-center justify-center rounded-full',
                      inMonth ? 'text-neutral-900' : 'text-neutral-400',
                      isSelected ? 'bg-orange-100 ring-2 ring-orange-300' : 'hover:bg-neutral-100',
                    ].join(' ')}
                  >
                    <span className="font-medium">{d.getDate()}</span>
                    {/* dot */}
                    {dot !== 'none' && (
                      <span
                        className={[
                          'absolute -top-1 right-1 h-3 w-3 rounded-full ring-2 ring-white',
                          statusDotClass[dot],
                        ].join(' ')}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary card */}
        <div>
          <div className="w-full rounded-lg border border-gray-200 p-6">
            <div className="text-center text-sm font-semibold text-gray-700">
              {monthOnlyLabel(year, monthIndex)}
            </div>

            <div className="mt-2 text-center text-4xl font-extrabold text-gray-900">
              {selectedDate.getDate()}
            </div>

            <div className="mt-5 flex items-center justify-center">
              <ProgressRing value={selected?.used ?? 0} max={selected?.capacity ?? 70} />
            </div>
          </div>
        </div>
      </div>

      {/* View mode note (optional, remove if you want) */}
      {view !== 'Month' && (
        <div className="mt-6 text-sm text-neutral-500">
          (UI only) View mode: <span className="font-semibold">{view}</span>
        </div>
      )}
    </div>
  );
}
