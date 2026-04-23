"use client";

import Image from "next/image";
import { Search } from "lucide-react";
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

  const toggleOperator = (uid: string) => {
    if (!onSelectedOperatorsChange) return;
    const set = new Set(selectedOperators);
    if (set.has(uid)) set.delete(uid);
    else set.add(uid);
    onSelectedOperatorsChange(Array.from(set));
  };

  return (
    <aside className="min-w-0 min-h-screen bg-white px-5 py-3 text-[#1E1E1E] border-r border-[#BDBDBD]">
      <h2 className="text-center text-xl font-bold leading-none">Filters</h2>

      {/* Operators — super-admin only */}
      <div className="mt-5">
        <h3 className="text-lg font-bold leading-none">Operators</h3>
        <div className="mt-3 rounded-md border border-[#A8A8A8] bg-[#F3F3F3] p-1">
          <div className="flex h-[25px] items-center gap-1 rounded-[4px] border border-[#A8A8A8] bg-white px-1">
            <Search className="h-2.5 w-2.5 text-[#7A7A7A]" strokeWidth={2} />
            <input
              type="text"
              value={operatorQuery}
              onChange={(e) => setOperatorQuery(e.target.value)}
              className="h-full w-full bg-transparent text-[10px] outline-none"
            />
          </div>
          <div className="mt-2 max-h-[120px] overflow-y-auto pr-1">
            <div className="space-y-1">
              {filteredOperators.length === 0 && (
                <div className="text-[10px] text-[#7A7A7A] px-1 py-2">No operators</div>
              )}
              {filteredOperators.map((op) => (
                <label
                  key={op.uid}
                  className="flex items-center gap-1 text-sm text-[#2A2A2A]"
                >
                  <input
                    type="checkbox"
                    checked={selectedOperators.includes(op.uid)}
                    onChange={() => toggleOperator(op.uid)}
                    className="h-[10px] w-[10px] rounded-[2px] border border-[#8D8D8D] accent-[#8BC34A]"
                  />
                  <span className="truncate">{op.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold leading-none">Time Range</h3>

        <div className="mt-3 relative">
          <label className="block text-[7px] text-[#6E6E6E] mb-1">From</label>
          <button
            type="button"
            onClick={() => openPicker(fromRef)}
            className="flex h-[30px] w-full items-center justify-between rounded-md border border-[#A8A8A8] bg-[#F7F7F7] px-2 text-left"
          >
            <span className="flex w-full justify-center text-[10px] text-[#7B7B7B]">
              {formatDate(fromDate)}
            </span>
            <Image src="/date.png" alt="" width={20} height={10} />
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
          <label className="block text-[7px] text-[#6E6E6E] mb-1">To</label>
          <button
            type="button"
            onClick={() => openPicker(toRef)}
            className="flex h-[30px] w-full items-center justify-between rounded-md border border-[#A8A8A8] bg-[#F7F7F7] px-2 text-left"
          >
            <span className="flex w-full justify-center text-[10px] text-[#7B7B7B]">
              {formatDate(toDate)}
            </span>
            <Image src="/date.png" alt="" width={20} height={10} />
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
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold leading-none">Demographic</h3>

        <div className="mt-3">
          <label className="block text-sm text-[#6E6E6E] mb-1">Age</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              defaultValue={ageMin}
              className="h-[18px] w-[42px] rounded-[4px] border border-[#A8A8A8] bg-[#F7F7F7] px-1 text-center text-[7px] text-[#555] outline-none"
            />
            <span className="text-sm font-semibold text-[#5F5F5F]">-</span>
            <input
              type="text"
              defaultValue={ageMax}
              className="h-[18px] w-[42px] rounded-[4px] border border-[#A8A8A8] bg-[#F7F7F7] px-1 text-center text-[7px] text-[#555] outline-none"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm text-[#6E6E6E] mb-1">Gender</label>
          <div className="space-y-1">
            {["Male", "Female", "Others"].map((item) => (
              <label key={item} className="flex items-center gap-1 text-sm text-[#2A2A2A]">
                <input
                  type="checkbox"
                  className="h-[10px] w-[10px] rounded-[2px] border border-[#8D8D8D] accent-[#8BC34A]"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm text-[#6E6E6E] mb-1">Nationality</label>

          <label className="flex items-center gap-1 text-sm text-[#2A2A2A] mb-2">
            <input
              type="checkbox"
              className="h-[10px] w-[10px] rounded-[2px] border border-[#8D8D8D] accent-[#8BC34A]"
            />
            <span>Select All</span>
          </label>

          <div className="rounded-md border border-[#A8A8A8] bg-[#F3F3F3] p-1">
            <div className="flex h-[25px] items-center gap-1 rounded-[4px] border border-[#A8A8A8] bg-white px-1">
              <Search className="h-2.5 w-2.5 text-[#7A7A7A]" strokeWidth={2} />
              <input
                type="text"
                className="h-full w-full bg-transparent text-[7px] outline-none"
              />
            </div>

            <div className="mt-2 h-[92px] overflow-y-auto pr-1">
              <div className="space-y-1">
                {nationalities.map((item) => (
                  <label key={item.id} className="flex items-center gap-1 text-sm text-[#2A2A2A]">
                    <input
                      type="checkbox"
                      className="h-[10px] w-[8px] border border-[#8D8D8D] accent-[#8BC34A]"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
