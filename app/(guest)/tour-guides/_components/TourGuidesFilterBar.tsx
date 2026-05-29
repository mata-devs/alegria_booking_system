'use client'

interface Props {
  locations: string[]
  activeLocation: string | null
  activeFiltersCount: number
  onLocationChange: (loc: string | null) => void
  onClearAll: () => void
}

export function TourGuidesFilterBar({
  locations,
  activeLocation,
  activeFiltersCount,
  onLocationChange,
  onClearAll,
}: Props) {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          <span className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400 shrink-0">Location</span>
          {locations.map((loc) => {
            const active = activeLocation === loc
            return (
              <button
                key={loc}
                type="button"
                onClick={() => onLocationChange(active ? null : loc)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  active
                    ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {loc.replace(', Cebu', '')}
              </button>
            )
          })}

          {activeFiltersCount > 0 && (
            <>
              <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />
              <button
                type="button"
                onClick={onClearAll}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-500 hover:text-gray-800 transition-colors"
              >
                Clear all ({activeFiltersCount})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
