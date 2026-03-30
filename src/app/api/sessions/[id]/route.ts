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
