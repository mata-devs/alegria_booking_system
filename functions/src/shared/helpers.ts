import { randomUUID } from "crypto";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { db, bucket } from "./firebase";

export async function assertSuperAdmin(uid: string) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists || snap.data()?.role !== "super_admin") {
    throw new HttpsError("permission-denied", "Only super admins can perform this action.");
  }
}

export async function listSuperAdminUids(): Promise<string[]> {
  const snap = await db.collection("users").where("role", "==", "super_admin").get();
  return snap.docs.map((doc) => doc.id);
}

export function generateOperatorId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return String(num);
}

export async function copyFile(source: string, dest: string): Promise<string | null> {
  try {
    const srcFile = bucket.file(source);
    const destFile = bucket.file(dest);
    await srcFile.copy(destFile);
    // `bucket.file().copy()` does not reliably carry over the
    // `firebaseStorageDownloadTokens` system metadata, so mint a fresh token
    // and return the URL directly — avoids a second getMetadata round-trip.
    const token = randomUUID();
    await destFile.setMetadata({
      metadata: { firebaseStorageDownloadTokens: token },
    });
    const encodedPath = encodeURIComponent(dest);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
  } catch (err) {
    logger.warn(`copyFile: failed ${source} → ${dest}`, err);
    return null;
  }
}

export function extractPathFromUrl(url: string): string | null {
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

/** Token-based download URL for a Storage object (Admin SDK). */
export async function getFileDownloadUrl(path: string): Promise<string | null> {
  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) return null;

  const [meta] = await file.getMetadata();
  const rawToken = meta.metadata?.firebaseStorageDownloadTokens;
  const token =
    typeof rawToken === "string"
      ? rawToken.split(",")[0]?.trim()
      : undefined;
  if (!token) return null;

  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}