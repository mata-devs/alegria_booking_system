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
} from "@/app/(operator)/operator/_components/ui/chart"

type AgeDistributionPoint = {
  range: string
  count: number
}

const chartConfig = {
  quantity: {
    label: "quantity",
    color: "green",
  },
} satisfies ChartConfig

interface ChartBarQuantityDistributionProps {
  points?: AgeDistributionPoint[]
}

export default function ChartBarquantityistribution({ points = [] }: ChartBarQuantityDistributionProps) {
  const chartData = points.map((point) => ({ age: point.range, quantity: point.count }))
  const maxQuantity = Math.max(10, ...chartData.map((point) => point.quantity))

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
                  domain={[0, maxQuantity]}
                  tickCount={8}
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