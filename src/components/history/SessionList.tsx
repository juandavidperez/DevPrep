"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";

interface SessionItem {
  id: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  score: number | null;
  completedAt: string | null;
  createdAt: string;
  duration: number | null;
  snippet: string | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0 min";
  const m = Math.floor(seconds / 60);
  return `${m} min`;
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
  const filters = { category, difficulty, status, sort };
  const dateLocale = locale === "es" ? es : enUS;

  if (sessions.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-white/10 p-12 text-center bg-surface-container-lowest">
        <p className="text-white/40 font-medium">{t("noMatches")}</p>
        <Link
          href="/session/new"
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#d2bbff] hover:text-white transition-all"
        >
          {t("startNew")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-surface-container-low ghost-border rounded-xl p-6 hover:bg-surface-container transition-all duration-300 flex flex-col gap-6 relative overflow-hidden group"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
            
            <div className="flex justify-between items-start z-10">
              <span className="px-2 py-1 bg-surface-container-highest text-[0.6875rem] font-mono font-bold tracking-widest text-[#d2bbff] border border-white/5 uppercase rounded-sm">
                {s.category.replace("_", " ")} — {s.difficulty}
              </span>
              <span className="text-[0.6875rem] text-white/40 font-bold uppercase tracking-tighter">
                {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true, locale: dateLocale })}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
              <div className="space-y-2">
                <span className="text-white/30 text-[0.6875rem] font-mono block uppercase tracking-widest font-bold">
                  Global Performance
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-mono font-bold text-[#7C3AED]">
                    {s.score !== null ? Math.round(s.score) : "--"}
                  </span>
                  <span className="text-xl font-mono text-white/20">/100</span>
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <div className="flex items-center gap-2 text-white/40 mb-3">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold uppercase tracking-tight">
                    {formatDuration(s.duration)} session
                  </span>
                </div>
                {s.snippet && (
                  <p className="text-sm text-white/60 line-clamp-2 italic border-l-2 border-white/10 pl-4 font-medium leading-relaxed">
                    {s.snippet}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <Link
                  href={s.completedAt ? `/session/${s.id}/results` : `/session/${s.id}`}
                  className="ghost-border text-[0.875rem] font-bold px-6 py-2 rounded-lg text-white/90 hover:bg-[#d2bbff] hover:text-[#131313] transition-all duration-300 active:scale-95"
                >
                  Ver Feedback
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Section */}
      {totalPages > 1 && (
        <section className="flex items-center justify-between pt-8 pb-4">
          <div className="text-[0.6875rem] font-mono text-white/30 uppercase tracking-widest font-bold">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link
                href={buildPageUrl(page - 1, filters)}
                className="ghost-border px-4 py-2 text-xs font-bold text-white/80 hover:bg-surface-container-highest transition-colors uppercase tracking-tighter"
              >
                Anterior
              </Link>
            ) : (
              <span className="ghost-border px-4 py-2 text-xs font-bold text-white/20 cursor-not-allowed uppercase tracking-tighter">
                Anterior
              </span>
            )}
            
            <div className="flex items-center">
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                // Simple pagination logic, showing only a few pages or all if small
                if (totalPages > 5 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) return null;
                
                return (
                  <Link
                    key={p}
                    href={buildPageUrl(p, filters)}
                    className={clsx(
                      "px-4 py-2 text-xs font-bold border transition-all",
                      p === page
                        ? "bg-[#201f1f] text-[#d2bbff] border-[#d2bbff]/30 shadow-inner"
                        : "ghost-border text-white/50 hover:bg-surface-container-highest"
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
                className="ghost-border px-4 py-2 text-xs font-bold text-white/80 hover:bg-surface-container-highest transition-colors uppercase tracking-tighter"
              >
                Siguiente
              </Link>
            ) : (
              <span className="ghost-border px-4 py-2 text-xs font-bold text-white/20 cursor-not-allowed uppercase tracking-tighter">
                Siguiente
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
