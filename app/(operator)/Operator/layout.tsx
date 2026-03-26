'use client';

import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import RoleGuard from '@/components/RoleGuard';
import OperatorSidebar from '@/components/OperatorSidebar';

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <AuthProvider>
      <RoleGuard allowedRoles={['operator']}>
        <div className="min-h-screen bg-gray-50">
          <OperatorSidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
            onHoverEnter={() => setIsCollapsed(false)}
            onHoverLeave={() => setIsCollapsed(true)}
          />
          <main
            className="min-h-screen p-6 pt-16 lg:pt-6 transition-all duration-200 lg:ml-[4.5rem]"
          >
            {children}
          </main>
        </div>
      </RoleGuard>
    </AuthProvider>
  );
}
