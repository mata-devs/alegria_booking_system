'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import { MapPin, Star, SlidersHorizontal, ChevronRight } from 'lucide-react'

const TYPES = ['Hotel', 'Resort', 'Hostel', 'Guesthouse', 'Villa', 'Apartment'] as const
type AccomType = (typeof TYPES)[number]

interface Accommodation {
  id: string
  name: string
  location: string
  type: AccomType
  pricePerNight: number
  rating: number
  reviewCount: number
  image: string | null
  amenities: string[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function AccommodationCard({ accom }: { accom: Accommodation }) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer">
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {accom.image ? (
          <Image
            src={accom.image}
            alt={accom.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-green-50">
            <span className="text-4xl font-bold text-green-200">{accom.name.charAt(0)}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-gray-700 shadow-sm">
          {accom.type}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-tight truncate group-hover:text-green-600 transition-colors">
          {accom.name}
        </h3>

        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3 shrink-0 text-green-500" />
          <span className="truncate">{accom.location}</span>
        </div>

        {accom.rating > 0 ? (
          <div className="flex items-center gap-1.5 mt-2">
            <StarRating rating={accom.rating} />
            <span className="text-xs font-semibold text-gray-700">{accom.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({accom.reviewCount})</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-2">No reviews yet</p>
        )}

        {accom.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {accom.amenities.slice(0, 3).map((a) => (
              <span key={a} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-gray-400">Starting from</p>
            <p className="text-base font-bold text-green-600">
              ₱{accom.pricePerNight.toLocaleString()}
              <span className="text-xs font-normal text-gray-400"> / night</span>
            </p>
          </div>
          <span className="text-xs text-green-600 font-medium group-hover:underline">View details</span>
        </div>
      </div>
    </div>
  )
}

export default function AccommodationsPage() {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<AccomType | null>(null)
  const [sort, setSort] = useState<'name' | 'price' | 'rating'>('name')
  const [filterOpen, setFilterOpen] = useState(false)

  // Placeholder — replace with Firestore fetch when accommodations collection is ready
  const accommodations: Accommodation[] = []

  const filtered = useMemo(() => {
    let base = accommodations.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.location.toLowerCase().includes(search.toLowerCase())
      const matchesType = !activeType || a.type === activeType
      return matchesSearch && matchesType
    })
    if (sort === 'price') base = [...base].sort((a, b) => a.pricePerNight - b.pricePerNight)
    else if (sort === 'rating') base = [...base].sort((a, b) => b.rating - a.rating)
    else base = [...base].sort((a, b) => a.name.localeCompare(b.name))
    return base
  }, [accommodations, search, activeType, sort])

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">

      {/* ── Hero band ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
          <nav className="flex items-center gap-2 text-[11px] font-mono tracking-[.14em] uppercase text-gray-400 mb-3">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#008768]">{filtered.length} Results</span>
          </nav>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em] m-0 text-gray-900">
                Stay in{' '}
                <em className="not-italic font-normal text-[#008768]">Cebu</em>.
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-[540px]">
                Find the perfect place to stay across the island of Cebu.
              </p>
            </div>
            <div className="hidden lg:flex gap-6 shrink-0">
              <div className="text-right">
                <div className="text-2xl font-extrabold tracking-[-0.02em] leading-none text-gray-900">{filtered.length}</div>
                <div className="mt-1 text-[10px] font-mono tracking-[.12em] uppercase text-gray-400">places to stay</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-4xl mx-auto relative hidden sm:flex items-stretch overflow-visible rounded-full bg-white shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-4 flex-1 min-w-0">
              <div className="bg-green-50 rounded-full p-2 shrink-0">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0 w-full">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Search</span>
                <input
                  type="text"
                  aria-label="Search accommodations"
                  placeholder="Search accommodations in Cebu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="outline-none text-sm font-medium text-gray-800 placeholder-gray-400 w-full bg-transparent"
                />
              </div>
            </div>
          </div>
          {/* Mobile search */}
          <div className="sm:hidden flex items-center gap-3 border border-gray-200 rounded-full px-5 py-3 bg-white shadow-sm">
            <svg className="w-4 h-4 shrink-0 text-[#008768]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              aria-label="Search accommodations"
              placeholder="Search accommodations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-700 placeholder-gray-400 flex-1 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-2">
            {/* Filters button */}
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap shrink-0 ${
                filterOpen || sort !== 'name' ? 'border-green-500 text-green-700 bg-green-50 font-medium' : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              Filters
            </button>

            <div className="h-6 w-px bg-gray-200 shrink-0" />

            {/* Type pills */}
            <div className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveType(null)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeType === null ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
                }`}
              >
                All
              </button>
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveType(activeType === t ? null : t)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeType === t ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label="Scroll types right"
              className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 bg-white shadow-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Sort panel */}
          {filterOpen && (
            <div className="pb-3 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 shrink-0">Sort by</span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'name' as const, label: 'A–Z' },
                  { value: 'price' as const, label: 'Price' },
                  { value: 'rating' as const, label: 'Top Rated' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={`px-4 py-1 rounded-full text-sm font-medium transition-colors border ${
                      sort === opt.value ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            {filtered.length} {filtered.length === 1 ? 'place' : 'places'} to stay
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Star className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-700">No accommodations listed yet</p>
            <p className="mt-1 text-sm text-gray-400">
              {search || activeType ? 'Try adjusting your search or filters.' : 'Check back soon. Listings are coming.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((accom) => (
              <AccommodationCard key={accom.id} accom={accom} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
