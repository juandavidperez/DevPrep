import OpenAI from 'openai';
import { STTProvider, SttUnavailableError } from '../types';

/**
 * STT via OpenAI Whisper API (prod).
 * Uses the same OPENAI_API_KEY already present for AI smart routing.
 */
export class WhisperAPIProvider implements STTProvider {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new SttUnavailableError('OPENAI_API_KEY is not set — WhisperAPIProvider unavailable');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async transcribe(audio: Blob, language: 'en' | 'es'): Promise<string> {
    try {
      // Strip codec params (e.g. "audio/webm;codecs=opus" → "audio/webm")
      const mimeType = (audio.type || 'audio/webm').split(';')[0];
      const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';

      // Buffer the audio and create a named File — avoids toFile() helper
      // which can behave inconsistently in serverless environments.
      const arrayBuffer = await audio.arrayBuffer();
      const file = new File([arrayBuffer], `recording.${ext}`, { type: mimeType });

      const response = await this.client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language,
      });

      return response.text.trim();
    } catch (err) {
      throw new SttUnavailableError(
        `OpenAI Whisper API error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
