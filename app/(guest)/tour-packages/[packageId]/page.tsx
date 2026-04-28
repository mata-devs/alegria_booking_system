'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Footer from '@/app/components/Footer'
import { BentoGallery, Lightbox } from '@/app/components/ui/BentoGallery'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/app/components/ui/drawer'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firebaseDb } from '@/app/lib/firebase'
import { travelerReviews } from '@/app/data/mockData'

interface ItineraryStep {
  itineraryTime: string
  itineraryTitle: string
  itineraryDescription: string
}

interface FirestorePackage {
  id: string
  packageName: string
  packageDescription: string
  pricePerPerson: number
  packageLocation: string
  duration: string
  inclusions: string[]
  exclusions: string[]
  packageItinerary: ItineraryStep[]
  packageImages: string[]
  packageTag: string
  packageRating: number
  slug: string
  minimumNumberOfPeople: number
  maximumNumberOfPeople?: number
  operatorId: string
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

const botReplies: { keywords: string[]; reply: string }[] = [
  { keywords: ['price', 'cost', 'how much', 'fee'], reply: 'Pricing is shown on the booking panel. Group discounts may be available — contact us for custom rates!' },
  { keywords: ['include', 'included', 'whats included', "what's included"], reply: 'Inclusions are listed in the "What\'s Included" section on this page.' },
  { keywords: ['exclude', 'excluded', 'not included'], reply: 'Exclusions are listed in the "What\'s Excluded" section on this page.' },
  { keywords: ['book', 'booking', 'reserve', 'reservation'], reply: 'Click "Book Now" on the right, fill in your date and guests, then proceed to payment!' },
  { keywords: ['cancel', 'cancellation', 'refund'], reply: 'Cancellations made 48 hours before are fully refundable. Within 48 hours, a 50% fee applies.' },
  { keywords: ['guide', 'guides', 'tour guide'], reply: 'All guides are certified, experienced locals fluent in English and Filipino.' },
  { keywords: ['duration', 'how long', 'time', 'hours'], reply: 'Duration is shown near the package title. Check the itinerary for a step-by-step breakdown.' },
  { keywords: ['group', 'private', 'solo'], reply: 'Both private group and join-in options available. Private groups can be customized.' },
  { keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'], reply: 'Hi there! 👋 How can I help with your Cebu adventure?' },
  { keywords: ['thank', 'thanks', 'salamat'], reply: "You're welcome! Feel free to ask anything else. 🌿" },
  { keywords: ['weather', 'season', 'rain', 'best time'], reply: 'Best time is December–May (dry season). Avoid July–October (typhoon season).' },
  { keywords: ['bring', 'wear', 'what to bring', 'prepare', 'pack'], reply: 'Bring sunscreen, comfortable clothes, sandals/aqua shoes, change of clothes, and a waterproof bag.' },
]

function getBotReply(input: string): string {
  const lower = input.toLowerCase()
  const match = botReplies.find(({ keywords }) => keywords.some((kw) => lower.includes(kw)))
  return match?.reply ?? "Great question! Contact us at hello@visitcebu.com or call +63 912 345 6789 for specific inquiries. 😊"
}

function TourPackageDetailInner() {
  const params = useParams()
  const slug = params.packageId as string
  const router = useRouter()
  const searchParams = useSearchParams()

  const [pkg, setPkg] = useState<FirestorePackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [date, setDate] = useState(() => searchParams.get('date') ?? '')
  const [travelers, setTravelers] = useState(() => {
    const t = searchParams.get('travelers')
    return t ? Math.max(1, parseInt(t, 10)) : 1
  })
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: "Hi! I'm your Visit Cebu assistant 🌿 Ask me anything about this tour package — pricing, what's included, how to book, and more!" }
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const chipsDrag = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(firebaseDb, 'tourPackages'), where('slug', '==', slug))
        const snap = await getDocs(q)
        if (snap.empty) { setNotFound(true); setLoading(false); return }
        const docSnap = snap.docs[0]
        const loaded = { id: docSnap.id, ...docSnap.data() } as FirestorePackage
        setPkg(loaded)
        // sync travelers to min if URL didn't specify
        if (!searchParams.get('travelers')) {
          setTravelers(Math.max(1, loaded.minimumNumberOfPeople ?? 1))
        }
      } catch (err) {
        console.error(err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const sendMessage = () => {
    const text = chatInput.trim()
    if (!text) return
    const updated = [...messages, { from: 'user' as const, text }, { from: 'bot' as const, text: getBotReply(text) }]
    setMessages(updated)
    setChatInput('')
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const minGuests = Math.max(1, pkg?.minimumNumberOfPeople ?? 1)
  const maxGuests = pkg?.maximumNumberOfPeople ? Math.max(pkg.maximumNumberOfPeople, minGuests) : 30

  const handleBook = () => {
    if (!pkg) return
    const qs = new URLSearchParams({
      activityId: pkg.id,
      activityName: pkg.packageName,
      date,
      guests: travelers.toString(),
      price: pkg.pricePerPerson.toString(),
      minGuests: minGuests.toString(),
      maxGuests: maxGuests.toString(),
      sourceType: 'tourPackage',
      packageOperatorId: pkg.operatorId ?? '',
    })
    router.push(`/booking/guest-info?${qs.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4]">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound || !pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0fdf4] gap-4">
        <p className="text-gray-700 font-semibold">Package not found.</p>
        <Link href="/tour-packages" className="text-green-600 text-sm hover:underline">Back to Tour Packages</Link>
      </div>
    )
  }

  const images = pkg.packageImages

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 py-8 pb-28 lg:pb-8">
        <nav className="text-sm text-gray-500 mb-5">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tour-packages" className="hover:text-green-600">Tour Packages</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">{pkg.packageName}</span>
        </nav>

        {/* Gallery */}
        <div className="mb-8">
          <BentoGallery images={images} alt={pkg.packageName} onImageClick={setLightboxIdx} />
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
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{pkg.packageName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
              <span className="text-green-600 font-semibold text-xs uppercase tracking-wide">{pkg.duration}</span>
              <span>•</span>
              <span>{pkg.packageLocation}</span>
              <span>•</span>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{pkg.packageTag}</span>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <StarRating rating={pkg.packageRating} />
              <span className="text-sm font-semibold text-gray-700">{pkg.packageRating.toFixed(1)}</span>
            </div>

            <section className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-3">About this package</h2>
              <p className="text-gray-500 leading-relaxed text-sm whitespace-pre-wrap">{pkg.packageDescription}</p>
            </section>

            {/* Itinerary */}
            {pkg.packageItinerary.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-bold text-gray-900 mb-4">Itinerary</h2>
                <ul className="space-y-0">
                  {pkg.packageItinerary.map((step, i) => (
                    <li key={i} className="flex gap-4 relative">
                      {i < pkg.packageItinerary.length - 1 && (
                        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-gray-200" />
                      )}
                      <div className="w-4 h-4 rounded-full bg-green-500 shrink-0 mt-1 z-10" />
                      <div className="pb-6 flex-1">
                        {step.itineraryTime && (
                          <p className="text-xs font-bold text-green-500 mb-0.5">{step.itineraryTime}</p>
                        )}
                        <p className="text-sm font-bold text-gray-900 mb-0.5">{step.itineraryTitle}</p>
                        {step.itineraryDescription && (
                          <p className="text-sm text-gray-500">{step.itineraryDescription}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Inclusions / Exclusions */}
            {(pkg.inclusions.length > 0 || pkg.exclusions.length > 0) && (
              <section className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {pkg.inclusions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        What&apos;s Included
                      </h3>
                      <ul className="space-y-2.5">
                        {pkg.inclusions.map((item, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pkg.exclusions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                        What&apos;s Excluded
                      </h3>
                      <ul className="space-y-2.5">
                        {pkg.exclusions.map((item, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Reviews (static placeholder) */}
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
                <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                <span className="text-3xl font-extrabold text-gray-900">₱{pkg.pricePerPerson.toLocaleString()}</span>
                <span className="text-gray-400 text-sm ml-1">/ person</span>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input type="date" id="tour-date-desktop" name="tourDate" autoComplete="off" aria-label="Tour date"
                    value={date} onChange={(e) => setDate(e.target.value)}
                    className="outline-none text-sm text-gray-700 flex-1 bg-transparent [color-scheme:light]"
                    style={{ colorScheme: 'light' }} />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Travelers</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50 justify-between">
                  <button onClick={() => setTravelers((t) => Math.max(minGuests, t - 1))}
                    disabled={travelers <= minGuests}
                    className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                  <span className="text-sm font-semibold text-gray-800">{travelers} {travelers === 1 ? 'guest' : 'guests'}</span>
                  <button onClick={() => setTravelers((t) => Math.min(maxGuests, t + 1))}
                    disabled={travelers >= maxGuests}
                    className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Min {minGuests} · Max {maxGuests} guests</p>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>₱{pkg.pricePerPerson.toLocaleString()} × {travelers}</span>
                  <span>₱{(pkg.pricePerPerson * travelers).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>₱{(pkg.pricePerPerson * travelers).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleBook}
                className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-md flex items-center justify-center gap-2"
              >
                Reserve This Adventure
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
          <p className="text-xs text-gray-400 leading-none mb-0.5">Starting from</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-gray-900">₱{pkg.pricePerPerson.toLocaleString()}</span>
            <span className="text-xs text-gray-400">/ person</span>
          </div>
        </div>
        <button
          onClick={() => setBookingDrawerOpen(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold px-5 py-3 rounded-full text-sm transition-all shadow-md shrink-0"
        >
          Book This Trip
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>

      {/* Mobile booking drawer */}
      <Drawer open={bookingDrawerOpen} onOpenChange={setBookingDrawerOpen}>
        <DrawerContent className="pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-lg">You&apos;re One Step Away 🌴</DrawerTitle>
            <DrawerDescription className="text-gray-500 text-sm truncate">{pkg.packageName}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-extrabold text-gray-900">₱{pkg.pricePerPerson.toLocaleString()}</span>
              <span className="text-sm text-gray-400">/ person</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input type="date" id="tour-date-mobile" name="tourDateMobile" autoComplete="off" aria-label="Tour date"
                  value={date} onChange={(e) => setDate(e.target.value)}
                  className="outline-none text-sm text-gray-700 flex-1 bg-transparent [color-scheme:light]"
                  style={{ colorScheme: 'light' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Travelers</label>
              <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50 justify-between">
                <button onClick={() => setTravelers((t) => Math.max(minGuests, t - 1))}
                  disabled={travelers <= minGuests}
                  className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                <span className="text-sm font-semibold text-gray-800">{travelers} {travelers === 1 ? 'guest' : 'guests'}</span>
                <button onClick={() => setTravelers((t) => Math.min(maxGuests, t + 1))}
                  disabled={travelers >= maxGuests}
                  className="w-7 h-7 rounded-full border border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 flex items-center justify-center transition-colors text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">+</button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Min {minGuests} · Max {maxGuests} guests</p>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>₱{pkg.pricePerPerson.toLocaleString()} × {travelers}</span>
                <span>₱{(pkg.pricePerPerson * travelers).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span>
                <span>₱{(pkg.pricePerPerson * travelers).toLocaleString()}</span>
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

      {/* Chatbot — temporarily disabled 2026-04-27, conflicts with mobile booking bar. Re-enable when layout is resolved.
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            style={{ width: 'min(320px, calc(100vw - 48px))', height: 420 }}>
            <div className="bg-green-500 px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Visit Cebu Assistant</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  <p className="text-white/70 text-xs">Online</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-end gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.from === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.from === 'user'
                      ? 'bg-green-500 text-white rounded-br-none'
                      : 'bg-white text-gray-700 shadow-sm rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div
              ref={chipsRef}
              className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide border-t border-gray-100 bg-white shrink-0 flex-nowrap cursor-grab active:cursor-grabbing select-none"
              onMouseDown={(e) => {
                chipsDrag.current.isDown = true
                chipsDrag.current.startX = e.pageX - (chipsRef.current?.offsetLeft ?? 0)
                chipsDrag.current.scrollLeft = chipsRef.current?.scrollLeft ?? 0
              }}
              onMouseLeave={() => { chipsDrag.current.isDown = false }}
              onMouseUp={() => { chipsDrag.current.isDown = false }}
              onMouseMove={(e) => {
                if (!chipsDrag.current.isDown || !chipsRef.current) return
                e.preventDefault()
                const x = e.pageX - (chipsRef.current.offsetLeft ?? 0)
                const walk = x - chipsDrag.current.startX
                chipsRef.current.scrollLeft = chipsDrag.current.scrollLeft - walk
              }}
            >
              {["Included?", "How to book?", "Cancel policy?", "What to bring?"].map((q) => (
                <button key={q} onClick={() => setChatInput(q)}
                  className="whitespace-nowrap text-xs border border-green-200 text-green-600 px-2.5 py-1 rounded-full hover:bg-green-50 transition-colors shrink-0">
                  {q}
                </button>
              ))}
            </div>

            <div className="px-3 py-3 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0">
              <input
                type="text"
                id="chat-input"
                name="chatInput"
                autoComplete="off"
                aria-label="Ask about this package"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about this package..."
                className="flex-1 text-xs outline-none text-gray-700 placeholder-gray-400 bg-gray-50 rounded-full px-3 py-2"
              />
              <button onClick={sendMessage}
                className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setChatOpen((o) => !o)}
          className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95"
        >
          {chatOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>
      </div>
      */}
    </div>
  )
}

export default function TourPackageDetail() {
  return (
    <Suspense>
      <TourPackageDetailInner />
    </Suspense>
  )
}
