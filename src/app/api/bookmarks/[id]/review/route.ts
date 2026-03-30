import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const INTERVALS_DAYS = [1, 3, 7, 14, 30];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const bookmark = await prisma.bookmark.findUnique({ where: { id } });

  if (!bookmark) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }
  if (bookmark.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newReviewCount = bookmark.reviewCount + 1;
  const intervalDays = INTERVALS_DAYS[Math.min(newReviewCount, INTERVALS_DAYS.length - 1)];
  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.bookmark.update({
    where: { id },
    data: { reviewCount: newReviewCount, nextReviewAt },
  });

  return NextResponse.json(updated);
}
