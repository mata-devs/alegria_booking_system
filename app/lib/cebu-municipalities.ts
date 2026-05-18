/** Official municipality labels (same as operator combobox). */
export const CEBU_MUNICIPALITIES = [
  'Alcantara', 'Alcoy', 'Alegria', 'Aloguinsan', 'Argao',
  'Asturias', 'Badian', 'Balamban', 'Bantayan', 'Barili',
  'Bogo City', 'Boljoon', 'Borbon', 'Carcar City', 'Carmen',
  'Catmon', 'Cebu City', 'Compostela', 'Consolacion', 'Cordova',
  'Dalaguete', 'Danao City', 'Dumanjug', 'Ginatilan', 'Lapu-Lapu City',
  'Liloan', 'Madridejos', 'Malabuyoc', 'Mandaue City', 'Medellin',
  'Minglanilla', 'Moalboal', 'Naga City', 'Oslob', 'Pilar',
  'Pinamungajan', 'Poro', 'Ronda', 'Samboan', 'San Fernando',
  'San Francisco', 'San Remigio', 'Santa Fe', 'Santander', 'Sibonga',
  'Sogod', 'Tabogon', 'Tabuelan', 'Talisay City', 'Toledo City',
  'Tuburan', 'Tudela',
] as const

export type CebuMunicipality = (typeof CEBU_MUNICIPALITIES)[number]

/** URL segment / mock id slug (lowercase, hyphenated). */
export function municipalitySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

const SLUG_TO_CANON = new Map<string, CebuMunicipality>()
for (const m of CEBU_MUNICIPALITIES) {
  SLUG_TO_CANON.set(municipalitySlug(m), m)
}

/** Map common alternate guest-facing labels to combobox values. Keys: lowercased. */
const LOCATION_ALIASES = new Map<string, CebuMunicipality>([
  ['bantayan island', 'Bantayan'],
  ['camotes island', 'Poro'],
])

/**
 * Normalize a Firestore `activityLocation` / `packageLocation` string to one bucket
 * so activities and packages count together even if wording differs slightly.
 */
export function canonicalMunicipalityLabel(raw: string): string {
  const t = raw.trim().replace(/\s+/g, ' ')
  if (!t) return ''
  const alias = LOCATION_ALIASES.get(t.toLowerCase())
  if (alias) return alias
  const exact = CEBU_MUNICIPALITIES.find((m) => m.toLowerCase() === t.toLowerCase())
  if (exact) return exact
  const bySlug = SLUG_TO_CANON.get(municipalitySlug(t))
  if (bySlug) return bySlug
  return t
}

/** Resolve route param `bantayan` → `Bantayan` when it matches an official municipality. */
export function municipalityFromSlug(routeSlug: string): CebuMunicipality | null {
  const key = routeSlug.toLowerCase().trim()
  for (const m of CEBU_MUNICIPALITIES) {
    if (municipalitySlug(m) === key) return m
  }
  return null
}

/**
 * True when a Firestore location field belongs to the municipality for this route
 * (e.g. `/locations/bantayan` matches `activityLocation` / `packageLocation` "Bantayan" or alias).
 */
export function matchesMunicipalityRoute(rawLocation: string, routeSlug: string): boolean {
  const canon = canonicalMunicipalityLabel(String(rawLocation ?? '').trim())
  if (!canon) return false
  const official = municipalityFromSlug(routeSlug)
  if (official) return canon === official
  return municipalitySlug(canon) === routeSlug.toLowerCase().trim()
}
