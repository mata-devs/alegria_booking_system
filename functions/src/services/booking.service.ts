import { db } from "../firebase";
import * as admin from "firebase-admin";

const BOOKING_ADVANCE_DAYS = 90;
const MAX_PERSONS_PER_SLOT = 30;
const SERVICE_CHARGE_PERCENTAGE = 5;

export interface Representative {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  age: number;
  nationality: string;
}

export interface Guest {
  name: string;
  age: number;
  nationality: string;
}

export interface BookingData {
  representative: Representative;
  guests: Guest[];
  activityId: string;
  timeSlotId: string;
  tourDate: admin.firestore.Timestamp;
  promoCode?: string;
  paymentMethod?: string;
  idempotencyKey?: string; // For duplicate request prevention
}

export interface PaymentData {
  bookingId: string;
  amount: number;
  paymentMethod: "Gcash" | "Maya" | "Cash";
  status: "pending" | "paid" | "refunded";
  receiptUrl?: string;
}

export async function getActivity(activityId: string) {
  const doc = await db.collection("activities").doc(activityId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function getTimeSlot(timeSlotId: string) {
  const doc = await db.collection("timeslots").doc(timeSlotId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function validatePromoCode(
    code: string
): Promise<{ discount: number; operatorUid?: string; voucherId?: string } | null> {
  const snapshot = await db.collection("voucherCodes").where("code", "==", code).get();

  if (snapshot.empty) return null;

  const voucher = snapshot.docs[0].data();
  const now = new Date();

  // Check if active
  if (voucher.voucherStatus !== "Active") return null;

  // Check if not expired
  if (voucher.expirationDate) {
    const expiryDate = voucher.expirationDate.toDate?.() || voucher.expirationDate;
    if (new Date(expiryDate) < now) return null;
  }

  // Check usage limit
  if (
      voucher.numberOfUsersAllowed &&
      voucher.numberOfUsersUsed >= voucher.numberOfUsersAllowed
  ) {
    return null;
  }

  return {
    discount: voucher.discount,
    operatorUid: voucher.operatorUid,
    voucherId: snapshot.docs[0].id,
  };
}

export async function calculatePricing(
    numberOfGuests: number,
    pricePerGuest: number,
    discount?: number
) {
  const baseAmount = numberOfGuests * pricePerGuest;
  const serviceCharge = (baseAmount * SERVICE_CHARGE_PERCENTAGE) / 100;
  const subtotal = baseAmount + serviceCharge;
  const discountAmount = discount ? (subtotal * discount) / 100 : 0;
  const finalPrice = subtotal - discountAmount;

  return {
    baseAmount,
    serviceCharge,
    subtotal,
    discountPercentage: discount || 0,
    discountAmount,
    finalPrice,
  };
}

export async function assignOperatorByLoadBalancing(
    tourDate: admin.firestore.Timestamp,
    preferredOperatorUid?: string
) {
  // If preferred operator provided, use it directly
  if (preferredOperatorUid) {
    return preferredOperatorUid;
  }

  // Query all active operators
  const operatorsSnap = await db
      .collection("users")
      .where("role", "==", "operator")
      .where("isActive", "==", true)
      .where("approvalStatus", "==", "accepted")
      .get();

  if (operatorsSnap.empty) {
    throw new Error("No active operators available");
  }

  // Convert tourDate to date string for comparison
  const tourDateMs = tourDate.toMillis?.() || new Date(tourDate as any).getTime();
  const tourDateStr = new Date(tourDateMs).toISOString().split("T")[0];

  // Count bookings per operator on the specific tour date
  const operatorBookingCounts: { [uid: string]: number } = {};
  let minCount = Infinity;

  for (const operatorDoc of operatorsSnap.docs) {
    const operatorUid = operatorDoc.id;

    // Query bookings for this operator on the specific tour date
    const bookingsSnap = await db
        .collection("bookings")
        .where("operatorUid", "==", operatorUid)
        .where("status", "in", ["reserved", "confirmed", "paid"])
        .get();

    // Filter by tour date in memory
    const bookingsOnDate = bookingsSnap.docs.filter((doc) => {
      const booking = doc.data();
      const bookingTourDateMs = booking.tourDate?.toMillis?.() || new Date(booking.tourDate as any).getTime();
      const bookingTourDateStr = new Date(bookingTourDateMs).toISOString().split("T")[0];
      return bookingTourDateStr === tourDateStr;
    });

    const count = bookingsOnDate.length;
    operatorBookingCounts[operatorUid] = count;
    minCount = Math.min(minCount, count);
  }

  // Get all operators with minimum count
  const minOperators = Object.entries(operatorBookingCounts)
      .filter(([_, count]) => count === minCount)
      .map(([uid]) => uid);

  // If tie, use totalBookingsHandled as tiebreaker
  let selectedOperator = minOperators[0];
  if (minOperators.length > 1) {
    let maxTotal = 0;
    for (const uid of minOperators) {
      const operatorDoc = operatorsSnap.docs.find((d) => d.id === uid);
      const totalBookingsHandled = operatorDoc?.data()?.totalBookingsHandled || 0;
      if (totalBookingsHandled > maxTotal) {
        maxTotal = totalBookingsHandled;
        selectedOperator = uid;
      }
    }
  }

  return selectedOperator;
}

export async function createBooking(data: BookingData) {
  // Validate tour date is within 90 days
  const now = new Date();
  const tourDateMs = data.tourDate.toMillis?.() || new Date(data.tourDate as any).getTime();
  const tourDate = new Date(tourDateMs);
  const daysDiff = Math.floor((tourDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0 || daysDiff > BOOKING_ADVANCE_DAYS) {
    throw new Error(`Booking must be within ${BOOKING_ADVANCE_DAYS} days in advance`);
  }

  // Get activity and validate
  const activity = await getActivity(data.activityId);
  if (!activity) throw new Error("Activity not found");
  const activityData = activity as any;
  if (!activityData.isActive) throw new Error("Activity is not active");

  // Get time slot and validate
  const timeSlot = await getTimeSlot(data.timeSlotId);
  if (!timeSlot) throw new Error("Time slot not found");

  const numberOfGuests = data.guests.length + 1; // guests + representative

  if (numberOfGuests > MAX_PERSONS_PER_SLOT) {
    throw new Error(`Maximum ${MAX_PERSONS_PER_SLOT} persons per slot`);
  }

  // Validate promo code if provided
  let promoData = null;
  if (data.promoCode) {
    promoData = await validatePromoCode(data.promoCode);
    if (!promoData) throw new Error("Invalid or expired promo code");
  }

  // Calculate pricing
  const pricing = await calculatePricing(
      numberOfGuests,
      activityData.pricePerGuest,
      promoData?.discount
  );

  // Assign operator
  const assignmentType = promoData?.operatorUid ? "voucher" : "auto book-balancing";
  const operatorUid = await assignOperatorByLoadBalancing(
      data.tourDate,
      promoData?.operatorUid
  );

  // Generate booking reference
  const bookingRef = `BK-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

  let bookingDocId = "";

  // Check for duplicate request using idempotency key stored in bookings
  if (data.idempotencyKey) {
    const existingBooking = await db
        .collection("bookings")
        .where("idempotencyKey", "==", data.idempotencyKey)
        .limit(1)
        .get();

    if (!existingBooking.empty) {
      const booking = existingBooking.docs[0].data();
      // Return existing booking if created with same idempotency key
      return {
        bookingId: existingBooking.docs[0].id,
        bookingReference: booking.bookingId || bookingRef,
        status: booking.status,
        operatorUid: booking.operatorUid,
      };
    }
  }

  // Create booking in transaction
  await db.runTransaction(async (tx) => {
    // Verify time slot availability
    const slotSnap = await tx.get(db.collection("timeslots").doc(data.timeSlotId));
    if (!slotSnap.exists) throw new Error("Time slot not found");
    const slot = slotSnap.data();
    if (!slot || (slot.slotsAvailable || 0) < numberOfGuests) {
      throw new Error("Insufficient slots available");
    }

    // Create booking document
    const bookingDocRef = db.collection("bookings").doc();
    bookingDocId = bookingDocRef.id;

    tx.set(bookingDocRef, {
      bookingId: bookingDocId,
      representative: data.representative,
      guests: data.guests,
      activityId: data.activityId,
      timeSlotId: data.timeSlotId,
      tourDate: data.tourDate,
      status: "reserved",
      numberOfGuests,
      operatorUid,
      assignmentType,
      promoCode: data.promoCode || null,
      idempotencyKey: data.idempotencyKey || null,
      ...pricing,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update time slot availability
    tx.update(db.collection("timeslots").doc(data.timeSlotId), {
      slotsAvailable: (slot.slotsAvailable || 0) - numberOfGuests,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update voucher usage if promo code used
    if (data.promoCode && promoData?.voucherId) {
      tx.update(db.collection("voucherCodes").doc(promoData.voucherId), {
        numberOfUsersUsed: admin.firestore.FieldValue.increment(1),
      });
    }
  });

  const result = {
    bookingId: bookingDocId,
    bookingReference: bookingRef,
    status: "reserved",
    operatorUid,
  };

  return result;
}

export async function getBooking(bookingId: string) {
  const doc = await db.collection("bookings").doc(bookingId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function cancelBooking(
    bookingId: string,
    representativeEmail?: string
) {
  await db.runTransaction(async (tx) => {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) throw new Error("Booking not found");

    const booking = bookingSnap.data();
    if (!booking) throw new Error("Booking not found");

    // Verify ownership if email provided
    if (representativeEmail && booking.representative?.email !== representativeEmail) {
      throw new Error("Unauthorized: email mismatch");
    }

    // Only allow cancellation if status is reserved or paid
    if (!["reserved", "paid"].includes(booking.status)) {
      throw new Error(`Cannot cancel booking with status: ${booking.status}`);
    }

    // Return slots to availability
    const slotRef = db.collection("timeslots").doc(booking.timeSlotId);
    const slotSnap = await tx.get(slotRef);
    if (slotSnap.exists) {
      const slot = slotSnap.data();
      if (slot) {
        tx.update(slotRef, {
          slotsAvailable: (slot.slotsAvailable || 0) + booking.numberOfGuests,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Update booking
    tx.update(bookingRef, {
      status: "cancelled",
      cancellationReason: "customer_cancellation",
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export async function rescheduleBooking(
    bookingId: string,
    newTimeSlotId: string,
    newTourDate: admin.firestore.Timestamp,
    representativeEmail?: string
) {
  const now = new Date();
  const tourDateMs = newTourDate.toMillis?.() || new Date(newTourDate as any).getTime();
  const tourDate = new Date(tourDateMs);
  const daysDiff = Math.floor((tourDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0 || daysDiff > BOOKING_ADVANCE_DAYS) {
    throw new Error(`New tour date must be within ${BOOKING_ADVANCE_DAYS} days`);
  }

  await db.runTransaction(async (tx) => {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) throw new Error("Booking not found");

    const booking = bookingSnap.data();
    if (!booking) throw new Error("Booking not found");

    // Verify ownership
    if (representativeEmail && booking.representative?.email !== representativeEmail) {
      throw new Error("Unauthorized: email mismatch");
    }

    // Only allow rescheduling if status is reserved or paid
    if (!["reserved", "paid"].includes(booking.status)) {
      throw new Error(`Cannot reschedule booking with status: ${booking.status}`);
    }

    const oldSlotRef = db.collection("timeslots").doc(booking.timeSlotId);
    const newSlotRef = db.collection("timeslots").doc(newTimeSlotId);

    const oldSlotSnap = await tx.get(oldSlotRef);
    const newSlotSnap = await tx.get(newSlotRef);

    if (!newSlotSnap.exists) throw new Error("New time slot not found");

    const oldSlot = oldSlotSnap.data();
    const newSlot = newSlotSnap.data();

    if (!newSlot || (newSlot.slotsAvailable || 0) < booking.numberOfGuests) {
      throw new Error("Insufficient slots in new time slot");
    }

    // Release from old slot
    if (oldSlotSnap.exists && oldSlot) {
      tx.update(oldSlotRef, {
        slotsAvailable: (oldSlot.slotsAvailable || 0) + booking.numberOfGuests,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Allocate to new slot
    tx.update(newSlotRef, {
      slotsAvailable: (newSlot.slotsAvailable || 0) - booking.numberOfGuests,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update booking
    tx.update(bookingRef, {
      timeSlotId: newTimeSlotId,
      tourDate: newTourDate,
      rescheduledAt: admin.firestore.FieldValue.serverTimestamp(),
      previousTourDate: booking.tourDate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export async function confirmPayment(
    bookingId: string,
    operatorUid?: string,
    idempotencyKey?: string
) {
  await db.runTransaction(async (tx) => {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) throw new Error("Booking not found");

    const booking = bookingSnap.data();
    if (!booking) throw new Error("Booking not found");

    // Verify operator authorization if provided
    if (operatorUid && booking.operatorUid !== operatorUid) {
      throw new Error("Unauthorized: not the assigned operator");
    }

    // Idempotent: if already paid, don't re-process
    if (booking.status === "paid" || booking.status === "confirmed" || booking.status === "completed") {
      return; // Already paid, skip update
    }

    if (booking.status !== "reserved") {
      throw new Error("Booking must be in reserved status to confirm payment");
    }

    // Update booking status with idempotency tracking
    tx.update(bookingRef, {
      status: "paid",
      paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentIdempotencyKey: idempotencyKey || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export async function rejectPayment(
    bookingId: string,
    rejectionReason: string,
    rejectionNote?: string,
    operatorUid?: string
) {
  await db.runTransaction(async (tx) => {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) throw new Error("Booking not found");

    const booking = bookingSnap.data();
    if (!booking) throw new Error("Booking not found");

    // Verify operator authorization
    if (operatorUid && booking.operatorUid !== operatorUid) {
      throw new Error("Unauthorized: not the assigned operator");
    }

    // Return slots to availability
    const slotRef = db.collection("timeslots").doc(booking.timeSlotId);
    const slotSnap = await tx.get(slotRef);
    if (slotSnap.exists) {
      const slot = slotSnap.data();
      if (slot) {
        tx.update(slotRef, {
          slotsAvailable: (slot.slotsAvailable || 0) + booking.numberOfGuests,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Update booking
    tx.update(bookingRef, {
      status: "cancelled",
      rejectionReason,
      rejectionNote: rejectionNote || null,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: operatorUid || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export async function scanQRCode(
    bookingId: string,
    operatorUid?: string,
    idempotencyKey?: string
) {
  await db.runTransaction(async (tx) => {
    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) throw new Error("Booking not found");

    const booking = bookingSnap.data();
    if (!booking) throw new Error("Booking not found");

    // Verify operator
    if (operatorUid && booking.operatorUid !== operatorUid) {
      throw new Error("Unauthorized: not the assigned operator");
    }

    // Idempotent: if already confirmed or completed, don't re-increment operator counter
    if (booking.status === "confirmed" || booking.status === "completed") {
      return; // Already confirmed, skip update
    }

    if (booking.status !== "paid") {
      throw new Error("Booking must be in paid status for confirmation");
    }

    // Update booking status and increment operator counter
    tx.update(bookingRef, {
      status: "confirmed",
      qrScannedAt: admin.firestore.FieldValue.serverTimestamp(),
      qrIdempotencyKey: idempotencyKey || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Increment operator's totalBookingsHandled
    const operatorRef = db.collection("users").doc(booking.operatorUid);
    tx.update(operatorRef, {
      totalBookingsHandled: admin.firestore.FieldValue.increment(1),
    });
  });

  return { success: true, message: "Booking confirmed" };
}

export async function getPendingBookings(operatorUid: string) {
  const snapshot = await db
      .collection("bookings")
      .where("operatorUid", "==", operatorUid)
      .where("status", "==", "reserved")
      .orderBy("createdAt", "desc")
      .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAvailableSlots(
    activityId?: string,
    dateStr?: string,
    guests?: number
) {
  let query: FirebaseFirestore.Query = db.collection("timeslots");

  if (activityId) {
    query = query.where("activityId", "==", activityId);
  }

  if (dateStr) {
    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query
        .where("startTime", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
        .where("startTime", "<=", admin.firestore.Timestamp.fromDate(endOfDay));
  }

  const snapshot = await query.get();
  let slots = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Filter by guest capacity if provided
  if (guests) {
    slots = slots.filter((slot: any) => (slot.slotsAvailable || 0) >= guests);
  }

  return slots;
}

export async function getActivities() {
  const snapshot = await db.collection("activities").where("isActive", "==", true).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAllBookings() {
  const snapshot = await db.collection("bookings").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
