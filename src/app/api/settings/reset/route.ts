import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Delete all sessions (and messages/bookmarks via cascade if possible, 
    // but we'll do it manually to be safe)
    
    // 1. Delete all bookmarks for this user
    await prisma.bookmark.deleteMany({
      where: { userId }
    });

    // 2. Delete all messages for all user's sessions
    await prisma.sessionMessage.deleteMany({
      where: {
        session: { userId }
      }
    });

    // 3. Delete all sessions
    await prisma.session.deleteMany({
      where: { userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reset stats:", error);
    return NextResponse.json({ error: "Failed to reset stats" }, { status: 500 });
  }
}
