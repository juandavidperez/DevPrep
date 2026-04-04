import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSTTProvider } from '@/lib/speech';
import { SttUnavailableError } from '@/lib/speech/types';

export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audioFile = formData.get('audio');
  const language = formData.get('language') as string | null;
  const sessionId = formData.get('sessionId') as string | null;

  if (!audioFile || !(audioFile instanceof Blob)) {
    return NextResponse.json({ error: 'Missing audio field' }, { status: 400 });
  }
  if (!language || !['en', 'es'].includes(language)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  // Verify session ownership
  const interviewSession = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });
  if (!interviewSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (interviewSession.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const provider = getSTTProvider();
    const transcript = await provider.transcribe(audioFile, language as 'en' | 'es');
    return NextResponse.json({ transcript });
  } catch (err) {
    if (err instanceof SttUnavailableError) {
      console.warn('[STT] Provider unavailable:', err.message);
      return NextResponse.json({ error: 'stt_unavailable' }, { status: 503 });
    }
    console.error('[STT] Unexpected error:', err);
    return NextResponse.json({ error: 'stt_unavailable' }, { status: 503 });
  }
}
