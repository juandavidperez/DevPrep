"use client";

import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Search } from "lucide-react";

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
  query: string;
}

export function HistoryFilters({ category, difficulty, status, sort, query }: Props) {
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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("query") as string;
    updateParam("query", q || "all");
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative w-full">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          name="query"
          type="text"
          defaultValue={query === "all" ? "" : query}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-white/5 bg-surface-lowest py-3 pl-11 pr-4 text-sm font-medium text-white outline-none transition-all placeholder:text-white/20 focus:border-primary/50 focus:bg-surface-container"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-surface-highest px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40 transition-all hover:bg-primary/20 hover:text-primary"
        >
          {t("searchButton")}
        </button>
      </form>

      {/* Category Row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[0.6875rem] font-mono font-medium text-white/40 uppercase tracking-widest w-20">
          {t("categoryLabel")}
        </span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => updateParam("category", c.value)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300",
                category === c.value
                  ? "bg-[#201f1f] text-[#d2bbff] border border-[#d2bbff]/30 shadow-[0_0_10px_rgba(210,187,255,0.1)]"
                  : "ghost-border text-white/50 hover:text-white/80 hover:bg-surface-container"
              )}
            >
              {t(c.tKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Level/Difficulty Row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[0.6875rem] font-mono font-medium text-white/40 uppercase tracking-widest w-20">
          {t("levelLabel")}
        </span>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => updateParam("difficulty", d.value)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300",
                difficulty === d.value
                  ? "bg-[#201f1f] text-[#d2bbff] border border-[#d2bbff]/30 shadow-[0_0_10px_rgba(210,187,255,0.1)]"
                  : "ghost-border text-white/50 hover:text-white/80 hover:bg-surface-container"
              )}
            >
              {t(d.tKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Status & Sort Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[0.6875rem] font-mono font-medium text-white/40 uppercase tracking-widest w-20">
            {t("statusLabel")}
          </span>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => updateParam("status", s.value)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300",
                  status === s.value
                    ? "bg-[#201f1f] text-[#d2bbff] border border-[#d2bbff]/30 shadow-[0_0_10px_rgba(210,187,255,0.1)]"
                    : "ghost-border text-white/50 hover:text-white/80 hover:bg-surface-container"
                )}
              >
                {t(s.tKey)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[0.6875rem] font-mono font-medium text-white/40 uppercase tracking-widest">
            {t("sortLabel")}
          </span>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0e0e0e] px-4 py-1.5 text-xs font-bold text-white/90 outline-none transition-all hover:border-white/20 focus:border-[#d2bbff]/50"
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
