'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  super_admin: '/super-admin/analytics',
  operator: '/Operator/bookings',
};

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { authState, signOutUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    if (authState.status === 'authenticated') {
      const { role } = authState.profile;
      if (!allowedRoles.includes(role)) {
        const correctDashboard = ROLE_DASHBOARD_MAP[role];
        if (correctDashboard) {
          router.replace(correctDashboard);
        } else {
          router.replace('/login');
        }
      }
    }
  }, [authState, allowedRoles, router]);

  if (authState.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#558B2F]" />
      </div>
    );
  }

  if (authState.status === 'unauthenticated') {
    return null;
  }

  if (authState.status === 'unauthorized') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-sm text-gray-500">{authState.reason}</p>
          <button
            onClick={async () => {
              await signOutUser();
              router.replace('/login');
            }}
            className="mt-2 w-full rounded-lg bg-[#558B2F] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#4a7a28] transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (authState.status === 'authenticated') {
    if (!allowedRoles.includes(authState.profile.role)) {
      return null;
    }
    return <>{children}</>;
  }

  return null;
}
