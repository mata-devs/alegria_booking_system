'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface ChipGridSelectorProps {
  defaults: readonly string[];
  customs: string[];
  value: string[];
  onChange: (next: string[]) => void;
  onAddCustom: (chip: string) => void | Promise<void>;
  onRemoveCustom?: (chip: string) => void | Promise<void>;
  variant?: 'inclusion' | 'exclusion';
  maxCustomLength?: number;
}

export function ChipGridSelector({
  defaults,
  customs,
  value,
  onChange,
  onAddCustom,
  onRemoveCustom,
  maxCustomLength = 40,
}: ChipGridSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const [saving, setSaving] = useState(false);
  const defaultSet = new Set<string>(defaults);
  const allChips = Array.from(new Set([...defaults, ...customs, ...value]));

  const toggle = (chip: string) => {
    if (value.includes(chip)) onChange(value.filter((c) => c !== chip));
    else onChange([...value, chip]);
  };

  const submitCustom = async () => {
    const trimmed = customInput.trim().slice(0, maxCustomLength);
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onAddCustom(trimmed);
      if (!value.includes(trimmed)) onChange([...value, trimmed]);
      setCustomInput('');
    } finally {
      setSaving(false);
    }
  };

  const deleteCustom = async (chip: string) => {
    if (!onRemoveCustom || saving) return;
    setSaving(true);
    try {
      await onRemoveCustom(chip);
      if (value.includes(chip)) onChange(value.filter((c) => c !== chip));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {allChips.map((chip) => {
          const selected = value.includes(chip);
          const isCustom = !defaultSet.has(chip);
          return (
            <span key={chip} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => toggle(chip)}
                disabled={saving}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-green-600 text-white ring-2 ring-green-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isCustom && onRemoveCustom ? 'rounded-r-none pr-2' : ''}`}
              >
                {chip}
              </button>
              {isCustom && onRemoveCustom && (
                <button
                  type="button"
                  aria-label={`Remove ${chip}`}
                  disabled={saving}
                  onClick={() => void deleteCustom(chip)}
                  className={`rounded-r-full border border-l-0 px-1.5 py-1.5 text-xs transition-colors ${
                    selected
                      ? 'border-green-400 bg-green-600 text-white hover:bg-green-700'
                      : 'border-gray-200 bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          maxLength={maxCustomLength}
          disabled={saving}
          placeholder="Add custom chip…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submitCustom();
            }
          }}
        />
        <button
          type="button"
          disabled={saving || !customInput.trim()}
          onClick={() => void submitCustom()}
          className="inline-flex items-center gap-1 rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : 'Add custom'}
        </button>
      </div>
    </div>
  );
}
