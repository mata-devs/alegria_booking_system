"use client"

import {
  Bar,
  BarChart,
  Cell,
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

type AgeDistributionPoint = {
  range: string
  count: number
}

const chartConfig = {
  quantity: {
    label: "quantity",
    color: "#0F5132",
  },
} satisfies ChartConfig

interface ChartBarQuantityDistributionProps {
  points?: AgeDistributionPoint[]
}

// Heat-style emerald palette — tallest bar darkest, smallest lightest.
function shadeFor(rank: number, total: number) {
  if (total <= 1) return "#0F5132"
  const palette = ["#D1F0DA", "#A6DBB7", "#6BBF8C", "#2F8F5A", "#0F5132"]
  const idx = Math.min(palette.length - 1, Math.round((rank / (total - 1)) * (palette.length - 1)))
  return palette[idx]
}

export default function ChartBarquantityistribution({ points = [] }: ChartBarQuantityDistributionProps) {
  const chartData = points.map((point) => ({ age: point.range, quantity: point.count }))
  const sorted = [...chartData].sort((a, b) => a.quantity - b.quantity)
  const colorFor = (q: number) => shadeFor(sorted.findIndex((p) => p.quantity === q), sorted.length)
  const maxQuantity = Math.max(10, ...chartData.map((point) => point.quantity))

  return (
    <div className="w-full rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">
          Tourist Age Distribution
        </h2>
      </div>

      <div className="mt-3 h-[200px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, left: 0, right: 6, bottom: 0 }}
              barCategoryGap="22%"
            >
              <YAxis hide domain={[0, maxQuantity]} />
              <XAxis
                dataKey="age"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={11}
                stroke="#9ca3af"
              />
              <ChartTooltip
                cursor={{ fill: "rgba(15,81,50,0.06)" }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    className="!border-neutral-200 !bg-white !text-neutral-900 !shadow-lg"
                  />
                }
              />
              <Bar dataKey="quantity" radius={[6, 6, 0, 0]} barSize={28}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={colorFor(entry.quantity)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}