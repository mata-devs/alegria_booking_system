'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from '@/app/lib/firebase';
import type { UserProfile, UserRole } from '@/app/lib/types';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User; profile: UserProfile }
  | { status: 'unauthorized'; user: User; reason: string };

interface AuthContextValue {
  authState: AuthState;
  signOutUser: () => Promise<void>;
}

const PROFILE_CACHE_KEY = 'sc_auth_v1';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        try { sessionStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
        setAuthState({ status: 'unauthenticated' });
        return;
      }

      // Instant render from cache — eliminates loading flash on re-navigation within session
      try {
        const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as { uid: string; profile: UserProfile };
          if (cached.uid === firebaseUser.uid) {
            setAuthState({ status: 'authenticated', user: firebaseUser, profile: cached.profile });
          }
        }
      } catch {}

      // Always verify against Firestore to catch suspensions / role changes
      try {
        const userDoc = await getDoc(doc(firebaseDb, 'users', firebaseUser.uid));

        if (!userDoc.exists()) {
          try { sessionStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
          setAuthState({
            status: 'unauthorized',
            user: firebaseUser,
            reason: 'No user profile found. Please contact an administrator.',
          });
          return;
        }

        const data = userDoc.data();
        const role = data.role as UserRole;

        if (role !== 'super_admin' && role !== 'operator') {
          try { sessionStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
          setAuthState({
            status: 'unauthorized',
            user: firebaseUser,
            reason: 'You do not have permission to access the admin portal.',
          });
          return;
        }

        if (data.status === 'suspended') {
          try { sessionStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
          setAuthState({
            status: 'unauthorized',
            user: firebaseUser,
            reason: 'Your account has been deactivated. Please contact an administrator.',
          });
          return;
        }

        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role,
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          status: data.status ?? 'active',
          createdAt: data.createdAt?.toDate?.() ?? null,
        };

        try { sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ uid: firebaseUser.uid, profile })); } catch {}
        setAuthState({ status: 'authenticated', user: firebaseUser, profile });
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setAuthState({
          status: 'unauthorized',
          user: firebaseUser,
          reason: 'Failed to verify your account. Please try again.',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  async function signOutUser() {
    await signOut(firebaseAuth);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ authState, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}