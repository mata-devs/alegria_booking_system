"use client"

import { CircleFlag } from "react-circle-flags"
import { countries as cdl } from "country-data-list"
import { Globe2 } from "lucide-react"

type NationalityPoint = {
  nationality: string
  count: number
}

interface ChartPieNationalitiesProps {
  points?: NationalityPoint[]
}

// Manual demonym/alias → ISO-2 map (country-data-list has no demonym field).
// Keys are lowercased input; values are lowercase ISO-2 (CircleFlag expects lowercase).
const DEMONYM_TO_ISO2: Record<string, string> = {
  filipino: "ph",
  filipina: "ph",
  pinoy: "ph",
  local: "ph",
  american: "us",
  chinese: "cn",
  korean: "kr",
  japanese: "jp",
  taiwanese: "tw",
  vietnamese: "vn",
  thai: "th",
  malaysian: "my",
  singaporean: "sg",
  indonesian: "id",
  indian: "in",
  australian: "au",
  british: "gb",
  english: "gb",
  french: "fr",
  german: "de",
  italian: "it",
  spanish: "es",
  canadian: "ca",
  mexican: "mx",
  brazilian: "br",
  russian: "ru",
  dutch: "nl",
  swiss: "ch",
  swedish: "se",
  norwegian: "no",
  danish: "dk",
  finnish: "fi",
  irish: "ie",
  scottish: "gb",
  saudi: "sa",
  emirati: "ae",
  israeli: "il",
  turkish: "tr",
  egyptian: "eg",
  "south african": "za",
  "new zealander": "nz",
  kiwi: "nz",
  "hong konger": "hk",
}

interface CountryRecord {
  alpha2?: string
  name?: string
  status?: string
}

function resolveCountryCode(input: string): string | null {
  if (!input) return null
  const key = input.trim().toLowerCase()
  if (DEMONYM_TO_ISO2[key]) return DEMONYM_TO_ISO2[key]

  const all = cdl.all as CountryRecord[]

  // Already an ISO-2 code?
  if (/^[a-z]{2}$/i.test(key)) {
    const hit = all.find(
      (c) => c.alpha2?.toLowerCase() === key && c.status === "assigned",
    )
    if (hit?.alpha2) return hit.alpha2.toLowerCase()
  }

  // Exact country-name match.
  const byName = all.find(
    (c) => c.name?.toLowerCase() === key && c.status === "assigned",
  )
  if (byName?.alpha2) return byName.alpha2.toLowerCase()

  // Substring match (e.g. "south korea" → "Korea, Republic of").
  const partial = all.find(
    (c) =>
      c.status === "assigned" &&
      typeof c.name === "string" &&
      c.name.toLowerCase().includes(key),
  )
  if (partial?.alpha2) return partial.alpha2.toLowerCase()

  return null
}

export default function ChartPieNationalities({
  points = [],
}: ChartPieNationalitiesProps) {
  const sorted = [...points].sort((a, b) => b.count - a.count)
  const top = sorted.slice(0, 5)
  const max = Math.max(1, ...top.map((p) => p.count))
  const total = top.reduce((sum, p) => sum + p.count, 0) || 1

  return (
    <div className="w-full min-w-0 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-neutral-900">
          Tourist Nationalities
        </h2>
        <button
          type="button"
          className="text-xs font-semibold text-[#0F5132] hover:text-[#0a3a24] hover:underline transition-colors"
        >
          See All
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {top.length === 0 && (
          <li className="text-xs text-gray-400">
            No nationality data available.
          </li>
        )}
        {top.map((item) => {
          const pct = (item.count / max) * 100
          const sharePct = Math.round((item.count / total) * 100)
          const code = resolveCountryCode(item.nationality)
          return (
            <li
              key={item.nationality}
              title={`${item.nationality}: ${item.count.toLocaleString(
                "en-PH",
              )} (${sharePct}%)`}
              className="group grid grid-cols-[20px_110px_1fr_auto] items-center gap-3 rounded-md px-2 py-1 -mx-2 transition-colors hover:bg-emerald-50/60"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-neutral-200 bg-neutral-50">
                {code ? (
                  <CircleFlag
                    countryCode={code}
                    height={20}
                    width={20}
                    className="h-5 w-5 object-cover"
                  />
                ) : (
                  <Globe2
                    className="h-3.5 w-3.5 text-neutral-400"
                    aria-hidden
                  />
                )}
              </span>
              <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500 group-hover:text-[#0F5132]">
                {item.nationality}
              </span>
              <div className="h-3 w-full overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <div
                  className="h-full rounded-full bg-[#0F5132] transition-all group-hover:brightness-110"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="min-w-[3ch] text-right text-xs font-semibold text-neutral-800">
                {sharePct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}