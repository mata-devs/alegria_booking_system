/**
 * Cloud Functions deploy entry — only exports here are deployed (see functions/package.json "main").
 * Booking check-in, reschedule, and related operator actions live under `api` (Express in booking/app.ts).
 */
import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

// Firestore: disable/enable Firebase Auth when operator user status becomes suspended
export { syncOperatorAuthStatus } from "./operator/syncAuthStatus";

// onCall (super-admin): approve signup → create operator Auth user, copy docs, send welcome email
export { approveOperatorSignup } from "./operator/approveSignup";

// onCall (super-admin): decline signup request and notify applicant
export { declineOperatorSignup } from "./operator/declineSignup";

// onCall (super-admin): email tokenised operator signup link to applicant
export { sendSignupLinkEmail } from "./operator/sendSignupLink";

// onRequest HTTP API: guest bookings, payments, reviews; operator check-in, complete, reschedule
export { api } from "./booking/api.http";

// Scheduled: auto-complete in_progress bookings after grace period; send review email
export { completeInProgressBookings } from "./reviews/completeInProgressBookings";

// Firestore: update activity/tour-package rating aggregates when review status changes
export { onReviewStatusChanged } from "./reviews/onReviewStatusChanged";

// Firestore: notify operator when a new booking is created
export { onBookingCreatedNotifyOperator } from "./notifications/onBookingCreate";

// Firestore: notify all super-admins when a new operator signup request is submitted
export { onOperatorSignupRequestCreatedNotifyAdmins } from "./notifications/onOperatorSignupCreate";
