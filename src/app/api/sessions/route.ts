import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { selectNextQuestion } from "@/lib/questions";
import type { CreateSessionRequest } from "@/types/session";

const VALID_CATEGORIES = ["technical", "coding", "system_design", "behavioral", "mixed"];
const VALID_DIFFICULTIES = ["junior", "mid", "senior"];
const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 15;
const DEMO_MAX_QUESTIONS = 3;

export async function POST(request: Request) {
  const body: CreateSessionRequest & { isDemo?: boolean } = await request.json();
  const { category, difficulty, totalQuestions, language = "en", feedbackMode = "live", targetStack, outputModality, isDemo = false } = body;

  // Auth: required for regular sessions, skipped for demo
  let userId: string | undefined;
  if (!isDemo) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.user.id;
  }

  const resolvedCategory = isDemo ? (VALID_CATEGORIES.includes(category) ? category : "technical") : category;
  const resolvedDifficulty = isDemo ? (VALID_DIFFICULTIES.includes(difficulty) ? difficulty : "mid") : difficulty;
  const resolvedQuestions = isDemo
    ? Math.min(Number(totalQuestions) || DEMO_MAX_QUESTIONS, DEMO_MAX_QUESTIONS)
    : totalQuestions;

  if (!VALID_CATEGORIES.includes(resolvedCategory)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!VALID_DIFFICULTIES.includes(resolvedDifficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }
  if (!Number.isInteger(resolvedQuestions) || resolvedQuestions < MIN_QUESTIONS || resolvedQuestions > MAX_QUESTIONS) {
    return NextResponse.json({ error: "Invalid question count" }, { status: 400 });
  }

  try {
    const interviewSession = await prisma.session.create({
      data: {
        ...(userId ? { userId } : {}),
        isDemo,
        category: resolvedCategory,
        difficulty: resolvedDifficulty,
        totalQuestions: resolvedQuestions,
        language,
        feedbackMode: ["live", "silent"].includes(feedbackMode) ? feedbackMode : "live",
        inputModality: outputModality === "voice" ? "voice" : "text",
        targetStack: targetStack?.length ? targetStack : ["angular", "spring_boot", "postgresql"],
      },
    });

    const firstQuestion = await selectNextQuestion({
      category: resolvedCategory as Parameters<typeof selectNextQuestion>[0]["category"],
      difficulty: resolvedDifficulty as Parameters<typeof selectNextQuestion>[0]["difficulty"],
      stack: interviewSession.targetStack,
      language: language as "en" | "es",
      userId,
    });

    await prisma.sessionMessage.create({
      data: {
        sessionId: interviewSession.id,
        role: "interviewer",
        content: firstQuestion.text,
        messageType: "question",
        questionIndex: 1,
      },
    });

    return NextResponse.json({ sessionId: interviewSession.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json({ error: "Failed to create session. Please try again." }, { status: 500 });
  }
}
