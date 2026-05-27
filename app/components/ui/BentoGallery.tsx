'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// ── Lightbox ─────────────────────────────────────────────────────

export type LightboxImage =
  | string
  | { url: string; title?: string; description?: string }

export type LightboxTab = {
  id: string
  label: string
  images: LightboxImage[]
}

function resolveLightboxImage(image: LightboxImage) {
  if (typeof image === 'string') {
    return { url: image, title: '', description: '' }
  }
  return {
    url: image.url,
    title: image.title ?? '',
    description: image.description ?? '',
  }
}

export function Lightbox({ images, idx, onClose, onChange, loop = false, tabs }: {
  images: LightboxImage[]
  idx: number
  onClose: () => void
  onChange: (i: number) => void
  loop?: boolean
  tabs?: LightboxTab[]
}) {
  const stableOnClose = useCallback(onClose, [onClose])
  const stableOnChange = useCallback(onChange, [onChange])
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [activeTabId, setActiveTabId] = useState(tabs?.[0]?.id ?? 'default')

  const activeTab = tabs?.find((tab) => tab.id === activeTabId) ?? tabs?.[0]
  const displayImages = activeTab?.images ?? images
  const safeIdx = displayImages.length > 0 ? Math.min(idx, displayImages.length - 1) : 0
  const current = displayImages.length > 0 ? resolveLightboxImage(displayImages[safeIdx]) : null
  const hasMultiple = displayImages.length > 1

  const goPrev = () => {
    if (!displayImages.length) return
    if (loop) stableOnChange((safeIdx - 1 + displayImages.length) % displayImages.length)
    else stableOnChange(Math.max(0, safeIdx - 1))
  }

  const goNext = () => {
    if (!displayImages.length) return
    if (loop) stableOnChange((safeIdx + 1) % displayImages.length)
    else stableOnChange(Math.min(displayImages.length - 1, safeIdx + 1))
  }

  const switchTab = (tabId: string) => {
    setActiveTabId(tabId)
    stableOnChange(0)
  }

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])

  useEffect(() => {
    thumbRefs.current[safeIdx]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [safeIdx, activeTabId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stableOnClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx, displayImages.length, stableOnClose, stableOnChange, loop, activeTabId])

  const showPrev = loop ? hasMultiple : safeIdx > 0
  const showNext = loop ? hasMultiple : safeIdx < displayImages.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 text-white/90 hover:text-white transition-colors"
        aria-label="Close gallery"
      >
        <X className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.75} />
      </button>

      {tabs && tabs.length > 0 && (
        <div className="shrink-0 pt-14 sm:pt-16 pb-3 px-4 border-b border-white/10">
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-6 sm:gap-10 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const active = tab.id === activeTabId
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchTab(tab.id)}
                  className={`shrink-0 pb-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
                    active
                      ? 'text-white border-white'
                      : 'text-white/55 border-transparent hover:text-white/80'
                  }`}
                >
                  {tab.label} ({tab.images.length})
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className={`relative flex-1 min-h-0 flex items-center justify-center px-14 sm:px-20 ${tabs?.length ? 'pt-2' : 'pt-4'} pb-2`}>
        {showPrev && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
          </button>
        )}

        <div className="flex flex-col w-full max-w-6xl h-full max-h-full min-h-0 justify-center">
          {current ? (
            <>
              <div className="relative flex-1 min-h-[180px] w-full">
                <Image
                  key={`${activeTabId}-${current.url}`}
                  src={current.url}
                  alt={current.title || `Image ${safeIdx + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />

                {hasMultiple && (
                  <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 rounded-md bg-black/60 px-2.5 py-1 text-white text-xs sm:text-sm tabular-nums">
                    {safeIdx + 1} / {displayImages.length}
                  </div>
                )}
              </div>

              {(current.title || current.description) && (
                <div className="shrink-0 w-full pt-3 sm:pt-4 text-left">
                  {current.title && (
                    <p className="text-white text-sm sm:text-base font-bold uppercase tracking-wide">
                      {current.title}
                    </p>
                  )}
                  {current.description && (
                    <p className="text-white/75 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-3 max-w-2xl">
                      {current.description}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-white/60 text-sm">
              No photos in this gallery yet.
            </div>
          )}
        </div>

        {showNext && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
          </button>
        )}
      </div>

      {hasMultiple && (
        <div className="shrink-0 border-t border-white/10 bg-black/90 px-4 py-4 sm:py-5">
          <div className="mx-auto max-w-5xl overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 min-w-min px-1">
              {displayImages.map((image, i) => {
                const resolved = resolveLightboxImage(image)
                const active = i === safeIdx
                return (
                  <button
                    key={`${activeTabId}-${resolved.url}-${i}`}
                    ref={(el) => { thumbRefs.current[i] = el }}
                    type="button"
                    onClick={() => stableOnChange(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-current={active ? 'true' : undefined}
                    className={`relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded overflow-hidden transition-all ${
                      active
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black opacity-100'
                        : 'opacity-55 hover:opacity-85'
                    }`}
                  >
                    <Image
                      src={resolved.url}
                      alt={resolved.title || `Thumbnail ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Bento Gallery ─────────────────────────────────────────────────

export function BentoGallery({ images, alt, onImageClick }: {
  images: string[]
  alt: string
  onImageClick: (idx: number) => void
}) {
  const MAX_VISIBLE = 5
  const visible = images.slice(0, MAX_VISIBLE)
  const extra = images.length > MAX_VISIBLE ? images.length - MAX_VISIBLE : 0
  const n = visible.length

  type GridCfg = { areas: string; cols: string; rows: string }
  const configs: Record<number, GridCfg> = {
    1: { areas: '"a"',               cols: '1fr',           rows: '1fr' },
    2: { areas: '"a b"',             cols: '1fr 1fr',       rows: '1fr' },
    3: { areas: '"a b" "a c"',       cols: '1fr 1fr',       rows: '1fr 1fr' },
    4: { areas: '"a b" "c d"',       cols: '1fr 1fr',       rows: '1fr 1fr' },
    5: { areas: '"a b c" "a d e"',   cols: '1fr 1fr 1fr',   rows: '1fr 1fr' },
  }
  const cfg = configs[Math.max(1, Math.min(n, 5))]
  const letters = ['a', 'b', 'c', 'd', 'e']

  return (
    <>
      {/* Desktop: bento grid */}
      <div
        className="hidden sm:grid gap-2 p-2 rounded-2xl bg-white/35 backdrop-blur-sm"
        style={{
          gridTemplateAreas: cfg.areas,
          gridTemplateColumns: cfg.cols,
          gridTemplateRows: cfg.rows,
          height: 420,
        }}
      >
        {visible.map((src, i) => {
          const isLast = i === visible.length - 1
          return (
            <button
              key={i}
              style={{ gridArea: letters[i] }}
              className="relative overflow-hidden rounded-xl group focus:outline-none"
              onClick={() => onImageClick(i)}
            >
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 50vw, 480px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority={i === 0}
              />
              {isLast && extra > 0 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{extra}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Mobile: horizontal swipe carousel */}
      <div
        className="sm:hidden flex gap-2 overflow-x-auto scrollbar-hide"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={{ WebkitOverflowScrolling: 'touch' } as any}
      >
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => onImageClick(i)}
            className="relative shrink-0 rounded-2xl overflow-hidden focus:outline-none"
            style={{ width: '82vw', height: 220 }}
          >
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              sizes="82vw"
              className="object-cover"
              priority={i === 0}
            />
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full tabular-nums">
              {i + 1} / {images.length}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
