import { setGlobalOptions } from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

// ─── helpers ────────────────────────────────────────────────────────
async function assertSuperAdmin(uid: string) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists || snap.data()?.role !== "super_admin") {
    throw new HttpsError("permission-denied", "Only super admins can perform this action.");
  }
}

function generateOperatorId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return String(num);
}

/**
 * Copy a file inside the same Storage bucket.
 * source / dest are the object paths inside the bucket (no gs:// prefix).
 */
async function copyFile(source: string, dest: string) {
  const srcFile = bucket.file(source);
  const [exists] = await srcFile.exists();
  if (!exists) {
    logger.warn(`copyFile: source not found – ${source}`);
    return;
  }
  await srcFile.copy(bucket.file(dest));
}

// ─── syncOperatorAuthStatus ─────────────────────────────────────────
/**
 * When a user document's `status` field changes, sync the Firebase Auth
 * disabled state:
 *   status === 'suspended'  →  disabled: true  (blocks login & token refresh)
 *   status === 'active'     →  disabled: false (re-enables the account)
 */
export const syncOperatorAuthStatus = onDocumentUpdated(
  { document: "users/{userId}", region: "us-central1" },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    if (before.status === after.status) return;
    if (after.role !== "operator") return;

    const userId = event.params.userId;
    const disabled = after.status === "suspended";

    try {
      await auth.updateUser(userId, { disabled });
      logger.info(
        `Auth account ${userId} ${disabled ? "disabled" : "enabled"} (status: ${after.status})`
      );
    } catch (err) {
      logger.error(`Failed to update auth for ${userId}:`, err);
    }
  }
);

// ─── approveOperatorSignup ──────────────────────────────────────────
export const approveOperatorSignup = onCall(
  { region: "us-central1", invoker: "public", cors: true },
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }
    await assertSuperAdmin(request.auth.uid);

    const { requestId } = request.data as { requestId?: string };
    if (!requestId || typeof requestId !== "string") {
      throw new HttpsError("invalid-argument", "requestId is required.");
    }

    // Fetch the sign-up request
    const reqRef = db.doc(`operator_signup_requests/${requestId}`);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      throw new HttpsError("not-found", "Sign-up request not found.");
    }
    const reqData = reqSnap.data()!;

    if (reqData.status !== "pending") {
      throw new HttpsError("failed-precondition", "Request has already been processed.");
    }

    // Split the stored name into first/last
    const nameParts = (reqData.name as string).trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // 1. Create Firebase Auth account with a random password
    const tempPassword = crypto.randomUUID();
    let userRecord: admin.auth.UserRecord;
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
    const now = admin.firestore.FieldValue.serverTimestamp();

    // 2. Copy files from signup-requests/{tempId}/ to operator's storage
    //    The signup form stores files under signup-requests/{tempId}/
    //    We derive the tempId from the applicantId (I + first 5 chars of uuid)
    //    but actually the files are stored using the photoUrl / document urls,
    //    so we'll reference them by URL and copy the underlying objects.
    const files: { name: string; url: string }[] = [];

    // Copy profile photo (keep original download URL – it remains valid)
    let profileImageUrl: string | null = reqData.photoUrl ?? null;
    if (reqData.photoUrl) {
      try {
        const photoPath = extractPathFromUrl(reqData.photoUrl);
        if (photoPath) {
          const destPath = `profile-pictures/${operatorUid}.jpg`;
          await copyFile(photoPath, destPath);
        }
      } catch (err) {
        logger.warn("Failed to copy profile photo:", err);
      }
    }

    // Copy documents (keep original download URLs)
    if (Array.isArray(reqData.documents)) {
      for (const doc of reqData.documents as { name: string; url: string }[]) {
        files.push({ name: doc.name, url: doc.url });
        try {
          const srcPath = extractPathFromUrl(doc.url);
          if (srcPath) {
            const destPath = `operator-documents/${operatorUid}/${doc.name}`;
            await copyFile(srcPath, destPath);
          }
        } catch (err) {
          logger.warn(`Failed to copy document ${doc.name}:`, err);
        }
      }
    }

    // 3. Create users/{uid} document
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

    // 4. Update the sign-up request to approved
    await reqRef.update({
      status: "approved",
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Generate password-reset link (logged for debugging).
    //    The actual email is sent from the frontend via sendPasswordResetEmail.
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

// ─── declineOperatorSignup ──────────────────────────────────────────
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

    await reqRef.update({
      status: "rejected",
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`Request ${requestId} declined by ${request.auth.uid}`);

    return { success: true };
  }
);

// ─── URL helper ─────────────────────────────────────────────────────
/**
 * Extract the Storage object path from a Firebase Storage download URL.
 * URLs look like:
 *   https://firebasestorage.googleapis.com/v0/b/BUCKET/o/ENCODED_PATH?...
 */
function extractPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    // ignore
  }
  return null;
}

//for booking and hello
export { api } from "./api.http";
