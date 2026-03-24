// Redirect /Operator → default operator view
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/Operator/bookings');
}
