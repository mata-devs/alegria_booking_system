/** Labels stored on `users.files[].name` after signup approval (keep in sync with functions). */
export const DOT_CERT_LABEL = 'DOT Accreditation Certificate (optional)';

export const OPERATOR_COMPLIANCE_DOCUMENT_LABELS = [
  'Valid ID (Government-issued)',
  'Business Permit / Registration',
  'Proof of Address',
  'Tax Identification Certificate',
] as const;

export function isDotCertDocumentName(name: string): boolean {
  return name === DOT_CERT_LABEL;
}

export function sortComplianceDocuments<T extends { name: string }>(docs: T[]): T[] {
  const order = new Map(OPERATOR_COMPLIANCE_DOCUMENT_LABELS.map((label, i) => [label, i]));
  return [...docs].sort((a, b) => {
    const ai = order.get(a.name as (typeof OPERATOR_COMPLIANCE_DOCUMENT_LABELS)[number]) ?? 999;
    const bi = order.get(b.name as (typeof OPERATOR_COMPLIANCE_DOCUMENT_LABELS)[number]) ?? 999;
    return ai - bi || a.name.localeCompare(b.name);
  });
}
