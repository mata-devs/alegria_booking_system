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
import { Plus, Search, SlidersHorizontal, X, Upload, ChevronLeft, ChevronRight, Pencil, Trash2, LayoutGrid, Table as TableIcon, GripVertical, Monitor, Smartphone } from 'lucide-react';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import PackageCard from '@/app/components/ui/PackageCard';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
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
import { ACTIVITY_TAGS, type ActivityTag, type StoredActivityTag, normalizeActivityTags, primaryActivityTag, formatActivityTagsDisplay, activityHasTag } from '@/app/lib/activity-tags';
import { ActivityTagMultiSelect } from '@/app/components/ui/ActivityTagMultiSelect';
import { CEBU_MUNICIPALITIES } from '@/app/lib/cebu-municipalities';
import { ChipGridSelector } from '@/app/components/ui/ChipGridSelector';
import { useOperatorCustomChips } from '@/app/hooks/useOperatorCustomChips';
import { DEFAULT_EXCLUSION_CHIPS,
  DEFAULT_INCLUSION_CHIPS,
} from '@/app/lib/inclusion-chips';
import { InclusionChipBadges } from '@/app/components/ui/InclusionChipBadges';
import { normalizePackageImages, packageImageUrl, type PackageImage } from '@/app/lib/package-images';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    tdClassName?: string;
    thClassName?: string;
  }
}

type ActivityStatus = 'active' | 'disabled';

const MIN_IMAGES = 3;
const MAX_IMAGES = 5;
const MAX_SIZE_MB = 5;

interface OperatorActivity {
  id: string;
  activityName: string;
  activityDetails: string;
  pricePerGuest: number;
  priceAdult?: number;
  priceChild?: number;
  childAgeMax?: number;
  minimumNumberOfPeople: number;
  maximumNumberOfPeople: number;
  activityLocation: string;
  activityTag: StoredActivityTag;
  activityTags: StoredActivityTag[];
  activityRating: number;
  activityImages: PackageImage[];
  operatorId: string;
  createdAt: Timestamp | null;
  status: ActivityStatus;
  inclusions: string[];
  exclusions: string[];
}

interface Filters {
  status: 'all' | ActivityStatus;
  location: string;
  priceMin: string;
  priceMax: string;
  tag: ActivityTag | '';
}

const EMPTY_FILTERS: Filters = { status: 'all', location: '', priceMin: '', priceMax: '', tag: '' };

// ── Image compression ───────────────────────────────────────────

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

function StatusBadge({ status }: { status: ActivityStatus }) {
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


function OperatorActivityCard({ activity, onViewDetails, onDelete }: { activity: OperatorActivity; onViewDetails: (a: OperatorActivity) => void; onDelete: (a: OperatorActivity) => void }) {
  const createdDate = activity.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) ?? '—';
  return (
    <PackageCard
      image={packageImageUrl(activity.activityImages[0])}
      title={activity.activityName}
      price={activity.pricePerGuest}
      pricePrefix=""
      tag={formatActivityTagsDisplay(activity.activityTags)}
      rating={activity.activityRating}
      location={activity.activityLocation}
      createdAt={`Created: ${createdDate}`}
      status={<StatusBadge status={activity.status} />}
      ctaLabel="View Details"
      onCta={() => onViewDetails(activity)}
    />
  );
}

// ── View Details Modal ──────────────────────────────────────────

