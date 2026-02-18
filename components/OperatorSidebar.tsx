'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClipboardList,
  History,
  BarChart3,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Bookings', href: '/operator/bookings', icon: ClipboardList },
  { label: 'Bookings\nHistory', href: '/operator/history', icon: History },
  { label: 'Analytics', href: '/operator/analytics', icon: BarChart3 },
];

interface OperatorSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function OperatorSidebar({ isCollapsed, onToggleCollapse }: OperatorSidebarProps) {
  const pathname = usePathname();
  const { signOutUser } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#558B2F] text-white flex flex-col transition-all duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-18' : 'w-56'}`}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 py-6 ${isCollapsed ? 'justify-center px-3' : 'px-5'}`}>
          {!isCollapsed && (
            <>
              <CircleUserRound className="h-10 w-10 shrink-0" strokeWidth={1.5} />
              <span className="text-lg font-bold leading-tight">Operator</span>
            </>
          )}
          <button
            onClick={() => {
              onToggleCollapse();
              setIsMobileOpen(false);
            }}
            className={isCollapsed ? '' : 'ml-auto'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className={`border-t border-white/30 ${isCollapsed ? 'mx-3' : 'mx-5'}`} />

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-2 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label.replace('\n', ' ') : undefined}
                className={`flex items-center rounded-lg text-sm font-semibold transition-colors ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'gap-4 px-3 py-3'
                } ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <item.icon className="h-5 w-5" />
                </span>
                {!isCollapsed && (
                  <span className="whitespace-pre-line leading-tight">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={`border-t border-white/30 ${isCollapsed ? 'mx-3' : 'mx-5'}`} />
        <div className={`py-4 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <Link
            href="/operator/settings"
            title={isCollapsed ? 'Settings' : undefined}
            className={`flex items-center rounded-lg text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors ${
              isCollapsed ? 'justify-center px-2 py-3' : 'gap-4 px-3 py-3'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Settings className="h-5 w-5" />
            </span>
            {!isCollapsed && 'Settings'}
          </Link>
          <button
            onClick={signOutUser}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`flex w-full items-center rounded-lg text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors ${
              isCollapsed ? 'justify-center px-2 py-3' : 'gap-4 px-3 py-3'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <LogOut className="h-5 w-5" />
            </span>
            {!isCollapsed && 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
