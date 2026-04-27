'use client'

import { useRef, Children, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Footer from '@/app/components/Footer'
import SearchBar from '@/app/components/SearchBar'
import LocationCard from '@/app/components/LocationCard'
import ActivityCard from '@/app/components/ActivityCard'
import PackageCard from '@/app/components/ui/PackageCard'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/app/components/ui/drawer'
import { collection, query, where as firestoreWhere, getDocs } from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'
import type { Location, Activity } from '@/app/types'

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
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <Link href={linkTo} className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
        See more
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
  const [cols, setCols] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640) ? 1.5 : visibleCount)

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
      className="hidden sm:flex shrink-0 bg-white shadow-md border border-gray-100 rounded-full w-9 h-9 items-center justify-center hover:bg-gray-50 hover:shadow-lg active:scale-95 transition-all duration-200"
    >
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )

  return (
    <div className="flex items-center gap-3">
      <ArrowBtn dir="left" />
      <div className="flex-1 min-w-0">
        <div
          ref={(el) => { scrollRef.current = el }}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
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

const heroSlides = [
  { src: 'https://picsum.photos/seed/cebu-hero-tropical/1400/900', alt: 'Cebu tropical landscape' },
  { src: 'https://picsum.photos/seed/cebu-beach-hero/1400/900', alt: 'Cebu beach' },
  { src: 'https://picsum.photos/seed/cebu-waterfall/1400/900', alt: 'Cebu waterfall' },
  { src: 'https://picsum.photos/seed/cebu-diving/1400/900', alt: 'Cebu diving' },
  { src: 'https://picsum.photos/seed/cebu-mountain/1400/900', alt: 'Cebu mountain' },
]

export default function LandingPage() {
  const router = useRouter()
  const locationsRef = useRef<HTMLDivElement>(null)
  const activitiesRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [packages, setPackages] = useState<FSPackage[]>([])

  const nextSlide = useCallback(() => {
    setCurrentSlide((s) => (s + 1) % heroSlides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000)
    return () => clearInterval(timer)
  }, [nextSlide])

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

        const locationMap: Record<string, number> = {}
        actSnap.docs.forEach((d) => {
          const loc = d.data().activityLocation as string
          if (loc) locationMap[loc] = (locationMap[loc] ?? 0) + 1
        })
        const derivedLocations: Location[] = Object.entries(locationMap).map(([name, count]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          name,
          activityCount: count,
          image: `https://picsum.photos/seed/${encodeURIComponent(name)}/400/300`,
        }))
        setLocations(derivedLocations)

        setPackages(
          pkgSnap.docs.slice(0, 2).map((d) => ({ id: d.id, ...d.data() } as FSPackage))
        )
      } catch (err) {
        console.error('Failed to fetch home data:', err)
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <section className="relative h-[85vh] min-h-[560px] overflow-hidden">
        {heroSlides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover scale-105 transition-opacity duration-1000"
            style={{ opacity: i === currentSlide ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5 sm:px-8 pb-10 sm:pb-16">
          <p className="text-green-300 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3 sm:mb-4 drop-shadow">
            Philippines · Cebu Island
          </p>
          <h1 className="text-white font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight max-w-3xl drop-shadow-2xl">
            Your Gateway to<br />Tropical Adventure
          </h1>
          <p className="text-white/85 mt-4 sm:mt-5 text-sm sm:text-base md:text-lg max-w-md sm:max-w-2xl leading-relaxed">
            Discover the magic of the Philippines&apos; most diverse island province,{' '}
            <span className="hidden sm:inline"><br /></span>
            from deep sea wonders to mountain peaks.
          </p>
          {/* Desktop search in hero */}
          <div className="mt-6 sm:mt-10 w-full max-w-xs sm:max-w-5xl hidden sm:block">
            <SearchBar />
          </div>
          {/* Mobile: prompt to open drawer */}
          <button
            onClick={() => setSearchDrawerOpen(true)}
            className="mt-6 sm:hidden flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Where in Cebu?
          </button>
        </div>
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Mobile search drawer */}
      <Drawer open={searchDrawerOpen} onOpenChange={setSearchDrawerOpen}>
        <DrawerContent className="pb-8">
          <DrawerHeader>
            <DrawerTitle>Explore Cebu</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <SearchBar
              onSearch={({ where, when, travelers }) => {
                setSearchDrawerOpen(false)
                router.push(
                  `/activities?location=${encodeURIComponent(where)}&date=${encodeURIComponent(when)}&travelers=${encodeURIComponent(travelers)}`
                )
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8 sm:py-12">
          <SectionHeader title="Locations" linkTo="/locations" />
          {locations.length > 0 ? (
            <CarouselSection scrollRef={locationsRef} visibleCount={5}>
              {locations.map((loc) => (
                <LocationCard key={loc.id} location={loc} />
              ))}
            </CarouselSection>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400">Loading locations…</div>
          )}
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-4 pb-8 sm:pb-12">
          <SectionHeader title="Popular Activities" linkTo="/activities" />
          {activities.length > 0 ? (
            <CarouselSection scrollRef={activitiesRef} visibleCount={4}>
              {activities.map((act) => (
                <ActivityCard key={act.id} activity={act} />
              ))}
            </CarouselSection>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading activities…</div>
          )}
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-8 sm:pb-12">
          <SectionHeader title="Popular Tour Packages" linkTo="/tour-packages" />
          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                  href={`/tour-packages/${pkg.slug}`}
                  wide
                />
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading packages…</div>
          )}
        </section>

        <section className="bg-[#14532d] py-12 sm:py-16 mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-white font-bold text-2xl sm:text-3xl mb-3">Cebu Adventures with Peace of Mind</h2>
            <p className="text-green-200 text-sm sm:text-base max-w-xl mx-auto mb-8 sm:mb-12">
              We combine local expertise with world class services to ensure your Cebu adventure is seamless and sustainable.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: '💰', title: 'Best Price Guarantee', desc: 'Get the best rates with no hidden fees. We match any lower price you find.' },
                { icon: '🏅', title: 'Certified Tour Guides', desc: 'All our guides are licensed, trained, and deeply knowledgeable about Cebu.' },
                { icon: '🛡️', title: '24/7 Support', desc: 'Our team is available around the clock to assist you before, during, and after your trip.' },
              ].map((feat) => (
                <div key={feat.title} className="bg-green-800/50 rounded-2xl p-6 sm:p-8 text-center">
                  <div className="text-4xl mb-4">{feat.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{feat.title}</h3>
                  <p className="text-green-200 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
