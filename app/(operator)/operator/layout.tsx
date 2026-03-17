'use client';

import { useEffect, useState } from 'react';
import SideNav from '@/components/sidenav';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // keep in sync with localStorage (since SideNav saves there)
  useEffect(() => {
    const read = () => setCollapsed(localStorage.getItem('sidenav_collapsed') === '1');
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* SideNav keeps its own width (72px / 220px) */}
      <SideNav />

      {/* Main content automatically takes remaining space */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}