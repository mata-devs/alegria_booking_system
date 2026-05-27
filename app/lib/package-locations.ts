/** Normalize tour package locations from Firestore (array-first, legacy string in non-prod). */
export function normalizePackageLocations(data: {
  packageLocations?: unknown;
  packageLocation?: unknown;
}): string[] {
  if (Array.isArray(data.packageLocations)) {
    const arr = data.packageLocations.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
    if (arr.length > 0) return [...new Set(arr)];
  }
  if (process.env.NODE_ENV !== 'production') {
    const legacy = data.packageLocation;
    if (typeof legacy === 'string' && legacy.trim()) return [legacy.trim()];
  }
  return [];
}

/** Guest card: first N municipality names + "+M more" when over limit. */
export function formatLocationSummary(locations: string[], maxVisible = 2): string {
  if (locations.length === 0) return '';
  const visible = locations.slice(0, maxVisible);
  const more = locations.length - maxVisible;
  if (more <= 0) return visible.join(', ');
  return `${visible.join(', ')} +${more} more`;
}
