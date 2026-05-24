import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFileDownloadUrl, listSuperAdminUids } from "../shared/helpers";
import { writeNotification } from "./writeNotification";

export const onOperatorSignupRequestCreatedNotifyAdmins = onDocumentCreated(
  {
    document: "operator_signup_requests/{requestId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      return;
    }

    const requestId = event.params.requestId;
    const data = snap.data() as Record<string, unknown>;

    if (data.status !== "pending") {
      return;
    }

    const applicantName =
      typeof data.name === "string" && data.name.trim() !== ""
        ? data.name.trim()
        : "An applicant";
    const companyName =
      typeof data.companyName === "string" && data.companyName.trim() !== ""
        ? data.companyName.trim()
        : "their business";

    let thumbnailUrl: string | undefined;
    const photoUrl = typeof data.photoUrl === "string" ? data.photoUrl.trim() : "";
    const photoPath = typeof data.photoPath === "string" ? data.photoPath.trim() : "";
    if (photoUrl) {
      thumbnailUrl = photoUrl;
    } else if (photoPath) {
      try {
        thumbnailUrl = (await getFileDownloadUrl(photoPath)) ?? undefined;
      } catch (err) {
        logger.warn("operator signup notification: photo thumbnail lookup failed", err);
      }
    }

    const superAdminUids = await listSuperAdminUids();
    if (superAdminUids.length === 0) {
      logger.warn("operator signup notification: no super admins found");
      return;
    }

    const eventId = `operator_signup_${requestId}`;
    const link = `/super-admin/operators?tab=signup-requests&requestId=${encodeURIComponent(requestId)}`;

    await Promise.all(
      superAdminUids.map((uid) =>
        writeNotification(uid, {
          kind: "operator_signup_new",
          title: "New operator signup request",
          body: `${applicantName} submitted a signup request for ${companyName}.`,
          link,
          imageUrl: thumbnailUrl,
          metadata: {
            eventId,
            requestId,
            companyName,
            applicantName,
          },
          dedupeKey: eventId,
        }),
      ),
    );
  },
);
