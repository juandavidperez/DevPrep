import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/ai";
import type { Question, QuestionCategory, Difficulty, SessionConfig } from "@/lib/ai/types";

interface SelectQuestionOptions {
  category: QuestionCategory | "mixed";
  difficulty: Difficulty;
  stack: string[];
  language: "en" | "es";
  userId: string;
  existingQuestions?: string[];
}

/**
 * Smart question selector: bank first → AI fallback.
 *
 * Priority within the bank:
 *   1. Bookmarked questions due for spaced repetition review
 *   2. Unseen questions (least served first)
 *   3. AI-generated fallback if bank is exhausted
 */
export async function selectNextQuestion(
  options: SelectQuestionOptions
): Promise<Question> {
  const { category, difficulty, language, userId, existingQuestions = [] } = options;

  // 1. Try spaced repetition queue (bookmarked questions due for review)
  const fromRepetition = await selectFromSpacedRepetition(
    userId,
    category,
    difficulty,
    language,
    existingQuestions
  );
  if (fromRepetition) return fromRepetition;

  // 2. Try question bank (unseen/least served)
  const fromBank = await selectFromBank(
    category,
    difficulty,
    language,
    existingQuestions
  );
  if (fromBank) return fromBank;

  // 3. Fallback to AI generation
  return selectFromAI(options);
}

async function selectFromSpacedRepetition(
  userId: string,
  category: QuestionCategory | "mixed",
  difficulty: Difficulty,
  language: string,
  existingQuestions: string[]
): Promise<Question | null> {
  // Find bookmarked questions that are due for review
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      nextReviewAt: { lte: new Date() },
      message: {
        messageType: "question",
        session: {
          ...(category !== "mixed" && { category }),
          difficulty,
        },
      },
    },
    include: {
      message: {
        include: { session: true },
      },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 5,
  });

  // Find the first one not already used in this session
  for (const bookmark of bookmarks) {
    const questionText = bookmark.message.content;
    if (!existingQuestions.includes(questionText)) {
      return {
        id: bookmark.message.id,
        text: questionText,
        category: bookmark.message.session.category as QuestionCategory,
        difficulty: bookmark.message.session.difficulty as Difficulty,
      };
    }
  }

  return null;
}

async function selectFromBank(
  category: QuestionCategory | "mixed",
  difficulty: Difficulty,
  language: string,
  existingQuestions: string[]
): Promise<Question | null> {
  const where: Record<string, unknown> = {
    difficulty,
    language,
    isActive: true,
  };
  if (category !== "mixed") {
    where.category = category;
  }

  // Get least-served questions, pick one not already used in this session
  const candidates = await prisma.questionBank.findMany({
    where,
    orderBy: { timesServed: "asc" },
    take: 20,
  });

  const question = candidates.find(
    (q) => !existingQuestions.includes(q.questionText)
  );

  if (!question) return null;

  // Increment timesServed
  await prisma.questionBank.update({
    where: { id: question.id },
    data: { timesServed: { increment: 1 } },
  });

  return {
    id: question.id,
    text: question.questionText,
    category: question.category as QuestionCategory,
    difficulty: question.difficulty as Difficulty,
    hints: question.hints.length > 0 ? question.hints : undefined,
    modelAnswer: question.modelAnswer ?? undefined,
    codeTemplate: question.codeTemplate ?? undefined,
    codeLanguage: question.codeLanguage ?? undefined,
  };
}

async function selectFromAI(options: SelectQuestionOptions): Promise<Question> {
  const config: SessionConfig = {
    count: 1,
    category: options.category as SessionConfig["category"],
    difficulty: options.difficulty,
    stack: options.stack,
    language: options.language,
    existingQuestions: options.existingQuestions,
  };

  const ai = getAIProvider();
  const questions = await ai.generateQuestions(config);
  return questions[0];
}

/**
 * Update the average score for a question bank entry after evaluation.
 * Matches by question text since we don't store a FK to QuestionBank.
 */
export async function updateQuestionBankScore(
  questionText: string,
  score: number
): Promise<void> {
  const question = await prisma.questionBank.findFirst({
    where: { questionText },
    select: { id: true, avgScore: true, timesServed: true },
  });

  if (!question) return; // AI-generated question, not in bank

  // Running average: newAvg = ((oldAvg * (n-1)) + score) / n
  const n = question.timesServed || 1;
  const oldAvg = question.avgScore ?? score;
  const newAvg = ((oldAvg * (n - 1)) + score) / n;

  await prisma.questionBank.update({
    where: { id: question.id },
    data: { avgScore: newAvg },
  });
}
