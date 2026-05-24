'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import {
  DEFAULT_HOMEPAGE_CMS,
  saveHomepageCms,
  subscribeHomepageCms,
  type HomepageCms,
  type HomepageCmsHero,
  type HomepageCmsLocations,
  type HomepageCmsTicker,
} from '@/app/lib/homepage-cms';
import HeroEditor from './_components/HeroEditor';
import TickerEditor from './_components/TickerEditor';
import LocationsEditor from './_components/LocationsEditor';
import PreviewPane from './_components/PreviewPane';

type TabId = 'hero' | 'ticker' | 'locations' | 'preview';

type SaveStatus =
  | { type: 'idle' }
  | { type: 'saving' }
  | { type: 'success'; msg: string }
  | { type: 'error'; msg: string };

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: 'hero', label: 'Hero', icon: Sparkles },
  { id: 'ticker', label: 'Ticker', icon: ImageIcon },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'preview', label: 'Preview', icon: ImageIcon },
];

export default function SiteContentCmsPage() {
  const { authState } = useAuth();

  const [server, setServer] = useState<HomepageCms | null>(null);
  const [draft, setDraft] = useState<HomepageCms | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('hero');
  const [status, setStatus] = useState<SaveStatus>({ type: 'idle' });

  useEffect(() => {
    const unsub = subscribeHomepageCms(
      (cms) => {
        setServer(cms);
        setDraft((current) => current ?? cms);
        setLoadError(null);
      },
      (err) => {
        console.error('homepage_cms subscribe:', err);
        setLoadError('Could not load Site Content. Check your permissions and try again.');
        setServer(DEFAULT_HOMEPAGE_CMS);
        setDraft((current) => current ?? DEFAULT_HOMEPAGE_CMS);
      },
    );
    return () => unsub();
  }, []);

  const dirty = useMemo(() => {
    if (!server || !draft) return false;
    return (
      JSON.stringify({
        hero: server.hero,
        ticker: server.ticker,
        locations: server.locations,
      }) !==
      JSON.stringify({
        hero: draft.hero,
        ticker: draft.ticker,
        locations: draft.locations,
      })
    );
  }, [server, draft]);

  const publishedTickerCount = useMemo(
    () => (draft ? draft.ticker.items.filter((i) => i.published).length : 0),
    [draft],
  );

  const publishedLocationsCount = useMemo(
    () => (draft ? draft.locations.items.filter((i) => i.published).length : 0),
    [draft],
  );

  const validationError = useMemo(() => {
    if (!draft) return null;
    if (draft.ticker.items.length === 0) {
      return 'Ticker: add at least one municipality before saving.';
    }
    if (draft.ticker.items.some((i) => !i.bestPictureUrl)) {
      return 'Ticker: every municipality needs a best picture.';
    }
    if (draft.locations.items.some((i) => !i.imageUrl.trim())) {
      return 'Locations: every row needs an image URL (upload or placeholder).';
    }
    return null;
  }, [draft]);

  const onHeroChange = (hero: HomepageCmsHero) => {
    setDraft((d) => (d ? { ...d, hero } : d));
  };

  const onTickerChange = (ticker: HomepageCmsTicker) => {
    setDraft((d) => (d ? { ...d, ticker } : d));
  };

  const onLocationsChange = (locations: HomepageCmsLocations) => {
    setDraft((d) => (d ? { ...d, locations } : d));
  };

  const onSave = async () => {
    if (!draft || !dirty || validationError) return;
    if (authState.status !== 'authenticated') return;
    setStatus({ type: 'saving' });
    try {
      await saveHomepageCms(
        { hero: draft.hero, ticker: draft.ticker, locations: draft.locations },
        authState.user.uid,
      );
      setStatus({ type: 'success', msg: 'Site content updated.' });
    } catch (err) {
      setStatus({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to save site content.',
      });
    }
  };

  const onDiscard = () => {
    if (!server) return;
    setDraft(server);
    setStatus({ type: 'idle' });
  };

  const loading = !draft || !server;

  return (
    <div className="-m-6 min-h-[calc(100vh-0px)] bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Super Admin</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight text-gray-900">Site content</h1>
        <p className="mt-1 text-xs text-gray-500">
          Curate the guest homepage hero + ticker and the <code className="rounded bg-gray-100 px-1">/locations</code>{' '}
          municipality grid (images, taglines, order).
        </p>
      </header>

      <div className="border-b border-gray-200 bg-white px-6">
        <div className="-mb-px flex gap-2 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-[#558B2F] text-[#558B2F]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" strokeWidth={2} />
                {tab.label}
                {tab.id === 'ticker' && draft && (
                  <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-600">
                    {publishedTickerCount}/{draft.ticker.items.length}
                  </span>
                )}
                {tab.id === 'locations' && draft && (
                  <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-600">
                    {publishedLocationsCount}/{draft.locations.items.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-6 pb-28 md:px-8 md:py-8 md:pb-28">
        <div className="mx-auto max-w-5xl">
          {loadError && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
              <span>{loadError}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-sm text-gray-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={2} />
              Loading…
            </div>
          ) : (
            <>
              {activeTab === 'hero' && (
                <HeroEditor
                  hero={draft.hero}
                  enabled={server?.enabled ?? false}
                  onChange={onHeroChange}
                />
              )}
              {activeTab === 'ticker' && (
                <TickerEditor ticker={draft.ticker} onChange={onTickerChange} />
              )}
              {activeTab === 'locations' && (
                <LocationsEditor locations={draft.locations} onChange={onLocationsChange} />
              )}
              {activeTab === 'preview' && <PreviewPane cms={draft} />}
            </>
          )}
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        status={status}
        validationError={validationError}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </div>
  );
}

type SaveBarProps = {
  dirty: boolean;
  status: SaveStatus;
  validationError: string | null;
  onSave: () => void;
  onDiscard: () => void;
};

function SaveBar({ dirty, status, validationError, onSave, onDiscard }: SaveBarProps) {
  const saving = status.type === 'saving';
  const showInfo = dirty || status.type !== 'idle';
  if (!showInfo) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-6 py-3 shadow-lg backdrop-blur lg:left-56">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          {status.type === 'success' ? (
            <span className="inline-flex items-center gap-1.5 text-green-700">
              <Check className="h-4 w-4" strokeWidth={2.5} />
              {status.msg}
            </span>
          ) : status.type === 'error' ? (
            <span className="inline-flex items-center gap-1.5 text-red-700">
              <TriangleAlert className="h-4 w-4" strokeWidth={2.5} />
              {status.msg}
            </span>
          ) : validationError ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <TriangleAlert className="h-4 w-4" strokeWidth={2.5} />
              {validationError}
            </span>
          ) : (
            <span className="text-gray-700">You have unsaved changes.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={!dirty || saving}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving || Boolean(validationError)}
            className="inline-flex items-center gap-2 rounded-md bg-[#558B2F] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4a7a28] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Saving
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
