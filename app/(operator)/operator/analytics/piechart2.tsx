"use client"

import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/(operator)/operator/_components/ui/chart"

const chartConfig = {
  visitors: { label: "Visitors" },
} satisfies ChartConfig

interface ChartPieCodesProps {
  withPromo?: number
  withoutPromo?: number
}

export default function ChartPieCodes({
  withPromo = 0,
  withoutPromo = 0,
}: ChartPieCodesProps) {
  const total = withPromo + withoutPromo
  const pct = total > 0 ? Math.round((withPromo / total) * 100) : 0

  const chartData = [
    { name: "Used", visitors: withPromo, fill: "#0F5132" },
    { name: "Unused", visitors: withoutPromo, fill: "#E6F2EA" },
  ]

  return (
    <div className="w-full rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">
        Redeemed Promocodes
      </h2>

      <div className="mt-3 flex flex-col items-center">
        <div className="relative h-[160px] w-[160px]">
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
                  innerRadius="70%"
                  outerRadius="95%"
                  startAngle={90}
                  endAngle={-270}
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
            <span className="text-2xl font-bold text-[#0F5132] leading-none">
              {pct}%
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-wider text-gray-400">
              Usage
            </span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          {withPromo.toLocaleString("en-PH")} of{" "}
          {total.toLocaleString("en-PH")} bookings used a code
        </p>
      </div>
    </div>
  )
}