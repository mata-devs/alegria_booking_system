'use client'

import { useImageCarousel } from '@/app/hooks/useImageCarousel'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Layers, Sparkle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { DotSealBadge } from '@/app/components/ui/DotSealBadge'

/** Guest hint: single-spot vs bundled itinerary (icon + tooltip top-right). */
export type PackageCardKind = 'activity' | 'tourPackage'

const CARD_KIND_COPY: Record<
  PackageCardKind,
  { label: string; Icon: LucideIcon; tip: string }
> = {
  activity: {
    label: 'Activity',
    Icon: Sparkle,
    tip: 'Unique travel experience',
  },
  tourPackage: {
    label: 'Tour package',
    Icon: Layers,
    tip: 'Curated Multi-Destination Itineraries',
  },
}

function CardKindHint({ kind }: { kind: PackageCardKind }) {
  const { label, Icon, tip } = CARD_KIND_COPY[kind]
  return (
    <span className="group/kind relative z-20 inline-flex">
      <button
        type="button"
        className="inline-flex h-8 w-8 cursor-default items-center justify-center rounded-full bg-black/45 text-white shadow-sm ring-1 ring-white/30 backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        title={tip}
        aria-label={`${label}: ${tip}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-30 mt-1.5 hidden w-[13.5rem] rounded-lg bg-gray-950 px-2.5 py-2 text-left text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 sm:block sm:group-hover/kind:opacity-100 sm:group-focus-within/kind:opacity-100"
      >
        {tip}
      </span>
    </span>
  )
}

const STAR_PATH = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const full = rounded >= s
        const half = !full && rounded >= s - 0.5
        return (
          <span key={s} className="relative inline-block w-3 h-3">
            <svg className="w-3 h-3 text-white/30 absolute inset-0" fill="currentColor" viewBox="0 0 20 20">
              <path d={STAR_PATH} />
            </svg>
            {(full || half) && (
              <svg
                className={`w-3 h-3 text-yellow-400 absolute inset-0${half ? ' [clip-path:inset(0_50%_0_0)]' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d={STAR_PATH} />
              </svg>
            )}
          </span>
        )
      })}
    </div>
  )
}

export interface PackageCardProps {
  image: string
  title: string
  description?: string
  price: number
  pricePrefix?: string
  /** Single tag string (legacy). Prefer `tags` for multi-chip rendering. */
  tag?: string
  /** Multi-tag list. When set, overrides `tag` and renders one chip per entry. */
  tags?: string[]
  duration?: string
  rating?: number
  location?: string
  createdAt?: string
  status?: ReactNode
  minGuests?: number
  ctaLabel?: string
  onCta?: () => void
  href?: string
  onClick?: () => void
  topRightAction?: ReactNode
  /** Shows type hint icon (guest listings). */
  cardKind?: PackageCardKind
  /** Operator DOT Quality Seal (display-only). */
  dotSealGranted?: boolean
  /** All images for hover carousel; falls back to [image] when omitted. */
  images?: string[]
  wide?: boolean
  className?: string
  disableAutoCarousel?: boolean
}

