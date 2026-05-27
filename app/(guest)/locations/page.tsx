'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, where as firestoreWhere } from 'firebase/firestore'
import Footer from '@/app/components/Footer'
import { LocationOfferCounts } from '@/app/components/LocationOfferCounts'
import { GuestReviewCard } from '@/app/components/GuestReviewCard'
import { firebaseDb } from '@/app/lib/firebase'
import {
  countByActivityLocation,
  countByPackageLocation,
  allCebuMunicipalitiesAsLocations,
} from '@/app/lib/guest-location-list'
import { getHomepageCmsClient } from '@/app/lib/homepage-cms'
import { getAllApprovedReviewsForCatalog, type CatalogReview } from '@/app/lib/reviews-service'
import type { Location } from '@/app/types'

const INITIAL_COUNT = 10

export default function LocationsPage() {
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [locations, setLocations] = useState<Location[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [reviews, setReviews] = useState<CatalogReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        const [actSnap, pkgSnap, cms] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'activities'), firestoreWhere('status', '==', 'active'))),
          getDocs(query(collection(firebaseDb, 'tourPackages'), firestoreWhere('status', '==', 'active'))),
          getHomepageCmsClient(),
        ])
        const activityByMuni = countByActivityLocation(actSnap)
        const packageByMuni = countByPackageLocation(pkgSnap)

        const publishedCmsItems = cms.locations.items
          .filter((item) => item.published)
          .sort((a, b) => a.order - b.order)

        if (publishedCmsItems.length > 0) {
          setLocations(
            publishedCmsItems.map((item) => ({
              id: item.municipalitySlug,
              name: item.displayName,
              image: item.imageUrl,
              activityCount: activityByMuni.get(item.displayName) ?? 0,
              packageCount: packageByMuni.get(item.displayName) ?? 0,
            })),
          )
        } else {
          setLocations(allCebuMunicipalitiesAsLocations(activityByMuni, packageByMuni))
        }
      } catch (e) {
        console.error('Failed to load locations list:', e)
        setLocations([])
      } finally {
        setListLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadReviews() {
      setReviewsLoading(true)
      try {
        const list = await getAllApprovedReviewsForCatalog()
        if (!cancelled) setReviews(list)
      } catch (e) {
        console.error('Failed to load reviews:', e)
        if (!cancelled) setReviews([])
      } finally {
        if (!cancelled) setReviewsLoading(false)
      }
    }
    loadReviews()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = locations.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )
  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">

      {/* ── Hero band ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
          <nav className="flex items-center gap-2 text-[11px] font-mono tracking-[.14em] uppercase text-gray-400 mb-3">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#008768]">{listLoading ? '—' : locations.length} Locations</span>
          </nav>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em] m-0 text-gray-900">
                Explore{' '}
                <em className="not-italic font-normal text-[#008768]">Cebu</em>.
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-[540px]">
                Discover stunning destinations across the island of Cebu.
              </p>
            </div>
            <div className="hidden lg:flex gap-6 shrink-0">
              <div className="text-right">
                <div className="text-2xl font-extrabold tracking-[-0.02em] leading-none text-gray-900">{listLoading ? '—' : locations.length}</div>
                <div className="mt-1 text-[10px] font-mono tracking-[.12em] uppercase text-gray-400">locations</div>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0 w-full">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Search</span>
                <input
                  type="text"
                  id="location-search"
                  name="locationSearch"
                  autoComplete="off"
                  aria-label="Search locations in Cebu"
                  placeholder="Search locations in Cebu..."
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
              aria-label="Search locations"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-700 placeholder-gray-400 flex-1 bg-transparent"
            />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 pb-16 pt-8">

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mb-8">
          {listLoading ? (
            <div className="col-span-full h-48 flex items-center justify-center text-sm text-gray-500">Loading locations…</div>
          ) : visible.length === 0 ? (
            <div className="col-span-full h-48 flex items-center justify-center text-sm text-gray-500 text-center px-4">
              No locations found.
            </div>
          ) : (
            visible.map((loc) => (
              <div
                key={loc.id}
                className="relative rounded-2xl overflow-hidden cursor-pointer group h-36"
                onClick={() => router.push(`/locations/${loc.id}`)}
              >
                <Image
                  src={loc.image}
                  alt={loc.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-bold text-sm">{loc.name}</h3>
                  <LocationOfferCounts
                    activityCount={loc.activityCount}
                    packageCount={loc.packageCount}
                    className="mt-0.5"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-center gap-3 mb-16">
          {visibleCount < filtered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 10)}
              className="border border-gray-300 text-gray-700 px-10 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Show more
            </button>
          )}
          {visibleCount > INITIAL_COUNT && (
            <button
              type="button"
              onClick={() => setVisibleCount(INITIAL_COUNT)}
              className="border border-gray-300 text-gray-700 px-10 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Show less
            </button>
          )}
        </div>

        <section>
          <h2 className="text-2xl font-bold text-green-600 mb-2 text-center">Traveler&apos;s experience in Cebu</h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-2xl mx-auto">
            Reviews from guests across activities and tour packages (published reviews only).
          </p>
          {reviewsLoading ? (
            <div className="text-sm text-gray-500 py-16 text-center">Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12 italic">No reviews yet – be one of the first to book and leave feedback!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r) => (
                <GuestReviewCard key={r.id} review={r} itemTitle={r.itemTitle} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

