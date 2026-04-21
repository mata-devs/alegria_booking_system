'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { BookingState, BookingContextValue, Representative, Guest } from '../types'

const defaultRepresentative: Representative = {
  name: '', age: '', email: '', gender: '', phone: '', nationality: '',
}

const defaultGuest = (): Guest => ({ name: '', age: '', nationality: '', gender: '' })

const initialBooking: BookingState = {
  item: null,
  date: 'January 8, 2026',
  time: '8:00 AM',
  guestCount: 5,
  promoCode: '',
  promoDiscount: 0,
  paymentMethod: 'GCash',
  representative: defaultRepresentative,
  guests: Array.from({ length: 5 }, defaultGuest),
  tourOperator: '',
  paymentFile: null,
  bookingId: '',
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState>(initialBooking)

  const updateBooking = (updates: Partial<BookingState>) =>
    setBooking((prev) => ({ ...prev, ...updates }))

  const generateBookingId = (): string => {
    const id = 'TOUR-t' + Math.floor(10000 + Math.random() * 90000)
    updateBooking({ bookingId: id })
    return id
  }

  const basePrice = booking.item?.price ?? 2500
  const subtotal = basePrice * booking.guestCount
  const serviceCharge = 500
  const total = subtotal + serviceCharge - booking.promoDiscount

  return (
    <BookingContext.Provider value={{ booking, updateBooking, generateBookingId, basePrice, subtotal, serviceCharge, total }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
