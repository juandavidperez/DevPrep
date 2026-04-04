import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTTSProvider } from '@/lib/speech';
import { TtsUnavailableError } from '@/lib/speech/types';

export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { text?: string; language?: string; speed?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, language = 'en', speed = 1.0 } = body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }
  if (!['en', 'es'].includes(language)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
  }

  try {
    const provider = await getTTSProvider();
    const audioStream = await provider.synthesize(text.trim(), language as 'en' | 'es', speed);

    // Determine content type based on provider
    const ttsProvider = process.env.TTS_PROVIDER || 'kokoro';
    const contentType = ttsProvider === 'kokoro' ? 'audio/wav' : 'audio/mpeg';

    return new Response(audioStream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof TtsUnavailableError) {
      console.warn('[TTS] Provider unavailable:', err.message);
      return NextResponse.json({ error: 'tts_unavailable' }, { status: 503 });
    }
    console.error('[TTS] Unexpected error:', err);
    return NextResponse.json({ error: 'tts_unavailable' }, { status: 503 });
  }
}
