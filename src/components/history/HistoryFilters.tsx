"use client";

import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";

const CATEGORIES = [
  { value: "all", tKey: "all" },
  { value: "technical", tKey: "technical" },
  { value: "coding", tKey: "coding" },
  { value: "system_design", tKey: "systemDesign" },
  { value: "behavioral", tKey: "behavioral" },
];

const DIFFICULTIES = [
  { value: "all", tKey: "all" },
  { value: "junior", tKey: "junior" },
  { value: "mid", tKey: "mid" },
  { value: "senior", tKey: "senior" },
];

const STATUSES = [
  { value: "all", tKey: "all" },
  { value: "completed", tKey: "completed" },
  { value: "in_progress", tKey: "inProgress" },
];

const SORTS = [
  { value: "newest", tKey: "newest" },
  { value: "oldest", tKey: "oldest" },
  { value: "score_high", tKey: "scoreHigh" },
  { value: "score_low", tKey: "scoreLow" },
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
  const t = useTranslations("History");

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
        <span className="text-xs font-medium text-slate-500 w-16">{t("categoryLabel")}</span>
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
            {t(c.tKey)}
          </button>
        ))}
      </div>

      {/* Difficulty */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 w-16">{t("levelLabel")}</span>
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
            {t(d.tKey)}
          </button>
        ))}
      </div>

      {/* Status + Sort row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 w-16">{t("statusLabel")}</span>
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
              {t(s.tKey)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">{t("sortLabel")}</span>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-500"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {t(s.tKey)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
