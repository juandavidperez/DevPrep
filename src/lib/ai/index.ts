import { AIProvider, QuestionCategory } from './types';
import { OllamaProvider } from './providers/ollama';

// Future providers:
// import { AnthropicProvider } from './providers/anthropic';
// import { GeminiProvider } from './providers/gemini';
// import { OpenAIProvider } from './providers/openai';

export function getAIProvider(_category?: QuestionCategory): AIProvider {
  const provider = process.env.AI_PROVIDER || 'ollama';

  // Future: Add smart routing logic here as seen in v3.0 spec

  switch (provider) {
    case 'ollama':
      return new OllamaProvider();
    // case 'anthropic': return new AnthropicProvider();
    // case 'gemini': return new GeminiProvider();
    // case 'openai': return new OpenAIProvider();
    default:
      return new OllamaProvider();
  }
}
