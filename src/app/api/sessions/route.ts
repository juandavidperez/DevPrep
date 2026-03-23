import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { selectNextQuestion } from "@/lib/questions";
import type { CreateSessionRequest } from "@/types/session";

const VALID_CATEGORIES = ["technical", "coding", "system_design", "behavioral", "mixed"];
const VALID_DIFFICULTIES = ["junior", "mid", "senior"];
const VALID_COUNTS = [5, 10, 15];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: CreateSessionRequest = await request.json();
  const { category, difficulty, totalQuestions, language = "en" } = body;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }
  if (!VALID_COUNTS.includes(totalQuestions)) {
    return NextResponse.json({ error: "Invalid question count" }, { status: 400 });
  }

  try {
    const interviewSession = await prisma.session.create({
      data: {
        userId: session.user.id,
        category,
        difficulty,
        totalQuestions,
        language,
        targetStack: ["angular", "spring_boot", "postgresql", "typescript", "java"],
      },
    });

    const firstQuestion = await selectNextQuestion({
      category: category as Parameters<typeof selectNextQuestion>[0]["category"],
      difficulty: difficulty as Parameters<typeof selectNextQuestion>[0]["difficulty"],
      stack: interviewSession.targetStack,
      language: language as "en" | "es",
      userId: session.user.id,
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
    return NextResponse.json(
      { error: "Failed to create session. Is the AI provider running?" },
      { status: 500 }
    );
  }
}
