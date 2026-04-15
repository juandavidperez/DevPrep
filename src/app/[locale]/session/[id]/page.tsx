import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChatContainer } from "@/components/session/ChatContainer";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const interviewSession = await prisma.session.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { bookmark: { select: { id: true } } },
      },
    },
  });

  if (!interviewSession) {
    redirect("/dashboard");
  }

  if (!interviewSession.isDemo) {
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/auth/signin");
    }
    if (interviewSession.userId !== session.user.id) {
      redirect("/dashboard");
    }
  }

  const sessionData = {
    id: interviewSession.id,
    category: interviewSession.category,
    difficulty: interviewSession.difficulty,
    totalQuestions: interviewSession.totalQuestions,
    completedAt: interviewSession.completedAt?.toISOString() ?? null,
    score: interviewSession.score,
    feedbackMode: interviewSession.feedbackMode,
    inputModality: interviewSession.inputModality ?? "text",
    language: interviewSession.language ?? "en",
  };

  const messages = interviewSession.messages.map(({ bookmark, ...m }) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    codeContent: m.codeContent,
    messageType: m.messageType,
    questionIndex: m.questionIndex,
    score: m.score,
    criteria: m.criteria as Record<string, number> | null,
    feedback: m.feedback,
    modelAnswer: m.modelAnswer,
    createdAt: m.createdAt.toISOString(),
    bookmarkId: bookmark?.id ?? null,
  }));

  return <ChatContainer initialSession={sessionData} initialMessages={messages} />;
}
