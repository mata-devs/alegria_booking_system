'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import type { HomepageCmsHero, TickerItem } from '@/app/lib/homepage-cms'

/**
 * Magnific.com-style vertical ticker.
 *
 * Animation: pure CSS — a `transform: translateY(...)` with `transition: 700ms ease-in-out`
 * on an inner `<ul>` whose rows have a fixed `LINE_HEIGHT_PX`. JS only mutates a numeric
 * `position` counter via `setInterval`. No animation library required.
 *
 * Continuous-loop trick: we render `COPIES` clones of the item list and let `position`
 * advance monotonically. When `position` enters the last clone, we wait for the current
 * transition to finish and silently teleport `position` back by `N` (one full list length),
 * with `transition: none` for one paint, so the user only ever sees forward motion.
 *
 * Features:
 *  - Background `<Image>` cross-fades to the active municipality's best picture.
 *  - Active row is centered, highlighted, and prefixed with a green ▶ marker.
 *  - Click any visible row → navigate to `/locations/{slug}`.
 *  - Pauses auto-rotate on hover and keyboard focus within the ticker.
 *  - Respects `prefers-reduced-motion: reduce` (no auto-advance, no transition).
 *  - Truly continuous — no snap-back from last item to first.
 */

const NEWS_ITEMS = [
  { text: 'SIRAO GARDEN — CELOSIA IN FULL BLOOM', live: true },
  { text: 'WHALE-SHARK SEASON · OSLOB' },
  { text: '22°C IN THE HIGHLANDS TODAY' },
  { text: '1,284 TRAVELERS BOOKED THIS WEEK', live: true },
  { text: 'MALAPASCUA — THRESHER SHARK DIVING SEASON' },
  { text: 'CANYONEERING SEASON NOW OPEN · BADIAN' },
  { text: 'BANTAYAN ISLAND FERRY — DAILY DEPARTURES' },
  { text: 'KAWASAN FALLS TREK — OPEN YEAR ROUND' },
]

