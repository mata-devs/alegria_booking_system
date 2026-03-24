import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Exact legacy paths only — avoids broad matching that can cause redirect loops. */
const LEGACY_REDIRECTS: Record<string, string> = {
  '/operator': '/Operator/bookings',
  '/operator/booking': '/Operator/bookings',
  '/operator/history': '/Operator/history',
  '/operator/analytics': '/Operator/Analytics',
  '/operator/settings': '/Operator/Settings',
  '/Operator/Booking': '/Operator/bookings',
  '/Operator/BookingHistory': '/Operator/history',
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const destination = LEGACY_REDIRECTS[pathname];
  if (destination) {
    return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/operator',
    '/operator/booking',
    '/operator/history',
    '/operator/analytics',
    '/operator/settings',
    '/Operator/Booking',
    '/Operator/BookingHistory',
  ],
};
