import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bookingsRoutes from "./routes/bookings.routes";
import { HttpsError } from "firebase-functions/v2/https";
import { admin, db } from "../shared/firebase";
import { sendReviewEmailForBooking } from "../reviews/sendReviewEmail";

const app = express();
const APP_CHECK_ENFORCE = process.env.APP_CHECK_ENFORCE === "true";
const IS_EMULATOR = process.env.FUNCTIONS_EMULATOR === "true";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (allowedOrigins.length === 0) {
    // Fail-closed in production: block all browser origins if ALLOWED_ORIGINS not configured
    return IS_EMULATOR;
  }
  return allowedOrigins.includes(origin);
}

// Trust Google Cloud's proxy layer so req.ip reflects real client IP
app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Idempotency-Key",
      "X-Recovery-Token",
      "X-Firebase-AppCheck",
    ],
  })
);
app.use(express.json({ limit: "6mb" }));

// Rate limiters — in-memory, per Cloud Functions instance; provides burst protection
const bookingCreateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many booking requests. Try again later." },
});

const reviewLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many review requests. Try again later." },
});

app.use(async (req, res, next) => {
  if (!APP_CHECK_ENFORCE || req.method === "OPTIONS") {
    next();
    return;
  }

  const appCheckToken = req.header("X-Firebase-AppCheck");
  if (!appCheckToken) {
    res.status(401).json({ error: "Missing App Check token" });
    return;
  }

  try {
    await admin.appCheck().verifyToken(appCheckToken);
    next();
  } catch {
    res.status(401).json({ error: "Invalid App Check token" });
  }
});

app.get("/hello", (_req, res) => {
  res.status(200).send("Hello from Alegria Booking API");
});

app.use("/bookings", bookingCreateLimit, bookingsRoutes);

async function requireOperatorAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new HttpsError("unauthenticated", "Missing authorization token.");
    }

    const idToken = header.slice("Bearer ".length).trim();
    const decoded = await admin.auth().verifyIdToken(idToken);

    const userSnap = await db.collection("users").doc(decoded.uid).get();
    const role = userSnap.data()?.role;
    if (role !== "operator" && role !== "super_admin") {
      throw new HttpsError("permission-denied", "Operator role required.");
    }

    (req as Request & { userUid?: string }).userUid = decoded.uid;
    next();
  } catch (err) {
    const code = err instanceof HttpsError ? err.code : "unauthenticated";
    const status =
      code === "permission-denied" ? 403 :
      code === "unauthenticated" ? 401 :
      500;
    const message = err instanceof Error ? err.message : "Unauthorized";
    res.status(status).json({ error: message });
  }
}

