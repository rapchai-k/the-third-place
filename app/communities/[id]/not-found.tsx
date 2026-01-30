import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

/**
 * 404 page for community not found.
 * Shown when notFound() is called from the page component.
 */
export default function CommunityNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-md mx-auto">
        <Users className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Community Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The community you&apos;re looking for doesn&apos;t exist or may have been
          removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/communities">Browse All Communities</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