function ViewDetailsModal({ activity, onClose, onEdit }: { activity: OperatorActivity; onClose: () => void; onEdit: (a: OperatorActivity) => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = activity.activityImages.map((img) => packageImageUrl(img));
  const createdDate = activity.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) ?? '—';

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
              <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setImgIdx((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute top-3 left-3">
            <StatusBadge status={activity.status} />
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 px-5 pt-3 overflow-x-auto">
            {images.map((src, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-green-500' : 'border-transparent'}`}>
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
                <span key={tag} className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
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
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{activity.activityDetails}</p>
          </div>

          {(activity.inclusions.length > 0 || activity.exclusions.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {activity.inclusions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Included</p>
                  <ul className="space-y-1">
                    {activity.inclusions.map((item, i) => (
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
              {activity.exclusions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Excluded</p>
                  <ul className="space-y-1">
                    {activity.exclusions.map((item, i) => (
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
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button onClick={() => { onClose(); onEdit(activity); }} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
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
          <Image src={src} alt="Activity image" fill sizes="80px" className="object-cover" />
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
              placeholder="e.g. Tops Lookout View"
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

function ActivityImagesEditor({
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

// ── Edit Activity Modal ─────────────────────────────────────────

interface EditFormState {
  activityName: string;
  activityDetails: string;
  pricePerGuest: string;
  priceAdult: string;
  priceChild: string;
  childAgeMax: string;
  minimumNumberOfPeople: string;
  maximumNumberOfPeople: string;
  activityLocation: string;
  activityTags: string[];
  status: ActivityStatus;
  inclusions: string[];
  exclusions: string[];
}

type FormErrors = Partial<Record<keyof EditFormState | 'images', string>>;

function EditActivityModal({ activity, onClose, operatorId }: { activity: OperatorActivity; onClose: () => void; operatorId: string }) {
  const { authState } = useAuth();
  const { inclusionChips, exclusionChips, chipError, addCustomChip, removeCustomChip } = useOperatorCustomChips(authState);

  const [form, setForm] = useState<EditFormState>({
    activityName: activity.activityName,
    activityDetails: activity.activityDetails,
    pricePerGuest: String(activity.pricePerGuest),
    priceAdult: String(activity.priceAdult ?? ''),
    priceChild: String(activity.priceChild ?? ''),
    childAgeMax: String(activity.childAgeMax ?? ''),
    minimumNumberOfPeople: String(activity.minimumNumberOfPeople ?? 1),
    maximumNumberOfPeople: String(activity.maximumNumberOfPeople ?? 30),
    activityLocation: activity.activityLocation,
    activityTags: normalizeActivityTags(activity.activityTags, activity.activityTag),
    status: activity.status,
    inclusions: activity.inclusions ?? [],
    exclusions: activity.exclusions ?? [],
  });
  const [images, setImages] = useState<ImageSlot[]>(
    activity.activityImages.map((img, i) => ({
      id: `ex-${i}-${packageImageUrl(img).slice(-6)}`,
      kind: 'existing' as const,
      url: packageImageUrl(img),
      title: typeof img === 'string' ? '' : (img.title ?? ''),
      description: typeof img === 'string' ? '' : (img.description ?? ''),
    }))
  );
  const [errors, setErrors] = useState<FormErrors>({});
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
    const e: FormErrors = {};
    if (!form.activityName.trim()) e.activityName = 'Required';
    if (!form.activityDetails.trim()) e.activityDetails = 'Required';
    if (!form.pricePerGuest || Number(form.pricePerGuest) <= 0) e.pricePerGuest = 'Enter a valid price';
    if (!form.minimumNumberOfPeople || Number(form.minimumNumberOfPeople) < 1) e.minimumNumberOfPeople = 'Minimum 1';
    if (!form.maximumNumberOfPeople || Number(form.maximumNumberOfPeople) < 1) e.maximumNumberOfPeople = 'Minimum 1';
    if (Number(form.maximumNumberOfPeople) < Number(form.minimumNumberOfPeople)) e.maximumNumberOfPeople = 'Must be ≥ minimum';
    if (!CEBU_MUNICIPALITIES.includes(form.activityLocation as typeof CEBU_MUNICIPALITIES[number]))
      e.activityLocation = 'Select a valid municipality';
    if (!form.activityTags.length) e.activityTags = 'Select at least one tag';
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
          const storageRef = ref(firebaseStorage, `activities/${operatorId}/${Date.now()}_${slot.file.name}`);
          await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' });
          finalImages.push({
            url: await getDownloadURL(storageRef),
            title: slot.title.trim(),
            description: slot.description.trim(),
          });
        }
      }
      await updateDoc(doc(firebaseDb, 'activities', activity.id), {
        activityName: form.activityName.trim(),
        activityDetails: form.activityDetails.trim(),
        pricePerGuest: parseFloat(form.pricePerGuest),
        priceAdult: form.priceAdult ? parseFloat(form.priceAdult) : deleteField(),
        priceChild: form.priceChild ? parseFloat(form.priceChild) : deleteField(),
        childAgeMax: form.childAgeMax ? Number(form.childAgeMax) : deleteField(),
        minimumNumberOfPeople: Number(form.minimumNumberOfPeople),
        maximumNumberOfPeople: Number(form.maximumNumberOfPeople),
        activityLocation: form.activityLocation.trim(),
        activityTags: form.activityTags,
        activityTag: primaryActivityTag(form.activityTags),
        status: form.status,
        activityImages: finalImages,
        inclusions: form.inclusions,
        exclusions: form.exclusions,
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
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Edit Activity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Status */}
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
                ariaLabel="Toggle activity status"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Name</label>
            <input type="text" value={form.activityName} onChange={(e) => field('activityName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            {errors.activityName && <p className="text-red-500 text-xs mt-1">{errors.activityName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Details</label>
            <textarea value={form.activityDetails} onChange={(e) => field('activityDetails', e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            {errors.activityDetails && <p className="text-red-500 text-xs mt-1">{errors.activityDetails}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price per Guest (₱) — Flat Rate</label>
            <input type="number" min="0" value={form.pricePerGuest} onChange={(e) => field('pricePerGuest', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            {errors.pricePerGuest && <p className="text-red-500 text-xs mt-1">{errors.pricePerGuest}</p>}
            <p className="text-xs text-gray-400 mt-1">Or set separate adult/child prices below (optional)</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Min Guests</label>
              <input type="number" min="1" value={form.minimumNumberOfPeople} onChange={(e) => field('minimumNumberOfPeople', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              {errors.minimumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.minimumNumberOfPeople}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Guests</label>
              <input type="number" min="1" value={form.maximumNumberOfPeople} onChange={(e) => field('maximumNumberOfPeople', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              {errors.maximumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.maximumNumberOfPeople}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Location</label>
            <MunicipalityCombobox value={form.activityLocation} onChange={(v) => field('activityLocation', v)} error={errors.activityLocation} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Tags</label>
            <p className="text-xs text-gray-400 mb-2">Select one or more tags that describe this activity.</p>
            <ActivityTagMultiSelect
              value={form.activityTags}
              onChange={(v) => field('activityTags', v)}
              error={errors.activityTags}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">What&apos;s Included</label>
            <ChipGridSelector
              defaults={DEFAULT_INCLUSION_CHIPS}
              customs={inclusionChips}
              value={form.inclusions}
              onChange={(v) => field('inclusions', v)}
              onAddCustom={(chip) => addCustomChip('inclusion', chip)}
              onRemoveCustom={(chip) => removeCustomChip('inclusion', chip)}
              variant="inclusion"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">What&apos;s Excluded</label>
            <ChipGridSelector
              defaults={DEFAULT_EXCLUSION_CHIPS}
              customs={exclusionChips}
              value={form.exclusions}
              onChange={(v) => field('exclusions', v)}
              onAddCustom={(chip) => addCustomChip('exclusion', chip)}
              onRemoveCustom={(chip) => removeCustomChip('exclusion', chip)}
              variant="exclusion"
            />
            {chipError && <p className="text-red-500 text-xs mt-1">{chipError}</p>}
          </div>

          {/* Images — drag to reorder */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Activity Images <span className="font-normal text-gray-400">(3–5 images required, max 5 MB each)</span>
            </label>
            <ActivityImagesEditor
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
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Activity Modal ──────────────────────────────────────────

interface AddFormState {
  activityName: string;
  activityDetails: string;
  pricePerGuest: string;
  priceAdult: string;
  priceChild: string;
  childAgeMax: string;
  minimumNumberOfPeople: string;
  maximumNumberOfPeople: string;
  activityLocation: string;
  activityTags: string[];
  inclusions: string[];
  exclusions: string[];
}

const EMPTY_FORM: AddFormState = {
  activityName: '', activityDetails: '', pricePerGuest: '', priceAdult: '', priceChild: '', childAgeMax: '',
  minimumNumberOfPeople: '1', maximumNumberOfPeople: '30', activityLocation: '', activityTags: [],
  inclusions: [], exclusions: [],
};

function ActivityPreviewPanel({
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

function AddActivityModal({ onClose, operatorId }: { onClose: () => void; operatorId: string }) {
  const { authState } = useAuth();
  const { inclusionChips, exclusionChips, chipError, addCustomChip, removeCustomChip } = useOperatorCustomChips(authState);

  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof AddFormState | 'images', string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
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
    const e: typeof errors = {};
    if (!form.activityName.trim()) e.activityName = 'Required';
    if (!form.activityDetails.trim()) e.activityDetails = 'Required';
    if (!form.pricePerGuest || Number(form.pricePerGuest) <= 0) e.pricePerGuest = 'Enter a valid price';
    if (!form.minimumNumberOfPeople || Number(form.minimumNumberOfPeople) < 1) e.minimumNumberOfPeople = 'Minimum 1';
    if (!form.maximumNumberOfPeople || Number(form.maximumNumberOfPeople) < 1) e.maximumNumberOfPeople = 'Minimum 1';
    if (Number(form.maximumNumberOfPeople) < Number(form.minimumNumberOfPeople)) e.maximumNumberOfPeople = 'Must be ≥ minimum';
    if (!CEBU_MUNICIPALITIES.includes(form.activityLocation as typeof CEBU_MUNICIPALITIES[number])) e.activityLocation = 'Select a valid municipality';
    if (!form.activityTags.length) e.activityTags = 'Select at least one tag';
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
          const storageRef = ref(firebaseStorage, `activities/${operatorId}/${Date.now()}_${slot.file.name}`);
          await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' });
          imageEntries.push({
            url: await getDownloadURL(storageRef),
            title: slot.title.trim(),
            description: slot.description.trim(),
          });
        }
      }
      await addDoc(collection(firebaseDb, 'activities'), {
        activityName: form.activityName.trim(),
        activityDetails: form.activityDetails.trim(),
        pricePerGuest: parseFloat(form.pricePerGuest),
        ...(form.priceAdult ? { priceAdult: parseFloat(form.priceAdult) } : {}),
        ...(form.priceChild ? { priceChild: parseFloat(form.priceChild) } : {}),
        ...(form.childAgeMax ? { childAgeMax: Number(form.childAgeMax) } : {}),
        minimumNumberOfPeople: Number(form.minimumNumberOfPeople),
        maximumNumberOfPeople: Number(form.maximumNumberOfPeople),
        activityLocation: form.activityLocation.trim(),
        activityTags: form.activityTags,
        activityTag: primaryActivityTag(form.activityTags),
        activityRating: 0,
        activityImages: imageEntries,
        operatorId,
        status: 'active',
        inclusions: form.inclusions,
        exclusions: form.exclusions,
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
      <div className="bg-white w-full max-w-[1100px] rounded-2xl shadow-xl max-h-[90vh] flex overflow-hidden">
        {/* Left: Form */}
        <div className="w-[440px] shrink-0 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Add Activity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">

            {/* ── 1. Activity Info ── */}
            <div>
              <div className="flex items-center gap-2.5 px-6 py-3 bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0">1</span>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Activity Info</span>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Name</label>
                  <input type="text" value={form.activityName} onChange={(e) => field('activityName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. Island Hopping Adventure" />
                  {errors.activityName && <p className="text-red-500 text-xs mt-1">{errors.activityName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                  <MunicipalityCombobox value={form.activityLocation} onChange={(v) => field('activityLocation', v)} error={errors.activityLocation} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category Tags</label>
                  <p className="text-xs text-gray-400 mb-2">Select one or more tags that describe this activity.</p>
                  <ActivityTagMultiSelect
                    value={form.activityTags}
                    onChange={(v) => field('activityTags', v)}
                    error={errors.activityTags}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea value={form.activityDetails} onChange={(e) => field('activityDetails', e.target.value)}
                    rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" placeholder="Describe the activity — highlights, what to expect, duration…" />
                  {errors.activityDetails && <p className="text-red-500 text-xs mt-1">{errors.activityDetails}</p>}
                </div>
              </div>
            </div>

            {/* ── 2. Pricing & Group Size ── */}
            <div className="border-t border-gray-200">
              <div className="flex items-center gap-2.5 px-6 py-3 bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0">2</span>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Pricing & Group Size</span>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Price per Guest (₱)</label>
                  <input type="number" min="0" value={form.pricePerGuest} onChange={(e) => field('pricePerGuest', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. 1500" />
                  {errors.pricePerGuest && <p className="text-red-500 text-xs mt-1">{errors.pricePerGuest}</p>}
                </div>
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-500">Optional: separate adult / child pricing</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Adult (₱)</label>
                      <input type="number" min="0" value={form.priceAdult} onChange={(e) => field('priceAdult', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" placeholder="Optional" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Child (₱)</label>
                      <input type="number" min="0" value={form.priceChild} onChange={(e) => field('priceChild', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" placeholder="Optional" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Child max age</label>
                      <input type="number" min="0" value={form.childAgeMax} onChange={(e) => field('childAgeMax', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" placeholder="e.g. 12" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Group Size</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Min guests</label>
                      <input type="number" min="1" value={form.minimumNumberOfPeople} onChange={(e) => field('minimumNumberOfPeople', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. 1" />
                      {errors.minimumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.minimumNumberOfPeople}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Max guests</label>
                      <input type="number" min="1" value={form.maximumNumberOfPeople} onChange={(e) => field('maximumNumberOfPeople', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. 30" />
                      {errors.maximumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.maximumNumberOfPeople}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3. Inclusions & Exclusions ── */}
            <div className="border-t border-gray-200">
              <div className="flex items-center gap-2.5 px-6 py-3 bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0">3</span>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Inclusions & Exclusions</span>
              </div>
              <div className="px-6 py-4 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">What&apos;s Included</label>
                  <ChipGridSelector
                    defaults={DEFAULT_INCLUSION_CHIPS}
                    customs={inclusionChips}
                    value={form.inclusions}
                    onChange={(v) => field('inclusions', v)}
                    onAddCustom={(chip) => addCustomChip('inclusion', chip)}
                    onRemoveCustom={(chip) => removeCustomChip('inclusion', chip)}
                    variant="inclusion"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">What&apos;s Excluded</label>
                  <ChipGridSelector
                    defaults={DEFAULT_EXCLUSION_CHIPS}
                    customs={exclusionChips}
                    value={form.exclusions}
                    onChange={(v) => field('exclusions', v)}
                    onAddCustom={(chip) => addCustomChip('exclusion', chip)}
                    onRemoveCustom={(chip) => removeCustomChip('exclusion', chip)}
                    variant="exclusion"
                  />
                  {chipError && <p className="text-red-500 text-xs mt-1">{chipError}</p>}
                </div>
              </div>
            </div>

            {/* ── 4. Photos ── */}
            <div className="border-t border-gray-200">
              <div className="flex items-center gap-2.5 px-6 py-3 bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0">4</span>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Photos</span>
                <span className="text-[10px] text-gray-400 ml-0.5">3 to 5 required · max 5 MB each</span>
              </div>
              <div className="px-6 py-4">
                <ActivityImagesEditor
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
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Saving…' : 'Add Activity'}
            </button>
          </div>
        </form>
        </div>
        {/* Right: Live Preview */}
        <div className="flex-1 border-l border-gray-100 flex flex-col overflow-hidden bg-gray-50 min-w-0">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b bg-white">
            <span className="text-sm font-semibold text-gray-700">Live Preview</span>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${previewMode === 'desktop' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${previewMode === 'mobile' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ActivityPreviewPanel form={form} images={images} isMobile={previewMode === 'mobile'} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Filters Modal ───────────────────────────────────────────────

function FiltersModal({ open, filters, onApply, onClose }: { open: boolean; filters: Filters; onApply: (f: Filters) => void; onClose: () => void }) {
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
            <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
            <div className="flex gap-2">
              {(['all', 'active', 'disabled'] as const).map((s) => (
                <button key={s} onClick={() => set('status', s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${draft.status === s ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'}`}>
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
            <p className="text-xs font-semibold text-gray-600 mb-2">Tag</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => set('tag', '')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${draft.tag === '' ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'}`}>
                All
              </button>
              {ACTIVITY_TAGS.map((tag) => (
                <button key={tag} onClick={() => set('tag', tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${draft.tag === tag ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Price per Guest (₱)</p>
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
            className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }}
            className="flex-1 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">Apply</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ──────────────────────────────────

function DeleteActivityModal({
  activity,
  onClose,
  onDelete,
  onDisable,
}: {
  activity: OperatorActivity;
  onClose: () => void;
  onDelete: () => void;
  onDisable: () => void;
}) {
  const isAlreadyDisabled = activity.status === 'disabled';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">Delete Activity</h2>
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
              <p className="font-medium text-gray-900 mb-1">&quot;{activity.activityName}&quot;</p>
              <p>
                Permanently deleting will remove this activity and cannot be undone. If you only want to hide it from
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
            title={isAlreadyDisabled ? 'Already disabled' : 'Disable this activity'}
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

export default function OperatorActivitiesPage() {
  const { authState } = useAuth();
  const operatorId = authState.status === 'authenticated' ? authState.user.uid : null;

  const [activities, setActivities] = useState<OperatorActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [detailActivity, setDetailActivity] = useState<OperatorActivity | null>(null);
  const [editActivity, setEditActivity] = useState<OperatorActivity | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<OperatorActivity | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoSnackbar, setUndoSnackbar] = useState<{ name: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggleStatus = async (act: OperatorActivity) => {
    const next = act.status === 'active' ? 'disabled' : 'active';
    try {
      await updateDoc(doc(firebaseDb, 'activities', act.id), { status: next });
    } catch (err) {
      console.error('Failed to toggle activity status', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = (act: OperatorActivity) => {
    setDeleteActivity(act);
  };

  const confirmDelete = (act: OperatorActivity) => {
    setDeleteActivity(null);
    setPendingDeleteId(act.id);
    setUndoSnackbar({ name: act.activityName });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(async () => {
      try {
        await deleteDoc(doc(firebaseDb, 'activities', act.id));
      } catch (err) {
        console.error('Failed to delete activity', err);
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

  const confirmDisable = async (act: OperatorActivity) => {
    try {
      await updateDoc(doc(firebaseDb, 'activities', act.id), { status: 'disabled' });
      setDeleteActivity(null);
    } catch (err) {
      console.error('Failed to disable activity', err);
      alert('Failed to disable. Please try again.');
    }
  };

  useEffect(() => {
    if (!operatorId) return;
    const q = query(collection(firebaseDb, 'activities'), where('operatorId', '==', operatorId));
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map((d) => {
        const data = d.data();
        const tags = normalizeActivityTags(data.activityTags, data.activityTag);
        return {
          id: d.id,
          ...data,
          activityTags: tags,
          activityTag: primaryActivityTag(tags),
          activityImages: normalizePackageImages(data.activityImages),
          inclusions: Array.isArray(data.inclusions) ? data.inclusions : [],
          exclusions: Array.isArray(data.exclusions) ? data.exclusions : [],
        } as OperatorActivity;
      }));
      setLoading(false);
    });
    return unsub;
  }, [operatorId]);

  const hasActiveFilters = filters.status !== 'all' || filters.location !== '' || filters.priceMin !== '' || filters.priceMax !== '' || filters.tag !== '';

  const filtered = useMemo(() => activities.filter((a) => {
    if (a.id === pendingDeleteId) return false;
    if (search && !a.activityName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.tag && !activityHasTag(a.activityTags, filters.tag)) return false;
    if (filters.status !== 'all' && a.status !== filters.status) return false;
    if (filters.location && a.activityLocation !== filters.location) return false;
    if (filters.priceMin && a.pricePerGuest < Number(filters.priceMin)) return false;
    if (filters.priceMax && a.pricePerGuest > Number(filters.priceMax)) return false;
    return true;
  }), [activities, search, filters, pendingDeleteId]);

  const activityColumns = useMemo<ColumnDef<OperatorActivity>[]>(() => [
    {
      accessorKey: 'activityName',
      header: 'Activity',
      meta: { tdClassName: 'px-4 py-3 font-medium text-gray-900' },
      cell: ({ row }) => (
        <button onClick={() => setDetailActivity(row.original)} className="text-left hover:text-green-600">
          {row.original.activityName}
        </button>
      ),
    },
    {
      id: 'activityTags',
      header: 'Tags',
      meta: { tdClassName: 'px-4 py-3 text-gray-600' },
      cell: ({ row }) => formatActivityTagsDisplay(row.original.activityTags),
    },
    { accessorKey: 'activityLocation', header: 'Location', meta: { tdClassName: 'px-4 py-3 text-gray-600' } },
    {
      accessorKey: 'pricePerGuest',
      header: 'Price',
      meta: { thClassName: 'text-right px-4 py-3 font-semibold', tdClassName: 'px-4 py-3 text-right text-gray-900' },
      cell: ({ getValue }) => <>&#8369;{(getValue() as number).toLocaleString()}</>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { tdClassName: 'px-4 py-3 w-28' },
      cell: ({ getValue }) => <StatusBadge status={getValue() as ActivityStatus} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { thClassName: 'text-right px-4 py-3 font-semibold w-40', tdClassName: 'px-4 py-3 w-40 whitespace-nowrap' },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setEditActivity(row.original)} title="Edit" aria-label="Edit activity" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-green-600">
            <Pencil className="w-4 h-4" />
          </button>
          <ToggleSwitch
            checked={row.original.status === 'active'}
            onChange={() => handleToggleStatus(row.original)}
            ariaLabel={row.original.status === 'active' ? 'Disable activity' : 'Enable activity'}
          />
          <button onClick={() => handleDelete(row.original)} title="Delete" aria-label="Delete activity" className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [setDetailActivity, setEditActivity, handleToggleStatus, handleDelete]);

  const activityTable = useReactTable({
    data: filtered,
    columns: activityColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="space-y-5">
        <div className="space-y-3">
          {/* Row 1: title + add button */}
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900">Activities</h1>
            {activities.length > 0 && (
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-700 transition-colors shrink-0">
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            )}
          </div>
          {/* Row 2: search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Activity"
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
          <div className="text-sm text-gray-400 py-16 text-center">Loading activities…</div>
        ) : filtered.length === 0 ? (
          activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-sm text-gray-400">No activities yet. Add your first one!</p>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-16 text-center">No activities match your filters.</div>
          )
        ) : viewMode === 'card' ? (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(160px,280px))]">
            {filtered.map((act) => (
              <OperatorActivityCard key={act.id} activity={act} onViewDetails={setDetailActivity} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                {activityTable.getHeaderGroups().map(headerGroup => (
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
                {activityTable.getRowModel().rows.map(row => (
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
        <AddActivityModal onClose={() => setShowAddModal(false)} operatorId={operatorId} />
      )}

      {detailActivity && (
        <ViewDetailsModal
          activity={detailActivity}
          onClose={() => setDetailActivity(null)}
          onEdit={(a) => setEditActivity(a)}
        />
      )}

      {editActivity && operatorId && (
        <EditActivityModal
          activity={editActivity}
          onClose={() => setEditActivity(null)}
          operatorId={operatorId}
        />
      )}

      {deleteActivity && (
        <DeleteActivityModal
          activity={deleteActivity}
          onClose={() => setDeleteActivity(null)}
          onDelete={() => confirmDelete(deleteActivity)}
          onDisable={() => confirmDisable(deleteActivity)}
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
