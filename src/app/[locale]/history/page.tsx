import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { SessionList } from "@/components/history/SessionList";
import { getTranslations } from "next-intl/server";
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

  const t = await getTranslations("History");

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
        messages: {
          where: { messageType: "question" },
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { content: true },
        },
        _count: {
          select: {
            messages: {
              where: { messageType: "evaluation" },
            },
          },
        },
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
    snippet: s.messages[0]?.content ?? null,
    answeredQuestions: s._count.messages,
  }));

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-8 py-12 space-y-8">
        {/* Header Section */}
        <section className="w-full">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-2 font-medium text-text-secondary">
            {t("subtitle")}
          </p>
        </section>

        {/* Filters Section */}
        <HistoryFilters
          category={category}
          difficulty={difficulty}
          status={status}
          sort={sort}
        />

        {/* List Section */}
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
