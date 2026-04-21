'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useBooking } from '../context/BookingContext'
import type { TourPackage } from '../types'

interface Props {
  pkg: TourPackage
  wide?: boolean
}

export default function TourPackageCard({ pkg, wide = false }: Props) {
  const router = useRouter()
  const { updateBooking } = useBooking()

  const handleClick = () => {
    updateBooking({ item: pkg })
    router.push(`/tour-packages/${pkg.id}`)
  }

  const overlay =
    pkg.theme === 'orange'
      ? 'bg-gradient-to-r from-orange-800/80 to-orange-600/60'
      : 'bg-gradient-to-r from-green-900/80 to-green-700/60'

  const overlayFull =
    pkg.theme === 'orange'
      ? 'bg-gradient-to-b from-orange-900/20 via-orange-900/40 to-orange-900/90'
      : 'bg-gradient-to-b from-green-900/20 via-green-900/40 to-green-900/90'

  if (wide) {
    return (
      <div className="relative rounded-2xl overflow-hidden cursor-pointer group h-52" onClick={handleClick}>
        <Image src={pkg.image} alt={pkg.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className={`absolute inset-0 ${overlay}`} />
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h3 className="text-white font-bold text-xl leading-tight mb-1">{pkg.title}</h3>
          <p className="text-white/80 text-sm mb-3 line-clamp-2">{pkg.description}</p>
          <span className="bg-green-400 text-white text-sm font-bold px-3 py-1 rounded-full self-start">
            Starting from ₱{pkg.price.toLocaleString()}.00
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden cursor-pointer group h-72" onClick={handleClick}>
      <Image src={pkg.image} alt={pkg.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className={`absolute inset-0 ${overlayFull}`} />
      <div className="absolute top-4 left-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${pkg.theme === 'orange' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
          {pkg.duration}
        </span>
      </div>
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <h3 className="text-white font-bold text-xl leading-tight mb-1 drop-shadow">{pkg.title}</h3>
        <p className="text-white/80 text-xs mb-3 line-clamp-2">{pkg.description}</p>
        <span className={`text-white text-xs font-bold px-3 py-1.5 rounded-full self-start ${pkg.theme === 'orange' ? 'bg-orange-500' : 'bg-green-500'}`}>
          Starting from ₱{pkg.price.toLocaleString()}.00
        </span>
      </div>
    </div>
  )
}