export default function PackageCard({
  image,
  title,
  description,
  price,
  pricePrefix = 'From',
  tag,
  tags,
  duration,
  rating,
  location,
  createdAt,
  status,
  minGuests,
  ctaLabel,
  onCta,
  href,
  onClick,
  topRightAction,
  cardKind,
  dotSealGranted = false,
  images,
  wide = false,
  className = '',
  disableAutoCarousel = true,
}: PackageCardProps) {
  const tagList = (tags && tags.length > 0
    ? tags
    : tag
    ? [tag]
    : []
  ).filter((t) => !!t && t.trim().length > 0)
  const isInteractive = !!(onClick || href)

  const { imgList, hasMultiple, imgIdx, isHovered, setIsHovered, activeImg, goPrev, goNext, goTo } =
    useImageCarousel(images, image, disableAutoCarousel)

  // ─── PILL OVERFLOW ──────────────────────────────────────────────────────
  // Max 2 visible chips; rest collapse to a single white "+N" chip with a
  // title tooltip listing the hidden labels. NEVER wraps to a 2nd row.
  // ────────────────────────────────────────────────────────────────────────
  const VISIBLE_PILLS = 2
  const visiblePills = tagList.slice(0, VISIBLE_PILLS)
  const hiddenPillCount = tagList.length - visiblePills.length

  const card = (
    <div
      // ── CARD SIZE ──────────────────────────────────────────────────────────
      // Width:  sm:max-w-[280px] — change to resize card width (sm+; mobile fills column)
      // Height: aspect-[3/4]    — change ratio (e.g. aspect-[4/5], aspect-square)
      // Wide variant (homepage horizontal cards): h-52
      // ───────────────────────────────────────────────────────────────────────
      className={`relative rounded-2xl overflow-hidden group ${wide ? 'h-52' : 'w-full min-w-0 aspect-[3/4]'} ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {activeImg ? (
        <Image
          key={activeImg}
          src={activeImg}
          alt={title}
          fill
          sizes={wide ? '(max-width: 768px) 100vw, 480px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px'}
          className={`object-cover transition-transform duration-500 ${isInteractive && !hasMultiple ? 'group-hover:scale-105' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 bg-gray-200" />
      )}

      {/* Carousel controls — shown on hover when multiple images exist */}
      {hasMultiple && (
        <>
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
        </>
      )}

      {/* Gradient overlay — image clear top ~35%, transitions to near-black at bottom. */}
      <div
        className="
          absolute inset-0
          bg-[linear-gradient(to_bottom,transparent_35%,rgba(0,0,0,0.70)_70%,rgba(0,0,0,1)_100%)]
          sm:bg-[linear-gradient(to_bottom,transparent_35%,rgba(0,0,0,0.55)_60%,rgba(0,0,0,0.93)_100%)]
        "
      />

      {/* Top-left tag chips — supports single (`tag`) or multi (`tags`).
          NEVER wraps: max 2 chips visible; the rest collapse into a single
          white "+N" chip whose `title` lists the hidden labels.
          Each chip clips at max-w-[120px] with ellipsis if a label is unusually long. */}
      {tagList.length > 0 && (
        <div className="absolute top-2.5 left-2.5 right-12 sm:top-3 sm:left-3 flex flex-nowrap gap-1.5 z-10 min-w-0">
          {visiblePills.map((t) => (
            <span
              key={t}
              className="bg-green-600/95 text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] min-w-0 shrink backdrop-blur-sm"
            >
              {t}
            </span>
          ))}
          {hiddenPillCount > 0 && (
            <span
              className="bg-white/95 text-gray-900 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm whitespace-nowrap shrink-0 backdrop-blur-sm"
              title={tagList.slice(VISIBLE_PILLS).join(', ')}
            >
              +{hiddenPillCount}
            </span>
          )}
        </div>
      )}

      {/* Top-right: type hint + optional custom action */}
      {(cardKind || topRightAction) && (
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
          {cardKind ? <CardKindHint kind={cardKind} /> : null}
          {topRightAction}
        </div>
      )}

      {/* Bottom content — p-3 on mobile, p-5 on sm+ */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-5 gap-0.5 sm:gap-1">
        {/* Title — wraps to 2 lines; min-h reserves space so 1-line titles don't push
            short cards out of alignment with adjacent 2-line titles in a grid.
            Mobile uses tighter 15px / leading-tight; sm+ goes to text-xl. */}
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="text-white font-bold text-[15px] sm:text-xl leading-tight drop-shadow line-clamp-2 flex-1 min-w-0 break-words min-h-[2lh]">
            {title}
          </h3>
          <DotSealBadge granted={dotSealGranted} size="sm" showLabel={false} />
        </div>

        {/* Description — hidden on mobile and on wide cards (h-52 too compact); visible sm+ on tall cards */}
        {description && !wide && (
          <p className="hidden sm:block text-white/80 text-sm line-clamp-2 leading-relaxed">{description}</p>
        )}

        {location && (
          <div className="flex items-center gap-1 text-white/75 text-[11px] sm:text-xs mt-0.5">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="truncate">{location}</span>
          </div>
        )}

        {createdAt && (
          <p className="text-white/55 text-[11px] sm:text-xs mt-0.5">{createdAt}</p>
        )}

        {/* Pill badges row — duration + Min. N (logistics) come FIRST so they
            stay visually grouped on the same line. Rating / "Be the first to
            review" follows, and is the one that wraps to a second row when
            space is tight (the less critical info). */}
        {(rating !== undefined || duration || status || minGuests !== undefined) && (
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mt-0.5 sm:mt-1">
            {duration && (
              <span className="bg-black/45 text-white text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm font-medium">
                {duration}
              </span>
            )}
            {minGuests !== undefined && minGuests > 1 && (
              <span
                className="flex items-center gap-1 bg-black/45 text-white text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm font-medium"
                title={`Minimum ${minGuests} guests required to book`}
              >
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Min. {minGuests}
              </span>
            )}
            {rating !== undefined && rating > 0 ? (
              <span className="flex items-center gap-1 sm:gap-1.5 bg-black/45 text-white text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm">
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <Stars rating={rating} />
              </span>
            ) : rating !== undefined ? (
              <span className="bg-white/15 text-white text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm font-medium italic">
                Be the first to review
              </span>
            ) : null}
            {status}
          </div>
        )}

        {/* Price — prefix text-[10px] above, amount text-lg mobile / text-2xl sm+.
            Smaller mobile than before (was text-xl/20px) for the denser "narrower-card" feel. */}
        <div className="mt-1 sm:mt-1.5">
          {pricePrefix && (
            <p className="text-white/70 text-[10px] sm:text-xs font-normal leading-none mb-0.5 sm:mb-1">{pricePrefix}</p>
          )}
          <p className="text-white font-bold text-lg sm:text-2xl leading-none drop-shadow-sm">
            ₱{price.toLocaleString()}
          </p>
        </div>

        {/* CTA button — py-2 text-[13px] mobile, py-3 text-base sm+. */}
        {ctaLabel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onCta?.()
            }}
            className="mt-2 sm:mt-3 w-full bg-white text-gray-900 font-semibold text-[13px] sm:text-base py-2 sm:py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            {ctaLabel}
          </button>
        )}
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
