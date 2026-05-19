import type { DocumentData, QuerySnapshot } from 'firebase/firestore'
import type { Location } from '@/app/types'
import { CEBU_MUNICIPALITIES, canonicalMunicipalityLabel, municipalitySlug } from '@/app/lib/cebu-municipalities'

export function countByActivityLocation(snap: QuerySnapshot<DocumentData>): Map<string, number> {
  const m = new Map<string, number>()
  for (const d of snap.docs) {
    const raw = (d.data().activityLocation as string)?.trim()
    if (!raw) continue
    const loc = canonicalMunicipalityLabel(raw)
    if (!loc) continue
    m.set(loc, (m.get(loc) ?? 0) + 1)
  }
  return m
}

export function countByPackageLocation(snap: QuerySnapshot<DocumentData>): Map<string, number> {
  const m = new Map<string, number>()
  for (const d of snap.docs) {
    const raw = (d.data().packageLocation as string)?.trim()
    if (!raw) continue
    const loc = canonicalMunicipalityLabel(raw)
    if (!loc) continue
    m.set(loc, (m.get(loc) ?? 0) + 1)
  }
  return m
}

/** Municipalities with ≥1 active activity and/or ≥1 active tour package (guest-facing). */
export function mergeGuestLocations(
  activityByMuni: Map<string, number>,
  packageByMuni: Map<string, number>,
): Location[] {
  const names = new Set([...activityByMuni.keys(), ...packageByMuni.keys()])
  const next: Location[] = []
  for (const name of names) {
    const ac = activityByMuni.get(name) ?? 0
    const pc = packageByMuni.get(name) ?? 0
    if (ac < 1 && pc < 1) continue
    next.push({
      id: municipalitySlug(name),
      name,
      activityCount: ac,
      packageCount: pc,
      image: '',
    })
  }
  next.sort((a, b) => a.name.localeCompare(b.name))
  return next
}

/**
 * All 52 Cebu municipalities as locations, with activity/package counts filled in
 * where available. Municipalities with content are sorted first, then the rest alphabetically.
 */
export function allCebuMunicipalitiesAsLocations(
  activityByMuni: Map<string, number>,
  packageByMuni: Map<string, number>,
): Location[] {
  const withContent: Location[] = []
  const empty: Location[] = []
  for (const name of CEBU_MUNICIPALITIES) {
    const ac = activityByMuni.get(name) ?? 0
    const pc = packageByMuni.get(name) ?? 0
    const loc: Location = {
      id: municipalitySlug(name),
      name,
      activityCount: ac,
      packageCount: pc,
      image: '',
    }
    if (ac > 0 || pc > 0) withContent.push(loc)
    else empty.push(loc)
  }
  return [...withContent, ...empty]
}
