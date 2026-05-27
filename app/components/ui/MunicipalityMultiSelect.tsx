'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CEBU_MUNICIPALITIES } from '@/app/lib/cebu-municipalities';

export interface MunicipalityMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
  placeholder?: string;
  maxVisibleChips?: number;
}

export function MunicipalityMultiSelect({
  value,
  onChange,
  error,
  placeholder = 'Search municipalities…',
  maxVisibleChips = 5,
}: MunicipalityMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CEBU_MUNICIPALITIES.filter(
      (m) => !value.includes(m) && (!q || m.toLowerCase().includes(q)),
    );
  }, [query, value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const visibleChips = expanded ? value : value.slice(0, maxVisibleChips);
  const hiddenCount = Math.max(0, value.length - maxVisibleChips);

  const add = (m: string) => {
    onChange([...value, m]);
    setQuery('');
    setOpen(false);
  };

  const remove = (m: string) => onChange(value.filter((s) => s !== m));

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => onChange(value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full max-h-[200px] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            {suggestions.map((m) => (
              <li
                key={m}
                onMouseDown={(e) => { e.preventDefault(); add(m); }}
                className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-green-50 hover:text-green-700"
              >
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleChips.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 ring-1 ring-green-200"
            >
              {m}
              <button
                type="button"
                onClick={() => remove(m)}
                className="text-green-600 hover:text-red-500"
                aria-label={`Remove ${m}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {!expanded && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              +{hiddenCount} more
            </button>
          )}
          {expanded && value.length > maxVisibleChips && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
