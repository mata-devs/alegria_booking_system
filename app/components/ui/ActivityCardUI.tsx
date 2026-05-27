'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { DotSealBadge } from '@/app/components/ui/DotSealBadge'
import { useImageCarousel } from '@/app/hooks/useImageCarousel'

export interface ActivityCardUIProps {
  image: string
  images?: string[]
  title: string
  price: number
  rating?: number
  reviewCount?: number
  duration?: string
  location?: string
  /** Single tag string (legacy). Prefer `tags` for multi-chip rendering. */
  tag?: string
  /** Multi-tag list. Overrides `tag` when set. */
  tags?: string[]
  href?: string
  onClick?: () => void
  topRightAction?: ReactNode
  dotSealGranted?: boolean
  className?: string
}

export default function ActivityCardUI({
  image,
  images,
  title,
  price,
  rating,
  reviewCount,
  duration,
  location,
  tag,
  tags,
  href,
  onClick,
  topRightAction,
  dotSealGranted = false,
  className = '',
}: ActivityCardUIProps) {
  const { imgList, hasMultiple, imgIdx, isHovered, setIsHovered, activeImg, goPrev, goNext, goTo } =
    useImageCarousel(images, image)

  const tagList = (
    tags && tags.length > 0 ? tags : tag ? [tag] : []
  ).filter((t) => !!t && t.trim().length > 0)

  const isInteractive = !!(onClick || href)

  const card = (
    <div
      className={`group relative rounded-2xl overflow-hidden bg-white shadow-md w-full min-w-0 ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── IMAGE SECTION ─────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {activeImg ? (
          <Image
            key={activeImg}
            src={activeImg}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            className={`object-cover transition-transform duration-500 ${isInteractive && !hasMultiple ? 'group-hover:scale-105' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}

        {/* Carousel controls — shown on hover when multiple images exist */}
        {hasMultiple && (
          <>
            {/* Dot indicators */}
            <div className="absolute top-2 left-0 right-0 z-30 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {imgList.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  onClick={(e) => goTo(e, i)}
                  className={`h-1.5 rounded-full transition-all duration-200 pointer-events-auto ${i === imgIdx ? 'w-3 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'}`}
                />
              ))}
            </div>

            {/* Prev button */}
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Next button */}
            <button
              type="button"
              aria-label="Next image"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Category tag — top-left */}
        {tagList.length > 0 && (
          <div className="absolute top-2.5 left-2.5 right-10 flex flex-wrap gap-1.5 z-10">
            {tagList.map((t) => (
              <span
                key={t}
                className="bg-green-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Top-right action slot (e.g. wishlist heart) */}
        {topRightAction && (
          <div className="absolute top-2.5 right-2.5 z-20">
            {topRightAction}
          </div>
        )}
      </div>

      {/* ── CONTENT BELOW IMAGE ───────────────────────────────────────── */}
      <div className="p-3">
        {/* Title + DOT seal */}
        <div className="flex items-start gap-1.5 mb-1">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1 min-w-0 leading-snug">
            {title}
          </h3>
          <DotSealBadge granted={dotSealGranted} size="sm" showLabel={false} />
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
            <MapPin className="w-3 h-3 shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Duration */}
        {duration && (
          <p className="text-xs text-gray-500 mb-2">{duration}</p>
        )}

        {/* Rating + Price row */}
        <div className="flex items-center justify-between">
          {rating !== undefined && (
            <div className="flex items-center gap-1 text-xs text-gray-900">
              <span className="text-amber-400 text-sm leading-none" aria-hidden>★</span>
              <span className="font-bold">{rating.toFixed(1)}</span>
              {reviewCount !== undefined && (
                <span className="text-gray-400">({reviewCount.toLocaleString()})</span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-700 ml-auto">
            from{' '}
            <span className="font-bold text-gray-900">₱{price.toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block w-full min-w-0">
        {card}
      </Link>
    )
  }

  return card
}
