"use client"

type AffiliatedEntityPoint = {
  entityName: string
  count: number
}

interface ChartBarCodesDistributionProps {
  data?: AffiliatedEntityPoint[]
}

export default function ChartBarCodesDistribution({
  data = [],
}: ChartBarCodesDistributionProps) {
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <div className="w-full min-w-0 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">
        Popular Promo Codes
      </h2>

      <ul className="mt-4 space-y-3">
        {data.length === 0 && (
          <li className="text-xs text-gray-400">No promo code data available.</li>
        )}
        {data.map((item) => {
          const pct = (item.count / max) * 100
          return (
            <li
              key={item.entityName}
              title={`${item.entityName}: ${item.count.toLocaleString("en-PH")}`}
              className="group grid grid-cols-[110px_1fr_auto] items-center gap-3 rounded-md px-2 py-1 -mx-2 transition-colors hover:bg-emerald-50/60"
            >
              <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500 group-hover:text-[#0F5132]">
                {item.entityName}
              </span>
              <div className="h-3 w-full overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                <div
                  className="h-full rounded-full bg-[#0F5132] transition-all group-hover:brightness-110"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="min-w-[2.5ch] text-right text-xs font-semibold text-neutral-800">
                {item.count.toLocaleString("en-PH")}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}