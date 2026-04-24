"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, CreditCard, Wallet } from "lucide-react";
import {
  getAnalyticsDashboard,
  type AnalyticsDashboardResponse,
} from "@/app/lib/analytics-service";

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
  const [dashboard, setDashboard] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAnalyticsDashboard(
          selectedOperators.length > 0 ? { operators: selectedOperators } : undefined,
        );
        if (!cancelled) setDashboard(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to fetch analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedOperators]);

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

  return (
    <div className="-m-6 min-h-[calc(100vh-0px)] bg-gray-50">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 md:shrink-0">
          <Filters
            operators={operatorOptions}
            selectedOperators={selectedOperators}
            onSelectedOperatorsChange={setSelectedOperators}
          />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 p-6">
          {/* Header */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Super Admin
              </p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-gray-900">
                Analytics Overview
              </h1>
              <p className="mt-1 text-xs text-gray-500">
                Scope:{" "}
                <span className="font-medium text-gray-700">{scopeText}</span>
              </p>
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
    </div>
  );
}
