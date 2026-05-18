'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LocationOfferCounts } from '@/app/components/LocationOfferCounts'
import type { Location } from '../types'

interface Props {
  location: Location
  className?: string
}

export default function LocationCard({ location, className = '' }: Props) {
  const router = useRouter()

  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer group h-72 w-full ${className}`}
      onClick={() => router.push(`/locations/${location.id}`)}
    >
      <Image
        src={location.image}
        alt={location.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-sm">{location.name}</h3>
        <LocationOfferCounts
          activityCount={location.activityCount}
          packageCount={location.packageCount}
          className="mt-0.5"
        />
      </div>
    </div>
  )
}