import type { AIProvider, Evaluation, Question, SessionConfig } from '../types';
import {
  buildEvaluationPrompt,
  buildStrictEvaluationPrompt,
  buildGenerateQuestionsPrompt,
} from '../prompts';
import { parseEvaluation, FALLBACK_EVALUATION } from '../parser';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  }

  private async chat(prompt: string, json = true): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    };
    if (json) body.format = 'json';

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content as string;
  }

  async answerClarification(questionText: string, clarification: string): Promise<string> {
    const prompt = `You are a technical interviewer. The candidate has a clarification question before answering.

Interview question: ${questionText}
Candidate's clarification: ${clarification}

Answer the clarification briefly (1-2 sentences). Be helpful but don't give away the answer.`;
    return this.chat(prompt, false);
  }

  async generateQuestions(config: SessionConfig): Promise<Question[]> {
    const prompt = buildGenerateQuestionsPrompt(config);
    const content = await this.chat(prompt);

    try {
      const raw = JSON.parse(content);
      return Array.isArray(raw) ? raw : [];
    } catch {
      console.error('[OllamaProvider] Failed to parse questions:', content.slice(0, 200));
      return [];
    }
  }

  async evaluateResponse(
    question: Question,
    responseText: string,
    code?: string
  ): Promise<Evaluation> {
    // First attempt
    const prompt = buildEvaluationPrompt(question, responseText, code);
    const content = await this.chat(prompt);

    try {
      return parseEvaluation(content);
    } catch (firstError) {
      console.warn('[OllamaProvider] First parse failed, retrying with strict prompt:', firstError);

      // Retry once with stricter prompt
      try {
        const retryPrompt = buildStrictEvaluationPrompt(question, responseText, code);
        const retryContent = await this.chat(retryPrompt);
        return parseEvaluation(retryContent);
      } catch (retryError) {
        console.error('[OllamaProvider] Retry also failed:', retryError);
        return FALLBACK_EVALUATION;
      }
    }
  }
}
