'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { collection, getDocs, query, where as firestoreWhere } from 'firebase/firestore'
import Footer from '@/app/components/Footer'
import ActivityCard from '@/app/components/ActivityCard'
import LocationCard from '@/app/components/LocationCard'
import PackageCard from '@/app/components/ui/PackageCard'
import SearchBar from '@/app/components/SearchBar'
import { firebaseDb } from '@/app/lib/firebase'
import {
  ACTIVITY_TAGS,
  normalizeActivityTags,
  primaryActivityTag,
  activityHasTag,
} from '@/app/lib/activity-tags'
import { packageImageUrl } from '@/app/lib/package-images'
import {
  countByActivityLocation,
  countByPackageLocation,
  mergeGuestLocations,
} from '@/app/lib/guest-location-list'
import { getHomepageCmsClient } from '@/app/lib/homepage-cms'
import {
  matchesMunicipalityRoute,
  municipalityFromSlug,
} from '@/app/lib/cebu-municipalities'
import { normalizePackageLocations, formatLocationSummary } from '@/app/lib/package-locations'
import { travelerReviews } from '@/app/data/mockData'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/app/components/ui/drawer'
import type { Activity, Location, TravelerReview } from '@/app/types'

interface FirestorePackageRow {
  id: string
  packageName: string
  packageDescription: string
  pricePerPerson: number
  minimumNumberOfPeople: number
  maximumNumberOfPeople?: number
  packageLocations: string[]
  duration: string
  packageTag: string
  packageImages: string[]
  packageRating: number
  slug: string
}

function displayNameFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
      <path
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1}
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}

