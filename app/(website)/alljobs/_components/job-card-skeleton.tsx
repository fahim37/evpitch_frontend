import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface JobCardSkeletonProps {
  variant: "suggested" | "list"
}

export default function JobCardSkeleton({ variant }: JobCardSkeletonProps) {
  if (variant === "suggested") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-16 ml-4" />
              </div>

              <Skeleton className="h-4 w-1/3 mb-3" />

              <div className="flex items-center gap-6 mb-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 ml-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
