"use client"

import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/(operator)/operator/_components/ui/chart"

// Emerald-leaning palette to match the InsightFlow mockup.
const palette = ["#0F5132", "#2F8F5A", "#6BBF8C", "#A6DBB7", "#D1F0DA"]

type NationalityPoint = {
  nationality: string
  count: number
}

const chartConfig = {
  visitors: { label: "Visitors" },
} satisfies ChartConfig

interface ChartPieNationalitiesProps {
  points?: NationalityPoint[]
}

export default function ChartPieNationalities({ points = [] }: ChartPieNationalitiesProps) {
  const top = [...points]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const total = top.reduce((sum, p) => sum + p.count, 0) || 1

  const chartData = top.map((point, index) => ({
    name: point.nationality,
    visitors: point.count,
    pct: Math.round((point.count / total) * 100),
    fill: palette[index % palette.length],
  }))

  return (
    <div className="w-full min-w-0 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">
        Tourist Nationalities
      </h2>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[160px] w-[160px] shrink-0">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      className="!border-neutral-200 !bg-white !text-neutral-900 !shadow-lg"
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="visitors"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="95%"
                  paddingAngle={2}
                  stroke="transparent"
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] uppercase tracking-wide text-gray-400">
              Top
            </span>
            <span className="text-2xl font-bold text-[#0F5132] leading-none">
              {chartData.length}
            </span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
          {chartData.map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-neutral-700">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="font-medium text-neutral-600">{d.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}