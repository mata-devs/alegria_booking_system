import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
  type Query,
} from 'firebase/firestore';
import { firestore } from './firebase';
import {
  computeAnalyticsDashboard,
  type AnalyticsScope,
  type OperatorOption,
  type EntityByPromo,
} from './analytics-compute';

export type { AnalyticsScope } from './analytics-compute';

/**
 * When `NEXT_PUBLIC_ANALYTICS_FORCE_SAMPLE` is `true` or `1`, the client never calls `/analytics`
 * and always uses {@link SAMPLE_ANALYTICS_DASHBOARD} so charts match the contract while the API is in progress.
 */
export function isAnalyticsSampleForced(): boolean {
  const v = process.env.NEXT_PUBLIC_ANALYTICS_FORCE_SAMPLE;
  return v === "true" || v === "1";
}

export interface AnalyticsQueryFilters {
  operators?: string[];
  startDate?: string;
  endDate?: string;
  minAge?: number;
  maxAge?: number;
  genders?: string[];
  nationalities?: string[];
  topNationalities?: number;
  topEntities?: number;
}
//this is used to display the analytics page should be applicable for both super admin and operator
export interface AnalyticsDashboardResponse {
  generatedAt: string;
  filters: {
    applied: AnalyticsQueryFilters;
    options: {
      operators: Array<{ uid: string; name: string; operatorCode: string | null }>;
      genders: string[]; // ["Male", "Female", "Prefer not to say"]
      nationalities: string[]; // ["PH", "US", "UK", ...], see
    };
  };
  summary: {
    totalBookings: number;
    paidBookings: number;
    totalTravelers: number;
    promoBookings: number;
    grossRevenue: number;
    netRevenue: number;
  };
  bookingsTrend: {
    granularity: "day" | "month";
    points: Array<{ label: string; count: number }>;
  };
  touristNationalities: Array<{ nationality: string; count: number }>;
  touristAgeDistribution: Array<{ range: string; count: number }>;
  promoCodeStats: {
    withPromo: number;
    withoutPromo: number;
  };
  paymentMethods: Array<{ method: string; count: number }>;
  affiliatedEntities: Array<{ entityId: string; entityName: string; count: number }>;
  /** Set when the client used offline sample data (API error / unreachable). */
  _demo?: boolean;
}

/** Demo payload when `/analytics` is unreachable (same figures as former chart comment samples). */
export const SAMPLE_ANALYTICS_DASHBOARD: AnalyticsDashboardResponse = {
  generatedAt: new Date(0).toISOString(),
  filters: {
    applied: {},
    options: {
      operators: [{ uid: "sample", name: "Sample operator", operatorCode: "DEMO" }],
      genders: ["Male", "Female", "Prefer not to say"],
      nationalities: ["PH", "US", "UK", "KR", "CN", "JP"],
    },
  },
  summary: {
    totalBookings: 451,
    paidBookings: 400,
    totalTravelers: 620,
    promoBookings: 75,
    grossRevenue: 500_000,
    netRevenue: 80_000,
  },
  bookingsTrend: {
    granularity: "month",
    points: [
      { label: "January", count: 186 },
      { label: "February", count: 305 },
      { label: "March", count: 237 },
      { label: "April", count: 103 },
      { label: "May", count: 209 },
      { label: "June", count: 214 },
      { label: "July", count: 218 },
      { label: "August", count: 225 },
      { label: "September", count: 102 },
      { label: "October", count: 109 },
      { label: "November", count: 154 },
      { label: "December", count: 400 },
    ],
  },
  touristNationalities: [
    { nationality: "American", count: 275 },
    { nationality: "Chinese", count: 200 },
    { nationality: "Korean", count: 187 },
    { nationality: "Local", count: 173 },
    { nationality: "African", count: 90 },
    { nationality: "Others", count: 0 },
  ],
  touristAgeDistribution: [
    { range: "5", count: 18 },
    { range: "10", count: 25 },
    { range: "15", count: 55 },
    { range: "20", count: 60 },
    { range: "25", count: 70 },
    { range: "30", count: 62 },
    { range: "35", count: 57 },
    { range: "40", count: 50 },
    { range: "45", count: 34 },
    { range: "50", count: 46 },
    { range: "55", count: 37 },
    { range: "60", count: 15 },
    { range: "65", count: 12 },
    { range: "70", count: 11 },
    { range: "75", count: 10 },
  ],
  promoCodeStats: {
    withPromo: 75,
    withoutPromo: 200,
  },
  paymentMethods: [
    { method: "Cash", count: 110 },
    { method: "Gcash", count: 90 },
    { method: "Debit/Credit\nCard", count: 45 },
  ],
  affiliatedEntities: [
    { entityId: "e1", entityName: "Code 1", count: 110 },
    { entityId: "e2", entityName: "Code 2", count: 80 },
    { entityId: "e3", entityName: "Code 3", count: 70 },
    { entityId: "e4", entityName: "Code 4", count: 60 },
    { entityId: "e5", entityName: "Code 5", count: 50 },
    { entityId: "e6", entityName: "Code 6", count: 32 },
    { entityId: "e7", entityName: "Code 7", count: 28 },
    { entityId: "e8", entityName: "Code 8", count: 24 },
    { entityId: "e9", entityName: "Code 9", count: 18 },
    { entityId: "e10", entityName: "Code 10", count: 12 },
    { entityId: "e0", entityName: "Others", count: 28 },
  ],
};

