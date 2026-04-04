import OpenAI from 'openai';
import { TTSProvider, TtsUnavailableError } from '../types';

type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

/**
 * TTS via OpenAI TTS API (prod default).
 * Uses the same OPENAI_API_KEY as Whisper STT.
 * Configure voices via OPENAI_TTS_VOICE_EN / OPENAI_TTS_VOICE_ES.
 */
export class OpenAITTSProvider implements TTSProvider {
  private client: OpenAI;
  private voiceEn: OpenAIVoice;
  private voiceEs: OpenAIVoice;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new TtsUnavailableError('OPENAI_API_KEY is not set — OpenAITTSProvider unavailable');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.voiceEn = (process.env.OPENAI_TTS_VOICE_EN as OpenAIVoice) || 'alloy';
    this.voiceEs = (process.env.OPENAI_TTS_VOICE_ES as OpenAIVoice) || 'alloy';
  }

  async synthesize(text: string, language: 'en' | 'es', speed = 1.0): Promise<ReadableStream<Uint8Array>> {
    try {
      const voice = language === 'es' ? this.voiceEs : this.voiceEn;
      const response = await this.client.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
        speed,
        response_format: 'mp3',
      });

      // Buffer fully before streaming — avoids Node.js/Web ReadableStream
      // incompatibility in Vercel serverless on repeated calls.
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer.byteLength) {
        throw new TtsUnavailableError('OpenAI TTS returned empty body');
      }

      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(arrayBuffer));
          controller.close();
        },
      });
    } catch (err) {
      if (err instanceof TtsUnavailableError) throw err;
      throw new TtsUnavailableError(
        `OpenAI TTS error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
