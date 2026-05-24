import { defineString } from "firebase-functions/params";

const appUrlParam = defineString("APP_URL", {
  default: "http://localhost:3000",
  description: "Public app URL for links in emails (staging/production)",
});

export function getAppUrl(): string {
  return appUrlParam.value().replace(/\/$/, "");
}

export function buildOperatorSignupUrl(token: string): string {
  return `${getAppUrl()}/operator-signup?token=${encodeURIComponent(token)}`;
}

/** Rewrites Firebase-hosted reset links to use APP_URL/reset-password (hides apiKey/domain noise). */
export function buildAppPasswordResetUrl(firebaseResetLink: string): string | null {
  try {
    const parsed = new URL(firebaseResetLink);
    const oobCode = parsed.searchParams.get("oobCode");
    if (!oobCode) return null;
    const mode = parsed.searchParams.get("mode") ?? "resetPassword";
    const app = new URL(`${getAppUrl()}/reset-password`);
    app.searchParams.set("mode", mode);
    app.searchParams.set("oobCode", oobCode);
    return app.toString();
  } catch {
    return null;
  }
}

export function buildAppLoginUrl(): string {
  return `${getAppUrl()}/login`;
}
