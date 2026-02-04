import { db } from "../firebase";
import * as admin from "firebase-admin";

export async function getAllBookings() {
  const snapshot = await db.collection("bookings").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAvailableSlots(activityID?: string, dateStr?: string) {
  let query: FirebaseFirestore.Query = db.collection("slots");

  if (activityID) {
    query = query.where("activityID", "==", activityID);
  }

  if (dateStr) {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);
    query = query
      .where("date", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("date", "<=", admin.firestore.Timestamp.fromDate(endOfDay));
  }

  query = query.where("isAvailable", "==", true);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

interface CreateBookingInput {
  slotID: string;
  numberOfPax: number;
  customerID: string;
  customerEmail?: string;
  [key: string]: any;
}

export async function createBooking(input: CreateBookingInput) {
  const refNumber = `TOUR-${Math.random().toString(36).substring(2, 8)}`;
  let bookingDocId = "";

  await db.runTransaction(async (tx) => {
    const slotRef = db.collection("slots").doc(input.slotID);
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists) throw new Error("Slot not found");
    const slot = slotSnap.data() as any;

    if (!slot.isAvailable || slot.availableSlots < input.numberOfPax) {
      throw new Error("Insufficient availability");
    }

    tx.update(slotRef, {
      currentBookings: (slot.currentBookings || 0) + input.numberOfPax,
      availableSlots: slot.availableSlots - input.numberOfPax,
      isAvailable: slot.availableSlots - input.numberOfPax > 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const bookingRef = db.collection("bookings").doc();
    bookingDocId = bookingRef.id;
    tx.set(bookingRef, {
      referenceNumber: refNumber,
      status: "pending",
      bookingDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...input,
    });
  });

  return { bookingID: bookingDocId, referenceNumber: refNumber };
}

export async function cancelBooking(bookingID: string) {
  await db.runTransaction(async (tx) => {
    const bookingRef = db.collection("bookings").doc(bookingID);
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) throw new Error("Booking not found");
    const booking = bookingSnap.data() as any;

    if (booking.status === "cancelled") return; // idempotent

    const slotRef = db.collection("slots").doc(booking.slotID);
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists) throw new Error("Slot not found");
    const slot = slotSnap.data() as any;

    tx.update(slotRef, {
      currentBookings: Math.max(0, (slot.currentBookings || 0) - booking.numberOfPax),
      availableSlots: (slot.availableSlots || 0) + booking.numberOfPax,
      isAvailable: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.update(bookingRef, {
      status: "cancelled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export async function rescheduleBooking(bookingID: string, newSlotID: string) {
  await db.runTransaction(async (tx) => {
    const bookingRef = db.collection("bookings").doc(bookingID);
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) throw new Error("Booking not found");
    const booking = bookingSnap.data() as any;

    const oldSlotRef = db.collection("slots").doc(booking.slotID);
    const newSlotRef = db.collection("slots").doc(newSlotID);

    const [oldSlotSnap, newSlotSnap] = await Promise.all([
      tx.get(oldSlotRef),
      tx.get(newSlotRef),
    ]);

    if (!newSlotSnap.exists) throw new Error("New slot not found");
    const oldSlot = oldSlotSnap.data() as any;
    const newSlot = newSlotSnap.data() as any;

    if (!newSlot.isAvailable || newSlot.availableSlots < booking.numberOfPax) {
      throw new Error("Insufficient availability in the new slot");
    }

    // release from old slot
    if (oldSlotSnap.exists) {
      tx.update(oldSlotRef, {
        currentBookings: Math.max(0, (oldSlot.currentBookings || 0) - booking.numberOfPax),
        availableSlots: (oldSlot.availableSlots || 0) + booking.numberOfPax,
        isAvailable: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // allocate to new slot
    tx.update(newSlotRef, {
      currentBookings: (newSlot.currentBookings || 0) + booking.numberOfPax,
      availableSlots: newSlot.availableSlots - booking.numberOfPax,
      isAvailable: newSlot.availableSlots - booking.numberOfPax > 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // update booking
    tx.update(bookingRef, {
      slotID: newSlotID,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export async function scanBooking(bookingID: string) {
  const bookingDoc = await db.collection("bookings").doc(bookingID).get();
  if (!bookingDoc.exists) throw new Error("Booking not found");
  const booking = bookingDoc.data() as any;
  const userDoc = await db.collection("users").doc(booking.customerID).get();
  return {
    booking: { id: bookingDoc.id, ...booking },
    customer: userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null,
  };
}
