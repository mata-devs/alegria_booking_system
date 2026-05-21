'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export interface ChipGridSelectorProps {
  defaults: readonly string[];
  customs: string[];
  value: string[];
  onChange: (next: string[]) => void;
  onAddCustom: (chip: string) => void;
  variant?: 'inclusion' | 'exclusion';
  maxCustomLength?: number;
}

export function ChipGridSelector({
  defaults,
  customs,
  value,
  onChange,
  onAddCustom,
  maxCustomLength = 40,
}: ChipGridSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const allChips = [...defaults, ...customs.filter((c) => !(defaults as readonly string[]).includes(c))];

  const toggle = (chip: string) => {
    if (value.includes(chip)) onChange(value.filter((c) => c !== chip));
    else onChange([...value, chip]);
  };

  const submitCustom = () => {
    const trimmed = customInput.trim().slice(0, maxCustomLength);
    if (!trimmed) return;
    onAddCustom(trimmed);
    if (!value.includes(trimmed)) onChange([...value, trimmed]);
    setCustomInput('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allChips.map((chip) => {
          const selected = value.includes(chip);
          return (
            <button
              key={chip}
              type="button"
              onClick={() => toggle(chip)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-green-600 text-white ring-2 ring-green-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          maxLength={maxCustomLength}
          placeholder="Add custom chip…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitCustom();
            }
          }}
        />
        <button
          type="button"
          onClick={submitCustom}
          className="inline-flex items-center gap-1 rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add custom
        </button>
      </div>
    </div>
  );
}
