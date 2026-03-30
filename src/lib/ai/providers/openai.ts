import OpenAI from 'openai';
import type { AIProvider, Evaluation, Question, SessionConfig } from '../types';
import {
  buildEvaluationPrompt,
  buildStrictEvaluationPrompt,
  buildGenerateQuestionsPrompt,
} from '../prompts';
import { parseEvaluation, parseQuestions, FALLBACK_EVALUATION } from '../parser';

// Default model — GPT-4o Mini is fast and cheap for interview workloads.
// Override with OPENAI_MODEL env var (e.g. "gpt-4o" for harder evals).
const DEFAULT_MODEL = 'gpt-4o-mini';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  }

  private async chat(prompt: string, json = true): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      ...(json && { response_format: { type: 'json_object' } }),
      messages: [
        ...(json
          ? [
              {
                role: 'system' as const,
                content:
                  'You are a technical interviewer AI. Always respond with valid JSON only — no markdown fences, no preamble, no trailing text.',
              },
            ]
          : []),
        { role: 'user' as const, content: prompt },
      ],
    });

    return completion.choices[0]?.message?.content ?? '';
  }

  async answerClarification(questionText: string, clarification: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 256,
      messages: [
        {
          role: 'system',
          content:
            'You are a technical interviewer. Answer clarification questions briefly and helpfully without giving away the answer.',
        },
        {
          role: 'user',
          content: `Interview question: ${questionText}\n\nCandidate clarification: ${clarification}\n\nAnswer in 1-2 sentences.`,
        },
      ],
    });

    return completion.choices[0]?.message?.content ?? '';
  }

  async generateQuestions(config: SessionConfig): Promise<Question[]> {
    const prompt = buildGenerateQuestionsPrompt(config);
    const content = await this.chat(prompt);

    try {
      return parseQuestions(content);
    } catch {
      console.error('[OpenAIProvider] Failed to parse questions:', content.slice(0, 200));
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
      console.warn('[OpenAIProvider] First parse failed, retrying with strict prompt:', firstError);

      try {
        const retryPrompt = buildStrictEvaluationPrompt(question, responseText, code);
        const retryContent = await this.chat(retryPrompt);
        return parseEvaluation(retryContent);
      } catch (retryError) {
        console.error('[OpenAIProvider] Retry also failed:', retryError);
        return FALLBACK_EVALUATION;
      }
    }
  }
}
