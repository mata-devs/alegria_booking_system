'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import Footer from '@/app/components/Footer'
import { tourPackages, travelerReviews } from '@/app/data/mockData'
import { useBooking } from '@/app/context/BookingContext'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import QRCode from 'react-qr-code'

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
  { keywords: ['price', 'cost', 'how much', 'fee'], reply: 'The price starts from ₱4,500 per person. Group discounts are available for 10+ guests. Contact us for custom pricing!' },
  { keywords: ['include', 'included', 'whats included', "what's included"], reply: 'The package includes transportation, a professional tour guide, entrance fees, safety gear, packed lunch, and bottled water.' },
  { keywords: ['exclude', 'excluded', 'not included'], reply: 'Personal expenses, optional activities, travel insurance, and tips/gratuities are not included.' },
  { keywords: ['book', 'booking', 'reserve', 'reservation'], reply: 'You can book by clicking the "Book Now" button on the right side. Fill in your date, number of guests, and proceed to payment!' },
  { keywords: ['cancel', 'cancellation', 'refund'], reply: 'Cancellations made 48 hours before the tour date are fully refundable. Within 48 hours, a 50% cancellation fee applies.' },
  { keywords: ['guide', 'guides', 'tour guide'], reply: 'All our guides are certified, experienced locals who know Cebu inside out. They speak English and Filipino.' },
  { keywords: ['duration', 'how long', 'time', 'hours'], reply: `This package runs for ${tourPackages[0].duration}. Pick-up is usually early morning and drop-off is in the evening.` },
  { keywords: ['group', 'private', 'solo'], reply: 'We offer both private group and join-in tour options. Private groups can be customized to your preferences.' },
  { keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'], reply: 'Hi there! 👋 How can I help you with your Cebu adventure? Ask me anything about this tour package!' },
  { keywords: ['thank', 'thanks', 'salamat'], reply: "You're welcome! Feel free to ask if you have more questions. We'd love to have you on this adventure! 🌿" },
  { keywords: ['weather', 'season', 'rain', 'best time'], reply: 'The best time to visit Cebu is from December to May (dry season). Avoid July–October which is typhoon season.' },
  { keywords: ['bring', 'wear', 'what to bring', 'prepare', 'pack'], reply: 'Bring sunscreen, comfortable clothes, sandals/aqua shoes, a change of clothes, and a waterproof bag. We provide the rest!' },
]

function getBotReply(input: string): string {
  const lower = input.toLowerCase()
  const match = botReplies.find(({ keywords }) => keywords.some((kw) => lower.includes(kw)))
  return match?.reply ?? "That's a great question! For specific inquiries, please contact us at hello@suroyCebu.com or call +63 912 345 6789. We're happy to help! 😊"
}

const tourGuides = [
  { name: 'Juan Miguel Santos', avatar: 'https://picsum.photos/seed/guide1/80/80', credentials: ['Credentials 1', 'Credentials 2', 'Credentials 3', 'Credentials 4', 'Credentials 5'] },
  { name: 'Juan Miguel Santos', avatar: 'https://picsum.photos/seed/guide2/80/80', credentials: ['Credentials 1', 'Credentials 2', 'Credentials 3', 'Credentials 4', 'Credentials 5'] },
  { name: 'Juan Miguel Santos', avatar: 'https://picsum.photos/seed/guide3/80/80', credentials: ['Credentials 1', 'Credentials 2', 'Credentials 3', 'Credentials 4', 'Credentials 5'] },
  { name: 'Juan Miguel Santos', avatar: 'https://picsum.photos/seed/guide4/80/80', credentials: ['Credentials 1', 'Credentials 2', 'Credentials 3', 'Credentials 4', 'Credentials 5'] },
  { name: 'Juan Miguel Santos', avatar: 'https://picsum.photos/seed/guide5/80/80', credentials: ['Credentials 1', 'Credentials 2', 'Credentials 3', 'Credentials 4', 'Credentials 5'] },
  { name: 'Juan Miguel Santos', avatar: 'https://picsum.photos/seed/guide6/80/80', credentials: ['Credentials 1', 'Credentials 2', 'Credentials 3', 'Credentials 4', 'Credentials 5'] },
]

const itinerary = [
  { time: '06:00 AM', title: 'Cebu City Pickup', desc: 'Direct pickup from your hotel or accommodation in Cebu City or Mactan.' },
  { time: '06:30 AM', title: 'Safety Briefing & Gearing Up', desc: 'Your guide will walk you through safety protocols and fit you with the proper gear.' },
  { time: '09:00 AM', title: 'Canyoneering Begins', desc: 'Start your canyoneering adventure through the stunning gorges and cliffs of Alegria.' },
  { time: '12:00 PM', title: 'Kawasan Falls & Lunch', desc: 'Arrive at the breathtaking Kawasan Falls. Enjoy a refreshing swim and a packed lunch by the falls.' },
  { time: '02:00 PM', title: 'Whale Shark Watching', desc: 'Head to Oslob for a once-in-a-lifetime whale shark swimming experience in the open sea.' },
  { time: '05:00 PM', title: 'Return to Cebu City', desc: 'Board the van for a comfortable ride back to your hotel. Estimated arrival by 7:00 PM.' },
]

const included = ['Transportation (A/C van)', 'Professional tour guide', 'Entrance fees', 'Life vest & safety gear', 'Packed lunch', 'Bottled water']
const excluded = ['Personal expenses', 'Optional activities', 'Travel insurance', 'Tips & gratuities']

