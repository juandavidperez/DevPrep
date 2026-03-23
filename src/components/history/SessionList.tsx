"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SessionItem {
  id: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  score: number | null;
  completedAt: string | null;
  createdAt: string;
  duration: number | null;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface Props {
  sessions: SessionItem[];
  page: number;
  totalPages: number;
  category: string;
  difficulty: string;
  status: string;
  sort: string;
}

function buildPageUrl(
  page: number,
  filters: { category: string; difficulty: string; status: string; sort: string }
) {
  const params = new URLSearchParams();
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.difficulty !== "all") params.set("difficulty", filters.difficulty);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/history?${query}` : "/history";
}

export function SessionList({
  sessions,
  page,
  totalPages,
  category,
  difficulty,
  status,
  sort,
}: Props) {
  const t = useTranslations("History");
  const filters = { category, difficulty, status, sort };

  if (sessions.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">
        <p className="text-slate-400">{t("noMatches")}</p>
        <Link
          href="/session/new"
          className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          {t("startNew")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="space-y-3">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={
              s.completedAt
                ? `/session/${s.id}/results`
                : `/session/${s.id}`
            }
            className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 transition hover:border-slate-500"
          >
            <div>
              <p className="text-sm font-medium capitalize">
                {s.category.replace("_", " ")}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {s.difficulty} · {s.totalQuestions} questions
                {s.duration ? ` · ${formatDuration(s.duration)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-4 text-right">
              {s.completedAt ? (
                <div>
                  <p className="text-sm font-semibold">
                    <span className={scoreColor(s.score ?? 0)}>
                      {Math.round(s.score ?? 0)}
                    </span>
                    <span className="text-slate-500">/100</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.completedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                  {t("inProgress")}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link
              href={buildPageUrl(page - 1, filters)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <div className="h-8 w-8" />
          )}
          <span className="text-sm text-slate-400">
            {t("page", { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={buildPageUrl(page + 1, filters)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      )}
    </div>
  );
}
