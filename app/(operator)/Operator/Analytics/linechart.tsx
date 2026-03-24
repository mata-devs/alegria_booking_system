"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/(operator)/Operator/_components/ui/chart"

type TrendPoint = {
  label: string
  count: number
}

const chartConfig = {
  Total: {
    label: "Total",
    // Solid color so stroke is visible; `var(--chart-1)` is not defined in globals.css
    color: "#15803d",
  },
} satisfies ChartConfig

interface ChartLineLinearProps {
  points?: TrendPoint[]
}

export default function ChartLineLinear({ points = [] }: ChartLineLinearProps) {
  const chartData = points.map((point) => ({ month: point.label, Total: point.count }))

  return (
    <div className="w-full min-w-0 rounded-2xl bg-white overflow-hidden p-1 shadow-sm">
      {/* title */}
      <div className="py-1 text-center">
        <h2 className="text-sm lg:text-lg font-semibold text-neutral-900">
          Bookings Trend
        </h2>
      </div>

      {/* chart body */}
      <div className="px-2 pb-2">
        <div className="h-[160px] lg:h-[240px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, left: 0, right: 12, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <YAxis
                  className="font-bold hidden lg:block"
                  width={28}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={2}
                  fontSize={12}
                  domain={[100, 400]}
                  ticks={[100, 150, 200, 250, 300, 350, 400]}
                  tickCount={6}
                  allowDecimals={false}
                />
                <XAxis
                  className="font-bold"
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  padding={{ left: 50, right: 12 }}
                  fontSize={11}
                  tickFormatter={(v) => String(v).slice(0, 3).toUpperCase()}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Line
                  dataKey="Total"
                  type="linear"
                  stroke="var(--color-Total)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
