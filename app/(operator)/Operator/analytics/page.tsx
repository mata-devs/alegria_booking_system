"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
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
const TotalBookingsCard = dynamic(() => import("@/app/(operator)/operator/analytics/total"), { ssr: false });
const RevenueCard = dynamic(() => import("@/app/(operator)/operator/analytics/revenue"), { ssr: false });

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

  return (
    <div className="h-full  w-full bg-gray-200 flex items-center justify-center hide-scrollbar">
      <div className="h-full w-full bg-gray-200 flex gap-2 md:flex-row flex-col">
        <div className="h-full w-[15%] bg-gray-200">
          <Filters />
        </div>
        <div className="h-full min-w-0   w-full bg-gray-200 flex gap-5  items-center justify-center hide-scrollbar ">
          <div className="h-[95%] min-w-0  w-[95%] bg-gray-200 flex gap-5 md:flex-row flex-col ">
            <div className="h-full min-w-0  w-[100%] bg-gray-200 gap-5 flex md:flex-col flex-col">
              <div className="h-73 w-[100%] bg-gray-200 rounded-lg">
                <ChartLineLinear points={dashboard?.bookingsTrend.points || []} />
              </div>
              <div className="h-69  w-[100%] bg-gray-200">
                <ChartPieSimple points={dashboard?.touristNationalities || []} />
              </div>
              <div className="h-65  w-[100%] bg-gray-200">
                <ChartBarDefault points={dashboard?.touristAgeDistribution || []} />
              </div>
            </div>
          </div>
          <div className="h-[95%] w-[100%] bg-gray-200 pr-4">
            <div className="mb-2 px-1 text-xs font-semibold text-neutral-600">
              {scopeLabel}
              {loading ? " - Loading..." : ""}
              {error ? ` - ${error}` : ""}
            </div>
            <div className="h-full w-full bg-gray-200 flex md:flex-col flex-col gap-5">
              <div className="h-100 min-w-0 w-full bg-gray-200">
                <div className="h-full w-full bg-gray-200 flex gap-5  items-center justify-center hide-scrollbar">
                  <div className="h-[100%]  w-[100%] bg-gray-200 flex gap-5 md:flex-row flex-col ">
                    <div className="h-full min-w-0  w-[100%] bg-gray-200 flex gap-5 md:flex-col flex-col ">
                      <div className="h-[50%] min-w-0  w-[100%] bg-gray-200">
                        <TotalBookingsCard total={dashboard?.summary.totalBookings || 0} />
                      </div>
                      <div className="h-[100%] min-w-0  w-[100%] bg-gray-200">
                        <ChartPieCodes
                          withPromo={dashboard?.promoCodeStats.withPromo || 0}
                          withoutPromo={dashboard?.promoCodeStats.withoutPromo || 0}
                        />
                      </div>
                    </div>
                    <div className="h-full min-w-0  w-[100%] bg-gray-200 flex gap-5 md:flex-col flex-row ">
                      <div className="h-[50%] min-w-0  w-[100%] bg-gray-200">
                        <RevenueCard
                          grossRevenue={dashboard?.summary.grossRevenue || 0}
                          netRevenue={dashboard?.summary.netRevenue || 0}
                        />
                      </div>
                      <div className="h-[100%] min-w-0 w-[100%] bg-gray-200">
                        <PaymentMethod data={dashboard?.paymentMethods || []} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-120 w-full bg-gray-200">
                <div className="h-full w-full bg-gray-200">
                  <ChartBarCodesDistribution data={dashboard?.affiliatedEntities || []} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
