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
} from "../shared/helpers";

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

    const files: { name: string; url: string }[] = [];

    let profileImageUrl: string | null = reqData.photoUrl ?? null;
    if (reqData.photoUrl) {
      try {
        const photoPath = extractPathFromUrl(reqData.photoUrl);
        if (photoPath) {
          await copyFile(photoPath, `profile-pictures/${operatorUid}.jpg`);
        }
      } catch (err) {
        logger.warn("Failed to copy profile photo:", err);
      }
    }

    if (Array.isArray(reqData.documents)) {
      for (const doc of reqData.documents as { name: string; url: string }[]) {
        files.push({ name: doc.name, url: doc.url });
        try {
          const srcPath = extractPathFromUrl(doc.url);
          if (srcPath) {
            await copyFile(srcPath, `operator-documents/${operatorUid}/${doc.name}`);
          }
        } catch (err) {
          logger.warn(`Failed to copy document ${doc.name}:`, err);
        }
      }
    }

    await db.doc(`users/${operatorUid}`).set({
      uid: operatorUid,
      email: reqData.email,
      role: "operator",
      firstName,
      lastName,
      operatorId,
      phoneNumber: reqData.phoneNumber ?? "",
      mobileNumber: reqData.mobileNumber ?? "",
      address: reqData.address ?? "",
      profileImage: profileImageUrl,
      files,
      status: "active",
      createdAt: now,
      approvedAt: now,
    });

    await reqRef.update({
      status: "approved",
      reviewedAt: FieldValue.serverTimestamp(),
    });

    const resetLink = await auth.generatePasswordResetLink(reqData.email);
    logger.info(`Password reset link for ${reqData.email}: ${resetLink}`);
    logger.info(`Operator ${operatorUid} (${reqData.email}) approved by ${request.auth.uid}`);

    return {
      success: true,
      operatorUid,
      operatorId,
      email: reqData.email,
    };
  }
);
