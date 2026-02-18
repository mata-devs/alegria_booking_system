'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  super_admin: '/super-admin/analytics',
  operator: '/operator/bookings',
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#178893]" />
      </div>
    );
  }

  if (authState.status === 'unauthenticated') {
    return null;
  }

  if (authState.status === 'unauthorized') {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">{authState.reason}</p>
          <button
            onClick={async () => {
              await signOutUser();
              router.replace('/login');
            }}
            className="rounded-xl bg-[#178893] px-6 py-3 text-white font-semibold hover:bg-[#156c84] transition-colors"
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
