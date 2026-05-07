'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';

export type NotificationKind =
  | 'booking_new'
  | 'booking_paid'
  | 'booking_cancelled'
  | 'review_pending_response'
  | 'payout_processed'
  | 'admin_announcement'
  | 'cancellation_request'
  | 'tour_starts_today';

export interface NotificationRow {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: Date | null;
}

export function useNotifications(uid: string | undefined, listLimit = 10) {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(firebaseDb, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(listLimit),
    );

    return onSnapshot(
      q,
      (snap) => {
        const rows: NotificationRow[] = snap.docs.map((d) => {
          const data = d.data();
          const created = data.createdAt;
          return {
            id: d.id,
            kind: (data.kind ?? 'booking_new') as NotificationKind,
            title: String(data.title ?? ''),
            body: String(data.body ?? ''),
            link: String(data.link ?? '/'),
            read: Boolean(data.read),
            createdAt: created instanceof Timestamp ? created.toDate() : null,
          };
        });
        setItems(rows);
        setLoading(false);
      },
      (err) => {
        console.error('useNotifications:', err);
        setLoading(false);
      },
    );
  }, [uid, listLimit]);

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const markRead = useCallback(
    async (notifId: string) => {
      if (!uid) return;
      await updateDoc(doc(firebaseDb, 'users', uid, 'notifications', notifId), {
        read: true,
        readAt: Timestamp.now(),
      });
    },
    [uid],
  );

  /** Marks up to 100 unread notifications (covers bell + beyond). */
  const markAllRead = useCallback(async () => {
    if (!uid) return;
    const q = query(
      collection(firebaseDb, 'users', uid, 'notifications'),
      where('read', '==', false),
      limit(100),
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(firebaseDb);
    const now = Timestamp.now();
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true, readAt: now });
    });
    await batch.commit();
  }, [uid]);

  return { items, unreadCount, loading, markRead, markAllRead };
}
