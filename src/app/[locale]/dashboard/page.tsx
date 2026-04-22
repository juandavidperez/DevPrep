import { redirect } from "next/navigation";
import { Link } from "@/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { TrendingDown, ArrowRight, MonitorPlay, Bookmark } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { getGlobalStats } from "@/lib/analytics";
import { DashboardTopbar } from "@/components/DashboardTopbar";
// import { StatCard, DeltaBadge } from "@/components/StatCard";
import { DashboardStats } from "@/components/DashboardStats";

// ── Course cards ───────────────────────────────────────────────────────────────
// ── Course mapping ─────────────────────────────────────────────────────────────
const CRITERIA_PRACTICE_MAP: Record<string, { title: string, desc: string, tag: string, image: string }> = {
  // Technical
  correctness: {
    title: "Fundamentos Técnicos",
    desc: "Refuerza los conceptos base y evita errores conceptuales comunes.",
    tag: "FUNDAMENTOS",
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop"
  },
  depth: {
    title: "Profundidad Técnica",
    desc: "Domina el 'bajo el capó' y el 'por qué' de las tecnologías que usas.",
    tag: "AVANZADO",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop"
  },
  practical_examples: {
    title: "Aplicación Real",
    desc: "Aprende a conectar teoría con escenarios reales y casos de uso.",
    tag: "ESCENARIOS",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop"
  },
  clarity: {
    title: "Comunicación Técnica",
    desc: "Estructura tus explicaciones para que sean claras y profesionales.",
    tag: "SOFT SKILLS",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop"
  },
  // Coding
  time_complexity: {
    title: "Algoritmos y Eficiencia",
    desc: "Mejora tu análisis de Big O y optimiza el rendimiento de tu código.",
    tag: "LÓGICA",
    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop"
  },
  readability: {
    title: "Clean Code",
    desc: "Escribe código que otros puedan entender fácilmente.",
    tag: "MEJORES PRÁCTICAS",
    image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop"
  },
  edge_cases: {
    title: "Robustez de Código",
    desc: "Identifica y maneja casos borde antes de que rompan tu app.",
    tag: "CALIDAD",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop"
  },
  // System Design
  scalability: {
    title: "Escalabilidad Masiva",
    desc: "Diseña sistemas que aguanten millones de usuarios sin colapsar.",
    tag: "ARQUITECTURA",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop"
  },
  trade_offs: {
    title: "Toma de Decisiones",
    desc: "Entiende los compromisos entre diferentes arquitecturas.",
    tag: "ESTRATEGIA",
    image: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&auto=format&fit=crop"
  },
  // Behavioral
  star_structure: {
    title: "Método STAR",
    desc: "Domina la estructura Situación, Tarea, Acción y Resultado.",
    tag: "NARRATIVA",
    image: "https://images.unsplash.com/photo-1454165833767-027ffea7025c?w=800&auto=format&fit=crop"
  },
  self_awareness: {
    title: "Autoconciencia",
    desc: "Demuestra cómo aprendes de tus errores y evolucionas.",
    tag: "MINDSET",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop"
  },
};

const DEFAULT_PRACTICE = [
  {
    title: "Preparación SQL Avanzado",
    desc: "Domina queries complejas, optimización y diseño de esquemas.",
    tag: "DATABASES",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCApMWdIT50_qgBenziFXqNtiZX1M6hJ6yzTlz7QSMB2Kish6YwDsbmDT4VGbgWWo_COEmLVq3YZbLE3zCYVqNLtFhgFqRguOOn_IUIZYkfo6T_5ooHNgUFVtUKz3E84k_BrXtscOraeJbiwHNJwA4O4ep2V-K4UJiWjZwXD3ZEdhMMI6n6JG20ObtErFSjZp0jN-YziUMuMpEl1RIni-2Ua20_VHhwmgcS-guyTgsUj2awlzRc9KzMIAivstlYnI9QqrlI4NlGVUIq",
  },
  {
    title: "Diseño de Sistemas",
    desc: "Aprende a diseñar arquitecturas escalables y resilientes.",
    tag: "ARQUITECTURA",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdsUfheqNX1VLjaxcUZvsAnJtvJmcnLjPKf-thLbLHeN5R5pw1cWs0ThwMKRygMBUaLvsxvvY8do33HqTiVPX_g6hi9DFBhI_hIjM3N-oQwskCGlThbWHvfEOHaiDGhx3-nOiEOuRC9h_2qTIybhuox6a4NiYQSuNUYWHEG5gQRachODGd1DCtJadv4RsSC3WMEkdsCuJZdifY6VNQcXunkE2P_7w1DJboqeSR_TVUYWCWiy2FAdcMlLAADohXE6lW5bAVIaaLbJiN",
  },
];


