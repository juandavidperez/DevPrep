import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, Evaluation, Question, SessionConfig } from '../types';
import {
  buildEvaluationPrompt,
  buildStrictEvaluationPrompt,
  buildGenerateQuestionsPrompt,
} from '../prompts';
import { parseEvaluation, FALLBACK_EVALUATION } from '../parser';

// Default model — fast and cheap for interview workloads.
// Override with ANTHROPIC_MODEL env var (e.g. "claude-opus-4-6" for harder evals).
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  private async chat(prompt: string, json = true): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      ...(json && {
        system:
          'You are a technical interviewer AI. Always respond with valid JSON only — no markdown fences, no preamble, no trailing text.',
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
      const raw = JSON.parse(content);
      return Array.isArray(raw) ? raw : [];
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
    const prompt = buildEvaluationPrompt(question, responseText, code);
    const content = await this.chat(prompt);

    try {
      return parseEvaluation(content);
    } catch (firstError) {
      console.warn('[AnthropicProvider] First parse failed, retrying with strict prompt:', firstError);

      try {
        const retryPrompt = buildStrictEvaluationPrompt(question, responseText, code);
        const retryContent = await this.chat(retryPrompt);
        return parseEvaluation(retryContent);
      } catch (retryError) {
        console.error('[AnthropicProvider] Retry also failed:', retryError);
        return FALLBACK_EVALUATION;
      }
    }
  }
}
