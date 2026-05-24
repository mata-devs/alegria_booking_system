'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import ActivityCard from '@/app/components/ActivityCard'
import { useSearchParams } from 'next/navigation'
import { parseGuestListingSearchParams } from '@/app/lib/searchSchema'
import { getDayCapacity } from '@/app/lib/getDayCapacity'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'
import { ACTIVITY_TAGS, normalizeActivityTags, primaryActivityTag, formatActivityTagsDisplay, activityHasTag } from '@/app/lib/activity-tags'
import { packageImageUrl } from '@/app/lib/package-images'
import type { Activity } from '@/app/types'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/app/components/ui/drawer'
import SearchBar from '@/app/components/SearchBar'

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
  activeTag, setActiveTag,
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
  activeTag: string | null; setActiveTag: (v: string | null) => void
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

      {/* Category */}
      <FilterGroup title="Category">
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                activeTag === tag
                  ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {tag}
              <span className={`ml-1 font-semibold text-[10px] ${activeTag === tag ? 'text-[#008768]' : 'text-gray-400'}`}>
                {activities.filter((a) => a.category === tag).length}
              </span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Price */}
      <FilterGroup title={`Price · ₱${priceRange[0].toLocaleString()} – ₱${priceRange[1].toLocaleString()}`}>
        <div className="space-y-3">
          <input
            type="range"
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
                  <span key={n} style={{ opacity: n <= Math.floor(r) ? 1 : (n - 0.5 === r ? 0.5 : 0.18) }}>
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
  const [activeTag, setActiveTag] = useState<string | null>(null)
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
          return {
            id: idx,
            firestoreId: d.id,
            category: formatActivityTagsDisplay(tags) || primaryActivityTag(tags),
            categories: tags,
            title: data.activityName ?? '',
            location: data.activityLocation ?? '',
            rating: data.activityRating ?? 0,
            reviewCount: 0,
            price: data.pricePerGuest ?? 0,
            maxGuests: data.maximumNumberOfPeople ?? data.maxSlots ?? 30,
            image: packageImageUrl(data.activityImages?.[0]) ?? '',
            municipalityId: data.activityLocation ?? '',
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

  const activeFiltersCount = [
    activeTag,
    activeLocationChip,
    ratingFilter,
    (priceRange[0] > 0 || priceRange[1] < maxPrice) ? 'price' : null,
  ].filter(Boolean).length

  const filtered = useMemo(() => {
    let list = activities.filter((a) => {
      const matchesTag = !activeTag || (a.categories ? activityHasTag(a.categories, activeTag) : a.category === activeTag)
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
  }, [activities, activeTag, searchLocation, activeLocationChip, ratingFilter, priceRange, searchDate, searchTravelers, dayCapacity, sortBy])

  const visible = filtered.slice(0, visibleCount)

  const activePills = [
    ...(activeTag ? [{ label: activeTag, clear: () => setActiveTag(null) }] : []),
    ...(activeLocationChip ? [{ label: activeLocationChip, clear: () => setActiveLocationChip(null) }] : []),
    ...(ratingFilter ? [{ label: `${ratingFilter}★ & up`, clear: () => setRatingFilter(null) }] : []),
  ]

  const avgRating = activities.length > 0
    ? (activities.reduce((s, a) => s + a.rating, 0) / activities.length).toFixed(1)
    : '4.7'

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">

      {/* ── Hero band ── */}
      <div className="relative overflow-hidden text-white" style={{ background: '#0a1614' }}>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(70% 60% at 30% 30%, #4a7a52 0%, transparent 60%), radial-gradient(80% 60% at 70% 70%, #2a5a78 0%, transparent 60%), linear-gradient(180deg, #1c2a26 0%, #0a1614 100%)',
          opacity: 0.55,
        }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.72))' }} />
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] font-mono tracking-[.14em] uppercase text-[#00c98f] mb-4">
            <Link href="/" className="opacity-60 hover:opacity-100 text-white transition-opacity">Home</Link>
            <span className="opacity-40 text-white">/</span>
            <span className="opacity-60 text-white">Cebu</span>
            <span className="opacity-40 text-white">/</span>
            <span>{loading ? '—' : activities.length} Results</span>
          </nav>

          <div className="flex items-flex-end justify-between gap-10">
            <div>
              <h1 className="text-[clamp(2.5rem,5vw,3.75rem)] font-extrabold leading-[0.98] tracking-[-0.035em] m-0">
                Activities in{' '}
                <em className="not-italic font-normal" style={{ color: '#00c98f' }}>Cebu</em>.
              </h1>
              <p className="mt-3.5 text-[15px] max-w-[540px]" style={{ color: 'rgba(255,255,255,.7)' }}>
                Highland temples, hidden coves, and coastal adventures. {loading ? 'Loading' : activities.length} experiences from local operators.
              </p>
            </div>
            <div className="hidden lg:flex gap-6 pb-1.5 shrink-0">
              {[
                [loading ? '—' : `${activities.length}`, 'activities'],
                [avgRating + '★', 'avg rating'],
              ].map(([n, l]) => (
                <div key={l} className="text-right">
                  <div className="text-[2rem] font-extrabold tracking-[-0.03em] leading-none">{n}</div>
                  <div className="mt-1 text-[11px] font-mono tracking-[.1em] uppercase" style={{ color: 'rgba(255,255,255,.55)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Compact search bar ── */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {/* Desktop pill bar */}
          <div className="hidden sm:grid grid-cols-[1.4fr_1fr_1fr_auto] border border-gray-200 rounded-full p-1 bg-white shadow-sm">
            <div className="px-5 py-2">
              <div className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400">Where</div>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Any location"
                className="text-sm font-medium text-gray-800 w-full bg-transparent outline-none mt-0.5 placeholder:text-gray-400"
              />
            </div>
            <div className="px-5 py-2 border-l border-gray-100">
              <div className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400">When</div>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="text-sm font-medium text-gray-800 w-full bg-transparent outline-none mt-0.5 [color-scheme:light]"
              />
            </div>
            <div className="px-5 py-2 border-l border-gray-100">
              <div className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400">Travelers</div>
              <input
                type="number"
                min={1}
                value={searchTravelers}
                onChange={(e) => setSearchTravelers(e.target.value)}
                placeholder="1 guest"
                className="text-sm font-medium text-gray-800 w-full bg-transparent outline-none mt-0.5 placeholder:text-gray-400"
              />
            </div>
            <div className="p-1">
              <button
                type="button"
                className="flex items-center gap-2 bg-[#008768] hover:bg-[#003a2d] text-white font-medium px-6 py-3 rounded-full text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                Search
              </button>
            </div>
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
      <div className="max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-8 pb-20 lg:pb-16">
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
                    activeTag={activeTag} setActiveTag={setActiveTag}
                    activeLocationChip={activeLocationChip} setActiveLocationChip={setActiveLocationChip}
                    ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
                    priceRange={priceRange} setPriceRange={setPriceRange}
                    maxPrice={maxPrice}
                    uniqueLocations={uniqueLocations}
                    activeFiltersCount={activeFiltersCount}
                    onClearAll={() => { setActiveTag(null); setActiveLocationChip(null); setRatingFilter(null); setPriceRange([0, maxPrice]) }}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Results ── */}
          <main className="flex-1 min-w-0">
            {/* Category chips */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className={`shrink-0 px-4 py-2.5 rounded-full text-[13px] font-medium transition-colors border cursor-pointer ${
                  activeTag === null
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                All <span className={`ml-1.5 text-[11px] ${activeTag === null ? 'text-white/60' : 'text-gray-400'}`}>{activities.length}</span>
              </button>
              {ACTIVITY_TAGS.map((tag) => {
                const cnt = activities.filter((a) => a.category === tag).length
                if (cnt === 0) return null
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`shrink-0 px-4 py-2.5 rounded-full text-[13px] font-medium transition-colors border cursor-pointer whitespace-nowrap ${
                      activeTag === tag
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {tag} <span className={`ml-1.5 text-[11px] ${activeTag === tag ? 'text-white/60' : 'text-gray-400'}`}>{cnt}</span>
                  </button>
                )
              })}
            </div>

            {/* Active filter pills */}
            {activePills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5 items-center">
                <span className="text-[11px] font-mono tracking-[.1em] uppercase text-gray-400">Active</span>
                {activePills.map(({ label, clear }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#d9efe6] text-[#003a2d] font-medium text-xs">
                    {label}
                    <button type="button" onClick={clear}
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
            <div className="flex justify-between items-end mb-5">
              <div>
                <h1 className="text-[28px] font-extrabold text-gray-900 tracking-[-0.02em] m-0">
                  {loading ? 'Loading…' : `${filtered.length} activities`}
                </h1>
                <div className="mt-1 text-sm text-gray-400">
                  {searchDate && `${searchDate} · `}{searchTravelers && `${searchTravelers} guest${parseInt(searchTravelers || '1') !== 1 ? 's' : ''}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
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
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-[13px] px-3.5 py-2.5 border border-gray-200 rounded-full bg-white font-medium text-gray-700 outline-none cursor-pointer"
                >
                  {['Recommended', 'Price · low to high', 'Price · high to low', 'Highest rated'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>

                <div className="flex border border-gray-200 rounded-full bg-white p-1">
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
                </div>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">Loading activities…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">No activities match your filters.</div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8'
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
              activeTag={activeTag} setActiveTag={setActiveTag}
              activeLocationChip={activeLocationChip} setActiveLocationChip={setActiveLocationChip}
              ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
              priceRange={priceRange} setPriceRange={setPriceRange}
              maxPrice={maxPrice}
              uniqueLocations={uniqueLocations}
              activeFiltersCount={activeFiltersCount}
              onClearAll={() => { setActiveTag(null); setActiveLocationChip(null); setRatingFilter(null); setPriceRange([0, maxPrice]) }}
              onApply={() => setFilterDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
