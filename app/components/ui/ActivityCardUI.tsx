'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { DotSealBadge } from '@/app/components/ui/DotSealBadge'
import { useImageCarousel } from '@/app/hooks/useImageCarousel'
import { cn } from '@/app/lib/utils'

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
      className={cn(
        'group relative rounded-2xl overflow-hidden bg-white shadow-md w-full min-w-0',
        'flex flex-row sm:flex-col sm:aspect-[3/4]',
        isInteractive ? 'cursor-pointer' : '',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── IMAGE SECTION ─────────────────────────────────────────────── */}
      <div className="relative w-[170px] sm:w-full aspect-[3.5/4] sm:aspect-[4/3.5] flex-shrink-0 overflow-hidden rounded-l-2xl sm:rounded-none sm:rounded-t-2xl">
        {activeImg ? (
          <Image
            key={activeImg}
            src={activeImg}
            alt={title}
            fill
            sizes="(max-width: 640px) 170px, (max-width: 1024px) 50vw, 280px"
            className={cn(
              'object-cover transition-transform duration-500',
              isInteractive && !hasMultiple ? 'group-hover:scale-105' : ''
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}

        {/* Carousel controls — desktop only; 120px thumbnail too small on mobile */}
        {hasMultiple && (
          <div className="hidden sm:block">
            <div className="absolute bottom-2 left-0 right-0 z-30 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {imgList.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  onClick={(e) => goTo(e, i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200 pointer-events-auto',
                    i === imgIdx ? 'w-3 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/90'
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Previous image"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tag overlay — desktop only */}
        {tagList.length > 0 && (
          <div className="hidden sm:flex absolute top-2.5 left-2.5 right-10 flex-wrap gap-1.5 z-10">
            {tagList.map((t) => (
              <span
                key={t}
                className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-3 sm:p-3 sm:pb-12 min-w-0">
        {/* Tags chips — mobile only */}
        {tagList.length > 0 && (
          <div className="flex sm:hidden flex-wrap gap-1 mb-1.5">
            {tagList.map((t) => (
              <span
                key={t}
                className="bg-green-500 text-white border shadow-sm text-xs font-semibold px-1.5 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Rating — mobile only */}
        {rating !== undefined && (
          <div className="flex sm:hidden items-center gap-1 text-sm text-gray-900 mb-1">
            <span className="text-amber-400 text-base leading-none" aria-hidden>★</span>
            <span className="font-semibold">{rating.toFixed(1)}</span>
            {reviewCount !== undefined && (
              <span className="text-gray-400 text-xs">({reviewCount.toLocaleString()})</span>
            )}
          </div>
        )}

        {/* Title + location + duration — shared across both layouts */}
        <div className="sm:h-11">
          <div className="flex items-start mb-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-lg text-gray-900 leading-tight flex-1 min-w-0 overflow-hidden text-ellipsis line-clamp-2">
              {title}
            </h3>
            <div className="shrink-0">
              <DotSealBadge granted={dotSealGranted} size="sm" showLabel={false} />
            </div>
          </div>

          {location && (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mb-0.5">
              <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden />
              <span className="truncate">{location}</span>
            </div>
          )}

          {duration && (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
              <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden />
              <span>{duration}</span>
            </div>
          )}
        </div>

        {/* Price — mobile only; mt-auto pushes to bottom of content area */}
        <p className="flex sm:hidden items-baseline justify-end gap-1 text-xs text-gray-500 mt-auto pt-2">
          from{' '}
          <span className="font-bold text-base text-gray-900">₱{price.toLocaleString()}</span>
        </p>
      </div>

      {/* ── RATING + PRICE BAR — desktop only, pinned to card bottom ──── */}
      <div className="hidden sm:flex absolute bottom-0 left-0 right-0 px-3 pb-3 bg-white">
        <div className="flex items-center justify-between w-full">
          {rating !== undefined && (
            <div className="flex items-center gap-1 text-sm text-gray-900">
              <span className="text-amber-400 text-base leading-none" aria-hidden>★</span>
              <span className="font-semibold">{rating.toFixed(1)}</span>
              {reviewCount !== undefined && (
                <span className="text-gray-400 text-xs">({reviewCount.toLocaleString()})</span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            from{' '}
            <span className="font-bold text-lg text-gray-900">₱{price.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* topRightAction — card root level so it works in both layouts */}
      {topRightAction && (
        <div className="absolute top-2.5 right-2.5 z-20">
          {topRightAction}
        </div>
      )}
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
