import { Skeleton } from '@/app/components/ui/Skeleton';

export default function SiteContentCmsLoading() {
  return (
    <div className="-m-6 min-h-[calc(100vh-0px)] bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-3 w-96" />
      </header>

      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
      </div>

      <div className="px-6 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <Skeleton className="mb-2 h-4 w-40" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="space-y-4 px-6 py-5">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j}>
                  <Skeleton className="mb-1.5 h-2.5 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
