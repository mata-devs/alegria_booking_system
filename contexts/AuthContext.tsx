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
import { firebaseAuth, firebaseDb } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/lib/types';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User; profile: UserProfile }
  | { status: 'unauthorized'; user: User; reason: string };

interface AuthContextValue {
  authState: AuthState;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthState({ status: 'unauthenticated' });
        return;
      }

      try {
        const userDoc = await getDoc(doc(firebaseDb, 'users', firebaseUser.uid));

        if (!userDoc.exists()) {
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
          setAuthState({
            status: 'unauthorized',
            user: firebaseUser,
            reason: 'You do not have permission to access the admin portal.',
          });
          return;
        }

        if (data.status === 'inactive') {
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
        };

        setAuthState({ status: 'authenticated', user: firebaseUser, profile });
      } catch {
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
