export interface Location {
  id: string
  name: string
  activityCount: number
  /** Present when list built from Firestore (guest locations grid). */
  packageCount?: number
  image: string
}

export interface Activity {
  id: number
  firestoreId?: string
  category: string
  categories?: string[]
  title: string
  location: string
  rating: number
  reviewCount: number
  price: number
  priceAdult?: number
  priceChild?: number
  childAgeMax?: number
  maxGuests?: number
  image: string
  municipalityId: string
  duration?: string
}

export interface TourPackage {
  id: number
  title: string
  description: string
  price: number
  priceAdult?: number
  priceChild?: number
  childAgeMax?: number
  image: string
  theme: string
  duration: string
  inclusions: string[]
  exclusions: string[]
  municipalityIds: string[]
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
  guestType: "adult" | "child"
}

export interface BookingState {
  item: Activity | TourPackage | null
  date: string
  time: string
  adultCount: number
  childCount: number
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
