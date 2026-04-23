"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  getAnalyticsDashboard,
  type AnalyticsDashboardResponse,
} from "@/app/lib/analytics-service";

const Filters = dynamic(
  () => import("@/app/(admin)/super-admin/analytics/_components/filter"),
  { ssr: false },
);

// Chart components are pure, props-driven — reuse operator charts to avoid duplication.
const ChartLineLinear = dynamic(() => import("@/app/(operator)/operator/analytics/linechart"), { ssr: false });
const ChartBarDefault = dynamic(() => import("@/app/(operator)/operator/analytics/barchart"), { ssr: false });
const ChartBarCodesDistribution = dynamic(() => import("@/app/(operator)/operator/analytics/barcharty"), { ssr: false });
const ChartPieSimple = dynamic(() => import("@/app/(operator)/operator/analytics/piechart"), { ssr: false });
const ChartPieCodes = dynamic(() => import("@/app/(operator)/operator/analytics/piechart2"), { ssr: false });
const PaymentMethod = dynamic(() => import("@/app/(operator)/operator/analytics/payment"), { ssr: false });
const TotalBookingsCard = dynamic(() => import("@/app/(operator)/operator/analytics/total"), { ssr: false });
const RevenueCard = dynamic(() => import("@/app/(operator)/operator/analytics/revenue"), { ssr: false });

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

  const scopeLabel =
    selectedOperators.length === 0
      ? "Super Admin Overview — All Operators"
      : `Super Admin Overview — ${selectedOperators.length} operator(s) selected`;

  return (
    <div className="-m-6 h-[calc(100vh-0px)] w-[calc(100%+3rem)] bg-gray-200 flex items-stretch justify-center hide-scrollbar">
      <div className="h-full w-full bg-gray-200 flex gap-2 md:flex-row flex-col">
        <div className="h-full w-[15%] bg-gray-200">
          <Filters
            operators={operatorOptions}
            selectedOperators={selectedOperators}
            onSelectedOperatorsChange={setSelectedOperators}
          />
        </div>

        <div className="h-full min-w-0 w-full bg-gray-200 flex gap-5 items-center justify-center hide-scrollbar">
          <div className="h-[95%] min-w-0 w-[95%] bg-gray-200 flex gap-5 md:flex-row flex-col">
            <div className="h-full min-w-0 w-[100%] bg-gray-200 gap-5 flex md:flex-col flex-col">
              <div className="h-73 w-[100%] bg-gray-200 rounded-lg">
                <ChartLineLinear points={dashboard?.bookingsTrend.points || []} />
              </div>
              <div className="h-69 w-[100%] bg-gray-200">
                <ChartPieSimple points={dashboard?.touristNationalities || []} />
              </div>
              <div className="h-65 w-[100%] bg-gray-200">
                <ChartBarDefault points={dashboard?.touristAgeDistribution || []} />
              </div>
            </div>
          </div>

          <div className="h-[95%] w-[100%] bg-gray-200 pr-4">
            <div className="mb-2 px-1 text-xs font-semibold text-neutral-600">
              {scopeLabel}
              {loading ? " — Loading..." : ""}
              {error ? ` — ${error}` : ""}
            </div>
            <div className="h-full w-full bg-gray-200 flex md:flex-col flex-col gap-5">
              <div className="h-100 min-w-0 w-full bg-gray-200">
                <div className="h-full w-full bg-gray-200 flex gap-5 items-center justify-center hide-scrollbar">
                  <div className="h-[100%] w-[100%] bg-gray-200 flex gap-5 md:flex-row flex-col">
                    <div className="h-full min-w-0 w-[100%] bg-gray-200 flex gap-5 md:flex-col flex-col">
                      <div className="h-[50%] min-w-0 w-[100%] bg-gray-200">
                        <TotalBookingsCard total={dashboard?.summary.totalBookings || 0} />
                      </div>
                      <div className="h-[100%] min-w-0 w-[100%] bg-gray-200">
                        <ChartPieCodes
                          withPromo={dashboard?.promoCodeStats.withPromo || 0}
                          withoutPromo={dashboard?.promoCodeStats.withoutPromo || 0}
                        />
                      </div>
                    </div>
                    <div className="h-full min-w-0 w-[100%] bg-gray-200 flex gap-5 md:flex-col flex-row">
                      <div className="h-[50%] min-w-0 w-[100%] bg-gray-200">
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
  );
}
