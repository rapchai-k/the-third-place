import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the communities listing page.
 * Shown while the Server Component is fetching initial data.
 */
export default function CommunitiesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Community Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              {/* Image placeholder */}
              <Skeleton className="h-40 w-full rounded-lg" />
              {/* Title */}
              <Skeleton className="h-6 w-3/4" />
              {/* Location */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              {/* Members count */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              {/* Description */}
              <Skeleton className="h-12 w-full" />
              {/* Join button */}
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

