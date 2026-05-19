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
import { getHomepageCmsClient } from '@/app/lib/homepage-cms'
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

interface MarqueeOperator {
  uid: string
  companyName: string
  profileImage: string | null
  activityTag: string
}

export default function HomeCarousels() {
  const [locations, setLocations] = useState<Location[]>([])
  const [locationsReady, setLocationsReady] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [packages, setPackages] = useState<FSPackage[]>([])
  const [marqueeOperators, setMarqueeOperators] = useState<MarqueeOperator[]>([])
  const pkgScrollRef = useRef<HTMLDivElement>(null)

  const scrollPkgs = (dir: 'left' | 'right') => {
    if (!pkgScrollRef.current) return
    pkgScrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  useEffect(() => {
    async function fetchAll() {
      try {
        const [actSnap, pkgSnap, opSnap, cms] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'activities'), firestoreWhere('status', '==', 'active'), limit(15))),
          getDocs(query(collection(firebaseDb, 'tourPackages'), firestoreWhere('status', '==', 'active'), limit(8))),
          getDocs(query(collection(firebaseDb, 'users'), firestoreWhere('role', '==', 'operator'), firestoreWhere('status', '==', 'active'), limit(20))),
          getHomepageCmsClient(),
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

        const operatorTagMap = new Map<string, string>()
        for (const d of actSnap.docs) {
          const opId = d.data().operatorId as string | undefined
          const tag = d.data().activityTag as string | undefined
          if (opId && tag && !operatorTagMap.has(opId)) operatorTagMap.set(opId, tag)
        }
        setMarqueeOperators(opSnap.docs.map((d) => {
          const data = d.data()
          return {
            uid: d.id,
            companyName: data.companyName || `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || 'Tour Operator',
            profileImage: typeof data.profileImage === 'string' && data.profileImage.startsWith('http') ? data.profileImage : null,
            activityTag: operatorTagMap.get(d.id) ?? 'Tour Operator',
          }
        }))

        const activityByMuni = countByActivityLocation(actSnap)
        const packageByMuni = countByPackageLocation(pkgSnap)

        const publishedCmsItems = cms.locations.items
          .filter((i) => i.published)
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
      m.set(loc.name.toLowerCase(), loc.activityCount + (loc.packageCount ?? 0))
    }
    return m
  }, [locations])

  const activitySubtitles = useMemo(() => {
    return activities.map((act) => {
      const count = locationCountMap.get(act.location.toLowerCase()) ?? 0
      return count > 0 ? `${count} Tours and Activities` : act.category || act.location
    })
  }, [activities, locationCountMap])

  return (
    <main className="flex-1">
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">Cebu Adventures with Peace of Mind</h2>
          <p className="mx-auto mb-8 max-w-xl text-sm text-gray-500 sm:mb-12 sm:text-base">
            We combine local expertise with world class services to ensure your Cebu adventure is seamless and sustainable.
          </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              {
                icon: (
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
                    <circle cx="24" cy="24" r="24" fill="#dcfce7" />
                    <circle cx="24" cy="24" r="11" fill="#16a34a" />
                    {/* Peso sign ₱ */}
                    <text x="24" y="28.5" textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif" fill="white">₱</text>
                  </svg>
                ),
                title: 'Best Price Guarantee',
                desc: 'Get the best rates with no hidden fees. We match any lower price you find.',
              },
              {
                icon: (
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
                    <circle cx="24" cy="24" r="24" fill="#dcfce7" />
                    <circle cx="24" cy="20" r="7" fill="#16a34a" />
                    <path d="M20.5 20l2 2 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.5 27.5l-2.5 7h20l-2.5-7" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M21 28l3 3 3-3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: 'Certified Tour Guides',
                desc: 'All our guides are licensed, trained, and deeply knowledgeable about Cebu.',
              },
              {
                icon: (
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
                    <circle cx="24" cy="24" r="24" fill="#dcfce7" />
                    <path d="M15 26v-3a9 9 0 0118 0v3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="12" y="26" width="5" height="7" rx="2.5" fill="#16a34a"/>
                    <rect x="31" y="26" width="5" height="7" rx="2.5" fill="#16a34a"/>
                    <path d="M36 31.5c0 3.5-2.5 5.5-6 5.5h-2" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="28" cy="37" r="1.5" fill="#16a34a"/>
                  </svg>
                ),
                title: '24/7 Support',
                desc: 'Our team is available around the clock to assist you before, during, and after your trip.',
              },
            ].map((feat) => (
              <div key={feat.title} className="rounded-2xl border border-green-100 bg-white p-6 text-center shadow-sm sm:p-8">
                <div className="mb-4 flex justify-center">{feat.icon}</div>
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
            {(() => {
              const locationCount: Record<string, number> = {}
              for (const a of activities) {
                const loc = a.location || 'Cebu'
                locationCount[loc] = (locationCount[loc] ?? 0) + 1
              }
              return (
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {activities.slice(0, 9).map((act) => {
                    const count = locationCount[act.location || 'Cebu'] ?? 1
                    return (
                      <Link
                        key={act.firestoreId}
                        href={`/activities/${act.firestoreId}`}
                        className="flex items-center gap-5 rounded-2xl p-4 transition-colors hover:bg-gray-50 group"
                      >
                        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl">
                          <Image
                            src={act.image || `https://picsum.photos/seed/${act.firestoreId}/200/200`}
                            alt={act.title}
                            fill
                            sizes="128px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-xl leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">{act.title}</p>
                          <p className="mt-1.5 text-base text-gray-500">{count} {count === 1 ? 'Tour and Activity' : 'Tours and Activities'}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )
            })()}
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
            <div className="relative">
              <button
                type="button"
                onClick={() => scrollPkgs('left')}
                className="absolute -left-8 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-green-400 hover:text-green-600"
                aria-label="Scroll left"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollPkgs('right')}
                className="absolute -right-5 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition hover:border-green-400 hover:text-green-600"
                aria-label="Scroll right"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div ref={pkgScrollRef} className="flex gap-4 overflow-x-auto pb-2">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="w-64 shrink-0 sm:w-72">
                    <PackageCard
                      image={pkg.packageImages?.[0] ?? ''}
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
                  </div>
                ))}
              </div>
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

      <OperatorsMarquee operators={marqueeOperators} />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-12 sm:pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Offers for you</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Banner 1 */}
          <div className="relative h-44 overflow-hidden rounded-2xl sm:h-52">
            <div className="absolute inset-0 bg-green-700" />
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
            <div className="absolute inset-0 bg-teal-700" />
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
            <div className="absolute inset-0 bg-green-600" />
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

function OperatorsMarquee({ operators }: { operators: MarqueeOperator[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const pausedRef = useRef(false)
  const visibleRef = useRef(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting },
      { threshold: 0.1 },
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [operators.length])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let pos = 0
    let frame: number
    const tick = () => {
      if (!pausedRef.current && visibleRef.current) {
        pos += 0.5
        const half = el.scrollWidth / 2
        if (pos >= half) pos = 0
        el.style.transform = `translateX(-${pos}px)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [operators.length])

  if (operators.length === 0) return null

  const doubled = [...operators, ...operators]

  return (
    <section ref={sectionRef} className="py-8 pb-12 sm:pb-16 overflow-hidden">
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
            <Link
              href={`/operators/${op.uid}`}
              key={`${op.uid}-${i}`}
              className="flex shrink-0 items-center gap-3 w-[200px] sm:w-[220px] group"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-green-100">
                {op.profileImage ? (
                  <Image
                    src={op.profileImage}
                    alt={op.companyName}
                    fill
                    sizes="56px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-green-700 font-bold text-lg">
                    {op.companyName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-gray-900 text-sm group-hover:text-green-600 transition-colors">{op.companyName}</p>
                <p className="mt-0.5 text-xs text-gray-400">{op.activityTag}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

