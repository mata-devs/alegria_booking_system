'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/app/context/BookingContext'
import { tourOperators } from '@/app/data/mockData'
import type { Representative, Guest } from '@/app/types'

const nationalities = ['Filipino', 'American', 'British', 'Australian', 'Japanese', 'Korean', 'Chinese', 'German', 'French', 'Other']
const genders = ['Male', 'Female', 'Prefer not to say']

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 bg-white'
const selectCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-400 bg-white appearance-none'

export default function GuestInfoForm() {
  const router = useRouter()
  const { booking, updateBooking, basePrice, subtotal, serviceCharge, total } = useBooking()

  const [rep, setRep] = useState<Representative>({ name: '', age: '', email: '', gender: '', phone: '', nationality: '' })
  const [guests, setGuests] = useState<Guest[]>([
    { name: '', age: '', nationality: '', gender: '' },
    { name: '', age: '', nationality: '', gender: '' },
  ])
  const [tourOperator, setTourOperator] = useState('')
  const [operatorOpen, setOperatorOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')

  const updateRep = (field: keyof Representative, val: string) =>
    setRep((r) => ({ ...r, [field]: val }))

  const updateGuest = (i: number, field: keyof Guest, val: string) =>
    setGuests((g) => g.map((guest, idx) => (idx === i ? { ...guest, [field]: val } : guest)))

  const addGuest = () => setGuests((g) => [...g, { name: '', age: '', nationality: '', gender: '' }])

  const handleNext = () => {
    updateBooking({ representative: rep, guests, tourOperator, promoCode, paymentMethod })
    router.push('/booking/payment')
  }

  const paymentMethods = [
    {
      id: 'Cash', label: 'Cash',
      icon: (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      )
    },
    {
      id: 'GCash', label: 'GCash',
      icon: (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-bold text-xs">G</span>
        </div>
      )
    },
    {
      id: 'Card', label: 'Credit/Debit card',
      icon: (
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      )
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4]">
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 py-8 pb-28">
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <Link href="/locations" className="hover:text-green-600">Cebu Locations</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-800 font-medium">Alegria</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-y-auto px-5 sm:px-8 py-8">
              <h1 className="text-xl font-bold text-gray-900 text-center mb-8">Guests Information Form</h1>

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-800 mb-4">Representative Information</h2>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label htmlFor="rep-name" className="block text-xs text-gray-500 mb-1">Name</label>
                    <input id="rep-name" name="repName" autoComplete="name" className={inputCls} value={rep.name} onChange={(e) => updateRep('name', e.target.value)} />
                  </div>
                  <div className="w-24">
                    <label htmlFor="rep-age" className="block text-xs text-gray-500 mb-1">Age</label>
                    <input id="rep-age" name="repAge" autoComplete="off" className={inputCls} type="number" value={rep.age} onChange={(e) => updateRep('age', e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label htmlFor="rep-email" className="block text-xs text-gray-500 mb-1">Email</label>
                    <input id="rep-email" name="repEmail" autoComplete="email" className={inputCls} type="email" value={rep.email} onChange={(e) => updateRep('email', e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="rep-gender" className="block text-xs text-gray-500 mb-1">Gender</label>
                    <div className="relative">
                      <select id="rep-gender" name="repGender" className={selectCls} value={rep.gender} onChange={(e) => updateRep('gender', e.target.value)}>
                        <option value=""></option>
                        {genders.map((g) => <option key={g}>{g}</option>)}
                      </select>
                      <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="rep-phone" className="block text-xs text-gray-500 mb-1">Phone Number</label>
                  <input id="rep-phone" name="repPhone" autoComplete="tel" className={inputCls} value={rep.phone} onChange={(e) => updateRep('phone', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="rep-nationality" className="block text-xs text-gray-500 mb-1">Nationality</label>
                  <div className="relative max-w-xs">
                    <select id="rep-nationality" name="repNationality" className={selectCls} value={rep.nationality} onChange={(e) => updateRep('nationality', e.target.value)}>
                      <option value=""></option>
                      {nationalities.map((n) => <option key={n}>{n}</option>)}
                    </select>
                    <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-sm font-bold text-gray-800 mb-4">Guests Information</h2>
                {guests.map((guest, i) => (
                  <div key={i} className="mb-5">
                    <div className="flex gap-4 mb-3">
                      <div className="flex-1">
                        <label htmlFor={`guest-name-${i}`} className="block text-xs text-gray-500 mb-1">Name</label>
                        <input id={`guest-name-${i}`} name={`guestName${i}`} autoComplete="off" className={inputCls} value={guest.name} onChange={(e) => updateGuest(i, 'name', e.target.value)} />
                      </div>
                      <div className="w-24">
                        <label htmlFor={`guest-age-${i}`} className="block text-xs text-gray-500 mb-1">Age</label>
                        <input id={`guest-age-${i}`} name={`guestAge${i}`} autoComplete="off" className={inputCls} type="number" value={guest.age} onChange={(e) => updateGuest(i, 'age', e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <label htmlFor={`guest-nationality-${i}`} className="block text-xs text-gray-500 mb-1">Nationality</label>
                        <select id={`guest-nationality-${i}`} name={`guestNationality${i}`} className={selectCls} value={guest.nationality} onChange={(e) => updateGuest(i, 'nationality', e.target.value)}>
                          <option value=""></option>
                          {nationalities.map((n) => <option key={n}>{n}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-400 absolute right-3 bottom-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      <div className="flex-1 relative">
                        <label htmlFor={`guest-gender-${i}`} className="block text-xs text-gray-500 mb-1">Gender</label>
                        <select id={`guest-gender-${i}`} name={`guestGender${i}`} className={selectCls} value={guest.gender} onChange={(e) => updateGuest(i, 'gender', e.target.value)}>
                          <option value=""></option>
                          {genders.map((g) => <option key={g}>{g}</option>)}
                        </select>
                        <svg className="w-4 h-4 text-gray-400 absolute right-3 bottom-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addGuest} className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 mt-1 transition-colors">
                  <span className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 text-base leading-none hover:border-green-400 hover:text-green-500">+</span>
                  Add more guest
                </button>
              </section>

              <section>
                <h2 className="text-sm font-bold text-gray-800 mb-1">Tour operator <span className="font-normal text-gray-400">(optional)</span></h2>
                <p className="text-xs text-gray-400 mb-3">If you know any tour operators, you can select them. Otherwise leave this unselected.</p>
                <div className="relative max-w-sm">
                  <button onClick={() => setOperatorOpen(!operatorOpen)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-left flex items-center justify-between bg-white">
                    <span className={tourOperator ? 'text-gray-900' : 'text-gray-400'}>{tourOperator || 'Select tour operator'}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={operatorOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                    </svg>
                  </button>
                  {operatorOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                      {tourOperators.map((op) => (
                        <button key={op} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => { setTourOperator(op); setOperatorOpen(false) }}>
                          {op}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                <div className="flex divide-x divide-gray-200">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3">
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Jan 6</p>
                      <p className="text-xs text-gray-400">Date</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-3 px-4 py-3">
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-gray-900">8 AM</p>
                      <p className="text-xs text-gray-400">Time</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 flex items-center gap-3 px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{booking.guestCount ?? 5} Guests</p>
                    <p className="text-xs text-gray-400">Guests</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">Promo Code</p>
                <p className="text-xs text-gray-400 mb-2">Enter your promo code here (optional)</p>
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                  <input type="text" id="promo-code" name="promoCode" aria-label="Promo code" autoComplete="off" value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm outline-none bg-white" />
                  <button className="px-4 py-2.5 text-sm font-semibold text-green-500 hover:text-green-600 bg-white border-l border-gray-300 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₱{basePrice.toLocaleString()} x {booking.guestCount ?? 5}</span>
                  <span className="font-medium">₱ {subtotal.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Service charge</span>
                  <span className="font-medium">₱ {serviceCharge.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>₱{total.toLocaleString()}.00</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">Select Payment Method</p>
                <div className="space-y-2">
                  {paymentMethods.map((pm) => (
                    <label key={pm.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === pm.id ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      {pm.icon}
                      <span className="text-sm text-gray-700 flex-1">{pm.label}</span>
                      <input type="radio" id={`payment-${pm.id}`} name="payment" value={pm.id} checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                        className="accent-green-500 w-4 h-4" />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 z-30">
        <div className="max-w-4xl mx-auto px-10 flex items-center justify-between">
          <button onClick={() => router.back()}
            className="px-8 py-3 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors">
            Go Back
          </button>
          <button onClick={handleNext}
            className="px-10 py-3 bg-green-500 text-white rounded-full text-sm font-semibold hover:bg-green-600 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
