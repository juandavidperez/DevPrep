import { TTSProvider, TtsUnavailableError } from '../types';

/**
 * TTS via Kokoro local FastAPI server (dev, $0).
 * Run locally: https://github.com/remsky/Kokoro-FastAPI
 * Requires KOKORO_URL (default: http://localhost:8880).
 */
export class KokoroProvider implements TTSProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.KOKORO_URL || 'http://localhost:8880';
  }

  async synthesize(text: string, language: 'en' | 'es', speed = 1.0): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'kokoro',
          input: text,
          voice: language === 'es' ? 'ef_dora' : 'af_heart',
          speed,
          response_format: 'wav',
        }),
      });

      if (!response.ok) {
        throw new TtsUnavailableError(
          `Kokoro returned ${response.status}: ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new TtsUnavailableError('Kokoro returned empty body');
      }

      return response.body;
    } catch (err) {
      if (err instanceof TtsUnavailableError) throw err;
      throw new TtsUnavailableError(
        `Kokoro unreachable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
