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
      // OpenAI SDK expects a File-like object with a name and type
      const file = new File([audio], 'recording.webm', { type: audio.type });

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
