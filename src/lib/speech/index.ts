import { STTProvider, TTSProvider } from './types';
import { WhisperLocalProvider } from './providers/WhisperLocalProvider';
import { WhisperAPIProvider } from './providers/WhisperAPIProvider';

export function getSTTProvider(): STTProvider {
  const provider = process.env.STT_PROVIDER || 'whisper-local';
  switch (provider) {
    case 'whisper-api': return new WhisperAPIProvider();
    default:            return new WhisperLocalProvider();
  }
}

// getTTSProvider is added in Phase 2 Week 11 (Step 5).
// Import TTS providers lazily to avoid loading unused modules.
export async function getTTSProvider(): Promise<TTSProvider> {
  const provider = process.env.TTS_PROVIDER || 'kokoro';
  switch (provider) {
    case 'openai': {
      const { OpenAITTSProvider } = await import('./providers/OpenAITTSProvider');
      return new OpenAITTSProvider();
    }
    case 'elevenlabs': {
      const { ElevenLabsProvider } = await import('./providers/ElevenLabsProvider');
      return new ElevenLabsProvider();
    }
    default: {
      const { KokoroProvider } = await import('./providers/KokoroProvider');
      return new KokoroProvider();
    }
  }
}
