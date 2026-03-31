import { Skeleton } from "@/components/ui/Skeleton";

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-5 backdrop-blur-[20px]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-10 w-24" />
      <Skeleton className="mt-3 h-5 w-28 rounded-full" />
    </div>
  );
}

function SessionRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-container/70 px-5 py-3.5 backdrop-blur-[20px]">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      {/* Topbar */}
      <div className="sticky top-0 z-30 border-b border-border-subtle bg-background/80 backdrop-blur-[20px]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 md:px-8">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 md:px-8">
        {/* Welcome */}
        <div className="mb-8 space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Analytics */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border-subtle bg-surface-container/70 p-5 backdrop-blur-[20px]">
            <Skeleton className="mb-4 h-3 w-24" />
            <div className="flex h-24 items-end gap-1.5 px-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-5 backdrop-blur-[20px]">
            <Skeleton className="mb-4 h-3 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SessionRowSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Course cards */}
        <div className="mt-8">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
