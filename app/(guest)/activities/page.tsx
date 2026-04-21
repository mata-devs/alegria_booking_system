'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import SearchBar from '@/app/components/SearchBar'
import ActivityCard from '@/app/components/ActivityCard'
import TourPackageCard from '@/app/components/TourPackageCard'
import { activities, activityCategories, tourPackages } from '@/app/data/mockData'

export default function ActivitiesPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(8)

  const filtered = activeFilter
    ? activities.filter((a) => a.category === activeFilter)
    : activities

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

      <div className="relative z-10 -mt-8 px-4 sm:px-6 md:px-16 mb-4">
        <SearchBar className="max-w-4xl mx-auto" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          {activityCategories.map((cat) => (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mb-8">
          {visible.map((act) => (
            <ActivityCard key={act.id} activity={act} />
          ))}
        </div>

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
            {tourPackages.slice(0, 2).map((pkg) => (
              <TourPackageCard key={pkg.id} pkg={pkg} wide />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
