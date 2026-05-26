'use client'

import type { Activity } from '../types'
import PackageCard from './ui/PackageCard'

interface Props {
  activity: Activity
  date?: string
  travelers?: string
  dotSealGranted?: boolean
}

export default function ActivityCard({ activity, date, travelers, dotSealGranted }: Props) {
  const qs = new URLSearchParams()
  if (date) qs.set('date', date)
  if (travelers) qs.set('travelers', travelers)
  const query = qs.toString()
  const href = activity.firestoreId
    ? `/activities/${activity.firestoreId}${query ? `?${query}` : ''}`
    : undefined

  return (
    <PackageCard
      image={activity.image}
      images={activity.images}
      title={activity.title}
      price={activity.price}
      pricePrefix="From"
      tags={activity.categories && activity.categories.length > 0 ? activity.categories : (activity.category ? [activity.category] : [])}
      location={activity.location}
      rating={activity.rating}
      duration={activity.duration || undefined}
      cardKind="activity"
      dotSealGranted={dotSealGranted}
      href={href}
    />
  )
}
