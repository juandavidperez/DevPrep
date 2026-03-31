import { Skeleton } from "@/components/ui/Skeleton";

export default function NewSessionLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-text-primary">
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative mx-auto max-w-xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Config form card */}
        <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-6 backdrop-blur-[20px]">
          <div className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            </div>

            {/* Question count */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            {/* Start button */}
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
