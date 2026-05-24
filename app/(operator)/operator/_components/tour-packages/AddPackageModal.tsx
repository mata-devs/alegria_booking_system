'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MunicipalityMultiSelect } from '@/app/components/ui/MunicipalityMultiSelect';
import { ChipGridSelector } from '@/app/components/ui/ChipGridSelector';
import { firebaseDb, firebaseStorage } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';
import type { ActivityTag } from '@/app/lib/activity-tags';
import { CEBU_MUNICIPALITIES } from '@/app/lib/cebu-municipalities';
import { useOperatorCustomChips } from '@/app/hooks/useOperatorCustomChips';
import { DEFAULT_EXCLUSION_CHIPS, DEFAULT_INCLUSION_CHIPS } from '@/app/lib/inclusion-chips';
import type { PackageImage } from '@/app/lib/package-images';
import { compressImage } from '@/app/(operator)/operator/_components/shared/compress-image';
import { MIN_IMAGES, MAX_IMAGES, MAX_SIZE_MB, EMPTY_FORM, generateSlug } from './constants';
import type { AddFormState, AddFormErrors, ImageSlot } from './types';
import { TagCombobox } from './TagCombobox';
import { ItineraryEditor } from './ItineraryEditor';
import { PackagePreviewPanel } from './PackagePreviewPanel';
import { PackageImagesEditor } from '@/app/(operator)/operator/_components/shared/images/PackageImagesEditor';
import { LivePreviewPane } from '@/app/(operator)/operator/_components/shared/LivePreviewPane';
import { FormSectionHeader } from '@/app/(operator)/operator/_components/shared/FormSectionHeader';

export function AddPackageModal({ onClose, operatorId }: { onClose: () => void; operatorId: string }) {
  const { authState } = useAuth();
  const { inclusionChips, exclusionChips, chipError, addCustomChip, removeCustomChip } =
    useOperatorCustomChips(authState);

  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [errors, setErrors] = useState<AddFormErrors>({});
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
    const e: AddFormErrors = {};
    if (!form.packageName.trim()) e.packageName = 'Required';
    if (!form.packageDescription.trim()) e.packageDescription = 'Required';
    if (!form.pricePerPerson || Number(form.pricePerPerson) <= 0) e.pricePerPerson = 'Enter a valid price';
    if (!form.minimumNumberOfPeople || Number(form.minimumNumberOfPeople) < 1)
      e.minimumNumberOfPeople = 'Minimum 1';
    if (!form.maximumNumberOfPeople || Number(form.maximumNumberOfPeople) < 1)
      e.maximumNumberOfPeople = 'Minimum 1';
    if (Number(form.maximumNumberOfPeople) < Number(form.minimumNumberOfPeople))
      e.maximumNumberOfPeople = 'Must be ≥ minimum';
    if (!form.packageLocations.length) e.packageLocations = 'Select at least one municipality';
    else if (!form.packageLocations.every((m) => (CEBU_MUNICIPALITIES as readonly string[]).includes(m)))
      e.packageLocations = 'Select valid municipalities';
    if (!form.duration.trim()) e.duration = 'Required';
    if (!form.packageTag) e.packageTag = 'Select a tag';
    if (images.length < MIN_IMAGES)
      e.images = `At least ${MIN_IMAGES} images required (${images.length}/${MIN_IMAGES})`;
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
          const storageRef = ref(
            firebaseStorage,
            `tour-packages/${operatorId}/${Date.now()}_${slot.file.name}`,
          );
          await uploadBytes(storageRef, compressed, {
            contentType: 'image/jpeg',
            cacheControl: 'public,max-age=31536000',
          });
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
      <div className="bg-white w-full max-w-[1100px] rounded-2xl shadow-xl max-h-[90vh] flex overflow-hidden">
        <div className="w-[440px] shrink-0 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white z-10">
            <h2 className="text-base font-bold text-gray-900">Add Tour Package</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto">
              <div className="border-t border-gray-200">
                <FormSectionHeader step={1} title="Package Info" />
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Package Name</label>
                    <input
                      type="text"
                      value={form.packageName}
                      onChange={(e) => field('packageName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="e.g. Southern Cebu Adventure"
                    />
                    {errors.packageName && <p className="text-red-500 text-xs mt-1">{errors.packageName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                    <textarea
                      value={form.packageDescription}
                      onChange={(e) => field('packageDescription', e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                      placeholder="Describe the package experience…"
                    />
                    {errors.packageDescription && (
                      <p className="text-red-500 text-xs mt-1">{errors.packageDescription}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Package Location</label>
                    <MunicipalityMultiSelect
                      value={form.packageLocations}
                      onChange={(v) => field('packageLocations', v)}
                      error={errors.packageLocations}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Package Tag</label>
                    <TagCombobox
                      value={form.packageTag}
                      onChange={(v) => field('packageTag', v as ActivityTag)}
                      error={errors.packageTag}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200">
                <FormSectionHeader step={2} title="Pricing & Group Size" />
                <div className="px-6 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Price per Person (₱)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.pricePerPerson}
                        onChange={(e) => field('pricePerPerson', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        placeholder="e.g. 4500"
                      />
                      {errors.pricePerPerson && (
                        <p className="text-red-500 text-xs mt-1">{errors.pricePerPerson}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                      <input
                        type="text"
                        value={form.duration}
                        onChange={(e) => field('duration', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        placeholder="e.g. 2 Days / 1 Night"
                      />
                      {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                    </div>
                  </div>
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-gray-500">
                      Optional: separate adult / child pricing
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Adult (₱)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.priceAdult}
                          onChange={(e) => field('priceAdult', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Child (₱)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.priceChild}
                          onChange={(e) => field('priceChild', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Child max age</label>
                        <input
                          type="number"
                          min="0"
                          value={form.childAgeMax}
                          onChange={(e) => field('childAgeMax', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                          placeholder="e.g. 12"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Group Size</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Min guests</label>
                        <input
                          type="number"
                          min="1"
                          value={form.minimumNumberOfPeople}
                          onChange={(e) => field('minimumNumberOfPeople', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                          placeholder="e.g. 4"
                        />
                        {errors.minimumNumberOfPeople && (
                          <p className="text-red-500 text-xs mt-1">{errors.minimumNumberOfPeople}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Max guests</label>
                        <input
                          type="number"
                          min="1"
                          value={form.maximumNumberOfPeople}
                          onChange={(e) => field('maximumNumberOfPeople', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                          placeholder="e.g. 10"
                        />
                        {errors.maximumNumberOfPeople && (
                          <p className="text-red-500 text-xs mt-1">{errors.maximumNumberOfPeople}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200">
                <FormSectionHeader step={3} title="Inclusions & Exclusions" />
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

              <div className="border-t border-gray-200">
                <FormSectionHeader step={4} title="Itinerary" />
                <div className="px-6 py-4">
                  <ItineraryEditor
                    steps={form.packageItinerary}
                    onChange={(v) => field('packageItinerary', v)}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200">
                <FormSectionHeader step={5} title="Photos" hint="3 to 5 required · max 5 MB each" />
                <div className="px-6 py-4">
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
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving…' : 'Add Package'}
              </button>
            </div>
          </form>
        </div>

        <LivePreviewPane previewMode={previewMode} onPreviewModeChange={setPreviewMode}>
          <PackagePreviewPanel form={form} images={images} isMobile={previewMode === 'mobile'} />
        </LivePreviewPane>
      </div>
    </div>
  );
}
