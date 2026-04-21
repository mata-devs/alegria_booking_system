'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useBooking } from '../context/BookingContext'
import type { Activity } from '../types'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

interface Props {
  activity: Activity
}

export default function ActivityCard({ activity }: Props) {
  const router = useRouter()
  const { updateBooking } = useBooking()

  const handleBook = () => {
    updateBooking({ item: activity })
    router.push('/booking/guest-info')
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={handleBook}>
      <div className="relative overflow-hidden h-44">
        <Image
          src={activity.image}
          alt={activity.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {activity.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5">{activity.title}</h3>
        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
          <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>{activity.location}</span>
        </div>
        <StarRating rating={activity.rating} />
        <div className="mt-2 text-green-600 font-bold text-sm">
          From ₱{activity.price.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
