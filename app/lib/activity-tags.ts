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
] as const;

export type ActivityTag = (typeof ACTIVITY_TAGS)[number];

// Widens ActivityTag to accept legacy Firestore strings (e.g. deleted tags still stored in docs)
export type StoredActivityTag = ActivityTag | (string & {});
