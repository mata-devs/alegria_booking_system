export interface Location {
  id: string
  name: string
  activityCount: number
  image: string
}

export interface Activity {
  id: number
  category: string
  title: string
  location: string
  rating: number
  reviewCount: number
  price: number
  image: string
  municipalityId: string
}

export interface TourPackage {
  id: number
  title: string
  description: string
  price: number
  image: string
  theme: string
  duration: string
  inclusions: string[]
  municipalityId: string
}

export interface TravelerReview {
  id: number
  name: string
  avatar: string
  rating: number
  activityTitle: string
  date: string
  text: string
}

export interface Representative {
  name: string
  age: string
  email: string
  gender: string
  phone: string
  nationality: string
}

export interface Guest {
  name: string
  age: string
  nationality: string
  gender: string
}

export interface BookingState {
  item: Activity | TourPackage | null
  date: string
  time: string
  guestCount: number
  promoCode: string
  promoDiscount: number
  paymentMethod: string
  representative: Representative
  guests: Guest[]
  tourOperator: string
  paymentFile: File | null
  bookingId: string
}

export interface BookingContextValue {
  booking: BookingState
  updateBooking: (updates: Partial<BookingState>) => void
  generateBookingId: () => string
  basePrice: number
  subtotal: number
  serviceCharge: number
  total: number
}
