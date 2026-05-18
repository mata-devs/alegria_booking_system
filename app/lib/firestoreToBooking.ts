'use client';

import type { FirestoreBooking } from '@/app/hooks/useOperatorBookings';
import type {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '@/app/(operator)/operator/bookings/details';

/**
 * Shared mapper: Firestore `bookings` document → operator UI `Booking` shape.
 *
 * Used by:
 * - `/operator/bookings` (active/incoming bookings)
 * - `/operator/history`  (completed/cancelled bookings history)
 */
export function firestoreToBooking(doc: FirestoreBooking): Booking {
  const tourDate = doc.tourDate?.toDate?.();
  const createdAt = doc.createdAt?.toDate?.();

  const scheduleLabel = tourDate
    ? tourDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const requestDate = createdAt
    ? createdAt.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
      })
    : '—';

  const statusMap: Record<string, BookingStatus> = {
    reserved: 'Pending',
    pending: 'Pending',
    paid: 'Confirmed',
    confirmed: 'Confirmed',
    completed: 'Completed',
    in_progress: 'In Progress',
    cancelled: 'Cancelled',
  };

  const paymentStatusMap: Record<string, PaymentStatus> = {
    pending: 'Pending',
    paid: 'Paid',
    expired: 'Expired',
  };

  return {
    id: doc.bookingId,
    bookingIdLabel: doc.bookingId,
    operatorUid: doc.operatorUid,
    scheduleLabel,
    requestDate,
    representative: {
      name: doc.representative.fullName,
      age: doc.representative.age,
      gender: doc.representative.gender,
      email: doc.representative.email,
      mobile: doc.representative.phoneNumber,
    },
    otherGuests: doc.guests.map((g) => ({
      name: g.fullName,
      age: g.age,
      gender: g.gender,
    })),
    payment: {
      pricePerPerson: doc.pricePerGuest,
      qty: doc.numberOfGuests,
      serviceCharge: doc.serviceCharge,
      option: doc.paymentMethod,
    },
    sourceType: (doc.sourceType === 'tourPackage' ? 'tourPackage' : 'activity') as 'activity' | 'tourPackage',
    itemName: doc.activityName,
    status: statusMap[doc.status] ?? 'Pending',
    paymentStatus: paymentStatusMap[doc.paymentStatus] ?? 'Pending',
    uploads: doc.receiptUrl
      ? [{ id: 'receipt', name: 'Payment Receipt', url: doc.receiptUrl }]
      : [],
    checkInToken: doc.checkInToken,
  };
}

