'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '../context/BookingContext'
import type { TourPackage } from '../types'
import PackageCard from './ui/PackageCard'
import { formatLocationSummary } from '@/app/lib/package-locations'

interface Props {
  pkg: TourPackage
  wide?: boolean
  dotSealGranted?: boolean
}

export default function TourPackageCard({ pkg, wide = false, dotSealGranted }: Props) {
  const router = useRouter()
  const { updateBooking } = useBooking()
  const [, startTransition] = useTransition()
  const href = `/tour-packages/${pkg.id}`

  const handleCardClick = () => {
    updateBooking({ item: pkg })
    // navigation handled by <Link href> in PackageCard
  }

  const handleCta = () => {
    updateBooking({ item: pkg })
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <PackageCard
      image={pkg.image}
      title={pkg.title}
      description={pkg.description}
      price={pkg.price}
      pricePrefix="Starting from"
      duration={pkg.duration}
      location={pkg.municipalityIds?.length ? formatLocationSummary(pkg.municipalityIds) : undefined}
      cardKind="tourPackage"
      dotSealGranted={dotSealGranted}
      href={href}
      onClick={handleCardClick}
      ctaLabel="Book now"
      onCta={handleCta}
      wide={wide}
    />
  )
}