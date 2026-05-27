'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ACTIVITY_TAGS } from '@/app/lib/activity-tags';

export function TagCombobox({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ACTIVITY_TAGS.filter((t) => t.toLowerCase().includes(q));
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (t: string) => {
    onChange(t);
    setSearch(t);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange('');
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        placeholder="Search tag…"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto max-h-[200px]">
          {suggestions.map((t) => (
            <li
              key={t}
              onMouseDown={(e) => {
                e.preventDefault();
                select(t);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 ${
                t === value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
              }`}
            >
              {t}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
