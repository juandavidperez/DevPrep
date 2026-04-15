import { LandingPage } from "@/components/LandingPage";
import { prisma } from "@/lib/db";

export default async function Home() {
  const categories = ["technical", "coding", "system_design", "behavioral"] as const;

  const [questionCount, sessionCount, ...categoryQuestions] = await Promise.all([
    prisma.questionBank.count({ where: { isActive: true } }),
    prisma.session.count({ where: { completedAt: { not: null }, isDemo: false } }),
    ...categories.map((category) =>
      prisma.questionBank.findFirst({
        where: { isActive: true, language: "en", category },
        orderBy: { timesServed: "asc" },
        select: { id: true, category: true, difficulty: true, questionText: true, tags: true },
      })
    ),
  ]);

  const sampleQuestions = categoryQuestions.filter(Boolean) as {
    id: string;
    category: string;
    difficulty: string;
    questionText: string;
    tags: string[];
  }[];

  return (
    <LandingPage
      stats={{ questionCount, sessionCount }}
      sampleQuestions={sampleQuestions}
    />
  );
}
