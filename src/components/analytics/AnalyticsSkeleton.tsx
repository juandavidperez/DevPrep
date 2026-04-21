import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-surface-highest/40 ${className}`} />
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-border-subtle bg-surface-container/40 p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-8 w-24" />
            <Skeleton className="mt-4 h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Main Charts Skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-xl border border-border-subtle bg-surface-container/40 p-5 lg:col-span-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-6 h-40 w-full" />
        </div>
        <div className="h-64 rounded-xl border border-border-subtle bg-surface-container/40 p-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-6 h-40 w-full" />
        </div>
      </div>

      {/* Bottom Tables Skeleton */}
      <div className="h-64 rounded-xl border border-border-subtle bg-surface-container/40 p-5">
        <Skeleton className="h-3 w-32" />
        <div className="mt-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