app.post("/operator/bookings/:bookingId/check-in", requireOperatorAuth, async (req, res) => {
  const bookingId = String(req.params.bookingId ?? "").trim();
  const token = String(req.body?.token ?? "").trim();
  const userUid = (req as Request & { userUid?: string }).userUid;

  if (!bookingId || !token) {
    return res.status(400).json({ error: "bookingId and token are required." });
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) return res.status(404).json({ error: "Booking not found." });

  const booking = snap.data() as Record<string, unknown>;
  if (booking.operatorUid !== userUid) {
    return res.status(403).json({ error: "This booking is not assigned to you." });
  }

  const currentStatus = String(booking.status ?? "");
  if (currentStatus !== "confirmed" && currentStatus !== "paid") {
    return res.status(400).json({ error: "Booking must be confirmed before check-in." });
  }

  const storedToken = String(booking.checkInToken ?? "");
  if (!storedToken || storedToken !== token) {
    return res.status(403).json({ error: "Invalid check-in token." });
  }

  const startedAt = Date.now();
  await bookingRef.update({
    status: "in_progress",
    tourStartedAt: admin.firestore.Timestamp.fromMillis(startedAt),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return res.status(200).json({ bookingId, status: "in_progress", tourStartedAt: startedAt });
});

app.post("/operator/bookings/:bookingId/complete", requireOperatorAuth, async (req, res) => {
  const bookingId = String(req.params.bookingId ?? "").trim();
  const userUid = (req as Request & { userUid?: string }).userUid;

  if (!bookingId) {
    return res.status(400).json({ error: "bookingId is required." });
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) return res.status(404).json({ error: "Booking not found." });

  const booking = snap.data() as Record<string, unknown>;
  if (booking.operatorUid !== userUid) {
    return res.status(403).json({ error: "This booking is not assigned to you." });
  }

  const currentStatus = String(booking.status ?? "");
  if (currentStatus !== "in_progress") {
    return res.status(400).json({ error: "Booking must be in progress before completing." });
  }

  await bookingRef.update({
    status: "completed",
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await sendReviewEmailForBooking(bookingId, booking);

  return res.status(200).json({ bookingId, status: "completed" });
});

app.post("/operator/bookings/:bookingId/resend-review", requireOperatorAuth, async (req, res) => {
  const bookingId = String(req.params.bookingId ?? "").trim();
  const userUid = (req as Request & { userUid?: string }).userUid;

  if (!bookingId) {
    return res.status(400).json({ error: "bookingId is required." });
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) return res.status(404).json({ error: "Booking not found." });

  const booking = snap.data() as Record<string, unknown>;
  if (booking.operatorUid !== userUid) {
    return res.status(403).json({ error: "This booking is not assigned to you." });
  }

  const currentStatus = String(booking.status ?? "");
  if (currentStatus !== "completed") {
    return res.status(400).json({ error: "Booking must be completed before sending review emails." });
  }

  await sendReviewEmailForBooking(bookingId, booking, true);

  return res.status(200).json({ success: true, message: "Review email resent successfully." });
});

app.post("/operator/bookings/:bookingId/reschedule", requireOperatorAuth, async (req, res) => {
  const bookingId = String(req.params.bookingId ?? "").trim();
  const tourDate = String(req.body?.tourDate ?? "").trim();
  const userUid = (req as Request & { userUid?: string }).userUid;

  if (!bookingId || !tourDate) {
    return res.status(400).json({ error: "bookingId and tourDate are required." });
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) return res.status(404).json({ error: "Booking not found." });

  const booking = snap.data() as Record<string, unknown>;
  if (booking.operatorUid !== userUid) {
    return res.status(403).json({ error: "This booking is not assigned to you." });
  }

  const currentStatus = String(booking.status ?? "");
  if (currentStatus !== "confirmed" && currentStatus !== "paid") {
    return res.status(400).json({ error: "Only confirmed bookings can be rescheduled." });
  }

  const date = new Date(tourDate);
  if (Number.isNaN(date.getTime())) {
    return res.status(400).json({ error: "Invalid tourDate format." });
  }
  date.setHours(0, 0, 0, 0);

  await bookingRef.update({
    tourDate: admin.firestore.Timestamp.fromDate(date),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return res.status(200).json({ bookingId, status: currentStatus, tourDate });
});

// Public review endpoints — no auth, token-gated
app.get("/review/:bookingId", reviewLimit, async (req, res) => {
  const bookingId = String(req.params.bookingId ?? "").trim();
  const token = String(req.query.token ?? "").trim();

  if (!bookingId || !token) {
    return res.status(400).json({ error: "bookingId and token are required." });
  }

  const snap = await db.collection("bookings").doc(bookingId).get();
  if (!snap.exists) return res.status(404).json({ error: "Booking not found." });

  const booking = snap.data() as Record<string, unknown>;
  const storedToken = String(booking.reviewToken ?? "");
  if (!storedToken || storedToken !== token) {
    return res.status(403).json({ error: "Invalid or expired review link." });
  }

  const alreadySubmitted = !!booking.reviewSubmittedAt;
  const representative = booking.representative as Record<string, unknown> | undefined;

  return res.status(200).json({
    bookingId,
    alreadySubmitted,
    guestName: String(representative?.fullName ?? "Guest"),
    guestNationality: String(representative?.nationality ?? ""),
    tourName: String(booking.activityName ?? ""),
    sourceType: String(booking.sourceType ?? "activity"),
  });
});

app.post("/review/:bookingId", reviewLimit, async (req, res) => {
  const bookingId = String(req.params.bookingId ?? "").trim();
  const { token, rating, text, reviewerCountry, displayConsent } = req.body as {
    token?: string;
    rating?: number;
    text?: string;
    reviewerCountry?: string;
    displayConsent?: boolean;
  };

  if (!bookingId || !token) {
    return res.status(400).json({ error: "bookingId and token are required." });
  }
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be 1–5." });
  }
  if (!text?.trim()) {
    return res.status(400).json({ error: "Review text is required." });
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) return res.status(404).json({ error: "Booking not found." });

  const booking = snap.data() as Record<string, unknown>;
  const storedToken = String(booking.reviewToken ?? "");
  if (!storedToken || storedToken !== token) {
    return res.status(403).json({ error: "Invalid or expired review link." });
  }

  if (booking.reviewSubmittedAt) {
    return res.status(409).json({ error: "Review already submitted for this booking." });
  }

  const representative = booking.representative as Record<string, unknown> | undefined;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const isTourPackage = booking.sourceType === "tourPackage";
  await db.collection("reviews").add({
    bookingId,
    operatorUid: String(booking.operatorUid ?? ""),
    sourceType: String(booking.sourceType ?? "activity"),
    activityId: isTourPackage ? null : String(booking.activityId ?? ""),
    tourPackageId: isTourPackage ? String(booking.activityId ?? "") : null,
    location: String(booking.activityName ?? ""),
    reviewerName: displayConsent === true
      ? String(representative?.fullName ?? "Guest")
      : "Anonymous",
    reviewerCountry: String(reviewerCountry ?? representative?.nationality ?? ""),
    displayConsent: displayConsent === true,
    rating: Number(rating),
    text: String(text).trim(),
    photos: [],
    status: "pending",
    moderatedAt: null,
    moderatedByUid: null,
    flagReason: null,
    createdAt: now,
  });

  await bookingRef.update({
    reviewSubmittedAt: now,
    updatedAt: now,
  });

  return res.status(201).json({ success: true });
});

export default app;
