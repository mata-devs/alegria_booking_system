/**
 * Philippine landline (telephone):
 * - Metro Manila: 02 8XXX XXXX  →  +63 2 8XXX XXXX
 * - Provincial:   0(Area) XXX XXXX  →  +63 (Area) XXX XXXX
 */

/** Local digits: 02 + 8 subscriber digits (8XXX XXXX) */
export const METRO_LANDLINE_LOCAL_REGEX = /^02[89]\d{7}$/;

/** Local digits: leading 0, not 02/09, 9–11 digits total */
export const PROVINCIAL_LANDLINE_LOCAL_REGEX = /^0(?!2|9)\d{8,10}$/;

export const PH_LANDLINE_HINT =
  'Metro Manila: 02 8123 4567 · Provincial: 034 433 1234';

export const PH_LANDLINE_INVALID_MSG =
  'Enter a valid landline (Metro 02 8XXX XXXX or provincial 0XX XXX XXXX).';

/** Coerce legacy plain/local values to E.164 on load */
export function normalizeStoredLandlineE164(stored: string): string {
  const t = stored.trim();
  if (!t) return '';
  if (t.startsWith('+')) return t;
  let d = t.replace(/\D/g, '');
  if (d.length > 0 && !d.startsWith('0')) d = `0${d}`;
  return d ? toLandlineE164(d) : '';
}

export function landlineToLocalDigits(stored: string): string {
  const trimmed = stored.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+63')) {
    return `0${trimmed.slice(3).replace(/\D/g, '')}`;
  }
  let d = trimmed.replace(/\D/g, '');
  if (!d.startsWith('0') && d.length > 0) d = `0${d}`;
  return d;
}

export function toLandlineE164(displayOrLocal: string): string {
  const d = displayOrLocal.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('63')) return `+${d}`;
  const local = d.startsWith('0') ? d : `0${d}`;
  return `+63${local.slice(1)}`;
}

export function fromLandlineE164ToDisplay(stored: string): string {
  return formatLandlineDisplay(landlineToLocalDigits(stored));
}

/** Format local digits (with leading 0) for display */
export function formatLandlineDisplay(localDigits: string): string {
  const d = localDigits.replace(/\D/g, '');
  if (!d) return '';
  const local = d.startsWith('0') ? d : `0${d}`;

  if (local.startsWith('02')) {
    const sub = local.slice(2, 10);
    if (sub.length === 0) return '02';
    if (sub.length <= 4) return `02 ${sub}`;
    return `02 ${sub.slice(0, 4)} ${sub.slice(4)}`;
  }

  // Provincial: 034 433 1234 — area code is 0 + 2 digits (e.g. 034, 032, 082)
  if (local.length <= 3) return local;
  const area = local.slice(0, 3);
  const sub = local.slice(3, 10);
  if (sub.length === 0) return area;
  if (sub.length <= 3) return `${area} ${sub}`;
  return `${area} ${sub.slice(0, 3)} ${sub.slice(3)}`;
}

export function parseLandlineInput(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('63')) d = `0${d.slice(2)}`;
  else if (!d.startsWith('0') && d.length > 0) d = `0${d}`;

  if (d.startsWith('02')) return formatLandlineDisplay(d.slice(0, 10));
  if (d.startsWith('0')) return formatLandlineDisplay(d.slice(0, 11));
  return formatLandlineDisplay(d);
}

export function isValidLandlineE164(value: string): boolean {
  const local = landlineToLocalDigits(value);
  if (!local) return false;
  return (
    METRO_LANDLINE_LOCAL_REGEX.test(local) ||
    PROVINCIAL_LANDLINE_LOCAL_REGEX.test(local)
  );
}

export function landlineKind(localDigits: string): 'metro' | 'provincial' | null {
  const local = localDigits.replace(/\D/g, '');
  const norm = local.startsWith('0') ? local : `0${local}`;
  if (METRO_LANDLINE_LOCAL_REGEX.test(norm)) return 'metro';
  if (PROVINCIAL_LANDLINE_LOCAL_REGEX.test(norm)) return 'provincial';
  return null;
}
