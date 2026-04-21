import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Starting Session Cleanup ---");

  // Find all sessions in progress (completedAt is null)
  const sessionsInProgress = await prisma.session.findMany({
    where: {
      completedAt: null,
    },
    select: {
      id: true,
      category: true,
    },
  });

  console.log(`Found ${sessionsInProgress.length} sessions in progress.`);

  if (sessionsInProgress.length === 0) {
    console.log("No sessions to delete.");
    return;
  }

  const sessionIds = sessionsInProgress.map((s) => s.id);

  try {
    const result = await prisma.$transaction([
      // Delete messages associated with these sessions
      prisma.sessionMessage.deleteMany({
        where: {
          sessionId: { in: sessionIds },
        },
      }),
      // Delete the sessions
      prisma.session.deleteMany({
        where: {
          id: { in: sessionIds },
        },
      }),
    ]);

    console.log(`Successfully deleted ${result[1].count} sessions and their messages.`);
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
