'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';
import Image from 'next/image';
import { Plus, Search, SlidersHorizontal, X, Upload, ChevronLeft, ChevronRight, Pencil, Trash2, LayoutGrid, Table as TableIcon, GripVertical } from 'lucide-react';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import PackageCard from '@/app/components/ui/PackageCard';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { firebaseDb, firebaseStorage } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';
import { ACTIVITY_TAGS, type ActivityTag, type StoredActivityTag } from '@/app/lib/activity-tags';
import { CEBU_MUNICIPALITIES } from '@/app/lib/cebu-municipalities';
import { MunicipalityMultiSelect } from '@/app/components/ui/MunicipalityMultiSelect';
import { ChipGridSelector } from '@/app/components/ui/ChipGridSelector';
import {
  DEFAULT_EXCLUSION_CHIPS,
  DEFAULT_INCLUSION_CHIPS,
} from '@/app/lib/inclusion-chips';
import { normalizePackageLocations, formatLocationSummary } from '@/app/lib/package-locations';
import { normalizePackageImages, packageImageUrl, type PackageImage } from '@/app/lib/package-images';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    tdClassName?: string;
    thClassName?: string;
  }
}

type PackageStatus = 'active' | 'disabled';

const MIN_IMAGES = 3;
const MAX_IMAGES = 5;
const MAX_SIZE_MB = 5;

interface ItineraryStep {
  itineraryTime: string;
  itineraryTitle: string;
  itineraryDescription: string;
}

interface OperatorPackage {
  id: string;
  packageName: string;
  packageDescription: string;
  pricePerPerson: number;
  priceAdult?: number;
  priceChild?: number;
  childAgeMax?: number;
  minimumNumberOfPeople: number;
  maximumNumberOfPeople: number;
  packageLocations: string[];
  duration: string;
  inclusions: string[];
  exclusions: string[];
  packageItinerary: ItineraryStep[];
  packageImages: PackageImage[];
  packageTag: StoredActivityTag;
  packageRating: number;
  status: PackageStatus;
  operatorId: string;
  slug: string;
  createdAt: Timestamp | null;
}

interface Filters {
  status: 'all' | PackageStatus;
  location: string;
  priceMin: string;
  priceMax: string;
  tag: ActivityTag | '';
}

const EMPTY_FILTERS: Filters = { status: 'all', location: '', priceMin: '', priceMax: '', tag: '' };

function generateSlug(locations: string[], docId: string): string {
  const primary = locations[0] ?? 'package';
  const loc = primary.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${loc}-${docId.slice(0, 6)}`;
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: PackageStatus }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
      status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {status === 'active' ? 'Active' : 'Disabled'}
    </span>
  );
}

// ── Municipality Combobox ───────────────────────────────────────

function MunicipalityCombobox({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CEBU_MUNICIPALITIES.filter((m) => m.toLowerCase().includes(q));
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (m: string) => { onChange(m); setSearch(m); setOpen(false); };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); onChange(''); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        placeholder="Search municipality…"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto max-h-[200px]">
          {suggestions.map((m) => (
            <li key={m} onMouseDown={(e) => { e.preventDefault(); select(m); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 ${m === value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
              {m}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── Tag Combobox ────────────────────────────────────────────────

function TagCombobox({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [search, setSearch] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ACTIVITY_TAGS.filter((t) => t.toLowerCase().includes(q));
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (t: string) => { onChange(t); setSearch(t); setOpen(false); };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); onChange(''); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        placeholder="Search tag…"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-y-auto max-h-[200px]">
          {suggestions.map((t) => (
            <li key={t} onMouseDown={(e) => { e.preventDefault(); select(t); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 ${t === value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
              {t}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── Dynamic List Input ──────────────────────────────────────────

function DynamicList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const add = () => onChange([...items, '']);
  const update = (i: number, v: string) => onChange(items.map((item, idx) => idx === i ? v : item));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-green-600 font-medium hover:text-green-700 flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" />
        Add item
      </button>
    </div>
  );
}

// ── Itinerary Editor ────────────────────────────────────────────

function ItineraryEditor({ steps, onChange }: { steps: ItineraryStep[]; onChange: (v: ItineraryStep[]) => void }) {
  const add = () => onChange([...steps, { itineraryTime: '', itineraryTitle: '', itineraryDescription: '' }]);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof ItineraryStep, v: string) =>
    onChange(steps.map((s, idx) => idx === i ? { ...s, [field]: v } : s));

  return (
    <div>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center pt-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white ring-1 ring-green-400 z-10 shrink-0" />
              {i < steps.length - 1 && (
                <div className="w-px bg-green-200 mt-1" style={{ minHeight: '4.5rem' }} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-start gap-2 mb-2">
                <input
                  type="text"
                  value={step.itineraryTime}
                  onChange={(e) => update(i, 'itineraryTime', e.target.value)}
                  placeholder="e.g. 06:00 AM"
                  className="w-32 shrink-0 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 font-mono"
                />
                <input
                  type="text"
                  value={step.itineraryTitle}
                  onChange={(e) => update(i, 'itineraryTitle', e.target.value)}
                  placeholder="Step title"
                  className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={step.itineraryDescription}
                onChange={(e) => update(i, 'itineraryDescription', e.target.value)}
                placeholder="Describe this step…"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="text-xs text-green-600 font-medium hover:text-green-700 flex items-center gap-1 mt-1">
        <Plus className="w-3.5 h-3.5" />
        Add step
      </button>
    </div>
  );
}

function OperatorPackageCard({ pkg, onViewDetails }: { pkg: OperatorPackage; onViewDetails: (p: OperatorPackage) => void }) {
  const createdDate = pkg.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) ?? '—';
  return (
    <PackageCard
      image={packageImageUrl(pkg.packageImages[0])}
      title={pkg.packageName}
      price={pkg.pricePerPerson}
      pricePrefix=""
      tag={pkg.packageTag}
      duration={pkg.duration}
      rating={pkg.packageRating}
      location={formatLocationSummary(pkg.packageLocations)}
      createdAt={`Created: ${createdDate}`}
      minGuests={pkg.minimumNumberOfPeople ?? 1}
      status={<StatusBadge status={pkg.status} />}
      ctaLabel="View Details"
      onCta={() => onViewDetails(pkg)}
    />
  );
}

// ── View Details Modal ──────────────────────────────────────────

function ViewDetailsModal({ pkg, onClose, onEdit }: { pkg: OperatorPackage; onClose: () => void; onEdit: (p: OperatorPackage) => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = pkg.packageImages.map((img) => packageImageUrl(img));
  const createdDate = pkg.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) ?? '—';

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
              <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute top-3 left-3"><StatusBadge status={pkg.status} /></div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 px-5 pt-3 overflow-x-auto">
            {images.map((src, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-green-500' : 'border-transparent'}`}>
                <Image src={src} alt={`thumb ${i + 1}`} fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-gray-900 leading-snug">{pkg.packageName}</h2>
            <span className="shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">{pkg.packageTag}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
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
                        <svg className="w-3 h-3 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <svg className="w-3 h-3 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <button onClick={onClose}
            className="flex-1 py-2 text-sm font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button onClick={() => { onClose(); onEdit(pkg); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Pencil className="w-4 h-4" />
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sortable image slot ─────────────────────────────────────────

