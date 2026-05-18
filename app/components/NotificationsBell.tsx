'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/app/hooks/useNotifications';
import NotificationThumbnail from '@/app/components/NotificationThumbnail';

const DEFAULT_POSITION =
  'fixed z-[60] top-3.5 right-3.5 sm:top-4 sm:right-4 lg:top-5 lg:right-8';

interface NotificationsBellProps {
  uid: string | undefined;
  seeAllHref: string;
  className?: string;
}

export default function NotificationsBell({ uid, seeAllHref, className }: NotificationsBellProps) {
  const router = useRouter();
  const { items, unreadCount, loading, markRead } = useNotifications(uid, 20);
  const [open, setOpen] = useState(false);

  // lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleRowClick = async (id: string, link: string) => {
    try { await markRead(id); } catch {}
    setOpen(false);
    router.push(link.startsWith('/') ? link : `/${link}`);
  };

  if (!uid) return null;

  const positionClass = (className?.trim() || DEFAULT_POSITION).trim();

  return (
    <>
      {/* Bell button */}
      <div className={positionClass}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/90 bg-white text-gray-700 shadow-md shadow-gray-900/5 ring-1 ring-gray-900/5 hover:bg-gray-50 hover:shadow-lg transition-[box-shadow,background-color]"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
          {!loading && unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
              aria-hidden
            />
          )}
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[80] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <style>{`
            @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideInRight { from { transform: translateX(12px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
            .notif-fade { animation: fadeInOverlay 180ms ease-out both }
            .notif-slide { animation: slideInRight 220ms cubic-bezier(0.22,1,0.36,1) both }
          `}</style>

          {/* Frosted backdrop */}
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="notif-fade absolute inset-0 bg-neutral-900/30 backdrop-blur-sm"
          />

          {/* Glassy panel */}
          <aside className="notif-slide relative flex h-full w-full max-w-sm flex-col overflow-hidden border-l border-white/40 bg-white/70 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200/60 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Notifications</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/70 text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100/80">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">No notifications yet.</div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleRowClick(n.id, n.link)}
                    className={`flex items-stretch w-full gap-3 text-left px-5 py-3.5 transition-colors ${
                      n.read
                        ? 'bg-transparent hover:bg-white/50'
                        : 'bg-green-50/70 hover:bg-green-50/90'
                    }`}
                  >
                    {/* Unread dot */}
                    <span className="flex shrink-0 pt-2 w-2 justify-center">
                      {!n.read
                        ? <span className="h-2 w-2 rounded-full bg-[#558B2F] shrink-0" aria-hidden />
                        : <span className="h-2 w-2 shrink-0" aria-hidden />
                      }
                    </span>

                    {/* Thumbnail */}
                    <NotificationThumbnail imageUrl={n.imageUrl} size="md" stretch />

                    {/* Content */}
                    <span className="min-w-0 flex-1">
                      <p className={`text-xs leading-snug ${n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                        {n.activityName ? (() => {
                          const idx = n.body.indexOf(n.activityName!);
                          if (idx === -1) return n.body;
                          return (
                            <>
                              {n.body.slice(0, idx)}
                              <strong className="font-semibold text-gray-800">{n.activityName}</strong>
                              {n.body.slice(idx + n.activityName!.length)}
                            </>
                          );
                        })() : n.body}
                      </p>
                      {n.createdAt && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {n.createdAt.toLocaleString(undefined, {
                            month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit',
                          })}
                        </p>
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200/60 bg-white/40 px-5 py-3">
              <Link
                href={seeAllHref}
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-semibold text-[#558B2F] py-1.5 rounded-lg hover:bg-white/60 transition-colors"
              >
                See all notifications
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
