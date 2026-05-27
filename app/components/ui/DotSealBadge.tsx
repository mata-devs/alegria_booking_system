'use client';

import { Award } from 'lucide-react';

export interface DotSealBadgeProps {
  granted: boolean;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function DotSealBadge({ granted, size = 'sm', showLabel = true }: DotSealBadgeProps) {
  if (!granted) return null;

  const iconCls = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const textCls = size === 'md' ? 'text-xs' : 'text-[10px]';
  const padCls = size === 'md' ? 'px-2.5 py-1 gap-1.5' : 'px-2 py-0.5 gap-1';

  return (
    <span
      className={`inline-flex items-center ${padCls} rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200/80 font-semibold ${textCls}`}
      title="DOT Quality Seal"
    >
      <Award className={`${iconCls} shrink-0`} aria-hidden />
      {showLabel ? <span>DOT Quality Seal</span> : null}
    </span>
  );
}
