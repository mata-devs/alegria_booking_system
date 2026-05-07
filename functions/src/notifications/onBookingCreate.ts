import { onDocumentCreated } from "firebase-functions/v2/firestore";
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

    const eventId = `booking_create_${bookingId}`;

    await writeNotification(operatorUid, {
      kind: "booking_new",
      title: "New booking request",
      body: `${guestName} booked ${activityName} (${guestsPart}).`,
      link: `/operator/bookings?selectedId=${encodeURIComponent(bookingId)}`,
      metadata: {
        eventId,
        bookingId,
      },
      dedupeKey: eventId,
    });
  },
);
