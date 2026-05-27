'use client';

import Image from 'next/image';
import { GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ImageSlot } from '../types';

export function SortableImageCard({
  slot,
  onRemove,
  onUpdate,
}: {
  slot: ImageSlot;
  onRemove: () => void;
  onUpdate: (patch: Partial<Pick<ImageSlot, 'title' | 'description'>>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id,
  });
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
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Title
            </label>
            <input
              type="text"
              value={slot.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="e.g. Tops Lookout View"
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Description
            </label>
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