type ImageSlot =
  | { id: string; kind: 'existing'; url: string; title: string; description: string }
  | { id: string; kind: 'new'; file: File; preview: string; title: string; description: string };

function SortableImageCard({
  slot,
  onRemove,
  onUpdate,
}: {
  slot: ImageSlot;
  onRemove: () => void;
  onUpdate: (patch: Partial<Pick<ImageSlot, 'title' | 'description'>>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.75 : 1,
  };
  const src = slot.kind === 'existing' ? slot.url : slot.preview;
  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-200">
          <Image src={src} alt="Package image" fill sizes="80px" className="object-cover" />
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="absolute top-0.5 left-0.5 bg-black/40 text-white rounded-full p-0.5 cursor-grab active:cursor-grabbing hover:bg-black/60"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={slot.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="e.g. Oslob Whale Watching"
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Description</label>
            <textarea
              value={slot.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
              placeholder="Short caption for this image"
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 bg-black/5 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full p-1 transition-colors"
          aria-label="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PackageImagesEditor({
  images,
  errors,
  fileInputRef,
  sensors,
  onDragEnd,
  onImageChange,
  onRemove,
  onUpdate,
}: {
  images: ImageSlot[];
  errors?: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<ImageSlot, 'title' | 'description'>>) => void;
}) {
  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={images.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="space-y-2 mb-2">
            {images.map((slot) => (
              <SortableImageCard
                key={slot.id}
                slot={slot}
                onRemove={() => onRemove(slot.id)}
                onUpdate={(patch) => onUpdate(slot.id, patch)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center gap-2 py-3 text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm">Add image</span>
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onImageChange} />
      {errors && <p className="text-red-500 text-xs mt-1">{errors}</p>}
    </div>
  );
}

// ── Add Package Modal ───────────────────────────────────────────

interface AddFormState {
  packageName: string;
  packageDescription: string;
  pricePerPerson: string;
  priceAdult: string;
  priceChild: string;
  childAgeMax: string;
  minimumNumberOfPeople: string;
  maximumNumberOfPeople: string;
  packageLocations: string[];
  duration: string;
  packageTag: ActivityTag | '';
  inclusions: string[];
  exclusions: string[];
  packageItinerary: ItineraryStep[];
}

const EMPTY_FORM: AddFormState = {
  packageName: '',
  packageDescription: '',
  pricePerPerson: '',
  priceAdult: '',
  priceChild: '',
  childAgeMax: '',
  minimumNumberOfPeople: '1',
  maximumNumberOfPeople: '10',
  packageLocations: [],
  duration: '',
  packageTag: '',
  inclusions: [],
  exclusions: [],
  packageItinerary: [],
};

type AddFormErrors = Partial<Record<keyof AddFormState | 'images' | 'minimumNumberOfPeople' | 'maximumNumberOfPeople', string>>;

function AddPackageModal({ onClose, operatorId }: { onClose: () => void; operatorId: string }) {
  const { authState } = useAuth();
  const customInclusionChips = authState.status === 'authenticated' ? (authState.profile.customInclusionChips ?? []) : [];
  const customExclusionChips = authState.status === 'authenticated' ? (authState.profile.customExclusionChips ?? []) : [];

  async function persistCustomChip(kind: 'inclusion' | 'exclusion', chip: string) {
    if (authState.status !== 'authenticated') return;
    const field = kind === 'inclusion' ? 'customInclusionChips' : 'customExclusionChips';
    const current = kind === 'inclusion' ? customInclusionChips : customExclusionChips;
    if (current.includes(chip)) return;
    await updateDoc(doc(firebaseDb, 'users', authState.user.uid), {
      [field]: [...current, chip],
    });
  }

  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [errors, setErrors] = useState<AddFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.slice(0, MAX_IMAGES - images.length);
    if (toAdd.some((f) => f.size > MAX_SIZE_MB * 1024 * 1024)) {
      setErrors((prev) => ({ ...prev, images: `Each image must be under ${MAX_SIZE_MB} MB.` }));
      e.target.value = '';
      return;
    }
    setErrors((prev) => ({ ...prev, images: undefined }));
    const newSlots: ImageSlot[] = toAdd.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      kind: 'new' as const,
      file,
      preview: URL.createObjectURL(file),
      title: '',
      description: '',
    }));
    setImages((prev) => [...prev, ...newSlots]);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const slot = prev.find((s) => s.id === id);
      if (slot?.kind === 'new') URL.revokeObjectURL(slot.preview);
      return prev.filter((s) => s.id !== id);
    });
  };

  const updateImage = (id: string, patch: Partial<Pick<ImageSlot, 'title' | 'description'>>) => {
    setImages((prev) => prev.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setImages((prev) => {
      const oldIdx = prev.findIndex((s) => s.id === active.id);
      const newIdx = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const validate = (): boolean => {
    const e: AddFormErrors = {};
    if (!form.packageName.trim()) e.packageName = 'Required';
    if (!form.packageDescription.trim()) e.packageDescription = 'Required';
    if (!form.pricePerPerson || Number(form.pricePerPerson) <= 0) e.pricePerPerson = 'Enter a valid price';
    if (!form.minimumNumberOfPeople || Number(form.minimumNumberOfPeople) < 1) e.minimumNumberOfPeople = 'Minimum 1';
    if (!form.maximumNumberOfPeople || Number(form.maximumNumberOfPeople) < 1) e.maximumNumberOfPeople = 'Minimum 1';
    if (Number(form.maximumNumberOfPeople) < Number(form.minimumNumberOfPeople)) e.maximumNumberOfPeople = 'Must be ≥ minimum';
    if (!form.packageLocations.length)
      e.packageLocations = 'Select at least one municipality';
    else if (!form.packageLocations.every((m) => (CEBU_MUNICIPALITIES as readonly string[]).includes(m)))
      e.packageLocations = 'Select valid municipalities';
    if (!form.duration.trim()) e.duration = 'Required';
    if (!form.packageTag) e.packageTag = 'Select a tag';
    if (images.length < MIN_IMAGES) e.images = `At least ${MIN_IMAGES} images required (${images.length}/${MIN_IMAGES})`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const imageEntries: PackageImage[] = [];
      for (const slot of images) {
        if (slot.kind === 'new') {
          const compressed = await compressImage(slot.file);
          const storageRef = ref(firebaseStorage, `tour-packages/${operatorId}/${Date.now()}_${slot.file.name}`);
          await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' });
          imageEntries.push({
            url: await getDownloadURL(storageRef),
            title: slot.title.trim(),
            description: slot.description.trim(),
          });
        }
      }
      const docRef = doc(collection(firebaseDb, 'tourPackages'));
      const slug = generateSlug(form.packageLocations, docRef.id);
      await setDoc(docRef, {
        packageName: form.packageName.trim(),
        packageDescription: form.packageDescription.trim(),
        pricePerPerson: parseFloat(form.pricePerPerson),
        ...(form.priceAdult ? { priceAdult: parseFloat(form.priceAdult) } : {}),
        ...(form.priceChild ? { priceChild: parseFloat(form.priceChild) } : {}),
        ...(form.childAgeMax ? { childAgeMax: Number(form.childAgeMax) } : {}),
        minimumNumberOfPeople: Number(form.minimumNumberOfPeople),
        maximumNumberOfPeople: Number(form.maximumNumberOfPeople),
        packageLocations: form.packageLocations,
        duration: form.duration.trim(),
        packageTag: form.packageTag,
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        packageItinerary: form.packageItinerary.filter((s) => s.itineraryTitle.trim()),
        packageImages: imageEntries,
        packageRating: 0,
        status: 'active',
        operatorId,
        slug,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, images: 'Upload failed. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const field = <K extends keyof AddFormState>(k: K, v: AddFormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Add Tour Package</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Package Name</label>
            <input type="text" value={form.packageName} onChange={(e) => field('packageName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="e.g. Southern Cebu Adventure" />
            {errors.packageName && <p className="text-red-500 text-xs mt-1">{errors.packageName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea value={form.packageDescription} onChange={(e) => field('packageDescription', e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              placeholder="Describe the package experience…" />
            {errors.packageDescription && <p className="text-red-500 text-xs mt-1">{errors.packageDescription}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price per Person (₱) — Flat Rate</label>
              <input type="number" min="0" value={form.pricePerPerson} onChange={(e) => field('pricePerPerson', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="e.g. 4500" />
              {errors.pricePerPerson && <p className="text-red-500 text-xs mt-1">{errors.pricePerPerson}</p>}
              <p className="text-xs text-gray-400 mt-1">Or set separate adult/child prices below (optional)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
              <input type="text" value={form.duration} onChange={(e) => field('duration', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="e.g. 2 Days / 1 Night" />
              {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Adult Price (₱)</label>
              <input type="number" min="0" value={form.priceAdult} onChange={(e) => field('priceAdult', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Child Price (₱)</label>
              <input type="number" min="0" value={form.priceChild} onChange={(e) => field('priceChild', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Child Age Max</label>
              <input type="number" min="0" value={form.childAgeMax} onChange={(e) => field('childAgeMax', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. 12" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Number of Guests</label>
            <p className="text-xs text-gray-400 mb-1.5">Guests required to confirm this package booking.</p>
            <input type="number" min="1" value={form.minimumNumberOfPeople} onChange={(e) => field('minimumNumberOfPeople', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="e.g. 4" />
            {errors.minimumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.minimumNumberOfPeople}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Maximum Number of Guests</label>
            <p className="text-xs text-gray-400 mb-1.5">Maximum guests allowed for this package booking.</p>
            <input type="number" min="1" value={form.maximumNumberOfPeople} onChange={(e) => field('maximumNumberOfPeople', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="e.g. 10" />
            {errors.maximumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.maximumNumberOfPeople}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Package Location</label>
            <MunicipalityMultiSelect value={form.packageLocations} onChange={(v) => field('packageLocations', v)} error={errors.packageLocations} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Package Tag</label>
            <TagCombobox value={form.packageTag} onChange={(v) => field('packageTag', v as ActivityTag)} error={errors.packageTag} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">What&apos;s Included</label>
            <ChipGridSelector
              defaults={DEFAULT_INCLUSION_CHIPS}
              customs={customInclusionChips}
              value={form.inclusions}
              onChange={(v) => field('inclusions', v)}
              onAddCustom={(chip) => persistCustomChip('inclusion', chip)}
              variant="inclusion"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">What&apos;s Excluded</label>
            <ChipGridSelector
              defaults={DEFAULT_EXCLUSION_CHIPS}
              customs={customExclusionChips}
              value={form.exclusions}
              onChange={(v) => field('exclusions', v)}
              onAddCustom={(chip) => persistCustomChip('exclusion', chip)}
              variant="exclusion"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-3">Itinerary</label>
            <ItineraryEditor steps={form.packageItinerary} onChange={(v) => field('packageItinerary', v)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Package Images <span className="font-normal text-gray-400">(3–5 images required, max 5 MB each)</span>
            </label>
            <PackageImagesEditor
              images={images}
              errors={errors.images}
              fileInputRef={fileInputRef}
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onImageChange={handleImageChange}
              onRemove={removeImage}
              onUpdate={updateImage}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Saving…' : 'Add Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Package Modal ──────────────────────────────────────────

interface EditFormState {
  packageName: string;
  packageDescription: string;
  pricePerPerson: string;
  priceAdult: string;
  priceChild: string;
  childAgeMax: string;
  minimumNumberOfPeople: string;
  maximumNumberOfPeople: string;
  packageLocations: string[];
  duration: string;
  packageTag: ActivityTag | '';
  status: PackageStatus;
  inclusions: string[];
  exclusions: string[];
  packageItinerary: ItineraryStep[];
}

type EditFormErrors = Partial<Record<keyof EditFormState | 'images' | 'minimumNumberOfPeople' | 'maximumNumberOfPeople', string>>;

function EditPackageModal({ pkg, onClose, onDelete, operatorId }: { pkg: OperatorPackage; onClose: () => void; onDelete: () => void; operatorId: string }) {
  const { authState } = useAuth();
  const customInclusionChips = authState.status === 'authenticated' ? (authState.profile.customInclusionChips ?? []) : [];
  const customExclusionChips = authState.status === 'authenticated' ? (authState.profile.customExclusionChips ?? []) : [];

  async function persistCustomChip(kind: 'inclusion' | 'exclusion', chip: string) {
    if (authState.status !== 'authenticated') return;
    const field = kind === 'inclusion' ? 'customInclusionChips' : 'customExclusionChips';
    const current = kind === 'inclusion' ? customInclusionChips : customExclusionChips;
    if (current.includes(chip)) return;
    await updateDoc(doc(firebaseDb, 'users', authState.user.uid), {
      [field]: [...current, chip],
    });
  }

  const [form, setForm] = useState<EditFormState>({
    packageName: pkg.packageName,
    packageDescription: pkg.packageDescription,
    pricePerPerson: String(pkg.pricePerPerson),
    priceAdult: pkg.priceAdult != null ? String(pkg.priceAdult) : '',
    priceChild: pkg.priceChild != null ? String(pkg.priceChild) : '',
    childAgeMax: pkg.childAgeMax != null ? String(pkg.childAgeMax) : '',
    minimumNumberOfPeople: String(pkg.minimumNumberOfPeople ?? 1),
    maximumNumberOfPeople: String(pkg.maximumNumberOfPeople ?? 10),
    packageLocations: pkg.packageLocations,
    duration: pkg.duration,
    packageTag: (ACTIVITY_TAGS as ReadonlyArray<string>).includes(pkg.packageTag) ? pkg.packageTag as ActivityTag : '',
    status: pkg.status,
    inclusions: pkg.inclusions,
    exclusions: pkg.exclusions,
    packageItinerary: pkg.packageItinerary,
  });
  const [images, setImages] = useState<ImageSlot[]>(
    pkg.packageImages.map((img, i) => ({
      id: `ex-${i}-${packageImageUrl(img).slice(-6)}`,
      kind: 'existing' as const,
      url: packageImageUrl(img),
      title: typeof img === 'string' ? '' : (img.title ?? ''),
      description: typeof img === 'string' ? '' : (img.description ?? ''),
    }))
  );
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const totalImages = images.length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.slice(0, MAX_IMAGES - images.length);
    if (toAdd.some((f) => f.size > MAX_SIZE_MB * 1024 * 1024)) {
      setErrors((prev) => ({ ...prev, images: `Each image must be under ${MAX_SIZE_MB} MB.` }));
      e.target.value = '';
      return;
    }
    setErrors((prev) => ({ ...prev, images: undefined }));
    const newSlots: ImageSlot[] = toAdd.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      kind: 'new' as const,
      file,
      preview: URL.createObjectURL(file),
      title: '',
      description: '',
    }));
    setImages((prev) => [...prev, ...newSlots]);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const slot = prev.find((s) => s.id === id);
      if (slot?.kind === 'new') URL.revokeObjectURL(slot.preview);
      return prev.filter((s) => s.id !== id);
    });
  };

  const updateImage = (id: string, patch: Partial<Pick<ImageSlot, 'title' | 'description'>>) => {
    setImages((prev) => prev.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setImages((prev) => {
      const oldIdx = prev.findIndex((s) => s.id === active.id);
      const newIdx = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const validate = (): boolean => {
    const e: EditFormErrors = {};
    if (!form.packageName.trim()) e.packageName = 'Required';
    if (!form.packageDescription.trim()) e.packageDescription = 'Required';
    if (!form.pricePerPerson || Number(form.pricePerPerson) <= 0) e.pricePerPerson = 'Enter a valid price';
    if (!form.minimumNumberOfPeople || Number(form.minimumNumberOfPeople) < 1) e.minimumNumberOfPeople = 'Minimum 1';
    if (!form.maximumNumberOfPeople || Number(form.maximumNumberOfPeople) < 1) e.maximumNumberOfPeople = 'Minimum 1';
    if (Number(form.maximumNumberOfPeople) < Number(form.minimumNumberOfPeople)) e.maximumNumberOfPeople = 'Must be ≥ minimum';
    if (!form.packageLocations.length)
      e.packageLocations = 'Select at least one municipality';
    else if (!form.packageLocations.every((m) => (CEBU_MUNICIPALITIES as readonly string[]).includes(m)))
      e.packageLocations = 'Select valid municipalities';
    if (!form.duration.trim()) e.duration = 'Required';
    if (!form.packageTag) e.packageTag = 'Select a tag';
    if (totalImages < MIN_IMAGES) e.images = `At least ${MIN_IMAGES} images required (${totalImages}/${MIN_IMAGES})`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const finalImages: PackageImage[] = [];
      for (const slot of images) {
        if (slot.kind === 'existing') {
          finalImages.push({
            url: slot.url,
            title: slot.title.trim(),
            description: slot.description.trim(),
          });
        } else {
          const compressed = await compressImage(slot.file);
          const storageRef = ref(firebaseStorage, `tour-packages/${operatorId}/${Date.now()}_${slot.file.name}`);
          await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' });
          finalImages.push({
            url: await getDownloadURL(storageRef),
            title: slot.title.trim(),
            description: slot.description.trim(),
          });
        }
      }
      await updateDoc(doc(firebaseDb, 'tourPackages', pkg.id), {
        packageName: form.packageName.trim(),
        packageDescription: form.packageDescription.trim(),
        pricePerPerson: parseFloat(form.pricePerPerson),
        priceAdult: form.priceAdult ? parseFloat(form.priceAdult) : deleteField(),
        priceChild: form.priceChild ? parseFloat(form.priceChild) : deleteField(),
        childAgeMax: form.childAgeMax ? Number(form.childAgeMax) : deleteField(),
        minimumNumberOfPeople: Number(form.minimumNumberOfPeople),
        maximumNumberOfPeople: Number(form.maximumNumberOfPeople),
        packageLocations: form.packageLocations,
        duration: form.duration.trim(),
        packageTag: form.packageTag,
        status: form.status,
        inclusions: form.inclusions.filter(Boolean),
        exclusions: form.exclusions.filter(Boolean),
        packageItinerary: form.packageItinerary.filter((s) => s.itineraryTitle.trim()),
        packageImages: finalImages,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, images: 'Save failed. Please try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const field = <K extends keyof EditFormState>(k: K, v: EditFormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
          <h2 className="text-base font-bold text-gray-900">Edit Tour Package</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto scrollbar-hide flex-1">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">Status</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {form.status === 'active' ? 'Active — visible to guests.' : 'Disabled — hidden from guests.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${form.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                {form.status === 'active' ? 'Active' : 'Disabled'}
              </span>
              <ToggleSwitch
                checked={form.status === 'active'}
                onChange={(c) => field('status', c ? 'active' : 'disabled')}
                ariaLabel="Toggle package status"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Package Name</label>
            <input type="text" value={form.packageName} onChange={(e) => field('packageName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            {errors.packageName && <p className="text-red-500 text-xs mt-1">{errors.packageName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea value={form.packageDescription} onChange={(e) => field('packageDescription', e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            {errors.packageDescription && <p className="text-red-500 text-xs mt-1">{errors.packageDescription}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price per Person (₱) — Flat Rate</label>
              <input type="number" min="0" value={form.pricePerPerson} onChange={(e) => field('pricePerPerson', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              {errors.pricePerPerson && <p className="text-red-500 text-xs mt-1">{errors.pricePerPerson}</p>}
              <p className="text-xs text-gray-400 mt-1">Or set separate adult/child prices below (optional)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
              <input type="text" value={form.duration} onChange={(e) => field('duration', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Adult Price (₱)</label>
              <input type="number" min="0" value={form.priceAdult} onChange={(e) => field('priceAdult', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Child Price (₱)</label>
              <input type="number" min="0" value={form.priceChild} onChange={(e) => field('priceChild', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Child Age Max</label>
              <input type="number" min="0" value={form.childAgeMax} onChange={(e) => field('childAgeMax', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. 12" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Number of Guests</label>
            <p className="text-xs text-gray-400 mb-1.5">Guests required to confirm this package booking.</p>
            <input type="number" min="1" value={form.minimumNumberOfPeople} onChange={(e) => field('minimumNumberOfPeople', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="e.g. 4" />
            {errors.minimumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.minimumNumberOfPeople}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Maximum Number of Guests</label>
            <p className="text-xs text-gray-400 mb-1.5">Maximum guests allowed for this package booking.</p>
            <input type="number" min="1" value={form.maximumNumberOfPeople} onChange={(e) => field('maximumNumberOfPeople', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="e.g. 10" />
            {errors.maximumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.maximumNumberOfPeople}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Package Location</label>
            <MunicipalityMultiSelect value={form.packageLocations} onChange={(v) => field('packageLocations', v)} error={errors.packageLocations} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Package Tag</label>
            <TagCombobox value={form.packageTag} onChange={(v) => field('packageTag', v as ActivityTag)} error={errors.packageTag} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">What&apos;s Included</label>
            <ChipGridSelector
              defaults={DEFAULT_INCLUSION_CHIPS}
              customs={customInclusionChips}
              value={form.inclusions}
              onChange={(v) => field('inclusions', v)}
              onAddCustom={(chip) => persistCustomChip('inclusion', chip)}
              variant="inclusion"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">What&apos;s Excluded</label>
            <ChipGridSelector
              defaults={DEFAULT_EXCLUSION_CHIPS}
              customs={customExclusionChips}
              value={form.exclusions}
              onChange={(v) => field('exclusions', v)}
              onAddCustom={(chip) => persistCustomChip('exclusion', chip)}
              variant="exclusion"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-3">Itinerary</label>
            <ItineraryEditor steps={form.packageItinerary} onChange={(v) => field('packageItinerary', v)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Package Images <span className="font-normal text-gray-400">(3–5 images required, max 5 MB each)</span>
            </label>
            <PackageImagesEditor
              images={images}
              errors={errors.images}
              fileInputRef={fileInputRef}
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onImageChange={handleImageChange}
              onRemove={removeImage}
              onUpdate={updateImage}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={onDelete} disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Filters Modal ───────────────────────────────────────────────

function FiltersModal({ open, filters, onApply, onClose }: {
  open: boolean; filters: Filters; onApply: (f: Filters) => void; onClose: () => void
}) {
  const [draft, setDraft] = useState<Filters>(filters);
  useEffect(() => { if (open) setDraft(filters); }, [open, filters]);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((prev) => ({ ...prev, [k]: v }));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">Filters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Activity</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TAGS.map((tag) => (
                <button key={tag} onClick={() => set('tag', draft.tag === tag ? '' : tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    draft.tag === tag ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
            <div className="flex gap-2">
              {(['all', 'active', 'disabled'] as const).map((s) => (
                <button key={s} onClick={() => set('status', s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    draft.status === s ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
                  }`}>
                  {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Disabled'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Location</p>
            <select value={draft.location} onChange={(e) => set('location', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
              <option value="">All locations</option>
              {CEBU_MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Price per Person (₱)</p>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={draft.priceMin} onChange={(e) => set('priceMin', e.target.value)} placeholder="Min"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              <span className="text-gray-400 text-sm">–</span>
              <input type="number" min="0" value={draft.priceMax} onChange={(e) => set('priceMax', e.target.value)} placeholder="Max"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={() => { setDraft(EMPTY_FILTERS); onApply(EMPTY_FILTERS); onClose(); }}
            className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Clear
          </button>
          <button onClick={() => { onApply(draft); onClose(); }}
            className="flex-1 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ───────────────────────────────────

function DeletePackageModal({
  pkg,
  onClose,
  onDelete,
  onDisable,
}: {
  pkg: OperatorPackage;
  onClose: () => void;
  onDelete: () => void;
  onDisable: () => void;
}) {
  const isAlreadyDisabled = pkg.status === 'disabled';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">Delete Tour Package</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-1">&quot;{pkg.packageName}&quot;</p>
              <p>
                Permanently deleting will remove this package and cannot be undone. If you only want to hide it from
                customers, choose <span className="font-semibold">Disable</span> instead.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDisable}
            disabled={isAlreadyDisabled}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              isAlreadyDisabled
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-amber-400 text-amber-700 hover:bg-amber-50'
            }`}
            title={isAlreadyDisabled ? 'Already disabled' : 'Disable this package'}
          >
            {isAlreadyDisabled ? 'Already Disabled' : 'Disable'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function OperatorTourPackagesPage() {
  const { authState } = useAuth();
  const operatorId = authState.status === 'authenticated' ? authState.user.uid : null;

  const [packages, setPackages] = useState<OperatorPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [detailPackage, setDetailPackage] = useState<OperatorPackage | null>(null);
  const [editPackage, setEditPackage] = useState<OperatorPackage | null>(null);
  const [deletePackage, setDeletePackage] = useState<OperatorPackage | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoSnackbar, setUndoSnackbar] = useState<{ name: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!operatorId) return;
    const q = query(collection(firebaseDb, 'tourPackages'), where('operatorId', '==', operatorId));
    const unsub = onSnapshot(q, (snap) => {
      setPackages(snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          packageLocations: normalizePackageLocations(data),
          packageImages: normalizePackageImages(data.packageImages),
          inclusions: Array.isArray(data.inclusions) ? data.inclusions : [],
          exclusions: Array.isArray(data.exclusions) ? data.exclusions : [],
        } as OperatorPackage;
      }));
      setLoading(false);
    });
    return unsub;
  }, [operatorId]);

  const hasActiveFilters = filters.status !== 'all' || filters.location !== '' || filters.priceMin !== '' || filters.priceMax !== '' || filters.tag !== '';

  const handleToggleStatus = async (pkg: OperatorPackage) => {
    const next = pkg.status === 'active' ? 'disabled' : 'active';
    try {
      await updateDoc(doc(firebaseDb, 'tourPackages', pkg.id), { status: next });
    } catch (err) {
      console.error('Failed to toggle package status', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = (pkg: OperatorPackage) => {
    setDeletePackage(pkg);
  };

  const confirmDelete = (pkg: OperatorPackage) => {
    setDeletePackage(null);
    setPendingDeleteId(pkg.id);
    setUndoSnackbar({ name: pkg.packageName });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(async () => {
      try {
        await deleteDoc(doc(firebaseDb, 'tourPackages', pkg.id));
      } catch (err) {
        console.error('Failed to delete package', err);
        alert('Failed to delete. Please try again.');
      } finally {
        setPendingDeleteId(null);
        setUndoSnackbar(null);
      }
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setPendingDeleteId(null);
    setUndoSnackbar(null);
  };

  useEffect(() => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }, []);

  const confirmDisable = async (pkg: OperatorPackage) => {
    try {
      await updateDoc(doc(firebaseDb, 'tourPackages', pkg.id), { status: 'disabled' });
      setDeletePackage(null);
    } catch (err) {
      console.error('Failed to disable package', err);
      alert('Failed to disable. Please try again.');
    }
  };

  const filtered = useMemo(() => packages.filter((p) => {
    if (p.id === pendingDeleteId) return false;
    if (search && !p.packageName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.tag && p.packageTag !== filters.tag) return false;
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.location && !p.packageLocations.includes(filters.location)) return false;
    if (filters.priceMin && p.pricePerPerson < Number(filters.priceMin)) return false;
    if (filters.priceMax && p.pricePerPerson > Number(filters.priceMax)) return false;
    return true;
  }), [packages, search, filters, pendingDeleteId]);

  const packageColumns = useMemo<ColumnDef<OperatorPackage>[]>(() => [
    {
      accessorKey: 'packageName',
      header: 'Package',
      meta: { tdClassName: 'px-4 py-3 font-medium text-gray-900' },
      cell: ({ row }) => (
        <button onClick={() => setDetailPackage(row.original)} className="text-left hover:text-green-600">
          {row.original.packageName}
        </button>
      ),
    },
    { accessorKey: 'packageTag', header: 'Tag', meta: { tdClassName: 'px-4 py-3 text-gray-600' } },
    {
      id: 'packageLocations',
      header: 'Location',
      meta: { tdClassName: 'px-4 py-3 text-gray-600' },
      cell: ({ row }) => formatLocationSummary(row.original.packageLocations),
    },
    {
      accessorKey: 'pricePerPerson',
      header: 'Price',
      meta: { thClassName: 'text-right px-4 py-3 font-semibold', tdClassName: 'px-4 py-3 text-right text-gray-900' },
      cell: ({ getValue }) => <>&#8369;{(getValue() as number).toLocaleString()}</>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { tdClassName: 'px-4 py-3 w-28' },
      cell: ({ getValue }) => <StatusBadge status={getValue() as PackageStatus} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { thClassName: 'text-right px-4 py-3 font-semibold w-40', tdClassName: 'px-4 py-3 w-40 whitespace-nowrap' },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setEditPackage(row.original)} title="Edit" aria-label="Edit package" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-green-600">
            <Pencil className="w-4 h-4" />
          </button>
          <ToggleSwitch
            checked={row.original.status === 'active'}
            onChange={() => handleToggleStatus(row.original)}
            ariaLabel={row.original.status === 'active' ? 'Disable package' : 'Enable package'}
          />
          <button onClick={() => handleDelete(row.original)} title="Delete" aria-label="Delete package" className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [setDetailPackage, setEditPackage, handleToggleStatus, handleDelete]);

  const packageTable = useReactTable({
    data: filtered,
    columns: packageColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="space-y-5">
        <div className="space-y-3">
          {/* Row 1: title + add button */}
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900">Tour Packages</h1>
            {packages.length > 0 && (
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-700 transition-colors shrink-0">
                <Plus className="w-4 h-4" />
                Add Package
              </button>
            )}
          </div>
          {/* Row 2: search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Tour Package"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          {/* Row 3: view toggle + filters */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                aria-pressed={viewMode === 'card'}
                title="Card view"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'card' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                title="Table view"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  viewMode === 'table' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                Table
              </button>
            </div>
            <button onClick={() => setShowFilters(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                hasActiveFilters ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="bg-white text-green-600 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">!</span>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 py-16 text-center">Loading packages…</div>
        ) : filtered.length === 0 ? (
          packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-sm text-gray-400">No packages yet. Add your first one!</p>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add Package
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-16 text-center">No packages match your filters.</div>
          )
        ) : viewMode === 'card' ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(160px,280px))]">
            {filtered.map((pkg) => (
              <OperatorPackageCard key={pkg.id} pkg={pkg} onViewDetails={setDetailPackage} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                {packageTable.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className={header.column.columnDef.meta?.thClassName ?? 'text-left px-4 py-3 font-semibold'}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packageTable.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className={cell.column.columnDef.meta?.tdClassName ?? 'px-4 py-3'}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FiltersModal open={showFilters} filters={filters} onApply={setFilters} onClose={() => setShowFilters(false)} />

      {showAddModal && operatorId && (
        <AddPackageModal onClose={() => setShowAddModal(false)} operatorId={operatorId} />
      )}

      {detailPackage && (
        <ViewDetailsModal
          pkg={detailPackage}
          onClose={() => setDetailPackage(null)}
          onEdit={(p) => setEditPackage(p)}
        />
      )}

      {editPackage && operatorId && (
        <EditPackageModal
          pkg={editPackage}
          onClose={() => setEditPackage(null)}
          onDelete={() => { setEditPackage(null); handleDelete(editPackage); }}
          operatorId={operatorId}
        />
      )}

      {deletePackage && (
        <DeletePackageModal
          pkg={deletePackage}
          onClose={() => setDeletePackage(null)}
          onDelete={() => confirmDelete(deletePackage)}
          onDisable={() => confirmDisable(deletePackage)}
        />
      )}

      {undoSnackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-full shadow-lg text-sm whitespace-nowrap">
          <span>&quot;{undoSnackbar.name}&quot; deleted.</span>
          <button
            onClick={handleUndoDelete}
            className="font-semibold text-green-400 hover:text-green-300 underline focus:outline-none"
          >
            Undo
          </button>
        </div>
      )}
    </>
  );
}
