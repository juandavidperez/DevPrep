import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const due = searchParams.get("due") === "true";
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const now = new Date();

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      ...(due
        ? { OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }] }
        : {}),
    },
    include: {
      message: {
        select: {
          id: true,
          content: true,
          questionIndex: true,
          sessionId: true,
          session: {
            select: { id: true, category: true, difficulty: true, createdAt: true },
          },
        },
      },
    },
    orderBy: due ? { nextReviewAt: "asc" } : { createdAt: "desc" },
  });

  let filtered = bookmarks;
  if (category && category !== "all") {
    filtered = filtered.filter((b) => b.message.session.category === category);
  }
  if (difficulty && difficulty !== "all") {
    filtered = filtered.filter((b) => b.message.session.difficulty === difficulty);
  }

  // Batch-fetch evaluation scores
  const pairs = filtered
    .filter((b) => b.message.questionIndex !== null)
    .map((b) => ({ sessionId: b.message.sessionId, questionIndex: b.message.questionIndex! }));

  const evaluations =
    pairs.length > 0
      ? await prisma.sessionMessage.findMany({
          where: {
            OR: pairs.map((p) => ({
              sessionId: p.sessionId,
              messageType: "evaluation",
              questionIndex: p.questionIndex,
            })),
          },
          select: { sessionId: true, questionIndex: true, score: true },
        })
      : [];

  const result = filtered.map((b) => {
    const eval_ = evaluations.find(
      (e) => e.sessionId === b.message.sessionId && e.questionIndex === b.message.questionIndex
    );
    return { ...b, score: eval_?.score ?? null };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messageId, notes } = body;

  if (!messageId || typeof messageId !== "string") {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  const message = await prisma.sessionMessage.findUnique({
    where: { id: messageId },
    include: { session: { select: { userId: true } } },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  if (message.session.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bookmark = await prisma.bookmark.upsert({
    where: { messageId },
    create: { userId: session.user.id, messageId, notes: notes ?? null },
    update: { notes: notes ?? undefined },
  });

  return NextResponse.json(bookmark, { status: 201 });
}
