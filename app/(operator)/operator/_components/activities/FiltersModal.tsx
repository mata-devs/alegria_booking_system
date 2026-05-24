'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ACTIVITY_TAGS } from '@/app/lib/activity-tags';
import { CEBU_MUNICIPALITIES } from '@/app/lib/cebu-municipalities';
import { EMPTY_FILTERS } from './constants';
import type { Filters } from './types';

export function FiltersModal({ open, filters, onApply, onClose }: { open: boolean; filters: Filters; onApply: (f: Filters) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Filters>(filters);
  useEffect(() => { if (open) setDraft(filters); }, [open, filters]);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((prev) => ({ ...prev, [k]: v }));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">Filters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
            <div className="flex gap-2">
              {(['all', 'active', 'disabled'] as const).map((s) => (
                <button key={s} onClick={() => set('status', s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${draft.status === s ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'}`}>
                  {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Disabled'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Location</p>
            <select value={draft.location} onChange={(e) => set('location', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
              <option value="">All locations</option>
              {CEBU_MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Tag</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => set('tag', '')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${draft.tag === '' ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'}`}>
                All
              </button>
              {ACTIVITY_TAGS.map((tag) => (
                <button key={tag} onClick={() => set('tag', tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${draft.tag === tag ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Price per Guest (₱)</p>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={draft.priceMin} onChange={(e) => set('priceMin', e.target.value)} placeholder="Min"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              <span className="text-gray-400 text-sm">–</span>
              <input type="number" min="0" value={draft.priceMax} onChange={(e) => set('priceMax', e.target.value)} placeholder="Max"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={() => { setDraft(EMPTY_FILTERS); onApply(EMPTY_FILTERS); onClose(); }}
            className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }}
            className="flex-1 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">Apply</button>
        </div>
      </div>
    </div>
  );
}
