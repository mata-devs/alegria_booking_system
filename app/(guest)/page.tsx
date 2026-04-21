'use client'

import { useRef, Children, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import SearchBar from '@/app/components/SearchBar'
import LocationCard from '@/app/components/LocationCard'
import ActivityCard from '@/app/components/ActivityCard'
import TourPackageCard from '@/app/components/TourPackageCard'
import { locations, activities, tourPackages } from '@/app/data/mockData'

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
      <div className="flex-1 overflow-hidden">
        <div
          ref={(el) => { scrollRef.current = el }}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollBehavior: 'smooth' }}
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
  const locationsRef = useRef<HTMLDivElement>(null)
  const activitiesRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((s) => (s + 1) % heroSlides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000)
    return () => clearInterval(timer)
  }, [nextSlide])

  const popularActivities = activities.slice(0, 8)
  const featuredPackages = tourPackages.slice(0, 2)

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
          <div className="mt-6 sm:mt-10 w-full max-w-xs sm:max-w-5xl">
            <SearchBar />
          </div>
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

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8 sm:py-12">
          <SectionHeader title="Locations" linkTo="/locations" />
          <CarouselSection scrollRef={locationsRef} visibleCount={5}>
            {locations.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </CarouselSection>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-4 pb-8 sm:pb-12">
          <SectionHeader title="Popular Activities" linkTo="/activities" />
          <CarouselSection scrollRef={activitiesRef} visibleCount={4}>
            {popularActivities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </CarouselSection>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-8 sm:pb-12">
          <SectionHeader title="Popular Tour Packages" linkTo="/tour-packages" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {featuredPackages.map((pkg) => (
              <TourPackageCard key={pkg.id} pkg={pkg} wide />
            ))}
          </div>
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
