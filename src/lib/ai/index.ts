import { AIProvider, QuestionCategory } from './types';
import { OllamaProvider } from './providers/ollama';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';

// Smart routing: best provider per category (activated with AI_ROUTING=smart).
// Falls back to static AI_PROVIDER if a required API key is missing.
const SMART_ROUTE: Record<QuestionCategory, () => AIProvider> = {
  coding:        () => new AnthropicProvider(), // Haiku: best code eval + reasoning
  system_design: () => new AnthropicProvider(), // Haiku: best long-form reasoning
  technical:     () => new GeminiProvider(),    // Flash: strong + cheaper
  behavioral:    () => new OpenAIProvider(),    // GPT-4o Mini: cheapest, good enough
};

function staticProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'ollama';
  switch (provider) {
    case 'anthropic': return new AnthropicProvider();
    case 'openai':    return new OpenAIProvider();
    case 'gemini':    return new GeminiProvider();
    default:          return new OllamaProvider();
  }
}

export function getAIProvider(category?: QuestionCategory): AIProvider {
  if (process.env.AI_ROUTING === 'smart' && category) {
    try {
      return SMART_ROUTE[category]();
    } catch (err) {
      console.warn(`[AI] Smart routing failed for "${category}", falling back to static provider:`, err);
    }
  }
  return staticProvider();
}
