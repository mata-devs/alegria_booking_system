"use client";

import {
  Calendar,
  CircleQuestionMark,
  Mars,
  RefreshCw,
  RotateCcw,
  Search,
  UserRound,
  Venus,
} from "lucide-react";
import { useMemo, useRef, useState, type ComponentType, type SVGProps } from "react";

export type PromoUsage = "any" | "used" | "unused";
export type FilterGranularity = "day" | "month";

export interface OperatorFilterState {
  startDate?: string;
  endDate?: string;
  minAge?: number;
  maxAge?: number;
  genders?: string[];
  nationalities?: string[];
  /** Client-side filter (backend AnalyticsQueryFilters has no such field). */
  promoUsage?: PromoUsage;
  /** Client-side filter (backend AnalyticsQueryFilters has no such field). */
  paymentMethods?: string[];
  granularity?: FilterGranularity;
  topN?: number;
}

interface FiltersSidebarProps {
  ageMin?: number;
  ageMax?: number;
  value: OperatorFilterState;
  onChange: (next: OperatorFilterState) => void;
  onApply: () => void;
  onReset: () => void;
  nationalityOptions?: string[];
  genderOptions?: string[];
  paymentMethodOptions?: string[];
}

const SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const FIELD_LABEL = "block text-[11px] font-medium text-gray-500 mb-1";
const CHECKBOX =
  "h-3.5 w-3.5 rounded-[3px] border border-gray-300 accent-[#0F5132]";

const DEFAULT_GENDERS = ["Male", "Female", "Prefer not to say"];

const GENDER_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  male: Mars,
  female: Venus,
};

function iconForGender(label: string): ComponentType<SVGProps<SVGSVGElement>> {
  return GENDER_ICONS[label.trim().toLowerCase()] ?? UserRound;
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-[#0F5132] focus:outline-none focus:text-[#0F5132]"
      >
        <CircleQuestionMark className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 w-52 -translate-x-1/2 rounded-md bg-neutral-900 px-2 py-1.5 text-[10px] font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
        <span className="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-neutral-900" />
      </span>
    </span>
  );
}

