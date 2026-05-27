'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { PricingMode, PricingTier } from '@/app/lib/pricing-tiers';
import { validateTiers, makeDefaultTier, lowestFromPrice, MAX_TIERS } from '@/app/lib/pricing-tiers';

const MODE_TIPS: Record<PricingMode, string> = {
  standard: 'One price per guest. Set cheaper per-person rates for bigger groups.',
  adultChild: 'Charge adults and children different rates within each group-size bracket. Children are guests at the child max age and under.',
};

interface PricingTierBuilderProps {
  mode: PricingMode;
  onModeChange: (mode: PricingMode) => void;
  tiers: PricingTier[];
  onTiersChange: (tiers: PricingTier[]) => void;
  childAgeMax: string;
  onChildAgeMaxChange: (value: string) => void;
}

export function PricingTierBuilder({
  mode,
  onModeChange,
  tiers,
  onTiersChange,
  childAgeMax,
  onChildAgeMaxChange,
}: PricingTierBuilderProps) {
  const isAdultChild = mode === 'adultChild';
  const errors = validateTiers(mode, tiers);
  const fromPrice = lowestFromPrice(mode, tiers);

  const editTier = (index: number, key: keyof PricingTier, value: string) => {
    const next = tiers.map((tier, i) =>
      i === index ? { ...tier, [key]: value === '' ? 0 : Number(value) } : tier,
    );
    onTiersChange(next);
  };

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const start = last ? last.maxPax + 1 : 1;
    onTiersChange([...tiers, makeDefaultTier(start, start + 3)]);
  };

  const removeTier = (index: number) => {
    onTiersChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="block text-xs font-semibold text-gray-600">Pricing mode</label>
          <span className="group relative inline-flex">
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white">
              i
            </span>
            <span className="pointer-events-none absolute bottom-[140%] left-1/2 z-20 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-normal leading-snug text-white opacity-0 transition-opacity group-hover:opacity-100">
              {MODE_TIPS[mode]}
            </span>
          </span>
        </div>
        <div className="inline-flex rounded-full border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => onModeChange('standard')}
            aria-pressed={!isAdultChild}
            className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
              !isAdultChild ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => onModeChange('adultChild')}
            aria-pressed={isAdultChild}
            className={`px-4 py-1.5 text-sm font-semibold border-l border-gray-300 transition-colors ${
              isAdultChild ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Adult + Child
          </button>
        </div>
      </div>

      {isAdultChild && (
        <div className="w-32">
          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Child max age</label>
          <input
            type="number"
            min="1"
            value={childAgeMax}
            onChange={(e) => onChildAgeMaxChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="e.g. 12"
          />
        </div>
      )}

      {/* Tier rows */}
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-gray-500">
            Group-size brackets {fromPrice > 0 && `· from ₱${fromPrice.toLocaleString()}/person`}
          </p>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-gray-400">
              <th className="text-left font-semibold pb-1">Min</th>
              <th />
              <th className="text-left font-semibold pb-1">Max</th>
              {isAdultChild ? (
                <>
                  <th className="text-left font-semibold pb-1 pl-2">Adult ₱</th>
                  <th className="text-left font-semibold pb-1 pl-2">Child ₱</th>
                </>
              ) : (
                <th className="text-left font-semibold pb-1 pl-2">₱ / person</th>
              )}
              <th />
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => (
              <tr key={i}>
                <td className="pr-1 py-1 w-16">
                  <input
                    type="number"
                    min="1"
                    value={tier.minPax || ''}
                    onChange={(e) => editTier(i, 'minPax', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </td>
                <td className="px-1 text-gray-400 text-xs font-semibold">to</td>
                <td className="pr-1 py-1 w-16">
                  <input
                    type="number"
                    min="1"
                    value={tier.maxPax || ''}
                    onChange={(e) => editTier(i, 'maxPax', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </td>
                {isAdultChild ? (
                  <>
                    <td className="pl-2 pr-1 py-1">
                      <input
                        type="number"
                        min="0"
                        value={tier.priceAdult || ''}
                        onChange={(e) => editTier(i, 'priceAdult', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </td>
                    <td className="pl-2 pr-1 py-1">
                      <input
                        type="number"
                        min="0"
                        value={tier.priceChild || ''}
                        onChange={(e) => editTier(i, 'priceChild', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </td>
                  </>
                ) : (
                  <td className="pl-2 pr-1 py-1">
                    <input
                      type="number"
                      min="0"
                      value={tier.price || ''}
                      onChange={(e) => editTier(i, 'price', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </td>
                )}
                <td className="w-9 py-1">
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      title="Remove bracket"
                      aria-label="Remove bracket"
                      className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tiers.length < MAX_TIERS && (
          <button
            type="button"
            onClick={addTier}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
          >
            <Plus className="w-3.5 h-3.5" />
            Add bracket
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-red-500 text-xs flex items-start gap-1">
              <span>⚠</span>
              <span>{err}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
