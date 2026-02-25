import {auth, db} from "./firebase";
import {Timestamp as FirestoreTimestamp} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const EMULATOR_ADMIN_UID = "admin-emulator-uid";
const EMULATOR_OPERATOR_UID = "operator-emulator-uid";

async function ensureAuthUser(params: {
  uid: string;
  email: string;
  password: string;
  displayName: string;
}) {
  try {
    await auth.getUser(params.uid);
    await auth.updateUser(params.uid, {
      email: params.email,
      password: params.password,
      displayName: params.displayName,
      emailVerified: true,
      disabled: false,
    });
    return;
  } catch (error: any) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }

  await auth.createUser({
    uid: params.uid,
    email: params.email,
    password: params.password,
    displayName: params.displayName,
    emailVerified: true,
    disabled: false,
  });
}

/**
 * @openapi
 * /initDb:
 *   post:
 *     summary: Initialize Database with dummy data
 *     description: Populates Firestore with initial collections (users, activities, timeslots, bookings, payments, entities, voucherCodes) and dummy data for testing.
 *     tags: [Database]
 *     parameters:
 *       - in: header
 *         name: x-init-secret
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional secret key for authorization (not required in emulator mode)
 *     responses:
 *       200:
 *         description: Database initialized successfully with dummy data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database initialized successfully with dummy data."
 *                 collections:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["users", "activities", "timeslots", "bookings", "payments", "entities", "voucherCodes"]
 *                 admin:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                       example: "admin-emulator-uid"
 *                     email:
 *                       type: string
 *                       example: "paulo.carabuena@cit.edu"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                 emulatorCredentials:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           example: "paulo.carabuena@cit.edu"
 *                         password:
 *                           type: string
 *                           example: "Admin123!"
 *                     operator:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           example: "tour1@alegria.com"
 *                         password:
 *                           type: string
 *                           example: "Operator123!"
 *                 idempotencyInfo:
 *                   type: object
 *                   description: Information about idempotency protection for bookings
 *       401:
 *         description: Unauthorized - Invalid or missing secret key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized: Invalid or missing secret key."
 *       405:
 *         description: Method Not Allowed - Only POST is supported
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Method Not Allowed. Use POST."
 *       500:
 *         description: Internal Server Error - Database initialization failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 details:
 *                   type: string
 *                   example: "Firestore connection failed"
 *                 code:
 *                   type: string
 *                   example: "UNKNOWN"
 */
