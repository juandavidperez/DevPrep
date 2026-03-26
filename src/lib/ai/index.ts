import { AIProvider, QuestionCategory } from './types';
import { OllamaProvider } from './providers/ollama';
import { AnthropicProvider } from './providers/anthropic';

// Future providers:
// import { GeminiProvider } from './providers/gemini';
// import { OpenAIProvider } from './providers/openai';

export function getAIProvider(_category?: QuestionCategory): AIProvider {
  const provider = process.env.AI_PROVIDER || 'ollama';

  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'ollama':
      return new OllamaProvider();
    // case 'gemini': return new GeminiProvider();
    // case 'openai': return new OpenAIProvider();
    default:
      return new OllamaProvider();
  }
}
