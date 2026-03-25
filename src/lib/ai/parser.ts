import { z } from 'zod';
import type { Evaluation } from './types';

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

export const FALLBACK_EVALUATION: Evaluation = {
  score: 0,
  criteria: { correctness: 0, clarity: 0 },
  feedback:
    'The AI could not evaluate this response. Please try rephrasing your answer or try again.',
  modelAnswer: '',
};
