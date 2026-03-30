import { z } from 'zod';
import type { Evaluation, Question } from './types';

// ── Schema ────────────────────────────────────────────────────────────────────

const EvaluationSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  criteria: z
    .record(z.string(), z.coerce.number().min(0).max(100))
    .refine((obj) => Object.keys(obj).length >= 2, {
      message: 'At least 2 criteria required',
    }),
  feedback: z.string().min(10),
  modelAnswer: z.preprocess(
    (val) => (typeof val === 'object' && val !== null ? JSON.stringify(val, null, 2) : val),
    z.string().optional().default('')
  ),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripFences(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function extractJson(content: string): string {
  const stripped = stripFences(content);
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return stripped.slice(start, end + 1);
  }
  return stripped;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseEvaluation(content: string): Evaluation {
  const json = extractJson(content);
  const raw = JSON.parse(json);
  const validated = EvaluationSchema.parse(raw);
  return {
    score: validated.score,
    criteria: validated.criteria as Record<string, number>,
    feedback: validated.feedback,
    modelAnswer: validated.modelAnswer,
  };
}

// ── Questions schema ──────────────────────────────────────────────────────────

const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(10),
  category: z.enum(['technical', 'coding', 'system_design', 'behavioral']),
  difficulty: z.enum(['junior', 'mid', 'senior']),
  hints: z.array(z.string()).optional(),
  modelAnswer: z.string().optional(),
  codeTemplate: z.string().optional(),
  codeLanguage: z.string().optional(),
});

export function parseQuestions(content: string): Question[] {
  const json = extractJson(content.includes('[') ? content : `[${content}]`);
  // Prefer top-level array; some models wrap it in an object
  const raw: unknown = JSON.parse(json);
  const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).questions ?? [];
  return z.array(QuestionSchema).parse(arr) as Question[];
}

// ── Evaluation ────────────────────────────────────────────────────────────────

export const FALLBACK_EVALUATION: Evaluation = {
  score: 0,
  criteria: { correctness: 0, clarity: 0 },
  feedback:
    'The AI could not evaluate this response. Please try rephrasing your answer or try again.',
  modelAnswer: '',
};