function NewsTickerStrip() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let pos = 0
    let frame: number
    const tick = () => {
      pos += 0.4
      const half = el.scrollWidth / 2
      if (pos >= half) pos = 0
      el.style.transform = `translateX(-${pos}px)`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const doubled = [...NEWS_ITEMS, ...NEWS_ITEMS]

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden border-t border-white/10 bg-black/55 backdrop-blur-sm py-2.5">
      <div ref={trackRef} className="flex w-max items-center gap-8 px-4">
        {doubled.map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2.5">
            {item.live && (
              <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </span>
            )}
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/75">
              {item.text}
            </span>
            <span className="text-white/25">·</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const LINE_HEIGHT_PX = 50
const VISIBLE_ROWS = 7
const COPIES = 5
const MIDDLE_COPY_INDEX = Math.floor(COPIES / 2) // = 2
const OFFSET_DESKTOP = 3 // active item centered in 7 visible rows
const OFFSET_MOBILE  = 2 // active item centered in 5 visible rows

const OPACITY_CLASSES = ['opacity-100', 'opacity-[0.54]', 'opacity-[0.36]', 'opacity-[0.18]', 'opacity-[0.16]']
function tickerOpacityClass(distance: number) {
  return OPACITY_CLASSES[Math.min(distance, OPACITY_CLASSES.length - 1)]
}

type Props = {
  items: TickerItem[]
  intervalMs?: number
  hero: HomepageCmsHero
  /** Slot for SearchBar / mobile drawer trigger to render beneath the ticker. */
  children?: React.ReactNode
}

export default function MunicipalityTicker({
  items,
  intervalMs = 1800,
  hero,
  children,
}: Props) {
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobile()
  const offset = isMobile ? OFFSET_MOBILE : OFFSET_DESKTOP

  const N = items.length
  const useLoop = N >= 2
  const initialPosition = useLoop ? N * MIDDLE_COPY_INDEX : 0
  const snapAt = useLoop ? N * (MIDDLE_COPY_INDEX + 1) : Infinity

  const [position, setPosition] = useState(initialPosition)
  const [animEnabled, setAnimEnabled] = useState(true)
  const ulRef = useRef<HTMLUListElement>(null)
  // Only load background images progressively: start with index 0 + 1, add more as ticker advances.
  const [loadedImgIndices, setLoadedImgIndices] = useState<Set<number>>(
    () => new Set(N > 1 ? [0, 1] : [0]),
  )

  useEffect(() => {
    const el = ulRef.current
    if (!el) return
    el.style.transform = `translateY(${-(position - offset) * LINE_HEIGHT_PX}px)`
    el.style.transition = reducedMotion || !animEnabled ? 'none' : 'transform 480ms ease-in-out'
  }, [position, reducedMotion, animEnabled, offset])

  // When breakpoint flips (resize), snap without animating so the jump is invisible.
  const prevOffsetRef = useRef(offset)
  useEffect(() => {
    if (prevOffsetRef.current === offset) return
    prevOffsetRef.current = offset
    setAnimEnabled(false)
  }, [offset])

  const loopedItems = useMemo(
    () => (useLoop ? Array.from({ length: COPIES }, () => items).flat() : items),
    [items, useLoop],
  )

  // Reset position when the items list changes (e.g. admin saves a new order).
  useEffect(() => {
    setAnimEnabled(false)
    setPosition(initialPosition)
  }, [initialPosition])

  useEffect(() => {
    if (!useLoop || paused || reducedMotion) return
    const tick = setInterval(
      () => setPosition((p) => p + 1),
      Math.max(1000, intervalMs),
    )
    return () => clearInterval(tick)
  }, [useLoop, intervalMs, paused, reducedMotion])

  // After a snap (animEnabled=false), re-enable the transition once the browser has
  // painted the no-animation frame so the next position change tweens smoothly.
  useEffect(() => {
    if (animEnabled) return
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimEnabled(true)),
    )
    return () => cancelAnimationFrame(id)
  }, [animEnabled])

  const onTransitionEnd = (e: React.TransitionEvent<HTMLUListElement>) => {
    if (e.propertyName !== 'transform') return
    if (!useLoop || position < snapAt) return
    setAnimEnabled(false)
    setPosition((p) => p - N)
  }

  const activeSourceIndex = useLoop ? ((position % N) + N) % N : 0

  // Preload current + next background image whenever the active slot changes.
  useEffect(() => {
    if (N === 0) return
    const next = (activeSourceIndex + 1) % N
    setLoadedImgIndices((prev) => {
      if (prev.has(activeSourceIndex) && prev.has(next)) return prev
      const s = new Set(prev)
      s.add(activeSourceIndex)
      s.add(next)
      return s
    })
  }, [activeSourceIndex, N])

  if (N === 0) return null

  const active = items[activeSourceIndex]

  return (
    <section className="relative min-h-[900px] sm:h-[85vh] sm:min-h-[640px]">
      {items.map((it, i) =>
        loadedImgIndices.has(i) ? (
          <Image
            key={it.municipalitySlug}
            src={it.bestPictureUrl}
            alt={i === activeSourceIndex ? it.displayName : ''}
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ease-out ${i === activeSourceIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null,
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />

      {active?.imageAttribution && (
        <ImageAttribution
          text={active.imageAttribution}
          href={active.imageAttributionUrl}
        />
      )}

      <div className="absolute inset-0 flex flex-col justify-start sm:justify-center">
        <div className="mx-auto w-full max-w-5xl px-5 pb-4 pt-10 md:px-8 md:pb-12 md:pt-8 lg:px-10 lg:pb-16">
          {/*
            Responsive hero grid via grid-template-areas:
              < sm  →  copy   copy         (hero text spans both columns)
                       button ticker       (search button left, ticker right)
              sm-md →  single column, stacked: copy → ticker → search bar
              lg+   →  copy   ticker       (existing desktop layout)
                       button button       (search bar full-width below)
          */}
          <div
            className="
              grid grid-cols-1 items-center gap-6
              [grid-template-areas:'copy''ticker''button']
              md:grid-cols-2 md:gap-x-8 md:gap-y-6
              md:[grid-template-areas:'copy_ticker''button_button']
              lg:gap-x-12 lg:gap-y-8
            "
          >
            <div className="max-w-2xl text-left [grid-area:copy] lg:pl-10">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-green-300 drop-shadow sm:mb-4 sm:text-sm">
                {hero.eyebrow}
              </p>
              <h1 className="whitespace-pre-line text-4xl font-extrabold leading-[1.02] tracking-tight text-white drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl lg:leading-[0.98]">
                {hero.headline}
              </h1>
              <p className="mt-8 max-w-xl text-xs leading-relaxed text-white/85 sm:mt-10 sm:text-base md:text-lg">
                {hero.subhead}
              </p>

              <p className="mt-2 min-h-[1em] text-[11px] font-medium text-green-300/90 drop-shadow sm:mt-3 sm:text-sm">
                {active?.caption}
              </p>
            </div>

            <div
              className="relative mx-auto h-[250px] w-full max-w-full [grid-area:ticker] md:mx-0 md:h-[350px] md:max-w-[500px]"
              role="region"
              aria-roledescription="ticker"
              aria-live="polite"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
            >
              <div
                className="pointer-events-none absolute left-10 top-[100px] md:top-[150px] z-20 flex h-[50px] items-center text-green-400 drop-shadow-lg"
                aria-hidden
              >
                <Play className="h-3.5 w-3.5 fill-current sm:h-5 sm:w-5" strokeWidth={0} />
              </div>

              <div className="absolute inset-0 overflow-hidden">
                <div className="relative h-full">
                <ul
                  ref={ulRef}
                  className="absolute inset-x-0 will-change-transform"
                  onTransitionEnd={onTransitionEnd}
                >
                  {loopedItems.map((it, loopIndex) => {
                    const distance = Math.abs(loopIndex - position)
                    const isActive = loopIndex === position
                    return (
                      <li
                        key={`${it.municipalitySlug}-${loopIndex}`}
                        className={`h-[50px] ${tickerOpacityClass(distance)}`}
                      >
                        <Link
                          href={`/locations/${it.municipalitySlug}`}
                          tabIndex={isActive ? 0 : -1}
                          aria-current={isActive ? 'true' : undefined}
                          className={`flex h-full w-full items-center pl-16 pr-2 text-left font-extrabold tracking-tight transition-colors focus-visible:outline-none sm:pl-16 ${
                            isActive ? 'text-white' : 'text-white/70 hover:text-white'
                          }`}
                        >
                          <span className={`drop-shadow text-2xl sm:text-3xl lg:text-4xl transition-transform duration-300 ease-out origin-left ${isActive ? 'scale-[1.18]' : 'scale-100'}`}>
                            {it.displayName}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
                </div>
              </div>
            </div>

            {children && (
              <div className="flex w-full [grid-area:button] md:justify-self-stretch">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>

      <NewsTickerStrip />
    </section>
  )
}

function ImageAttribution({ text, href }: { text: string; href?: string }) {
  const base =
    'pointer-events-auto inline-flex max-w-[70vw] items-center gap-1 rounded-md bg-black/45 px-2 py-0.5 text-[9px] font-medium leading-tight text-white/90 backdrop-blur-sm shadow-md sm:max-w-[80vw] sm:px-2.5 sm:py-1 sm:text-[11px]'
  const content = (
    <>
      <span aria-hidden className="text-white/70">📷</span>
      <span className="truncate">{text}</span>
    </>
  )
  // Mobile: anchor to top-right so the chip stays clear of the bottom-row UI
  // (search button on the left, floating notification widget on the right).
  // sm+ (desktop unchanged): bottom-right of the hero image.
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-30 sm:top-4 sm:right-4">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={`${base} transition-colors hover:bg-black/65 hover:text-white`}
          title={text}
        >
          {content}
        </a>
      ) : (
        <span className={base} title={text}>
          {content}
        </span>
      )}
    </div>
  )
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(max-width: 767px)')
    setMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}
