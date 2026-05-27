'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useNotifications } from '@/app/hooks/useNotifications';
import NotificationThumbnail from '@/app/components/NotificationThumbnail';

export default function SuperAdminNotificationsPage() {
  const router = useRouter();
  const { authState } = useAuth();
  const uid =
    authState.status === 'authenticated' && authState.profile.role === 'super_admin'
      ? authState.user.uid
      : undefined;
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications(uid, 50);

  if (authState.status !== 'authenticated' || authState.profile.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/super-admin/analytics" className="text-sm text-[#558B2F] font-medium hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading…' : `${unreadCount} unread`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAllRead()}
          disabled={unreadCount === 0}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          Mark all read
        </button>
      </div>

      <ul className="space-y-2">
        {items.length === 0 && !loading ? (
          <li className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No notifications yet.
          </li>
        ) : (
          items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={async () => {
                  await markRead(n.id);
                  router.push(n.link.startsWith('/') ? n.link : `/${n.link}`);
                }}
                className={`flex w-full gap-3 text-left rounded-lg border px-4 py-3 transition-colors ${
                  n.read
                    ? 'border-gray-200 bg-white hover:bg-gray-50'
                    : 'border-gray-200 bg-gray-50/90 hover:bg-gray-100/90'
                }`}
              >
                {/* Unread dot */}
                <span className="flex shrink-0 pt-1.5 justify-center w-2.5">
                  {!n.read ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" aria-hidden />
                  ) : (
                    <span className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  )}
                </span>

                {/* Thumbnail */}
                <NotificationThumbnail imageUrl={n.imageUrl} size="lg" />

                {/* Content */}
                <span className="min-w-0 flex-1">
                  <p className={`text-sm ${n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                    {n.title}
                  </p>

                  {/* Body with bold activity name */}
                  <p className="text-sm text-gray-600 mt-0.5">
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

                  {/* Booking ID */}
                  {n.bookingId && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      #{n.bookingId.slice(0, 8).toUpperCase()}
                    </p>
                  )}
                  {n.signupRequestId && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Request #{n.signupRequestId.slice(0, 8).toUpperCase()}
                    </p>
                  )}

                  {/* CTA */}
                  {n.kind === 'booking_new' && (
                    <p className="text-xs font-medium text-[#558B2F] mt-1">
                      Review and confirm this booking →
                    </p>
                  )}
                  {n.kind === 'booking_paid' && (
                    <p className="text-xs font-medium text-[#558B2F] mt-1">
                      Payment received. Confirm and prepare →
                    </p>
                  )}
                  {n.kind === 'operator_signup_new' && (
                    <p className="text-xs font-medium text-[#558B2F] mt-1">
                      Review documents and approve or decline →
                    </p>
                  )}

                  {n.createdAt && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      {n.createdAt.toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  )}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
