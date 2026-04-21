'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import Footer from '@/app/components/Footer'
import ActivityCard from '@/app/components/ActivityCard'
import TourPackageCard from '@/app/components/TourPackageCard'
import LocationCard from '@/app/components/LocationCard'
import { locations, activities, tourPackages, travelerReviews } from '@/app/data/mockData'
import type { TravelerReview } from '@/app/types'
import SearchBar from '@/app/components/SearchBar'

const ACTIVITY_FILTERS = ['All', 'Diving', 'Culture', 'Canyoneering', 'Beach', 'Museums', 'History']

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

  const location = locations.find((l) => l.id === municipalityId) ?? locations[0]
  const municipalityActivities = activities.filter((a) => a.municipalityId === location.id)
  const allActivities = municipalityActivities.length > 0 ? municipalityActivities : activities.slice(0, 8)
  const relatedPackages = tourPackages.filter((p) => p.municipalityId === location.id)
  const featuredPackages = relatedPackages.length > 0 ? relatedPackages : tourPackages.slice(0, 2)
  const otherLocations = locations.filter((l) => l.id !== location.id)

  const heroImage = location.id === 'alegria'
    ? '/images/alegria.png'
    : `https://picsum.photos/seed/${location.id}-map/1400/480`

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <section className="relative overflow-hidden">
        <div className="relative w-full" style={{ height: 'clamp(300px, 55vw, 780px)' }}>
          <Image
            src={heroImage}
            alt={location.name}
            fill
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
            <span className="text-white font-medium">{location.name}</span>
          </nav>
        </div>
      </section>

      <div className="relative z-10 -mt-8 px-4 sm:px-6 md:px-16 mb-4">
        <SearchBar defaultWhere={location.name} className="max-w-4xl mx-auto" />
      </div>

      <div className="bg-transparent sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 flex-1 flex-nowrap">
            {ACTIVITY_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                  activeFilter === filter
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <Link
            href="/tour-packages"
            className="ml-auto shrink-0 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-1.5 rounded-full transition-colors"
          >
            Booking
          </Link>
        </div>
      </div>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Activities in {location.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {allActivities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <button className="border border-gray-300 text-gray-700 px-8 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
              Show more
            </button>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">
          <h2 className="text-2xl font-bold text-green-600 mb-8 text-center">Traveler&apos;s Experience in {location.name}</h2>
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
            <button onClick={() => otherRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full w-9 h-9 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div ref={otherRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {otherLocations.map((loc) => (
                <LocationCard key={loc.id} location={loc} />
              ))}
            </div>
            <button onClick={() => otherRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full w-9 h-9 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Popular Tour Packages with {location.name}</h2>
            <Link href="/tour-packages" className="text-sm text-green-600 font-medium hover:underline">See more</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredPackages.map((pkg) => (
              <TourPackageCard key={pkg.id} pkg={pkg} wide />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
