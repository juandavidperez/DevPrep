import { redirect } from "next/navigation";
import { Link } from "@/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { Clock, Target, TrendingUp, TrendingDown, ArrowRight, MonitorPlay, Flame } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { DashboardTopbar } from "@/components/DashboardTopbar";

// ── Course cards ───────────────────────────────────────────────────────────────
const COURSE_CARDS = [
  {
    titleKey: "course.sql.title",
    descKey: "course.sql.desc",
    tagKey: "course.sql.tag",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCApMWdIT50_qgBenziFXqNtiZX1M6hJ6yzTlz7QSMB2Kish6YwDsbmDT4VGbgWWo_COEmLVq3YZbLE3zCYVqNLtFhgFqRguOOn_IUIZYkfo6T_5ooHNgUFVtUKz3E84k_BrXtscOraeJbiwHNJwA4O4ep2V-K4UJiWjZwXD3ZEdhMMI6n6JG20ObtErFSjZp0jN-YziUMuMpEl1RIni-2Ua20_VHhwmgcS-guyTgsUj2awlzRc9KzMIAivstlYnI9QqrlI4NlGVUIq",
  },
  {
    titleKey: "course.design.title",
    descKey: "course.design.desc",
    tagKey: "course.design.tag",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdsUfheqNX1VLjaxcUZvsAnJtvJmcnLjPKf-thLbLHeN5R5pw1cWs0ThwMKRygMBUaLvsxvvY8do33HqTiVPX_g6hi9DFBhI_hIjM3N-oQwskCGlThbWHvfEOHaiDGhx3-nOiEOuRC9h_2qTIybhuox6a4NiYQSuNUYWHEG5gQRachODGd1DCtJadv4RsSC3WMEkdsCuJZdifY6VNQcXunkE2P_7w1DJboqeSR_TVUYWCWiy2FAdcMlLAADohXE6lW5bAVIaaLbJiN",
  },
] as const;

// ── Sub-components ─────────────────────────────────────────────────────────────

function DeltaBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs ${
        isPositive
          ? "bg-emerald-400/10 text-emerald-400"
          : "bg-red-400/10 text-red-400"
      }`}
    >
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}
      {value}% {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  delta?: number | null;
  deltaLabel?: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          {label}
        </span>
        <Icon className="h-4 w-4 text-text-secondary" />
      </div>
      <p className="mt-4 font-mono text-4xl font-bold text-text-primary">{value}</p>
      <div className="mt-3 min-h-[20px]">
        {delta !== undefined && delta !== null ? (
          <DeltaBadge value={delta} label={deltaLabel ?? ""} />
        ) : subtext ? (
          <p className="text-xs text-text-secondary">{subtext}</p>
        ) : null}
      </div>
    </div>
  );
}

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
}: {
  sessions: Array<{ score: number | null; category: string; completedAt: Date | string | null }>;
  emptyLabel: string;
}) {
  const data = sessions
    .filter((s) => s.completedAt && s.score !== null)
    .slice(0, 8)
    .reverse();

  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-xs text-text-secondary">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex h-24 items-end gap-1.5 px-1">
      {data.map((s, i) => {
        const score = Math.round(s.score!);
        const barColor =
          score >= 70
            ? "bg-emerald-400/60 group-hover:bg-emerald-400"
            : score >= 40
              ? "bg-yellow-400/60 group-hover:bg-yellow-400"
              : "bg-red-400/60 group-hover:bg-red-400";
        return (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
            <span className="pointer-events-none absolute -top-5 hidden rounded bg-surface-highest px-1.5 py-0.5 font-mono text-[10px] text-text-primary group-hover:block">
              {score}
            </span>
            <div
              style={{ height: `${Math.max(score, 4)}%` }}
              className={`w-full rounded-t-sm transition-colors ${barColor}`}
            />
            <span className="text-[9px] text-text-secondary">
              {CATEGORY_SHORT[s.category] ?? "?"}
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

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const uniqueDays = new Set(dates.map((d) => dayKey(new Date(d))));
  const now = new Date();
  const todayKey = dayKey(now);

  const cursor = new Date(now);
  if (!uniqueDays.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!uniqueDays.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  const check = new Date(cursor);
  while (uniqueDays.has(dayKey(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
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
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const t = await getTranslations("Dashboard");
  const { q } = await searchParams;
  const query = q?.toLowerCase().trim() ?? "";

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [sessions, totalCount, currentPeriodSessions, prevPeriodSessions, categoryStats, allDates] =
    await Promise.all([
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
        },
      }),
      prisma.session.count({ where: { userId: session.user.id } }),
      prisma.session.findMany({
        where: { userId: session.user.id, createdAt: { gte: thirtyDaysAgo } },
        select: { score: true, completedAt: true, duration: true },
      }),
      prisma.session.findMany({
        where: { userId: session.user.id, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        select: { score: true, completedAt: true, duration: true },
      }),
      prisma.session.groupBy({
        by: ["category"],
        where: { userId: session.user.id, completedAt: { not: null }, score: { not: null } },
        _avg: { score: true },
        _count: { _all: true },
      }),
      prisma.session.findMany({
        where: { userId: session.user.id },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    ]);

  const filteredSessions = query
    ? sessions.filter(
        (s) =>
          s.category.toLowerCase().includes(query) ||
          s.difficulty.toLowerCase().includes(query),
      )
    : sessions;

  const completedSessions = sessions.filter((s) => s.completedAt);
  const avgScore =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / completedSessions.length
      : 0;
  const totalMinutes = Math.round(
    completedSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0) / 60,
  );

  const calcDelta = (current: number, prev: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((current - prev) / prev) * 100);
  };

  const sessionsDelta = calcDelta(currentPeriodSessions.length, prevPeriodSessions.length);

  const currentCompleted = currentPeriodSessions.filter((s) => s.completedAt);
  const currentMinutes = Math.round(
    currentCompleted.reduce((sum, s) => sum + (s.duration ?? 0), 0) / 60,
  );

  const scorePercentile =
    avgScore > 0 ? Math.max(1, Math.round((1 - avgScore / 100) * 100)) : null;

  const streak = calculateStreak(allDates.map((s) => s.createdAt));
  const trendSessions = sessions.slice(0, 8);

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

        {/* ── Stats — 4 columns ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label={t("stats.sessions")}
            value={totalCount}
            icon={Target}
            delta={sessionsDelta ?? 0}
            deltaLabel={(sessionsDelta ?? 0) >= 0 ? t("stats.deltaIncrease") : t("stats.deltaDecrease")}
          />
          <StatCard
            label={t("stats.avgScore")}
            value={avgScore > 0 ? `${Math.round(avgScore)}%` : "– –"}
            icon={TrendingUp}
            subtext={
              scorePercentile !== null
                ? t("stats.scoreSubtext", { percentile: scorePercentile })
                : t("stats.scoreSubtext", { percentile: 0 })
            }
          />
          <StatCard
            label={t("stats.practiceTime")}
            value={totalMinutes > 0 ? `${totalMinutes}m` : "– –"}
            icon={Clock}
            subtext={t("stats.timeSubtext", { count: currentMinutes })}
          />
          <StatCard
            label={t("stats.streak")}
            value={streak > 0 ? `${streak}d` : "– –"}
            icon={Flame}
            subtext={streak > 0 ? t("stats.streakActive") : t("stats.streakStart")}
          />
        </div>

        {/* ── Analytics ────────────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
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

        {/* ── Recent Sessions — full width ─────────────────────────────────── */}
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
                  href={`/session/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-container/70 px-5 py-3.5 backdrop-blur-[20px] transition hover:border-primary/30 hover:bg-surface-highest/50"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{s.category.replace("_", " ")}</p>
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

        {/* ── Course cards ─────────────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">{t("suggestedPractice")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {COURSE_CARDS.map((card) => (
              <Link
                key={card.titleKey}
                href="/session/new"
                className="group relative flex h-48 flex-col justify-end overflow-hidden rounded-xl border border-border-subtle shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition hover:border-primary/30"
              >
                <Image
                  src={card.image}
                  alt={t(card.titleKey)}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative z-10 p-4">
                  <span className="rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                    {t(card.tagKey)}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-white">{t(card.titleKey)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/60">{t(card.descKey)}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
                    {t("practice")} <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
