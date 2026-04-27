'use client'

import { useRouter } from 'next/navigation'
import type { Activity } from '../types'
import PackageCard from './ui/PackageCard'

interface Props {
  activity: Activity
}

export default function ActivityCard({ activity }: Props) {
  const router = useRouter()

  const handleClick = () => {
    if (activity.firestoreId) {
      router.push(`/activities/${activity.firestoreId}`)
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
      onClick={handleClick}
    />
  )
}
