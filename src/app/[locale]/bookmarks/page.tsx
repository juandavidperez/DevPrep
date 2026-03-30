import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BookmarksClient } from "@/components/bookmarks/BookmarksClient";

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
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
    orderBy: { createdAt: "desc" },
  });

  // Batch-fetch evaluation scores (avoid N+1)
  const pairs = bookmarks
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

  const data = bookmarks.map((b) => {
    const eval_ = evaluations.find(
      (e) => e.sessionId === b.message.sessionId && e.questionIndex === b.message.questionIndex
    );
    return { ...b, score: eval_?.score ?? null };
  });

  return <BookmarksClient bookmarks={data} />;
}
