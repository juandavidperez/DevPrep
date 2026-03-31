import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background pb-20 text-text-primary">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Form sections */}
        {Array.from({ length: 4 }).map((_, section) => (
          <div
            key={section}
            className="mb-6 rounded-xl border border-border-subtle bg-surface-container/70 p-6 backdrop-blur-[20px]"
          >
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Save button */}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </main>
  );
}
