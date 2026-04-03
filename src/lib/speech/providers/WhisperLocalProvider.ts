import OpenAI from 'openai';
import { STTProvider, SttUnavailableError } from '../types';

/**
 * STT via faster-whisper-server (dev, $0).
 * OpenAI-compatible local server — run with Docker:
 *   docker run --rm -p 8000:8000 fedirz/faster-whisper-server:latest-cpu
 *
 * Configured via WHISPER_LOCAL_URL (default: http://localhost:8000).
 * Model configured via WHISPER_LOCAL_MODEL (default: Systran/faster-whisper-small).
 */
export class WhisperLocalProvider implements STTProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    const baseURL = (process.env.WHISPER_LOCAL_URL || 'http://localhost:8000') + '/v1';
    this.model = process.env.WHISPER_LOCAL_MODEL || 'Systran/faster-whisper-small';
    // No API key required for local server; pass a dummy to satisfy the SDK
    this.client = new OpenAI({ apiKey: 'local', baseURL });
  }

  async transcribe(audio: Blob, language: 'en' | 'es'): Promise<string> {
    try {
      const file = new File([audio], 'recording.webm', { type: audio.type });

      const response = await this.client.audio.transcriptions.create({
        file,
        model: this.model,
        language,
      });

      return response.text.trim();
    } catch (err) {
      throw new SttUnavailableError(
        `faster-whisper-server unreachable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
