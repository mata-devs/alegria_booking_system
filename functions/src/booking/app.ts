import express from "express";
import cors from "cors";
import bookingsRoutes from "./routes/bookings.routes";
import { admin } from "../shared/firebase";

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

export default app;
