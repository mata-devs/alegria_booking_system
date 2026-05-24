'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Branded date picker. Drops in for `<input type="date">` so the entire
 * trigger + popover stays inside the design system (no native browser
 * calendar). Value is stored as `YYYY-MM-DD` to match existing callers.
 */

type Props = {
  value: string
  onChange: (next: string) => void
  /** Disable selection of past dates. */
  minToday?: boolean
  placeholder?: string
  /** Optional id wired to a hidden input for form integration. */
  id?: string
  className?: string
  /** Tailwind classes applied to the visible button. */
  triggerClassName?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseISO(s: string): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const [, y, mo, d] = m
  const dt = new Date(Number(y), Number(mo) - 1, Number(d))
  return Number.isNaN(dt.getTime()) ? null : dt
}

function toISO(dt: Date): string {
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfMonth(dt: Date): Date {
  return new Date(dt.getFullYear(), dt.getMonth(), 1)
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDisplay(s: string): string {
  const dt = parseISO(s)
  if (!dt) return ''
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DatePopover({
  value,
  onChange,
  minToday = false,
  placeholder = 'Pick a date',
  id,
  className = '',
  triggerClassName = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState<Date>(() => parseISO(value) ?? new Date())
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const next = parseISO(value)
    if (next) setViewMonth(next)
  }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (wrapRef.current && !wrapRef.current.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const today = useMemo(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), t.getDate())
  }, [])

  const selected = parseISO(value)

  const grid = useMemo(() => {
    const first = startOfMonth(viewMonth)
    const lead = first.getDay()
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
    const cells: Array<Date | null> = []
    for (let i = 0; i < lead; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewMonth])

  const monthLabel = `${MONTH_LABELS[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`

  const stepMonth = (delta: number) =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))

  const pick = (dt: Date) => {
    onChange(toISO(dt))
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setOpen(false)
  }

  const isDisabled = (dt: Date) => minToday && dt.getTime() < today.getTime()

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {id && <input id={id} type="hidden" value={value} readOnly />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`text-sm font-medium text-gray-800 w-full bg-transparent outline-none text-left ${value ? '' : 'text-gray-400'} ${triggerClassName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {value ? formatDisplay(value) : placeholder}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Select date"
          className="absolute z-[120] mt-2 w-[300px] rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => stepMonth(-1)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              aria-label="Previous month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
            <button
              type="button"
              onClick={() => stepMonth(1)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              aria-label="Next month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {DAYS.map((d) => (
              <div key={d} className="text-[10px] font-mono tracking-[.12em] uppercase text-gray-400 text-center py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, i) => {
              if (!cell) return <div key={`empty-${i}`} aria-hidden />
              const isToday = sameDay(cell, today)
              const isSelected = selected ? sameDay(cell, selected) : false
              const disabled = isDisabled(cell)
              return (
                <button
                  key={cell.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(cell)}
                  className={`h-9 rounded-full text-xs font-medium transition-colors ${
                    disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#008768] text-white shadow-sm hover:bg-[#003a2d]'
                      : isToday
                      ? 'border border-[#008768] text-[#008768] hover:bg-[#d9efe6]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cell.getDate()}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1)); pick(today) }}
              className="text-xs font-medium text-[#008768] hover:text-[#003a2d]"
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={clear}
                className="text-xs font-medium text-gray-500 hover:text-gray-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
