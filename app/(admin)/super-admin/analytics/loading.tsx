import { Skeleton, SkeletonCard } from '@/app/components/ui/Skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="-m-6 min-h-[calc(100vh-0px)] bg-gray-50">
      <div className="flex flex-col md:flex-row">
        <aside className="w-full border-r border-gray-200 bg-white px-5 py-5 md:w-64 md:shrink-0">
          <Skeleton className="h-5 w-20 mb-5" />
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-24 w-full rounded-lg mb-6" />
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-32 w-full" />
        </aside>

        <div className="min-w-0 flex-1 p-6">
          <div className="mb-5">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-4">
            <SkeletonCard className="xl:col-span-2 h-72" />
            <SkeletonCard className="h-72" />
            <SkeletonCard className="h-72" />
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-64" />
            <SkeletonCard className="xl:col-span-4 h-96" />
          </div>
        </div>
      </div>
    </div>
  );
}
