import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../shared/firebase";
import { assertSuperAdmin } from "../shared/helpers";
import { sendOperatorSignupDeclinedEmail } from "./operatorSignupEmails";

function emailFailureMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return "Unknown SMTP error";
}

export const declineOperatorSignup = onCall(
  { region: "us-central1", invoker: "public", cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    await assertSuperAdmin(request.auth.uid);

    const { requestId } = request.data as { requestId?: string };
    if (!requestId || typeof requestId !== "string") {
      throw new HttpsError("invalid-argument", "requestId is required.");
    }

    const reqRef = db.doc(`operator_signup_requests/${requestId}`);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      throw new HttpsError("not-found", "Sign-up request not found.");
    }
    if (reqSnap.data()?.status !== "pending") {
      throw new HttpsError("failed-precondition", "Request has already been processed.");
    }

    const reqData = reqSnap.data()!;

    await reqRef.update({
      status: "rejected",
      reviewedAt: FieldValue.serverTimestamp(),
    });

    const applicantEmail = String(reqData.email ?? "").trim();
    let emailSent = false;
    let emailError: string | undefined;

    if (applicantEmail) {
      try {
        await sendOperatorSignupDeclinedEmail({
          to: applicantEmail,
          applicantName: String(reqData.name ?? ""),
          companyName: String(reqData.companyName ?? ""),
        });
        emailSent = true;
      } catch (err) {
        emailError = emailFailureMessage(err);
        logger.error(`Failed to send operator decline email to ${applicantEmail}`, err);
      }
    } else {
      emailError = "Applicant email is missing on the signup request.";
    }

    logger.info(`Request ${requestId} declined by ${request.auth.uid}`);

    return { success: true, emailSent, emailError };
  }
);
