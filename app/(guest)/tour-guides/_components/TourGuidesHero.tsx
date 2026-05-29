import Link from 'next/link'

interface Props {
  guideCount: number
  avgRating: string
}

export function TourGuidesHero({ guideCount, avgRating }: Props) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <nav className="flex items-center gap-2 text-[11px] font-mono tracking-[.14em] uppercase text-gray-400 mb-3">
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#008768]">Tour Guides</span>
        </nav>

        <div className="flex items-end justify-between gap-8 flex-wrap">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em] text-gray-900 m-0">
              Tour Guides in{' '}
              <em className="not-italic font-normal text-[#008768]">Cebu</em>.
            </h1>
            <p className="mt-2 text-sm text-gray-500 max-w-[540px]">
              Local experts who know Cebu like the back of their hand — divers, trekkers, heritage scholars, and more.
            </p>
          </div>
          <div className="hidden lg:flex gap-6 shrink-0">
            {[
              [`${guideCount}`, 'local guides'],
              [`${avgRating}★`, 'avg rating'],
            ].map(([n, l]) => (
              <div key={l} className="text-right">
                <div className="text-2xl font-extrabold tracking-[-0.02em] leading-none text-gray-900">{n}</div>
                <div className="mt-1 text-[10px] font-mono tracking-[.12em] uppercase text-gray-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
