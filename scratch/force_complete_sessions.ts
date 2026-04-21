import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting aggressive session completion repair...");

  const sessions = await prisma.session.findMany({
    where: {
      completedAt: null,
    },
    include: {
      messages: {
        where: {
          score: { not: null },
        },
      },
    },
  });

  console.log(`🔍 Found ${sessions.length} sessions in progress.`);

  let fixCount = 0;

  for (const session of sessions) {
    if (session.messages.length > 0) {
      console.log(`🛠  Repairing session ${session.id} (${session.category})...`);
      
      const totalScore = session.messages.reduce((acc, m) => acc + (m.score || 0), 0);
      const avgScore = Math.round(totalScore / session.messages.length);
      
      // Use duration if available, otherwise default to a reasonable estimate based on messages
      const duration = session.duration || (session.messages.length * 120); // 2 mins per message as estimate

      await prisma.session.update({
        where: { id: session.id },
        data: {
          completedAt: new Date(),
          score: avgScore,
          duration: duration,
        },
      });

      console.log(`✅ Session ${session.id} marked as completed with score ${avgScore}.`);
      fixCount++;
    } else {
      console.log(`⏭  Skipping session ${session.id} (no evaluated messages found).`);
    }
  }

  console.log(`\n🎉 Repair complete! Fixed ${fixCount} sessions.`);
}

main()
  .catch((e) => {
    console.error("❌ Error during repair:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
