"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Clock, PlayCircle, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface SessionItem {
  id: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  score: number | null;
  completedAt: string | null;
  createdAt: string;
  duration: number | null;
  targetStack: string[];
  snippet: string | null;
  answeredQuestions: number;
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
  const { locale } = useParams();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const filters = { category, difficulty, status, sort };
  const dateLocale = locale === "es" ? es : enUS;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (sessions.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-[#0e0e0e] p-12 text-center">
        <p className="font-medium text-white/40">{t("noMatches")}</p>
        <Link
          href="/session/new"
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition-all hover:text-white"
        >
          {t("startNew")}
        </Link>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete session");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(null);
      setIsConfirming(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        {sessions.map((s) => {
          const isComplete = !!s.completedAt;
          const progressPercent = Math.min(100, Math.round((s.answeredQuestions / s.totalQuestions) * 100));

          return (
            <div
              key={s.id}
              className="ghost-border relative flex flex-col gap-6 overflow-hidden rounded-xl bg-surface-container p-6 transition-all duration-300 hover:bg-surface-highest group"
            >
              {/* Ambient glow */}
              <div className="pointer-events-none absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10" />

              {/* Top row: category badge + status badge + timestamp */}
              <div className="flex items-start justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="rounded-sm border border-white/5 bg-surface-highest px-2 py-1 font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-primary">
                    {s.category.replace(/_/g, " ")} 
                    {s.targetStack.length > 0 && ` · ${s.targetStack.join(", ")}`} 
                    — {s.difficulty}
                  </span>
                  {!isComplete && (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[0.625rem] font-bold uppercase tracking-widest text-emerald-400">
                      <PlayCircle className="h-3 w-3" />
                      {t("inProgress")}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-tighter text-white/40">
                  {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true, locale: dateLocale })}
                </span>
                
                {/* Delete button (only visible on hover or mobile) */}
                <button
                  onClick={() => setIsConfirming(s.id)}
                  disabled={isDeleting === s.id}
                  className="p-2 text-white/20 transition-all hover:text-red-400 disabled:opacity-50"
                  title={t("deleteSession")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Bottom row: score | meta + snippet | CTA */}
              <div className="flex flex-col gap-6 z-10 md:flex-row md:items-end md:justify-between">
                {/* Score / progress */}
                <div className="space-y-2">
                  <span className="block font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-white/30">
                    {t("globalPerformance")}
                  </span>
                  {isComplete ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-5xl font-bold text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] transition-all group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.25)]">
                        {s.score !== null ? Math.round(s.score) : "--"}
                      </span>
                      <span className="font-mono text-xl font-bold text-text-secondary/40">{t("scoreLabel")}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl font-black text-emerald-400">
                            {s.answeredQuestions} / {s.totalQuestions}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-white/30 font-bold">
                            Pasos
                          </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-emerald-400/80">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full max-w-[200px] overflow-hidden rounded-full bg-surface-highest/50 ring-1 ring-white/5">
                        <div 
                          className="h-full rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-700 ease-out" 
                          style={{ width: `${progressPercent}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration + snippet */}
                <div className="flex-1 max-w-md">
                  <div className="mb-3 flex items-center gap-2 text-white/40">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold uppercase tracking-tight">
                      {s.duration
                        ? t("sessionDuration", { duration: Math.floor(s.duration / 60) })
                        : t("questionsCount", { count: s.totalQuestions })}
                    </span>
                  </div>
                  {s.snippet && (
                    <p className="line-clamp-2 border-l-2 border-white/10 pl-4 text-sm font-medium italic leading-relaxed text-white/60">
                      {s.snippet}
                    </p>
                  )}
                </div>

                {/* CTA */}
                <div className="flex items-center">
                  <Link
                    href={isComplete ? `/session/${s.id}/results` : `/session/${s.id}`}
                    className="ghost-border rounded-lg px-6 py-2 text-sm font-bold text-white/90 transition-all duration-300 hover:bg-primary hover:text-background active:scale-95"
                  >
                    {t("viewFeedback")}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="flex items-center justify-between pb-4 pt-8">
          <div className="font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-white/30">
            {t("page", { page, total: totalPages })}
          </div>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link
                href={buildPageUrl(page - 1, filters)}
                className="ghost-border rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-tighter text-white/80 transition-colors hover:bg-surface-container"
              >
                {t("previous")}
              </Link>
            ) : (
              <span className="ghost-border rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-tighter text-white/20 cursor-not-allowed">
                {t("previous")}
              </span>
            )}

            <div className="flex items-center">
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (totalPages > 5 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) return null;
                return (
                  <Link
                    key={p}
                    href={buildPageUrl(p, filters)}
                    className={clsx(
                      "border px-4 py-2 text-xs font-bold transition-all",
                      p === page
                        ? "border-primary/30 bg-surface-container text-primary shadow-inner"
                        : "ghost-border text-white/50 hover:bg-surface-container"
                    )}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>

            {page < totalPages ? (
              <Link
                href={buildPageUrl(page + 1, filters)}
                className="ghost-border rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-tighter text-white/80 transition-colors hover:bg-surface-container"
              >
                {t("next")}
              </Link>
            ) : (
              <span className="ghost-border rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-tighter text-white/20 cursor-not-allowed">
                {t("next")}
              </span>
            )}
          </div>
        </section>
      )}
      {/* Delete Confirmation Modal */}
      {isConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-surface-container p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">{t("deleteConfirmTitle")}</h3>
            <p className="text-sm text-white/60 mb-6">{t("deleteConfirmDesc")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirming(null)}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white/80 transition-all hover:bg-white/5"
              >
                {t("deleteCancel")}
              </button>
              <button
                onClick={() => handleDelete(isConfirming)}
                disabled={isDeleting === isConfirming}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting === isConfirming ? t("deleting") : t("deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
