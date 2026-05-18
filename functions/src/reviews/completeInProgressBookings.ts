import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../shared/firebase";
import { sendReviewEmailForBooking } from "./sendReviewEmail";

const DEFAULT_GRACE_HOURS = 12;
const DEFAULT_DURATION_MINUTES = 0;

async function getGraceHours(): Promise<number> {
  const cfg = await db.collection("app_config").doc("review_policy").get();
  if (!cfg.exists) return DEFAULT_GRACE_HOURS;
  const value = Number(cfg.data()?.graceHours);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_GRACE_HOURS;
}

export const completeInProgressBookings = onSchedule(
  { region: "asia-southeast1", schedule: "every 30 minutes" },
  async () => {
    const graceHours = await getGraceHours();
    const now = Date.now();

    const inProgressSnap = await db
      .collection("bookings")
      .where("status", "==", "in_progress")
      .limit(200)
      .get();

    for (const doc of inProgressSnap.docs) {
      const booking = doc.data() as Record<string, unknown>;
      const startedAtMs = (booking.tourStartedAt as { toMillis?: () => number } | undefined)?.toMillis?.();
      if (!startedAtMs) continue;

      const durationMinutes = Number(booking.durationMinutes ?? DEFAULT_DURATION_MINUTES);
      const dueAt = startedAtMs + (durationMinutes + graceHours * 60) * 60 * 1000;
      if (now < dueAt) continue;

      await doc.ref.update({
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await sendReviewEmailForBooking(doc.id, booking);
    }
  }
);

