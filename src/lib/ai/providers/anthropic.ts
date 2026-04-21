import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, Evaluation, Question, SessionConfig } from '../types';
import {
  buildEvaluationPrompt,
  buildStrictEvaluationPrompt,
  buildGenerateQuestionsPrompt,
} from '../prompts';
import { parseEvaluation, parseQuestions, FALLBACK_EVALUATION } from '../parser';

// Default model — fast and cheap for interview workloads.
// Override with ANTHROPIC_MODEL env var (e.g. "claude-opus-4-6" for harder evals).
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 25_000,  // 25s — fits within Vercel's maxDuration = 30
      maxRetries: 2,
    });
    this.model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  private async chat(prompt: string, json = true): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      ...(json && {
        system: [
          {
            type: 'text' as const,
            text: 'You are a technical interviewer AI. Always respond with valid JSON only — no markdown fences, no preamble, no trailing text.',
            cache_control: { type: 'ephemeral' as const },
          },
        ],
      }),
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic');
    return block.text;
  }

  async answerClarification(questionText: string, clarification: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 256,
      system: 'You are a technical interviewer. Answer clarification questions briefly and helpfully without giving away the answer.',
      messages: [
        {
          role: 'user',
          content: `Interview question: ${questionText}\n\nCandidate clarification: ${clarification}\n\nAnswer in 1-2 sentences.`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic');
    return block.text;
  }

  async generateQuestions(config: SessionConfig): Promise<Question[]> {
    const prompt = buildGenerateQuestionsPrompt(config);
    const content = await this.chat(prompt);

    try {
      return parseQuestions(content);
    } catch {
      console.error('[AnthropicProvider] Failed to parse questions:', content.slice(0, 200));
      return [];
    }
  }

  async evaluateResponse(
    question: Question,
    responseText: string,
    code?: string
  ): Promise<Evaluation> {
    try {
      const prompt = buildEvaluationPrompt(question, responseText, code);
      const content = await this.chat(prompt);

      try {
        return parseEvaluation(content);
      } catch (parseError) {
        console.warn('[AnthropicProvider] First parse failed, retrying with strict prompt:', parseError);
        const retryPrompt = buildStrictEvaluationPrompt(question, responseText, code);
        const retryContent = await this.chat(retryPrompt);
        return parseEvaluation(retryContent);
      }
    } catch (error) {
      console.error('[AnthropicProvider] evaluateResponse failed, returning fallback:', error);
      return FALLBACK_EVALUATION;
    }
  }
}
