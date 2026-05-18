'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import LocationCard from '@/app/components/LocationCard'
import PackageCard from '@/app/components/ui/PackageCard'
import {
  collection,
  getDocs,
  limit,
  query,
  where as firestoreWhere,
} from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'
import {
  countByActivityLocation,
  countByPackageLocation,
  allCebuMunicipalitiesAsLocations,
} from '@/app/lib/guest-location-list'
import type { Activity, Location } from '@/app/types'

interface FSPackage {
  id: string
  packageName: string
  packageDescription: string
  pricePerPerson: number
  packageLocation: string
  packageTag: string
  duration: string
  packageImages: string[]
  packageRating: number
  slug: string
}



export default function HomeCarousels() {
  const [locations, setLocations] = useState<Location[]>([])
  const [locationsReady, setLocationsReady] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [packages, setPackages] = useState<FSPackage[]>([])

  useEffect(() => {
    async function fetchAll() {
      try {
        const [actSnap, pkgSnap] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'activities'), firestoreWhere('status', '==', 'active'), limit(30))),
          getDocs(query(collection(firebaseDb, 'tourPackages'), firestoreWhere('status', '==', 'active'), limit(8))),
        ])

        const mappedActivities: Activity[] = actSnap.docs.map((d, idx) => {
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
        setActivities(mappedActivities)

        const activityByMuni = countByActivityLocation(actSnap)
        const packageByMuni = countByPackageLocation(pkgSnap)
        setLocations(allCebuMunicipalitiesAsLocations(activityByMuni, packageByMuni))

        setPackages(
          pkgSnap.docs.slice(0, 8).map((d) => ({ id: d.id, ...d.data() } as FSPackage)),
        )
      } catch (err) {
        console.error('Failed to fetch home data:', err)
      } finally {
        setLocationsReady(true)
      }
    }
    fetchAll()
  }, [])

  const locationCountMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const loc of locations) {
      m.set(loc.name.toLowerCase(), loc.activityCount + loc.packageCount)
    }
    return m
  }, [locations])

  return (
    <main className="flex-1">
      <section className="bg-[#f0fdf4] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">Cebu Adventures with Peace of Mind</h2>
          <p className="mx-auto mb-8 max-w-xl text-sm text-gray-500 sm:mb-12 sm:text-base">
            We combine local expertise with world class services to ensure your Cebu adventure is seamless and sustainable.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              { icon: '💰', title: 'Best Price Guarantee', desc: 'Get the best rates with no hidden fees. We match any lower price you find.' },
              { icon: '🏅', title: 'Certified Tour Guides', desc: 'All our guides are licensed, trained, and deeply knowledgeable about Cebu.' },
              { icon: '🛡️', title: '24/7 Support', desc: 'Our team is available around the clock to assist you before, during, and after your trip.' },
            ].map((feat) => (
              <div key={feat.title} className="rounded-2xl border border-green-100 bg-white p-6 text-center shadow-sm sm:p-8">
                <div className="mb-4 text-4xl">{feat.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 sm:py-12 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Top Locations</h2>
        {!locationsReady ? (
          <div className="flex h-72 items-center justify-center text-sm text-gray-400">Loading locations…</div>
        ) : locations.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
              {locations.slice(0, 10).map((loc) => (
                <LocationCard key={loc.id} location={loc} className="!h-36" />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/locations"
                className="flex items-center gap-2 rounded-full border border-green-500 px-8 py-2.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-50"
              >
                See more
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-gray-500">
            No locations to show yet. Add at least one active activity or tour package in a municipality.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4 pb-8 sm:pb-12 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Top Activities</h2>
        {activities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((act) => (
                <Link
                  key={act.firestoreId}
                  href={`/activities/${act.firestoreId}`}
                  className="flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={act.image || `https://picsum.photos/seed/${act.firestoreId}/80/80`}
                      alt={act.title}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">{act.title}</p>
                    <p className="mt-0.5 text-sm text-gray-400">
                      {(() => {
                        const count = locationCountMap.get(act.location.toLowerCase()) ?? 0
                        return count > 0 ? `${count} Tours and Activities` : act.category || act.location
                      })()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/activities"
                className="flex items-center gap-2 rounded-full border border-green-500 px-8 py-2.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-50"
              >
                See more
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading activities…</div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Top Tour Packages</h2>
        {packages.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  image={pkg.packageImages?.[0] || `https://picsum.photos/seed/${pkg.id}/400/600`}
                  title={pkg.packageName}
                  price={pkg.pricePerPerson}
                  pricePrefix="From"
                  tag={pkg.packageTag}
                  duration={pkg.duration}
                  rating={pkg.packageRating}
                  location={pkg.packageLocation}
                  cardKind="tourPackage"
                  href={`/tour-packages/${pkg.slug}`}
                />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/tour-packages"
                className="flex items-center gap-2 rounded-full border border-green-500 px-8 py-2.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-50"
              >
                See more
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading packages…</div>
        )}
      </section>

      <OperatorsMarquee />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-12 sm:pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Offers for you</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Banner 1 */}
          <div className="relative h-44 overflow-hidden rounded-2xl sm:h-52">
            <Image
              src="https://picsum.photos/seed/cebu-canyoneer/600/300"
              alt="Canyoneering Adventure"
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/85 via-green-500/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <h3 className="text-2xl font-extrabold uppercase leading-tight text-white drop-shadow">
                Canyoneering<br />Adventure
              </h3>
              <div>
                <p className="mb-3 text-xs text-white/90">Trek Cebu&apos;s most thrilling waterfalls</p>
                <Link
                  href="/activities"
                  className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Book now
                </Link>
              </div>
            </div>
          </div>

          {/* Banner 2 */}
          <div className="relative h-44 overflow-hidden rounded-2xl sm:h-52">
            <Image
              src="https://picsum.photos/seed/cebu-whale/600/300"
              alt="Whale Shark Watching"
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-700/85 via-teal-500/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <h3 className="text-2xl font-extrabold uppercase leading-tight text-white drop-shadow">
                Whale Shark<br />Watching
              </h3>
              <div>
                <p className="mb-3 text-xs text-white/90">Swim alongside gentle giants in Oslob</p>
                <Link
                  href="/activities"
                  className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Book now
                </Link>
              </div>
            </div>
          </div>

          {/* Highlight card */}
          <div className="relative h-44 overflow-hidden rounded-2xl sm:h-52">
            <Image
              src="https://picsum.photos/seed/cebu-deals-offer/600/300"
              alt="Top travel deals"
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(22,163,74,0.55)_0%,rgba(22,163,74,0.85)_100%)]" />
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white border border-white/30">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  VisitCebu Exclusive
                </span>
                <h3 className="mt-3 text-lg font-bold text-white">Top travel deals</h3>
                <p className="mt-1 text-sm text-white/80">Activities, island tours & more</p>
              </div>
              <span className="self-start rounded-full border border-white/60 bg-white/15 backdrop-blur-sm px-3 py-1 text-sm font-medium text-white">
                At least 10% off
              </span>
            </div>
          </div>

        </div>
      </section>

    </main>
  )
}

const MOCK_OPERATORS = [
  { name: 'Alegria Eco Tours', type: 'Nature & Adventure' },
  { name: 'Cebu Island Hoppers', type: 'Island Tours' },
  { name: 'Moalboal Dive Center', type: 'Diving & Snorkeling' },
  { name: 'Oslob Whale Shark Tours', type: 'Wildlife Experience' },
  { name: 'Bantayan Sea Adventures', type: 'Beach & Water Sports' },
  { name: 'Malapascua Divers', type: 'Diving' },
  { name: 'Cebu Highland Trekkers', type: 'Hiking & Trekking' },
  { name: 'Mactan Water Sports', type: 'Water Sports' },
  { name: 'SouthCebu Zipline Co.', type: 'Adventure' },
  { name: 'Camotes Island Tours', type: 'Island Tours' },
]

function OperatorsMarquee() {
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let pos = 0
    let frame: number
    const tick = () => {
      if (!pausedRef.current) {
        pos += 0.5
        const half = el.scrollWidth / 2
        if (pos >= half) pos = 0
        el.style.transform = `translateX(-${pos}px)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const doubled = [...MOCK_OPERATORS, ...MOCK_OPERATORS]

  return (
    <section className="py-8 pb-12 sm:pb-16 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Our Tour Operator Partners</h2>
      </div>
      <div
        className="relative"
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
      >
        <div ref={trackRef} className="flex gap-6 w-max px-4">
          {doubled.map((op, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-3 w-[200px] sm:w-[220px] cursor-pointer"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={`https://picsum.photos/seed/${encodeURIComponent(op.name)}/80/80`}
                  alt={op.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-gray-900 text-sm">{op.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">{op.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
