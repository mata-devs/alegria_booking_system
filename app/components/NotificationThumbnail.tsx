'use client';

import Image from 'next/image';
import { Bell } from 'lucide-react';

const SIZE_MAP = {
  sm: { px: 36, icon: 'h-4 w-4' },
  md: { px: 44, icon: 'h-5 w-5' },
  lg: { px: 56, icon: 'h-5 w-5' },
} as const;

interface NotificationThumbnailProps {
  imageUrl: string | null;
  size?: keyof typeof SIZE_MAP;
}

export default function NotificationThumbnail({
  imageUrl,
  size = 'md',
}: NotificationThumbnailProps) {
  const { px, icon } = SIZE_MAP[size];

  return (
    <div
      className="shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
      style={{ width: px, height: px }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={px}
          height={px}
          className="object-cover w-full h-full"
          // next/image handles CDN caching — minimumCacheTTL=31536000 (1yr) in next.config.ts
        />
      ) : (
        <Bell className={`${icon} text-gray-400`} strokeWidth={1.75} />
      )}
    </div>
  );
}
