"use client";

import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/navigation";
import { AnalyticsRange } from "@/types/analytics";

export function RangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRange = (searchParams.get("range") as AnalyticsRange) || "10s";

  const ranges: { label: string; value: AnalyticsRange }[] = [
    { label: "5", value: "5s" },
    { label: "10", value: "10s" },
    { label: "20", value: "20s" },
    { label: "Todo", value: "all" },
  ];

  function setRange(range: AnalyticsRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 overflow-hidden rounded-lg border border-border-subtle bg-surface-container/40 p-1 backdrop-blur-sm">
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => setRange(r.value)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            currentRange === r.value
              ? "bg-primary-container text-text-primary shadow-sm"
              : "text-text-secondary hover:bg-surface-highest hover:text-text-primary"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
