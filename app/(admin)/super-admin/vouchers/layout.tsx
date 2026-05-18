'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/super-admin/vouchers/code', label: 'Voucher Codes' },
  { href: '/super-admin/vouchers/entity', label: 'Entity' },
];

export default function VouchersLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg">
        {TABS.map((tab, idx) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <div key={tab.href} className="flex items-center">
              {idx > 0 && <div className="w-px bg-gray-300 my-2" />}
              <Link
                href={tab.href}
                className={`px-6 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'text-[#558B2F] border-b-2 border-[#558B2F]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </Link>
            </div>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 mt-4">{children}</div>
    </div>
  );
}
