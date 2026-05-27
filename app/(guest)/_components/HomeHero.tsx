'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import SearchBar from '@/app/components/SearchBar'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/app/components/ui/drawer'
import MunicipalityTicker from '@/app/components/MunicipalityTicker'
import {
  DEFAULT_HOMEPAGE_HERO,
  type HomepageCms,
} from '@/app/lib/homepage-cms'

const FALLBACK_HERO_SLIDES = [
  { src: 'https://picsum.photos/seed/cebu-hero-tropical/1400/900', alt: 'Cebu tropical landscape' },
  { src: 'https://picsum.photos/seed/cebu-beach-hero/1400/900',     alt: 'Cebu beach' },
  { src: 'https://picsum.photos/seed/cebu-waterfall/1400/900',      alt: 'Cebu waterfall' },
  { src: 'https://picsum.photos/seed/cebu-diving/1400/900',         alt: 'Cebu diving' },
  { src: 'https://picsum.photos/seed/cebu-mountain/1400/900',       alt: 'Cebu mountain' },
]

type Props = {
  cms: HomepageCms | null
}

export default function HomeHero({ cms }: Props) {
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false)
  const router = useRouter()

  const onMobileSearch = useCallback(
    ({ where, when, travelers }: { where: string; when: string; travelers: string }) => {
      setSearchDrawerOpen(false)
      router.push(
        `/activities?location=${encodeURIComponent(where)}&date=${encodeURIComponent(when)}&travelers=${encodeURIComponent(travelers)}`,
      )
    },
    [router],
  )

  const publishedTickerItems =
    cms?.enabled
      ? cms.ticker.items.filter((i) => i.published && i.bestPictureUrl)
      : []

  const useTicker = Boolean(cms?.enabled && publishedTickerItems.length >= 2)
  const hero = cms?.hero ?? DEFAULT_HOMEPAGE_HERO

  return (
    <>
      {useTicker ? (
        <MunicipalityTicker
          items={publishedTickerItems}
          intervalMs={cms?.ticker.intervalMs}
          hero={hero}
        >
          <SearchBar className="w-full" />
        </MunicipalityTicker>
      ) : (
        <FallbackHero hero={hero} openMobileDrawer={() => setSearchDrawerOpen(true)} />
      )}

      <Drawer open={searchDrawerOpen} onOpenChange={setSearchDrawerOpen}>
        <DrawerContent className="pb-8">
          <DrawerHeader>
            <DrawerTitle>Explore Cebu</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <SearchBar onSearch={onMobileSearch} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function FallbackHero({
  hero,
  openMobileDrawer,
}: {
  hero: HomepageCms['hero']
  openMobileDrawer: () => void
}) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((s) => (s + 1) % FALLBACK_HERO_SLIDES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <section className="relative h-[85vh] min-h-[560px] overflow-hidden">
      {FALLBACK_HERO_SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="100vw"
          className={`scale-105 object-cover ${i !== 0 ? 'transition-opacity duration-1000 ' : ''}${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 pb-10 text-center sm:px-8 lg:px-16 sm:pb-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-green-300 drop-shadow sm:mb-4 sm:text-sm">
          {hero.eyebrow}
        </p>
        <h1 className="max-w-3xl whitespace-pre-line text-4xl font-extrabold leading-tight text-white drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl">
          {hero.headline}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:mt-5 sm:max-w-2xl sm:text-base md:text-lg">
          {hero.subhead}
        </p>
        <div className="mt-6 hidden w-full max-w-xs sm:mt-10 sm:block sm:max-w-5xl">
          <SearchBar />
        </div>
        <button
          onClick={openMobileDrawer}
          className="mt-6 flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:hidden"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Where in Cebu?
        </button>
      </div>
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {FALLBACK_HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === currentSlide ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
