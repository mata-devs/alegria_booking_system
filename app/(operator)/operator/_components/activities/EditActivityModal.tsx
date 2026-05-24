'use client';

import { useState, useRef } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';
import { PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { updateDoc, deleteField, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import { ActivityTagMultiSelect } from '@/app/components/ui/ActivityTagMultiSelect';
import { ChipGridSelector } from '@/app/components/ui/ChipGridSelector';
import { firebaseDb, firebaseStorage } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';
import { normalizeActivityTags, primaryActivityTag } from '@/app/lib/activity-tags';
import { CEBU_MUNICIPALITIES } from '@/app/lib/cebu-municipalities';
import { useOperatorCustomChips } from '@/app/hooks/useOperatorCustomChips';
import { DEFAULT_EXCLUSION_CHIPS, DEFAULT_INCLUSION_CHIPS } from '@/app/lib/inclusion-chips';
import { packageImageUrl, type PackageImage } from '@/app/lib/package-images';
import { MIN_IMAGES, MAX_IMAGES, MAX_SIZE_MB } from './constants';
import { compressImage } from './compress-image';
import type { OperatorActivity, EditFormState, FormErrors, ImageSlot } from './types';
import { MunicipalityCombobox } from './MunicipalityCombobox';
import { ActivityImagesEditor } from './images/ActivityImagesEditor';
import { ActivityPreviewPanel } from './ActivityPreviewPanel';

export function EditActivityModal({ activity, onClose, operatorId }: { activity: OperatorActivity; onClose: () => void; operatorId: string }) {
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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
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
      <div className="bg-gray-100 w-full max-w-[1260px] h-[90vh] rounded-3xl shadow-2xl p-3">
        <div className="flex h-full min-h-0 gap-3">
          {/* Left: Form */}
          <div className="w-[440px] shrink-0 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white z-10">
              <h2 className="text-base font-bold text-gray-900">Edit Activity</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto">

              {/* ── Status ── */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Status</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {form.status === 'active' ? 'Active, visible to guests.' : 'Disabled, hidden from guests.'}
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
              </div>

              {/* ── 1. Activity Info ── */}
              <div className="border-t border-gray-200">
                <div className="flex items-center gap-2.5 px-6 py-3 bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0">1</span>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Activity Info</span>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Name</label>
                    <input type="text" value={form.activityName} onChange={(e) => field('activityName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
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
                      rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
                    {errors.activityDetails && <p className="text-red-500 text-xs mt-1">{errors.activityDetails}</p>}
                  </div>
                </div>
              </div>

              {/* ── 2. Pricing & Group Size ── */}
              <div className="border-t border-gray-200">
                <div className="flex items-center gap-2.5 px-6 py-3 bg-gray-50 border-b border-gray-100 sticky top-0 z-[1]">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold shrink-0">2</span>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Pricing &amp; Group Size</span>
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
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                        {errors.minimumNumberOfPeople && <p className="text-red-500 text-xs mt-1">{errors.minimumNumberOfPeople}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Max guests</label>
                        <input type="number" min="1" value={form.maximumNumberOfPeople} onChange={(e) => field('maximumNumberOfPeople', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
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
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Inclusions &amp; Exclusions</span>
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

            <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
          </div>

          {/* Right: Live Preview */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm min-w-0">
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
    </div>
  );
}
