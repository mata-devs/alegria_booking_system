'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  GripVertical,
  ImageIcon,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { collection, getDocs, query, where as firestoreWhere } from 'firebase/firestore';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CEBU_MUNICIPALITIES,
  municipalitySlug,
  type CebuMunicipality,
} from '@/app/lib/cebu-municipalities';
import { firebaseDb } from '@/app/lib/firebase';
import {
  buildCountsByMunicipalitySlug,
  TICKER_IMAGE_ALLOWED_TYPES,
  TICKER_IMAGE_MAX_BYTES,
  uploadLocationImage,
  type HomepageCmsLocations,
  type LocationsCmsItem,
} from '@/app/lib/homepage-cms';
import {
  countByActivityLocation,
  countByPackageLocation,
  mergeGuestLocations,
} from '@/app/lib/guest-location-list';
import type { Location } from '@/app/types';

const INPUT =
  'mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]';

type Props = {
  locations: HomepageCmsLocations;
  onChange: (locations: HomepageCmsLocations) => void;
};

export default function LocationsEditor({ locations, onChange }: Props) {
  const items = locations.items;

  const usedSlugs = useMemo(() => new Set(items.map((i) => i.municipalitySlug)), [items]);

  const availableMunicipalities = useMemo(
    () => CEBU_MUNICIPALITIES.filter((m) => !usedSlugs.has(municipalitySlug(m))),
    [usedSlugs],
  );

  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [pendingMunicipality, setPendingMunicipality] = useState<CebuMunicipality | ''>('');

  const [countsBySlug, setCountsBySlug] = useState<
    Map<string, { activityCount: number; packageCount: number }>
  >(new Map());
  const [liveLocations, setLiveLocations] = useState<Location[]>([]);
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    setCountsLoading(true);
    setCountsError(null);
    try {
      const [actSnap, pkgSnap] = await Promise.all([
        getDocs(query(collection(firebaseDb, 'activities'), firestoreWhere('status', '==', 'active'))),
        getDocs(query(collection(firebaseDb, 'tourPackages'), firestoreWhere('status', '==', 'active'))),
      ]);
      const activityByMuni = countByActivityLocation(actSnap);
      const packageByMuni = countByPackageLocation(pkgSnap);
      setCountsBySlug(buildCountsByMunicipalitySlug(activityByMuni, packageByMuni));
      setLiveLocations(mergeGuestLocations(activityByMuni, packageByMuni));
    } catch (e) {
      console.error('LocationsEditor counts:', e);
      setCountsError('Could not load live offer counts.');
      setCountsBySlug(new Map());
      setLiveLocations([]);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const mergedLiveLocations = liveLocations;

  const missingFromCuration = useMemo(() => {
    const curated = new Set(items.map((i) => i.municipalitySlug));
    return mergedLiveLocations.filter((l) => !curated.has(l.id));
  }, [mergedLiveLocations, items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const setItems = (next: LocationsCmsItem[]) =>
    onChange({
      ...locations,
      items: next.map((it, idx) => ({ ...it, order: idx })),
    });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.municipalitySlug === active.id);
    const newIndex = items.findIndex((i) => i.municipalitySlug === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setItems(arrayMove(items, oldIndex, newIndex));
  };

  const onAdd = () => {
    if (!pendingMunicipality) return;
    const slug = municipalitySlug(pendingMunicipality);
    if (usedSlugs.has(slug)) return;
    const newItem: LocationsCmsItem = {
      municipalitySlug: slug,
      displayName: pendingMunicipality,
      imageUrl: `https://picsum.photos/seed/cebu-loc-${slug}/800/600`,
      description: '',
      order: items.length,
      published: true,
    };
    setItems([...items, newItem]);
    setPendingMunicipality('');
    setAddPickerOpen(false);
  };

  const quickAdd = (name: string) => {
    const slug = municipalitySlug(name);
    if (usedSlugs.has(slug)) return;
    const newItem: LocationsCmsItem = {
      municipalitySlug: slug,
      displayName: name,
      imageUrl: `https://picsum.photos/seed/cebu-loc-${slug}/800/600`,
      description: '',
      order: items.length,
      published: true,
    };
    setItems([...items, newItem]);
  };

  const onRowChange = (idx: number, patch: Partial<LocationsCmsItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setItems(next);
  };

  const onRowDelete = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const publishedCount = items.filter((i) => i.published).length;

  return (
    <div className="space-y-4">
      {missingFromCuration.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {missingFromCuration.length === 1
                  ? 'A municipality has active offers but is not on this curated list.'
                  : `${missingFromCuration.length} municipalities have active offers but are not on this curated list.`}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {missingFromCuration.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => quickAdd(l.name)}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                    >
                      <Plus className="h-3 w-3" strokeWidth={2.5} />
                      Add {l.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Locations page</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Curate tiles on <strong>/locations</strong>. Only <strong>Published</strong> rows appear
              to guests. Offer counts update from live activities and tour packages.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              {publishedCount}/{items.length} published
            </span>
            <button
              type="button"
              onClick={() => void loadCounts()}
              disabled={countsLoading}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#558B2F] hover:text-[#558B2F] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${countsLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
              Refresh counts
            </button>
          </div>
        </div>

        {countsError && (
          <div className="border-b border-red-100 bg-red-50 px-6 py-2 text-xs text-red-700">{countsError}</div>
        )}

        <div className="px-6 py-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <MapPin className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-700">No municipalities yet.</p>
              <p className="text-xs text-gray-500">
                Add rows here to curate the guest locations grid. Until you save at least one
                published row, <code className="rounded bg-gray-200 px-1">/locations</code> falls back
                to auto-generated tiles.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.municipalitySlug)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-3">
                  {items.map((item, idx) => (
                    <SortableLocationRow
                      key={item.municipalitySlug}
                      item={item}
                      counts={countsBySlug.get(item.municipalitySlug)}
                      countsLoading={countsLoading}
                      onChange={(patch) => onRowChange(idx, patch)}
                      onDelete={() => onRowDelete(idx)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          <div className="mt-5 border-t border-gray-100 pt-4">
            {addPickerOpen ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={pendingMunicipality}
                  onChange={(e) => setPendingMunicipality(e.target.value as CebuMunicipality | '')}
                  className="h-10 min-w-[200px] flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
                >
                  <option value="">Pick a municipality…</option>
                  {availableMunicipalities.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onAdd}
                  disabled={!pendingMunicipality}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#558B2F] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4a7a28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to list
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddPickerOpen(false);
                    setPendingMunicipality('');
                  }}
                  className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddPickerOpen(true)}
                disabled={availableMunicipalities.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-[#558B2F] hover:text-[#558B2F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Add municipality
                {availableMunicipalities.length === 0 && ' (all added)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type RowProps = {
  item: LocationsCmsItem;
  counts?: { activityCount: number; packageCount: number };
  countsLoading: boolean;
  onChange: (patch: Partial<LocationsCmsItem>) => void;
  onDelete: () => void;
};

function SortableLocationRow({ item, counts, countsLoading, onChange, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.municipalitySlug,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadLocationImage(item.municipalitySlug, file);
      if (!result.ok) {
        setUploadError(
          result.error.kind === 'bad-type'
            ? 'Only JPEG and PNG images are allowed.'
            : `Image must be under ${Math.round(TICKER_IMAGE_MAX_BYTES / 1024 / 1024)} MB.`,
        );
        return;
      }
      onChange({ imageUrl: result.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const ac = counts?.activityCount ?? 0;
  const pc = counts?.packageCount ?? 0;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`relative rounded-md border bg-white p-3 shadow-sm transition-shadow ${
        isDragging ? 'border-[#558B2F] shadow-md' : 'border-gray-200'
      }`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          className="flex h-10 w-6 shrink-0 cursor-grab items-center justify-center rounded text-gray-400 hover:bg-gray-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.displayName}
              fill
              sizes="112px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-4 w-4 animate-spin text-white" strokeWidth={2} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-900">{item.displayName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                {countsLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                ) : (
                  <>
                    {ac} act · {pc} pkg
                  </>
                )}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={item.published}
                  onChange={(e) => onChange({ published: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-[#558B2F] focus:ring-[#558B2F]"
                />
                Published
              </label>
              <button
                type="button"
                onClick={onPickFile}
                disabled={uploading}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#558B2F] hover:text-[#558B2F] disabled:opacity-50"
              >
                <Camera className="h-3 w-3" strokeWidth={2} />
                {item.imageUrl ? 'Change' : 'Upload'} image
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 transition-colors hover:border-red-300 hover:text-red-600"
                aria-label={`Remove ${item.displayName}`}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={item.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value || undefined })}
            maxLength={120}
            placeholder="Short tagline (optional)"
            className={`${INPUT} h-9`}
          />

          {uploadError && (
            <div className="flex items-center gap-1 text-[11px] text-red-600">
              <TriangleAlert className="h-3 w-3" strokeWidth={2} />
              {uploadError}
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={TICKER_IMAGE_ALLOWED_TYPES.join(',')}
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    </li>
  );
}
