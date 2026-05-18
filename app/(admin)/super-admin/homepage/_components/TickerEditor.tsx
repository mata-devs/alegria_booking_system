'use client';

import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import {
  Camera,
  GripVertical,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
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
import {
  TICKER_IMAGE_ALLOWED_TYPES,
  TICKER_IMAGE_MAX_BYTES,
  uploadTickerImage,
  type HomepageCmsTicker,
  type TickerItem,
} from '@/app/lib/homepage-cms';

const LABEL = 'block text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const INPUT =
  'mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]';

type Props = {
  ticker: HomepageCmsTicker;
  onChange: (ticker: HomepageCmsTicker) => void;
};

export default function TickerEditor({ ticker, onChange }: Props) {
  const items = ticker.items;

  const usedSlugs = useMemo(
    () => new Set(items.map((i) => i.municipalitySlug)),
    [items],
  );

  const availableMunicipalities = useMemo(
    () => CEBU_MUNICIPALITIES.filter((m) => !usedSlugs.has(municipalitySlug(m))),
    [usedSlugs],
  );

  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [pendingMunicipality, setPendingMunicipality] = useState<CebuMunicipality | ''>('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const setItems = (next: TickerItem[]) =>
    onChange({
      ...ticker,
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
    const newItem: TickerItem = {
      municipalitySlug: slug,
      displayName: pendingMunicipality,
      bestPictureUrl: `https://picsum.photos/seed/cebu-${slug}/1600/900`,
      caption: '',
      order: items.length,
      published: true,
    };
    setItems([...items, newItem]);
    setPendingMunicipality('');
    setAddPickerOpen(false);
  };

  const onRowChange = (idx: number, patch: Partial<TickerItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setItems(next);
  };

  const onRowDelete = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Ticker rotation</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Drag rows to reorder. Only <strong>Published</strong> rows appear in the live ticker.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Interval
            </label>
            <div className="relative">
              <input
                type="number"
                min={1000}
                max={10000}
                step={250}
                value={ticker.intervalMs}
                onChange={(e) =>
                  onChange({ ...ticker, intervalMs: Math.max(1000, Number(e.target.value) || 1000) })
                }
                className="h-9 w-24 rounded-md border border-gray-200 bg-gray-50 px-2 pr-8 text-sm text-gray-900 outline-none focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                ms
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <ImageIcon className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-700">No municipalities yet.</p>
              <p className="text-xs text-gray-500">
                Add at least two to enable the rotating ticker.
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
                    <SortableTickerRow
                      key={item.municipalitySlug}
                      item={item}
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
                  className="h-10 flex-1 min-w-[200px] rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none focus:border-[#558B2F] focus:bg-white focus:ring-1 focus:ring-[#558B2F]"
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
                  Add to ticker
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
  item: TickerItem;
  onChange: (patch: Partial<TickerItem>) => void;
  onDelete: () => void;
};

function SortableTickerRow({ item, onChange, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.municipalitySlug });

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
      const result = await uploadTickerImage(item.municipalitySlug, file);
      if (!result.ok) {
        setUploadError(
          result.error.kind === 'bad-type'
            ? 'Only JPEG and PNG images are allowed.'
            : `Image must be under ${Math.round(TICKER_IMAGE_MAX_BYTES / 1024 / 1024)} MB.`,
        );
        return;
      }
      onChange({ bestPictureUrl: result.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

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
          {item.bestPictureUrl ? (
            <Image
              src={item.bestPictureUrl}
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

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-900">{item.displayName}</p>
            <div className="flex items-center gap-2">
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
                {item.bestPictureUrl ? 'Change' : 'Upload'} picture
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 transition-colors hover:border-red-300 hover:text-red-600"
                aria-label={`Remove ${item.displayName} from ticker`}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={item.caption ?? ''}
            onChange={(e) => onChange({ caption: e.target.value })}
            maxLength={80}
            placeholder="Optional caption (e.g. World-class diving)"
            className={`${INPUT} h-9`}
          />

          <div className="grid gap-2 sm:grid-cols-[1fr_minmax(0,1fr)]">
            <div>
              <label className={LABEL}>Image attribution</label>
              <input
                type="text"
                value={item.imageAttribution ?? ''}
                onChange={(e) =>
                  onChange({
                    imageAttribution: e.target.value || undefined,
                  })
                }
                maxLength={120}
                placeholder="e.g. Photo: Wikipedia / CC BY-SA 4.0"
                className={`${INPUT} h-9`}
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Shown small at the bottom-right of the hero image.
              </p>
            </div>
            <div>
              <label className={LABEL}>Attribution link (optional)</label>
              <input
                type="url"
                value={item.imageAttributionUrl ?? ''}
                onChange={(e) =>
                  onChange({
                    imageAttributionUrl: e.target.value || undefined,
                  })
                }
                placeholder="https://commons.wikimedia.org/…"
                className={`${INPUT} h-9`}
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Makes the attribution chip clickable (opens in a new tab).
              </p>
            </div>
          </div>

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
