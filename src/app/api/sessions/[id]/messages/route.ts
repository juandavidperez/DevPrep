import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAIProvider, getDemoAIProvider } from "@/lib/ai";
import { selectNextQuestion, updateQuestionBankScore } from "@/lib/questions";
import type { Question } from "@/lib/ai/types";
import type { SendMessageRequest } from "@/types/session";

export const maxDuration = 60; // seconds — allows AI to complete evaluation and DB updates

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: SendMessageRequest = await request.json();
  const { content, codeContent, isClarification = false } = body;

  if (!content?.trim() && !codeContent?.trim()) {
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

  // Auth check: skipped for demo sessions, enforced for authenticated sessions
  if (!interviewSession.isDemo) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (interviewSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

  const ai = interviewSession.isDemo
    ? getDemoAIProvider()
    : getAIProvider(interviewSession.category as Parameters<typeof getAIProvider>[0]);

  // ── Clarification path ─────────────────────────────────────────────────────
  if (isClarification) {
    try {
      const clarificationMessage = await prisma.sessionMessage.create({
        data: {
          sessionId: id,
          role: "candidate",
          content,
          messageType: "clarification",
          questionIndex: currentQuestionIndex,
        },
      });

      const clarificationStart = Date.now();
      const answer = await ai.answerClarification(lastQuestion.content, content);
      const clarificationLatencyMs = Date.now() - clarificationStart;

      const clarificationAnswer = await prisma.sessionMessage.create({
        data: {
          sessionId: id,
          role: "interviewer",
          content: answer,
          messageType: "clarification_answer",
          questionIndex: currentQuestionIndex,
          aiLatencyMs: clarificationLatencyMs,
        },
      });

      return NextResponse.json({
        messages: [clarificationMessage, clarificationAnswer],
        isComplete: false,
      });
    } catch (error) {
      console.error("Failed to process clarification:", error);
      const message =
        error instanceof Error && error.message
          ? `Failed to process clarification: ${error.message}`
          : "Failed to process clarification. Please try again.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ── Answer path ────────────────────────────────────────────────────────────

  // Detect copy-paste of the question as the answer
  const isCopied =
    content.trim().toLowerCase() === lastQuestion.content.trim().toLowerCase() ||
    content.trim().toLowerCase().includes(lastQuestion.content.trim().toLowerCase());

  try {
    const question: Question = {
      id: lastQuestion.id,
      text: lastQuestion.content,
      category: interviewSession.category as Question["category"],
      difficulty: interviewSession.difficulty as Question["difficulty"],
    };

    const isSilent = interviewSession.feedbackMode === "silent";
    const isComplete = currentQuestionIndex >= interviewSession.totalQuestions;

    // Save user answer
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

    const newMessages = [userMessage];

    if (isSilent && !isComplete) {
      // Silent mode, not last question: skip evaluation, just give next question
      const nextQuestion = await selectNextQuestion({
        category: interviewSession.category as Parameters<typeof selectNextQuestion>[0]["category"],
        difficulty: interviewSession.difficulty as Parameters<typeof selectNextQuestion>[0]["difficulty"],
        stack: interviewSession.targetStack,
        language: interviewSession.language as "en" | "es",
        userId: interviewSession.userId ?? undefined,
        existingQuestions: questionMessages.map((m) => m.content),
      });

      const nextQuestionMessage = await prisma.sessionMessage.create({
        data: {
          sessionId: id,
          role: "interviewer",
          content: nextQuestion.text,
          messageType: "question",
          questionIndex: currentQuestionIndex + 1,
          timeEstimate: nextQuestion.timeEstimate,
        },
      });

      newMessages.push(nextQuestionMessage);

      return NextResponse.json({ messages: newMessages, isComplete: false });
    }

    if (isSilent && isComplete) {
      // Silent mode, last question: batch evaluate all answers in parallel
      const allQuestions = interviewSession.messages.filter(
        (m) => m.messageType === "question"
      );
      const previousAnswers = interviewSession.messages.filter(
        (m) => m.messageType === "message" && m.role === "candidate"
      );
      const allAnswers = [...previousAnswers, userMessage];

      const evaluations = await Promise.all(
        allAnswers.map(async (ans, i) => {
          const q = allQuestions[i];
          if (!q) return null;
          const qObj: Question = {
            id: q.id,
            text: q.content,
            category: interviewSession.category as Question["category"],
            difficulty: interviewSession.difficulty as Question["difficulty"],
          };
          const answerIsCopied =
            ans.content.trim().toLowerCase() === q.content.trim().toLowerCase() ||
            ans.content.trim().toLowerCase().includes(q.content.trim().toLowerCase());

          if (answerIsCopied) {
            return { evaluation: { score: 0, criteria: { correctness: 0, depth: 0, clarity: 0, practical_examples: 0 }, feedback: "Your response appears to be a copy of the question.", modelAnswer: "" }, latencyMs: 0 };
          }
          const t = Date.now();
          const evaluation = await ai.evaluateResponse(qObj, ans.content, ans.codeContent ?? undefined);
          return { evaluation, latencyMs: Date.now() - t };
        })
      );

      const evalMessages = await Promise.all(
        evaluations.map((result, i) => {
          if (!result) return null;
          const { evaluation: ev, latencyMs } = result;
          return prisma.sessionMessage.create({
            data: {
              sessionId: id,
              role: "interviewer",
              content: ev.feedback,
              messageType: "evaluation",
              questionIndex: allQuestions[i]?.questionIndex ?? i + 1,
              score: ev.score,
              criteria: ev.criteria as Record<string, number>,
              feedback: ev.feedback,
              modelAnswer: ev.modelAnswer ?? null,
              aiLatencyMs: latencyMs,
            },
          });
        })
      );

      const validEvals = evalMessages.filter(Boolean);
      const scores = evaluations.filter(Boolean).map((r) => r!.evaluation.score);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const finalScore = isNaN(avgScore) ? 0 : Math.round(avgScore);

      const firstMessage = interviewSession.messages[0];
      const durationStart = firstMessage?.createdAt.getTime() ?? interviewSession.createdAt.getTime();
      const duration = Math.floor((Date.now() - durationStart) / 1000);

      console.log(`[Session Completion] ID: ${id}, Scores: ${scores}, Avg: ${avgScore}, Final: ${finalScore}, Duration: ${duration}`);

      await prisma.session.update({
        where: { id },
        data: { 
          completedAt: new Date(), 
          score: finalScore, 
          duration 
        },
      });

      console.log(`[Session Completion] Successfully updated session ${id}`);

      // Update question bank scores (fire and forget)
      evaluations.forEach((result, i) => {
        if (!result) return;
        const q = allQuestions[i];
        if (q) updateQuestionBankScore(q.content, result.evaluation.score).catch(() => {});
      });

      return NextResponse.json({
        messages: [...newMessages, ...validEvals],
        isComplete: true,
        finalScore: Math.round(avgScore),
      });
    }

    // Live mode: evaluate immediately
    let aiLatencyMs: number | null = null;
    const evaluation = isCopied
      ? {
          score: 0,
          criteria: Object.fromEntries(
            ["correctness", "depth", "clarity", "practical_examples"].map((k) => [k, 0])
          ),
          feedback:
            "Your response appears to be a copy of the question. Please provide your own answer.",
          modelAnswer: "",
        }
      : await (async () => {
          const t = Date.now();
          const result = await ai.evaluateResponse(question, content, codeContent ?? undefined);
          aiLatencyMs = Date.now() - t;
          return result;
        })();

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
        aiLatencyMs,
      },
    });

    newMessages.push(evalMessage);

    updateQuestionBankScore(lastQuestion.content, evaluation.score).catch(() => {});

    if (isComplete) {
      const allScores = interviewSession.messages
        .filter((m) => m.score !== null)
        .map((m) => m.score as number);
      allScores.push(evaluation.score);
      const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      const finalScore = isNaN(avgScore) ? 0 : Math.round(avgScore);

      const firstMessage = interviewSession.messages[0];
      const durationStart = firstMessage?.createdAt.getTime() ?? interviewSession.createdAt.getTime();
      const duration = Math.floor((Date.now() - durationStart) / 1000);

      console.log(`[Session Completion] ID: ${id}, AllScores: ${allScores}, Avg: ${avgScore}, Final: ${finalScore}, Duration: ${duration}`);

      await prisma.session.update({
        where: { id },
        data: { 
          completedAt: new Date(), 
          score: finalScore, 
          duration 
        },
      });

      console.log(`[Session Completion] Successfully updated session ${id}`);

      return NextResponse.json({
        messages: newMessages,
        isComplete: true,
        finalScore,
      });
    }

    const nextQuestion = await selectNextQuestion({
      category: interviewSession.category as Parameters<typeof selectNextQuestion>[0]["category"],
      difficulty: interviewSession.difficulty as Parameters<typeof selectNextQuestion>[0]["difficulty"],
      stack: interviewSession.targetStack,
      language: interviewSession.language as "en" | "es",
      userId: interviewSession.userId ?? undefined,
      existingQuestions: questionMessages.map((m) => m.content),
    });

    const nextQuestionMessage = await prisma.sessionMessage.create({
      data: {
        sessionId: id,
        role: "interviewer",
        content: nextQuestion.text,
        messageType: "question",
        questionIndex: currentQuestionIndex + 1,
        timeEstimate: nextQuestion.timeEstimate,
      },
    });

    newMessages.push(nextQuestionMessage);

    return NextResponse.json({ messages: newMessages, isComplete: false });
  } catch (error) {
    console.error("Failed to process message:", error);
    const message =
      error instanceof Error && error.message
        ? `Failed to process message: ${error.message}`
        : "Failed to process message. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
