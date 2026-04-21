'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Location } from '../types'

interface Props {
  location: Location
}

export default function LocationCard({ location }: Props) {
  const router = useRouter()

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group h-72 w-full"
      onClick={() => router.push(`/locations/${location.id}`)}
    >
      <Image
        src={location.image}
        alt={location.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-sm">{location.name}</h3>
        <p className="text-white/80 text-xs">{location.activityCount} Activities</p>
      </div>
    </div>
  )
}