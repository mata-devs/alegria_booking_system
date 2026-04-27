'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Search, SlidersHorizontal, X, Upload, ChevronLeft, ChevronRight, Pencil, Trash2, LayoutGrid, Table as TableIcon } from 'lucide-react';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import PackageCard from '@/app/components/ui/PackageCard';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseDb, firebaseStorage } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';
import { ACTIVITY_TAGS, type ActivityTag, type StoredActivityTag } from '@/app/lib/activity-tags';
type ActivityStatus = 'active' | 'disabled';

const CEBU_MUNICIPALITIES = [
  'Alcantara', 'Alcoy', 'Alegria', 'Aloguinsan', 'Argao',
  'Asturias', 'Badian', 'Balamban', 'Bantayan', 'Barili',
  'Bogo City', 'Boljoon', 'Borbon', 'Carcar City', 'Carmen',
  'Catmon', 'Cebu City', 'Compostela', 'Consolacion', 'Cordova',
  'Dalaguete', 'Danao City', 'Dumanjug', 'Ginatilan', 'Lapu-Lapu City',
  'Liloan', 'Madridejos', 'Malabuyoc', 'Mandaue City', 'Medellin',
  'Minglanilla', 'Moalboal', 'Naga City', 'Oslob', 'Pilar',
  'Pinamungajan', 'Poro', 'Ronda', 'Samboan', 'San Fernando',
  'San Francisco', 'San Remigio', 'Santa Fe', 'Santander', 'Sibonga',
  'Sogod', 'Tabogon', 'Tabuelan', 'Talisay City', 'Toledo City',
  'Tuburan', 'Tudela',
] as const;

const MAX_IMAGES = 5;
const MAX_SIZE_MB = 5;

