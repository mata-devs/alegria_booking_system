import {
  Bus,
  Utensils,
  UserRound,
  Ticket,
  DoorOpen,
  Camera,
  Coffee,
  Droplets,
  Shield,
  Car,
  Tag,
  type LucideIcon,
} from 'lucide-react';

export const DEFAULT_INCLUSION_CHIPS = [
  'Transportation',
  'Food',
  'Tour Guide',
  'Activity Fee',
  'Entrance Fee',
  'Equipment Rental',
  'Photographer',
  'Snacks / Refreshments',
  'Bottled Water',
  'Insurance',
  'Hotel Pickup',
] as const;

export const DEFAULT_EXCLUSION_CHIPS = [
  'Transportation',
  'Food',
  'Personal Expenses',
  'Tips / Gratuity',
  'Travel Insurance',
] as const;

export type DefaultInclusionChip = (typeof DEFAULT_INCLUSION_CHIPS)[number];
export type DefaultExclusionChip = (typeof DEFAULT_EXCLUSION_CHIPS)[number];

export const INCLUSION_ICON_MAP: Record<string, LucideIcon> = {
  Transportation: Bus,
  Food: Utensils,
  'Tour Guide': UserRound,
  'Activity Fee': Ticket,
  'Entrance Fee': DoorOpen,
  'Equipment Rental': Camera,
  Photographer: Camera,
  'Snacks / Refreshments': Coffee,
  'Bottled Water': Droplets,
  Insurance: Shield,
  'Hotel Pickup': Car,
};

export function isDefaultChip(chip: string, variant: 'inclusion' | 'exclusion'): boolean {
  const list = variant === 'inclusion' ? DEFAULT_INCLUSION_CHIPS : DEFAULT_EXCLUSION_CHIPS;
  return (list as readonly string[]).includes(chip);
}

export function validateChipList(
  chips: string[],
  defaults: readonly string[],
  customs: string[],
): { valid: boolean; invalid: string[] } {
  const allowed = new Set<string>([...defaults, ...customs]);
  const invalid = chips.filter((c) => !allowed.has(c));
  return { valid: invalid.length === 0, invalid };
}

export function inclusionChipIcon(chip: string): LucideIcon {
  return INCLUSION_ICON_MAP[chip] ?? Tag;
}
