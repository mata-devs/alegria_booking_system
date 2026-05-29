'use client'

export type SortOption = 'Recommended' | 'Highest rated' | 'Most experienced' | 'Price · low to high' | 'Price · high to low'

export const SORT_OPTIONS: SortOption[] = [
  'Recommended',
  'Highest rated',
  'Most experienced',
  'Price · low to high',
  'Price · high to low',
]

interface Props {
  filteredCount: number
  activeFiltersCount: number
  sortBy: SortOption
  onSortChange: (s: SortOption) => void
}

export function TourGuidesToolbar({ filteredCount, activeFiltersCount, sortBy, onSortChange }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <span className="text-2xl font-extrabold text-gray-900 tracking-[-0.02em]">
          {filteredCount} guide{filteredCount !== 1 ? 's' : ''}
        </span>
        {activeFiltersCount > 0 && (
          <span className="ml-2 text-sm text-gray-400">matching your filters</span>
        )}
      </div>
      <select
        aria-label="Sort guides"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="text-xs sm:text-[13px] px-3 sm:px-3.5 py-2 sm:py-2.5 border border-gray-200 rounded-full bg-white font-medium text-gray-700 outline-none cursor-pointer"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
