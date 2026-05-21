import type { FocusEvent } from 'react';

/** Skip blur validation when Tab moves between landline ↔ mobile in same form */
export function blurUnlessPhoneSibling(
  e: FocusEvent<HTMLElement>,
  siblingInputId: string,
  onBlur: () => void,
): void {
  const next = e.relatedTarget as HTMLElement | null;
  if (next?.id === siblingInputId) return;
  onBlur();
}