interface OperatorActivity {
  id: string;
  activityName: string;
  activityDetails: string;
  pricePerGuest: number;
  activityLocation: string;
  activityTag: StoredActivityTag;
  activityRating: number;
  activityImages: string[];
  operatorId: string;
  createdAt: Timestamp | null;
  status: ActivityStatus;
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

function OperatorActivityCard({ activity, onViewDetails, onDelete }: { activity: OperatorActivity; onViewDetails: (a: OperatorActivity) => void; onDelete: (a: OperatorActivity) => void }) {
  const createdDate = activity.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) ?? '—';
  return (
    <PackageCard
      image={activity.activityImages[0]}
      title={activity.activityName}
      price={activity.pricePerGuest}
      pricePrefix=""
      tag={activity.activityTag}
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
  const images = activity.activityImages;
  const createdDate = activity.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) ?? '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="relative h-56 bg-gray-100 rounded-t-2xl overflow-hidden">
          <Image src={images[imgIdx]} alt={`${activity.activityName} ${imgIdx + 1}`} fill className="object-cover" />
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
                <Image src={src} alt={`thumb ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-gray-900 leading-snug">{activity.activityName}</h2>
            <span className="shrink-0 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">{activity.activityTag}</span>
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

// ── Edit Activity Modal ─────────────────────────────────────────

interface EditFormState {
  activityName: string;
  activityDetails: string;
  pricePerGuest: string;
  activityLocation: string;
  activityTag: ActivityTag | '';
  status: ActivityStatus;
}

type FormErrors = Partial<Record<keyof EditFormState | 'images', string>>;

function EditActivityModal({ activity, onClose, operatorId }: { activity: OperatorActivity; onClose: () => void; operatorId: string }) {
  const [form, setForm] = useState<EditFormState>({
    activityName: activity.activityName,
    activityDetails: activity.activityDetails,
    pricePerGuest: String(activity.pricePerGuest),
    activityLocation: activity.activityLocation,
    activityTag: (ACTIVITY_TAGS as ReadonlyArray<string>).includes(activity.activityTag) ? activity.activityTag as ActivityTag : '',
    status: activity.status,
  });
  // Existing images (URLs) + new files
  const [existingImages, setExistingImages] = useState<string[]>(activity.activityImages);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = newPreviews;
    return () => urls.forEach(URL.revokeObjectURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalImages = existingImages.length + newFiles.length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.slice(0, MAX_IMAGES - totalImages);
    if (toAdd.some((f) => f.size > MAX_SIZE_MB * 1024 * 1024)) {
      setErrors((prev) => ({ ...prev, images: `Each image must be under ${MAX_SIZE_MB} MB.` }));
      e.target.value = '';
      return;
    }
    setErrors((prev) => ({ ...prev, images: undefined }));
    setNewFiles((prev) => [...prev, ...toAdd]);
    setNewPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeExisting = (idx: number) => setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  const removeNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.activityName.trim()) e.activityName = 'Required';
    if (!form.activityDetails.trim()) e.activityDetails = 'Required';
    if (!form.pricePerGuest || Number(form.pricePerGuest) <= 0) e.pricePerGuest = 'Enter a valid price';
    if (!CEBU_MUNICIPALITIES.includes(form.activityLocation as typeof CEBU_MUNICIPALITIES[number]))
      e.activityLocation = 'Select a valid municipality';
    if (!form.activityTag) e.activityTag = 'Select a tag';
    if (totalImages === 0) e.images = 'At least 1 image required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const compressed = await compressImage(file);
        const storageRef = ref(firebaseStorage, `activities/${operatorId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' });
        uploadedUrls.push(await getDownloadURL(storageRef));
      }
      await updateDoc(doc(firebaseDb, 'activities', activity.id), {
        activityName: form.activityName.trim(),
        activityDetails: form.activityDetails.trim(),
        pricePerGuest: parseFloat(form.pricePerGuest),
        activityLocation: form.activityLocation.trim(),
        activityTag: form.activityTag,
        status: form.status,
        activityImages: [...existingImages, ...uploadedUrls],
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
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price per Guest (₱)</label>
            <input type="number" min="0" value={form.pricePerGuest} onChange={(e) => field('pricePerGuest', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            {errors.pricePerGuest && <p className="text-red-500 text-xs mt-1">{errors.pricePerGuest}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Location</label>
            <MunicipalityCombobox value={form.activityLocation} onChange={(v) => field('activityLocation', v)} error={errors.activityLocation} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Tag</label>
            <TagCombobox value={form.activityTag} onChange={(v) => field('activityTag', v as ActivityTag)} error={errors.activityTag} />
          </div>

          {/* Images — existing + new */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Activity Images <span className="font-normal text-gray-400">(1–5 images, max 5 MB each)</span>
            </label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {existingImages.map((src, idx) => (
                <div key={`ex-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image src={src} alt={`image ${idx + 1}`} fill className="object-cover" />
                  <button type="button" onClick={() => removeExisting(idx)}
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newPreviews.map((src, idx) => (
                <div key={`new-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-green-300">
                  <Image src={src} alt={`new ${idx + 1}`} fill className="object-cover" />
                  <button type="button" onClick={() => removeNew(idx)}
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {totalImages < MAX_IMAGES && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs mt-1">Add</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            {errors.images && <p className="text-red-500 text-xs">{errors.images}</p>}
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
  activityLocation: string;
  activityTag: ActivityTag | '';
}

const EMPTY_FORM: AddFormState = { activityName: '', activityDetails: '', pricePerGuest: '', activityLocation: '', activityTag: '' };

function AddActivityModal({ onClose, operatorId }: { onClose: () => void; operatorId: string }) {
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof AddFormState | 'images', string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = imagePreviews;
    return () => urls.forEach(URL.revokeObjectURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.slice(0, MAX_IMAGES - imageFiles.length);
    if (toAdd.some((f) => f.size > MAX_SIZE_MB * 1024 * 1024)) {
      setErrors((prev) => ({ ...prev, images: `Each image must be under ${MAX_SIZE_MB} MB.` }));
      e.target.value = '';
      return;
    }
    setErrors((prev) => ({ ...prev, images: undefined }));
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.activityName.trim()) e.activityName = 'Required';
    if (!form.activityDetails.trim()) e.activityDetails = 'Required';
    if (!form.pricePerGuest || Number(form.pricePerGuest) <= 0) e.pricePerGuest = 'Enter a valid price';
    if (!CEBU_MUNICIPALITIES.includes(form.activityLocation as typeof CEBU_MUNICIPALITIES[number])) e.activityLocation = 'Select a valid municipality';
    if (!form.activityTag) e.activityTag = 'Select a tag';
    if (imageFiles.length === 0) e.images = 'At least 1 image required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const compressed = await compressImage(file);
        const storageRef = ref(firebaseStorage, `activities/${operatorId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg', cacheControl: 'public,max-age=31536000' });
        imageUrls.push(await getDownloadURL(storageRef));
      }
      await addDoc(collection(firebaseDb, 'activities'), {
        activityName: form.activityName.trim(),
        activityDetails: form.activityDetails.trim(),
        pricePerGuest: parseFloat(form.pricePerGuest),
        activityLocation: form.activityLocation.trim(),
        activityTag: form.activityTag,
        activityRating: 0,
        activityImages: imageUrls,
        operatorId,
        status: 'active',
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

  const field = (k: keyof AddFormState, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Add Activity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Name</label>
            <input type="text" value={form.activityName} onChange={(e) => field('activityName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. Island Hopping Adventure" />
            {errors.activityName && <p className="text-red-500 text-xs mt-1">{errors.activityName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Details</label>
            <textarea value={form.activityDetails} onChange={(e) => field('activityDetails', e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" placeholder="Describe the activity…" />
            {errors.activityDetails && <p className="text-red-500 text-xs mt-1">{errors.activityDetails}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price per Guest (₱)</label>
            <input type="number" min="0" value={form.pricePerGuest} onChange={(e) => field('pricePerGuest', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="e.g. 1500" />
            {errors.pricePerGuest && <p className="text-red-500 text-xs mt-1">{errors.pricePerGuest}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Location</label>
            <MunicipalityCombobox value={form.activityLocation} onChange={(v) => field('activityLocation', v)} error={errors.activityLocation} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Tag</label>
            <TagCombobox value={form.activityTag} onChange={(v) => field('activityTag', v as ActivityTag)} error={errors.activityTag} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Activity Images <span className="font-normal text-gray-400">(1–5 images, max 5 MB each)</span>
            </label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image src={src} alt={`preview ${idx + 1}`} fill className="object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imageFiles.length < MAX_IMAGES && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs mt-1">Add</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            {errors.images && <p className="text-red-500 text-xs">{errors.images}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Saving…' : 'Add Activity'}
            </button>
          </div>
        </form>
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
      setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OperatorActivity)));
      setLoading(false);
    });
    return unsub;
  }, [operatorId]);

  const hasActiveFilters = filters.status !== 'all' || filters.location !== '' || filters.priceMin !== '' || filters.priceMax !== '' || filters.tag !== '';

  const filtered = useMemo(() => activities.filter((a) => {
    if (a.id === pendingDeleteId) return false;
    if (search && !a.activityName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.tag && a.activityTag !== filters.tag) return false;
    if (filters.status !== 'all' && a.status !== filters.status) return false;
    if (filters.location && a.activityLocation !== filters.location) return false;
    if (filters.priceMin && a.pricePerGuest < Number(filters.priceMin)) return false;
    if (filters.priceMax && a.pricePerGuest > Number(filters.priceMax)) return false;
    return true;
  }), [activities, search, filters, pendingDeleteId]);

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
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Activity</th>
                  <th className="text-left px-4 py-3 font-semibold">Tag</th>
                  <th className="text-left px-4 py-3 font-semibold">Location</th>
                  <th className="text-right px-4 py-3 font-semibold">Price</th>
                  <th className="text-left px-4 py-3 font-semibold w-28">Status</th>
                  <th className="text-right px-4 py-3 font-semibold w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((act) => (
                  <tr key={act.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <button
                        onClick={() => setDetailActivity(act)}
                        className="text-left hover:text-green-600"
                      >
                        {act.activityName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{act.activityTag}</td>
                    <td className="px-4 py-3 text-gray-600">{act.activityLocation}</td>
                    <td className="px-4 py-3 text-right text-gray-900">₱{act.pricePerGuest.toLocaleString()}</td>
                    <td className="px-4 py-3 w-28"><StatusBadge status={act.status} /></td>
                    <td className="px-4 py-3 w-40 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEditActivity(act)}
                          title="Edit"
                          aria-label="Edit activity"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-green-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <ToggleSwitch
                          checked={act.status === 'active'}
                          onChange={() => handleToggleStatus(act)}
                          ariaLabel={act.status === 'active' ? 'Disable activity' : 'Enable activity'}
                        />
                        <button
                          onClick={() => handleDelete(act)}
                          title="Delete"
                          aria-label="Delete activity"
                          className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
