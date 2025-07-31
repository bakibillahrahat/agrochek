import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen w-full p-8">
      {/* Header Section */}
      <div className="mb-8 space-y-4">
        <Skeleton className="h-8 w-3/4 max-w-[400px] rounded-lg" />
        <Skeleton className="h-4 w-1/2 max-w-[300px] rounded-lg" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Featured Card */}
        <div className="col-span-full space-y-4 rounded-xl border p-6 shadow-sm">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </div>
        </div>

        {/* Regular Cards */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border p-6 shadow-sm">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-2/3 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="mt-8 flex justify-center gap-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  )
} 