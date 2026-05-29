'use client'

import { useState, useMemo } from 'react'
import Footer from '@/app/components/Footer'
import TourGuideCard from '@/app/components/TourGuideCard'
import { tourGuides } from '@/app/data/mockData'
import { TourGuidesHero } from './_components/TourGuidesHero'
import { TourGuidesFilterBar } from './_components/TourGuidesFilterBar'
import { TourGuidesToolbar, type SortOption } from './_components/TourGuidesToolbar'

const ALL_LOCATIONS = Array.from(new Set(tourGuides.map((g) => g.location))).sort()

const AVG_RATING = (tourGuides.reduce((s, g) => s + g.rating, 0) / tourGuides.length).toFixed(1)

export default function TourGuidesPage() {
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null)
  const [activeLocation, setActiveLocation] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('Recommended')
  const [visibleCount, setVisibleCount] = useState(8)

  const activeFiltersCount = (activeLanguage ? 1 : 0) + (activeLocation ? 1 : 0)

  const filtered = useMemo(() => {
    let list = tourGuides.filter((g) => {
      const matchesLanguage = !activeLanguage || g.languages.includes(activeLanguage)
      const matchesLocation = !activeLocation || g.location === activeLocation
      return matchesLanguage && matchesLocation
    })
    if (sortBy === 'Highest rated') list = [...list].sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'Most experienced') list = [...list].sort((a, b) => b.yearsOfExperience - a.yearsOfExperience)
    else if (sortBy === 'Price · low to high') list = [...list].sort((a, b) => a.pricePerDay - b.pricePerDay)
    else if (sortBy === 'Price · high to low') list = [...list].sort((a, b) => b.pricePerDay - a.pricePerDay)
    return list
  }, [activeLanguage, activeLocation, sortBy])

  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">
      <TourGuidesHero guideCount={tourGuides.length} avgRating={AVG_RATING} />

      <TourGuidesFilterBar
        locations={ALL_LOCATIONS}
        activeLocation={activeLocation}
        activeFiltersCount={activeFiltersCount}
        onLocationChange={setActiveLocation}
        onClearAll={() => { setActiveLanguage(null); setActiveLocation(null) }}
      />

      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 pb-20 lg:pb-16 flex-1">
        <TourGuidesToolbar
          filteredCount={filtered.length}
          activeFiltersCount={activeFiltersCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">No guides match your filters.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {visible.map((guide) => (
              <TourGuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-400">
              Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} guides
            </span>
            <div className="flex gap-3">
              {visibleCount < filtered.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 8)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Load more
                </button>
              )}
              {visibleCount > 8 && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(8)}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
