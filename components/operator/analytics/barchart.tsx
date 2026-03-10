"use client"

import {
  Bar,
  BarChart,
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
} from "@/components/ui/chart"

const chartData = [
  { age: "5", quantity: 18 },
  { age: "10", quantity: 25 },
  { age: "15", quantity: 55 },
  { age: "20", quantity: 60 },
  { age: "25", quantity: 70 },
  { age: "30", quantity: 62 },
  { age: "35", quantity: 57 },
  { age: "40", quantity: 50 },
  { age: "45", quantity: 34 },
  { age: "50", quantity: 46 },
  { age: "55", quantity: 37 },
  { age: "60", quantity: 15 },
  { age: "65", quantity: 12 },
  { age: "70", quantity: 11 },
  { age: "75", quantity: 10 },
]

const chartConfig = {
  quantity: {
    label: "quantity",
    color: "green",
  },
} satisfies ChartConfig

export default function ChartBarquantityistribution() {
  return (
    <div className="w-full  rounded-2xl bg-white overflow-hidden p-1 shadow-sm">
      {/* title */}
      <div className="py-0 lg:py-0 text-center">
        <h2 className="text-sm lg:text-lg font-semibold text-neutral-900">
          Tourist Age distribution
        </h2>
      </div>

      {/* chart body */}
      <div className="px-2 ">
        <div className="h-[160px] lg:h-[205] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 0, left: 0, right: 6, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />

                <YAxis
                  className="hidden lg:block"
                  width={20}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  fontSize={10}
                  domain={[10, 90]}
                  tickCount={8}
                  ticks={[10, 20, 30, 40, 50, 60, 70, 80]}
                  allowDecimals={false}
                />

                <XAxis
                  dataKey="age"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />

                <Bar
                  dataKey="quantity"
                  fill="var(--color-quantity)"
                  barSize={16}         // controls thickness like screenshot
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* bottom label like screenshot */}
        <div className="mt-1 text-center text-xs text-neutral-700">
          Age
        </div>
      </div>
    </div>
  )
}