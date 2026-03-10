"use client"

import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
  { name: "American", visitors: 275, fill: "#2563eb" },
  { name: "Chinese", visitors: 200, fill: "#ef4444" },
  { name: "Korean", visitors: 187, fill: "#f59e0b" },
  { name: "Local", visitors: 173, fill: "#d2b48c" },
  { name: "Negrito", visitors: 90, fill: "#000000" },
  { name: "Others", visitors: 0, fill: "#434344" },
]

const chartConfig = {
  visitors: { label: "Visitors" },
} satisfies ChartConfig

export default function ChartPieNationalities() {
  return (
    <div className="w-full min-w-0 rounded-2xl bg-white overflow-hidden p-1  shadow-sm">
      <div className="py-1 text-center">
        <h2 className="text-sm lg:text-lg font-semibold text-neutral-900">
          Tourist Nationalities
        </h2>
      </div>
      <div className="px-2 pb-2 ">
        <div className="flex items-center gap-3">
          <div className="h-[160px] lg:h-[225px] w-[55%]">
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
                    outerRadius="85%"
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

          <div className="w-[45%]">
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs lg:text-sm text-neutral-700">
              {chartData.map((d) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: d.fill }}
                  />
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