'use client'

import type { ReactNode } from 'react'

interface CategoryFilterCollapsibleProps {
  expanded: boolean
  onToggle: () => void
  /** Selected tag label when collapsed; omit or null for “all”. */
  activeSummary: string | null
  children: ReactNode
}

export function CategoryFilterCollapsible({
  expanded,
  onToggle,
  activeSummary,
  children,
}: CategoryFilterCollapsibleProps) {
  const btnClass = 'flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-green-700 transition-colors'
  const chevron = (rotated: boolean) => (
    <svg
      className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${rotated ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <div className="w-full">
      {expanded ? (
        <button type="button" aria-expanded="true" onClick={onToggle} className={btnClass}>
          {chevron(true)}
          Hide category filters
        </button>
      ) : (
        <button type="button" aria-expanded="false" onClick={onToggle} className={btnClass}>
          {chevron(false)}
          Show category filters
          <span className="font-normal text-gray-500">
            {activeSummary ? ` · ${activeSummary}` : ' · All categories'}
          </span>
        </button>
      )}
      {expanded && <div className="flex flex-wrap gap-2 mt-3">{children}</div>}
    </div>
  )
}
