/** Canonical app origin for links (emails, copy link). Prefer NEXT_PUBLIC_APP_URL when set. */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
