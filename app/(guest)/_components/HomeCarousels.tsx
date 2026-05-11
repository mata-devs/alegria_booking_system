'use client'

import { Children, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import LocationCard from '@/app/components/LocationCard'
import ActivityCard from '@/app/components/ActivityCard'
import PackageCard from '@/app/components/ui/PackageCard'
import {
  collection,
  getDocs,
  query,
  where as firestoreWhere,
} from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'
import {
  countByActivityLocation,
  countByPackageLocation,
  mergeGuestLocations,
} from '@/app/lib/guest-location-list'
import type { Activity, Location } from '@/app/types'

interface FSPackage {
  id: string
  packageName: string
  packageDescription: string
  pricePerPerson: number
  packageTag: string
  duration: string
  packageImages: string[]
  packageRating: number
  slug: string
}

interface SectionHeaderProps {
  title: string
  linkTo: string
}

function SectionHeader({ title, linkTo }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <Link
        href={linkTo}
        className="flex items-center gap-1 text-sm font-medium text-green-600 hover:underline"
      >
        See more
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  )
}

interface CarouselSectionProps {
  children: React.ReactNode
  scrollRef: { current: HTMLDivElement | null }
  visibleCount?: number
}

function CarouselSection({ children, scrollRef, visibleCount = 5 }: CarouselSectionProps) {
  const gap = 16
  const [cols, setCols] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 1.5 : visibleCount,
  )

  useEffect(() => {
    const update = () => setCols(window.innerWidth < 640 ? 1.5 : visibleCount)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [visibleCount])

  const scroll = (dir: number) => {
    if (!scrollRef.current) return
    const containerWidth = scrollRef.current.offsetWidth
    const cardWidth = (containerWidth - (cols - 1) * gap) / cols
    scrollRef.current.scrollBy({ left: dir * (cardWidth + gap), behavior: 'smooth' })
  }

  const childArray = Children.toArray(children)

  const ArrowBtn = ({ dir }: { dir: 'left' | 'right' }) => (
    <button
      onClick={() => scroll(dir === 'left' ? -1 : 1)}
      className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition-all duration-200 hover:bg-gray-50 hover:shadow-lg active:scale-95 sm:flex"
    >
      <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  )

  return (
    <div className="flex items-center gap-3">
      <ArrowBtn dir="left" />
      <div className="min-w-0 flex-1">
        <div
          ref={(el) => {
            scrollRef.current = el
          }}
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
        >
          {childArray.map((child, i) => (
            <div
              key={i}
              style={{ flex: `0 0 calc((100% - ${(cols - 1) * gap}px) / ${cols})` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      <ArrowBtn dir="right" />
    </div>
  )
}

export default function HomeCarousels() {
  const locationsRef = useRef<HTMLDivElement>(null)
  const activitiesRef = useRef<HTMLDivElement>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [locationsReady, setLocationsReady] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [packages, setPackages] = useState<FSPackage[]>([])

  useEffect(() => {
    async function fetchAll() {
      try {
        const [actSnap, pkgSnap] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'activities'), firestoreWhere('status', '==', 'active'))),
          getDocs(query(collection(firebaseDb, 'tourPackages'), firestoreWhere('status', '==', 'active'))),
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
        setActivities(mappedActivities.slice(0, 8))

        const activityByMuni = countByActivityLocation(actSnap)
        const packageByMuni = countByPackageLocation(pkgSnap)
        setLocations(mergeGuestLocations(activityByMuni, packageByMuni))

        setPackages(
          pkgSnap.docs.slice(0, 2).map((d) => ({ id: d.id, ...d.data() } as FSPackage)),
        )
      } catch (err) {
        console.error('Failed to fetch home data:', err)
      } finally {
        setLocationsReady(true)
      }
    }
    fetchAll()
  }, [])

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-6 py-8 sm:py-12 lg:px-8">
        <SectionHeader title="Locations" linkTo="/locations" />
        {!locationsReady ? (
          <div className="flex h-72 items-center justify-center text-sm text-gray-400">Loading locations…</div>
        ) : locations.length > 0 ? (
          <CarouselSection scrollRef={locationsRef} visibleCount={5}>
            {locations.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </CarouselSection>
        ) : (
          <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-gray-500">
            No locations to show yet. Add at least one active activity or tour package in a municipality.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4 pb-8 sm:pb-12 lg:px-8">
        <SectionHeader title="Popular Activities" linkTo="/activities" />
        {activities.length > 0 ? (
          <CarouselSection scrollRef={activitiesRef} visibleCount={4}>
            {activities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </CarouselSection>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading activities…</div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
        <SectionHeader title="Popular Tour Packages" linkTo="/tour-packages" />
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                image={pkg.packageImages?.[0] ?? ''}
                title={pkg.packageName}
                description={pkg.packageDescription}
                price={pkg.pricePerPerson}
                pricePrefix="Starting from"
                tag={pkg.packageTag}
                duration={pkg.duration}
                rating={pkg.packageRating}
                cardKind="tourPackage"
                href={`/tour-packages/${pkg.slug}`}
                wide
              />
            ))}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading packages…</div>
        )}
      </section>

      <section className="mt-4 bg-[#14532d] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Cebu Adventures with Peace of Mind</h2>
          <p className="mx-auto mb-8 max-w-xl text-sm text-green-200 sm:mb-12 sm:text-base">
            We combine local expertise with world class services to ensure your Cebu adventure is seamless and sustainable.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              { icon: '💰', title: 'Best Price Guarantee', desc: 'Get the best rates with no hidden fees. We match any lower price you find.' },
              { icon: '🏅', title: 'Certified Tour Guides', desc: 'All our guides are licensed, trained, and deeply knowledgeable about Cebu.' },
              { icon: '🛡️', title: '24/7 Support', desc: 'Our team is available around the clock to assist you before, during, and after your trip.' },
            ].map((feat) => (
              <div key={feat.title} className="rounded-2xl bg-green-800/50 p-6 text-center sm:p-8">
                <div className="mb-4 text-4xl">{feat.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-green-200">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
