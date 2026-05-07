import { FieldValue } from "firebase-admin/firestore";
import { db } from "../shared/firebase";

export type NotificationKind =
  | "booking_new"
  | "booking_paid"
  | "booking_cancelled"
  | "review_pending_response"
  | "payout_processed"
  | "admin_announcement"
  | "cancellation_request"
  | "tour_starts_today";

export interface WriteNotificationInput {
  kind: NotificationKind;
  title: string;
  body: string;
  link: string;
  metadata?: Record<string, unknown>;
  /** Stable doc id so retries / duplicate triggers do not create extra rows */
  dedupeKey: string;
}

/**
 * Writes `users/{uid}/notifications/{dedupeKey}` if it does not exist yet.
 */
export async function writeNotification(
  userId: string,
  input: WriteNotificationInput,
): Promise<void> {
  const ref = db
    .collection("users")
    .doc(userId)
    .collection("notifications")
    .doc(input.dedupeKey);

  const snap = await ref.get();
  if (snap.exists) {
    return;
  }

  await ref.set({
    id: input.dedupeKey,
    kind: input.kind,
    title: input.title,
    body: input.body,
    link: input.link,
    metadata: input.metadata ?? {},
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
  });
}
