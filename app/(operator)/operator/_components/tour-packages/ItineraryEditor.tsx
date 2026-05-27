'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { ItineraryStep } from './types';

export function ItineraryEditor({
  steps,
  onChange,
}: {
  steps: ItineraryStep[];
  onChange: (v: ItineraryStep[]) => void;
}) {
  const add = () => onChange([...steps, { itineraryTime: '', itineraryTitle: '', itineraryDescription: '' }]);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof ItineraryStep, v: string) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)));

  return (
    <div>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center pt-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white ring-1 ring-green-400 z-10 shrink-0" />
              {i < steps.length - 1 && (
                <div className="w-px bg-green-200 mt-1" style={{ minHeight: '4.5rem' }} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-start gap-2 mb-2">
                <input
                  type="text"
                  value={step.itineraryTime}
                  onChange={(e) => update(i, 'itineraryTime', e.target.value)}
                  placeholder="e.g. 06:00 AM"
                  className="w-32 shrink-0 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 font-mono"
                />
                <input
                  type="text"
                  value={step.itineraryTitle}
                  onChange={(e) => update(i, 'itineraryTitle', e.target.value)}
                  placeholder="Step title"
                  className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={step.itineraryDescription}
                onChange={(e) => update(i, 'itineraryDescription', e.target.value)}
                placeholder="Describe this step…"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="text-xs text-green-600 font-medium hover:text-green-700 flex items-center gap-1 mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Add step
      </button>
    </div>
  );
}
