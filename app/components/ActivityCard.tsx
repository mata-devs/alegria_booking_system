'use client'

import { useRouter } from 'next/navigation'
import type { Activity } from '../types'
import PackageCard from './ui/PackageCard'

interface Props {
  activity: Activity
  date?: string
  travelers?: string
  dotSealGranted?: boolean
}

export default function ActivityCard({ activity, date, travelers, dotSealGranted }: Props) {
  const router = useRouter()

  const handleClick = () => {
    if (activity.firestoreId) {
      const qs = new URLSearchParams()
      if (date) qs.set('date', date)
      if (travelers) qs.set('travelers', travelers)
      const query = qs.toString()
      router.push(`/activities/${activity.firestoreId}${query ? `?${query}` : ''}`)
    }
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
      cardKind="activity"
      dotSealGranted={dotSealGranted}
      onClick={handleClick}
    />
  )
}
