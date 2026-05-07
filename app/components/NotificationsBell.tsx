'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/app/hooks/useNotifications';

const DEFAULT_POSITION =
  'fixed z-[60] top-3.5 right-3.5 sm:top-4 sm:right-4 lg:top-5 lg:right-8';

interface NotificationsBellProps {
  uid: string | undefined;
  /** Full notifications page, e.g. `/operator/notifications` */
  seeAllHref: string;
  /** Optional — replaces default top-right fixed placement */
  className?: string;
}

export default function NotificationsBell({ uid, seeAllHref, className }: NotificationsBellProps) {
  const router = useRouter();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications(uid, 10);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const visible = items.slice(0, 10);

  const handleRowClick = async (id: string, link: string) => {
    try {
      await markRead(id);
    } catch (e) {
      console.error('markRead:', e);
    }
    setOpen(false);
    const path = link.startsWith('/') ? link : `/${link}`;
    router.push(path);
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
    } catch (e) {
      console.error('markAllRead:', e);
    }
    setOpen(false);
  };

  if (!uid) {
    return null;
  }

  const positionClass = (className?.trim() || DEFAULT_POSITION).trim();

  return (
    <div ref={rootRef} className={positionClass}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/90 bg-white text-gray-700 shadow-md shadow-gray-900/5 ring-1 ring-gray-900/5 hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-900/8 transition-[box-shadow,background-color]"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {!loading && unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-[min(100vw-2rem,20rem)] origin-top-right rounded-xl border border-gray-200/90 bg-white shadow-xl shadow-gray-900/10 ring-1 ring-gray-900/5 overflow-hidden">
          <div className="max-h-[min(70vh,22rem)] overflow-y-auto divide-y divide-gray-100">
            {visible.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications yet.</p>
            ) : (
              visible.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleRowClick(n.id, n.link)}
                  className={`flex w-full gap-2.5 text-left px-3 py-2.5 transition-colors ${
                    n.read
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-gray-50/90 hover:bg-gray-100/90'
                  }`}
                >
                  <span className="flex shrink-0 pt-1.5 justify-center w-2">
                    {!n.read ? (
                      <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                    ) : (
                      <span className="h-2 w-2" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug ${
                        n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                    {n.createdAt && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {n.createdAt.toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="flex flex-col gap-0 border-t border-gray-100 bg-gray-50/80 p-2">
            <Link
              href={seeAllHref}
              onClick={() => setOpen(false)}
              className="text-center text-xs font-semibold text-[#558B2F] py-2 rounded-lg hover:bg-gray-100"
            >
              See more
            </Link>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className="text-center text-xs font-semibold text-gray-700 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              I&apos;ve seen all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
