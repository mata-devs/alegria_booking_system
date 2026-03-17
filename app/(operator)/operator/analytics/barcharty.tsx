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

type AffiliatedEntityPoint = {
  entityName: string
  count: number
}

const chartConfig = {
  used: {
    label: "used",
    color: "green",
  },
} satisfies ChartConfig

interface ChartBarCodesDistributionProps {
  data?: AffiliatedEntityPoint[]
}

export default function ChartBarCodesDistribution({ data = [] }: ChartBarCodesDistributionProps) {
  const chartData = data.map((item) => ({ code: item.entityName, used: item.count }))
  const maxUsed = Math.max(10, ...chartData.map((item) => item.used))

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
                domain={[0, maxUsed]}
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