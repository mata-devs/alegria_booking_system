import type { AddFormState, Filters } from './types';

export { MIN_IMAGES, MAX_IMAGES, MAX_SIZE_MB } from '../shared/constants';

export const EMPTY_FORM: AddFormState = {
  activityName: '',
  activityDetails: '',
  pricePerGuest: '',
  priceAdult: '',
  priceChild: '',
  childAgeMax: '',
  minimumNumberOfPeople: '1',
  maximumNumberOfPeople: '30',
  activityLocation: '',
  activityTags: [],
  inclusions: [],
  exclusions: [],
};

export const EMPTY_FILTERS: Filters = {
  status: 'all',
  location: '',
  priceMin: '',
  priceMax: '',
  tag: '',
};
