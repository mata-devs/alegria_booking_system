/** Philippine mobile: 10 digits starting with 9; stored as E.164 +63… */

export const PH_LOCAL_PHONE_REGEX = /^9\d{9}$/;

export function formatPhDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function toPhE164(display: string): string {
  const digits = display.replace(/\D/g, '').slice(0, 10);
  return digits ? `+63${digits}` : '';
}

export function fromPhE164ToDisplay(stored: string): string {
  const local = stored.startsWith('+63') ? stored.slice(3) : stored;
  return formatPhDisplay(local.replace(/\D/g, ''));
}

export function parsePhPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  return formatPhDisplay(digits.slice(0, 10));
}

export function isValidPhE164(value: string): boolean {
  if (!value.trim()) return false;
  const local = value.startsWith('+63') ? value.slice(3) : value;
  return PH_LOCAL_PHONE_REGEX.test(local.replace(/\D/g, ''));
}

export const PH_PHONE_HINT = 'Enter your 10-digit mobile number (e.g. 917 123 4567)';
export const PH_PHONE_INVALID_MSG =
  'Enter a valid Philippine mobile number (e.g. 917 123 4567).';

/** Coerce legacy plain/local values to E.164 on load */
export function normalizeStoredMobileE164(stored: string): string {
  const t = stored.trim();
  if (!t) return '';
  if (t.startsWith('+')) return t;
  let d = t.replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  return d ? toPhE164(d) : '';
}
