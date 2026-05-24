export const ACTIVITY_TAGS = [
  'Adventure',
  'Beach',
  'Canyoneering',
  'Culture',
  'Diving',
  'Food Tour',
  'Garden',
  'Hiking',
  'History',
  'Island Hopping',
  'Museum',
  'Snorkeling',
  'Surfing',
  'Waterfalls',
  'Wildlife',
  'Water Sports',
  'Fishing',
  'Boat Tour',
  'Heritage',
  'City Tour',
  'Island Tour',
  'Sightseeing',
  'Viewpoint',
  'Pilgrimage',
  'Religious',
  'Zipline',
  'Paragliding',
  'ATV',
  'Quad Bike',
  'Zoo',
  'Theme Park'
] as const;

export type ActivityTag = (typeof ACTIVITY_TAGS)[number];

// Widens ActivityTag to accept legacy Firestore strings (e.g. deleted tags still stored in docs)
export type StoredActivityTag = ActivityTag | (string & {});

export function normalizeActivityTags(raw: unknown, legacyTag?: unknown): StoredActivityTag[] {
  if (Array.isArray(raw)) {
    const tags = raw
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim());
    if (tags.length > 0) return tags;
  }
  if (typeof legacyTag === 'string' && legacyTag.trim()) return [legacyTag.trim()];
  return [];
}

export function primaryActivityTag(tags: StoredActivityTag[]): StoredActivityTag {
  return tags[0] ?? '';
}

export function formatActivityTagsDisplay(tags: StoredActivityTag[], maxVisible = 2): string {
  if (tags.length === 0) return '';
  if (tags.length <= maxVisible) return tags.join(' · ');
  return `${tags.slice(0, maxVisible).join(' · ')} +${tags.length - maxVisible}`;
}

export function activityHasTag(tags: StoredActivityTag[], tag: string): boolean {
  return tags.some((t) => t === tag);
}
