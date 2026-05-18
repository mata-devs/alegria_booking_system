import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../shared/firebase";

type ReschedulePayload = {
  bookingId?: string;
  tourDate?: string; // YYYY-MM-DD
};

function toStartOfDayTimestamp(dateStr: string): Timestamp {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    throw new HttpsError("invalid-argument", "Invalid tourDate format.");
  }
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

export const operatorRescheduleBooking = onCall(
  { region: "asia-southeast1" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const data = (request.data ?? {}) as ReschedulePayload;
    const bookingId = data.bookingId?.trim();
    const tourDate = data.tourDate?.trim();
    if (!bookingId || !tourDate) {
      throw new HttpsError("invalid-argument", "bookingId and tourDate are required.");
    }

    const bookingRef = db.collection("bookings").doc(bookingId);
    const snap = await bookingRef.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Booking not found.");
    }

    const booking = snap.data() as Record<string, unknown>;
    if (booking.operatorUid !== uid) {
      throw new HttpsError("permission-denied", "This booking is not assigned to you.");
    }

    const currentStatus = String(booking.status ?? "");
    if (currentStatus !== "confirmed" && currentStatus !== "paid") {
      throw new HttpsError("failed-precondition", "Only confirmed bookings can be rescheduled.");
    }

    await bookingRef.update({
      tourDate: toStartOfDayTimestamp(tourDate),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { bookingId, status: currentStatus, tourDate };
  }
);

