const API_URL = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL
  ?? "http://localhost:5001/alegria-booking-system/asia-southeast1/api";

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

const ANALYTICS_CACHE_TTL_MS = 60_000;
type AnalyticsCacheEntry = { data: AnalyticsDashboardResponse; fetchedAt: number };
const analyticsCache = new Map<string, AnalyticsCacheEntry>();

function analyticsCacheKey(filters: AnalyticsQueryFilters): string {
  const norm = {
    operators: [...(filters.operators ?? [])].sort(),
    startDate: filters.startDate ?? null,
    endDate: filters.endDate ?? null,
    minAge: filters.minAge ?? null,
    maxAge: filters.maxAge ?? null,
    genders: [...(filters.genders ?? [])].sort(),
    nationalities: [...(filters.nationalities ?? [])].sort(),
    topNationalities: filters.topNationalities ?? null,
    topEntities: filters.topEntities ?? null,
  };
  return JSON.stringify(norm);
}

export function invalidateAnalyticsCache() {
  analyticsCache.clear();
}

export async function getAnalyticsDashboard(filters: AnalyticsQueryFilters = {}): Promise<AnalyticsDashboardResponse> {
  if (isAnalyticsSampleForced()) {
    return { ...cloneSampleDashboard(), _demo: true };
  }

  const key = analyticsCacheKey(filters);
  const cached = analyticsCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < ANALYTICS_CACHE_TTL_MS) {
    return cached.data;
  }

  const url = new URL(`${API_URL}/analytics`);

  setCsvParam(url, "operators", filters.operators);
  setOptionalParam(url, "startDate", filters.startDate);
  setOptionalParam(url, "endDate", filters.endDate);
  setOptionalParam(url, "minAge", filters.minAge);
  setOptionalParam(url, "maxAge", filters.maxAge);
  setCsvParam(url, "genders", filters.genders);
  setCsvParam(url, "nationalities", filters.nationalities);
  setOptionalParam(url, "topNationalities", filters.topNationalities);
  setOptionalParam(url, "topEntities", filters.topEntities);

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid JSON from analytics API");
    }

    if (!response.ok) {
      throw new Error(
        typeof data === "object" && data !== null && "error" in data && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Failed to fetch analytics dashboard",
      );
    }

    const result = data as AnalyticsDashboardResponse;
    analyticsCache.set(key, { data: result, fetchedAt: Date.now() });
    return result;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics] API unavailable, using sample dashboard:", e);
    }
    return { ...cloneSampleDashboard(), _demo: true };
  }
}

function setOptionalParam(url: URL, key: string, value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return;
  url.searchParams.set(key, String(value));
}

function setCsvParam(url: URL, key: string, values?: string[]) {
  if (!values?.length) return;
  url.searchParams.set(key, values.join(","));
}