import type { Timestamp } from 'firebase/firestore';
import type { ActivityTag, StoredActivityTag } from '@/app/lib/activity-tags';
import type { PackageImage } from '@/app/lib/package-images';
import type { PricingMode, PricingTier } from '@/app/lib/pricing-tiers';

export type { ImageSlot } from '@/app/(operator)/operator/_components/shared/types';

export type ActivityStatus = 'active' | 'disabled';

export interface OperatorActivity {
  id: string;
  activityName: string;
  activityDetails: string;
  pricePerGuest: number; // denormalized "from" price (lowest per-person across tiers)
  pricingMode: PricingMode;
  pricingTiers: PricingTier[];
  childAgeMax?: number; // adultChild only
  minimumNumberOfPeople: number;
  maximumNumberOfPeople: number;
  activityLocation: string;
  activityTag: StoredActivityTag;
  activityTags: StoredActivityTag[];
  activityRating: number;
  activityImages: PackageImage[];
  operatorId: string;
  createdAt: Timestamp | null;
  status: ActivityStatus;
  inclusions: string[];
  exclusions: string[];
}

export interface Filters {
  status: 'all' | ActivityStatus;
  location: string;
  priceMin: string;
  priceMax: string;
  tag: ActivityTag | '';
}

export interface AddFormState {
  activityName: string;
  activityDetails: string;
  pricingMode: PricingMode;
  pricingTiers: PricingTier[];
  childAgeMax: string;
  minimumNumberOfPeople: string;
  maximumNumberOfPeople: string;
  activityLocation: string;
  activityTags: string[];
  inclusions: string[];
  exclusions: string[];
}

export interface EditFormState {
  activityName: string;
  activityDetails: string;
  pricingMode: PricingMode;
  pricingTiers: PricingTier[];
  childAgeMax: string;
  minimumNumberOfPeople: string;
  maximumNumberOfPeople: string;
  activityLocation: string;
  activityTags: string[];
  status: ActivityStatus;
  inclusions: string[];
  exclusions: string[];
}

export type FormErrors = Partial<Record<keyof EditFormState | 'images', string>>;
