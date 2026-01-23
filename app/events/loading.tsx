import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the events listing page.
 * Shown while the Server Component is fetching initial data.
 */
export default function EventsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              {/* Badge */}
              <Skeleton className="h-6 w-24" />
              {/* Title */}
              <Skeleton className="h-6 w-3/4" />
              {/* Date/Time/Location */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
              {/* Description */}
              <Skeleton className="h-16 w-full" />
              {/* Tags */}
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              {/* Footer */}
              <div className="pt-2 border-t space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

