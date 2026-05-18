import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { createTransporter, getFromAddress } from "../shared/mailer";

const APP_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export async function sendReviewEmailForBooking(
  bookingId: string,
  booking: Record<string, unknown>,
  isResend: boolean = false
): Promise<void> {
  const reviewToken = String(booking.reviewToken ?? "");
  if (!reviewToken) {
    logger.warn(`sendReviewEmail: no reviewToken on bookingId=${bookingId}`);
    return;
  }

  if (booking.reviewSentAt && !isResend) {
    logger.info(`sendReviewEmail: already sent for bookingId=${bookingId}`);
    return;
  }

  const representative = booking.representative as Record<string, unknown> | undefined;
  const toEmail = String(representative?.email ?? "").trim();
  if (!toEmail) {
    logger.warn(`sendReviewEmail: no representative email on bookingId=${bookingId}`);
    return;
  }

  const guestName = String(representative?.fullName ?? "Guest");
  const tourName = String(booking.activityName ?? "your tour");
  const reviewLink = `${APP_URL}/review?bookingId=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(reviewToken)}`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: `How was your experience? Leave a review for ${tourName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#333">
        <div style="background:#558B2F;padding:24px 32px;border-radius:8px 8px 0 0">
          <h2 style="margin:0;color:#fff;font-size:22px">How was your experience?</h2>
        </div>
        <div style="padding:28px 32px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin-top:0">Hi <strong>${guestName}</strong>,</p>
          <p>We hope you enjoyed <strong>${tourName}</strong>! Your feedback helps other travellers discover great experiences.</p>
          <p>It only takes a minute — click the button below to leave your review:</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${reviewLink}"
               style="display:inline-block;padding:14px 32px;background:#558B2F;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
              Leave a Review
            </a>
          </div>
          <p style="color:#888;font-size:12px;margin-bottom:0">
            This link can only be used once. If the button doesn&apos;t work, copy this link:<br>
            <a href="${reviewLink}" style="color:#558B2F;word-break:break-all">${reviewLink}</a>
          </p>
        </div>
      </div>
    `,
  });

  await admin.firestore().collection("bookings").doc(bookingId).update({
    reviewSentAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info(`sendReviewEmail: sent to ${toEmail} for bookingId=${bookingId}`);
}