function ReviewCard({ review }: { review: TravelerReview }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4 mb-4">
        <Image src={review.avatar} alt={review.name} width={48} height={48} className="rounded-full object-cover" />
        <div>
          <p className="font-semibold text-gray-900">{review.name}</p>
          <p className="text-xs text-gray-400">{review.date}</p>
        </div>
      </div>
      <StarRating rating={review.rating} />
      <p className="text-xs text-green-600 font-medium mt-1 mb-3">{review.activityTitle}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
    </div>
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

type ItemKind = 'activity' | 'package'

function FiltersSidebar({
  activities,
  packages,
  activeTags, toggleTag,
  ratingFilter, setRatingFilter,
  priceRange, setPriceRange,
  kindFilter, setKindFilter,
  maxPrice,
  activeFiltersCount,
  onClearAll,
  onApply,
}: {
  activities: Activity[]
  packages: FirestorePackageRow[]
  activeTags: string[]; toggleTag: (tag: string) => void
  ratingFilter: number | null; setRatingFilter: (v: number | null) => void
  priceRange: [number, number]; setPriceRange: (v: [number, number]) => void
  kindFilter: 'all' | ItemKind; setKindFilter: (v: 'all' | ItemKind) => void
  maxPrice: number
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

      <FilterGroup title="Type">
        <div className="grid grid-cols-3 gap-1.5">
          {(['all', 'activity', 'package'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`px-2 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                kindFilter === k
                  ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {k === 'package' ? 'Packages' : k === 'activity' ? 'Activities' : 'All'}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Category — only show tags present in this municipality. Multi-select. */}
      {(() => {
        const presentTags = ACTIVITY_TAGS.filter((tag) =>
          activities.some((a) => (a.categories ? activityHasTag(a.categories, tag) : a.category === tag))
          || packages.some((p) => p.packageTag === tag)
        )
        if (presentTags.length === 0) return null
        return (
          <FilterGroup title="Category">
            <div className="flex flex-wrap gap-1.5">
              {presentTags.map((tag) => {
                const cnt =
                  activities.filter((a) => (a.categories ? activityHasTag(a.categories, tag) : a.category === tag)).length
                  + packages.filter((p) => p.packageTag === tag).length
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

      <FilterGroup title="Rating" last>
        {[5, 4.5, 4, 3.5].map((r) => {
          const active = ratingFilter === r
          const cnt =
            activities.filter((a) => a.rating >= r).length
            + packages.filter((p) => p.packageRating >= r).length
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
                  <span key={n} style={{ opacity: n <= Math.floor(r) ? 1 : (n - 0.5 === r ? 0.5 : 0.18) }}>
                    <StarIcon filled />
                  </span>
                ))}
              </span>
              <span className="flex-1 text-xs text-gray-400">& up</span>
              <span className="text-xs text-gray-400">{cnt}</span>
            </label>
          )
        })}
      </FilterGroup>

      {onApply && (
        <button
          type="button"
          onClick={onApply}
          className="w-full bg-[#008768] hover:bg-[#003a2d] text-white font-medium py-3 rounded-full text-sm transition-colors mt-3"
        >
          Apply filters
        </button>
      )}
    </div>
  )
}

export default function MunicipalityView() {
  const params = useParams()
  const municipalityId = params.municipalityId as string
  const otherRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [packages, setPackages] = useState<FirestorePackageRow[]>([])
  const [otherLocations, setOtherLocations] = useState<Location[]>([])
  const [cmsHeroImage, setCmsHeroImage] = useState<string | null>(null)

  // Filters
  const [activeTags, setActiveTags] = useState<string[]>([])
  const toggleTag = (tag: string) =>
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [kindFilter, setKindFilter] = useState<'all' | ItemKind>('all')

  // UI
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [sortBy, setSortBy] = useState('Recommended')

  const municipalityName = useMemo(() => {
    const official = municipalityFromSlug(municipalityId)
    return official ?? displayNameFromSlug(municipalityId)
  }, [municipalityId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [actSnap, pkgSnap, cms] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'activities'), firestoreWhere('status', '==', 'active'))),
          getDocs(query(collection(firebaseDb, 'tourPackages'), firestoreWhere('status', '==', 'active'))),
          getHomepageCmsClient(),
        ])
        if (cancelled) return

        const cmsItemMap = new Map(
          cms.locations.items
            .filter((i) => i.published)
            .map((i) => [i.municipalitySlug, i]),
        )

        const thisItem = cmsItemMap.get(municipalityId)
        if (thisItem?.imageUrl) setCmsHeroImage(thisItem.imageUrl)

        const activityByMuni = countByActivityLocation(actSnap)
        const packageByMuni = countByPackageLocation(pkgSnap)
        const merged = mergeGuestLocations(activityByMuni, packageByMuni)
        const others = merged
          .filter((l) => l.id !== municipalityId)
          .map((l) => {
            const cmsItem = cmsItemMap.get(l.id)
            return cmsItem?.imageUrl ? { ...l, image: cmsItem.imageUrl } : l
          })
        setOtherLocations(others)

        const actList: Activity[] = []
        actSnap.docs.forEach((d, idx) => {
          const data = d.data()
          if (!matchesMunicipalityRoute(String(data.activityLocation ?? ''), municipalityId)) return
          const tags = normalizeActivityTags(data.activityTags, data.activityTag)
          actList.push({
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
            image: packageImageUrl(data.activityImages?.[0]) ?? '',
            municipalityId: data.activityLocation ?? '',
            duration: data.duration ?? '',
          })
        })
        actList.sort((a, b) => a.title.localeCompare(b.title))

        const pkgList: FirestorePackageRow[] = []
        pkgSnap.docs.forEach((d) => {
          const data = d.data()
          const locs = normalizePackageLocations(data)
          if (!matchesMunicipalityRoute(locs, municipalityId)) return
          pkgList.push({
            id: d.id,
            packageName: data.packageName ?? '',
            packageDescription: data.packageDescription ?? '',
            pricePerPerson: data.pricePerPerson ?? 0,
            minimumNumberOfPeople: data.minimumNumberOfPeople ?? 1,
            maximumNumberOfPeople: data.maximumNumberOfPeople,
            packageLocations: locs,
            duration: data.duration ?? '',
            packageTag: data.packageTag ?? '',
            packageImages: data.packageImages ?? [],
            packageRating: data.packageRating ?? 0,
            slug: data.slug ?? d.id,
          })
        })
        pkgList.sort((a, b) => a.packageName.localeCompare(b.packageName))

        setActivities(actList)
        setPackages(pkgList)
      } catch (e) {
        console.error('Failed to load municipality listings:', e)
        setActivities([])
        setPackages([])
        setOtherLocations([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [municipalityId])

  const maxPrice = useMemo(
    () => Math.max(
      ...activities.map((a) => a.price),
      ...packages.map((p) => p.pricePerPerson),
      10000,
    ),
    [activities, packages],
  )

  const filteredActivities = useMemo(() => {
    if (kindFilter === 'package') return []
    let list = activities.filter((a) => {
      const tagOk = activeTags.length === 0
        || activeTags.some((t) => (a.categories ? activityHasTag(a.categories, t) : a.category === t))
      const rateOk = !ratingFilter || a.rating >= ratingFilter
      const priceOk = a.price >= priceRange[0] && a.price <= priceRange[1]
      return tagOk && rateOk && priceOk
    })
    if (sortBy === 'Price · low to high') list = [...list].sort((a, b) => a.price - b.price)
    else if (sortBy === 'Price · high to low') list = [...list].sort((a, b) => b.price - a.price)
    else if (sortBy === 'Highest rated') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [activities, activeTags, ratingFilter, priceRange, kindFilter, sortBy])

  const filteredPackages = useMemo(() => {
    if (kindFilter === 'activity') return []
    let list = packages.filter((p) => {
      const tagOk = activeTags.length === 0 || activeTags.includes(p.packageTag)
      const rateOk = !ratingFilter || p.packageRating >= ratingFilter
      const priceOk = p.pricePerPerson >= priceRange[0] && p.pricePerPerson <= priceRange[1]
      return tagOk && rateOk && priceOk
    })
    if (sortBy === 'Price · low to high') list = [...list].sort((a, b) => a.pricePerPerson - b.pricePerPerson)
    else if (sortBy === 'Price · high to low') list = [...list].sort((a, b) => b.pricePerPerson - a.pricePerPerson)
    else if (sortBy === 'Highest rated') list = [...list].sort((a, b) => b.packageRating - a.packageRating)
    return list
  }, [packages, activeTags, ratingFilter, priceRange, kindFilter, sortBy])

  const totalCount = filteredActivities.length + filteredPackages.length
  const hasAnyUnfiltered = activities.length > 0 || packages.length > 0

  const activeFiltersCount =
    activeTags.length
    + (ratingFilter ? 1 : 0)
    + ((priceRange[0] > 0 || priceRange[1] < maxPrice) ? 1 : 0)
    + (kindFilter !== 'all' ? 1 : 0)

  const activePills = [
    ...activeTags.map((tag) => ({ label: tag, clear: () => toggleTag(tag) })),
    ...(ratingFilter ? [{ label: `${ratingFilter}★ & up`, clear: () => setRatingFilter(null) }] : []),
    ...(kindFilter !== 'all' ? [{ label: kindFilter === 'activity' ? 'Activities only' : 'Packages only', clear: () => setKindFilter('all') }] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">
      <section className="relative overflow-hidden">
        <div className="relative w-full h-[50vh] min-h-[220px]">
          {cmsHeroImage ? (
            <Image
              src={cmsHeroImage}
              alt={municipalityName}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-green-900" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        <div className="absolute top-0 left-0 px-8 md:px-16 pt-5">
          <nav className="text-white/80 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/locations" className="hover:text-white transition-colors">Cebu Locations</Link>
            <span className="mx-2">›</span>
            <span className="text-white font-medium">{municipalityName}</span>
          </nav>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white font-extrabold text-4xl sm:text-5xl md:text-6xl drop-shadow-lg tracking-wide">
            {municipalityName}
          </h1>
          <p className="text-white/80 text-sm sm:text-base mt-2">Cebu, Philippines</p>
        </div>
      </section>

      <div className="relative z-30 -mt-8 px-4 sm:px-6 md:px-16 mb-4">
        <SearchBar defaultWhere={municipalityName} className="max-w-4xl mx-auto" />
      </div>

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
                    activities={activities}
                    packages={packages}
                    activeTags={activeTags} toggleTag={toggleTag}
                    ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
                    priceRange={priceRange} setPriceRange={setPriceRange}
                    kindFilter={kindFilter} setKindFilter={setKindFilter}
                    maxPrice={maxPrice}
                    activeFiltersCount={activeFiltersCount}
                    onClearAll={() => { setActiveTags([]); setRatingFilter(null); setPriceRange([0, maxPrice]); setKindFilter('all') }}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Results */}
          <main className="flex-1 min-w-0">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end mb-5">
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 tracking-[-0.02em] m-0">
                  {loading ? 'Loading…' : `${totalCount} destinations in ${municipalityName}`}
                </h2>
                <div className="mt-1 text-sm text-gray-400">
                  {filteredActivities.length} activities · {filteredPackages.length} tour packages
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
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs sm:text-[13px] px-3 sm:px-3.5 py-2 sm:py-2.5 border border-gray-200 rounded-full bg-white font-medium text-gray-700 outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
                >
                  {['Recommended', 'Price · low to high', 'Price · high to low', 'Highest rated'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-sm text-gray-500 py-16 text-center">Loading destinations…</div>
            ) : !hasAnyUnfiltered ? (
              <div className="text-sm text-gray-500 py-16 text-center px-4">
                No activities or tour packages in this location yet. Explore{' '}
                <Link href="/activities" className="text-green-600 font-medium hover:underline">activities</Link>
                {' '}or{' '}
                <Link href="/tour-packages" className="text-green-600 font-medium hover:underline">tour packages</Link>
                {' '}across Cebu.
              </div>
            ) : totalCount === 0 ? (
              <div className="text-sm text-gray-500 py-12 text-center">
                Nothing matches the current filters. Clear filters or pick different tags.
              </div>
            ) : (
              <div className={`grid grid-cols-2 ${sidebarVisible ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4'} gap-4 mb-8 items-stretch`}>
                {filteredActivities.map((act) => (
                  <ActivityCard key={act.firestoreId ?? act.id} activity={act} />
                ))}
                {filteredPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    image={packageImageUrl(pkg.packageImages[0])}
                    title={pkg.packageName}
                    price={pkg.pricePerPerson}
                    pricePrefix="Starting from"
                    tag={pkg.packageTag}
                    duration={pkg.duration}
                    rating={pkg.packageRating}
                    minGuests={pkg.minimumNumberOfPeople ?? 1}
                    location={formatLocationSummary(pkg.packageLocations)}
                    cardKind="tourPackage"
                    href={`/tour-packages/${pkg.slug}`}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-12">
        <h2 className="text-2xl font-bold text-green-600 mb-8 text-center">Traveler&apos;s Experience in {municipalityName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {travelerReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Other Locations in Cebu</h2>
          <Link href="/locations" className="text-sm text-[#008768] font-medium hover:underline">See more</Link>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => otherRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full w-9 h-9 flex items-center justify-center"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div ref={otherRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {otherLocations.length === 0 ? (
              <p className="text-sm text-gray-500 py-6">No other municipalities with listings yet.</p>
            ) : (
              otherLocations.map((loc) => (
                <div key={loc.id} className="shrink-0 w-56 sm:w-64">
                  <LocationCard location={loc} />
                </div>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => otherRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
            className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full w-9 h-9 flex items-center justify-center"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </section>

      <Footer />

      {/* Mobile filters drawer */}
      <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <DrawerContent className="pb-8 max-h-[90vh] overflow-y-auto">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <FiltersSidebar
              activities={activities}
              packages={packages}
              activeTags={activeTags} toggleTag={toggleTag}
              ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
              priceRange={priceRange} setPriceRange={setPriceRange}
              kindFilter={kindFilter} setKindFilter={setKindFilter}
              maxPrice={maxPrice}
              activeFiltersCount={activeFiltersCount}
              onClearAll={() => { setActiveTags([]); setRatingFilter(null); setPriceRange([0, maxPrice]); setKindFilter('all') }}
              onApply={() => setFilterDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
