'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { TourGuide } from '@/app/types'
import { Lightbox } from '@/app/components/ui/BentoGallery'
import type { LightboxImage } from '@/app/components/ui/BentoGallery'

interface Props {
  guide: TourGuide
  onClose: () => void
}

export default function CertificationsModal({ guide, onClose }: Props) {
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

          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 bg-gray-100">
              <Image src={guide.photo} alt={guide.name} fill className="object-cover" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-tight">{guide.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{guide.location}</p>
            </div>
          </div>

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
