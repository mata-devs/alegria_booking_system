'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/app/components/Footer'
import { tourGuides } from '@/app/data/mockData'
import type { TourGuide } from '@/app/types'
import { Lightbox } from '@/app/components/ui/BentoGallery'
import type { LightboxImage } from '@/app/components/ui/BentoGallery'

const ALL_LANGUAGES = Array.from(
  new Set(tourGuides.flatMap((g) => g.languages))
).sort()

const ALL_LOCATIONS = Array.from(
  new Set(tourGuides.map((g) => g.location))
).sort()


function CertificationBadges({ certifications }: { certifications: { name: string; logo: string }[] }) {
  const [first, second] = certifications
  const mobileOverflow = certifications.length - 1
  const desktopOverflow = certifications.length - 2
  return (
    <div className="flex flex-wrap gap-1.5">
      {/* First badge — always visible */}
      {first && (
        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold bg-[#d9efe6] text-[#003a2d]">
          {first.name}
        </span>
      )}
      {/* Second badge — desktop only */}
      {second && (
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#d9efe6] text-[#003a2d]">
          {second.name}
        </span>
      )}
      {/* Mobile overflow (+N after 1st) */}
      {mobileOverflow > 0 && (
        <span className="inline-flex sm:hidden items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#d9efe6] text-[#003a2d]">
          +{mobileOverflow}
        </span>
      )}
      {/* Desktop overflow (+N after 2nd) */}
      {desktopOverflow > 0 && (
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#d9efe6] text-[#003a2d]">
          +{desktopOverflow}
        </span>
      )}
    </div>
  )
}

function CertificationsModal({ guide, onClose }: { guide: TourGuide; onClose: () => void }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const certImages: LightboxImage[] = guide.certifications.map((c) => ({
    url: c.logo,
    title: c.name,
  }))

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>

          {/* Guide header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 bg-gray-100">
              <Image src={guide.photo} alt={guide.name} fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-tight">{guide.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{guide.location}</p>
            </div>
          </div>

          {/* Certifications */}
          <p className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400 mb-3">
            Certifications
          </p>
          <div className="flex flex-col gap-3">
            {guide.certifications.map((cert, i) => (
              <div
                key={cert.name}
                className="flex items-center gap-3 cursor-pointer rounded-xl p-1 -m-1 hover:bg-gray-50 transition-colors"
                onClick={() => setLightboxIdx(i)}
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  <Image src={cert.logo} alt={cert.name} fill className="object-cover" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{cert.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          images={certImages}
          idx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onChange={(i) => setLightboxIdx(i)}
        />
      )}
    </>
  )
}

function TourGuideCard({ guide }: { guide: TourGuide }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 hover:cursor-pointer flex flex-col">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={guide.photo}
            alt={guide.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute top-3 left-3">
            <CertificationBadges certifications={guide.certifications} />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <div>
            <h3 className="font-extrabold text-gray-900 text-[15px] leading-tight">{guide.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {guide.location}
            </p>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-900">
            <span className="text-amber-400 text-base leading-none" aria-hidden>★</span>
            <span className="font-semibold">{guide.rating.toFixed(1)}</span>
            <span className="text-gray-400 text-xs">({guide.reviewCount.toLocaleString()})</span>
          </div>

          <div className="sm:flex hidden items-center gap-3 text-[11px] text-gray-400 font-mono tracking-wide">
            <span>{guide.yearsOfExperience} yrs exp</span>
            <span className="w-px h-3 bg-gray-200" />
            <span className="truncate">
              {guide.languages.slice(0, 2).join(', ')}
              {guide.languages.length > 2 ? ` +${guide.languages.length - 2}` : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-auto block w-full text-center bg-gray-900 hover:bg-[#008768] text-white text-xs font-semibold py-2.5 rounded-full transition-colors duration-200"
          >
            Certifications
          </button>
        </div>
      </div>

      {modalOpen && <CertificationsModal guide={guide} onClose={() => setModalOpen(false)} />}
    </>
  )
}

type SortOption = 'Recommended' | 'Highest rated' | 'Most experienced' | 'Price · low to high' | 'Price · high to low'

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

  const avgRating = (
    tourGuides.reduce((s, g) => s + g.rating, 0) / tourGuides.length
  ).toFixed(1)

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4ef]">

      {/* Hero band */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
          <nav className="flex items-center gap-2 text-[11px] font-mono tracking-[.14em] uppercase text-gray-400 mb-3">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#008768]">Tour Guides</span>
          </nav>

          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div>
              <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em] text-gray-900 m-0">
                Tour Guides in{' '}
                <em className="not-italic font-normal text-[#008768]">Cebu</em>.
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-[540px]">
                Local experts who know Cebu like the back of their hand — divers, trekkers, heritage scholars, and more.
              </p>
            </div>
            <div className="hidden lg:flex gap-6 shrink-0">
              {[
                [`${tourGuides.length}`, 'local guides'],
                [`${avgRating}★`, 'avg rating'],
              ].map(([n, l]) => (
                <div key={l} className="text-right">
                  <div className="text-2xl font-extrabold tracking-[-0.02em] leading-none text-gray-900">{n}</div>
                  <div className="mt-1 text-[10px] font-mono tracking-[.12em] uppercase text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">

            {/* <span className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400 shrink-0">Language</span>
            {ALL_LANGUAGES.map((lang) => {
              const active = activeLanguage === lang
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLanguage(active ? null : lang)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {lang}
                </button>
              )
            })} */}

            {/* <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" /> */}

            <span className="text-[10px] font-mono tracking-[.14em] uppercase text-gray-400 shrink-0">Location</span>
            {ALL_LOCATIONS.map((loc) => {
              const active = activeLocation === loc
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setActiveLocation(active ? null : loc)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'border-[#008768] bg-[#d9efe6] text-[#003a2d]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {loc.replace(', Cebu', '')}
                </button>
              )
            })}

            {activeFiltersCount > 0 && (
              <>
                <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />
                <button
                  type="button"
                  onClick={() => { setActiveLanguage(null); setActiveLocation(null) }}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Clear all ({activeFiltersCount})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 pb-20 lg:pb-16 flex-1">

        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-2xl font-extrabold text-gray-900 tracking-[-0.02em]">
              {filtered.length} guide{filtered.length !== 1 ? 's' : ''}
            </span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-sm text-gray-400">matching your filters</span>
            )}
          </div>
          <select
            aria-label="Sort guides"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs sm:text-[13px] px-3 sm:px-3.5 py-2 sm:py-2.5 border border-gray-200 rounded-full bg-white font-medium text-gray-700 outline-none cursor-pointer"
          >
            {(['Recommended', 'Highest rated', 'Most experienced', 'Price · low to high', 'Price · high to low'] as SortOption[]).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

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
