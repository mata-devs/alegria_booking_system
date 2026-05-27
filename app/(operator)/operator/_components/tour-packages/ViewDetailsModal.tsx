'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import { packageImageUrl } from '@/app/lib/package-images';
import { formatLocationSummary } from '@/app/lib/package-locations';
import { StarDisplay } from '@/app/(operator)/operator/_components/shared/StarDisplay';
import { StatusBadge } from '@/app/(operator)/operator/_components/shared/StatusBadge';
import type { OperatorPackage } from './types';

export function ViewDetailsModal({
  pkg,
  onClose,
  onEdit,
}: {
  pkg: OperatorPackage;
  onClose: () => void;
  onEdit: (p: OperatorPackage) => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = pkg.packageImages.map((img) => packageImageUrl(img));
  const createdDate =
    pkg.createdAt?.toDate?.()?.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) ?? '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="relative h-56 bg-gray-100 rounded-t-2xl overflow-hidden">
          <Image
            src={images[imgIdx]}
            alt={`${pkg.packageName} ${imgIdx + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute top-3 left-3">
            <StatusBadge status={pkg.status} />
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 px-5 pt-3 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === imgIdx ? 'border-green-500' : 'border-transparent'
                }`}
              >
                <Image src={src} alt={`thumb ${i + 1}`} fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-gray-900 leading-snug">{pkg.packageName}</h2>
            <span className="shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pkg.packageTag}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            {formatLocationSummary(pkg.packageLocations, 10)}
          </div>
          <div className="flex items-center gap-3">
            <StarDisplay rating={pkg.packageRating} />
            <span className="text-xs text-gray-400">{pkg.packageRating.toFixed(1)} rating</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-green-600 font-bold text-lg">₱{pkg.pricePerPerson.toLocaleString()}</span>
            <span className="text-gray-400 text-sm">/ person</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{pkg.duration}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{pkg.packageDescription}</p>
          </div>

          {pkg.packageItinerary.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Itinerary</p>
              <div>
                {pkg.packageItinerary.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center pt-0.5 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                      {i < pkg.packageItinerary.length - 1 && (
                        <div className="w-px flex-1 bg-green-200 mt-1" style={{ minHeight: '2rem' }} />
                      )}
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <p className="text-xs font-bold text-green-600">{step.itineraryTime}</p>
                      <p className="text-xs font-semibold text-gray-800">{step.itineraryTitle}</p>
                      {step.itineraryDescription && (
                        <p className="text-xs text-gray-500 mt-0.5">{step.itineraryDescription}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(pkg.inclusions.length > 0 || pkg.exclusions.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {pkg.inclusions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Included</p>
                  <ul className="space-y-1">
                    {pkg.inclusions.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg
                          className="w-3 h-3 text-green-500 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pkg.exclusions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Excluded</p>
                  <ul className="space-y-1">
                    {pkg.exclusions.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg
                          className="w-3 h-3 text-red-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400">Date created: {createdDate}</p>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(pkg);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );
}
