import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Plus, Clock, Target, TrendingUp, LogOut } from "lucide-react";

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
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {session.user.name?.split(" ")[0] ?? "Developer"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Ready for your next interview practice?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/session/new"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              New Session
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition hover:border-slate-500 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <StatCard
            label="Sessions"
            value={totalCount}
            icon={Target}
          />
          <StatCard
            label="Avg. Score"
            value={avgScore > 0 ? `${Math.round(avgScore)}%` : "—"}
            icon={TrendingUp}
          />
          <StatCard
            label="Practice Time"
            value={totalMinutes > 0 ? `${totalMinutes}m` : "—"}
            icon={Clock}
          />
        </div>

        {/* Recent Sessions */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            {sessions.length > 0 && (
              <Link
                href="/history"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View all →
              </Link>
            )}
          </div>
          {sessions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-slate-400">No sessions yet</p>
              <Link
                href="/session/new"
                className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
              >
                Start your first interview →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/session/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 transition hover:border-slate-500"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {s.category.replace("_", " ")}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {s.difficulty} · {s.totalQuestions} questions
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
                        In Progress
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
