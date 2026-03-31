import { Skeleton } from "@/components/ui/Skeleton";

export default function ResultsLoading() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Back link */}
        <Skeleton className="mb-6 h-4 w-24" />

        {/* Score summary card */}
        <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-6 backdrop-blur-[20px]">
          <div className="flex flex-col items-center gap-3 text-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-28 rounded-xl" />
            <Skeleton className="h-3 w-48" />
          </div>
          {/* Criteria breakdown */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 text-center">
                <Skeleton className="mx-auto h-3 w-20" />
                <Skeleton className="mx-auto h-8 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="mt-8 space-y-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-subtle bg-surface-container/70 p-5 backdrop-blur-[20px]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-8 w-14 shrink-0 rounded-lg" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-8 flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
