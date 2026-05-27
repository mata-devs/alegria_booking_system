'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Pencil } from 'lucide-react';
import { packageImageUrl } from '@/app/lib/package-images';
import { StarDisplay } from '../shared/StarDisplay';
import { StatusBadge } from '../shared/StatusBadge';
import type { OperatorActivity } from './types';

export function ViewDetailsModal({
  activity,
  onClose,
  onEdit,
}: {
  activity: OperatorActivity;
  onClose: () => void;
  onEdit: (a: OperatorActivity) => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = activity.activityImages.map((img) => packageImageUrl(img));
  const createdDate =
    activity.createdAt?.toDate?.()?.toLocaleDateString('en-US', {
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
            alt={`${activity.activityName} ${imgIdx + 1}`}
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
            <StatusBadge status={activity.status} />
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
            <h2 className="text-base font-bold text-gray-900 leading-snug">{activity.activityName}</h2>
            <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[55%]">
              {activity.activityTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            {activity.activityLocation}
          </div>
          <div className="flex items-center gap-3">
            <StarDisplay rating={activity.activityRating} />
            <span className="text-xs text-gray-400">{activity.activityRating.toFixed(1)} rating</span>
          </div>
          <div className="text-green-600 font-bold text-lg">
            ₱{activity.pricePerGuest.toLocaleString()}
            <span className="text-gray-400 text-sm font-normal ml-1">/ guest</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {activity.activityDetails}
            </p>
          </div>

          {(activity.inclusions.length > 0 || activity.exclusions.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {activity.inclusions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Included</p>
                  <ul className="space-y-1">
                    {activity.inclusions.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg
                          className="w-3 h-3 text-green-500 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activity.exclusions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Excluded</p>
                  <ul className="space-y-1">
                    {activity.exclusions.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg
                          className="w-3 h-3 text-red-400 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
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
              onEdit(activity);
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
