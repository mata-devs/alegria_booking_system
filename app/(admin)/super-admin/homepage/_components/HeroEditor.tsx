'use client';

import Link from 'next/link';
import { ArrowUpRight, CircleAlert, CircleCheck } from 'lucide-react';
import type { HomepageCmsHero } from '@/app/lib/homepage-cms';

const LABEL =
  'block text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const INPUT =
  'mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]';

type Props = {
  hero: HomepageCmsHero;
  enabled: boolean;
  onChange: (hero: HomepageCmsHero) => void;
};

export default function HeroEditor({ hero, enabled, onChange }: Props) {
  const set = <K extends keyof HomepageCmsHero>(key: K, value: HomepageCmsHero[K]) =>
    onChange({ ...hero, [key]: value });

  return (
    <div className="space-y-4">
      <div
        className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
          enabled
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}
      >
        <div className="flex items-start gap-2">
          {enabled ? (
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          <div>
            <p className="font-semibold">
              {enabled ? 'Homepage CMS is enabled.' : 'Homepage CMS is disabled.'}
            </p>
            <p className="mt-0.5 text-xs">
              {enabled
                ? 'The guest landing page renders this CMS content.'
                : 'The guest landing page still uses the default static hero. Enable in Settings to publish.'}
            </p>
          </div>
        </div>
        <Link
          href="/super-admin/settings"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline"
        >
          Manage in Settings
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Hero copy</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Override the eyebrow, headline, and subhead shown above the ticker on the guest
            landing page. Headline supports line breaks (use Enter).
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className={LABEL} htmlFor="hero-eyebrow">
              Eyebrow
            </label>
            <input
              id="hero-eyebrow"
              type="text"
              value={hero.eyebrow}
              onChange={(e) => set('eyebrow', e.target.value)}
              maxLength={80}
              className={`${INPUT} h-10`}
              placeholder="Philippines · Cebu Island"
            />
          </div>

          <div>
            <label className={LABEL} htmlFor="hero-headline">
              Headline
            </label>
            <textarea
              id="hero-headline"
              value={hero.headline}
              onChange={(e) => set('headline', e.target.value)}
              rows={2}
              maxLength={160}
              className={`${INPUT} py-2 leading-tight`}
              placeholder={'Your Gateway to\nTropical Adventure'}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              {hero.headline.length}/160 · Press Enter for a line break.
            </p>
          </div>

          <div>
            <label className={LABEL} htmlFor="hero-subhead">
              Subhead
            </label>
            <textarea
              id="hero-subhead"
              value={hero.subhead}
              onChange={(e) => set('subhead', e.target.value)}
              rows={3}
              maxLength={280}
              className={`${INPUT} py-2`}
              placeholder="Discover the magic of the Philippines' most diverse island province…"
            />
            <p className="mt-1 text-[11px] text-gray-400">{hero.subhead.length}/280</p>
          </div>
        </div>
      </div>
    </div>
  );
}
