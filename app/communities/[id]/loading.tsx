import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Loading skeleton for the community detail page.
 * This is shown while the Server Component is fetching data.
 * Uses React Suspense/Streaming under the hood.
 */
export default function CommunityDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Back button skeleton */}
        <Skeleton className="h-10 w-40" />

        {/* Main community card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                {/* Title skeleton */}
                <Skeleton className="h-9 w-64 mb-2" />
                {/* Location skeleton */}
                <Skeleton className="h-5 w-32" />
                {/* Members badge skeleton */}
                <Skeleton className="h-6 w-28" />
              </div>
              {/* Image skeleton */}
              <Skeleton className="w-24 h-24 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            {/* Button skeleton */}
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>

        {/* Events and Discussions grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-l-4 border-primary pl-4">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          {/* Recent Discussions Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-l-4 border-primary pl-4">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

