import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (interviewSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = {
    ...interviewSession,
    messages: interviewSession.messages.map(({ bookmark, ...msg }) => ({
      ...msg,
      bookmarkId: bookmark?.id ?? null,
    })),
  };

  return NextResponse.json(response);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  const interviewSession = await prisma.session.findUnique({
    where: { id },
    include: { messages: true },
  });

  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (interviewSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "finish") {
    // Calculate final score from existing evaluations
    const evaluations = interviewSession.messages.filter(
      (m) => m.messageType === "evaluation" && m.score !== null
    );
    
    const totalScore = evaluations.reduce((acc, m) => acc + (m.score || 0), 0);
    const avgScore = evaluations.length > 0 ? Math.round(totalScore / evaluations.length) : 0;
    
    const firstMessage = interviewSession.messages[0];
    const durationStart = firstMessage?.createdAt.getTime() ?? interviewSession.createdAt.getTime();
    const duration = Math.floor((Date.now() - durationStart) / 1000);

    const updated = await prisma.session.update({
      where: { id },
      data: {
        completedAt: new Date(),
        score: avgScore,
        duration,
      },
    });

    // Auto-bookmark failed questions (score < 70)
    const failedEvaluations = interviewSession.messages.filter(
      (m) => m.messageType === "evaluation" && m.score !== null && m.score < 70
    );

    if (failedEvaluations.length > 0) {
      // Use upsert to avoid duplicate bookmarks if the user manually bookmarked during the session
      await Promise.all(
        failedEvaluations.map((ev) =>
          prisma.bookmark.upsert({
            where: { messageId: ev.id },
            create: {
              userId: session.user.id,
              messageId: ev.id,
              notes: "Auto-marcado: Puntaje < 70",
              nextReviewAt: null, // Due immediately
            },
            update: {}, // Keep existing if already bookmarked
          })
        )
      );
    }

    return NextResponse.json({ success: true, session: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const interviewSession = await prisma.session.findUnique({
    where: { id },
  });

  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (interviewSession.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete session and its messages (Cascade should handle this if defined, or we do it manually)
  // Our schema doesn't have onDelete: Cascade for SessionMessage -> Session, but let's check prisma.
  // Actually, standard prisma behavior needs explicit onDelete: Cascade in schema.
  // I saw schema had onDelete: Cascade for Account -> User, but let's check SessionMessage.
  // Line 91: session Session @relation(fields: [sessionId], references: [id])
  // It doesn't have Cascade. I should delete messages first or update schema.
  // I'll delete messages first.
  await prisma.$transaction([
    prisma.sessionMessage.deleteMany({ where: { sessionId: id } }),
    prisma.session.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
