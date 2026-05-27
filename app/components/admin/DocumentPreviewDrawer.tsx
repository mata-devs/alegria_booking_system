'use client';

import { Drawer } from 'vaul';
import { ExternalLink, X } from 'lucide-react';

export interface PreviewDocument {
  name: string;
  url: string;
}

interface DocumentPreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PreviewDocument | null;
  loading?: boolean;
}

export function inferDocumentPreviewKind(url: string, name: string): 'pdf' | 'image' | 'unknown' {
  const probe = `${name} ${url.split('?')[0]}`.toLowerCase();
  if (probe.includes('.pdf')) return 'pdf';
  if (/\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/.test(probe)) return 'image';
  return 'unknown';
}

export function DocumentPreviewDrawer({
  open,
  onOpenChange,
  document: doc,
  loading = false,
}: DocumentPreviewDrawerProps) {
  const kind = doc?.url ? inferDocumentPreviewKind(doc.url, doc.name) : 'unknown';

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Drawer.Content
          className="fixed right-0 top-0 bottom-0 z-[60] flex w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-xl outline-none"
          aria-describedby={doc ? 'document-preview-body' : undefined}
        >
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="min-w-0">
              <Drawer.Title className="truncate text-base font-semibold text-gray-900">
                {doc?.name ?? 'Document preview'}
              </Drawer.Title>
              <Drawer.Description className="mt-1 text-xs text-gray-500">
                {kind === 'pdf' ? 'PDF preview' : kind === 'image' ? 'Image preview' : 'Document preview'}
              </Drawer.Description>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {doc?.url ? (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <ExternalLink size={16} />
                </a>
              ) : null}
              <Drawer.Close
                title="Close preview"
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </Drawer.Close>
            </div>
          </div>

          <div id="document-preview-body" className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4">
            {loading ? (
              <div className="flex min-h-[70vh] flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white">
                <p className="text-sm text-gray-400">Loading document…</p>
              </div>
            ) : !doc?.url ? (
              <p className="text-sm text-gray-400">No document selected.</p>
            ) : kind === 'pdf' ? (
              <iframe
                src={doc.url}
                title={doc.name}
                className="h-full min-h-[70vh] w-full rounded-lg border border-gray-200 bg-white"
              />
            ) : kind === 'image' ? (
              <div className="flex h-full min-h-[70vh] items-center justify-center overflow-auto rounded-lg border border-gray-200 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.url}
                  alt={doc.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
                <p className="text-sm text-gray-600">Preview not available for this file type.</p>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#558B2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a7a28]"
                >
                  <ExternalLink size={14} />
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
