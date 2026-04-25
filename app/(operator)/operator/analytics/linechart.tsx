"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/(operator)/operator/_components/ui/chart"

type TrendPoint = {
  label: string
  count: number
}

// Bookings Trend uses a cyan accent that complements the dashboard's emerald palette.
const TREND_COLOR = "#0891B2" // cyan-600

const chartConfig = {
  Total: {
    label: "Total",
    color: TREND_COLOR,
  },
} satisfies ChartConfig

interface ChartLineLinearProps {
  points?: TrendPoint[]
}

export type TrendGranularity = "day" | "month"

interface ChartLineLinearPropsExt extends ChartLineLinearProps {
  granularity?: TrendGranularity
  onGranularityChange?: (g: TrendGranularity) => void
}

export default function ChartLineLinear({
  points = [],
  granularity: granularityProp,
  onGranularityChange,
}: ChartLineLinearPropsExt) {
  const [internalGranularity, setInternalGranularity] = useState<TrendGranularity>("month")
  const granularity = granularityProp ?? internalGranularity
  const setGranularity = (g: TrendGranularity) => {
    if (onGranularityChange) onGranularityChange(g)
    else setInternalGranularity(g)
  }

  const chartData = points.map((point) => ({
    month: point.label,
    Total: point.count,
  }))

  return (
    <div className="w-full min-w-0 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">
          Bookings Trend
        </h2>

        <div className="inline-flex items-center rounded-full bg-gray-100 p-0.5 text-[11px] font-medium">
          {(["month", "day"] as TrendGranularity[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={`rounded-full px-3 py-1 capitalize transition-colors ${
                granularity === g
                  ? "bg-white text-[#0891B2] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {g === "month" ? "Monthly" : "Daily"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, left: 0, right: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TREND_COLOR} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={TREND_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f4" />
              <YAxis hide />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                fontSize={11}
                stroke="#9ca3af"
                tickFormatter={(v) => String(v).slice(0, 3).toUpperCase()}
              />
              <ChartTooltip
                cursor={{ stroke: TREND_COLOR, strokeOpacity: 0.18 }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    className="!border-neutral-200 !bg-white !text-neutral-900 !shadow-lg"
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="Total"
                stroke={TREND_COLOR}
                strokeWidth={3}
                fill="url(#trendFill)"
                dot={false}
                activeDot={{ r: 4, fill: TREND_COLOR }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
