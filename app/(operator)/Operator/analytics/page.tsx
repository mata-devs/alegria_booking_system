"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import {
  BookOpen,
  CreditCard,
  Download,
  Share2,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getAnalyticsDashboard, type AnalyticsDashboardResponse } from "@/app/lib/analytics-service";
import { firestore } from "@/app/lib/firebase";

const Filters = dynamic(() => import("@/app/(operator)/operator/analytics/filter"), { ssr: false });
const ChartLineLinear = dynamic(() => import("@/app/(operator)/operator/analytics/linechart"), { ssr: false });
const ChartBarDefault = dynamic(() => import("@/app/(operator)/operator/analytics/barchart"), { ssr: false });
const ChartBarCodesDistribution = dynamic(() => import("@/app/(operator)/operator/analytics/barcharty"), { ssr: false });
const ChartPieSimple = dynamic(() => import("@/app/(operator)/operator/analytics/piechart"), { ssr: false });
const ChartPieCodes = dynamic(() => import("@/app/(operator)/operator/analytics/piechart2"), { ssr: false });
const PaymentMethod = dynamic(() => import("@/app/(operator)/operator/analytics/payment"), { ssr: false });

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type UserRecord = {
  role?: string;
  operatorId?: string;
  operatorID?: string;
  operatorCode?: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveOperatorUid(
  currentUid: string,
  userData: UserRecord,
  options: AnalyticsDashboardResponse["filters"]["options"]["operators"]
) {
  const candidates = [
    currentUid,
    normalizeText(userData.operatorId),
    normalizeText(userData.operatorID),
    normalizeText(userData.operatorCode),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const byUid = options.find((operator) => operator.uid === candidate);
    if (byUid) return byUid.uid;

    const byCode = options.find((operator) => (operator.operatorCode || "").toLowerCase() === candidate.toLowerCase());
    if (byCode) return byCode.uid;
  }

  return currentUid;
}

export default function Analytics() {
  const { authState } = useAuth();
  const uid = authState.status === "authenticated" ? authState.user.uid : null;

  const [dashboard, setDashboard] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeLabel, setScopeLabel] = useState("Admin Overview");

  useEffect(() => {
    if (authState.status === "loading") return;

    let cancelled = false;
    const currentUser: User | null = authState.status === "authenticated" ? authState.user : null;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const baseDashboard = await getAnalyticsDashboard();

        if (!currentUser) {
          if (!cancelled) {
            setDashboard(baseDashboard);
            setScopeLabel("Admin Overview");
          }
          return;
        }

        const userSnapshot = await getDoc(doc(firestore, "users", currentUser.uid));
        const userData = (userSnapshot.exists() ? (userSnapshot.data() as UserRecord) : {}) as UserRecord;
        const role = normalizeText(userData.role).toLowerCase();

        if (role !== "operator") {
          if (!cancelled) {
            setDashboard(baseDashboard);
            setScopeLabel("Admin Overview");
          }
          return;
        }

        const operatorUid = resolveOperatorUid(currentUser.uid, userData, baseDashboard.filters.options.operators);
        const operatorDashboard = await getAnalyticsDashboard({ operators: [operatorUid] });

        if (!cancelled) {
          setDashboard(operatorDashboard);
          setScopeLabel("Operator Overview");
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "Failed to fetch analytics.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.status, uid]);

  const totalBookings = dashboard?.summary.totalBookings ?? 0;
  const grossRevenue = dashboard?.summary.grossRevenue ?? 0;
  const netRevenue = dashboard?.summary.netRevenue ?? 0;

  // Static deltas mirror the InsightFlow mockup until backend exposes period-over-period.
  const deltas = {
    bookings: { value: 12, dir: "up" as const, label: "from last month" },
    gross: { value: 8.4, dir: "up" as const, label: "from last month" },
    net: { value: -2.1, dir: "down" as const, label: "from last month" },
  };

  const liveAsOf = dashboard?.generatedAt
    ? new Date(dashboard.generatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!showFilters) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFilters(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showFilters]);

  return (
    <div className="-m-6 min-h-[calc(100vh-0px)] bg-gray-50">
      {/* Glassy filters overlay */}
      {showFilters && (
        <div
          className="fixed inset-0 z-40 flex lg:left-[4.5rem]"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <style jsx>{`
            @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideInLeft { from { transform: translateX(-12px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
            .anim-fade { animation: fadeInOverlay 180ms ease-out both }
            .anim-slide { animation: slideInLeft 220ms cubic-bezier(0.22,1,0.36,1) both }
          `}</style>
          {/* Frosted backdrop */}
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setShowFilters(false)}
            className="anim-fade absolute inset-0 bg-neutral-900/30 backdrop-blur-sm"
          />
          {/* Glassy panel */}
          <aside
            className="anim-slide relative ml-0 flex h-full w-full max-w-sm flex-col overflow-hidden border-r border-white/40 bg-white/70 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150"
          >
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
              className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/70 text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <span aria-hidden className="text-base leading-none">×</span>
            </button>
            <div className="flex-1 overflow-y-auto">
              <Filters />
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className="min-w-0 flex-1 p-6">
          {/* Page header */}
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold leading-tight text-neutral-900">
                Analytics Overview
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  {loading ? (
                    <>
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
                      Loading dashboard…
                    </>
                  ) : error ? (
                    <span className="inline-flex items-center gap-1.5 text-red-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      {error}
                    </span>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0F5132]" />
                      System data live as of {liveAsOf}
                      <span className="text-gray-300">·</span>
                      <span className="font-medium text-gray-600">{scopeLabel}</span>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  aria-pressed={showFilters}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium shadow-sm transition-colors ${
                    showFilters
                      ? "border-[#0F5132] bg-[#0F5132] text-white hover:bg-[#0c4128]"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  {showFilters ? "Hide Filters" : "Filters"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F5132] px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#0c4128]"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Report
              </button>
            </div>
          </header>

          {/* KPI cards */}
          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Total Bookings"
              value={loading ? "—" : totalBookings.toLocaleString("en-PH")}
              delta={deltas.bookings}
              icon={<BookOpen size={18} />}
              iconBg="bg-emerald-50 text-[#0F5132]"
            />
            <KpiCard
              label="Gross Revenue"
              value={loading ? "—" : formatPeso(grossRevenue)}
              delta={deltas.gross}
              icon={<CreditCard size={18} />}
              iconBg="bg-emerald-50 text-[#0F5132]"
            />
            <KpiCard
              label="Net Revenue"
              value={loading ? "—" : formatPeso(netRevenue)}
              delta={deltas.net}
              icon={<Wallet size={18} />}
              iconBg="bg-emerald-50 text-[#0F5132]"
            />
          </div>

          {/* Trend */}
          <div className="mb-5">
            <ChartLineLinear points={dashboard?.bookingsTrend.points || []} />
          </div>

          {/* Donut + Age + Gauge */}
          <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <ChartPieSimple points={dashboard?.touristNationalities || []} />
            <ChartBarDefault points={dashboard?.touristAgeDistribution || []} />
            <ChartPieCodes
              withPromo={dashboard?.promoCodeStats.withPromo || 0}
              withoutPromo={dashboard?.promoCodeStats.withoutPromo || 0}
            />
          </div>

          {/* Payment + Popular Promo Codes */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <PaymentMethod data={dashboard?.paymentMethods || []} />
            <ChartBarCodesDistribution
              data={dashboard?.affiliatedEntities || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  delta: { value: number; dir: "up" | "down"; label: string };
  icon: React.ReactNode;
  iconBg: string;
}

function KpiCard({ label, value, delta, icon, iconBg }: KpiCardProps) {
  const isUp = delta.dir === "up";
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const trendColor = isUp ? "text-[#0F5132]" : "text-red-600";
  const sign = delta.value > 0 ? "+" : "";

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          {label}
        </p>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      <h3 className="mt-2 text-2xl font-extrabold leading-tight text-neutral-900">
        {value}
      </h3>
      <p
        className={`mt-2 inline-flex items-center gap-1 text-[11px] font-medium ${trendColor}`}
      >
        <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
        {sign}
        {delta.value}% <span className="text-gray-400">{delta.label}</span>
      </p>
    </div>
  );
}
