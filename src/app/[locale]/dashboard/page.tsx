import { redirect } from "next/navigation";
import { Link } from "@/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Clock, Target, TrendingUp } from "lucide-react";
import { getTranslations } from 'next-intl/server';

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-container p-4 shadow-sm">
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

function ScoreColor({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-400"
      : score >= 40
        ? "text-yellow-400"
        : "text-red-400";
  return <span className={color}>{Math.round(score)}</span>;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const t = await getTranslations('Dashboard');

  const [sessions, totalCount] = await Promise.all([
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
  ]);

  const completedSessions = sessions.filter((s) => s.completedAt);
  const avgScore =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
        completedSessions.length
      : 0;
  const totalTime = completedSessions.reduce(
    (sum, s) => sum + (s.duration ?? 0),
    0
  );
  const totalMinutes = Math.round(totalTime / 60);

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            {t('welcome', { name: session.user.name?.split(" ")[0] ?? "Developer" })}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <StatCard
            label={t('stats.sessions')}
            value={totalCount}
            icon={Target}
          />
          <StatCard
            label={t('stats.avgScore')}
            value={avgScore > 0 ? `${Math.round(avgScore)}%` : "—"}
            icon={TrendingUp}
          />
          <StatCard
            label={t('stats.practiceTime')}
            value={totalMinutes > 0 ? `${totalMinutes}m` : "—"}
            icon={Clock}
          />
        </div>

        {/* Recent Sessions */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('recentSessions')}</h2>
            {sessions.length > 0 && (
              <Link
                href="/history"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {t('viewAll')} →
              </Link>
            )}
          </div>
          {sessions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-slate-400">{t('noSessions')}</p>
              <Link
                href="/session/new"
                className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
              >
                {t('startFirst')} →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/session/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-lowest px-4 py-3 transition hover:border-text-secondary"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {s.category.replace("_", " ")}
                      </p>
                      <p className="text-xs text-text-secondary capitalize">
                        {s.difficulty} · {t('questions', { count: s.totalQuestions })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    {s.completedAt ? (
                      <div>
                        <p className="text-sm font-semibold">
                          <ScoreColor score={s.score ?? 0} />
                          <span className="text-slate-500">/100</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(s.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                        {t('inProgress')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
