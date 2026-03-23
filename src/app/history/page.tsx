import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ArrowLeft, History } from "lucide-react";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { SessionList } from "@/components/history/SessionList";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{
    category?: string;
    difficulty?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const category = params.category || "all";
  const difficulty = params.difficulty || "all";
  const status = params.status || "all";
  const sort = params.sort || "newest";

  // Build where clause
  const where: Prisma.SessionWhereInput = { userId: session.user.id };
  if (category !== "all") where.category = category;
  if (difficulty !== "all") where.difficulty = difficulty;
  if (status === "completed") where.completedAt = { not: null };
  else if (status === "in_progress") where.completedAt = null;

  // Build orderBy
  let orderBy: Prisma.SessionOrderByWithRelationInput;
  switch (sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "score_high":
      orderBy = { score: { sort: "desc", nulls: "last" } };
      break;
    case "score_low":
      orderBy = { score: { sort: "asc", nulls: "last" } };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [sessions, totalCount] = await Promise.all([
    prisma.session.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
    prisma.session.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const serialized = sessions.map((s) => ({
    id: s.id,
    category: s.category,
    difficulty: s.difficulty,
    totalQuestions: s.totalQuestions,
    score: s.score,
    completedAt: s.completedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    duration: s.duration,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" />
              <h1 className="text-2xl font-bold">Session History</h1>
            </div>
            <p className="text-sm text-slate-400">
              {totalCount} session{totalCount !== 1 && "s"} total
            </p>
          </div>
        </div>

        {/* Filters */}
        <HistoryFilters
          category={category}
          difficulty={difficulty}
          status={status}
          sort={sort}
        />

        {/* Session list */}
        <SessionList
          sessions={serialized}
          page={page}
          totalPages={totalPages}
          category={category}
          difficulty={difficulty}
          status={status}
          sort={sort}
        />
      </div>
    </main>
  );
}
