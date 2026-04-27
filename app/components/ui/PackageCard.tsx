'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

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
                className="w-3 h-3 text-yellow-400 absolute inset-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                style={half ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
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
  tag?: string
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
  wide?: boolean
  className?: string
}

export default function PackageCard({
  image,
  title,
  description,
  price,
  pricePrefix = 'From',
  tag,
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
  wide = false,
  className = '',
}: PackageCardProps) {
  const isInteractive = !!(onClick || href)

  const card = (
    <div
      // ── CARD SIZE ──────────────────────────────────────────────────────────
      // Width:  sm:max-w-[280px] — change this value to resize card width (sm+ only, mobile fills column)
      // Height: aspect-[3/4]  — change ratio (e.g. aspect-[4/5], aspect-square) to resize height
      // Wide variant (homepage horizontal cards): h-52 — change to resize that variant
      // ───────────────────────────────────────────────────────────────────────
      className={`relative rounded-2xl overflow-hidden group ${wide ? 'h-52' : 'sm:max-w-[280px] aspect-[3/4]'} ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <Image
        src={image}
        alt={title}
        fill
        className={`object-cover ${isInteractive ? 'group-hover:scale-105 transition-transform duration-500' : ''}`}
      />

      {/* Gradient overlay — image clear top ~40%, transitions to near-black at bottom
          Adjust the rgba stop values to control gradient strength */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.93) 100%)' }}
      />

      {/* Top-left tag */}
      {tag && (
        <div className="absolute top-3 left-3">
          <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {tag}
          </span>
        </div>
      )}

      {/* Top-right action slot */}
      {topRightAction && (
        <div className="absolute top-3 right-3">{topRightAction}</div>
      )}

      {/* Bottom content — p-3 on mobile, p-5 on sm+ */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-5 gap-1">
        {/* Title — text-base mobile, text-2xl sm+. Adjust here */}
        <h3 className="text-white font-bold text-base sm:text-2xl leading-tight drop-shadow line-clamp-1">
          {title}
        </h3>

        {/* Description — hidden on mobile (too cramped at 2-col), visible sm+. Adjust text-sm here */}
        {description && (
          <p className="hidden sm:block text-white/80 text-sm line-clamp-2 leading-relaxed">{description}</p>
        )}

        {location && (
          <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
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
          <p className="text-white/55 text-xs mt-0.5">{createdAt}</p>
        )}

        {/* Pill badges row */}
        {(rating !== undefined || duration || status || minGuests !== undefined) && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-1">
            {rating !== undefined && (
              <span className="flex items-center gap-1 sm:gap-1.5 bg-black/45 text-white text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm">
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <Stars rating={rating} />
              </span>
            )}
            {duration && (
              <span className="bg-black/45 text-white text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm font-medium">
                {duration}
              </span>
            )}
            {minGuests !== undefined && minGuests > 1 && (
              <span
                className="flex items-center gap-1 bg-black/45 text-white text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm font-medium"
                title={`Minimum ${minGuests} guests required to book`}
              >
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Min. {minGuests}
              </span>
            )}
            {status}
          </div>
        )}

        {/* Price — prefix text-xs above, amount text-xl mobile / text-2xl sm+. Adjust here */}
        <div className="mt-1 sm:mt-1.5">
          {pricePrefix && (
            <p className="text-white/70 text-xs font-normal leading-none mb-0.5 sm:mb-1">{pricePrefix}</p>
          )}
          <p className="text-white font-bold text-xl sm:text-2xl leading-none">
            ₱{price.toLocaleString()}
          </p>
        </div>

        {/* CTA button — py-2 text-sm mobile, py-3 text-base sm+. Adjust here */}
        {ctaLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCta?.()
            }}
            className="mt-2 sm:mt-3 w-full bg-white text-gray-900 font-semibold text-sm sm:text-base py-2 sm:py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
