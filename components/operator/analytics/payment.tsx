"use client"

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

const chartData = [
  { method: "Cash", payment: 110, fill: "#1565C0" },
  { method: "Gcash", payment: 90, fill: "#16A085" },
  { method: "Debit/Credit\nCard", payment: 45, fill: "#F4A000" },
]

const maxPayment = Math.max(...chartData.map((item) => item.payment))

export default function PaymentMethod() {
  return (
    <div className="w-full min-w-0 rounded-2xl bg-white bg-[#F3F3F3] p-1 md:p-2">
      <div className="mb-2 md:mb-4">
        <h2 className="text-center text-lg md:text-xl font-semibold text-black">
          Payment methods used by bookings
        </h2>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 40, left: 40, bottom: 5 }}
            barCategoryGap="28%"
          >
            <XAxis
              dataKey="method"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={({ x, y, payload }) => {
                const lines = String(payload.value).split("\n")

                return (
                  <g transform={`translate(${x},${y})`}>
                    {lines.map((line, index) => (
                      <text
                        key={index}
                        x={0}
                        y={index * 22}
                        dy={20}
                        textAnchor="middle"
                        className="fill-black text-[16px] md:text-[20px] font-medium"
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                )
              }}
            />

            <YAxis hide domain={[0, maxPayment]} />

            <Bar dataKey="payment" barSize={50}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}