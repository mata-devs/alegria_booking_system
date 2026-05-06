import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import bookingsRoutes from "./routes/bookings.routes";
import { HttpsError } from "firebase-functions/v2/https";
import { admin, db } from "../shared/firebase";

const app = express();
const APP_CHECK_ENFORCE = process.env.APP_CHECK_ENFORCE === "true";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true;
  return allowedOrigins.includes(origin);
}

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

app.use("/bookings", bookingsRoutes);

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

export default app;
