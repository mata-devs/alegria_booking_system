import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

export const onReviewStatusChanged = onDocumentUpdated(
  { document: "reviews/{reviewId}", region: "asia-southeast1" },
  async (event) => {
    const before = event.data?.before.data() as Record<string, unknown> | undefined;
    const after = event.data?.after.data() as Record<string, unknown> | undefined;
    if (!before || !after) return;

    const statusBefore = String(before.status ?? "");
    const statusAfter = String(after.status ?? "");

    // Only act when status transitions involve 'approved'
    if (statusBefore === statusAfter) return;
    if (statusBefore !== "approved" && statusAfter !== "approved") return;

    const sourceType = String(after.sourceType ?? "activity");
    const itemId =
      sourceType === "activity"
        ? String(after.activityId ?? "")
        : String(after.tourPackageId ?? "");

    if (!itemId) {
      logger.warn("onReviewStatusChanged: missing itemId", { reviewId: event.params.reviewId });
      return;
    }

    const idField = sourceType === "activity" ? "activityId" : "tourPackageId";
    const snap = await admin
      .firestore()
      .collection("reviews")
      .where(idField, "==", itemId)
      .where("status", "==", "approved")
      .get();

    const ratings = snap.docs
      .map((d) => Number(d.data().rating ?? 0))
      .filter((r) => r >= 1 && r <= 5);

    const avg =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    const collection = sourceType === "activity" ? "activities" : "tourPackages";
    const ratingField = sourceType === "activity" ? "activityRating" : "packageRating";

    await admin.firestore().collection(collection).doc(itemId).update({
      [ratingField]: avg,
    });

    logger.info(
      `onReviewStatusChanged: updated ${collection}/${itemId} ${ratingField}=${avg} (${ratings.length} reviews)`
    );
  }
);
