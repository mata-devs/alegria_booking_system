"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { BookOpen, CreditCard, Wallet } from "lucide-react";
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
  const eyebrow = scopeLabel === "Operator Overview" ? "Operator" : "Admin";

  return (
    <div className="-m-6 min-h-[calc(100vh-0px)] bg-gray-50">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-64 md:shrink-0">
          <Filters />
        </div>

        <div className="min-w-0 flex-1 p-6">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-gray-900">
                Analytics Overview
              </h1>
              <p className="mt-1 text-xs text-gray-500">
                Scope:{" "}
                <span className="font-medium text-gray-700">{scopeLabel}</span>
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

          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white p-5 shadow-sm">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">
                  Total Bookings
                </p>
                <h3 className="mt-1 truncate text-3xl font-extrabold leading-tight text-emerald-900">
                  {loading ? "—" : totalBookings.toLocaleString("en-PH")}
                </h3>
              </div>
              <div className="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <BookOpen size={22} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white p-5 shadow-sm">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">
                  Gross Revenue
                </p>
                <h3 className="mt-1 truncate text-2xl font-extrabold leading-tight text-emerald-900 sm:text-3xl">
                  {loading ? "—" : formatPeso(grossRevenue)}
                </h3>
              </div>
              <div className="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <CreditCard size={22} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">
                  Net Revenue
                </p>
                <h3 className="mt-1 truncate text-2xl font-extrabold leading-tight text-emerald-900 sm:text-3xl">
                  {loading ? "—" : formatPeso(netRevenue)}
                </h3>
              </div>
              <div className="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <Wallet size={22} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <ChartLineLinear points={dashboard?.bookingsTrend.points || []} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="md:col-span-1">
              <ChartPieSimple points={dashboard?.touristNationalities || []} />
            </div>
            <div className="md:col-span-2 lg:col-span-2">
              <ChartBarDefault points={dashboard?.touristAgeDistribution || []} />
            </div>
            <div className="md:col-span-1">
              <ChartPieCodes
                withPromo={dashboard?.promoCodeStats.withPromo || 0}
                withoutPromo={dashboard?.promoCodeStats.withoutPromo || 0}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
