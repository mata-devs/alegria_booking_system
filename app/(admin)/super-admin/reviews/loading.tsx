import { Skeleton } from '@/app/components/ui/Skeleton';

export default function ReviewsLoading() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-3 w-64" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-32 mb-1.5" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-full mb-1.5" />
            <Skeleton className="h-3 w-full mb-1.5" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
