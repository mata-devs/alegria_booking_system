"use client"

interface PaymentMethodPoint {
  method: string
  count: number
}

interface PaymentMethodProps {
  data?: PaymentMethodPoint[]
}

// Brand-leaning bar colors for each payment method.
const colorFor = (method: string) => {
  const m = method.toLowerCase()
  if (m.includes("gcash")) return "#1565C0"
  if (m.includes("card") || m.includes("debit") || m.includes("credit")) return "#0F5132"
  if (m.includes("cash")) return "#9CA3AF"
  if (m.includes("paymaya") || m.includes("maya")) return "#16A085"
  return "#6BBF8C"
}

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default function PaymentMethod({ data = [] }: PaymentMethodProps) {
  const total = Math.max(1, data.reduce((s, p) => s + p.count, 0))

  return (
    <div className="w-full min-w-0 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">
        Payment Methods
      </h2>

      <ul className="mt-4 space-y-4">
        {data.length === 0 && (
          <li className="text-xs text-gray-400">No payment data available.</li>
        )}
        {data.map((item) => {
          const pct = (item.count / total) * 100
          const fill = colorFor(item.method)
          return (
            <li key={item.method}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700">
                  {item.method}
                </span>
                <span className="text-xs font-semibold text-neutral-800">
                  {formatPeso(item.count)}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: fill }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}