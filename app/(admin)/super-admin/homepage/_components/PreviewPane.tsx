'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Eye, Play } from 'lucide-react';
import type { HomepageCms } from '@/app/lib/homepage-cms';

type Props = {
  cms: HomepageCms;
};

/**
 * Lightweight preview of the guest hero. Uses the same continuous-loop primitive as the
 * production `<MunicipalityTicker>`:
 *  - 5 stacked clones of the published list.
 *  - `position` is a monotonic counter; on `transitionend` we silently subtract `N` to
 *    teleport back to an equivalent slot in the middle clone with `transition: none`.
 *  - Result: the admin sees the same truly continuous forward motion guests will see.
 */

const LINE_HEIGHT_PX = 44;
const VISIBLE_ROWS = 7;
const COPIES = 5;
const MIDDLE_COPY_INDEX = Math.floor(COPIES / 2);

export default function PreviewPane({ cms }: Props) {
  const published = useMemo(
    () => cms.ticker.items.filter((i) => i.published && i.bestPictureUrl),
    [cms.ticker.items],
  );

  const N = published.length;
  const useLoop = N >= 2;
  const initialPosition = useLoop ? N * MIDDLE_COPY_INDEX : 0;
  const snapAt = useLoop ? N * (MIDDLE_COPY_INDEX + 1) : Infinity;

  const [position, setPosition] = useState(initialPosition);
  const [animEnabled, setAnimEnabled] = useState(true);

  const loopedItems = useMemo(
    () => (useLoop ? Array.from({ length: COPIES }, () => published).flat() : published),
    [published, useLoop],
  );

  useEffect(() => {
    setAnimEnabled(false);
    setPosition(initialPosition);
  }, [initialPosition]);

  useEffect(() => {
    if (!useLoop) return;
    const t = setInterval(
      () => setPosition((p) => p + 1),
      Math.max(1000, cms.ticker.intervalMs),
    );
    return () => clearInterval(t);
  }, [useLoop, cms.ticker.intervalMs]);

  useEffect(() => {
    if (animEnabled) return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimEnabled(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [animEnabled]);

  const onTransitionEnd = (e: React.TransitionEvent<HTMLUListElement>) => {
    if (e.propertyName !== 'transform') return;
    if (!useLoop || position < snapAt) return;
    setAnimEnabled(false);
    setPosition((p) => p - N);
  };

  const offset = Math.floor(VISIBLE_ROWS / 2);
  const activeSourceIndex = N > 0 ? ((position % N) + N) % N : 0;
  const active = published[activeSourceIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Eye className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
        <p>
          Live preview of the unsaved draft. Click <strong>Save changes</strong> at the bottom of
          the page to publish.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-black shadow-sm">
        <div className="relative aspect-[16/9] w-full">
          {N === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-sm text-gray-400">
              Add at least one published municipality with a best picture to preview the ticker.
            </div>
          ) : (
            <>
              {published.map((it, i) => (
                <Image
                  key={it.municipalitySlug}
                  src={it.bestPictureUrl}
                  alt={i === activeSourceIndex ? it.displayName : ''}
                  fill
                  sizes="(max-width: 1024px) 100vw, 960px"
                  className="object-cover transition-opacity duration-700"
                  style={{ opacity: i === activeSourceIndex ? 1 : 0 }}
                  unoptimized
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

              {active?.imageAttribution && (
                <div className="pointer-events-none absolute bottom-3 right-3 z-30 inline-flex max-w-[60%] items-center gap-1 rounded-md bg-black/45 px-2 py-0.5 text-[9px] font-medium leading-tight text-white/90 shadow-md backdrop-blur-sm sm:text-[10px]">
                  <span aria-hidden className="text-white/70">📷</span>
                  <span className="truncate" title={active.imageAttribution}>
                    {active.imageAttribution}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 grid grid-cols-1 items-center px-6 sm:px-10 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:gap-8">
                <div className="max-w-md space-y-2 text-left text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-300">
                    {cms.hero.eyebrow}
                  </p>
                  <h2 className="whitespace-pre-line text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
                    {cms.hero.headline}
                  </h2>
                  <p className="max-w-md text-[11px] text-white/80 sm:text-xs">
                    {cms.hero.subhead}
                  </p>
                  {active?.caption && (
                    <p className="text-[10px] font-medium text-green-300/90 sm:text-[11px]">
                      {active.caption}
                    </p>
                  )}
                </div>

                <div
                  className="relative hidden md:block"
                  style={{ height: VISIBLE_ROWS * LINE_HEIGHT_PX }}
                >
                  <div
                    className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-y-1/2 text-green-400"
                    aria-hidden
                  >
                    <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                  </div>
                  <div
                    className="relative overflow-hidden"
                    style={{ height: VISIBLE_ROWS * LINE_HEIGHT_PX }}
                  >
                    <ul
                      className="absolute inset-x-0"
                      onTransitionEnd={onTransitionEnd}
                      style={{
                        transform: `translateY(${-(position - offset) * LINE_HEIGHT_PX}px)`,
                        transition: animEnabled ? 'transform 700ms ease-in-out' : 'none',
                        willChange: 'transform',
                      }}
                    >
                      {loopedItems.map((it, i) => {
                        const distance = Math.abs(i - position);
                        const isActive = i === position;
                        const opacity = isActive ? 1 : Math.max(0.15, 0.7 - distance * 0.18);
                        return (
                          <li
                            key={`${it.municipalitySlug}-${i}`}
                            style={{ height: LINE_HEIGHT_PX, opacity }}
                            className={`flex items-center pl-6 pr-4 text-left font-extrabold tracking-tight transition-colors ${
                              isActive ? 'text-white' : 'text-white/70'
                            }`}
                          >
                            <span className="truncate text-lg sm:text-xl">
                              {it.displayName}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-500">
        Rotation interval: {cms.ticker.intervalMs} ms · {N} published ·{' '}
        {cms.ticker.items.length - N} drafted
      </p>
    </div>
  );
}
