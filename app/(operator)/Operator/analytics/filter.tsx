"use client";

import { Calendar, RefreshCw, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type NationalityOption = {
  id: string;
  label: string;
};

type OperatorOption = {
  id: string;
  label: string;
};

interface FiltersSidebarProps {
  ageMin?: number;
  ageMax?: number;
  operators?: OperatorOption[];
  nationalities?: NationalityOption[];
}

const SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const FIELD_LABEL = "block text-[11px] font-medium text-gray-500 mb-1";
const CHECKBOX =
  "h-3.5 w-3.5 rounded-[3px] border border-gray-300 accent-[#0F5132]";

export default function FiltersSidebar({
  ageMin = 18,
  ageMax = 80,
  operators = [
    { id: "op-all", label: "All Operators" },
    { id: "op-1", label: "Metro Transit" },
  ],
  nationalities = [
    { id: "nat-1", label: "Filipino" },
    { id: "nat-2", label: "Chinese" },
    { id: "nat-3", label: "Korean" },
    { id: "nat-4", label: "American" },
    { id: "nat-5", label: "French" },
  ],
}: FiltersSidebarProps) {
  const [fromDate, setFromDate] = useState("2023-01-01");
  const [toDate, setToDate] = useState("2023-12-31");
  const [operatorQuery, setOperatorQuery] = useState("");
  const [nationalityQuery, setNationalityQuery] = useState("");
  const [age, setAge] = useState<number>(Math.round((ageMin + ageMax) / 2));

  const fromRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLInputElement | null>(null);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return;
    ref.current.showPicker?.();
    ref.current.focus();
  };

  const filteredOperators = useMemo(() => {
    const q = operatorQuery.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter((o) => o.label.toLowerCase().includes(q));
  }, [operatorQuery, operators]);

  const filteredNationalities = useMemo(() => {
    const q = nationalityQuery.trim().toLowerCase();
    if (!q) return nationalities;
    return nationalities.filter((n) => n.label.toLowerCase().includes(q));
  }, [nationalityQuery, nationalities]);

  return (
    <aside className="flex min-h-full w-full flex-col overflow-y-auto bg-transparent px-5 py-5 text-gray-900">
      <h3 className={SECTION_LABEL}>Filters</h3>

      <section className="mt-4">
        <h4 className="text-sm font-semibold text-neutral-900">Operators</h4>

        <div className="mt-2 flex h-8 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2">
          <Search className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
          <input
            type="text"
            value={operatorQuery}
            onChange={(e) => setOperatorQuery(e.target.value)}
            placeholder="Find operator..."
            className="h-full w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="mt-3 space-y-1.5">
          {filteredOperators.map((op) => (
            <label
              key={op.id}
              className="flex cursor-pointer items-center gap-2 text-xs text-gray-800"
            >
              <input
                type="checkbox"
                className={CHECKBOX}
                defaultChecked={op.id === "op-all"}
              />
              <span>{op.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h4 className="text-sm font-semibold text-neutral-900">Time Range</h4>

        <div className="mt-2 relative">
          <button
            type="button"
            onClick={() => openPicker(fromRef)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 text-left transition-colors hover:bg-white hover:border-gray-300"
          >
            <span className="flex items-center gap-2 text-xs text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {fromDate
                ? new Date(fromDate).toLocaleDateString("en-US")
                : "From"}
            </span>
          </button>
          <input
            ref={fromRef}
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
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
              {toDate ? new Date(toDate).toLocaleDateString("en-US") : "To"}
            </span>
          </button>
          <input
            ref={toRef}
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="absolute inset-0 opacity-0 pointer-events-none"
            tabIndex={-1}
          />
        </div>
      </section>

      <section className="mt-6">
        <h4 className="text-sm font-semibold text-neutral-900">Demographics</h4>

        <div className="mt-3">
          <label className={FIELD_LABEL}>Age Range</label>
          <input
            type="range"
            min={ageMin}
            max={ageMax}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full accent-[#0F5132]"
          />
          <div className="mt-1 flex justify-between text-[10px] text-gray-500">
            <span>{ageMin}</span>
            <span>{ageMax}+</span>
          </div>
        </div>

        <div className="mt-3">
          <label className={FIELD_LABEL}>Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {["Male", "Female"].map((item) => (
              <label
                key={item}
                className="flex cursor-pointer items-center gap-2 text-xs text-gray-800"
              >
                <input type="checkbox" className={CHECKBOX} />
                <span>{item}</span>
              </label>
            ))}
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
          {nationalityQuery && (
            <div className="mt-2 max-h-28 space-y-1.5 overflow-y-auto pr-1">
              {filteredNationalities.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-2 text-xs text-gray-800"
                >
                  <input type="checkbox" className={CHECKBOX} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </section>

      <button
        type="button"
        className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F5132] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0c4128]"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
        Apply Filters
      </button>
    </aside>
  );
}