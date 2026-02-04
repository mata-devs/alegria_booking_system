import {onRequest} from "firebase-functions/v2/https";
import {db} from "./firebase";
import * as admin from "firebase-admin";

/**
 * @openapi
 * /initDb:
 *   post:
 *     summary: Initialize Database with dummy data
 *     description: Populates Firestore with initial collections (users, activities, slots, bookings, payments) and dummy data.
 *     responses:
 *       200:
 *         description: Database initialized successfully
 * @route POST /initDb
 */
export const initDb = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed. Use POST.");
    return;
  }

  // Check for secret key if configured in .env
  const secret = req.headers["x-init-secret"];
  const expectedSecret = process.env.INIT_DB_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    res.status(401).send("Unauthorized: Invalid or missing secret key.");
    return;
  }

  try {
    const batch = db.batch();

    // 1. Create dummy users
    const user1Ref = db.collection("users").doc("U001");
    batch.set(user1Ref, {
      email: "janedoe@gmail.com",
      password: "hashedpassword",
      role: "customer",
      firstName: "Jane",
      lastName: "Doe",
      phoneNo: "09271281",
      status: "active",
      createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      nationality: "EU",
      address: "NYC",
      totalBookings: 3,
      lastBookingDate: admin.firestore.Timestamp.fromDate(new Date("2026-01-10T00:00:00")),
      operatorID: null,
      totalBookingsHandled: null,
      bio: "Lorem ipsum",
    });

    const user2Ref = db.collection("users").doc("U002");
    batch.set(user2Ref, {
      email: "tour1@alegria.com",
      password: "hashedpassword",
      role: "tour_operator",
      firstName: "Juan",
      lastName: "Carlos",
      phoneNo: "09712612",
      status: "active",
      createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T12:00:00")),
      nationality: "PH",
      address: null,
      totalBookings: null,
      lastBookingDate: null,
      operatorID: "OP-001",
      totalBookingsHandled: 5,
      bio: "Lorem ipsum",
    });

    // 2. Create dummy activity
    const activityRef = db.collection("activities").doc("A001");
    batch.set(activityRef, {
      activityName: "Canyoneering",
      activityCode: "ALEGRIA-001",
      description: "Lorem ipsum",
      pricePerPax: 205,
      duration: "5 hours",
      difficulty: "moderate",
      isActive: true,
      minimumPax: 1,
      maximumPax: 30,
      requiresGuide: true,
      imageURL: "alegria.png",
      inclusions: "Guide,Equipment",
      exclusions: "Meals, Transportation",
      createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
    });

    // 3. Create dummy slot
    const slotRef = db.collection("slots").doc("20260101-AM");
    batch.set(slotRef, {
      date: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      activityID: "A001",
      timeSlot: "AM",
      startTime: "8:00",
      endTime: "12:00",
      maxCapacity: 30,
      currentBookings: 8,
      availableSlots: 22,
      isAvailable: true,
      status: "open",
      closeReason: null,
      createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
    });

    // 4. Create dummy booking
    const bookingRef = db.collection("bookings").doc("B001");
    batch.set(bookingRef, {
      referenceNumber: "TOUR-t22542",
      customerID: "U001",
      customerEmail: "janedoe@gmail.com",
      bookingDate: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      numberOfPax: 5,
      activityType: "Canyoneering",
      tourOperatorID: "U002",
      tourOperatorName: "Juan Carlos",
      tourOperatorCode: "OP-001",
      assignmentType: "auto",
      paymentMethod: "gcash",
      paymentReceiptURL: "/receipt/b001.png",
      paymentAmount: 1325,
      waiverData: 1,
      agreedToTerms: "yes",
      emergencyContact: "John Smith",
      emergencyPhone: "09732162182",
      medicalConditions: "none",
      signedAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      status: "confirmed",
      createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      rejectReason: null,
      confirmationEmailSent: true,
      confirmationEmailSentAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-01T07:00:00")),
      slotID: "20260101-AM",
    });

    // 5. Create dummy payment
    const paymentRef = db.collection("payments").doc("P001");
    batch.set(paymentRef, {
      bookingID: "B001",
      customerID: "U001",
      referenceNumber: "TOUR-t22542",
      paymentMethod: "gcash_qr",
      paymentReceiptURL: "/receipts/B001.png",
      amount: 1325,
      paymentStatus: "pending",
      verifiedBy: null,
      rejectionReason: null,
      transactionReferenceNumber: "TRX12345",
      paymentDate: admin.firestore.Timestamp.fromDate(new Date("2026-01-05T10:00:00")),
      submittedAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-05T10:00:00")),
      qrCodeUsed: "gcash",
      qrCodeURL: "/qrcodes/gcash1.png",
      createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-05T10:00:00")),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date("2026-01-05T10:00:00")),
      notes: "Waiting for operator",
      verifiedAt: null,
    });

    await batch.commit();
    res.status(200).json({
      message: "Database initialized successfully with dummy data.",
      collections: ["users", "activities", "slots", "bookings", "payments"],
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    res.status(500).send("Internal Server Error");
  }
});
