'use client';

import PackageCard from '@/app/components/ui/PackageCard';
import { packageImageUrl } from '@/app/lib/package-images';
import { formatActivityTagsDisplay } from '@/app/lib/activity-tags';
import { StatusBadge } from '../shared/StatusBadge';
import type { OperatorActivity } from './types';

export function OperatorActivityCard({
  activity,
  onViewDetails,
}: {
  activity: OperatorActivity;
  onViewDetails: (a: OperatorActivity) => void;
}) {
  const createdDate =
    activity.createdAt?.toDate?.()?.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    }) ?? '—';
  return (
    <PackageCard
      image={packageImageUrl(activity.activityImages[0])}
      title={activity.activityName}
      price={activity.pricePerGuest}
      pricePrefix=""
      tag={formatActivityTagsDisplay(activity.activityTags)}
      rating={activity.activityRating}
      location={activity.activityLocation}
      createdAt={`Created: ${createdDate}`}
      status={<StatusBadge status={activity.status} />}
      ctaLabel="View Details"
      onCta={() => onViewDetails(activity)}
    />
  );
}
