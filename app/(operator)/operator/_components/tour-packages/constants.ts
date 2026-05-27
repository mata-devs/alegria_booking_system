import type { AddFormState, Filters } from './types';

export { MIN_IMAGES, MAX_IMAGES, MAX_SIZE_MB } from '../shared/constants';

export const EMPTY_FORM: AddFormState = {
  packageName: '',
  packageDescription: '',
  pricePerPerson: '',
  priceAdult: '',
  priceChild: '',
  childAgeMax: '',
  minimumNumberOfPeople: '1',
  maximumNumberOfPeople: '10',
  packageLocations: [],
  duration: '',
  packageTag: '',
  inclusions: [],
  exclusions: [],
  packageItinerary: [],
};

export const EMPTY_FILTERS: Filters = {
  status: 'all',
  location: '',
  priceMin: '',
  priceMax: '',
  tag: '',
};

export function generateSlug(locations: string[], docId: string): string {
  const primary = locations[0] ?? 'package';
  const loc = primary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${loc}-${docId.slice(0, 6)}`;
}
