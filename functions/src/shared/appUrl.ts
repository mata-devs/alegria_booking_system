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
