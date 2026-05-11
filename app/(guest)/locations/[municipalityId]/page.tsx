'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { collection, getDocs, query, where as firestoreWhere } from 'firebase/firestore'
import Footer from '@/app/components/Footer'
import ActivityCard from '@/app/components/ActivityCard'
import LocationCard from '@/app/components/LocationCard'
import PackageCard from '@/app/components/ui/PackageCard'
import SearchBar from '@/app/components/SearchBar'
import { CategoryFilterCollapsible } from '@/app/components/CategoryFilterCollapsible'
import { firebaseDb } from '@/app/lib/firebase'
import { ACTIVITY_TAGS } from '@/app/lib/activity-tags'
import {
  countByActivityLocation,
  countByPackageLocation,
  mergeGuestLocations,
} from '@/app/lib/guest-location-list'
import {
  matchesMunicipalityRoute,
  municipalityFromSlug,
} from '@/app/lib/cebu-municipalities'
import { travelerReviews } from '@/app/data/mockData'
import type { Activity, Location, TravelerReview } from '@/app/types'

interface FirestorePackageRow {
  id: string
  packageName: string
  packageDescription: string
  pricePerPerson: number
  minimumNumberOfPeople: number
  maximumNumberOfPeople?: number
  packageLocation: string
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

export default function MunicipalityView() {
  const params = useParams()
  const municipalityId = params.municipalityId as string
  const otherRef = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [packages, setPackages] = useState<FirestorePackageRow[]>([])
  const [otherLocations, setOtherLocations] = useState<Location[]>([])

  const municipalityName = useMemo(() => {
    const official = municipalityFromSlug(municipalityId)
    return official ?? displayNameFromSlug(municipalityId)
  }, [municipalityId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [actSnap, pkgSnap] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'activities'), firestoreWhere('status', '==', 'active'))),
          getDocs(query(collection(firebaseDb, 'tourPackages'), firestoreWhere('status', '==', 'active'))),
        ])
        if (cancelled) return

        const activityByMuni = countByActivityLocation(actSnap)
        const packageByMuni = countByPackageLocation(pkgSnap)
        const merged = mergeGuestLocations(activityByMuni, packageByMuni)
        setOtherLocations(merged.filter((l) => l.id !== municipalityId))

        const actList: Activity[] = []
        actSnap.docs.forEach((d, idx) => {
          const data = d.data()
          if (!matchesMunicipalityRoute(String(data.activityLocation ?? ''), municipalityId)) return
          actList.push({
            id: idx,
            firestoreId: d.id,
            category: data.activityTag ?? '',
            title: data.activityName ?? '',
            location: data.activityLocation ?? '',
            rating: data.activityRating ?? 0,
            reviewCount: 0,
            price: data.pricePerGuest ?? 0,
            maxGuests: data.maximumNumberOfPeople ?? data.maxSlots ?? 30,
            image: data.activityImages?.[0] ?? '',
            municipalityId: data.activityLocation ?? '',
          })
        })
        actList.sort((a, b) => a.title.localeCompare(b.title))

        const pkgList: FirestorePackageRow[] = []
        pkgSnap.docs.forEach((d) => {
          const data = d.data()
          if (!matchesMunicipalityRoute(String(data.packageLocation ?? ''), municipalityId)) return
          pkgList.push({
            id: d.id,
            packageName: data.packageName ?? '',
            packageDescription: data.packageDescription ?? '',
            pricePerPerson: data.pricePerPerson ?? 0,
            minimumNumberOfPeople: data.minimumNumberOfPeople ?? 1,
            maximumNumberOfPeople: data.maximumNumberOfPeople,
            packageLocation: data.packageLocation ?? '',
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

  const filteredActivities = useMemo(
    () =>
      activities.filter((a) => !activeFilter || a.category === activeFilter),
    [activities, activeFilter],
  )
  const filteredPackages = useMemo(
    () =>
      packages.filter((p) => !activeFilter || p.packageTag === activeFilter),
    [packages, activeFilter],
  )

  const heroImage = `https://picsum.photos/seed/${encodeURIComponent(municipalityId)}-map/1400/480`
  const hasAny =
    filteredActivities.length > 0 || filteredPackages.length > 0
  const hasAnyUnfiltered = activities.length > 0 || packages.length > 0

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <section className="relative overflow-hidden">
        <div className="relative w-full" style={{ height: 'clamp(300px, 55vw, 780px)' }}>
          <Image
            src={heroImage}
            alt={municipalityName}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 px-8 md:px-16 pt-5">
          <nav className="text-white/80 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/locations" className="hover:text-white transition-colors">Cebu Locations</Link>
            <span className="mx-2">›</span>
            <span className="text-white font-medium">{municipalityName}</span>
          </nav>
        </div>
      </section>

      <div className="relative z-10 -mt-8 px-4 sm:px-6 md:px-16 mb-4">
        <SearchBar defaultWhere={municipalityName} className="max-w-4xl mx-auto" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-4">
        <CategoryFilterCollapsible
          expanded={filterPanelOpen}
          onToggle={() => setFilterPanelOpen((o) => !o)}
          activeSummary={activeFilter}
        >
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              activeFilter === null
                ? 'bg-green-500 text-white border-green-500'
                : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
            }`}
          >
            All
          </button>
          {ACTIVITY_TAGS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === cat
                  ? 'bg-green-500 text-white border border-green-500'
                  : 'border border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </CategoryFilterCollapsible>
      </div>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Tourist Destinations in {municipalityName}
          </h2>
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
          ) : !hasAny ? (
            <div className="text-sm text-gray-500 py-12 text-center">
              Nothing matches this category. Open category filters and choose &quot;All&quot;, or pick another tag.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 items-stretch">
              {filteredActivities.map((act) => (
                <ActivityCard key={act.firestoreId ?? act.id} activity={act} />
              ))}
              {filteredPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  image={pkg.packageImages[0] ?? ''}
                  title={pkg.packageName}
                  price={pkg.pricePerPerson}
                  pricePrefix="Starting from"
                  tag={pkg.packageTag}
                  duration={pkg.duration}
                  rating={pkg.packageRating}
                  minGuests={pkg.minimumNumberOfPeople ?? 1}
                  cardKind="tourPackage"
                  href={`/tour-packages/${pkg.slug}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
          <h2 className="text-2xl font-bold text-green-600 mb-8 text-center">Traveler&apos;s Experience in {municipalityName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {travelerReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Other Locations in Cebu</h2>
            <Link href="/locations" className="text-sm text-green-600 font-medium hover:underline">See more</Link>
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
      </main>

      <Footer />
    </div>
  )
}
