'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';

/* ── Firestore document shape ─────────────────────────────── */

export interface FirestoreBooking {
  bookingId: string;
  representative: {
    fullName: string;
    email: string;
    phoneNumber: string;
    age: number;
    gender: 'Male' | 'Female' | 'Prefer not to say';
    nationality: string;
  };
  guests: {
    fullName: string;
    age: number;
    gender: 'Male' | 'Female' | 'Prefer not to say';
    nationality: string;
  }[];
  numberOfGuests: number;
  specialRequests: string;
  activityId: string;
  activityName?: string;
  sourceType?: string;
  tourDate: Timestamp;
  operatorUid: string;
  assignmentType: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentId: string;
  paymentExpiresAt: Timestamp;
  receiptUrl: string;
  checkInToken?: string;
  reviewToken?: string;
  tourStartedAt?: Timestamp | null;
  durationMinutes?: number | null;
  promoCode: string | null;
  pricePerGuest: number;
  baseAmount: number;
  serviceCharge: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
  idempotencyKey: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

async function bookingBelongsToOperator(booking: FirestoreBooking, operatorUid: string): Promise<boolean> {
  if (!booking.activityId) return false;

  const sourceType = booking.sourceType === 'tourPackage' ? 'tourPackage' : 'activity';
  const sourceCollection = sourceType === 'tourPackage' ? 'tourPackages' : 'activities';

  try {
    const sourceSnap = await getDoc(doc(firebaseDb, sourceCollection, booking.activityId));
    if (!sourceSnap.exists()) return false;

    const sourceData = sourceSnap.data() as { operatorId?: unknown };
    return typeof sourceData.operatorId === 'string' && sourceData.operatorId === operatorUid;
  } catch {
    return false;
  }
}

/* ── Hook ─────────────────────────────────────────────────── */

export function useOperatorBookings(operatorUid: string | undefined) {
  const [bookings, setBookings] = useState<FirestoreBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorUid) {
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(firebaseDb, 'bookings'),
      where('operatorUid', '==', operatorUid),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const docs = snapshot.docs.map((d) => d.data() as FirestoreBooking);
          const ownershipChecks = await Promise.all(
            docs.map(async (booking) => ({
              booking,
              isOwnedBySourceOperator: await bookingBelongsToOperator(booking, operatorUid),
            })),
          );
          setBookings(ownershipChecks.filter((x) => x.isOwnedBySourceOperator).map((x) => x.booking));
          setLoading(false);
        } catch (err) {
          console.error('useOperatorBookings ownership filter:', err);
          setError(err instanceof Error ? err.message : 'Failed to verify booking ownership.');
          setLoading(false);
        }
      },
      (err) => {
        console.error('useOperatorBookings:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [operatorUid]);

  const effectiveBookings = operatorUid ? bookings : [];
  const effectiveLoading = operatorUid ? loading : false;
  const effectiveError = operatorUid ? error : null;

  return { bookings: effectiveBookings, loading: effectiveLoading, error: effectiveError };
}
