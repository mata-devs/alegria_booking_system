'use client'

import { useRouter } from 'next/navigation'
import { useBooking } from '../context/BookingContext'
import type { TourPackage } from '../types'
import PackageCard from './ui/PackageCard'

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

  return (
    <PackageCard
      image={pkg.image}
      title={pkg.title}
      description={pkg.description}
      price={pkg.price}
      pricePrefix="Starting from"
      duration={pkg.duration}
      onClick={handleClick}
      ctaLabel="Book now"
      onCta={handleClick}
      wide={wide}
    />
  )
}
