'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase';

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
  timeSlotId: string;
  timeSlot: 'AM' | 'PM';
  tourDate: Timestamp;
  operatorUid: string;
  assignmentType: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentId: string;
  paymentExpiresAt: Timestamp;
  receiptUrl: string;
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

/* ── Hook ─────────────────────────────────────────────────── */

export function useOperatorBookings(operatorUid: string | undefined) {
  const [bookings, setBookings] = useState<FirestoreBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorUid) {
      setBookings([]);
      setLoading(false);
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
      (snapshot) => {
        const docs = snapshot.docs.map((d) => d.data() as FirestoreBooking);
        setBookings(docs);
        setLoading(false);
      },
      (err) => {
        console.error('useOperatorBookings:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [operatorUid]);

  return { bookings, loading, error };
}
