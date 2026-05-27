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

    const resolveStoragePath = (item: { path?: string; url?: string }): string | null => {
      if (typeof item.path === "string" && item.path.length > 0) return item.path;
      if (typeof item.url === "string" && item.url.length > 0) return extractPathFromUrl(item.url);
      return null;
    };

    const destPhotoPath = `profile-pictures/${operatorUid}.jpg`;
    const signupPhotoPath =
      (typeof reqData.photoPath === "string" && reqData.photoPath) ||
      (typeof reqData.photoUrl === "string" ? extractPathFromUrl(reqData.photoUrl) : null);
    const originalPhotoUrl: string | null =
      typeof reqData.photoUrl === "string" && reqData.photoUrl.trim()
        ? reqData.photoUrl.trim()
        : null;

    type DocCopyResult =
      | { kind: "dot"; url: string | null }
      | { kind: "file"; entry: { name: string; url: string; path?: string } };

    const docInputs = Array.isArray(reqData.documents)
      ? (reqData.documents as { name: string; path?: string; url?: string }[])
      : [];

    // Copy profile photo and all documents in parallel.
    const [copiedPhotoUrl, ...docResults] = await Promise.all([
      signupPhotoPath
        ? copyFile(signupPhotoPath, destPhotoPath).catch((err) => {
            logger.warn("Failed to copy profile photo:", err);
            return null;
          })
        : Promise.resolve(null),

      ...docInputs.map(async (docItem): Promise<DocCopyResult | null> => {
        try {
          const srcPath = resolveStoragePath(docItem);
          if (!srcPath) {
            if (docItem.name !== DOT_CERT_LABEL) {
              return {
                kind: "file",
                entry: { name: docItem.name, url: typeof docItem.url === "string" ? docItem.url : "" },
              };
            }
            return null;
          }

          if (docItem.name === DOT_CERT_LABEL) {
            const ext = extensionFromStoragePath(srcPath);
            const dotDest = `operators/${operatorUid}/dot-proof/cert.${ext}`;
            const url = await copyFile(srcPath, dotDest);
            return { kind: "dot", url };
          }

          const destPath = `operator-documents/${operatorUid}/${docItem.name}`;
          const url = await copyFile(srcPath, destPath);
          return {
            kind: "file",
            entry: {
              name: docItem.name,
              url: url ?? (typeof docItem.url === "string" ? docItem.url : ""),
              path: destPath,
            },
          };
        } catch (err) {
          logger.warn(`Failed to copy document ${docItem.name}:`, err);
          if (docItem.name !== DOT_CERT_LABEL) {
            return {
              kind: "file",
              entry: { name: docItem.name, url: typeof docItem.url === "string" ? docItem.url : "" },
            };
          }
          return null;
        }
      }),
    ]);

    const profileImageUrl: string | null = copiedPhotoUrl ?? originalPhotoUrl;
    const files: { name: string; url: string; path?: string }[] = [];
    let dotProofUrl: string | null = null;

    for (const result of docResults) {
      if (!result) continue;
      if (result.kind === "dot") {
        dotProofUrl = result.url;
      } else {
        files.push(result.entry);
      }
    }

    const lat = readCoord(reqData.lat);
    const lng = readCoord(reqData.lng);

    let emailSent = false;
    let emailError: string | undefined;
    const applicantEmail = String(reqData.email ?? "").trim();

    const emailChain = async () => {
      if (!applicantEmail) {
        emailError = "Applicant email is missing on the signup request.";
        return;
      }
      let setPasswordUrl: string | undefined;
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
    };

    const [userDocResult] = await Promise.allSettled([
      db.doc(`users/${operatorUid}`).set({
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
      }),
      reqRef.update({
        status: "approved",
        reviewedAt: FieldValue.serverTimestamp(),
      }),
      profileImageUrl
        ? auth.updateUser(operatorUid, { photoURL: profileImageUrl }).catch((err) => {
            logger.warn("Failed to set auth photoURL for approved operator:", err);
          })
        : Promise.resolve(),
      emailChain(),
    ]);

    if (userDocResult.status === "rejected") {
      throw new HttpsError("internal", "Failed to create operator user record.");
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
