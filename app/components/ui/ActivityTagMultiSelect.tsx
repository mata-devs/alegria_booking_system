'use client';

import { useMemo, useState } from 'react';
import { ACTIVITY_TAGS } from '@/app/lib/activity-tags';

export interface ActivityTagMultiSelectProps {
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}

export function ActivityTagMultiSelect({ value, onChange, error }: ActivityTagMultiSelectProps) {
  const [search, setSearch] = useState('');

  const visibleTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ACTIVITY_TAGS;
    return ACTIVITY_TAGS.filter((tag) => tag.toLowerCase().includes(q));
  }, [search]);

  const toggle = (tag: string) => {
    if (value.includes(tag)) onChange(value.filter((t) => t !== tag));
    else onChange([...value, tag]);
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tags…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        autoComplete="off"
      />
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
        {visibleTags.map((tag) => {
          const selected = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                selected
                  ? 'bg-green-600 text-white border-green-600 ring-2 ring-green-400'
                  : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-500">{value.length} tag{value.length === 1 ? '' : 's'} selected</p>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
