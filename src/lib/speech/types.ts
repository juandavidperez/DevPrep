export interface STTProvider {
  /** Transcribe an audio blob to text. Throws SttUnavailableError if the provider is not reachable. */
  transcribe(audio: Blob, language: 'en' | 'es'): Promise<string>;
}

export interface TTSProvider {
  /** Synthesize text to an audio ReadableStream (audio/mpeg or audio/wav). Throws TtsUnavailableError if unreachable. */
  synthesize(text: string, language: 'en' | 'es', speed?: number): Promise<ReadableStream<Uint8Array>>;
}

export class SttUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SttUnavailableError';
  }
}

export class TtsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TtsUnavailableError';
  }
}
