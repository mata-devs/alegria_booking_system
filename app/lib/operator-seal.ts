import type { FirestoreUser } from '@/app/lib/types';

export function operatorHasSeal(
  user: Pick<FirestoreUser, 'hasDOTQualitySeal'> | null | undefined,
): boolean {
  return user?.hasDOTQualitySeal === true;
}
