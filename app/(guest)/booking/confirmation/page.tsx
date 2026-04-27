'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function BookingConfirmation() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#74C00F] to-[#45A80A] shadow-xl shadow-[#74C00F]/30 ring-[10px] ring-white">
        <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.25} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Reservation Received!</h1>
      <p className="text-gray-600 text-sm text-center max-w-sm mb-2">
        Your booking is reserved while we verify your payment.
      </p>
      <p className="text-gray-600 text-sm text-center max-w-sm mb-8">
        Check your email for confirmation details.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl bg-[#74C00F] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#74C00F]/25 transition hover:bg-[#62a30d]"
      >
        Return to home
      </Link>
    </div>
  )
}
