'use client';

import PackageCard from '@/app/components/ui/PackageCard';
import { packageImageUrl } from '@/app/lib/package-images';
import { formatLocationSummary } from '@/app/lib/package-locations';
import { StatusBadge } from '@/app/(operator)/operator/_components/shared/StatusBadge';
import type { OperatorPackage } from './types';

export function OperatorPackageCard({
  pkg,
  onViewDetails,
}: {
  pkg: OperatorPackage;
  onViewDetails: (p: OperatorPackage) => void;
}) {
  const createdDate =
    pkg.createdAt?.toDate?.()?.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    }) ?? '—';

  return (
    <PackageCard
      image={packageImageUrl(pkg.packageImages[0])}
      title={pkg.packageName}
      price={pkg.pricePerPerson}
      pricePrefix=""
      tag={pkg.packageTag}
      duration={pkg.duration}
      rating={pkg.packageRating}
      location={formatLocationSummary(pkg.packageLocations)}
      createdAt={`Created: ${createdDate}`}
      minGuests={pkg.minimumNumberOfPeople ?? 1}
      status={<StatusBadge status={pkg.status} />}
      ctaLabel="View Details"
      onCta={() => onViewDetails(pkg)}
    />
  );
}
