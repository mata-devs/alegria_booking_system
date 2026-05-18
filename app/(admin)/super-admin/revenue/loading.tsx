import { Skeleton, SkeletonRow } from '@/app/components/ui/Skeleton';

export default function RevenueLoading() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-3 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1 bg-gray-300" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRow key={i} cols={6} />
        ))}
      </div>
    </div>
  );
}
