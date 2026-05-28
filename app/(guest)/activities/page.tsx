'use client'

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import ActivityCard from '@/app/components/ActivityCard'
import { useSearchParams } from 'next/navigation'
import { parseGuestListingSearchParams } from '@/app/lib/searchSchema'
import { getDayCapacity } from '@/app/lib/getDayCapacity'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'
import { ACTIVITY_TAGS, normalizeActivityTags, primaryActivityTag, activityHasTag } from '@/app/lib/activity-tags'
import { packageImageUrl } from '@/app/lib/package-images'
import type { Activity } from '@/app/types'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/app/components/ui/drawer'
import SearchBar from '@/app/components/SearchBar'
import PackageCard from '@/app/components/ui/PackageCard'
import { normalizePackageLocations, formatLocationSummary } from '@/app/lib/package-locations'

export default function ActivitiesPage() {
  return (
    <Suspense>
      <ActivitiesContent />
    </Suspense>
  )
}

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
      <defs>
        {half && (
          <linearGradient id="half-star">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        )}
      </defs>
      <path
        fill={half ? 'url(#half-star)' : filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled || half ? 0 : 1}
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}

function FilterGroup({ title, subtitle, children, last = false }: { title: string; subtitle?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`pt-[18px] pb-[18px] ${last ? '' : 'border-b border-gray-100'}`}>
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[11px] font-semibold tracking-[.14em] uppercase text-gray-400">{title}</span>
        {subtitle && <span className="text-[11px] text-gray-400">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

function FiltersSidebar({
  activities,
  activeTags, toggleTag,
  activeLocationChip, setActiveLocationChip,
  ratingFilter, setRatingFilter,
  priceRange, setPriceRange,
  maxPrice,
  uniqueLocations,
  activeFiltersCount,
  onClearAll,
  onApply,
}: {
  activities: Activity[]
  activeTags: string[]; toggleTag: (tag: string) => void
  activeLocationChip: string | null; setActiveLocationChip: (v: string | null) => void
  ratingFilter: number | null; setRatingFilter: (v: number | null) => void
  priceRange: [number, number]; setPriceRange: (v: [number, number]) => void
  maxPrice: number
  uniqueLocations: [string, number][]
  activeFiltersCount: number
  onClearAll: () => void
  onApply?: () => void
}) {
  return (
    <div className="bg-white rounded-[22px] p-6 border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold flex items-center gap-2">
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-[#008768] text-white text-[11px] px-2 py-0.5 rounded-full font-semibold">{activeFiltersCount}</span>
          )}
        </h3>
        {activeFiltersCount > 0 && (
          <button type="button" onClick={onClearAll} className="bg-transparent border-none text-[#008768] text-[13px] cursor-pointer font-medium">Clear all</button>
        )}
      </div>

      {/* Category — only show tags that exist in the current activities. Multi-select. */}
      {(() => {
        const presentTags = ACTIVITY_TAGS.filter((tag) =>
          activities.some((a) => (a.categories ? activityHasTag(a.categories, tag) : a.category === tag))
        );
        if (presentTags.length === 0) return null;
        return (
          <FilterGroup title="Category">
            <div className="flex flex-wrap gap-1.5">
              {presentTags.map((tag) => {
                const cnt = activities.filter((a) =>
                  a.categories ? activityHasTag(a.categories, tag) : a.category === tag
                ).length;
                const active = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                      active
                        ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {tag}
                    <span className={`ml-1 font-semibold text-[10px] ${active ? 'text-[#008768]' : 'text-gray-400'}`}>
                      {cnt}
                    </span>
                  </button>
                );
              })}
            </div>
          </FilterGroup>
        );
      })()}

      {/* Price */}
      <FilterGroup title={`Price · ₱${priceRange[0].toLocaleString()} – ₱${priceRange[1].toLocaleString()}`}>
        <div className="space-y-3">
          <input
            type="range"
            aria-label="Maximum price"
            min={0}
            max={maxPrice}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-[#008768]"
          />
          <div className="grid grid-cols-2 gap-2">
            {[['MIN', priceRange[0]], ['MAX', priceRange[1]]].map(([label, val]) => (
              <div key={label} className="border border-gray-200 rounded-[10px] px-3 py-2">
                <div className="text-[10px] tracking-[.12em] uppercase text-gray-400 font-mono">{label}</div>
                <div className="text-sm font-semibold mt-0.5">₱{(val as number).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup title="Rating">
        {[5, 4.5, 4, 3.5].map((r) => {
          const active = ratingFilter === r
          return (
            <label key={r} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <span className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center text-white flex-shrink-0 ${active ? 'bg-[#008768] border-[#008768]' : 'bg-white border-gray-200'}`}
                onClick={() => setRatingFilter(active ? null : r)}>
                {active && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="flex gap-0.5 text-[#f1a500]">
                {[1,2,3,4,5].map((n) => (
                  <span key={n} className={n <= Math.floor(r) ? 'star-full' : (n - 0.5 === r ? 'star-half' : 'star-dim')}>
                    <StarIcon filled />
                  </span>
                ))}
              </span>
              <span className="flex-1 text-xs text-gray-400">& up</span>
              <span className="text-xs text-gray-400">
                {activities.filter((a) => a.rating >= r).length}
              </span>
            </label>
          )
        })}
      </FilterGroup>

      {/* Location */}
      <FilterGroup title="Location" last>
        <div className="flex flex-wrap gap-1.5">
          {uniqueLocations.map(([loc, count]) => (
            <button
              key={loc}
              type="button"
              onClick={() => setActiveLocationChip(activeLocationChip === loc ? null : loc)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                activeLocationChip === loc
                  ? 'border-[1.5px] border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {loc}
              <span className={`ml-1 font-semibold ${activeLocationChip === loc ? 'text-[#008768]' : 'text-gray-400'}`}>{count}</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {onApply && (
        <button
          type="button"
          onClick={onApply}
          className="w-full bg-[#008768] hover:bg-[#003a2d] text-white font-medium py-3 rounded-full text-sm transition-colors mt-3"
        >
          Apply filters · {activities.length} results
        </button>
      )}
    </div>
  )
}

function ActivitiesContent() {
  const searchParams = useSearchParams()
  const queryKey = searchParams.toString()
  const initialSearch = parseGuestListingSearchParams(searchParams)

  // Search
  const [searchLocation, setSearchLocation] = useState(initialSearch.location)
  const [searchDate, setSearchDate] = useState(initialSearch.date)
  const [searchTravelers, setSearchTravelers] = useState(initialSearch.travelers)

  // Filters
  const [activeTags, setActiveTags] = useState<string[]>([])
  const toggleTag = (tag: string) =>
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  const [activeLocationChip, setActiveLocationChip] = useState<string | null>(null)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])

  // Display
  const [sortBy, setSortBy] = useState('Recommended')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [visibleCount, setVisibleCount] = useState(12)

  // UI
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)

  // Data
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [dayCapacity, setDayCapacity] = useState<Record<string, number | null>>({})

  // Popular packages carousel
  const [popularPackages, setPopularPackages] = useState<{
    id: string; packageName: string; packageTag: string;
    packageLocations: string[]; packageRating: number;
    pricePerPerson: number; packageImages: string[]; duration: string; slug: string;
  }[]>([])
  const packagesCarouselRef = useRef<HTMLDivElement>(null)
  const [canScrollPackagesLeft, setCanScrollPackagesLeft] = useState(false)
  const [canScrollPackagesRight, setCanScrollPackagesRight] = useState(false)

  const updatePackagesCarouselButtons = () => {
    const el = packagesCarouselRef.current
    if (!el) return
    const maxScrollLeft = el.scrollWidth - el.clientWidth
    setCanScrollPackagesLeft(el.scrollLeft > 0)
    setCanScrollPackagesRight(el.scrollLeft < maxScrollLeft - 1)
  }

  useEffect(() => {
    updatePackagesCarouselButtons()
    const el = packagesCarouselRef.current
    if (!el) return
    el.addEventListener('scroll', updatePackagesCarouselButtons)
    window.addEventListener('resize', updatePackagesCarouselButtons)
    return () => {
      el.removeEventListener('scroll', updatePackagesCarouselButtons)
      window.removeEventListener('resize', updatePackagesCarouselButtons)
    }
  }, [popularPackages.length])

  useEffect(() => {
    async function fetchPopularPackages() {
      try {
        const snap = await getDocs(query(
          collection(firebaseDb, 'tourPackages'),
          where('status', '==', 'active'),
          limit(7),
        ))
        setPopularPackages(snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            packageName: data.packageName ?? '',
            packageTag: data.packageTag ?? '',
            packageLocations: normalizePackageLocations(data),
            packageRating: data.packageRating ?? 0,
            pricePerPerson: data.pricePerPerson ?? 0,
            packageImages: Array.isArray(data.packageImages) ? data.packageImages : [],
            duration: data.duration ?? '',
            slug: data.slug ?? d.id,
          }
        }))
      } catch { /* ignore */ }
    }
    fetchPopularPackages()
  }, [])

  useEffect(() => {
    const p = parseGuestListingSearchParams(new URLSearchParams(queryKey))
    setSearchLocation(p.location)
    setSearchDate(p.date)
    setSearchTravelers(p.travelers)
  }, [queryKey])

  useEffect(() => {
    async function fetchActivities() {
      try {
        const snap = await getDocs(query(collection(firebaseDb, 'activities'), where('status', '==', 'active')))
        const mapped: Activity[] = snap.docs.map((d, idx) => {
          const data = d.data()
          const tags = normalizeActivityTags(data.activityTags, data.activityTag)
          const rawImgs: unknown[] = Array.isArray(data.activityImages) ? data.activityImages : []
          const images = rawImgs.map((img) => packageImageUrl(img as string)).filter(Boolean)
          return {
            id: idx,
            firestoreId: d.id,
            category: primaryActivityTag(tags),
            categories: tags,
            title: data.activityName ?? '',
            location: data.activityLocation ?? '',
            rating: data.activityRating ?? 0,
            reviewCount: 0,
            price: data.pricePerGuest ?? 0,
            maxGuests: data.maximumNumberOfPeople ?? data.maxSlots ?? 30,
            image: images[0] ?? '',
            images,
            municipalityId: data.activityLocation ?? '',
            duration: data.duration ?? '',
          }
        })
        setActivities(mapped)
      } catch (err) {
        console.error('Failed to fetch activities:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  useEffect(() => {
    const normalizedDate = searchDate.trim()
    if (!normalizedDate) { setDayCapacity({}); return }
    const sourceIds = activities.map((a) => a.firestoreId).filter((id): id is string => !!id)
    getDayCapacity(sourceIds, normalizedDate).then(setDayCapacity).catch(() => setDayCapacity({}))
  }, [activities, searchDate])

  const maxPrice = useMemo(() => Math.max(...activities.map((a) => a.price), 10000), [activities])

  const uniqueLocations = useMemo(() => {
    const counts: Record<string, number> = {}
    activities.forEach((a) => { counts[a.location] = (counts[a.location] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [activities])

  const activeFiltersCount =
    activeTags.length
    + (activeLocationChip ? 1 : 0)
    + (ratingFilter ? 1 : 0)
    + ((priceRange[0] > 0 || priceRange[1] < maxPrice) ? 1 : 0)

  const filtered = useMemo(() => {
    let list = activities.filter((a) => {
      const matchesTag =
        activeTags.length === 0
        || activeTags.some((t) => (a.categories ? activityHasTag(a.categories, t) : a.category === t))
      const matchesLocation = (!searchLocation || a.location.toLowerCase().includes(searchLocation.toLowerCase()))
        && (!activeLocationChip || a.location === activeLocationChip)
      const matchesRating = !ratingFilter || a.rating >= ratingFilter
      const matchesPrice = a.price >= priceRange[0] && a.price <= priceRange[1]
      const requestedTravelers = Math.max(1, parseInt(searchTravelers || '1', 10) || 1)
      const slotsAvailable = a.firestoreId ? dayCapacity[a.firestoreId] : null
      const effectiveCapacity = slotsAvailable ?? a.maxGuests ?? 30
      const matchesAvailability = !searchDate || effectiveCapacity >= requestedTravelers
      return matchesTag && matchesLocation && matchesRating && matchesPrice && matchesAvailability
    })
    if (sortBy === 'Price · low to high') list = [...list].sort((a, b) => a.price - b.price)
    else if (sortBy === 'Price · high to low') list = [...list].sort((a, b) => b.price - a.price)
    else if (sortBy === 'Highest rated') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [activities, activeTags, searchLocation, activeLocationChip, ratingFilter, priceRange, searchDate, searchTravelers, dayCapacity, sortBy])

  const visible = filtered.slice(0, visibleCount)

  const activePills = [
    ...activeTags.map((tag) => ({ label: tag, clear: () => toggleTag(tag) })),
    ...(activeLocationChip ? [{ label: activeLocationChip, clear: () => setActiveLocationChip(null) }] : []),
    ...(ratingFilter ? [{ label: `${ratingFilter}★ & up`, clear: () => setRatingFilter(null) }] : []),
  ]

  const avgRating = activities.length > 0
    ? (activities.reduce((s, a) => s + a.rating, 0) / activities.length).toFixed(1)
    : '4.7'

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">

      {/* ── Hero band (light, compact) ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] font-mono tracking-[.14em] uppercase text-gray-400 mb-3">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span>Cebu</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#008768]">{loading ? '—' : activities.length} Results</span>
          </nav>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em] m-0 text-gray-900">
                Activities in{' '}
                <em className="not-italic font-normal text-[#008768]">Cebu</em>.
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-[540px]">
                Highland temples, hidden coves, and coastal adventures. {loading ? 'Loading' : activities.length} experiences from local operators.
              </p>
            </div>
            <div className="hidden lg:flex gap-6 shrink-0">
              {[
                [loading ? '—' : `${activities.length}`, 'activities'],
                [avgRating + '★', 'avg rating'],
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

      {/* ── Compact search bar ── */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Desktop search bar */}
          <div className="hidden sm:block">
            <SearchBar
              className="max-w-4xl mx-auto"
              defaultWhere={searchLocation}
              defaultWhen={searchDate}
              defaultTravelers={searchTravelers}
              onSearch={({ where, when, travelers }) => {
                setSearchLocation(where)
                setSearchDate(when)
                setSearchTravelers(travelers)
                setVisibleCount(12)
              }}
            />
          </div>

          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={() => setSearchDrawerOpen(true)}
            className="sm:hidden w-full flex items-center gap-3 border border-gray-200 rounded-full px-5 py-3 bg-white shadow-sm text-sm text-gray-500"
          >
            <svg className="w-4 h-4 shrink-0 text-[#008768]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <span className="flex-1 text-left">{searchLocation || 'Any location'}</span>
            {searchDate && <span className="text-gray-400 text-xs">{searchDate}</span>}
          </button>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 pb-20 lg:pb-16">
        <div className="flex gap-8 items-start">

          {/* ── Sidebar (desktop) ── */}
          <AnimatePresence initial={false}>
            {sidebarVisible && (
              <motion.aside
                key="filters-sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.2, 0.7, 0.3, 1] }}
                className="hidden lg:block shrink-0 sticky top-6 overflow-hidden"
              >
                <div className="w-[300px]">
                  <FiltersSidebar
                    activities={activities}
                    activeTags={activeTags} toggleTag={toggleTag}
                    activeLocationChip={activeLocationChip} setActiveLocationChip={setActiveLocationChip}
                    ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
                    priceRange={priceRange} setPriceRange={setPriceRange}
                    maxPrice={maxPrice}
                    uniqueLocations={uniqueLocations}
                    activeFiltersCount={activeFiltersCount}
                    onClearAll={() => { setActiveTags([]); setActiveLocationChip(null); setRatingFilter(null); setPriceRange([0, maxPrice]) }}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Results ── */}
          <main className="flex-1 min-w-0">
            {/* Active filter pills */}
            {activePills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5 items-center">
                <span className="text-[11px] font-mono tracking-[.1em] uppercase text-gray-400">Active</span>
                {activePills.map(({ label, clear }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#d9efe6] text-[#003a2d] font-medium text-xs">
                    {label}
                    <button type="button" onClick={clear} aria-label={`Remove ${label} filter`}
                      className="w-[18px] h-[18px] rounded-full border-none bg-[#008768]/20 text-[#003a2d] flex items-center justify-center cursor-pointer p-0">
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 2l8 8M10 2l-8 8" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Results header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end mb-5">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 tracking-[-0.02em] m-0 whitespace-nowrap">
                  {loading ? 'Loading…' : `${filtered.length} activities`}
                </h1>
                <div className="mt-1 text-sm text-gray-400">
                  {searchDate && `${searchDate} · `}{searchTravelers && `${searchTravelers} guest${parseInt(searchTravelers || '1') !== 1 ? 's' : ''}`}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Desktop filters toggle */}
                <button
                  type="button"
                  onClick={() => setSidebarVisible((v) => !v)}
                  className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium shadow-sm transition-colors ${
                    sidebarVisible
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h4" />
                  </svg>
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#008768] text-white text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>
                  )}
                </button>
                {/* Mobile filters */}
                <button
                  type="button"
                  onClick={() => setFilterDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h4" />
                  </svg>
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#008768] text-white text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>
                  )}
                </button>

                <select
                  aria-label="Sort by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs sm:text-[13px] px-3 sm:px-3.5 py-2 sm:py-2.5 border border-gray-200 rounded-full bg-white font-medium text-gray-700 outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
                >
                  {['Recommended', 'Price · low to high', 'Price · high to low', 'Highest rated'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>

                {/* <div className="flex border border-gray-200 rounded-full bg-white p-1">
                  {(['grid', 'list'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setViewMode(v)}
                      className={`px-3.5 py-1.5 rounded-full border-none text-xs font-medium cursor-pointer capitalize transition-colors ${
                        viewMode === v ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div> */}
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">Loading activities…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No activities match your filters.</div>
            ) : (
              <div className={viewMode === 'grid'
                ? `grid ${sidebarVisible ? ' lg:grid-cols-3 xl:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4'} gap-2 sm:gap-4 mb-8`
                : 'flex flex-col gap-4 mb-8'
              }>
                {visible.map((act) => (
                  <ActivityCard
                    key={act.id}
                    activity={act}
                    date={searchDate}
                    travelers={searchTravelers}
                  />
                ))}
              </div>
            )}

            {/* Load more */}
            {!loading && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-[13px] text-gray-400">
                  Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} results
                </span>
                <div className="flex gap-3">
                  {visibleCount < filtered.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + 12)}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Load more
                    </button>
                  )}
                  {visibleCount > 12 && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(12)}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {popularPackages.length > 0 && (
        <section className="sm:max-w-[1280px] sm:mx-auto w-full px-6 lg:px-10 pb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Popular Packages</h2>
            <Link href="/tour-packages" className="text-sm text-[#008768] font-medium hover:underline">See more</Link>
          </div>
          <div className="relative">
            {canScrollPackagesLeft && (
              <button
                type="button"
                onClick={() => packagesCarouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors"
                aria-label="Scroll left"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div
              ref={packagesCarouselRef}
              onScroll={updatePackagesCarouselButtons}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
            >
              {popularPackages.map((pkg) => (
                <div key={pkg.id} className="shrink-0 w-40 sm:w-[285px] snap-start">
                  <PackageCard
                    image={packageImageUrl(pkg.packageImages[0])}
                    images={pkg.packageImages.filter(Boolean).map(packageImageUrl)}
                    title={pkg.packageName}
                    price={pkg.pricePerPerson}
                    pricePrefix="Starting from"
                    tag={pkg.packageTag}
                    duration={pkg.duration}
                    rating={pkg.packageRating}
                    location={formatLocationSummary(pkg.packageLocations)}
                    cardKind="tourPackage"
                    href={`/tour-packages/${pkg.slug}`}
                  />
                </div>
              ))}

              <div className="shrink-0 sm:w-[285px] snap-start">
                <Link href="/tour-packages" className="flex h-full items-center justify-center flex-col ">
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-center gap-3 group transition-colors">
                    <div className="w-12 h-12 rounded-full border border-black/50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <p className="text-black/50 font-bold text-sm text-center px-4">
                      See All Packages
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {canScrollPackagesRight && (
              <button
                type="button"
                onClick={() => packagesCarouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors"
                aria-label="Scroll right"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </section>
      )}

      <Footer />

      {/* Mobile: search drawer */}
      <Drawer open={searchDrawerOpen} onOpenChange={setSearchDrawerOpen}>
        <DrawerContent className="pb-8">
          <DrawerHeader>
            <DrawerTitle>Search Activities</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <SearchBar
              defaultWhere={searchLocation}
              defaultWhen={searchDate}
              defaultTravelers={searchTravelers}
              onSearch={({ where, when, travelers }) => {
                setSearchLocation(where)
                setSearchDate(when)
                setSearchTravelers(travelers)
                setVisibleCount(12)
                setSearchDrawerOpen(false)
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile: filters drawer */}
      <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <DrawerContent className="pb-8 max-h-[90vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <FiltersSidebar
              activities={activities}
              activeTags={activeTags} toggleTag={toggleTag}
              activeLocationChip={activeLocationChip} setActiveLocationChip={setActiveLocationChip}
              ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
              priceRange={priceRange} setPriceRange={setPriceRange}
              maxPrice={maxPrice}
              uniqueLocations={uniqueLocations}
              activeFiltersCount={activeFiltersCount}
              onClearAll={() => { setActiveTags([]); setActiveLocationChip(null); setRatingFilter(null); setPriceRange([0, maxPrice]) }}
              onApply={() => setFilterDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
