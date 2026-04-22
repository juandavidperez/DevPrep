import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify ownership
    const interviewSession = await prisma.session.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (interviewSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete session (cascades to messages and bookmarks if configured, 
    // but Prisma needs manual cascade if not set in schema)
    // Looking at schema, Bookmark has messageId, SessionMessage has sessionId.
    // Let's delete related bookmarks first to be safe if cascade is missing.
    
    await prisma.bookmark.deleteMany({
      where: {
        message: {
          sessionId: id
        }
      }
    });

    await prisma.sessionMessage.deleteMany({
      where: { sessionId: id },
    });

    await prisma.session.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
