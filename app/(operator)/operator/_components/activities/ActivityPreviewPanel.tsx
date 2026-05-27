'use client';

import Image from 'next/image';
import { InclusionChipBadges } from '@/app/components/ui/InclusionChipBadges';
import type { AddFormState, ImageSlot } from './types';
export function ActivityPreviewPanel({
  form,
  images,
  isMobile,
}: {
  form: AddFormState;
  images: ImageSlot[];
  isMobile: boolean;
}) {
  const imgSrcs = images.map((s) => (s.kind === 'existing' ? s.url : s.preview));

  const displayName = form.activityName || 'Activity Name';
  const displayDetails = form.activityDetails || 'Activity details will appear here.';
  const displayLocation = form.activityLocation || 'Location';
  const displayPrice = parseFloat(form.pricePerGuest) || 0;
  const displayMax = Number(form.maximumNumberOfPeople) || 30;

  const heroImgs = imgSrcs.slice(0, 3);

  const StarRow = ({ size = 'sm' }: { size?: 'sm' | 'xs' }) => {
    const cls = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(s => (
          <svg key={s} className={`${cls} text-gray-200`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const StackedPhotos = ({ scale }: { scale: number }) => {
    const s = (n: number) => Math.round(n * scale);
    return (
      <div style={{ position: 'relative', width: s(380), height: s(380) }}>
        {/* Image 1 — back right, rotated */}
        <div style={{ position: 'absolute', top: s(28), right: 0, zIndex: 1, width: s(255), height: s(255), borderRadius: s(22), overflow: 'hidden', transform: 'rotate(-5deg)', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', background: '#e5e7eb' }}>
          {heroImgs[0]
            ? <Image src={heroImgs[0]} alt="" fill sizes={`${s(255)}px`} className="object-cover" />
            : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><span className="text-[9px] text-gray-400">Photo 1</span></div>
          }
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(17,24,39,0.7)', color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(images[0]?.title || displayLocation).toUpperCase()}
          </div>
        </div>
        {/* Image 2 — front left */}
        <div style={{ position: 'absolute', bottom: s(32), left: 0, zIndex: 2, width: s(248), height: s(248), borderRadius: s(22), overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.18)', background: '#e5e7eb' }}>
          {heroImgs[1]
            ? <Image src={heroImgs[1]} alt="" fill sizes={`${s(248)}px`} className="object-cover" />
            : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><span className="text-[9px] text-gray-400">Photo 2</span></div>
          }
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(17,24,39,0.7)', color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(images[1]?.title || form.activityTags[1] || form.activityTags[0] || '').toUpperCase()}
          </div>
        </div>
        {/* Image 3 — small bottom right */}
        {(heroImgs[2] || imgSrcs.length === 0) && (
          <div style={{ position: 'absolute', bottom: 0, right: s(16), zIndex: 3, width: s(140), height: s(140), borderRadius: s(18), overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.18)', background: '#e5e7eb' }}>
            {heroImgs[2]
              ? <Image src={heroImgs[2]} alt="" fill sizes={`${s(140)}px`} className="object-cover" />
              : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><span className="text-[9px] text-gray-400">Photo 3</span></div>
            }
            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(17,24,39,0.7)', color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {images[2]?.title
                ? images[2].title.toUpperCase()
                : imgSrcs.length > 2
                  ? `${imgSrcs.length} PHOTOS`
                  : displayLocation.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const TagRow = () => (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      {form.activityTags.length > 0 ? form.activityTags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full">
          ★ {tag}
        </span>
      )) : (
        <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-400 text-[10px] font-bold px-2.5 py-1.5 rounded-full">★ Tag</span>
      )}
      <span className="inline-flex items-center gap-1 border border-gray-300 text-gray-600 text-[10px] font-medium px-2.5 py-1.5 rounded-full">
        <svg className="w-2.5 h-2.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Free cancellation
      </span>
    </div>
  );

  const MetaRow = ({ size = 'sm' }: { size?: 'sm' | 'xs' }) => (
    <div className="flex flex-wrap items-center gap-3 text-gray-500" style={{ fontSize: size === 'xs' ? 11 : 13 }}>
      <div className="flex items-center gap-1.5">
        <StarRow size={size === 'xs' ? 'xs' : 'sm'} />
        <span className="font-bold text-gray-900">0.0</span>
      </div>
      <span className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        {displayLocation}
      </span>
      <span className="flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
        English, Filipino
      </span>
    </div>
  );

  const StatsBar = () => (
    <div className="border-b border-gray-100 overflow-x-auto bg-white">
      <div className="flex items-stretch divide-x divide-gray-100 min-w-max lg:min-w-0">
        {[
          { label: 'Location',   value: displayLocation },
          { label: 'Group size', value: `Up to ${displayMax}` },
          { label: 'Category',   value: form.activityTags.join(' · ') || '—' },
          { label: 'From',       value: displayPrice ? `₱${displayPrice.toLocaleString()} / pax` : '₱— / pax' },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 px-4 py-3 text-center min-w-[90px]">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
            <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const BookingSidebar = () => (
    <div className="w-56 shrink-0 self-start sticky top-4">
      <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.10)] ring-1 ring-gray-100 p-5">
        <p className="text-[10px] text-gray-400 mb-0.5">From</p>
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className="text-2xl font-extrabold text-gray-900">₱{displayPrice ? displayPrice.toLocaleString() : '—'}</span>
        </div>
        <p className="text-[10px] text-gray-400 mb-1">per adult · taxes included</p>
        <span className="inline-flex items-center gap-1 text-green-600 text-[10px] font-semibold mb-4">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Free cancel
        </span>
        <div className="border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 mb-3 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-xs text-gray-400">dd/mm/yyyy</span>
        </div>
        <div className="border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 flex items-center justify-between mb-4">
          <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Travelers (10+)</span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-sm leading-none">−</span>
            <span className="text-xs font-semibold text-gray-800">1</span>
            <span className="w-6 h-6 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-sm leading-none">+</span>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3 mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>1 adult × ₱{displayPrice ? displayPrice.toLocaleString() : '—'}</span>
            <span>₱{displayPrice ? displayPrice.toLocaleString() : '—'}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-sm">
            <span>Total</span>
            <span>₱{displayPrice ? displayPrice.toLocaleString() : '—'}</span>
          </div>
        </div>
        <button type="button" className="w-full bg-green-500 text-white font-bold py-3 rounded-full text-xs shadow-md">
          Reserve now →
        </button>
        <p className="text-center text-[9px] text-gray-400 mt-2">Reserve now · pay nothing today</p>
      </div>
    </div>
  );

  const ContentSections = () => (
    <>
      {/* 01 About */}
      <div className="py-8 border-b border-gray-100">
        <div className="flex items-baseline gap-4 mb-5">
          <span className="text-4xl font-extrabold text-gray-100 leading-none select-none">01</span>
          <h3 className="text-lg font-extrabold text-gray-900">About this activity</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-8">{displayDetails}</p>
      </div>

      {/* 02 What's included */}
      <div className="py-8 border-b border-gray-100">
        <div className="flex items-baseline gap-4 mb-5">
          <span className="text-4xl font-extrabold text-gray-100 leading-none select-none">02</span>
          <h3 className="text-lg font-extrabold text-gray-900">What&apos;s included</h3>
        </div>
        {(form.inclusions.length > 0 || form.exclusions.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {form.inclusions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-3">Included</p>
                <InclusionChipBadges chips={form.inclusions} variant="inclusion" />
              </div>
            )}
            {form.exclusions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-3">Not included</p>
                <InclusionChipBadges chips={form.exclusions} variant="exclusion" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Select inclusions and exclusions in the form to see them here.</p>
        )}
      </div>

      {/* 03 Reviews placeholder */}
      <div className="py-8 border-b border-gray-100">
        <div className="flex items-baseline gap-4 mb-5">
          <span className="text-4xl font-extrabold text-gray-100 leading-none select-none">03</span>
          <h3 className="text-lg font-extrabold text-gray-900">Reviews · 0.0★</h3>
        </div>
        <div className="flex items-center gap-6 mb-5">
          <div className="flex flex-col items-center">
            <span className="text-5xl font-extrabold text-gray-900 leading-none">0.0</span>
            <StarRow />
            <p className="text-[10px] text-gray-400 mt-1">Based on 0 ratings</p>
          </div>
          <div className="flex-1 space-y-2.5">
            {['Guide','Value','Safety','Fun'].map(l => (
              <div key={l} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-12 shrink-0">{l}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: '20%' }} /></div>
                <span className="text-xs font-semibold text-gray-800 w-6 text-right">1.0</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 italic">No reviews yet. Be the first!</p>
        <p className="text-xs text-gray-400 mt-2">Had a great experience? <span className="text-green-600 font-medium">Book to leave a review →</span></p>
      </div>

      {/* 04 FAQ */}
      <div className="py-8">
        <div className="flex items-baseline gap-4 mb-5">
          <span className="text-4xl font-extrabold text-gray-100 leading-none select-none">04</span>
          <h3 className="text-lg font-extrabold text-gray-900">Frequently asked</h3>
        </div>
        <div className="border-t border-gray-100">
          {['What should I bring?','Is the activity suitable for kids?','What is the cancellation policy?','Is hotel pickup included?'].map((q) => (
            <div key={q} className="flex items-center justify-between py-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-900">{q}</span>
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className={`${isMobile ? 'max-w-[390px] mx-auto shadow-[0_0_0_1px_rgba(0,0,0,0.07)]' : 'w-full'} bg-white min-h-full`}>

      {/* ── Hero ── */}
      <div className="bg-[#f8faf8] border-b border-gray-100">
        <div className="px-5 lg:px-7 py-7 lg:py-10">
          {isMobile ? (
            // Mobile: stacked photos top, text below
            <>
              <div className="flex justify-center mb-6 py-2">
                <StackedPhotos scale={0.56} />
              </div>
              <TagRow />
              <h2 className="text-2xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">{displayName}</h2>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-5">{displayDetails}</p>
              <MetaRow size="xs" />
            </>
          ) : (
            // Desktop: text left, stacked photos right
            <div className="grid grid-cols-2 gap-10 items-center">
              <div>
                <TagRow />
                <h2 className="text-[1.9rem] font-extrabold text-gray-900 leading-tight tracking-tight mb-4">{displayName}</h2>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6">{displayDetails}</p>
                <MetaRow />
              </div>
              <div className="flex items-center justify-center py-3">
                <StackedPhotos scale={0.72} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <StatsBar />

      {/* ── Main content ── */}
      {isMobile ? (
        <div className="px-5 py-4 pb-20">
          <ContentSections />
        </div>
      ) : (
        <div className="px-7 py-4 pb-12 flex gap-12">
          <div className="flex-1 min-w-0">
            <ContentSections />
          </div>
          <BookingSidebar />
        </div>
      )}

      {/* Mobile sticky bottom bar */}
      {isMobile && (
        <div className="border-t border-gray-100 bg-white shadow-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 leading-none mb-0.5">Price per guest</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-gray-900">₱{displayPrice ? displayPrice.toLocaleString() : '—'}</span>
              <span className="text-xs text-gray-400">/ person</span>
            </div>
          </div>
          <button type="button" className="flex items-center gap-2 bg-green-500 text-white font-bold px-5 py-3 rounded-full text-sm shadow-md shrink-0">
            Book This Activity
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
