"use client"

import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/(operator)/operator/_components/ui/chart";

const palette = ["#5fd1a1", "#c29a19"]

const chartConfig = {
  visitors: { label: "Visitors" },
} satisfies ChartConfig

interface ChartPieCodesProps {
  withPromo?: number
  withoutPromo?: number
}

export default function ChartPieCodes({ withPromo = 0, withoutPromo = 0 }: ChartPieCodesProps) {
  const chartData = [
    { name: "With promocodes", visitors: withPromo, fill: palette[0], colorClass: "bg-emerald-400" },
    { name: "Without Promocodes", visitors: withoutPromo, fill: palette[1], colorClass: "bg-yellow-600" },
  ]

  return (
    <div className="w-full rounded-2xl bg-white overflow-hidden p-1  shadow-sm">
      <div className="py-2 text-center">
        <h2 className="text-sm lg:text-lg font-semibold text-neutral-900">
          Bookings with redemmed promocodes
        </h2>
      </div>
      <div className="px-0 pb-2 ">
        <div className="flex flex-col items-center gap-3">
          <div className="h-35 w-[55%]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="visitors"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius="100%"
                    stroke="transparent"
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="w-[80%] pt-2">
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs lg:text-sm text-neutral-700">
              {chartData.map((d) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-sm ${d.colorClass}`} />
                  <span className="truncate">{d.name}</span>
                </li>
              ))}
            </ul>
            
          </div>
        </div>
      </div>
    </div>
  )
}