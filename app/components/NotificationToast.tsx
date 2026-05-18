'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotifications, type NotificationRow } from '@/app/hooks/useNotifications';
import ToastItem from '@/app/components/ToastItem';

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
        <ToastItem
          key={toast.toastKey}
          {...toast}
          toastDuration={TOAST_DURATION}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}
