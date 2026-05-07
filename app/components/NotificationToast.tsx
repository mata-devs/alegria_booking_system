'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useNotifications, type NotificationRow } from '@/app/hooks/useNotifications';
import NotificationThumbnail from '@/app/components/NotificationThumbnail';

interface QueuedToast extends NotificationRow {
  toastKey: string;
  visible: boolean;
}

const TOAST_DURATION = 5000;

export default function NotificationToast({ uid }: { uid: string | undefined }) {
  const { items, loading } = useNotifications(uid, 5);
  const seenIds = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<QueuedToast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((key: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.toastKey === key ? { ...t, visible: false } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastKey !== key));
      timers.current.delete(key);
    }, 300);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (seenIds.current === null) {
      seenIds.current = new Set(items.map((i) => i.id));
      return;
    }

    const newItems = items.filter((i) => !i.read && !seenIds.current!.has(i.id));
    newItems.forEach((item) => {
      seenIds.current!.add(item.id);
      const key = `${item.id}_${Date.now()}`;
      setToasts((prev) => [...prev, { ...item, toastKey: key, visible: true }]);
      const timer = setTimeout(() => dismiss(key), TOAST_DURATION);
      timers.current.set(key, timer);
    });
  }, [items, loading, dismiss]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-16 z-[200] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.toastKey}
          className={`w-72 rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 ring-1 ring-gray-900/5 overflow-hidden transition-all duration-300 ${
            toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="flex items-start gap-3 p-3">
            <NotificationThumbnail imageUrl={toast.imageUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 leading-snug">{toast.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{toast.body}</p>
              {toast.kind === 'booking_new' && (
                <p className="text-[10px] font-medium text-[#558B2F] mt-1">Tap bell to review →</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.toastKey)}
              className="shrink-0 p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div
            className="h-0.5 bg-[#558B2F] origin-left"
            style={{
              animation: toast.visible
                ? `toast-progress ${TOAST_DURATION}ms linear forwards`
                : 'none',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
