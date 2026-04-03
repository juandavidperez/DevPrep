import { TTSProvider, TtsUnavailableError } from '../types';

/**
 * TTS via ElevenLabs streaming API (prod premium).
 * Configure via ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID_EN, ELEVENLABS_VOICE_ID_ES.
 */
export class ElevenLabsProvider implements TTSProvider {
  private apiKey: string;
  private voiceIdEn: string;
  private voiceIdEs: string;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new TtsUnavailableError('ELEVENLABS_API_KEY is not set — ElevenLabsProvider unavailable');
    }
    this.apiKey = apiKey;
    this.voiceIdEn = process.env.ELEVENLABS_VOICE_ID_EN || '';
    this.voiceIdEs = process.env.ELEVENLABS_VOICE_ID_ES || '';
  }

  async synthesize(text: string, language: 'en' | 'es', speed = 1.0): Promise<ReadableStream<Uint8Array>> {
    const voiceId = language === 'es' ? this.voiceIdEs : this.voiceIdEn;
    if (!voiceId) {
      throw new TtsUnavailableError(
        `ELEVENLABS_VOICE_ID_${language.toUpperCase()} is not set`,
      );
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              speed,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new TtsUnavailableError(
          `ElevenLabs returned ${response.status}: ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new TtsUnavailableError('ElevenLabs returned empty body');
      }

      return response.body;
    } catch (err) {
      if (err instanceof TtsUnavailableError) throw err;
      throw new TtsUnavailableError(
        `ElevenLabs error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
