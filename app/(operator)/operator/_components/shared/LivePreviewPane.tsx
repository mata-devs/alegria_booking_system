'use client';

import { Monitor, Smartphone } from 'lucide-react';
import type { ReactNode } from 'react';

export type PreviewMode = 'desktop' | 'mobile';

export function LivePreviewPane({
  previewMode,
  onPreviewModeChange,
  children,
}: {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm min-w-0">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b bg-white">
        <span className="text-sm font-semibold text-gray-700">Live Preview</span>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => onPreviewModeChange('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors ${
              previewMode === 'desktop'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => onPreviewModeChange('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
              previewMode === 'mobile'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
