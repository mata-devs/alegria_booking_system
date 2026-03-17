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
    { name: 'Bookings', href: '/operator/booking', icon: '/booking.png' },
    { name: 'Booking History', href: '/operator/history', icon: '/history.png' },
    { name: 'Analytics', href: '/operator/analytics', icon: '/analytics.png' },
  ];

  const isActive = (href) => pathname === href;

  return (
      <aside
          className={[
            'min-h-screen bg-green-700 text-white flex flex-col',
            'transition-all duration-300 ease-in-out',
            collapsed ? 'w-[85]' : 'w-[240px]',
          ].join(' ')}
      >
        {/* Header */}
        <div className="pt-10 pb-3 px-3 ">
          <div className="flex items-center justify-between gap-1 ">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15" />
              {showText && (
                  <div className={`text-[17px]  font-bold transition-opacity duration-200 ${
                      showText ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}>
                    Operator
                  </div>
              )}
            </div>

            <button
                onClick={toggle}
                className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/10 transition"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
            <span className="text-4xl leading-none select-none">
              {collapsed ? '›' : '‹'}
            </span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 pt-12">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
                <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={[
                      'w-full flex items-center text-[17px] transition-colors duration-200',
                      'hover:bg-white/10',
                      active ? 'bg-green-800 font-bold' : 'font-semibold',
                      collapsed ? 'justify-center  py-5' : 'gap-4 px-4 py-5',
                    ].join(' ')}
                >
              <span className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
                <Image
                    src={item.icon}
                    alt=""
                    width={25}
                    height={25}
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
        <div className="px-0 pb-4">
          <div className="h-1 bg-gray-600 mb-3" />

          <Link
              href="/operator/settings"
              title={collapsed ? 'Settings' : undefined}
              className={[
                'flex items-center  text-[13px] transition-all duration-200',
                'hover:bg-white/10',
                pathname === '/operator/settings'
                    ? 'bg-green-800 font-bold '
                    : 'font-semibold',
                collapsed ? 'justify-center  py-5' : 'gap-4 px-4 py-5',
              ].join(' ')}
          >
          <span className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
            <Image src="/settings.png" alt="" width={25} height={2} />
          </span>

            {showText && (
                <div className={`text-[17px]  font-bold transition-opacity duration-200 ${
                    showText ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                  Settings
                </div>
            )}
          </Link>
        </div>
      </aside>
  );
}
