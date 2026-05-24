'use client';

import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseDb } from '@/app/lib/firebase';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: { uid: string }; profile: { customInclusionChips?: string[]; customExclusionChips?: string[] } }
  | { status: 'unauthorized'; user: { uid: string }; reason: string };

const PROFILE_CACHE_KEY = 'vc_auth_v1';

function readChips(data: Record<string, unknown> | undefined) {
  return {
    inclusion: Array.isArray(data?.customInclusionChips) ? (data.customInclusionChips as string[]) : [],
    exclusion: Array.isArray(data?.customExclusionChips) ? (data.customExclusionChips as string[]) : [],
  };
}

function patchProfileCache(uid: string, field: 'customInclusionChips' | 'customExclusionChips', chips: string[]) {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return;
    const cached = JSON.parse(raw) as { uid: string; profile: Record<string, unknown> };
    if (cached.uid !== uid) return;
    cached.profile[field] = chips;
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // ignore cache errors
  }
}

export function useOperatorCustomChips(authState: AuthState) {
  const [inclusionChips, setInclusionChips] = useState<string[]>([]);
  const [exclusionChips, setExclusionChips] = useState<string[]>([]);
  const [chipError, setChipError] = useState<string | null>(null);

  const uid = authState.status === 'authenticated' ? authState.user.uid : null;

  const loadChips = useCallback(async () => {
    if (!uid) return;
    try {
      const snap = await getDoc(doc(firebaseDb, 'users', uid));
      if (!snap.exists()) return;
      const { inclusion, exclusion } = readChips(snap.data());
      setInclusionChips(inclusion);
      setExclusionChips(exclusion);
    } catch (err) {
      console.error('Failed to load custom chips:', err);
    }
  }, [uid]);

  useEffect(() => {
    if (authState.status === 'authenticated') {
      setInclusionChips(authState.profile.customInclusionChips ?? []);
      setExclusionChips(authState.profile.customExclusionChips ?? []);
      void loadChips();
    }
  }, [authState, loadChips]);

  const persistChips = useCallback(
    async (kind: 'inclusion' | 'exclusion', next: string[]): Promise<void> => {
      if (!uid) return;
      const field = kind === 'inclusion' ? 'customInclusionChips' : 'customExclusionChips';
      const prev = kind === 'inclusion' ? inclusionChips : exclusionChips;

      if (kind === 'inclusion') setInclusionChips(next);
      else setExclusionChips(next);
      setChipError(null);

      try {
        await updateDoc(doc(firebaseDb, 'users', uid), { [field]: next });
        patchProfileCache(uid, field, next);
      } catch (err) {
        if (kind === 'inclusion') setInclusionChips(prev);
        else setExclusionChips(prev);
        console.error('Failed to save custom chips:', err);
        setChipError('Could not save custom chip. Try again.');
      }
    },
    [uid, inclusionChips, exclusionChips],
  );

  const addCustomChip = useCallback(
    async (kind: 'inclusion' | 'exclusion', chip: string): Promise<void> => {
      const current = kind === 'inclusion' ? inclusionChips : exclusionChips;
      if (current.includes(chip)) return;
      await persistChips(kind, [...current, chip]);
    },
    [inclusionChips, exclusionChips, persistChips],
  );

  const removeCustomChip = useCallback(
    async (kind: 'inclusion' | 'exclusion', chip: string): Promise<void> => {
      const current = kind === 'inclusion' ? inclusionChips : exclusionChips;
      await persistChips(kind, current.filter((c) => c !== chip));
    },
    [inclusionChips, exclusionChips, persistChips],
  );

  return {
    inclusionChips,
    exclusionChips,
    chipError,
    addCustomChip,
    removeCustomChip,
  };
}
