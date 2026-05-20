'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { BookingState, BookingContextValue, Representative, Guest } from '../types'
import {
  DEFAULT_SERVICE_CHARGE_PER_BOOKING,
  subscribePlatformPricing,
} from '../lib/platform-pricing'

const defaultRepresentative: Representative = {
  name: '', age: '', email: '', gender: '', phone: '', nationality: '',
}

const defaultGuest = (): Guest => ({ name: '', age: '', nationality: '', gender: '', guestType: 'adult' })

const initialBooking: BookingState = {
  item: null,
  date: 'January 8, 2026',
  time: '8:00 AM',
  adultCount: 5,
  childCount: 0,
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
  const [serviceChargePerBooking, setServiceChargePerBooking] = useState(
    DEFAULT_SERVICE_CHARGE_PER_BOOKING,
  )

  useEffect(() => {
    const unsub = subscribePlatformPricing((p) => {
      setServiceChargePerBooking(p.serviceChargePerBooking)
    })
    return unsub
  }, [])

  const updateBooking = (updates: Partial<BookingState>) =>
    setBooking((prev) => ({ ...prev, ...updates }))

  const generateBookingId = (): string => {
    const id = 'TOUR-t' + Math.floor(10000 + Math.random() * 90000)
    updateBooking({ bookingId: id })
    return id
  }

  const basePrice = booking.item?.price ?? 2500
  const adultPrice = booking.item?.priceAdult ?? basePrice
  const childPrice = booking.item?.priceChild ?? basePrice
  const subtotal = adultPrice * booking.adultCount + childPrice * booking.childCount
  const serviceCharge = serviceChargePerBooking
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
