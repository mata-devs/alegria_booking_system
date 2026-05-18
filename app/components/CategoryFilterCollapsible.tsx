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
  return (
    <div className="w-full">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-green-700 transition-colors"
      >
        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {expanded ? 'Hide' : 'Show'} category filters
        {!expanded && (
          <span className="font-normal text-gray-500">
            {activeSummary ? ` · ${activeSummary}` : ' · All categories'}
          </span>
        )}
      </button>
      {expanded ? <div className="flex flex-wrap gap-2 mt-3">{children}</div> : null}
    </div>
  )
}