function cloneSampleDashboard(): AnalyticsDashboardResponse {
  return {
    ...SAMPLE_ANALYTICS_DASHBOARD,
    generatedAt: new Date().toISOString(),
    filters: {
      ...SAMPLE_ANALYTICS_DASHBOARD.filters,
      options: {
        ...SAMPLE_ANALYTICS_DASHBOARD.filters.options,
        operators: [...SAMPLE_ANALYTICS_DASHBOARD.filters.options.operators],
      },
    },
    bookingsTrend: {
      ...SAMPLE_ANALYTICS_DASHBOARD.bookingsTrend,
      points: SAMPLE_ANALYTICS_DASHBOARD.bookingsTrend.points.map((p) => ({ ...p })),
    },
    touristNationalities: SAMPLE_ANALYTICS_DASHBOARD.touristNationalities.map((p) => ({ ...p })),
    touristAgeDistribution: SAMPLE_ANALYTICS_DASHBOARD.touristAgeDistribution.map((p) => ({ ...p })),
    paymentMethods: SAMPLE_ANALYTICS_DASHBOARD.paymentMethods.map((p) => ({ ...p })),
    affiliatedEntities: SAMPLE_ANALYTICS_DASHBOARD.affiliatedEntities.map((p) => ({ ...p })),
  };
}

// ── Firestore-backed analytics (Client SDK, real-time via onSnapshot) ─────────
// Operator scope reads ONLY bookings where operatorUid == uid (Firestore rules
// enforce the same). Super-admin reads all, or a filtered operator subset.

function buildBookingsQuery(scope: AnalyticsScope, filters: AnalyticsQueryFilters): Query {
  const base = collection(firestore, 'bookings');
  if (scope.role === 'operator') {
    return query(base, where('operatorUid', '==', scope.uid));
  }
  const ops = filters.operators ?? [];
  if (ops.length === 1) return query(base, where('operatorUid', '==', ops[0]));
  if (ops.length > 1 && ops.length <= 10) return query(base, where('operatorUid', 'in', ops));
  return query(base);
}

let operatorOptionsCache: OperatorOption[] | null = null;
async function loadOperatorOptions(scope: AnalyticsScope): Promise<OperatorOption[]> {
  // Operators don't need (and shouldn't enumerate) the cross-operator list.
  if (scope.role === 'operator') return [];
  if (operatorOptionsCache) return operatorOptionsCache;
  const snap = await getDocs(query(collection(firestore, 'users'), where('role', '==', 'operator')));
  operatorOptionsCache = snap.docs.map((d) => {
    const u = d.data();
    const name =
      (typeof u.companyName === 'string' && u.companyName) ||
      `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() ||
      d.id;
    return { uid: d.id, name, operatorCode: typeof u.operatorId === 'string' ? u.operatorId : null };
  });
  return operatorOptionsCache;
}

async function loadEntityByPromo(bookings: Record<string, unknown>[]): Promise<EntityByPromo> {
  const codes = Array.from(
    new Set(bookings.map((b) => (b.promoCode ? String(b.promoCode).toUpperCase() : '')).filter(Boolean)),
  );
  const map: EntityByPromo = new Map();
  if (codes.length === 0) return map;

  const codeToEntityId = new Map<string, string>();
  for (let i = 0; i < codes.length; i += 10) {
    const chunk = codes.slice(i, i + 10);
    const vsnap = await getDocs(query(collection(firestore, 'voucherCodes'), where('code', 'in', chunk)));
    vsnap.docs.forEach((d) => {
      const v = d.data();
      if (v.code && typeof v.entityId === 'string' && v.entityId) {
        codeToEntityId.set(String(v.code).toUpperCase(), v.entityId);
      }
    });
  }
  const entityIds = Array.from(new Set(codeToEntityId.values()));
  const entityName = new Map<string, string>();
  await Promise.all(
    entityIds.map(async (id) => {
      try {
        const esnap = await getDoc(doc(firestore, 'entities', id));
        if (esnap.exists()) entityName.set(id, String(esnap.data()?.entityName ?? ''));
      } catch {
        // entity not readable by this operator — skip
      }
    }),
  );
  codeToEntityId.forEach((entityId, code) => {
    map.set(code, { entityId, entityName: entityName.get(entityId) ?? '' });
  });
  return map;
}

/** Real-time analytics via onSnapshot over the scoped bookings query. Returns an unsubscribe fn. */
export function subscribeAnalyticsDashboard(
  filters: AnalyticsQueryFilters,
  scope: AnalyticsScope,
  onData: (d: AnalyticsDashboardResponse) => void,
  onError?: (e: Error) => void,
): () => void {
  if (isAnalyticsSampleForced()) {
    onData({ ...cloneSampleDashboard(), _demo: true });
    return () => {};
  }
  return onSnapshot(
    buildBookingsQuery(scope, filters),
    async (snap) => {
      try {
        const bookings = snap.docs.map((d) => d.data() as Record<string, unknown>);
        const [operators, entityByPromo] = await Promise.all([
          loadOperatorOptions(scope),
          loadEntityByPromo(bookings),
        ]);
        onData(computeAnalyticsDashboard({ bookings, operators, entityByPromo, filters }));
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error('Failed to compute analytics'));
      }
    },
    (err) => onError?.(err instanceof Error ? err : new Error('Analytics subscription failed')),
  );
}

/** One-shot (non-realtime) fetch — for callers that don't need a live subscription. */
export async function getAnalyticsDashboard(
  filters: AnalyticsQueryFilters,
  scope: AnalyticsScope,
): Promise<AnalyticsDashboardResponse> {
  if (isAnalyticsSampleForced()) {
    return { ...cloneSampleDashboard(), _demo: true };
  }
  const snap = await getDocs(buildBookingsQuery(scope, filters));
  const bookings = snap.docs.map((d) => d.data() as Record<string, unknown>);
  const [operators, entityByPromo] = await Promise.all([
    loadOperatorOptions(scope),
    loadEntityByPromo(bookings),
  ]);
  return computeAnalyticsDashboard({ bookings, operators, entityByPromo, filters });
}