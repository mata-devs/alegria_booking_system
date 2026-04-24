import { Skeleton } from '@/app/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="-m-6 min-h-[calc(100vh-0px)] bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-3 w-72" />
      </header>

      <div className="px-6 py-6 md:px-8 md:py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="px-6 py-5 space-y-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div>
                    <Skeleton className="h-8 w-32 mb-2 rounded-md" />
                    <Skeleton className="h-2.5 w-40" />
                  </div>
                </div>
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton className="h-2.5 w-20 mb-1.5" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
