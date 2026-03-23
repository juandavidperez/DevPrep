"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { clsx } from "clsx";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "technical", label: "Technical" },
  { value: "coding", label: "Coding" },
  { value: "system_design", label: "System Design" },
  { value: "behavioral", label: "Behavioral" },
];

const DIFFICULTIES = [
  { value: "all", label: "All" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
];

const STATUSES = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "score_high", label: "Score ↑" },
  { value: "score_low", label: "Score ↓" },
];

interface Props {
  category: string;
  difficulty: string;
  status: string;
  sort: string;
}

export function HistoryFilters({ category, difficulty, status, sort }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || (key === "sort" && value === "newest")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page"); // Reset to page 1 on filter change
      const query = params.toString();
      router.push(query ? `/history?${query}` : "/history");
    },
    [router, searchParams]
  );

  return (
    <div className="mt-6 space-y-3">
      {/* Category */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-16">Category</span>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => updateParam("category", c.value)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              category === c.value
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Difficulty */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-16">Level</span>
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            onClick={() => updateParam("difficulty", d.value)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              difficulty === d.value
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Status + Sort row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 w-16">Status</span>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateParam("status", s.value)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                status === s.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Sort</span>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
