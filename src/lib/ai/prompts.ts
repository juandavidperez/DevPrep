import type { Question, SessionConfig } from './types';

export const PROMPT_VERSION = 'v1.1';

const CRITERIA_BY_CATEGORY: Record<string, string[]> = {
  technical:     ['correctness', 'depth', 'practical_examples', 'clarity'],
  coding:        ['correctness', 'time_complexity', 'readability', 'edge_cases'],
  system_design: ['scalability', 'trade_offs', 'completeness', 'communication'],
  behavioral:    ['star_structure', 'specificity', 'self_awareness', 'relevance'],
  mixed:         ['correctness', 'depth', 'clarity', 'practical_examples'],
};

export function criteriaKeysForCategory(category: string): string[] {
  return CRITERIA_BY_CATEGORY[category] ?? CRITERIA_BY_CATEGORY.mixed;
}

export function buildEvaluationPrompt(
  question: Question & { evaluationCriteria?: string[] },
  response: string,
  code?: string
): string {
  const keyPoints = question.evaluationCriteria?.join(', ')
    ?? criteriaKeysForCategory(question.category).join(', ');

  const criteriaKeys = criteriaKeysForCategory(question.category);
  const criteriaShape = criteriaKeys.map((k) => `"${k}": <0-100>`).join(', ');

  const codeBlock = code ? `\nCandidate Code:\n${code}` : '';

  return `You are a senior technical interviewer evaluating a candidate's response.

Question: ${question.text}
Candidate Response: ${response}${codeBlock}

KEY POINTS TO EVALUATE: ${keyPoints}

Evaluate objectively. Return ONLY valid JSON — no markdown, no preamble, no trailing text.

{"score": <0-100>, "criteria": {${criteriaShape}}, "feedback": "<2-4 sentence conversational feedback referencing the candidate's specific answer>", "modelAnswer": "<complete reference answer>"}`;
}

export function buildStrictEvaluationPrompt(
  question: Question & { evaluationCriteria?: string[] },
  response: string,
  code?: string
): string {
  return buildEvaluationPrompt(question, response, code) +
    '\n\nIMPORTANT: Your previous response could not be parsed. Return ONLY the raw JSON object. Nothing else.';
}

export function buildGenerateQuestionsPrompt(config: SessionConfig): string {
  const avoidClause = config.existingQuestions?.length
    ? `\nAvoid questions about: ${config.existingQuestions.slice(0, 5).join(', ')}`
    : '';

  return `Generate ${config.count} interview questions for a ${config.difficulty} ${config.category} developer interview.
Stack: ${config.stack.join(', ')}
Language: ${config.language}${avoidClause}

Return ONLY a valid JSON array — no markdown, no preamble.

[{"id": "<uuid>", "text": "<question>", "category": "${config.category === 'mixed' ? 'technical' : config.category}", "difficulty": "${config.difficulty}"}]`;
}
