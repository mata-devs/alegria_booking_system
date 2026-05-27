/** Must match app/lib/operator-signup-documents.ts */
export const DOT_CERT_LABEL = "DOT Accreditation Certificate (optional)";

export function extensionFromStoragePath(path: string): string {
  const base = path.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot === -1) return "pdf";
  const ext = base.slice(dot + 1).toLowerCase();
  return ext || "pdf";
}
