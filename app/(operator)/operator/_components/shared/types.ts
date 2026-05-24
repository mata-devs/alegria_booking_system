export type ImageSlot =
  | { id: string; kind: 'existing'; url: string; title: string; description: string }
  | { id: string; kind: 'new'; file: File; preview: string; title: string; description: string };
