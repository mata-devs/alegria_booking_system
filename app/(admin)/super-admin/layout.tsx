'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import RoleGuard from '@/app/components/(operator)/RoleGuard';
import SuperAdminSidebar from '@/app/components/(admin)/SuperAdminSidebar';
import NotificationsBell from '@/app/components/NotificationsBell';

function SuperAdminShell({
  children,
  isCollapsed,
  setIsCollapsed,
}: {
  children: React.ReactNode;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { authState } = useAuth();
  const uid =
    authState.status === 'authenticated' && authState.profile.role === 'super_admin'
      ? authState.user.uid
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />
      <NotificationsBell uid={uid} seeAllHref="/super-admin/notifications" />
      <main
        className={`min-h-screen p-6 pt-16 lg:pt-6 transition-all duration-200 ${
          isCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-56'
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AuthProvider>
      <RoleGuard allowedRoles={['super_admin']}>
        <SuperAdminShell isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
          {children}
        </SuperAdminShell>
      </RoleGuard>
    </AuthProvider>
  );
}
