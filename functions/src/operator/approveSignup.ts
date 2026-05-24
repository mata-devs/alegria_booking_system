import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { db, auth } from "../shared/firebase";
import {
  assertSuperAdmin,
  generateOperatorId,
  copyFile,
  extractPathFromUrl,
  getFileDownloadUrl,
} from "../shared/helpers";
import { sendOperatorSignupApprovedEmail } from "./operatorSignupEmails";
import { getAppUrl, buildAppPasswordResetUrl } from "../shared/appUrl";
import { DOT_CERT_LABEL, extensionFromStoragePath } from "./signupDocumentLabels";

function readCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function emailFailureMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return "Unknown SMTP error";
}

export const approveOperatorSignup = onCall(
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
    const reqData = reqSnap.data()!;

    if (reqData.status !== "pending") {
      throw new HttpsError("failed-precondition", "Request has already been processed.");
    }

    const nameParts = (reqData.name as string).trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const tempPassword = crypto.randomUUID();
    let userRecord: UserRecord;
    try {
      userRecord = await auth.createUser({
        email: reqData.email,
        password: tempPassword,
        displayName: reqData.name,
        disabled: false,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-exists") {
        throw new HttpsError("already-exists", "An account with this email already exists.");
      }
      throw new HttpsError("internal", "Failed to create auth account.");
    }

    const operatorUid = userRecord.uid;
    const operatorId = generateOperatorId();
    const now = FieldValue.serverTimestamp();

    const files: { name: string; url: string; path?: string }[] = [];
    let dotProofUrl: string | null = null;

    const resolveStoragePath = (item: { path?: string; url?: string }): string | null => {
      if (typeof item.path === "string" && item.path.length > 0) return item.path;
      if (typeof item.url === "string" && item.url.length > 0) return extractPathFromUrl(item.url);
      return null;
    };

    const destPhotoPath = `profile-pictures/${operatorUid}.jpg`;
    let profileImageUrl: string | null =
      typeof reqData.photoUrl === "string" && reqData.photoUrl.trim()
        ? reqData.photoUrl.trim()
        : null;
    const signupPhotoPath =
      (typeof reqData.photoPath === "string" && reqData.photoPath) ||
      (typeof reqData.photoUrl === "string" ? extractPathFromUrl(reqData.photoUrl) : null);
    if (signupPhotoPath) {
      try {
        await copyFile(signupPhotoPath, destPhotoPath);
        profileImageUrl = (await getFileDownloadUrl(destPhotoPath)) ?? profileImageUrl;
      } catch (err) {
        logger.warn("Failed to copy profile photo:", err);
      }
    }

    if (profileImageUrl) {
      try {
        await auth.updateUser(operatorUid, { photoURL: profileImageUrl });
      } catch (err) {
        logger.warn("Failed to set auth photoURL for approved operator:", err);
      }
    }

    if (Array.isArray(reqData.documents)) {
      for (const doc of reqData.documents as { name: string; path?: string; url?: string }[]) {
        try {
          const srcPath = resolveStoragePath(doc);
          if (!srcPath) {
            if (doc.name !== DOT_CERT_LABEL) {
              files.push({ name: doc.name, url: typeof doc.url === "string" ? doc.url : "" });
            }
            continue;
          }

          if (doc.name === DOT_CERT_LABEL) {
            const ext = extensionFromStoragePath(srcPath);
            const dotDest = `operators/${operatorUid}/dot-proof/cert.${ext}`;
            await copyFile(srcPath, dotDest);
            dotProofUrl = (await getFileDownloadUrl(dotDest)) ?? null;
            continue;
          }

          const destPath = `operator-documents/${operatorUid}/${doc.name}`;
          await copyFile(srcPath, destPath);
          const url = (await getFileDownloadUrl(destPath)) ?? (typeof doc.url === "string" ? doc.url : "");
          files.push({ name: doc.name, url, path: destPath });
        } catch (err) {
          logger.warn(`Failed to copy document ${doc.name}:`, err);
          if (doc.name !== DOT_CERT_LABEL) {
            files.push({ name: doc.name, url: typeof doc.url === "string" ? doc.url : "" });
          }
        }
      }
    }

    const lat = readCoord(reqData.lat);
    const lng = readCoord(reqData.lng);

    await db.doc(`users/${operatorUid}`).set({
      uid: operatorUid,
      email: reqData.email,
      role: "operator",
      firstName,
      lastName,
      companyName: reqData.companyName ?? "",
      operatorId,
      applicantId: reqData.applicantId ?? null,
      phoneNumber: reqData.phoneNumber ?? "",
      mobileNumber: reqData.mobileNumber ?? "",
      address: reqData.address ?? "",
      ...(lat != null && lng != null ? { lat, lng } : {}),
      profileImage: profileImageUrl,
      dotProofUrl,
      files,
      paymentMethods: [],
      customInclusionChips: [],
      customExclusionChips: [],
      status: "active",
      submittedAt: reqData.submittedAt ?? null,
      createdAt: now,
      approvedAt: now,
    });

    await reqRef.update({
      status: "approved",
      reviewedAt: FieldValue.serverTimestamp(),
    });

    const applicantEmail = String(reqData.email ?? "").trim();
    let setPasswordUrl: string | undefined;
    let emailSent = false;
    let emailError: string | undefined;

    if (applicantEmail) {
      try {
        const firebaseResetLink = await auth.generatePasswordResetLink(applicantEmail, {
          url: `${getAppUrl()}/reset-password`,
        });
        setPasswordUrl = buildAppPasswordResetUrl(firebaseResetLink) ?? undefined;
      } catch (err) {
        logger.warn("Failed to generate password reset link for approved operator:", err);
      }

      try {
        await sendOperatorSignupApprovedEmail({
          to: applicantEmail,
          applicantName: String(reqData.name ?? ""),
          companyName: String(reqData.companyName ?? ""),
          setPasswordUrl,
        });
        emailSent = true;
      } catch (err) {
        emailError = emailFailureMessage(err);
        logger.error(`Failed to send operator approval email to ${applicantEmail}`, err);
      }
    } else {
      emailError = "Applicant email is missing on the signup request.";
    }

    logger.info(`Operator ${operatorUid} (${reqData.email}) approved by ${request.auth.uid}`);

    return {
      success: true,
      operatorUid,
      operatorId,
      email: reqData.email,
      emailSent,
      emailError,
    };
  }
);
