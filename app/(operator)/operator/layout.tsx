'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import RoleGuard from '@/app/components/(operator)/RoleGuard';
import OperatorSidebar from '@/app/components/(operator)/OperatorSidebar';
import NotificationsBell from '@/app/components/NotificationsBell';

function OperatorShell({
  children,
  isCollapsed,
  setIsCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { authState } = useAuth();
  const uid = authState.status === 'authenticated' ? authState.user.uid : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <OperatorSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        onHoverEnter={() => setIsCollapsed(false)}
        onHoverLeave={() => setIsCollapsed(true)}
      />
      <div className="flex flex-col min-h-screen transition-all duration-200 lg:ml-[4.5rem]">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-end border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4">
          <NotificationsBell uid={uid} seeAllHref="/operator/notifications" className="relative" />
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
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