export const initDbHandler = async (req: any, res: any) => {
  logger.info("[initDb] Database initialization request received");

  // Log environment diagnostics
  const nodeEnv = process.env.NODE_ENV;
  const firebaseConfig = {
    projectId: process.env.PROJECT_ID || process.env.GCP_PROJECT,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
  };
  logger.debug("[initDb] Environment diagnostics", { nodeEnv, firebaseConfig });

  if (req.method !== "POST") {
    logger.warn("[initDb] Invalid HTTP method", { method: req.method });
    res.status(405).send("Method Not Allowed. Use POST.");
    return;
  }

  // Check for secret key if configured in .env (skip in emulator mode)
  const secret = req.headers["x-init-secret"];
  const expectedSecret = process.env.INIT_DB_SECRET;
  const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

  logger.debug("[initDb] Validating secret", { hasSecret: !!secret, hasExpectedSecret: !!expectedSecret, isEmulator });
  if (!isEmulator && expectedSecret && secret !== expectedSecret) {
    logger.warn("[initDb] Secret validation failed");
    res.status(401).send("Unauthorized: Invalid or missing secret key.");
    return;
  }

  try {
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      logger.debug("[initDb] Ensuring emulator auth users");

      await ensureAuthUser({
        uid: EMULATOR_ADMIN_UID,
        email: "paulo.carabuena@cit.edu",
        password: "Admin123!",
        displayName: "Admin User",
      });

      await ensureAuthUser({
        uid: EMULATOR_OPERATOR_UID,
        email: "tour1@alegria.com",
        password: "Operator123!",
        displayName: "Operator User",
      });
    }

    logger.debug("[initDb] Creating batch write");

    // Test Firestore connection
    logger.debug("[initDb] Testing Firestore connection");
    try {
      await db.collection("_test").doc("connection").get();
      logger.debug("[initDb] Firestore connection successful - test read completed");
    } catch (connError) {
      logger.error("[initDb] Firestore connection test failed", { error: (connError as any)?.message, code: (connError as any)?.code });
      throw new Error(`Firestore connection failed: ${(connError as any)?.message}`);
    }

    const batch = db.batch();

    // 1. Create admin user (your account)
    logger.debug("[initDb] Creating admin user");
    try {
      const adminUid = process.env.FIREBASE_AUTH_EMULATOR_HOST ? EMULATOR_ADMIN_UID : "1NUCVz8gNnC8RfnB3LAjr9kTVZDe";
      const adminUserRef = db.collection("users").doc(adminUid);
      batch.set(adminUserRef, {
        uid: adminUid,
        name: "Paulo Carabuena",
        email: "paulo.carabuena@cit.edu",
        phoneNumber: "+639120000000",
        address: "Alegria, Cebu",
        role: "admin",
        documents: [],
        approvalStatus: "accepted",
        isActive: true,
        operatorCode: null,
        totalBookingsHandled: 0,
        createdAt: FirestoreTimestamp.fromDate(new Date()),
        updatedAt: FirestoreTimestamp.fromDate(new Date()),
      });
      logger.debug("[initDb] Admin user added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare admin user batch", { error: (collError as any)?.message });
      throw collError;
    }

    // 2. Create dummy operator user
    logger.debug("[initDb] Creating operator user");
    try {
      const operatorUid = process.env.FIREBASE_AUTH_EMULATOR_HOST ? EMULATOR_OPERATOR_UID : "U002";
      const operatorUserRef = db.collection("users").doc(operatorUid);
      batch.set(operatorUserRef, {
        uid: operatorUid,
        name: "Operator User",
        email: "tour1@alegria.com",
        phoneNumber: "+639121112222",
        address: "Alegria, Cebu",
        role: "operator",
        approvalStatus: "accepted",
        isActive: true,
        documents: ["https://example.com/doc1.pdf"],
        operatorCode: "OP-001",
        totalBookingsHandled: 5,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T12:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T12:00:00")),
      });
      logger.debug("[initDb] Operator user added to batch");

      const operatorTwoRef = db.collection("users").doc("U003");
      batch.set(operatorTwoRef, {
        uid: "U003",
        name: "Lou Uy",
        email: "louagauy@gmail.com",
        phoneNumber: "+639129998877",
        address: "Alegria, Cebu",
        role: "operator",
        approvalStatus: "accepted",
        isActive: true,
        documents: [],
        operatorCode: "OP-002",
        totalBookingsHandled: 1,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-03T10:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-03T10:00:00")),
      });
      logger.debug("[initDb] Second operator user added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare operator user batch", { error: (collError as any)?.message });
      throw collError;
    }

    // 3. Create dummy customer user
    logger.debug("[initDb] Creating customer user");
    try {
      const customerUserRef = db.collection("users").doc("U001");
      batch.set(customerUserRef, {
        uid: "U001",
        name: "Jane Doe",
        email: "janedoe@gmail.com",
        phoneNumber: "+639123456789",
        address: "Cebu City, Cebu",
        role: "customer",
        documents: [],
        approvalStatus: "accepted",
        isActive: true,
        operatorCode: null,
        totalBookingsHandled: 0,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
      });
      logger.debug("[initDb] Customer user added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare customer user batch", { error: (collError as any)?.message });
      throw collError;
    }

    // 4. Create dummy activity
    logger.debug("[initDb] Creating activity");
    try {
      const activityRef = db.collection("activities").doc("A001");
      batch.set(activityRef, {
        activityId: "A001",
        name: "Canyoneering",
        description: "Experience the thrill of canyoneering in Alegria",
        durationMinutes: 300,
        maxSlots: 30,
        pricePerGuest: 205,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
      });
      logger.debug("[initDb] Activity added to batch");

      const activityRefTwo = db.collection("activities").doc("A002");
      batch.set(activityRefTwo, {
        activityId: "A002",
        name: "Caving Adventure",
        description: "Explore limestone caves with guided safety gear",
        durationMinutes: 240,
        maxSlots: 20,
        pricePerGuest: 180,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T09:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T09:00:00")),
      });
      logger.debug("[initDb] Second activity added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare activity batch", { error: (collError as any)?.message });
      throw collError;
    }

    // 5. Create dummy timeslot
    logger.debug("[initDb] Creating timeslot");
    try {
      const timeslotRef = db.collection("timeslots").doc("TS001");
      batch.set(timeslotRef, {
        timeSlotId: "TS001",
        activityId: "A001",
        startTime: FirestoreTimestamp.fromDate(new Date("2026-02-15T08:00:00")),
        endTime: FirestoreTimestamp.fromDate(new Date("2026-02-15T13:00:00")),
        slotsAvailable: 22,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
      });
      logger.debug("[initDb] Timeslot added to batch");

      const timeslotRefFour = db.collection("timeslots").doc("TS004");
      batch.set(timeslotRefFour, {
        timeSlotId: "TS004",
        activityId: "A001",
        startTime: FirestoreTimestamp.fromDate(new Date("2026-02-16T08:00:00")),
        endTime: FirestoreTimestamp.fromDate(new Date("2026-02-16T13:00:00")),
        slotsAvailable: 25,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T07:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T07:00:00")),
      });
      logger.debug("[initDb] Fourth timeslot added to batch");

      const timeslotRefFive = db.collection("timeslots").doc("TS005");
      batch.set(timeslotRefFive, {
        timeSlotId: "TS005",
        activityId: "A001",
        startTime: FirestoreTimestamp.fromDate(new Date("2026-02-17T08:00:00")),
        endTime: FirestoreTimestamp.fromDate(new Date("2026-02-17T13:00:00")),
        slotsAvailable: 30,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T07:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T07:00:00")),
      });
      logger.debug("[initDb] Fifth timeslot added to batch");

      const timeslotRefTwo = db.collection("timeslots").doc("TS002");
      batch.set(timeslotRefTwo, {
        timeSlotId: "TS002",
        activityId: "A002",
        startTime: FirestoreTimestamp.fromDate(new Date("2026-03-05T09:00:00")),
        endTime: FirestoreTimestamp.fromDate(new Date("2026-03-05T13:00:00")),
        slotsAvailable: 18,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T09:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T09:00:00")),
      });
      logger.debug("[initDb] Second timeslot added to batch");

      const timeslotRefThree = db.collection("timeslots").doc("TS003");
      batch.set(timeslotRefThree, {
        timeSlotId: "TS003",
        activityId: "A002",
        startTime: FirestoreTimestamp.fromDate(new Date("2026-03-06T13:00:00")),
        endTime: FirestoreTimestamp.fromDate(new Date("2026-03-06T17:00:00")),
        slotsAvailable: 20,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T09:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-02T09:00:00")),
      });
      logger.debug("[initDb] Third timeslot added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare timeslot batch", { error: (collError as any)?.message });
      throw collError;
    }

    // 6. Create dummy booking
    logger.debug("[initDb] Creating booking");
    try {
      // Booking 1: Paid status with both create and payment idempotency keys
      // This represents a booking that has been created and payment confirmed
      const bookingRef = db.collection("bookings").doc("BK-2026-0001");
      batch.set(bookingRef, {
        bookingId: "BK-2026-0001",
        representative: {
          firstName: "Jane",
          lastName: "Doe",
          email: "janedoe@gmail.com",
          phoneNumber: "+639123456789",
          age: 28,
          nationality: "PH",
        },
        guests: [
          { name: "John Doe", age: 25, nationality: "PH" },
          { name: "Maria Santos", age: 26, nationality: "PH" },
        ],
        activityId: "A001",
        timeSlotId: "TS001",
        tourDate: FirestoreTimestamp.fromDate(new Date("2026-02-15T08:00:00")),
        status: "paid",
        numberOfGuests: 3,
        operatorUid: process.env.FIREBASE_AUTH_EMULATOR_HOST ? EMULATOR_OPERATOR_UID : "U002",
        assignmentType: "auto book-balancing",
        pricePerGuest: 205,
        baseAmount: 615,
        serviceCharge: 50,
        subtotal: 665,
        promoCode: "ALEGRIA20",
        discountPercentage: 20,
        discountAmount: 133,
        finalPrice: 532,
        // IDEMPOTENCY FIELDS (Network retry protection):
        // - idempotencyKey: Prevents duplicate booking creation if client retries POST /bookings
        // - paymentIdempotencyKey: Prevents duplicate payment confirmation if operator retries PATCH /:bookingId/confirm-payment
        // - qrIdempotencyKey: Prevents duplicate QR scans if operator retries POST /scan-qr (would corrupt totalBookingsHandled counter)
        // NOTE: Set qrIdempotencyKey to null since this booking hasn't been scanned/confirmed yet (status is 'paid', not 'confirmed')
        idempotencyKey: "idem-booking-bk2026-0001-create",
        paymentIdempotencyKey: "idem-booking-bk2026-0001-payment",
        qrIdempotencyKey: null,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-05T10:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-05T10:00:00")),
      });
      logger.debug("[initDb] Booking added to batch");

      // Booking 2: Paid status without promo code
      const bookingRefTwo = db.collection("bookings").doc("BK-2026-0002");
      batch.set(bookingRefTwo, {
        bookingId: "BK-2026-0002",
        representative: {
          firstName: "Alex",
          lastName: "Reyes",
          email: "alex.reyes@gmail.com",
          phoneNumber: "+639189998877",
          age: 31,
          nationality: "PH",
        },
        guests: [
          { name: "Mina Reyes", age: 29, nationality: "PH" },
        ],
        activityId: "A002",
        timeSlotId: "TS002",
        tourDate: FirestoreTimestamp.fromDate(new Date("2026-03-05T09:00:00")),
        status: "paid",
        numberOfGuests: 2,
        operatorUid: process.env.FIREBASE_AUTH_EMULATOR_HOST ? EMULATOR_OPERATOR_UID : "U002",
        assignmentType: "auto book-balancing",
        pricePerGuest: 180,
        baseAmount: 360,
        serviceCharge: 40,
        subtotal: 400,
        promoCode: null,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: 400,
        // Idempotency: booking created and payment confirmed, but not yet scanned
        idempotencyKey: "idem-booking-bk2026-0002-create",
        paymentIdempotencyKey: "idem-booking-bk2026-0002-payment",
        qrIdempotencyKey: null,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-10T09:30:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-10T09:30:00")),
      });
      logger.debug("[initDb] Second booking added to batch");

      // Booking 3: Voucher-based operator assignment (operator U003 tied to promo code LOU10)
      const bookingRefThree = db.collection("bookings").doc("BK-2026-0003");
      batch.set(bookingRefThree, {
        bookingId: "BK-2026-0003",
        representative: {
          firstName: "Louie",
          lastName: "Tan",
          email: "louie.tan@gmail.com",
          phoneNumber: "+639177112233",
          age: 27,
          nationality: "PH",
        },
        guests: [
          { name: "Ivy Tan", age: 24, nationality: "PH" },
        ],
        activityId: "A001",
        timeSlotId: "TS004",
        tourDate: FirestoreTimestamp.fromDate(new Date("2026-02-16T08:00:00")),
        status: "paid",
        numberOfGuests: 2,
        operatorUid: "U003",
        assignmentType: "voucher", // Operator assigned via voucher, not load balancing
        pricePerGuest: 205,
        baseAmount: 410,
        serviceCharge: 40,
        subtotal: 450,
        promoCode: "LOU10",
        discountPercentage: 10,
        discountAmount: 45,
        finalPrice: 405,
        // Idempotency: booking created and payment confirmed, qrIdempotencyKey will be set when operator scans QR
        idempotencyKey: "idem-booking-bk2026-0003-create",
        paymentIdempotencyKey: "idem-booking-bk2026-0003-payment",
        qrIdempotencyKey: null,
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-12T11:15:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-12T11:15:00")),
      });
      logger.debug("[initDb] Third booking added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare booking batch", { error: (collError as any)?.message });
      throw collError;
    }

    // 7. Create dummy payment
    logger.debug("[initDb] Creating payment");
    try {
      const paymentRef = db.collection("payments").doc("P001");
      batch.set(paymentRef, {
        paymentId: "P001",
        bookingId: "BK-2026-0001",
        amount: 532,
        paymentMethod: "Gcash",
        status: "paid",
        paidAt: FirestoreTimestamp.fromDate(new Date("2026-01-05T14:30:00")),
        receiptUrl: "https://example.com/receipt-p001.pdf",
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-05T10:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-05T14:30:00")),
      });
      logger.debug("[initDb] Payment added to batch");

      const paymentRefTwo = db.collection("payments").doc("P002");
      batch.set(paymentRefTwo, {
        paymentId: "P002",
        bookingId: "BK-2026-0002",
        amount: 400,
        paymentMethod: "Maya",
        status: "paid",
        paidAt: FirestoreTimestamp.fromDate(new Date("2026-01-10T10:00:00")),
        receiptUrl: "https://example.com/receipt-p002.pdf",
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-10T09:30:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-10T10:00:00")),
      });
      logger.debug("[initDb] Second payment added to batch");

      const paymentRefThree = db.collection("payments").doc("P003");
      batch.set(paymentRefThree, {
        paymentId: "P003",
        bookingId: "BK-2026-0003",
        amount: 405,
        paymentMethod: "Gcash",
        status: "paid",
        paidAt: FirestoreTimestamp.fromDate(new Date("2026-01-12T11:45:00")),
        receiptUrl: "https://example.com/receipt-p003.pdf",
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-12T11:15:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-12T11:45:00")),
      });
      logger.debug("[initDb] Third payment added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare payment batch", { error: (collError as any)?.message });
      throw collError;
    }

    // 8. Create dummy entity
    logger.debug("[initDb] Creating entity");
    try {
      const entityRef = db.collection("entities").doc("E001");
      batch.set(entityRef, {
        entityId: "E001",
        entityName: "Alegria Tours",
        representative: "Maria Garcia",
        representativeEmail: "maria@alegria.com",
        phoneNumber: "+639121112222",
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
      });
      logger.debug("[initDb] Entity added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare entity batch", { error: (collError as any)?.message });
      throw collError;
    }

    // 9. Create dummy voucher code
    logger.debug("[initDb] Creating voucher code");
    try {
      const voucherRef = db.collection("voucherCodes").doc("V001");
      batch.set(voucherRef, {
        voucherId: "V001",
        code: "ALEGRIA20",
        discount: 20,
        numberOfUsersAllowed: 100,
        numberOfUsersUsed: 5,
        operatorUid: null,
        expirationDate: FirestoreTimestamp.fromDate(new Date("2026-12-31T23:59:59")),
        voucherStatus: "Active",
        entityId: "E001",
        createdByUid: process.env.FIREBASE_AUTH_EMULATOR_HOST ? EMULATOR_ADMIN_UID : "1NUCVz8gNnC8RfnB3LAjr9kTVZDe",
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-01T07:00:00")),
      });
      logger.debug("[initDb] Voucher code added to batch");

      const voucherRefTwo = db.collection("voucherCodes").doc("V002");
      batch.set(voucherRefTwo, {
        voucherId: "V002",
        code: "LOU10",
        discount: 10,
        numberOfUsersAllowed: 50,
        numberOfUsersUsed: 1,
        operatorUid: "U003",
        expirationDate: FirestoreTimestamp.fromDate(new Date("2026-10-31T23:59:59")),
        voucherStatus: "Active",
        entityId: "E001",
        createdByUid: process.env.FIREBASE_AUTH_EMULATOR_HOST ? EMULATOR_ADMIN_UID : "1NUCVz8gNnC8RfnB3LAjr9kTVZDe",
        createdAt: FirestoreTimestamp.fromDate(new Date("2026-01-03T10:15:00")),
        updatedAt: FirestoreTimestamp.fromDate(new Date("2026-01-03T10:15:00")),
      });
      logger.debug("[initDb] Second voucher code added to batch");
    } catch (collError) {
      logger.error("[initDb] Failed to prepare voucher batch", { error: (collError as any)?.message });
      throw collError;
    }

    logger.debug("[initDb] Committing batch write");
    try {
      await batch.commit();
      logger.debug("[initDb] Batch commit successful");
    } catch (batchError) {
      logger.error("[initDb] Batch commit failed", { error: (batchError as any)?.message, code: (batchError as any)?.code });
      throw batchError;
    }

    logger.info("[initDb] Database initialization successful");
    res.status(200).json({
      message: "Database initialized successfully with dummy data.",
      collections: ["users", "activities", "timeslots", "bookings", "payments", "entities", "voucherCodes"],
      admin: {
        uid: process.env.FIREBASE_AUTH_EMULATOR_HOST ? EMULATOR_ADMIN_UID : "1NUCVz8gNnC8RfnB3LAjr9kTVZDe",
        email: "paulo.carabuena@cit.edu",
        role: "admin",
      },
      emulatorCredentials: process.env.FIREBASE_AUTH_EMULATOR_HOST ? {
        admin: { email: "paulo.carabuena@cit.edu", password: "Admin123!" },
        operator: { email: "tour1@alegria.com", password: "Operator123!" },
      } : null,
      idempotencyInfo: {
        note: "All bookings include idempotency fields for network retry protection",
        fields: {
          idempotencyKey: "Prevents duplicate booking creation (client-provided via X-Idempotency-Key header)",
          paymentIdempotencyKey: "Prevents duplicate payment confirmation (operator retry protection)",
          qrIdempotencyKey: "Prevents duplicate QR scans (protects operator totalBookingsHandled counter)",
        },
        implementation: "Keys stored inline in booking documents (no separate collection needed)",
      },
    });
  } catch (error) {
    const errorMessage = (error as any)?.message || "Unknown error";
    const errorCode = (error as any)?.code || "UNKNOWN";
    const errorStack = (error as any)?.stack || "";

    logger.error("[initDb] Database initialization failed - Full error details", {
      message: errorMessage,
      code: errorCode,
      stack: errorStack,
      type: (error as any)?.constructor?.name,
    });

    res.status(500).json({
      error: "Internal Server Error",
      details: errorMessage,
      code: errorCode,
    });
  }
};

