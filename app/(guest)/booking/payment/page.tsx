'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { useBooking } from '@/app/context/BookingContext'

export default function PaymentPage() {
  const router = useRouter()
  const { booking, generateBookingId, basePrice, subtotal, serviceCharge, total } = useBooking()
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const paymentMethod = booking.paymentMethod || 'GCash'

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    setFiles((f) => [...f, ...dropped])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    setFiles((f) => [...f, ...selected])
  }

  const handleConfirm = () => {
    generateBookingId()
    router.push('/booking/confirmation')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0fdf4] pb-24">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/locations" className="hover:text-green-600">Cebu Locations</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">Alegria</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
            <p className="text-sm text-gray-500 mb-5">Upload your payment screenshot so the operator can manually verify it.</p>

            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-800">
              Your booking will be created as reserved and your payment will be marked pending until an operator manually verifies it.
            </div>

            <div className="relative border border-gray-300 rounded-xl px-4 pt-5 pb-4 mb-8">
              <span className="absolute -top-2.5 left-4 bg-white px-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Payment Method
              </span>
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-900">{paymentMethod}</span>
                <button className="text-sm text-gray-700 border border-gray-300 rounded-full px-4 py-1.5 hover:border-gray-400 transition-colors font-medium">
                  Change
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Payment Instruction</h3>
              <ol className="space-y-1.5 text-sm text-gray-600 list-decimal list-inside">
                <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed</li>
                <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed</li>
                <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed</li>
                <li>Scan the QR code below</li>
                <li>Upload a screenshot</li>
              </ol>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Scan QR Code to pay</h3>
              <div className="border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                    <circle cx="24" cy="24" r="24" fill="#007DFE"/>
                    <text x="24" y="30" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">G</text>
                  </svg>
                  <span className="text-xl font-bold text-blue-600">GCash</span>
                </div>
                <div className="w-44 h-44 border border-gray-200 rounded-xl overflow-hidden bg-white flex items-center justify-center p-2">
                  <QRCode
                    value="https://gcash.com/pay/suroyCebu"
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#111111"
                    level="M"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Payment Screenshot</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors min-h-[140px] ${
                    dragging ? 'border-green-400 bg-green-50' : 'border-green-400 hover:bg-green-50'
                  }`}
                >
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <button type="button" className="bg-green-500 text-white text-sm font-semibold px-5 py-1.5 rounded-full hover:bg-green-600 transition-colors">
                    Browse
                  </button>
                  <p className="text-xs text-gray-400">Drop a file here</p>
                  <input ref={fileInputRef} type="file" id="payment-screenshot" name="paymentScreenshot" aria-label="Upload payment screenshot" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="flex-1 flex flex-col gap-2 min-h-[140px]">
                  {files.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center border border-gray-100 rounded-xl bg-gray-50">
                      <p className="text-xs text-gray-400">No files uploaded yet</p>
                    </div>
                  ) : (
                    files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700 truncate max-w-[140px]">{f.name}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFiles((fl) => fl.filter((_, fi) => fi !== i)) }}
                          className="w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Image files only, maximum 5MB</p>
            </div>
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 text-center mb-5 text-base">Booking Summary</h3>
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Schedule</p>
                <p className="text-sm font-semibold text-gray-900">January 6, 2026&nbsp;&nbsp;8:00 AM - 12:00 PM</p>
              </div>
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Guests</p>
                <p className="text-sm font-semibold text-gray-900">{booking.guestCount || 5} Guests</p>
              </div>
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Promo Code</p>
                <p className="text-sm font-semibold text-gray-900">{booking.promoCode || 'None'}</p>
              </div>
              <div className="mb-4 pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Payment Method</p>
                <p className="text-sm font-semibold text-gray-900">{paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-3">Price Details</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₱{basePrice.toLocaleString()} x {booking.guestCount || 5}</span>
                    <span className="font-medium">₱ {subtotal.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Service charge</span>
                    <span className="font-medium">₱ {serviceCharge.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Mata</span>
                    <span className="font-medium">₱ 500.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>LGU</span>
                    <span className="font-medium">₱ 500.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-base">₱{(total + 1000).toLocaleString()}.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 z-40">
        <div className="max-w-4xl mx-auto px-10 flex items-center justify-between">
          <button
            onClick={() => router.push('/booking/guest-info')}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleConfirm}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-10 py-3 rounded-full text-sm transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
