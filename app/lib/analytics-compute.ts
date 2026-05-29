import type { AnalyticsDashboardResponse, AnalyticsQueryFilters } from './analytics-service';

export type AnalyticsScope = { role: 'operator' | 'super_admin'; uid: string };

export type OperatorOption = { uid: string; name: string; operatorCode: string | null };
/** promoCode (UPPER) → entity */
export type EntityByPromo = Map<string, { entityId: string; entityName: string }>;

const GENDERS = ['Male', 'Female', 'Prefer not to say'];
const REVENUE_STATUSES = new Set(['confirmed', 'in_progress', 'completed']);
const AGE_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: 'Under 18', min: 0, max: 17 },
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-54', min: 45, max: 54 },
  { label: '55+', min: 55, max: 200 },
];

type Traveler = { age: number; gender: string; nationality: string };

function toDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function ageBucket(age: number): string {
  const b = AGE_BUCKETS.find((x) => age >= x.min && age <= x.max);
  return b ? b.label : '55+';
}

function isRevenueBooking(b: Record<string, unknown>): boolean {
  return b.paymentStatus === 'paid' || REVENUE_STATUSES.has(String(b.status ?? ''));
}

function travelersOf(b: Record<string, unknown>): Traveler[] {
  const out: Traveler[] = [];
  const rep = b.representative as Record<string, unknown> | undefined;
  if (rep) {
    out.push({ age: Number(rep.age) || 0, gender: String(rep.gender ?? ''), nationality: String(rep.nationality ?? '') });
  }
  const guests = Array.isArray(b.guests) ? (b.guests as Record<string, unknown>[]) : [];
  for (const g of guests) {
    out.push({ age: Number(g.age) || 0, gender: String(g.gender ?? ''), nationality: String(g.nationality ?? '') });
  }
  return out;
}

/**
 * Pure aggregation over already-read booking docs. Operator/admin scoping is applied
 * upstream by the Firestore query + security rules; this only filters by date/demographics.
 */
export function computeAnalyticsDashboard(args: {
  bookings: Record<string, unknown>[];
  operators: OperatorOption[];
  entityByPromo: EntityByPromo;
  filters: AnalyticsQueryFilters;
}): AnalyticsDashboardResponse {
  const { operators, entityByPromo, filters } = args;

  const start = filters.startDate ? toDate(filters.startDate) : null;
  const end = filters.endDate ? toDate(filters.endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const bookings = args.bookings.filter((b) => {
    const created = toDate(b.createdAt);
    if (start && (!created || created < start)) return false;
    if (end && (!created || created > end)) return false;
    return true;
  });

  let totalBookings = 0;
  let paidBookings = 0;
  let totalTravelers = 0;
  let promoBookings = 0;
  let grossRevenue = 0;
  let netRevenue = 0;

  const nationalityCounts = new Map<string, number>();
  const ageCounts = new Map<string, number>();
  const paymentCounts = new Map<string, number>();
  const allNationalities = new Set<string>();
  const entityCounts = new Map<string, { entityId: string; entityName: string; count: number }>();

  let minCreated: Date | null = null;
  let maxCreated: Date | null = null;

  const wantGenders = filters.genders && filters.genders.length > 0 ? new Set(filters.genders) : null;
  const wantNats = filters.nationalities && filters.nationalities.length > 0 ? new Set(filters.nationalities) : null;
  const minAge = typeof filters.minAge === 'number' ? filters.minAge : null;
  const maxAge = typeof filters.maxAge === 'number' ? filters.maxAge : null;

  for (const b of bookings) {
    totalBookings += 1;
    if (b.paymentStatus === 'paid') paidBookings += 1;
    totalTravelers += Number(b.numberOfGuests) || 0;
    if (b.promoCode) promoBookings += 1;
    if (isRevenueBooking(b)) {
      const finalPrice = Number(b.finalPrice) || 0;
      const serviceCharge = Number(b.serviceCharge) || 0;
      grossRevenue += finalPrice;
      netRevenue += Math.max(0, finalPrice - serviceCharge); // operator take: platform convenience fee removed
    }

    const created = toDate(b.createdAt);
    if (created) {
      if (!minCreated || created < minCreated) minCreated = created;
      if (!maxCreated || created > maxCreated) maxCreated = created;
    }

    paymentCounts.set(String(b.paymentMethod ?? 'Unknown'), (paymentCounts.get(String(b.paymentMethod ?? 'Unknown')) ?? 0) + 1);

    if (b.promoCode) {
      const ent = entityByPromo.get(String(b.promoCode).toUpperCase());
      if (ent) {
        const cur = entityCounts.get(ent.entityId) ?? { entityId: ent.entityId, entityName: ent.entityName, count: 0 };
        cur.count += 1;
        entityCounts.set(ent.entityId, cur);
      }
    }

    for (const t of travelersOf(b)) {
      if (t.nationality) allNationalities.add(t.nationality);
      if (wantGenders && !wantGenders.has(t.gender)) continue;
      if (wantNats && !wantNats.has(t.nationality)) continue;
      if (minAge !== null && t.age < minAge) continue;
      if (maxAge !== null && t.age > maxAge) continue;
      if (t.nationality) nationalityCounts.set(t.nationality, (nationalityCounts.get(t.nationality) ?? 0) + 1);
      const bucket = ageBucket(t.age);
      ageCounts.set(bucket, (ageCounts.get(bucket) ?? 0) + 1);
    }
  }

  const spanDays = minCreated && maxCreated ? (maxCreated.getTime() - minCreated.getTime()) / 86_400_000 : 0;
  const granularity: 'day' | 'month' = spanDays > 62 ? 'month' : 'day';
  const trendBuckets = new Map<string, number>();
  for (const b of bookings) {
    const created = toDate(b.createdAt);
    if (!created) continue;
    const mm = String(created.getMonth() + 1).padStart(2, '0');
    const key = granularity === 'month'
      ? `${created.getFullYear()}-${mm}`
      : `${created.getFullYear()}-${mm}-${String(created.getDate()).padStart(2, '0')}`;
    trendBuckets.set(key, (trendBuckets.get(key) ?? 0) + 1);
  }
  const points = Array.from(trendBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, count]) => ({ label, count }));

  const topNats = typeof filters.topNationalities === 'number' ? filters.topNationalities : 8;
  const topEnts = typeof filters.topEntities === 'number' ? filters.topEntities : 8;

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      applied: filters,
      options: {
        operators,
        genders: GENDERS,
        nationalities: Array.from(allNationalities).sort(),
      },
    },
    summary: { totalBookings, paidBookings, totalTravelers, promoBookings, grossRevenue, netRevenue },
    bookingsTrend: { granularity, points },
    touristNationalities: Array.from(nationalityCounts.entries())
      .map(([nationality, count]) => ({ nationality, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topNats),
    touristAgeDistribution: AGE_BUCKETS.map((b) => ({ range: b.label, count: ageCounts.get(b.label) ?? 0 })),
    promoCodeStats: { withPromo: promoBookings, withoutPromo: totalBookings - promoBookings },
    paymentMethods: Array.from(paymentCounts.entries())
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count),
    affiliatedEntities: Array.from(entityCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, topEnts),
  };
}