export default function TourPackageDetail() {
  const params = useParams()
  const packageId = params.packageId as string
  const router = useRouter()
  const { updateBooking } = useBooking()

  const pkg = tourPackages.find((p) => String(p.id) === packageId) ?? tourPackages[0]

  const [date, setDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([
    { from: 'bot', text: "Hi! I'm your SuroyCebu assistant 🌿 Ask me anything about this tour package — pricing, what's included, how to book, and more!" }
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const chipsDrag = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const sendMessage = () => {
    const text = chatInput.trim()
    if (!text) return
    const updated = [...messages, { from: 'user' as const, text }, { from: 'bot' as const, text: getBotReply(text) }]
    setMessages(updated)
    setChatInput('')
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const galleryImages = [
    pkg.image,
    `https://picsum.photos/seed/${pkg.id}-g2/600/400`,
    `https://picsum.photos/seed/${pkg.id}-g3/600/400`,
    `https://picsum.photos/seed/${pkg.id}-g4/600/400`,
  ]

  const handleBook = () => {
    updateBooking({ item: pkg, date, guestCount: travelers })
    router.push('/booking/guest-info')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-500 mb-5">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/locations" className="hover:text-green-600">Cebu Locations</Link>
          <span className="mx-2">›</span>
          <Link href="/tour-packages" className="hover:text-green-600">Tour Packages</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">{pkg.title}</span>
        </nav>

        <div className="mb-8 rounded-2xl overflow-hidden">
          <div className="relative h-72 md:h-96 w-full">
            <Image src={galleryImages[0]} alt={pkg.title} fill className="object-cover" priority />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {galleryImages.slice(1).map((img, i) => (
              <div key={i} className="relative h-32 rounded-xl overflow-hidden">
                <Image src={img} alt={`${pkg.title} ${i + 2}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{pkg.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
              <span className="text-green-600 font-semibold text-xs uppercase tracking-wide">{pkg.duration}</span>
              <span>•</span>
              <span>Private Group</span>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <StarRating rating={4.5} />
              <span className="text-sm font-semibold text-gray-700">4.5</span>
              <span className="text-sm text-gray-400">(128 reviews)</span>
            </div>

            <section className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-3">About this package</h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                {pkg.description} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="relative rounded-xl overflow-hidden h-52">
                <Image src={`https://picsum.photos/seed/${pkg.id}-promo1/500/400`} alt="Promo" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-green-800/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-extrabold text-lg uppercase leading-tight drop-shadow">{pkg.title}</p>
                  <p className="text-green-300 text-xs font-semibold mt-1">Experience of a Lifetime</p>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden h-52">
                <Image src={`https://picsum.photos/seed/${pkg.id}-promo2/500/400`} alt="Promo" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-green-800/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-extrabold text-lg uppercase leading-tight drop-shadow">{pkg.title}</p>
                  <p className="text-green-300 text-xs font-semibold mt-1">Cebu, Philippines</p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-4">Itinerary</h2>
              <ul className="space-y-0">
                {itinerary.map((item, i) => (
                  <li key={i} className="flex gap-4 relative">
                    {i < itinerary.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-gray-200" />
                    )}
                    <div className="w-4 h-4 rounded-full bg-green-500 shrink-0 mt-1 z-10" />
                    <div className="pb-6 flex-1">
                      <p className="text-xs font-bold text-green-500 mb-0.5">{item.time}</p>
                      <p className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    What&apos;s Included
                  </h3>
                  <ul className="space-y-2.5">
                    {included.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                    What&apos;s Excluded
                  </h3>
                  <ul className="space-y-2.5">
                    {excluded.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-5">Tour Guides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>
                {tourGuides.map((guide, i) => (
                  <div key={i} className="flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Image src={guide.avatar} alt={guide.name} width={56} height={56} className="rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 mb-1">{guide.name}</p>
                      <p className="text-xs text-green-600 font-semibold mb-2">Credentials:</p>
                      <ul className="space-y-1">
                        {guide.credentials.map((c, j) => (
                          <li key={j} className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Reviews <span className="text-gray-400 font-normal text-sm">(128 reviews)</span>
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
              <div className="flex items-center justify-center gap-2 mt-6">
                <button className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:border-green-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {[1,2,3,4,5].map((n) => (
                  <button key={n} className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${n === 1 ? 'bg-green-500 text-white' : 'border border-gray-300 text-gray-500 hover:border-green-400'}`}>{n}</button>
                ))}
                <button className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:border-green-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </section>
          </div>

          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <div className="mb-5">
                <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
                <span className="text-3xl font-extrabold text-gray-900">₱{pkg.price.toLocaleString()}</span>
                <span className="text-gray-400 text-sm ml-1">/ person</span>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 gap-3 bg-gray-50">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <input type="date" id="tour-date" name="tourDate" autoComplete="off" aria-label="Tour date" value={date} onChange={(e) => setDate(e.target.value)}
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
                  <span>₱{pkg.price.toLocaleString()} × {travelers}</span>
                  <span>₱{(pkg.price * travelers).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>₱{(pkg.price * travelers).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleBook}
                className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3.5 rounded-full transition-all text-sm shadow-md"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

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
                <p className="text-white font-semibold text-sm">SuroyCebu Assistant</p>
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
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
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
              {['Included?', 'How to book?', 'Cancel policy?', 'What to bring?'].map((q) => (
                <button key={q}
                  onClick={() => { setChatInput(q) }}
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
    </div>
  )
}
