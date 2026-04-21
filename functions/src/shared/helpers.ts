import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { db, bucket } from "./firebase";

export async function assertSuperAdmin(uid: string) {
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists || snap.data()?.role !== "super_admin") {
    throw new HttpsError("permission-denied", "Only super admins can perform this action.");
  }
}

export function generateOperatorId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return String(num);
}

export async function copyFile(source: string, dest: string) {
  const srcFile = bucket.file(source);
  const [exists] = await srcFile.exists();
  if (!exists) {
    logger.warn(`copyFile: source not found – ${source}`);
    return;
  }
  await srcFile.copy(bucket.file(dest));
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