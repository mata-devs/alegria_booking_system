import { HttpsError, onCall } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../shared/firebase";

type CheckInPayload = {
  bookingId?: string;
  token?: string;
};

export const checkInBooking = onCall(
  { region: "asia-southeast1" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const data = (request.data ?? {}) as CheckInPayload;
    const bookingId = data.bookingId?.trim();
    const token = data.token?.trim();

    if (!bookingId || !token) {
      throw new HttpsError("invalid-argument", "bookingId and token are required.");
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
      throw new HttpsError("failed-precondition", "Booking must be confirmed before check-in.");
    }

    const storedToken = String(booking.checkInToken ?? "");
    if (!storedToken || storedToken !== token) {
      throw new HttpsError("permission-denied", "Invalid check-in token.");
    }

    const startedAt = Timestamp.now();
    await bookingRef.update({
      status: "in_progress",
      tourStartedAt: startedAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { bookingId, status: "in_progress", tourStartedAt: startedAt.toMillis() };
  }
);

