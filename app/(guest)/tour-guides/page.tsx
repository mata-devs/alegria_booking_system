'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/app/components/Footer'
import { tourGuides } from '@/app/data/mockData'
import type { TourGuide } from '@/app/types'

const ALL_SPECIALTIES = Array.from(
  new Set(tourGuides.flatMap((g) => g.specialties))
).sort()

const ALL_LANGUAGES = Array.from(
  new Set(tourGuides.flatMap((g) => g.languages))
).sort()

const ALL_LOCATIONS = Array.from(
  new Set(tourGuides.map((g) => g.location))
).sort()

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.floor(rating)
        const half = !filled && n - 0.5 <= rating
        return (
          <svg key={n} width="11" height="11" viewBox="0 0 20 20" className="text-[#f1a500]">
            <defs>
              {half && (
                <linearGradient id={`half-${n}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              )}
            </defs>
            <path
              fill={half ? `url(#half-${n})` : filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={filled || half ? 0 : 1}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        )
      })}
    </span>
  )
}

function AvailabilityBadge({ availability }: { availability: TourGuide['availability'] }) {
  const config = {
    available: { dot: 'bg-[#008768]', label: 'Available', text: 'text-[#003a2d]', bg: 'bg-[#d9efe6]' },
    limited: { dot: 'bg-amber-400', label: 'Limited', text: 'text-amber-800', bg: 'bg-amber-50' },
    unavailable: { dot: 'bg-gray-400', label: 'Unavailable', text: 'text-gray-600', bg: 'bg-gray-100' },
  }[availability]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function TourGuideCard({ guide }: { guide: TourGuide }) {
  const shownSpecialties = guide.specialties.slice(0, 2)
  const overflowCount = guide.specialties.length - 2

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 hover:cursor-pointer flex flex-col">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={guide.photo}
          alt={guide.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Availability badge */}
        <div className="absolute top-3 left-3">
          <AvailabilityBadge availability={guide.availability} />
        </div>
        {/* Price tag */}
        {/* <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
          ₱{guide.pricePerDay.toLocaleString()}<span className="font-normal opacity-75">/day</span>
        </div> */}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Name & location */}
        <div>
          <h3 className="font-extrabold text-gray-900 text-[15px] leading-tight">{guide.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {guide.location}
          </p>
        </div>

        {/* Specialty chips */}
        <div className="flex flex-wrap gap-1.5">
          {shownSpecialties.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#d9efe6] text-[#003a2d]">
              {s}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
              +{overflowCount}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={guide.rating} />
          <span className="text-xs font-bold text-gray-700">{guide.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({guide.reviewCount.toLocaleString()})</span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono tracking-wide">
          <span>{guide.yearsOfExperience} yrs exp</span>
          <span className="w-px h-3 bg-gray-200" />
          <span className="truncate">{guide.languages.slice(0, 2).join(', ')}{guide.languages.length > 2 ? ` +${guide.languages.length - 2}` : ''}</span>
        </div>

        {/* CTA */}
        <Link
          href={`/tour-guides/${guide.id}`}
          className="mt-auto block w-full text-center bg-gray-900 hover:bg-[#008768] text-white text-xs font-semibold py-2.5 rounded-full transition-colors duration-200"
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}

type SortOption = 'Recommended' | 'Highest rated' | 'Most experienced' | 'Price · low to high' | 'Price · high to low'

export default function TourGuidesPage() {
  const [activeSpecialties, setActiveSpecialties] = useState<string[]>([])
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null)
  const [activeLocation, setActiveLocation] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('Recommended')
  const [visibleCount, setVisibleCount] = useState(8)

  const toggleSpecialty = (s: string) =>
    setActiveSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  const activeFiltersCount =
    activeSpecialties.length + (activeLanguage ? 1 : 0) + (activeLocation ? 1 : 0)

  const filtered = useMemo(() => {
    let list = tourGuides.filter((g) => {
      const matchesSpecialty =
        activeSpecialties.length === 0 ||
        activeSpecialties.some((s) => g.specialties.includes(s))
      const matchesLanguage = !activeLanguage || g.languages.includes(activeLanguage)
      const matchesLocation = !activeLocation || g.location === activeLocation
      return matchesSpecialty && matchesLanguage && matchesLocation
    })

    if (sortBy === 'Highest rated') list = [...list].sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'Most experienced') list = [...list].sort((a, b) => b.yearsOfExperience - a.yearsOfExperience)
    else if (sortBy === 'Price · low to high') list = [...list].sort((a, b) => a.pricePerDay - b.pricePerDay)
    else if (sortBy === 'Price · high to low') list = [...list].sort((a, b) => b.pricePerDay - a.pricePerDay)
    return list
  }, [activeSpecialties, activeLanguage, activeLocation, sortBy])

  const visible = filtered.slice(0, visibleCount)

  const avgRating = (
    tourGuides.reduce((s, g) => s + g.rating, 0) / tourGuides.length
  ).toFixed(1)

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">

      {/* Hero band */}
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
                [`${tourGuides.length}`, 'local guides'],
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

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">

            {/* Specialties */}
            <span className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400 shrink-0">Specialty</span>
            {ALL_SPECIALTIES.map((s) => {
              const active = activeSpecialties.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              )
            })}

            <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />

            {/* Languages */}
            <span className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400 shrink-0">Language</span>
            {ALL_LANGUAGES.map((lang) => {
              const active = activeLanguage === lang
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLanguage(active ? null : lang)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {lang}
                </button>
              )
            })}

            <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />

            {/* Location */}
            <span className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400 shrink-0">Location</span>
            {ALL_LOCATIONS.map((loc) => {
              const active = activeLocation === loc
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setActiveLocation(active ? null : loc)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {loc.replace(', Cebu', '')}
                </button>
              )
            })}

            {activeFiltersCount > 0 && (
              <>
                <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />
                <button
                  type="button"
                  onClick={() => { setActiveSpecialties([]); setActiveLanguage(null); setActiveLocation(null) }}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Clear all ({activeFiltersCount})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 pb-20 lg:pb-16 flex-1">

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-2xl font-extrabold text-gray-900 tracking-[-0.02em]">
              {filtered.length} guide{filtered.length !== 1 ? 's' : ''}
            </span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-sm text-gray-400">matching your filters</span>
            )}
          </div>
          <select
            aria-label="Sort guides"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs sm:text-[13px] px-3 sm:px-3.5 py-2 sm:py-2.5 border border-gray-200 rounded-full bg-white font-medium text-gray-700 outline-none cursor-pointer"
          >
            {(['Recommended', 'Highest rated', 'Most experienced', 'Price · low to high', 'Price · high to low'] as SortOption[]).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">No guides match your filters.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {visible.map((guide) => (
              <TourGuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        )}

        {/* Load more */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-400">
              Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} guides
            </span>
            <div className="flex gap-3">
              {visibleCount < filtered.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 8)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Load more
                </button>
              )}
              {visibleCount > 8 && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(8)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
