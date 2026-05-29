'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { TourGuide } from '@/app/types'
import CertificationBadges from '@/app/components/CertificationBadges'
import CertificationsModal from '@/app/components/CertificationsModal'

interface Props {
  guide: TourGuide
}

export default function TourGuideCard({ guide }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 hover:cursor-pointer flex flex-col">
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
