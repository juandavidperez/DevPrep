import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, Evaluation, Question, SessionConfig } from '../types';
import {
  buildEvaluationPrompt,
  buildStrictEvaluationPrompt,
  buildGenerateQuestionsPrompt,
} from '../prompts';
import { parseEvaluation, parseQuestions, FALLBACK_EVALUATION } from '../parser';

// Default model — Gemini 2.0 Flash is fast and cheap for interview workloads.
// Override with GEMINI_MODEL env var (e.g. "gemini-2.5-pro" for harder evals).
const DEFAULT_MODEL = 'gemini-flash-latest';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required');
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  }

  private async chat(prompt: string, json = true): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      ...(json && {
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 1024,
        },
      }),
      ...(!json && {
        generationConfig: {
          maxOutputTokens: 1024,
        },
      }),
      ...(json && {
        systemInstruction:
          'You are a technical interviewer AI. Always respond with valid JSON only — no markdown fences, no preamble, no trailing text.',
      }),
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async answerClarification(questionText: string, clarification: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: { maxOutputTokens: 256 },
      systemInstruction:
        'You are a technical interviewer. Answer clarification questions briefly and helpfully without giving away the answer.',
    });

    const result = await model.generateContent(
      `Interview question: ${questionText}\n\nCandidate clarification: ${clarification}\n\nAnswer in 1-2 sentences.`
    );

    return result.response.text();
  }

  async generateQuestions(config: SessionConfig): Promise<Question[]> {
    const prompt = buildGenerateQuestionsPrompt(config);
    const content = await this.chat(prompt);

    try {
      return parseQuestions(content);
    } catch {
      console.error('[GeminiProvider] Failed to parse questions:', content.slice(0, 200));
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
      console.warn('[GeminiProvider] First parse failed, retrying with strict prompt:', firstError);

      try {
        const retryPrompt = buildStrictEvaluationPrompt(question, responseText, code);
        const retryContent = await this.chat(retryPrompt);
        return parseEvaluation(retryContent);
      } catch (retryError) {
        console.error('[GeminiProvider] Retry also failed:', retryError);
        return FALLBACK_EVALUATION;
      }
    }
  }
}