function toggle<T>(arr: T[] | undefined, item: T): T[] {
  const list = arr ?? [];
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default function FiltersSidebar({
  ageMin = 0,
  ageMax = 100,
  value,
  onChange,
  onApply,
  onReset,
  nationalityOptions = [],
  genderOptions,
  paymentMethodOptions = [],
}: FiltersSidebarProps) {
  const [nationalityQuery, setNationalityQuery] = useState("");

  const fromRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLInputElement | null>(null);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return;
    ref.current.showPicker?.();
    ref.current.focus();
  };

  const genders = genderOptions && genderOptions.length > 0 ? genderOptions : DEFAULT_GENDERS;

  const minAge = value.minAge ?? ageMin;
  const maxAge = value.maxAge ?? ageMax;

  const filteredNationalities = useMemo(() => {
    const q = nationalityQuery.trim().toLowerCase();
    if (!q) return nationalityOptions;
    return nationalityOptions.filter((n) => n.toLowerCase().includes(q));
  }, [nationalityQuery, nationalityOptions]);

  const update = (patch: Partial<OperatorFilterState>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <aside className="flex min-h-full w-full flex-col overflow-y-auto bg-transparent px-5 py-5 text-gray-900">
      <h3 className={SECTION_LABEL}>Filters</h3>

      {/* Time Range */}
      <section className="mt-4">
        <h4 className="text-sm font-semibold text-neutral-900">Time Range</h4>

        <div className="mt-2 relative">
          <button
            type="button"
            onClick={() => openPicker(fromRef)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 text-left transition-colors hover:bg-white hover:border-gray-300"
          >
            <span className="flex items-center gap-2 text-xs text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {value.startDate
                ? new Date(value.startDate).toLocaleDateString("en-US")
                : "From"}
            </span>
          </button>
          <input
            ref={fromRef}
            type="date"
            value={value.startDate ?? ""}
            onChange={(e) => update({ startDate: e.target.value || undefined })}
            className="absolute inset-0 opacity-0 pointer-events-none"
            tabIndex={-1}
          />
        </div>

        <div className="mt-2 relative">
          <button
            type="button"
            onClick={() => openPicker(toRef)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 text-left transition-colors hover:bg-white hover:border-gray-300"
          >
            <span className="flex items-center gap-2 text-xs text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {value.endDate ? new Date(value.endDate).toLocaleDateString("en-US") : "To"}
            </span>
          </button>
          <input
            ref={toRef}
            type="date"
            value={value.endDate ?? ""}
            onChange={(e) => update({ endDate: e.target.value || undefined })}
            className="absolute inset-0 opacity-0 pointer-events-none"
            tabIndex={-1}
          />
        </div>
      </section>

      {/* Demographics */}
      <section className="mt-6">
        <h4 className="text-sm font-semibold text-neutral-900">Demographics</h4>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <label className={FIELD_LABEL}>Age Range</label>
            <span className="text-[10px] font-medium text-gray-600">
              {minAge} – {maxAge}
            </span>
          </div>
          <DualRangeSlider
            min={ageMin}
            max={ageMax}
            minValue={minAge}
            maxValue={maxAge}
            onChange={(lo, hi) => update({ minAge: lo, maxAge: hi })}
          />
          <div className="mt-2 flex justify-between text-[10px] text-gray-500">
            <span>{ageMin}</span>
            <span>{ageMax}+</span>
          </div>
        </div>

        <div className="mt-3">
          <label className={FIELD_LABEL}>Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {genders.map((item) => {
              const checked = (value.genders ?? []).includes(item);
              const Icon = iconForGender(item);
              return (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-2 text-xs text-gray-800"
                >
                  <input
                    type="checkbox"
                    className={CHECKBOX}
                    checked={checked}
                    onChange={() => update({ genders: toggle(value.genders, item) })}
                  />
                  <Icon
                    className={`h-3.5 w-3.5 ${checked ? "text-[#0F5132]" : "text-gray-400"}`}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          <label className={FIELD_LABEL}>Nationality</label>
          <div className="flex h-8 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2">
            <Search className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              value={nationalityQuery}
              onChange={(e) => setNationalityQuery(e.target.value)}
              placeholder="Search country..."
              className="h-full w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>
          {(nationalityQuery || (value.nationalities && value.nationalities.length > 0)) && (
            <div className="mt-2 max-h-32 space-y-1.5 overflow-y-auto pr-1">
              {(nationalityQuery
                ? filteredNationalities
                : (value.nationalities ?? [])
              ).map((code) => {
                const checked = (value.nationalities ?? []).includes(code);
                return (
                  <label
                    key={code}
                    className="flex cursor-pointer items-center gap-2 text-xs text-gray-800"
                  >
                    <input
                      type="checkbox"
                      className={CHECKBOX}
                      checked={checked}
                      onChange={() =>
                        update({ nationalities: toggle(value.nationalities, code) })
                      }
                    />
                    <span>{code}</span>
                  </label>
                );
              })}
              {nationalityQuery && filteredNationalities.length === 0 && (
                <p className="text-[10px] text-gray-400">No matches.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Promo Usage — applied client-side; backend AnalyticsQueryFilters has no such field. */}
      <section className="mt-6">
        <h4 className="text-sm font-semibold text-neutral-900">Promo Usage</h4>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
          {(["any", "used", "unused"] as PromoUsage[]).map((opt) => {
            const active = (value.promoUsage ?? "any") === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => update({ promoUsage: opt })}
                className={`rounded-md border px-2 py-1.5 capitalize transition-colors ${
                  active
                    ? "border-[#0F5132] bg-[#0F5132] text-white"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-white"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </section>

      {/* Payment Method — applied client-side; backend AnalyticsQueryFilters has no such field. */}
      {paymentMethodOptions.length > 0 && (
        <section className="mt-6">
          <h4 className="text-sm font-semibold text-neutral-900">Payment Method</h4>
          <div className="mt-2 space-y-1.5">
            {paymentMethodOptions.map((m) => {
              const checked = (value.paymentMethods ?? []).includes(m);
              return (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-2 text-xs text-gray-800"
                >
                  <input
                    type="checkbox"
                    className={CHECKBOX}
                    checked={checked}
                    onChange={() =>
                      update({ paymentMethods: toggle(value.paymentMethods, m) })
                    }
                  />
                  <span>{m}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* Trend Granularity */}
      <section className="mt-6">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-semibold text-neutral-900">Trend Granularity</h4>
          <InfoTip text="Controls how the Bookings Trend chart groups data points — Monthly aggregates per month, Daily shows day-by-day." />
        </div>
        <div className="mt-2 inline-flex w-full items-center rounded-full bg-gray-100 p-0.5 text-[11px] font-medium">
          {(["month", "day"] as FilterGranularity[]).map((g) => {
            const active = (value.granularity ?? "month") === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => update({ granularity: g })}
                className={`flex-1 rounded-full px-3 py-1 capitalize transition-colors ${
                  active ? "bg-white text-[#0891B2] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {g === "month" ? "Monthly" : "Daily"}
              </button>
            );
          })}
        </div>
      </section>

      {/* Top N */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold text-neutral-900">Top N</h4>
            <InfoTip text="How many top entries to show in ranked lists like Tourist Nationalities and affiliated entities (e.g. Top 5, Top 10)." />
          </div>
          <span className="text-[10px] font-medium text-gray-600">{value.topN ?? 5}</span>
        </div>
        <input
          type="range"
          min={3}
          max={10}
          value={value.topN ?? 5}
          onChange={(e) => update({ topN: Number(e.target.value) })}
          className="mt-2 w-full accent-[#0F5132]"
          aria-label="Top N"
        />
        <div className="mt-1 flex justify-between text-[10px] text-gray-500">
          <span>3</span>
          <span>10</span>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F5132] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0c4128]"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
          Apply Filters
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/60 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </aside>
  );
}

interface DualRangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  step?: number;
  onChange: (lo: number, hi: number) => void;
}

function DualRangeSlider({
  min,
  max,
  minValue,
  maxValue,
  step = 1,
  onChange,
}: DualRangeSliderProps) {
  const [active, setActive] = useState<"lo" | "hi" | null>(null);
  const [hover, setHover] = useState<"lo" | "hi" | null>(null);

  const span = Math.max(1, max - min);
  const loPct = ((minValue - min) / span) * 100;
  const hiPct = ((maxValue - min) / span) * 100;

  const showLo = active === "lo" || hover === "lo";
  const showHi = active === "hi" || hover === "hi";

  return (
    <div className="relative h-6 w-full select-none">
      {/* track */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-100" />
      {/* selected range fill */}
      <div
        className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#0F5132]"
        style={{ left: `${loPct}%`, width: `${Math.max(0, hiPct - loPct)}%` }}
      />

      {/* low thumb tooltip */}
      <div
        className={`pointer-events-none absolute -top-1 z-20 -translate-x-1/2 -translate-y-full rounded-md bg-[#0F5132] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-md transition-opacity ${
          showLo ? "opacity-100" : "opacity-0"
        }`}
        style={{ left: `${loPct}%` }}
      >
        {minValue}
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#0F5132]" />
      </div>
      {/* high thumb tooltip */}
      <div
        className={`pointer-events-none absolute -top-1 z-20 -translate-x-1/2 -translate-y-full rounded-md bg-[#0F5132] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-md transition-opacity ${
          showHi ? "opacity-100" : "opacity-0"
        }`}
        style={{ left: `${hiPct}%` }}
      >
        {maxValue}
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#0F5132]" />
      </div>

      {/* low input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minValue}
        onChange={(e) => {
          const next = Math.min(Number(e.target.value), maxValue);
          onChange(next, maxValue);
        }}
        onPointerDown={() => setActive("lo")}
        onPointerUp={() => setActive(null)}
        onPointerCancel={() => setActive(null)}
        onMouseEnter={() => setHover("lo")}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover("lo")}
        onBlur={() => setHover((h) => (h === "lo" ? null : h))}
        aria-label="Minimum age"
        className="dual-range absolute inset-0 z-10 h-full w-full appearance-none bg-transparent"
        style={{ pointerEvents: "none" }}
      />
      {/* high input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxValue}
        onChange={(e) => {
          const next = Math.max(Number(e.target.value), minValue);
          onChange(minValue, next);
        }}
        onPointerDown={() => setActive("hi")}
        onPointerUp={() => setActive(null)}
        onPointerCancel={() => setActive(null)}
        onMouseEnter={() => setHover("hi")}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover("hi")}
        onBlur={() => setHover((h) => (h === "hi" ? null : h))}
        aria-label="Maximum age"
        className="dual-range absolute inset-0 z-10 h-full w-full appearance-none bg-transparent"
        style={{ pointerEvents: "none" }}
      />

      <style jsx>{`
        .dual-range {
          /* container has no pointer events; thumb gets them via ::-webkit-slider-thumb */
        }
        .dual-range::-webkit-slider-runnable-track {
          height: 100%;
          background: transparent;
        }
        .dual-range::-moz-range-track {
          height: 100%;
          background: transparent;
        }
        .dual-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #0f5132;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          cursor: grab;
          margin-top: 0;
        }
        .dual-range:active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .dual-range::-moz-range-thumb {
          pointer-events: auto;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #0f5132;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          cursor: grab;
        }
        .dual-range:focus {
          outline: none;
        }
        .dual-range:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(15, 81, 50, 0.25);
        }
      `}</style>
    </div>
  );
}