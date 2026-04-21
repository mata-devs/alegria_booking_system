'use client';

import { useState } from 'react';
import { AuthProvider } from '@/app/context/AuthContext';
import RoleGuard from '@/app/components/(operator)/RoleGuard';
import SuperAdminSidebar from '@/app/components/(admin)/SuperAdminSidebar';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AuthProvider>
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="min-h-screen bg-gray-50">
          <SuperAdminSidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          />
          <main
            className={`min-h-screen p-6 pt-16 lg:pt-6 transition-all duration-200 ${
              isCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-56'
            }`}
          >
            {children}
          </main>
        </div>
      </RoleGuard>
    </AuthProvider>
  );
}