// ── Analytics sub-components ──────────────────────────────────────────────────

const CATEGORY_SHORT: Record<string, string> = {
  technical: "Tech",
  coding: "Code",
  system_design: "Sys",
  behavioral: "Beh",
};

const CATEGORY_LABEL: Record<string, string> = {
  technical: "Technical",
  coding: "Coding",
  system_design: "System Design",
  behavioral: "Behavioral",
};

function ScoreTrendChart({
  sessions,
  emptyLabel,
  locale,
}: {
  sessions: Array<{ score: number | null; category: string; completedAt: Date | string | null }>;
  emptyLabel: string;
  locale: string;
}) {
  const data = sessions
    .filter((s) => s.completedAt && s.score !== null)
    .slice(0, 10)
    .reverse();

  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-xs text-text-secondary">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex h-24 items-stretch gap-1.5 px-1">
      {data.map((s, i) => {
        const score = Math.round(s.score!);
        const barColor =
          score >= 70
            ? "bg-emerald-400/60 group-hover:bg-emerald-400"
            : score >= 40
              ? "bg-yellow-400/60 group-hover:bg-yellow-400"
              : "bg-red-400/60 group-hover:bg-red-400";
        return (
          <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="pointer-events-none absolute -top-5 hidden rounded bg-surface-highest px-1.5 py-0.5 font-mono text-[10px] text-text-primary group-hover:block">
              {score}
            </span>
            <div
              style={{ height: `${Math.max(score, 4)}%` }}
              className={`w-full rounded-t-sm transition-colors ${barColor}`}
            />
            <span className="text-[10px] text-text-secondary font-mono mt-1">
              {new Date(s.completedAt!).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WeakAreasCard({
  stats,
  emptyLabel,
}: {
  stats: Array<{ category: string; _avg: { score: number | null }; _count: { _all: number } }>;
  emptyLabel: string;
}) {
  const sorted = stats
    .filter((s) => s._avg.score !== null)
    .sort((a, b) => (a._avg.score ?? 0) - (b._avg.score ?? 0))
    .slice(0, 4);

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-6">
        <p className="text-xs text-text-secondary">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((s) => {
        const score = Math.round(s._avg.score ?? 0);
        const barColor =
          score >= 70
            ? "bg-emerald-400/60"
            : score >= 40
              ? "bg-yellow-400/60"
              : "bg-red-400/60";
        return (
          <div key={s.category}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {CATEGORY_LABEL[s.category] ?? s.category}
              </span>
              <span className="font-mono text-xs font-semibold text-text-primary">{score}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-highest">
              <div
                className={`h-1.5 rounded-full transition-all ${barColor}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────────

function ScoreColor({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-emerald-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
  return <span className={color}>{Math.round(score)}</span>;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const t = await getTranslations("Dashboard");
  const { q, tab } = await searchParams;
  const now = new Date();
  const query = q?.toLowerCase().trim() ?? "";
  const activeTab = tab === "analytics" ? "analytics" : "overview";

  const [
    globalStats,
    sessions, 
    categoryStats, 
    trendSessions, 
    dueBookmarksCount
  ] = await Promise.all([
    getGlobalStats(session.user.id),
    prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        category: true,
        difficulty: true,
        totalQuestions: true,
        score: true,
        completedAt: true,
        createdAt: true,
        duration: true,
        targetStack: true,
      },
    }),
    prisma.session.groupBy({
      by: ["category"],
      where: { userId: session.user.id, completedAt: { not: null }, score: { not: null } },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.session.findMany({
      where: { userId: session.user.id, completedAt: { not: null }, score: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { score: true, category: true, completedAt: true },
    }),
    prisma.bookmark.count({
      where: {
        userId: session.user.id,
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      },
    }),
  ]);

  const { totalSessions, sessionsDelta, avgScore, scorePercentile, totalMinutes, currentMinutes, streak, weakCriteria } = globalStats;

  const filteredSessions = query
    ? sessions.filter(
        (s) =>
          s.category.toLowerCase().includes(query) ||
          s.difficulty.toLowerCase().includes(query),
      )
    : sessions;


  const locale = await getLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">

      {/* ── Top navbar ─────────────────────────────────────────────────────── */}
      <DashboardTopbar searchPlaceholder={t("search")} />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 md:px-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary md:text-4xl">
            {t("welcome", { name: session.user.name?.split(" ")[0] ?? "Developer" })}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">{t("subtitle")}</p>
        </div>

        {/* Pending Bookmarks Notification */}
        {dueBookmarksCount > 0 && (
          <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-6 py-5 backdrop-blur-md sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                <Bookmark className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-text-primary">
                  {t("dueBookmarks", { count: dueBookmarksCount })}
                </p>
                <p className="text-xs text-text-secondary">
                   Usa el sistema de repetición espaciada para retener lo aprendido.
                </p>
              </div>
            </div>
            <Link
              href="/bookmarks?due=true"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] transition hover:bg-primary/90 hover:shadow-glow active:scale-95 sm:w-auto"
            >
              {t("dueBookmarksLink")}
            </Link>
          </div>
        )}

        {activeTab === "overview" ? (
          <>
            {/* ── Stats — 4 columns ──────────────────────────────────────────── */}
            <DashboardStats 
              totalCount={totalSessions}
              sessionsDelta={sessionsDelta}
              avgScore={avgScore}
              scorePercentile={scorePercentile}
              totalMinutes={totalMinutes}
              currentMinutes={currentMinutes}
              streak={streak}
            />

            {/* ── Weak Criteria Summary ────────────────────────────────────────── */}
            {weakCriteria && weakCriteria.length > 0 && (
              <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-md">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Tus criterios más débiles esta semana</h2>
                    <p className="text-xs text-text-secondary">Basado en tus últimas 10 sesiones. Enfócate en mejorar estos puntos.</p>
                  </div>
                  <TrendingDown className="h-5 w-5 text-red-400" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {weakCriteria.map((c: { key: string, avg: number }) => (
                    <div key={c.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                          {c.key.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-sm font-black text-red-400">{c.avg}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-red-500/10">
                        <div 
                          className="h-full rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-1000" 
                          style={{ width: `${c.avg}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Recent Sessions — full width ───────────────────────────────── */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("recentSessions")}</h2>
                {sessions.length > 0 && (
                  <Link href="/history" className="text-sm text-primary hover:text-primary/80">
                    {t("viewAll")}
                  </Link>
                )}
              </div>

              {filteredSessions.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface-container/70 py-14 text-center backdrop-blur-[20px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-highest">
                    <MonitorPlay className="h-6 w-6 text-text-secondary" />
                  </div>
                  <p className="mt-4 text-sm text-text-secondary">
                    {query ? t("noResults") : t("noSessions")}
                  </p>
                  {!query && (
                    <Link
                      href="/session/new"
                      className="mt-4 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary-container px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-container/80 hover:shadow-glow"
                    >
                      {t("startFirst")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {filteredSessions.map((s) => (
                    <Link
                      key={s.id}
                      href={s.completedAt ? `/session/${s.id}/results` : `/session/${s.id}`}
                      className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-container/70 px-5 py-3.5 backdrop-blur-[20px] transition hover:border-primary/30 hover:bg-surface-highest/50"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {s.category.replace("_", " ")}
                          {s.targetStack.length > 0 && ` · ${s.targetStack.join(", ")}`}
                        </p>
                        <p className="text-xs text-text-secondary capitalize">
                          {s.difficulty} · {t("questions", { count: s.totalQuestions })}
                        </p>
                      </div>
                      <div className="text-right">
                        {s.completedAt ? (
                          <>
                            <p className="font-mono text-sm font-semibold">
                              <ScoreColor score={s.score ?? 0} />
                              <span className="text-text-secondary">/100</span>
                            </p>
                            <p className="font-mono text-xs text-text-secondary">
                              {new Date(s.completedAt).toLocaleDateString(locale)}
                            </p>
                          </>
                        ) : (
                          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                            {t("inProgress")}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Dynamic Suggested Practice ───────────────────────────────────────── */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold">{t("suggestedPractice")}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(weakCriteria && weakCriteria.length > 0
                  ? weakCriteria
                      .map((c: { key: string }) => CRITERIA_PRACTICE_MAP[c.key])
                      .filter(Boolean)
                  : DEFAULT_PRACTICE
                ).map((card, idx) => (
                  <Link
                    key={`${card.title}-${idx}`}
                    href="/session/new"
                    className="group relative flex h-48 flex-col justify-end overflow-hidden rounded-xl border border-border-subtle shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition hover:border-primary/30"
                  >
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="relative z-10 p-4">
                      <span className="rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                        {card.tag}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-white">{card.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/60">{card.desc}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
                        {t("practice")} <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ── Analytics tab ───────────────────────────────────────────────── */
          <div className="space-y-6">
            {/* Score Trend + Weak Areas — two-column */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Score Trend */}
              <div className="lg:col-span-2 rounded-xl border border-border-subtle bg-surface-container/70 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    {t("analytics.scoreTrend")}
                  </span>
                  <span className="font-mono text-[10px] text-text-secondary">
                    {t("analytics.last", { count: trendSessions.filter((s) => s.completedAt).length })}
                  </span>
                </div>
                <ScoreTrendChart
                  sessions={trendSessions}
                  emptyLabel={t("analytics.noData")}
                  locale={locale}
                />
              </div>

              {/* Weak Areas */}
              <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
                <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  {t("analytics.weakAreas")}
                </span>
                <WeakAreasCard
                  stats={categoryStats}
                  emptyLabel={t("analytics.noData")}
                />
              </div>
            </div>

            {/* ── Per-session score history list ──────────────────────────── */}
            <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  {t("recentSessions")}
                </span>
                {sessions.length > 0 && (
                  <Link href="/history" className="text-xs text-primary hover:text-primary/80">
                    {t("viewAll")}
                  </Link>
                )}
              </div>
              {sessions.filter((s) => s.completedAt).length === 0 ? (
                <p className="py-6 text-center text-xs text-text-secondary">{t("analytics.noData")}</p>
              ) : (
                <div className="space-y-2">
                  {sessions
                    .filter((s) => s.completedAt)
                    .map((s) => (
                      <Link
                        key={s.id}
                        href={s.completedAt ? `/session/${s.id}/results` : `/session/${s.id}`}
                        className="flex items-center justify-between rounded-lg border border-border-subtle/60 bg-surface-highest/40 px-4 py-2.5 transition hover:border-primary/30 hover:bg-surface-highest/70"
                      >
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {s.category.replace("_", " ")}
                            {s.targetStack.length > 0 && ` · ${s.targetStack.join(", ")}`}
                          </p>
                          <p className="font-mono text-xs text-text-secondary">
                            {new Date(s.completedAt!).toLocaleDateString(locale)} · {s.difficulty}
                          </p>
                        </div>
                        <p className="font-mono text-sm font-semibold">
                          <ScoreColor score={s.score ?? 0} />
                          <span className="text-text-secondary">/100</span>
                        </p>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
