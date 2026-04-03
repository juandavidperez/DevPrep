/**
 * InteractionManager — Phase 2 implementation.
 *
 * Centralizes all modality logic so ChatContainer stays thin:
 *   - STT: audioBlob → text (via /api/speech/stt)
 *   - TTS: text → audioUrl (via /api/speech/tts)
 *
 * Phase 3 will extend this with avatar directives without touching the call sites.
 */

export type { UserInput, AIOutput, SessionState, InteractionManager } from './types';

export interface STTOptions {
  sessionId: string;
  language: 'en' | 'es';
}

export interface TTSOptions {
  language: 'en' | 'es';
  speed?: number;
}

/**
 * Transcribe an audio blob to text via the STT API route.
 * Returns null if the provider is unavailable (caller should fallback to text mode).
 */
export async function transcribeAudio(
  blob: Blob,
  options: STTOptions,
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('audio', blob);
    formData.append('language', options.language);
    formData.append('sessionId', options.sessionId);

    const res = await fetch('/api/speech/stt', { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok || data.error === 'stt_unavailable') return null;
    return data.transcript ?? null;
  } catch {
    return null;
  }
}

/**
 * Synthesize text to an audio Blob URL via the TTS API route.
 * Returns null if the provider is unavailable (TTS is non-critical — fail silently).
 */
export async function synthesizeAudio(
  text: string,
  options: TTSOptions,
): Promise<string | null> {
  try {
    const res = await fetch('/api/speech/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: options.language, speed: options.speed ?? 1 }),
    });

    if (!res.ok) return null;

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
