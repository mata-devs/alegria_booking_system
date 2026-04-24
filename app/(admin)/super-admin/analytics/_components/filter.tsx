"use client";

import { Calendar, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type OperatorOption = {
  uid: string;
  name: string;
  operatorCode: string | null;
};

type NationalityOption = {
  id: string;
  label: string;
};

interface SuperAdminFiltersProps {
  operators?: OperatorOption[];
  selectedOperators?: string[];
  onSelectedOperatorsChange?: (next: string[]) => void;

  ageMin?: number | string;
  ageMax?: number | string;
  nationalities?: NationalityOption[];
}

const SECTION_LABEL =
  "text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const FIELD_LABEL = "block text-[11px] font-medium text-gray-600 mb-1";
const INPUT_BASE =
  "h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-xs text-gray-800 outline-none transition-colors focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]";
const CHECKBOX =
  "h-3.5 w-3.5 rounded-[3px] border border-gray-300 accent-[#558B2F]";

export default function SuperAdminFilters({
  operators = [],
  selectedOperators = [],
  onSelectedOperatorsChange,
  ageMin = 1,
  ageMax = 20,
  nationalities = [
    { id: "nat-1", label: "Filipino" },
    { id: "nat-2", label: "Chinese" },
    { id: "nat-3", label: "Korean" },
    { id: "nat-4", label: "American" },
    { id: "nat-5", label: "French" },
  ],
}: SuperAdminFiltersProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [operatorQuery, setOperatorQuery] = useState("");
  const [nationalityQuery, setNationalityQuery] = useState("");

  const fromRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLInputElement | null>(null);

  const formatDate = (value: string) => {
    if (!value) return "Select a date";
    const d = new Date(value);
    return d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return;
    ref.current.showPicker?.();
    ref.current.focus();
  };

  const filteredOperators = useMemo(() => {
    const q = operatorQuery.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.operatorCode ?? "").toLowerCase().includes(q),
    );
  }, [operatorQuery, operators]);

  const filteredNationalities = useMemo(() => {
    const q = nationalityQuery.trim().toLowerCase();
    if (!q) return nationalities;
    return nationalities.filter((n) => n.label.toLowerCase().includes(q));
  }, [nationalityQuery, nationalities]);

  const toggleOperator = (uid: string) => {
    if (!onSelectedOperatorsChange) return;
    const set = new Set(selectedOperators);
    if (set.has(uid)) set.delete(uid);
    else set.add(uid);
    onSelectedOperatorsChange(Array.from(set));
  };

  const clearOperators = () => onSelectedOperatorsChange?.([]);

  return (
    <aside className="min-h-full w-full overflow-y-auto border-r border-gray-200 bg-white px-5 py-5 text-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold leading-none text-gray-900">
          Filters
        </h2>
        {selectedOperators.length > 0 && (
          <button
            type="button"
            onClick={clearOperators}
            className="text-[11px] font-medium text-[#558B2F] hover:text-[#4a7a28]"
          >
            Clear
          </button>
        )}
      </div>

      <section className="mt-5">
        <h3 className={SECTION_LABEL}>Operators</h3>
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <div className="flex h-8 items-center gap-2 rounded-md border border-gray-200 bg-white px-2">
            <Search className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              value={operatorQuery}
              onChange={(e) => setOperatorQuery(e.target.value)}
              placeholder="Search operators"
              className="h-full w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="mt-2 max-h-36 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              {filteredOperators.length === 0 && (
                <div className="px-1 py-2 text-xs text-gray-400">
                  No operators
                </div>
              )}
              {filteredOperators.map((op) => (
                <label
                  key={op.uid}
                  className="flex cursor-pointer items-center gap-2 text-xs text-gray-800 hover:text-gray-900"
                >
                  <input
                    type="checkbox"
                    checked={selectedOperators.includes(op.uid)}
                    onChange={() => toggleOperator(op.uid)}
                    className={CHECKBOX}
                  />
                  <span className="truncate">{op.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h3 className={SECTION_LABEL}>Time Range</h3>

        <div className="mt-2 relative">
          <label className={FIELD_LABEL}>From</label>
          <button
            type="button"
            onClick={() => openPicker(fromRef)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 text-left transition-colors hover:bg-white hover:border-gray-300"
          >
            <span className="text-xs text-gray-700">{formatDate(fromDate)}</span>
            <Calendar className="h-4 w-4 text-gray-400" strokeWidth={2} />
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

        <div className="mt-3 relative">
          <label className={FIELD_LABEL}>To</label>
          <button
            type="button"
            onClick={() => openPicker(toRef)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 text-left transition-colors hover:bg-white hover:border-gray-300"
          >
            <span className="text-xs text-gray-700">{formatDate(toDate)}</span>
            <Calendar className="h-4 w-4 text-gray-400" strokeWidth={2} />
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
        <h3 className={SECTION_LABEL}>Demographic</h3>

        <div className="mt-3">
          <label className={FIELD_LABEL}>Age</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              defaultValue={ageMin}
              className={`${INPUT_BASE} w-16 text-center`}
            />
            <span className="text-xs font-medium text-gray-500">—</span>
            <input
              type="text"
              defaultValue={ageMax}
              className={`${INPUT_BASE} w-16 text-center`}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className={FIELD_LABEL}>Gender</label>
          <div className="space-y-1.5">
            {["Male", "Female", "Others"].map((item) => (
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

          <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-800">
            <input type="checkbox" className={CHECKBOX} />
            <span>Select All</span>
          </label>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
            <div className="flex h-8 items-center gap-2 rounded-md border border-gray-200 bg-white px-2">
              <Search className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
              <input
                type="text"
                value={nationalityQuery}
                onChange={(e) => setNationalityQuery(e.target.value)}
                placeholder="Search nationalities"
                className="h-full w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="mt-2 max-h-28 overflow-y-auto pr-1">
              <div className="space-y-1.5">
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
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="mt-8 w-full rounded-xl bg-[#558B2F] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4a7a28]"
      >
        Apply Filters
      </button>
    </aside>
  );
}
