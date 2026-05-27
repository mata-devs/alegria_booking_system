/**
 * Normalize a free-form duration string into a consistent pill label.
 *
 * Drop this into app/lib/format-duration.ts (or wherever you keep utils)
 * and call it before passing `duration` to <PackageCard>.
 *
 * @example
 *   formatDuration("3 Days / 2 Nights") // "3D · 2N"
 *   formatDuration("1 day")             // "1 day"
 *   formatDuration("1")                 // "1 day"
 *   formatDuration("Half day")          // "Half day"
 *   formatDuration("6 hours")           // "6h"
 *   formatDuration("")                  // null
 *
 * @param raw  Free-form input typed by the operator.
 * @param mode "compact" (default — "3D · 2N") or "verbose" ("3 days · 2 nights").
 */
export function formatDuration(
  raw: string | number | null | undefined,
  mode: 'compact' | 'verbose' = 'compact',
): string | null {
  if (raw === null || raw === undefined) return null
  const str = String(raw).trim()
  if (!str) return null

  const lower = str.toLowerCase()

  // ── Literal labels that should pass through untouched ──────────────────
  if (/^half[\s-]?day$/.test(lower)) return 'Half day'
  if (/^full[\s-]?day$/.test(lower)) return 'Full day'
  if (/^multi[\s-]?day$/.test(lower)) return 'Multi-day'

  // ── Hours: "6 hours", "6h", "6 hrs", "2h 30m" ──────────────────────────
  const hMatch = lower.match(/^(\d+)\s*(?:h(?:ours?|rs?)?)\b/i)
  if (hMatch) {
    const h = parseInt(hMatch[1], 10)
    const mMatch = lower.match(/(\d+)\s*m(?:in(?:utes?)?)?\b/i)
    const m = mMatch ? parseInt(mMatch[1], 10) : 0
    if (mode === 'verbose') {
      return m > 0 ? `${h} hour${h > 1 ? 's' : ''} ${m} min` : `${h} hour${h > 1 ? 's' : ''}`
    }
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  // ── Days + nights: "3 Days / 2 Nights", "3D/2N", "3 days · 2 nights" ──
  const dnMatch = lower.match(/(\d+)\s*(?:d(?:ays?)?)?\s*[/·,&+]\s*(\d+)\s*n(?:ights?)?/i)
  if (dnMatch) {
    const d = parseInt(dnMatch[1], 10)
    const n = parseInt(dnMatch[2], 10)
    if (mode === 'verbose') {
      return `${d} day${d > 1 ? 's' : ''} · ${n} night${n > 1 ? 's' : ''}`
    }
    return `${d}D · ${n}N`
  }

  // ── Days only: "1 day", "3 days", "1D", or bare "1" ────────────────────
  const dMatch = lower.match(/^(\d+)\s*(?:d(?:ays?)?)?$/i)
  if (dMatch) {
    const d = parseInt(dMatch[1], 10)
    if (mode === 'verbose') return `${d} day${d > 1 ? 's' : ''}`
    return `${d}D`
  }

  // ── Unknown format — pass through trimmed, but normalize casing ───────
  // (e.g. "Weekend Getaway" stays as-is)
  return str
}

/**
 * Object-form variant for when operators store separate fields.
 *
 * @example
 *   formatDurationFromParts({ days: 3, nights: 2 }) // "3D · 2N"
 *   formatDurationFromParts({ hours: 6 })           // "6h"
 */
export function formatDurationFromParts(
  parts: { days?: number; nights?: number; hours?: number; minutes?: number },
  mode: 'compact' | 'verbose' = 'compact',
): string | null {
  const { days, nights, hours, minutes } = parts

  if (typeof hours === 'number' && hours > 0) {
    if (mode === 'verbose') {
      return minutes ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min` : `${hours} hour${hours > 1 ? 's' : ''}`
    }
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`
  }

  if (typeof days === 'number' && days > 0) {
    if (typeof nights === 'number' && nights > 0) {
      if (mode === 'verbose') return `${days} day${days > 1 ? 's' : ''} · ${nights} night${nights > 1 ? 's' : ''}`
      return `${days}D · ${nights}N`
    }
    if (mode === 'verbose') return `${days} day${days > 1 ? 's' : ''}`
    return `${days}D`
  }

  return null
}
