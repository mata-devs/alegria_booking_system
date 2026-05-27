'use client'

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Footer from '@/app/components/Footer'
import SearchBar from '@/app/components/SearchBar'
import PackageCard from '@/app/components/ui/PackageCard'
import ActivityCard from '@/app/components/ActivityCard'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { normalizePackageLocations, formatLocationSummary } from '@/app/lib/package-locations'
import { packageImageUrl } from '@/app/lib/package-images'
import { normalizeActivityTags, primaryActivityTag } from '@/app/lib/activity-tags'
import { canonicalMunicipalityLabel } from '@/app/lib/cebu-municipalities'
import { firebaseDb } from '@/app/lib/firebase'
import { ACTIVITY_TAGS } from '@/app/lib/activity-tags'
import { parseGuestListingSearchParams } from '@/app/lib/searchSchema'
import { getDayCapacity } from '@/app/lib/getDayCapacity'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/app/components/ui/drawer'

interface FirestorePackage {
  id: string
  packageName: string
  packageDescription: string
  pricePerPerson: number
  minimumNumberOfPeople: number
  maximumNumberOfPeople?: number
  packageLocations: string[]
  operatorId?: string
  duration: string
  packageTag: string
  packageImages: string[]
  packageRating: number
  slug: string
}

const INITIAL_COUNT = 9

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
      <defs>
        {half && (
          <linearGradient id="half-star-pkg">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        )}
      </defs>
      <path
        fill={half ? 'url(#half-star-pkg)' : filled ? 'currentColor' : 'none'}
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
  packages,
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
  packages: FirestorePackage[]
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

      {/* Category — only show tags that exist in the current packages. Multi-select. */}
      {(() => {
        const presentTags = ACTIVITY_TAGS.filter((tag) => packages.some((p) => p.packageTag === tag))
        if (presentTags.length === 0) return null
        return (
          <FilterGroup title="Category">
            <div className="flex flex-wrap gap-1.5">
              {presentTags.map((tag) => {
                const cnt = packages.filter((p) => p.packageTag === tag).length
                const active = activeTags.includes(tag)
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
                    <span className={`ml-1 font-semibold text-[10px] ${active ? 'text-[#008768]' : 'text-gray-400'}`}>{cnt}</span>
                  </button>
                )
              })}
            </div>
          </FilterGroup>
        )
      })()}

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

      <FilterGroup title="Rating">
        {[5, 4.5, 4, 3.5].map((r) => {
          const active = ratingFilter === r
          return (
            <label key={r} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <span className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center text-white flex-shrink-0 ${active ? 'bg-[#008768] border-[#008768]' : 'bg-white border-gray-200'}`}
                onClick={() => setRatingFilter(active ? null : r)}>
                {active && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="flex gap-0.5 text-[#f1a500]">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={n <= Math.floor(r) ? 'star-full' : (n - 0.5 === r ? 'star-half' : 'star-dim')}>
                    <StarIcon filled />
                  </span>
                ))}
              </span>
              <span className="flex-1 text-xs text-gray-400">& up</span>
              <span className="text-xs text-gray-400">{packages.filter((p) => p.packageRating >= r).length}</span>
            </label>
          )
        })}
      </FilterGroup>

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
          Apply filters · {packages.length} results
        </button>
      )}
    </div>
  )
}

export default function TourPackagesPage() {
  return (
    <Suspense>
      <TourPackagesContent />
    </Suspense>
  )
}

function TourPackagesContent() {
  const searchParams = useSearchParams()
  const queryKey = searchParams.toString()
  const initialSearch = parseGuestListingSearchParams(searchParams)
  const [packages, setPackages] = useState<FirestorePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [dayCapacity, setDayCapacity] = useState<Record<string, number | null>>({})

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
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)

  // UI
  const [searchWhere, setSearchWhere] = useState(initialSearch.location)
  const [searchDate, setSearchDate] = useState(initialSearch.date)
  const [searchTravelers, setSearchTravelers] = useState(initialSearch.travelers)
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)

  const [popularActivities, setPopularActivities] = useState<{
    id: string; activityName: string; activityTag: string; activityTags?: unknown;
    activityLocation: string; activityRating: number;
    pricePerGuest: number; activityImages: string[];
  }[]>([])
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const p = parseGuestListingSearchParams(new URLSearchParams(queryKey))
    setSearchWhere(p.location)
    setSearchDate(p.date)
    setSearchTravelers(p.travelers)
    setVisibleCount(INITIAL_COUNT)
  }, [queryKey])

  useEffect(() => {
    getDocs(query(
      collection(firebaseDb, 'tourPackages'),
      where('status', '==', 'active'),
    )).then((snap) => {
      setPackages(snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
          packageLocations: normalizePackageLocations(data),
        } as FirestorePackage
      }))
      setLoading(false)
    }).catch(() => setLoading(false))

    async function fetchActivities() {
      try {
        const snap = await getDocs(query(collection(firebaseDb, 'activities'), where('status', '==', 'active'), limit(7)))
        setPopularActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as typeof popularActivities[0])))
      } catch { /* ignore */ }
    }
    fetchActivities()
  }, [])

  useEffect(() => {
    const normalizedDate = searchDate.trim()
    if (!normalizedDate) { setDayCapacity({}); return }
    const sourceIds = packages.map((pkg) => pkg.id).filter(Boolean)
    getDayCapacity(sourceIds, normalizedDate)
      .then(setDayCapacity)
      .catch(() => setDayCapacity({}))
  }, [packages, searchDate])

  const maxPrice = useMemo(() => Math.max(...packages.map((p) => p.pricePerPerson), 10000), [packages])

  const uniqueLocations = useMemo(() => {
    const counts: Record<string, number> = {}
    packages.forEach((p) => {
      const primary = p.packageLocations[0]
      if (!primary) return
      counts[primary] = (counts[primary] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [packages])

  const activeFiltersCount =
    activeTags.length
    + (activeLocationChip ? 1 : 0)
    + (ratingFilter ? 1 : 0)
    + ((priceRange[0] > 0 || priceRange[1] < maxPrice) ? 1 : 0)

  const filtered = useMemo(() => {
    let list = packages.filter((p) => {
      const matchesTag = activeTags.length === 0 || activeTags.includes(p.packageTag)
      const term = searchWhere.trim().toLowerCase()
      const matchesSearch = !term
        || p.packageName.toLowerCase().includes(term)
        || p.packageLocations.some((loc) => loc.toLowerCase().includes(term))
      const filterMuni = searchWhere.trim()
      const matchesLocationSearch = !filterMuni
        || p.packageLocations.some((loc) => canonicalMunicipalityLabel(loc) === canonicalMunicipalityLabel(filterMuni))
      const matchesLocationChip = !activeLocationChip
        || p.packageLocations.some((loc) => canonicalMunicipalityLabel(loc) === canonicalMunicipalityLabel(activeLocationChip))
      const matchesRating = !ratingFilter || p.packageRating >= ratingFilter
      const matchesPrice = p.pricePerPerson >= priceRange[0] && p.pricePerPerson <= priceRange[1]
      const requestedTravelers = Math.max(1, Number.parseInt(searchTravelers || '1', 10) || 1)
      const slotsAvailable = dayCapacity[p.id]
      const fallbackCapacity = Math.max(p.minimumNumberOfPeople ?? 1, p.maximumNumberOfPeople ?? 30)
      const effectiveCapacity = slotsAvailable ?? fallbackCapacity
      const matchesAvailability = !searchDate || effectiveCapacity >= requestedTravelers
      return matchesTag && matchesSearch && matchesLocationSearch && matchesLocationChip
        && matchesRating && matchesPrice && matchesAvailability
    })
    if (sortBy === 'Price · low to high') list = [...list].sort((a, b) => a.pricePerPerson - b.pricePerPerson)
    else if (sortBy === 'Price · high to low') list = [...list].sort((a, b) => b.pricePerPerson - a.pricePerPerson)
    else if (sortBy === 'Highest rated') list = [...list].sort((a, b) => b.packageRating - a.packageRating)
    return list
  }, [packages, activeTags, searchWhere, activeLocationChip, ratingFilter, priceRange, searchDate, searchTravelers, dayCapacity, sortBy])

  const visible = filtered.slice(0, visibleCount)

  const activePills = [
    ...activeTags.map((tag) => ({ label: tag, clear: () => toggleTag(tag) })),
    ...(activeLocationChip ? [{ label: activeLocationChip, clear: () => setActiveLocationChip(null) }] : []),
    ...(ratingFilter ? [{ label: `${ratingFilter}★ & up`, clear: () => setRatingFilter(null) }] : []),
  ]

  const avgRating = packages.length > 0
    ? (packages.reduce((s, p) => s + p.packageRating, 0) / packages.length).toFixed(1)
    : '4.7'

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">

      {/* ── Hero band (light, compact) ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
          <nav className="flex items-center gap-2 text-[11px] font-mono tracking-[.14em] uppercase text-gray-400 mb-3">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span>Cebu</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#008768]">{loading ? '—' : packages.length} Results</span>
          </nav>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em] m-0 text-gray-900">
                Tour Packages in{' '}
                <em className="not-italic font-normal text-[#008768]">Cebu</em>.
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-[540px]">
                Curated adventures across the most beautiful spots in Cebu. {loading ? 'Loading' : packages.length} packages from local operators.
              </p>
            </div>
            <div className="hidden lg:flex gap-6 shrink-0">
              {[
                [loading ? '—' : `${packages.length}`, 'packages'],
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
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="hidden sm:block">
            <SearchBar
              className="max-w-4xl mx-auto"
              defaultWhere={searchWhere}
              defaultWhen={searchDate}
              defaultTravelers={searchTravelers}
              onSearch={({ where, when, travelers }) => { setSearchWhere(where); setSearchDate(when); setSearchTravelers(travelers); setVisibleCount(INITIAL_COUNT) }}
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
            <span className="flex-1 text-left">{searchWhere || 'Any location'}</span>
            {searchDate && <span className="text-gray-400 text-xs">{searchDate}</span>}
          </button>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-8 pb-20 lg:pb-16">
        <div className="flex gap-8 items-start">

          {/* Sidebar (desktop) */}
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
                    packages={packages}
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

          {/* Results */}
          <main className="flex-1 min-w-0">
            {/* Active pills */}
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
                  {loading ? 'Loading…' : `${filtered.length} packages`}
                </h1>
                <div className="mt-1 text-sm text-gray-400">
                  {searchDate && `${searchDate} · `}{searchTravelers && `${searchTravelers} guest${parseInt(searchTravelers || '1') !== 1 ? 's' : ''}`}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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

            {/* Results grid */}
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">Loading packages…</div>
            ) : visible.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                {packages.length === 0 ? 'No tour packages available yet.' : 'No packages match your filters.'}
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? `grid grid-cols-2 ${sidebarVisible ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4'} gap-4 mb-8 items-stretch`
                : 'flex flex-col gap-4 mb-8'
              }>
                {visible.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    image={packageImageUrl(pkg.packageImages[0])}
                    images={pkg.packageImages.filter(Boolean).map(packageImageUrl)}
                    title={pkg.packageName}
                    price={pkg.pricePerPerson}
                    pricePrefix="Starting from"
                    tag={pkg.packageTag}
                    duration={pkg.duration}
                    rating={pkg.packageRating}
                    minGuests={pkg.minimumNumberOfPeople ?? 1}
                    location={formatLocationSummary(pkg.packageLocations)}
                    cardKind="tourPackage"
                    href={(() => {
                      const params = new URLSearchParams()
                      if (searchDate) params.set('date', searchDate)
                      if (searchTravelers) params.set('travelers', searchTravelers)
                      const q = params.toString()
                      return `/tour-packages/${pkg.slug}${q ? `?${q}` : ''}`
                    })()}
                  />
                ))}
              </div>
            )}

            {!loading && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-[13px] text-gray-400">
                  Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} results
                </span>
                <div className="flex gap-3">
                  {visibleCount < filtered.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((c) => c + 6)}
                      className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Show more
                    </button>
                  )}
                  {visibleCount > INITIAL_COUNT && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(INITIAL_COUNT)}
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

      {popularActivities.length > 0 && (
        <section className="max-w-[1280px] mx-auto w-full px-6 lg:px-10 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Popular Activities</h2>
            <Link href="/activities" className="text-sm text-[#008768] font-medium hover:underline">See more</Link>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors hidden sm:flex"
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
            >
              {popularActivities.map((act) => (
                <div key={act.id} className="shrink-0 w-44 sm:w-52 snap-start">
                  <ActivityCard
                    activity={{
                      id: 0,
                      firestoreId: act.id,
                      category: primaryActivityTag(normalizeActivityTags(act.activityTags, act.activityTag)),
                      categories: normalizeActivityTags(act.activityTags, act.activityTag),
                      title: act.activityName,
                      location: act.activityLocation,
                      rating: act.activityRating,
                      reviewCount: 0,
                      price: act.pricePerGuest,
                      image: packageImageUrl(act.activityImages?.[0]) ?? '',
                      images: act.activityImages?.map(packageImageUrl),
                      municipalityId: '',
                    }}
                    date={searchDate}
                    travelers={searchTravelers}
                  />
                </div>
              ))}
              <div className="shrink-0 w-44 sm:w-52 snap-start">
                <Link href="/activities" className="block h-full">
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#008768] flex flex-col items-center justify-center gap-3 group hover:bg-[#003a2d] transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <p className="text-white font-bold text-sm text-center px-4">See All Activities</p>
                  </div>
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors hidden sm:flex"
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      )}

      <Footer />

      {/* Mobile: search drawer */}
      <Drawer open={searchDrawerOpen} onOpenChange={setSearchDrawerOpen}>
        <DrawerContent className="pb-8">
          <DrawerHeader>
            <DrawerTitle>Search Tour Packages</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <SearchBar
              defaultWhere={searchWhere}
              defaultWhen={searchDate}
              defaultTravelers={searchTravelers}
              onSearch={({ where, when, travelers }) => {
                setSearchWhere(where)
                setSearchDate(when)
                setSearchTravelers(travelers)
                setVisibleCount(INITIAL_COUNT)
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
              packages={packages}
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
