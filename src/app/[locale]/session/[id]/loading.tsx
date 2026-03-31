import { Skeleton } from "@/components/ui/Skeleton";

function MessageSkeleton({ align }: { align: "left" | "right" }) {
  const isLeft = align === "left";
  return (
    <div className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[75%] space-y-2 ${isLeft ? "" : "items-end flex flex-col"}`}>
        <Skeleton className="h-3 w-16" />
        <Skeleton className={`h-20 rounded-xl ${isLeft ? "w-80" : "w-64"}`} />
      </div>
    </div>
  );
}

export default function SessionLoading() {
  return (
    <div className="flex h-screen flex-col bg-background text-text-primary">
      {/* Session header */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-lowest px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-8">
        <MessageSkeleton align="left" />
        <MessageSkeleton align="right" />
        <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-4 backdrop-blur-[20px]">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-3 h-12 w-full rounded-lg" />
        </div>
        <MessageSkeleton align="left" />
      </div>

      {/* Input area */}
      <div className="border-t border-border-subtle bg-surface-lowest p-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="mt-2 flex items-center justify-between">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
