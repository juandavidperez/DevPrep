import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ResultsView } from "@/components/session/ResultsView";
import type { QuestionResult, ResultsData, CriterionScore } from "@/types/session";

function buildQuestionResults(
  messages: {
    role: string;
    content: string;
    codeContent: string | null;
    messageType: string;
    questionIndex: number | null;
    score: number | null;
    criteria: unknown;
    feedback: string | null;
    modelAnswer: string | null;
    id: string;
    bookmark: { id: string } | null;
  }[]
): QuestionResult[] {
  const grouped = new Map<
    number,
    { question?: string; answer?: string; code?: string | null; score?: number | null; criteria?: Record<string, number> | null; feedback?: string | null; modelAnswer?: string | null; evalId?: string; bookmarkId?: string | null }
  >();

  for (const m of messages) {
    if (m.questionIndex == null) continue;
    const entry = grouped.get(m.questionIndex) ?? {};

    if (m.messageType === "question" && m.role === "interviewer") {
      entry.question = m.content;
    } else if (m.role === "candidate") {
      entry.answer = m.content;
      entry.code = m.codeContent;
    } else if (m.messageType === "evaluation") {
      entry.score = m.score;
      entry.criteria = m.criteria as Record<string, number> | null;
      entry.feedback = m.feedback;
      entry.modelAnswer = m.modelAnswer;
      entry.evalId = m.id;
      entry.bookmarkId = m.bookmark?.id ?? null;
    }

    grouped.set(m.questionIndex, entry);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([idx, data]) => ({
      questionIndex: idx,
      questionText: data.question ?? "",
      candidateAnswer: data.answer ?? "",
      candidateCode: data.code ?? null,
      score: data.score ?? null,
      criteria: data.criteria ?? null,
      feedback: data.feedback ?? null,
      modelAnswer: data.modelAnswer ?? null,
      evaluationMessageId: data.evalId ?? null,
      bookmarkId: data.bookmarkId ?? null,
    }));
}

function computeStrengthsWeaknesses(questions: QuestionResult[]): {
  strengths: CriterionScore[];
  weaknesses: CriterionScore[];
  criteriaAverages: Record<string, number>;
} {
  const sums = new Map<string, { total: number; count: number }>();

  for (const q of questions) {
    if (!q.criteria) continue;
    for (const [key, value] of Object.entries(q.criteria)) {
      if (typeof value !== "number") continue;
      const normalized = key.toLowerCase();
      const entry = sums.get(normalized) ?? { total: 0, count: 0 };
      entry.total += value;
      entry.count += 1;
      sums.set(normalized, entry);
    }
  }

  const averages: Record<string, number> = {};
  const sorted: CriterionScore[] = [];

  for (const [criterion, { total, count }] of sums) {
    const avg = Math.round(total / count);
    averages[criterion] = avg;
    sorted.push({ criterion, avgScore: avg });
  }

  sorted.sort((a, b) => b.avgScore - a.avgScore);

  const strengths = sorted.slice(0, 3).filter((s) => s.avgScore >= 60);
  const weaknesses = sorted
    .slice(-3)
    .filter((s) => s.avgScore < sorted[0]?.avgScore)
    .reverse();

  return { strengths, weaknesses: weaknesses.reverse(), criteriaAverages: averages };
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const interviewSession = await prisma.session.findUnique({
    where: { id },
    include: {
      messages: { 
        orderBy: { createdAt: "asc" },
        include: { bookmark: { select: { id: true } } }
      },
    },
  });

  if (!interviewSession || interviewSession.userId !== session.user.id) {
    redirect("/dashboard");
  }

  if (!interviewSession.completedAt) {
    redirect(`/session/${id}`);
  }

  const questions = buildQuestionResults(interviewSession.messages);
  const { strengths, weaknesses, criteriaAverages } =
    computeStrengthsWeaknesses(questions);

  const resultsData: ResultsData = {
    id: interviewSession.id,
    category: interviewSession.category,
    difficulty: interviewSession.difficulty,
    totalQuestions: interviewSession.totalQuestions,
    completedAt: interviewSession.completedAt.toISOString(),
    overallScore: interviewSession.score ?? 0,
    duration: interviewSession.duration,
    questions,
    strengths,
    weaknesses,
    criteriaAverages,
  };

  return <ResultsView data={resultsData} />;
}
