'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// ── Lightbox ─────────────────────────────────────────────────────

export function Lightbox({ images, idx, onClose, onChange }: {
  images: string[]
  idx: number
  onClose: () => void
  onChange: (i: number) => void
}) {
  const stableOnClose = useCallback(onClose, [onClose])
  const stableOnChange = useCallback(onChange, [onChange])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stableOnClose()
      if (e.key === 'ArrowLeft') stableOnChange(Math.max(0, idx - 1))
      if (e.key === 'ArrowRight') stableOnChange(Math.min(images.length - 1, idx + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx, images.length, stableOnClose, stableOnChange])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full max-w-5xl mx-4" style={{ height: '80vh' }}>
          <Image src={images[idx]} alt={`Image ${idx + 1}`} fill className="object-contain" />
        </div>
        {idx > 0 && (
          <button
            onClick={() => onChange(idx - 1)}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2.5 sm:p-3 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {idx < images.length - 1 && (
          <button
            onClick={() => onChange(idx + 1)}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2.5 sm:p-3 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
          {idx + 1} / {images.length}
        </p>
      </div>
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
        className="hidden sm:grid gap-1.5 rounded-2xl overflow-hidden"
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
              className="relative overflow-hidden group focus:outline-none"
              onClick={() => onImageClick(i)}
            >
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
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
            <Image src={src} alt={`${alt} ${i + 1}`} fill className="object-cover" priority={i === 0} />
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full tabular-nums">
              {i + 1} / {images.length}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
