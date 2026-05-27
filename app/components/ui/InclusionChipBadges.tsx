'use client';

import {
  DEFAULT_EXCLUSION_CHIPS,
  DEFAULT_INCLUSION_CHIPS,
  inclusionChipIcon,
  isDefaultChip,
} from '@/app/lib/inclusion-chips';

export function InclusionChipBadges({
  chips,
  variant = 'inclusion',
}: {
  chips: string[];
  variant?: 'inclusion' | 'exclusion';
}) {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const isDefault = isDefaultChip(chip, variant);
        if (isDefault && variant === 'inclusion') {
          const Icon = inclusionChipIcon(chip);
          return (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800 ring-1 ring-green-100"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {chip}
            </span>
          );
        }
        return (
          <span
            key={chip}
            className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
          >
            {chip}
          </span>
        );
      })}
    </div>
  );
}

export { DEFAULT_INCLUSION_CHIPS, DEFAULT_EXCLUSION_CHIPS };
