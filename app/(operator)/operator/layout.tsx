'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import RoleGuard from '@/app/components/(operator)/RoleGuard';
import OperatorSidebar from '@/app/components/(operator)/OperatorSidebar';
import RightRail from '@/app/components/RightRail';

function OperatorShell({
  children,
  isCollapsed,
  setIsCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { authState, signOutUser } = useAuth();
  const uid = authState.status === 'authenticated' ? authState.user.uid : undefined;
  const profile = authState.status === 'authenticated' ? authState.profile : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <OperatorSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        onHoverEnter={() => setIsCollapsed(false)}
        onHoverLeave={() => setIsCollapsed(true)}
      />
      <RightRail uid={uid} profile={profile} seeAllHref="/operator/notifications" onSignOut={signOutUser} />
      <main className="min-h-screen p-6 pt-16 lg:pt-6 pr-16 transition-all duration-200 lg:ml-[4.5rem]">
        {children}
      </main>
    </div>
  );
}

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <AuthProvider>
      <RoleGuard allowedRoles={['operator']}>
        <OperatorShell isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
          {children}
        </OperatorShell>
      </RoleGuard>
    </AuthProvider>
  );
}
