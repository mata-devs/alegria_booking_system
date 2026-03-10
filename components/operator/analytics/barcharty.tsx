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
  { code: "Code 1", used: 110 },
  { code: "Code 2", used: 80 },
  { code: "Code 3", used: 70 },
  { code: "Code 4", used: 60 },
  { code: "Code 5", used: 50 },
  { code: "Code 6", used: 32 },
  { code: "Code 7", used: 28 },
  { code: "Code 8", used: 24 },
  { code: "Code 9", used: 18 },
  { code: "Code 10", used: 12 },
  { code: "Others", used: 28 },
]

const chartConfig = {
  used: {
    label: "used",
    color: "green",
  },
} satisfies ChartConfig

export default function ChartBarCodesDistribution() {
  return (
    <div className="w-full min-w-0 rounded-2xl bg-white overflow-hidden p-1 shadow-sm">
      {/* title */}
      <div className="py-4 lg:py-1 text-center">
        <h2 className="text-sm lg:text-lg font-semibold text-neutral-900">
          Used Promo Codes
        </h2>
      </div>

      {/* chart body */}
      <div className="px-2 ">
        <div className="h-[160px] lg:h-[370] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, left: 0, right: 10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />

                <YAxis
                dataKey="code"
                type="category"
                tickLine={false}
                tickMargin={5} 
                axisLine={true}
                tickFormatter={(value) => value}
                />

               <XAxis
                type="number"
                dataKey="used"
                domain={[0, 120]}
                ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]}
                allowDecimals={false}
                tickLine={false}
                axisLine={true}
                tickMargin={0}
                fontSize={12}
                />

                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />

                <Bar
                  dataKey="used"
                  fill="var(--color-used)"
                  barSize={16}         // controls thickness like screenshot
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* bottom label like screenshot */}
        <div className="mt-2 text-center text-lg text-neutral-700">
          Number of codes redeemed
        </div>
      </div>
    </div>
  )
}