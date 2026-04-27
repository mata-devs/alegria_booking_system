'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Footer from '@/app/components/Footer'
import { BentoGallery, Lightbox } from '@/app/components/ui/BentoGallery'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/app/components/ui/drawer'
import { doc, getDoc } from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'
import { travelerReviews } from '@/app/data/mockData'
import { useBooking } from '@/app/context/BookingContext'
import Image from 'next/image'

interface FirestoreActivity {
  id: string
  activityName: string
  activityDetails: string
  pricePerGuest: number
  activityLocation: string
  activityTag: string
  activityRating: number
  activityImages: string[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ActivityDetail() {
  const params = useParams()
  const activityId = params.activityId as string
  const router = useRouter()
  const { updateBooking } = useBooking()

  const [activity, setActivity] = useState<FirestoreActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(firebaseDb, 'activities', activityId))
        if (!snap.exists()) { setNotFound(true); setLoading(false); return }
        setActivity({ id: snap.id, ...snap.data() } as FirestoreActivity)
      } catch (err) {
        console.error(err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activityId])

  const handleBook = () => {
    if (!activity) return
    updateBooking({
      item: {
        id: 0,
        firestoreId: activity.id,
        title: activity.activityName,
        location: activity.activityLocation,
        category: activity.activityTag,
        rating: activity.activityRating,
        reviewCount: 0,
        price: activity.pricePerGuest,
        image: activity.activityImages[0] ?? '',
        municipalityId: activity.activityLocation,
      },
      date,
      guestCount: travelers,
    })
    router.push('/booking/guest-info')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4]">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound || !activity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0fdf4] gap-4">
        <p className="text-gray-700 font-semibold">Activity not found.</p>
        <Link href="/activities" className="text-green-600 text-sm hover:underline">Back to Activities</Link>
      </div>
    )
  }

  const images = activity.activityImages

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 py-8 pb-28 lg:pb-8">
        <nav className="text-sm text-gray-500 mb-5">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/activities" className="hover:text-green-600">Activities</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">{activity.activityName}</span>
        </nav>

        {/* Gallery */}
        <div className="mb-8">
          <BentoGallery images={images} alt={activity.activityName} onImageClick={setLightboxIdx} />
        </div>

        {lightboxIdx !== null && (
          <Lightbox
            images={images}
            idx={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onChange={setLightboxIdx}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{activity.activityName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
              <span>{activity.activityLocation}</span>
              <span>•</span>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{activity.activityTag}</span>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <StarRating rating={activity.activityRating} />
              <span className="text-sm font-semibold text-gray-700">{activity.activityRating.toFixed(1)}</span>
            </div>

            <section className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-3">About this activity</h2>
              <p className="text-gray-500 leading-relaxed text-sm whitespace-pre-wrap">{activity.activityDetails}</p>
            </section>

            {/* Reviews */}
            <section className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Reviews <span className="text-gray-400 font-normal text-sm">({travelerReviews.length * 2} reviews)</span>
              </h2>
              <div className="space-y-5">
                {[...travelerReviews, ...travelerReviews].map((review, i) => (
                  <div key={i} className="flex items-start gap-4 pb-5 border-b border-gray-100 last:border-0">
                    <Image src={review.avatar} alt={review.name} width={40} height={40} className="rounded-full object-cover shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-800">{review.name}</p>
                        <p className="text-xs text-gray-400">{review.date}</p>
                      </div>
                      <StarRating rating={review.rating} />
                      <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{review.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Booking sidebar — desktop only */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <div className="mb-5">
                <p className="text-xs text-gray-400 mb-0.5">Price per guest</p>
                <span className="text-3xl font-extrabold text-gray-900">₱{activity.pricePerGuest.toLocaleString()}</span>
                <span className="text-gray-400 text-sm ml-1">/ person</span>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="outline-none text-sm text-gray-700 flex-1 bg-transparent [color-scheme:light]"
                    style={{ colorScheme: 'light' }} />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Travelers</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50 justify-between">
                  <button onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                    className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors text-lg leading-none">−</button>
                  <span className="text-sm font-semibold text-gray-800">{travelers} {travelers === 1 ? 'guest' : 'guests'}</span>
                  <button onClick={() => setTravelers((t) => t + 1)}
                    className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors text-lg leading-none">+</button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>₱{activity.pricePerGuest.toLocaleString()} × {travelers}</span>
                  <span>₱{(activity.pricePerGuest * travelers).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>₱{(activity.pricePerGuest * travelers).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleBook}
                className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-md flex items-center justify-center gap-2"
              >
                Reserve This Activity
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">No charges yet — review before paying</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile sticky booking bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Price per guest</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-gray-900">₱{activity.pricePerGuest.toLocaleString()}</span>
            <span className="text-xs text-gray-400">/ person</span>
          </div>
        </div>
        <button
          onClick={() => setBookingDrawerOpen(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold px-5 py-3 rounded-full text-sm transition-all shadow-md shrink-0"
        >
          Book This Activity
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>

      {/* Mobile booking drawer */}
      <Drawer open={bookingDrawerOpen} onOpenChange={setBookingDrawerOpen}>
        <DrawerContent className="pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-lg">Reserve Your Spot 🌊</DrawerTitle>
            <DrawerDescription className="text-gray-500 text-sm truncate">{activity.activityName}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-extrabold text-gray-900">₱{activity.pricePerGuest.toLocaleString()}</span>
              <span className="text-sm text-gray-400">/ person</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="outline-none text-sm text-gray-700 flex-1 bg-transparent [color-scheme:light]"
                  style={{ colorScheme: 'light' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Travelers</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50 justify-between">
                <button onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                  className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors text-lg leading-none">−</button>
                <span className="text-sm font-semibold text-gray-800">{travelers} {travelers === 1 ? 'guest' : 'guests'}</span>
                <button onClick={() => setTravelers((t) => t + 1)}
                  className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors text-lg leading-none">+</button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>₱{activity.pricePerGuest.toLocaleString()} × {travelers}</span>
                <span>₱{(activity.pricePerGuest * travelers).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span>
                <span>₱{(activity.pricePerGuest * travelers).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => { setBookingDrawerOpen(false); handleBook() }}
              className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-4 rounded-full transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              Confirm & Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <p className="text-center text-xs text-gray-400">No charges yet — review before paying</p>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
