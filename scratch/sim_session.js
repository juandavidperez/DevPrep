
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'cmmzkh2nu0000lbu100sc2245'; // Existing user
  
  // 1. Create session
  const session = await prisma.session.create({
    data: {
      userId,
      category: 'technical',
      difficulty: 'mid',
      totalQuestions: 2,
      targetStack: ['react'],
    }
  });
  console.log('Created session:', session.id);

  // 2. Create first question
  await prisma.sessionMessage.create({
    data: {
      sessionId: session.id,
      role: 'interviewer',
      content: 'Q1',
      messageType: 'question',
      questionIndex: 1,
    }
  });

  // Now, we would call the API POST /api/sessions/${session.id}/messages twice.
  // But I'll just check what the logic would do.
}

main().finally(() => prisma.$disconnect());
