'use client';

import { useState, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { updateDoc, deleteField, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ToggleSwitch from '@/app/components/ui/ToggleSwitch';
import { MunicipalityMultiSelect } from '@/app/components/ui/MunicipalityMultiSelect';
import { ChipGridSelector } from '@/app/components/ui/ChipGridSelector';
import { firebaseDb, firebaseStorage } from '@/app/lib/firebase';
import { useAuth } from '@/app/context/AuthContext';
import { normalizeActivityTags, primaryActivityTag } from '@/app/lib/activity-tags';
import { ActivityTagMultiSelect } from '@/app/components/ui/ActivityTagMultiSelect';
import { CEBU_MUNICIPALITIES } from '@/app/lib/cebu-municipalities';
import { useOperatorCustomChips } from '@/app/hooks/useOperatorCustomChips';
import { DEFAULT_EXCLUSION_CHIPS, DEFAULT_INCLUSION_CHIPS } from '@/app/lib/inclusion-chips';
import { packageImageUrl, type PackageImage } from '@/app/lib/package-images';
import { compressImage } from '@/app/(operator)/operator/_components/shared/compress-image';
import { MIN_IMAGES, MAX_IMAGES, MAX_SIZE_MB } from './constants';
import { PricingTierBuilder } from '@/app/(operator)/operator/_components/shared/PricingTierBuilder';
import { serializeTiers, lowestFromPrice, validateTiers, makeDefaultTier, tiersBounds } from '@/app/lib/pricing-tiers';
import type { OperatorPackage, EditFormState, EditFormErrors, ImageSlot } from './types';
import { ItineraryEditor } from './ItineraryEditor';
import { PackagePreviewPanel } from './PackagePreviewPanel';
import { PackageImagesEditor } from '@/app/(operator)/operator/_components/shared/images/PackageImagesEditor';
import { LivePreviewPane } from '@/app/(operator)/operator/_components/shared/LivePreviewPane';
import { FormSectionHeader } from '@/app/(operator)/operator/_components/shared/FormSectionHeader';

export function EditPackageModal({
  pkg,
  onClose,
  onDelete,
  operatorId,
}: {
  pkg: OperatorPackage;
  onClose: () => void;
  onDelete: () => void;
  operatorId: string;
}) {
  const { authState } = useAuth();
  const { inclusionChips, exclusionChips, chipError, addCustomChip, removeCustomChip } =
    useOperatorCustomChips(authState);

  const [form, setForm] = useState<EditFormState>({
    packageName: pkg.packageName,
    packageDescription: pkg.packageDescription,
    pricingMode: pkg.pricingMode ?? 'standard',
    pricingTiers: (pkg.pricingTiers?.length
      ? pkg.pricingTiers
      : [makeDefaultTier(pkg.minimumNumberOfPeople ?? 1, pkg.maximumNumberOfPeople ?? 10)]
    ).map((t) => ({
      minPax: t.minPax,
      maxPax: t.maxPax,
      price: t.price ?? 0,
      priceAdult: t.priceAdult ?? 0,
      priceChild: t.priceChild ?? 0,
    })),
    childAgeMax: pkg.childAgeMax != null ? String(pkg.childAgeMax) : '',
    minimumNumberOfPeople: String(pkg.minimumNumberOfPeople ?? 1),
    maximumNumberOfPeople: String(pkg.maximumNumberOfPeople ?? 10),
    packageLocations: pkg.packageLocations,
    duration: pkg.duration,
    packageTags: normalizeActivityTags(pkg.packageTags, pkg.packageTag),
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
    })),
  );
  const [errors, setErrors] = useState<EditFormErrors>({});
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
    const e: EditFormErrors = {};
    if (!form.packageName.trim()) e.packageName = 'Required';
    if (!form.packageDescription.trim()) e.packageDescription = 'Required';
    const tierErrors = validateTiers(form.pricingMode, form.pricingTiers);
    if (tierErrors.length) e.pricingTiers = tierErrors[0];
    if (!form.packageLocations.length) e.packageLocations = 'Select at least one municipality';
    else if (!form.packageLocations.every((m) => (CEBU_MUNICIPALITIES as readonly string[]).includes(m)))
      e.packageLocations = 'Select valid municipalities';
    if (!form.duration.trim()) e.duration = 'Required';
    if (!form.packageTags.length) e.packageTags = 'Select at least one tag';
    if (totalImages < MIN_IMAGES)
      e.images = `At least ${MIN_IMAGES} images required (${totalImages}/${MIN_IMAGES})`;
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
          const storageRef = ref(
            firebaseStorage,
            `tour-packages/${operatorId}/${Date.now()}_${slot.file.name}`,
          );
          await uploadBytes(storageRef, compressed, {
            contentType: 'image/jpeg',
            cacheControl: 'public,max-age=31536000',
          });
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
        pricingMode: form.pricingMode,
        pricingTiers: serializeTiers(form.pricingMode, form.pricingTiers),
        pricePerPerson: lowestFromPrice(form.pricingMode, form.pricingTiers),
        childAgeMax:
          form.pricingMode === 'adultChild' && form.childAgeMax
            ? Number(form.childAgeMax)
            : deleteField(),
        priceAdult: deleteField(),
        priceChild: deleteField(),
        minimumNumberOfPeople: tiersBounds(form.pricingTiers).minPax,
        maximumNumberOfPeople: tiersBounds(form.pricingTiers).maxPax,
        packageLocations: form.packageLocations,
        duration: form.duration.trim(),
        packageTags: form.packageTags,
        packageTag: primaryActivityTag(form.packageTags),
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
      <div className="bg-gray-100 w-full max-w-[1260px] h-[90vh] rounded-3xl shadow-2xl p-3">
        <div className="flex h-full min-h-0 gap-3">
          <div className="w-[440px] shrink-0 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white z-10">
              <h2 className="text-base font-bold text-gray-900">Edit Tour Package</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Status</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {form.status === 'active'
                        ? 'Active, visible to guests.'
                        : 'Disabled, hidden from guests.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        form.status === 'active' ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {form.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                    <ToggleSwitch
                      checked={form.status === 'active'}
                      onChange={(c) => field('status', c ? 'active' : 'disabled')}
                      ariaLabel="Toggle package status"
                    />
                  </div>
                </div>
              </div>

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
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Package Tags</label>
                    <ActivityTagMultiSelect
                      value={form.packageTags}
                      onChange={(v) => field('packageTags', v)}
                      error={errors.packageTags}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200">
                <FormSectionHeader step={2} title="Pricing & Group Size" />
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) => field('duration', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                  </div>
                  <PricingTierBuilder
                    mode={form.pricingMode}
                    onModeChange={(m) => field('pricingMode', m)}
                    tiers={form.pricingTiers}
                    onTiersChange={(t) => field('pricingTiers', t)}
                    childAgeMax={form.childAgeMax}
                    onChildAgeMaxChange={(v) => field('childAgeMax', v)}
                  />
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

            <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              <button
                type="button"
                onClick={onDelete}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <div className="flex gap-3">
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
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
          </div>

          <LivePreviewPane previewMode={previewMode} onPreviewModeChange={setPreviewMode}>
            <PackagePreviewPanel form={form} images={images} isMobile={previewMode === 'mobile'} />
          </LivePreviewPane>
        </div>
      </div>
    </div>
  );
}
