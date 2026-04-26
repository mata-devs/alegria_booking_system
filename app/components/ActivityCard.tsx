'use client'

import { useRouter } from 'next/navigation'
import { useBooking } from '../context/BookingContext'
import type { Activity } from '../types'
import PackageCard from './ui/PackageCard'

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
    <PackageCard
      image={activity.image}
      title={activity.title}
      price={activity.price}
      pricePrefix="From"
      tag={activity.category}
      location={activity.location}
      rating={activity.rating}
      onClick={handleBook}
      ctaLabel="Reserve now"
      onCta={handleBook}
    />
  )
}
