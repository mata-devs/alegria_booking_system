'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import SearchBar from '@/app/components/SearchBar'
import ActivityCard from '@/app/components/ActivityCard'
import PackageCard from '@/app/components/ui/PackageCard'
import { useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'
import { ACTIVITY_TAGS } from '@/app/lib/activity-tags'
import type { Activity } from '@/app/types'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/app/components/ui/drawer'

export default function ActivitiesPage() {
  return (
    <Suspense>
      <ActivitiesContent />
    </Suspense>
  )
}

function ActivitiesContent() {
  const searchParams = useSearchParams()
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [searchLocation, setSearchLocation] = useState(() => searchParams.get('location') ?? '')
  const [searchDate, setSearchDate] = useState(() => searchParams.get('date') ?? '')
  const [searchTravelers, setSearchTravelers] = useState(() => searchParams.get('travelers') ?? '')
  const [visibleCount, setVisibleCount] = useState(8)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false)
  const [popularPackages, setPopularPackages] = useState<{
    id: string; packageName: string; packageDescription: string;
    pricePerPerson: number; packageLocation: string; duration: string;
    packageTag: string; packageImages: string[]; packageRating: number; slug: string;
  }[]>([])

  useEffect(() => {
    async function fetchActivities() {
      try {
        const q = query(
          collection(firebaseDb, 'activities'),
          where('status', '==', 'active'),
        )
        const snap = await getDocs(q)
        const mapped: Activity[] = snap.docs.map((d, idx) => {
          const data = d.data()
          return {
            id: idx,
            firestoreId: d.id,
            category: data.activityTag ?? '',
            title: data.activityName ?? '',
            location: data.activityLocation ?? '',
            rating: data.activityRating ?? 0,
            reviewCount: 0,
            price: data.pricePerGuest ?? 0,
            image: data.activityImages?.[0] ?? '',
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

    async function fetchPopularPackages() {
      try {
        const snap = await getDocs(query(collection(firebaseDb, 'tourPackages'), where('status', '==', 'active')))
        setPopularPackages(snap.docs.slice(0, 2).map((d) => ({ id: d.id, ...d.data() } as typeof popularPackages[0])))
      } catch { /* ignore */ }
    }
    fetchPopularPackages()
  }, [])

  const filtered = activities.filter((a) => {
    const matchesTag = !activeFilter || a.category === activeFilter
    const matchesLocation = !searchLocation || a.location.toLowerCase().includes(searchLocation.toLowerCase())
    return matchesTag && matchesLocation
  })

  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <section className="relative overflow-hidden">
        <div className="w-full" style={{ height: 'clamp(240px, 45vw, 420px)', position: 'relative' }}>
          <Image
            src="https://picsum.photos/seed/cebu-activities/1400/500"
            alt="Activities in Cebu"
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        <div className="absolute top-0 left-0 px-8 md:px-16 pt-5">
          <nav className="text-white/80 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/locations" className="hover:text-white transition-colors">Cebu Locations</Link>
            <span className="mx-2">›</span>
            <span className="text-white font-medium">Activities</span>
          </nav>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white font-extrabold text-3xl sm:text-5xl md:text-6xl drop-shadow-lg tracking-wide mb-3">
            Activities
          </h1>
          <p className="text-white/80 text-sm sm:text-lg max-w-xl">
            Explore the best adventures Cebu has to offer
          </p>
        </div>
      </section>

      {/* Desktop search bar */}
      <div className="relative z-10 -mt-8 px-4 sm:px-6 md:px-16 mb-4 hidden sm:block">
        <SearchBar
          className="max-w-4xl mx-auto"
          onSearch={({ where, when, travelers }) => { setSearchLocation(where); setSearchDate(when); setSearchTravelers(travelers); setVisibleCount(8) }}
        />
      </div>

      {/* Mobile search drawer */}
      <Drawer open={searchDrawerOpen} onOpenChange={setSearchDrawerOpen}>
        <DrawerContent className="pb-8">
          <DrawerHeader>
            <DrawerTitle>Search Activities</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <SearchBar
              onSearch={({ where, when, travelers }) => {
                setSearchLocation(where)
                setSearchDate(when)
                setSearchTravelers(travelers)
                setVisibleCount(8)
                setSearchDrawerOpen(false)
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          {ACTIVITY_TAGS.map((cat) => (
            <button
              key={cat}
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
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading activities…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No activities available.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-8">
            {visible.map((act) => (
              <ActivityCard key={act.id} activity={act} date={searchDate} travelers={searchTravelers} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-16">
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + 8)}
              className="border border-gray-300 text-gray-700 px-10 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Show more
            </button>
          )}
          {visibleCount > 8 && (
            <button
              onClick={() => setVisibleCount(8)}
              className="border border-gray-300 text-gray-700 px-10 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Show less
            </button>
          )}
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Popular Tour Packages</h2>
            <Link href="/tour-packages" className="text-sm text-green-600 font-medium hover:underline">See more</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                image={pkg.packageImages[0]}
                title={pkg.packageName}
                description={pkg.packageDescription}
                price={pkg.pricePerPerson}
                pricePrefix="Starting from"
                tag={pkg.packageTag}
                duration={pkg.duration}
                rating={pkg.packageRating}
                href={`/tour-packages/${pkg.slug}`}
                wide
              />
            ))}
          </div>
        </section>
      </main>

      {/* Mobile floating search button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden">
        <button
          onClick={() => setSearchDrawerOpen(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-lg text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          Search
        </button>
      </div>

      <Footer />
    </div>
  )
}
