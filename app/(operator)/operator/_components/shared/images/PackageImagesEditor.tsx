'use client';

import { Upload } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableImageCard } from './SortableImageCard';
import { MAX_IMAGES } from '../constants';
import type { ImageSlot } from '../types';

export function PackageImagesEditor({
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onImageChange}
      />
      {errors && <p className="text-red-500 text-xs mt-1">{errors}</p>}
    </div>
  );
}
