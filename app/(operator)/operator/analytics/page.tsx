"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Filters from "@/app/(operator)/operator/analytics/filter";
import ChartLineLinear from "@/app/(operator)/operator/analytics/linechart";
import ChartBarDefault from "@/app/(operator)/operator/analytics/barchart";
import ChartBarCodesDistribution from "@/app/(operator)/operator/analytics/barcharty";
import ChartPieSimple from "@/app/(operator)/operator/analytics/piechart";
import ChartPieCodes from "@/app/(operator)/operator/analytics/piechart2";
import PaymentMethod from "@/app/(operator)/operator/analytics/payment";
import TotalBookingsCard from "@/app/(operator)/operator/analytics/total";
import RevenueCard from "@/app/(operator)/operator/analytics/revenue";
import { getAnalyticsDashboard, type AnalyticsDashboardResponse } from "@/lib/analytics-service";
import { firebaseAuth, firestore } from "@/lib/firebase";

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
  const [dashboard, setDashboard] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeLabel, setScopeLabel] = useState("Admin Overview");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async (currentUser: typeof firebaseAuth.currentUser) => {
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

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      void loadDashboard(currentUser);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

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