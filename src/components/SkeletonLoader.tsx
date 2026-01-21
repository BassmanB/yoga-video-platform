/**
 * SkeletonLoader component
 *
 * Displays animated skeleton cards while loading video data
 */

import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 9 }: SkeletonLoaderProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="aspect-video rounded-t-lg" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
