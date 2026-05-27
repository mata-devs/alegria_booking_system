"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, CreditCard, SlidersHorizontal, Wallet } from "lucide-react";
import {
  subscribeAnalyticsDashboard,
  type AnalyticsDashboardResponse,
} from "@/app/lib/analytics-service";
import { useAuth } from "@/app/context/AuthContext";

const Filters = dynamic(
  () => import("@/app/(admin)/super-admin/analytics/_components/filter"),
);

const ChartLineLinear = dynamic(() => import("@/app/(operator)/operator/analytics/linechart"));
const ChartBarDefault = dynamic(() => import("@/app/(operator)/operator/analytics/barchart"));
const ChartBarCodesDistribution = dynamic(() => import("@/app/(operator)/operator/analytics/barcharty"));
const ChartPieSimple = dynamic(() => import("@/app/(operator)/operator/analytics/piechart"));
const ChartPieCodes = dynamic(() => import("@/app/(operator)/operator/analytics/piechart2"));
const PaymentMethod = dynamic(() => import("@/app/(operator)/operator/analytics/payment"));

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function SuperAdminAnalyticsPage() {
  const { authState } = useAuth();
  const [dashboard, setDashboard] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (authState.status !== "authenticated") return;
    setLoading(true);
    setError(null);

    // Super-admin scope: all bookings, optionally filtered to selected operators.
    const unsub = subscribeAnalyticsDashboard(
      selectedOperators.length > 0 ? { operators: selectedOperators } : {},
      { role: "super_admin", uid: authState.user.uid },
      (d) => { setDashboard(d); setLoading(false); },
      (e) => { setError(e.message); setLoading(false); },
    );
    return () => unsub();
  }, [authState.status, selectedOperators]);

  const operatorOptions = useMemo(
    () => dashboard?.filters.options.operators ?? [],
    [dashboard],
  );

  const scopeText =
    selectedOperators.length === 0
      ? "All Operators"
      : `${selectedOperators.length} operator${selectedOperators.length === 1 ? "" : "s"} selected`;

  const totalBookings = dashboard?.summary.totalBookings ?? 0;
  const grossRevenue = dashboard?.summary.grossRevenue ?? 0;
  const netRevenue = dashboard?.summary.netRevenue ?? 0;

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
          className="fixed inset-0 z-[70] flex lg:left-[4.5rem]"
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
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setShowFilters(false)}
            className="anim-fade absolute inset-0 bg-neutral-900/30 backdrop-blur-sm"
          />
          <aside className="anim-slide relative ml-0 flex h-full w-full max-w-sm flex-col overflow-hidden border-r border-white/40 bg-white/70 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150">
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
              className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/70 text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <span aria-hidden className="text-base leading-none">×</span>
            </button>
            <div className="flex-1 overflow-y-auto">
              <Filters
                operators={operatorOptions}
                selectedOperators={selectedOperators}
                onSelectedOperatorsChange={setSelectedOperators}
              />
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1 p-6">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Super Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-gray-900">
              Analytics Overview
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs text-gray-500">
                Scope:{" "}
                <span className="font-medium text-gray-700">{scopeText}</span>
              </p>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                aria-pressed={showFilters}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium shadow-sm transition-colors ${
                  showFilters
                    ? "border-[#558B2F] bg-[#558B2F] text-white hover:bg-[#4a7a28]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
            </div>
          </div>

          <div className="text-xs">
            {loading && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
                Loading…
              </span>
            )}
            {error && !loading && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {error}
              </span>
            )}
            {!loading && !error && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[#558B2F]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#558B2F]" />
                Live
              </span>
            )}
          </div>
        </header>

        {/* Top 3 metric cards */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Total Bookings
              </p>
              <p className="mt-1.5 text-3xl font-bold text-[#558B2F]">
                {loading ? "—" : totalBookings}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#558B2F]">
              <BookOpen size={20} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Gross Revenue
              </p>
              <p className="mt-1.5 text-xl font-bold text-[#558B2F]">
                {loading ? "—" : formatPeso(grossRevenue)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CreditCard size={20} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Net Revenue
              </p>
              <p className="mt-1.5 text-xl font-bold text-[#558B2F]">
                {loading ? "—" : formatPeso(netRevenue)}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Wallet size={20} />
            </div>
          </div>
        </div>

        {/* Full-width: Bookings Trend */}
        <div className="mb-5">
          <ChartLineLinear points={dashboard?.bookingsTrend.points || []} />
        </div>

        {/* Mid bento: nationalities (1) | age distribution (2) | promo codes (1) */}
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div>
            <ChartPieSimple points={dashboard?.touristNationalities || []} />
          </div>
          <div className="lg:col-span-2">
            <ChartBarDefault points={dashboard?.touristAgeDistribution || []} />
          </div>
          <div>
            <ChartPieCodes
              withPromo={dashboard?.promoCodeStats.withPromo || 0}
              withoutPromo={dashboard?.promoCodeStats.withoutPromo || 0}
            />
          </div>
        </div>

        {/* Bottom: payment methods | used promo codes */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <PaymentMethod data={dashboard?.paymentMethods || []} />
          </div>
          <div>
            <ChartBarCodesDistribution data={dashboard?.affiliatedEntities || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
