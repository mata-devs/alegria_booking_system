// Redirect /operator → default operator view
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/operator/bookings');
}
