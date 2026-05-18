'use client'

import { Layers, Sparkle } from 'lucide-react'

interface LocationOfferCountsProps {
  activityCount: number
  /** When set (e.g. Firestore list), show package count pill too (including 0). */
  packageCount?: number
  className?: string
}

export function LocationOfferCounts({ activityCount, packageCount, className = '' }: LocationOfferCountsProps) {
  const pill =
    'inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-white text-[11px] font-semibold tabular-nums backdrop-blur-sm ring-1 ring-white/20'

  const label =
    packageCount !== undefined
      ? `${activityCount} activities, ${packageCount} tour packages in this area`
      : `${activityCount} activities in this area`

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label={label}>
      <span className={pill} title="Activities">
        <Sparkle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {activityCount}
      </span>
      {packageCount !== undefined ? (
        <span className={pill} title="Tour packages">
          <Layers className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
          {packageCount}
        </span>
      ) : null}
    </div>
  )
}
