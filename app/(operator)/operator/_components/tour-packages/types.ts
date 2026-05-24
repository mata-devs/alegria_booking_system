import type { Timestamp } from 'firebase/firestore';
import type { ActivityTag, StoredActivityTag } from '@/app/lib/activity-tags';
import type { PackageImage } from '@/app/lib/package-images';

export type { ImageSlot } from '@/app/(operator)/operator/_components/shared/types';

export type PackageStatus = 'active' | 'disabled';

export interface ItineraryStep {
  itineraryTime: string;
  itineraryTitle: string;
  itineraryDescription: string;
}

export interface OperatorPackage {
  id: string;
  packageName: string;
  packageDescription: string;
  pricePerPerson: number;
  priceAdult?: number;
  priceChild?: number;
  childAgeMax?: number;
  minimumNumberOfPeople: number;
  maximumNumberOfPeople: number;
  packageLocations: string[];
  duration: string;
  inclusions: string[];
  exclusions: string[];
  packageItinerary: ItineraryStep[];
  packageImages: PackageImage[];
  packageTag: StoredActivityTag;
  packageRating: number;
  status: PackageStatus;
  operatorId: string;
  slug: string;
  createdAt: Timestamp | null;
}

export interface Filters {
  status: 'all' | PackageStatus;
  location: string;
  priceMin: string;
  priceMax: string;
  tag: ActivityTag | '';
}

export interface AddFormState {
  packageName: string;
  packageDescription: string;
  pricePerPerson: string;
  priceAdult: string;
  priceChild: string;
  childAgeMax: string;
  minimumNumberOfPeople: string;
  maximumNumberOfPeople: string;
  packageLocations: string[];
  duration: string;
  packageTag: ActivityTag | '';
  inclusions: string[];
  exclusions: string[];
  packageItinerary: ItineraryStep[];
}

export type AddFormErrors = Partial<
  Record<keyof AddFormState | 'images' | 'minimumNumberOfPeople' | 'maximumNumberOfPeople', string>
>;

export interface EditFormState {
  packageName: string;
  packageDescription: string;
  pricePerPerson: string;
  priceAdult: string;
  priceChild: string;
  childAgeMax: string;
  minimumNumberOfPeople: string;
  maximumNumberOfPeople: string;
  packageLocations: string[];
  duration: string;
  packageTag: ActivityTag | '';
  status: PackageStatus;
  inclusions: string[];
  exclusions: string[];
  packageItinerary: ItineraryStep[];
}

export type EditFormErrors = Partial<
  Record<keyof EditFormState | 'images' | 'minimumNumberOfPeople' | 'maximumNumberOfPeople', string>
>;

export type PackagePreviewFormState = Pick<
  AddFormState,
  | 'packageName'
  | 'packageDescription'
  | 'packageLocations'
  | 'pricePerPerson'
  | 'maximumNumberOfPeople'
  | 'duration'
  | 'packageTag'
  | 'inclusions'
  | 'exclusions'
  | 'packageItinerary'
>;
