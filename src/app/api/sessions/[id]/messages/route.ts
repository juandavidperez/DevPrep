import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/ai";
import type { Question, SessionConfig } from "@/lib/ai/types";
import type { SendMessageRequest } from "@/types/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body: SendMessageRequest = await request.json();
  const { content, codeContent } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const interviewSession = await prisma.session.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (interviewSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (interviewSession.completedAt) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  const questionMessages = interviewSession.messages.filter(
    (m) => m.messageType === "question"
  );
  const currentQuestionIndex = questionMessages.length;
  const lastQuestion = questionMessages[questionMessages.length - 1];

  if (!lastQuestion) {
    return NextResponse.json({ error: "No question found" }, { status: 400 });
  }

  try {
    const ai = getAIProvider();

    // Build question object for evaluation
    const question: Question = {
      id: lastQuestion.id,
      text: lastQuestion.content,
      category: interviewSession.category as Question["category"],
      difficulty: interviewSession.difficulty as Question["difficulty"],
    };

    // Evaluate response
    const evaluation = await ai.evaluateResponse(question, content, codeContent ?? undefined);

    // Save user message
    const userMessage = await prisma.sessionMessage.create({
      data: {
        sessionId: id,
        role: "candidate",
        content,
        codeContent: codeContent ?? null,
        messageType: "message",
        questionIndex: currentQuestionIndex,
      },
    });

    // Save evaluation
    const evalMessage = await prisma.sessionMessage.create({
      data: {
        sessionId: id,
        role: "interviewer",
        content: evaluation.feedback,
        messageType: "evaluation",
        questionIndex: currentQuestionIndex,
        score: evaluation.score,
        criteria: evaluation.criteria as Record<string, number>,
        feedback: evaluation.feedback,
        modelAnswer: evaluation.modelAnswer ?? null,
      },
    });

    const newMessages = [userMessage, evalMessage];
    const isComplete = currentQuestionIndex >= interviewSession.totalQuestions;

    if (isComplete) {
      // Calculate average score
      const allScores = interviewSession.messages
        .filter((m) => m.score !== null)
        .map((m) => m.score as number);
      allScores.push(evaluation.score);
      const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

      const duration = Math.floor(
        (Date.now() - interviewSession.createdAt.getTime()) / 1000
      );

      await prisma.session.update({
        where: { id },
        data: { completedAt: new Date(), score: avgScore, duration },
      });

      return NextResponse.json({
        messages: newMessages,
        isComplete: true,
        finalScore: Math.round(avgScore),
      });
    }

    // Generate next question
    const aiConfig: SessionConfig = {
      count: 1,
      category: interviewSession.category as SessionConfig["category"],
      difficulty: interviewSession.difficulty as SessionConfig["difficulty"],
      stack: interviewSession.targetStack,
      language: interviewSession.language as "en" | "es",
      existingQuestions: questionMessages.map((m) => m.content),
    };

    const nextQuestions = await ai.generateQuestions(aiConfig);
    const nextQuestion = nextQuestions[0];

    const nextQuestionMessage = await prisma.sessionMessage.create({
      data: {
        sessionId: id,
        role: "interviewer",
        content: nextQuestion.text,
        messageType: "question",
        questionIndex: currentQuestionIndex + 1,
      },
    });

    newMessages.push(nextQuestionMessage);

    return NextResponse.json({
      messages: newMessages,
      isComplete: false,
    });
  } catch (error) {
    console.error("Failed to process message:", error);
    return NextResponse.json(
      { error: "Failed to process message. Is the AI provider running?" },
      { status: 500 }
    );
  }
}
