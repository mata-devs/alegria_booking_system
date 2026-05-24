'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/app/lib/firebase';
import { X, MapPin, Star, ChevronLeft, ChevronRight, Users, Clock, Tag } from 'lucide-react';
import { normalizePackageLocations, formatLocationSummary } from '@/app/lib/package-locations';
import { normalizePackageImages, packageImageUrl } from '@/app/lib/package-images';
import { normalizeActivityTags, formatActivityTagsDisplay, primaryActivityTag } from '@/app/lib/activity-tags';
import { InclusionChipBadges } from '@/app/components/ui/InclusionChipBadges';

interface ItemDetailModalProps {
    itemId: string;
    sourceType: 'activity' | 'tourPackage';
    onClose: () => void;
}

interface ActivityData {
    activityName: string;
    activityDetails: string;
    pricePerGuest: number;
    activityLocation: string;
    activityTag: string;
    activityTags?: unknown;
    activityRating: number;
    activityImages: (string | import('@/app/lib/package-images').PackageImage)[];
    minimumNumberOfPeople?: number;
    maximumNumberOfPeople?: number;
}

interface PackageData {
    packageName: string;
    packageDescription: string;
    pricePerPerson: number;
    packageLocations: string[];
    duration: string;
    inclusions: string[];
    exclusions?: string[];
    packageImages: string[];
    packageTag: string;
    packageRating: number;
    minimumNumberOfPeople?: number;
    maximumNumberOfPeople?: number;
}

const peso = (n: number) =>
    `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ItemDetailModal({ itemId, sourceType, onClose }: ItemDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ActivityData | PackageData | null>(null);
    const [imgIndex, setImgIndex] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const col = sourceType === 'tourPackage' ? 'tourPackages' : 'activities';
                const snap = await getDoc(doc(firestore, col, itemId));
                if (!cancelled && snap.exists()) setData(snap.data() as ActivityData | PackageData);
            } catch {
                // silent
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [itemId, sourceType]);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const isPackage = sourceType === 'tourPackage';
    const pkg = isPackage ? (data as PackageData) : null;
    const act = !isPackage ? (data as ActivityData) : null;

    const images = pkg
      ? normalizePackageImages(pkg.packageImages).map((img) => packageImageUrl(img))
      : normalizePackageImages(act?.activityImages).map((img) => packageImageUrl(img));
    const name = pkg ? pkg.packageName : (act?.activityName ?? '');
    const activityTags = act ? normalizeActivityTags(act.activityTags, act.activityTag) : [];
    const tag = pkg ? pkg.packageTag : (formatActivityTagsDisplay(activityTags) || primaryActivityTag(activityTags));
    const rating = pkg ? pkg.packageRating : (act?.activityRating ?? 0);
    const location = pkg
      ? formatLocationSummary(normalizePackageLocations(pkg))
      : (act?.activityLocation ?? '');
    const price = pkg ? pkg.pricePerPerson : (act?.pricePerGuest ?? 0);
    const description = pkg ? pkg.packageDescription : (act?.activityDetails ?? '');
    const minGuests = pkg ? pkg.minimumNumberOfPeople : act?.minimumNumberOfPeople;
    const maxGuests = pkg ? pkg.maximumNumberOfPeople : act?.maximumNumberOfPeople;

    const prevImg = () => setImgIndex(i => (i - 1 + images.length) % images.length);
    const nextImg = () => setImgIndex(i => (i + 1) % images.length);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                >
                    <X size={16} />
                </button>

                {/* Pull handle (mobile) */}
                <div className="flex justify-center pt-2 pb-0 sm:hidden shrink-0">
                    <div className="h-1 w-10 rounded-full bg-gray-300" />
                </div>

                {/* Image carousel */}
                <div className="relative w-full bg-gray-100 shrink-0" style={{ aspectRatio: '16/9' }}>
                    {loading ? (
                        <div className="h-full w-full animate-pulse bg-gray-200" />
                    ) : images.length > 0 ? (
                        <>
                            <Image
                                src={images[imgIndex]}
                                alt={name}
                                fill
                                sizes="(max-width: 768px) 100vw, 640px"
                                className="object-cover"
                                unoptimized
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImg}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={nextImg}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setImgIndex(i)}
                                                className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                            No photos available
                        </div>
                    )}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-6 w-3/4 animate-pulse rounded-lg bg-gray-200" />
                            <div className="h-4 w-1/2 animate-pulse rounded-lg bg-gray-200" />
                            <div className="h-4 w-full animate-pulse rounded-lg bg-gray-200" />
                            <div className="h-20 animate-pulse rounded-lg bg-gray-200" />
                        </div>
                    ) : data ? (
                        <>
                            {/* Name + tag */}
                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-xl font-extrabold text-gray-900 leading-snug">{name}</h2>
                                    {tag && (
                                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#f0fce0] px-2.5 py-0.5 text-xs font-semibold text-[#558B2F]">
                                            <Tag size={10} />{tag}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                                    {rating > 0 && (
                                        <span className="flex items-center gap-1 font-semibold text-amber-500">
                                            <Star size={13} fill="currentColor" />
                                            {rating.toFixed(1)}
                                        </span>
                                    )}
                                    {location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin size={13} className="text-gray-400" />{location}
                                        </span>
                                    )}
                                    {isPackage && pkg?.duration && (
                                        <span className="flex items-center gap-1">
                                            <Clock size={13} className="text-gray-400" />{pkg.duration}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="rounded-2xl bg-[#f0fce0] border border-[#74C00F]/20 px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Price</p>
                                    <p className="text-2xl font-black text-[#558B2F]">{peso(price)}</p>
                                </div>
                                <span className="text-sm text-gray-500 font-medium">/ person</span>
                            </div>

                            {/* Guest bounds */}
                            {(minGuests || maxGuests) && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Users size={14} className="text-gray-400 shrink-0" />
                                    {minGuests && <span>Min {minGuests}</span>}
                                    {minGuests && maxGuests && <span>·</span>}
                                    {maxGuests && <span>Max {maxGuests}</span>}
                                    <span>guests</span>
                                </div>
                            )}

                            {/* Description */}
                            {description && (
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">About</p>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
                                </div>
                            )}

                            {/* Inclusions (packages only) */}
                            {isPackage && pkg?.inclusions && pkg.inclusions.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Inclusions</p>
                                    <InclusionChipBadges chips={pkg.inclusions} variant="inclusion" />
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="py-10 text-center text-sm text-gray-400">Failed to load details.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
