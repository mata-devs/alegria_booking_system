import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "../shared/firebase";
import { writeNotification } from "./writeNotification";

export const onBookingCreatedNotifyOperator = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      return;
    }

    const bookingId = event.params.bookingId;
    const data = snap.data() as Record<string, unknown>;
    const operatorUid =
      typeof data.operatorUid === "string" ? data.operatorUid.trim() : "";

    if (!operatorUid) {
      return;
    }

    const rep = data.representative as { fullName?: string } | undefined;
    const guestName =
      typeof rep?.fullName === "string" && rep.fullName.trim() !== ""
        ? rep.fullName.trim()
        : "A guest";

    const activityName =
      typeof data.activityName === "string" && data.activityName.trim() !== ""
        ? data.activityName.trim()
        : "your listing";

    const nGuests = Number(data.numberOfGuests);
    const guestsPart =
      Number.isFinite(nGuests) && nGuests > 0
        ? `${nGuests} guest${nGuests === 1 ? "" : "s"}`
        : "new guests";

    const activityId =
      typeof data.activityId === "string" ? data.activityId.trim() : "";
    const sourceType =
      typeof data.sourceType === "string" ? data.sourceType : "activity";

    let thumbnailUrl: string | undefined;
    if (activityId) {
      try {
        const col = sourceType === "tourPackage" ? "tourPackages" : "activities";
        const imgField = sourceType === "tourPackage" ? "packageImages" : "activityImages";
        const srcDoc = await db.collection(col).doc(activityId).get();
        if (srcDoc.exists) {
          const srcData = srcDoc.data() as Record<string, unknown>;
          const imgs = Array.isArray(srcData[imgField]) ? (srcData[imgField] as string[]) : [];
          thumbnailUrl = imgs[0] ?? undefined;
        }
      } catch {
        // non-fatal — notification still writes without thumbnail
      }
    }

    const eventId = `booking_create_${bookingId}`;

    await writeNotification(operatorUid, {
      kind: "booking_new",
      title: "New booking request",
      body: `${guestName} booked ${activityName} (${guestsPart}).`,
      link: `/operator/bookings?selectedId=${encodeURIComponent(bookingId)}`,
      imageUrl: thumbnailUrl,
      metadata: {
        eventId,
        bookingId,
        activityName,
        guestName,
        nGuests: Number.isFinite(nGuests) && nGuests > 0 ? nGuests : 1,
      },
      dedupeKey: eventId,
    });
  },
);
