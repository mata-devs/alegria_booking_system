'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Footer from '@/app/components/Footer'
import { locations, travelerReviews } from '@/app/data/mockData'
import type { TravelerReview } from '@/app/types'

const INITIAL_COUNT = 10

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
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

export default function LocationsPage() {
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const router = useRouter()

  const filtered = locations.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )
  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <section className="relative overflow-hidden">
        <div className="relative w-full" style={{ height: 'clamp(240px, 45vw, 420px)' }}>
          <Image
            src="https://picsum.photos/seed/cebu-locations-hero/1400/500"
            alt="Explore Cebu"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        <div className="absolute top-0 left-0 px-8 md:px-16 pt-5">
          <nav className="text-white/80 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white font-medium">Cebu Locations</span>
          </nav>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white font-extrabold text-3xl sm:text-5xl md:text-6xl drop-shadow-lg tracking-wide mb-3">
            Explore Cebu
          </h1>
          <p className="text-white/80 text-sm sm:text-lg max-w-xl">
            Discover stunning destinations across the island of Cebu
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 pb-16">
        <div className="flex items-center bg-white rounded-full shadow-md border border-gray-100 px-6 py-4 mb-10 max-w-2xl mx-auto mt-10">
          <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            id="location-search"
            name="locationSearch"
            autoComplete="off"
            aria-label="Search locations in Cebu"
            placeholder="Search locations in Cebu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm text-gray-700 placeholder-gray-400 flex-1 bg-transparent"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mb-8">
          {visible.map((loc) => (
            <div
              key={loc.id}
              className="relative rounded-2xl overflow-hidden cursor-pointer group h-48"
              onClick={() => router.push(`/locations/${loc.id}`)}
            >
              <Image src={loc.image} alt={loc.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-bold text-sm">{loc.name}</h3>
                <p className="text-white/80 text-xs">{loc.activityCount} Activities</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mb-16">
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + 10)}
              className="border border-gray-300 text-gray-700 px-10 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Show more
            </button>
          )}
          {visibleCount > INITIAL_COUNT && (
            <button
              onClick={() => setVisibleCount(INITIAL_COUNT)}
              className="border border-gray-300 text-gray-700 px-10 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Show less
            </button>
          )}
        </div>

        <section>
          <h2 className="text-2xl font-bold text-green-600 mb-8 text-center">Traveler&apos;s experience in Cebu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {travelerReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
