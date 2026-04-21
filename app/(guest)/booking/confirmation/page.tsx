'use client'

import Link from 'next/link'
import { useBooking } from '@/app/context/BookingContext'

export default function BookingConfirmation() {
  const { booking } = useBooking()
  const bookingId = booking.bookingId || 't22542'

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-sm">
          <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reservation Received!</h1>

        <p className="text-gray-700 text-base mb-2 text-center">Thank you for your reservation.</p>
        <p className="text-gray-700 text-sm text-center max-w-md mb-1">
          Your reservation has been received and is being processed.
        </p>
        <p className="text-gray-700 text-sm text-center max-w-md mb-6">
          A tour representative will call or email you to confirm your booking and payment.
        </p>

        <p className="text-gray-800 text-sm mb-8">
          Booking ID: TOUR - <span className="font-bold">{bookingId}</span>
        </p>

        <div className="w-full max-w-lg border border-blue-200 rounded-2xl bg-blue-50 py-5 px-6 text-center mb-10">
          <p className="text-blue-600 text-sm">
            We&apos;ve sent an email to your inbox with your reservation details and instructions on how to contact us.
          </p>
        </div>

        <Link href="/" className="text-green-600 font-bold text-lg underline underline-offset-2 hover:text-green-700 transition-colors">
          Return to Website
        </Link>
      </div>
    </div>
  )
}
