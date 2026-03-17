'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SideNav() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [showText, setShowText] = useState(true);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidenav_collapsed');
    if (saved) {
      const isCollapsed = saved === '1';
      setCollapsed(isCollapsed);
      setShowText(!isCollapsed);
    }
  }, []);

  const toggle = () => {
    if (collapsed) {
      // expanding → wait for width animation before showing text
      setCollapsed(false);
      setTimeout(() => setShowText(true), 250);
    } else {
      // collapsing → hide text immediately
      setShowText(false);
      setCollapsed(true);
    }

    localStorage.setItem('sidenav_collapsed', collapsed ? '0' : '1');
  };

  const navItems = [
    { name: 'Bookings', href: '/Operator/Booking', icon: '/booking.png' },
    { name: 'Booking History', href: '/Operator/BookingHistory', icon: '/history.png' },
    { name: 'Analytics', href: '/Operator/Analytics', icon: '/analytics.png' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <aside
      className={[
        'min-h-screen bg-green-700 text-white flex flex-col',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[220px]',
      ].join(' ')}
    >
      {/* Header */}
      <div className="pt-4 pb-3 px-3">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/15" />
            {showText && (
              <div className={`text-[12px] font-medium transition-opacity duration-200 ${
                showText ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                Super Admin
              </div>
            )}
          </div>

          <button
            onClick={toggle}
            className="w-10 h-9 flex items-center justify-center rounded-md hover:bg-white/10 transition"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-3xl leading-none select-none">
              {collapsed ? '›' : '‹'}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={[
                'w-full flex items-center text-[13px] transition-colors duration-200',
                'hover:bg-white/10',
                active ? 'bg-green-800 font-semibold' : 'font-medium',
                collapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2',
              ].join(' ')}
            >
              <span className="w-9 h-9 rounded bg-white/10 flex items-center justify-center">
                <Image
                  src={item.icon}
                  alt=""
                  width={18}
                  height={18}
                  className="object-contain"
                />
              </span>

              {showText && (
                <span className="whitespace-nowrap transition-opacity duration-200">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Settings */}
      <div className="px-2 pb-4">
        <div className="h-px bg-gray-600 mb-3" />

        <Link
          href="/Operator/Settings"
          title={collapsed ? 'Settings' : undefined}
          className={[
            'flex items-center rounded-md text-[13px] transition-all duration-200',
            'hover:bg-white/10',
            pathname === '/Operator/Settings'
              ? 'bg-gray-600 font-semibold w-full'
              : 'font-medium',
            collapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2',
          ].join(' ')}
        >
          <span className="w-9 h-9 rounded bg-white/10 flex items-center justify-center">
            <Image src="/settings.png" alt="" width={18} height={18} />
          </span>

          {showText && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
