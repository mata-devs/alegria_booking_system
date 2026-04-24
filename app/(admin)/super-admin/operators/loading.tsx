import { Skeleton, SkeletonRow } from '@/app/components/ui/Skeleton';

export default function OperatorsLoading() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-3 w-64" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-md rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1 bg-gray-300" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} cols={5} />
        ))}
      </div>
    </div>
  );
}
