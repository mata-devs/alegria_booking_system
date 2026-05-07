'use client';

import NotificationsBell from '@/app/components/NotificationsBell';
import AccountAvatar from '@/app/components/AccountAvatar';
import NotificationToast from '@/app/components/NotificationToast';
import type { UserProfile } from '@/app/lib/types';

interface RightRailProps {
  uid: string | undefined;
  profile: UserProfile | null;
  seeAllHref: string;
  onSignOut: () => void;
}

export default function RightRail({ uid, profile, seeAllHref, onSignOut }: RightRailProps) {
  return (
    <>
      <aside className="fixed right-0 top-0 h-screen w-12 z-[60] flex flex-col items-center gap-3 pt-4 border-l border-gray-200 bg-white">
        {profile && <AccountAvatar profile={profile} onSignOut={onSignOut} />}
        <NotificationsBell uid={uid} seeAllHref={seeAllHref} className="relative" />
      </aside>
      <NotificationToast uid={uid} />
    </>
  );
}
