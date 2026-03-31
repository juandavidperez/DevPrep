import { describe, it, expect } from 'vitest'
import { parseEvaluation, parseQuestions, FALLBACK_EVALUATION } from '../parser'

// ── parseEvaluation ────────────────────────────────────────────────────────────

describe('parseEvaluation', () => {
  it('parses a clean JSON string', () => {
    const input = JSON.stringify({
      score: 85,
      criteria: { correctness: 90, clarity: 80 },
      feedback: 'Good answer with solid reasoning.',
      modelAnswer: 'Use a HashMap for O(1) lookups.',
    })
    const result = parseEvaluation(input)
    expect(result.score).toBe(85)
    expect(result.criteria).toEqual({ correctness: 90, clarity: 80 })
    expect(result.feedback).toBe('Good answer with solid reasoning.')
    expect(result.modelAnswer).toBe('Use a HashMap for O(1) lookups.')
  })

  it('strips markdown code fences', () => {
    const input = `\`\`\`json
{
  "score": 70,
  "criteria": { "correctness": 70, "depth": 70 },
  "feedback": "Decent but could be more detailed.",
  "modelAnswer": ""
}
\`\`\``
    const result = parseEvaluation(input)
    expect(result.score).toBe(70)
  })

  it('extracts JSON embedded in prose text', () => {
    const input = `Here is the evaluation: {"score": 60, "criteria": {"correctness": 60, "clarity": 60}, "feedback": "Answer needs more depth and examples.", "modelAnswer": ""} — end of evaluation.`
    const result = parseEvaluation(input)
    expect(result.score).toBe(60)
  })

  it('coerces string score to number', () => {
    const input = JSON.stringify({
      score: '75',
      criteria: { correctness: 75, clarity: 75 },
      feedback: 'Score came back as a string but should coerce.',
      modelAnswer: '',
    })
    const result = parseEvaluation(input)
    expect(result.score).toBe(75)
    expect(typeof result.score).toBe('number')
  })

  it('serializes object modelAnswer to string', () => {
    const input = JSON.stringify({
      score: 80,
      criteria: { correctness: 80, clarity: 80 },
      feedback: 'Good structured answer.',
      modelAnswer: { steps: ['step 1', 'step 2'], complexity: 'O(n)' },
    })
    const result = parseEvaluation(input)
    expect(typeof result.modelAnswer).toBe('string')
    expect(result.modelAnswer).toContain('steps')
  })

  it('defaults modelAnswer to empty string when missing', () => {
    const input = JSON.stringify({
      score: 50,
      criteria: { correctness: 50, depth: 50 },
      feedback: 'Some feedback about the answer given.',
    })
    const result = parseEvaluation(input)
    expect(result.modelAnswer).toBe('')
  })

  it('throws on invalid JSON', () => {
    expect(() => parseEvaluation('not json at all')).toThrow()
  })

  it('throws when fewer than 2 criteria are provided', () => {
    const input = JSON.stringify({
      score: 80,
      criteria: { correctness: 80 }, // only 1 criterion
      feedback: 'Missing second criterion but this feedback is long enough.',
    })
    expect(() => parseEvaluation(input)).toThrow()
  })

  it('throws when feedback is too short', () => {
    const input = JSON.stringify({
      score: 80,
      criteria: { correctness: 80, clarity: 80 },
      feedback: 'Short', // < 10 chars
    })
    expect(() => parseEvaluation(input)).toThrow()
  })

  it('throws when score exceeds 100', () => {
    const input = JSON.stringify({
      score: 110,
      criteria: { correctness: 100, clarity: 100 },
      feedback: 'Score out of valid range here.',
    })
    expect(() => parseEvaluation(input)).toThrow()
  })
})

// ── parseQuestions ─────────────────────────────────────────────────────────────
//
// NOTE: extractJson() scans for the outermost { }, so it only works reliably
// when the AI response wraps questions in an object: { "questions": [...] }.
// A bare JSON array [ {...} ] has its brackets stripped by extractJson, so the
// tests below use the object-wrapper format to match actual AI output.

describe('parseQuestions', () => {
  const validQuestion = {
    id: 'q1',
    text: 'Explain the difference between process and thread in operating systems.',
    category: 'technical',
    difficulty: 'mid',
  }

  it('parses a {"questions":[...]} wrapper', () => {
    const input = JSON.stringify({ questions: [validQuestion] })
    const result = parseQuestions(input)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('q1')
    expect(result[0].category).toBe('technical')
  })

  it('parses multiple questions from the wrapper', () => {
    const q2 = { ...validQuestion, id: 'q2', text: 'What is garbage collection and how does it work in the JVM?' }
    const input = JSON.stringify({ questions: [validQuestion, q2] })
    const result = parseQuestions(input)
    expect(result).toHaveLength(2)
  })

  it('parses optional fields when present', () => {
    const withOptionals = {
      ...validQuestion,
      hints: ['Think about memory isolation', 'Consider scheduling'],
      modelAnswer: 'A process has its own memory space...',
      codeTemplate: '',
      codeLanguage: 'java',
    }
    const result = parseQuestions(JSON.stringify({ questions: [withOptionals] }))
    expect(result[0].hints).toHaveLength(2)
    expect(result[0].codeLanguage).toBe('java')
  })

  it('throws on invalid category', () => {
    const bad = { ...validQuestion, category: 'unknown_category' }
    expect(() => parseQuestions(JSON.stringify({ questions: [bad] }))).toThrow()
  })

  it('throws on invalid difficulty', () => {
    const bad = { ...validQuestion, difficulty: 'expert' }
    expect(() => parseQuestions(JSON.stringify({ questions: [bad] }))).toThrow()
  })

  it('throws when question text is too short', () => {
    const bad = { ...validQuestion, text: 'Short?' }
    expect(() => parseQuestions(JSON.stringify({ questions: [bad] }))).toThrow()
  })
})

// ── FALLBACK_EVALUATION ────────────────────────────────────────────────────────

describe('FALLBACK_EVALUATION', () => {
  it('has a score of 0', () => {
    expect(FALLBACK_EVALUATION.score).toBe(0)
  })

  it('has at least 2 criteria all set to 0', () => {
    const criteriaCount = Object.keys(FALLBACK_EVALUATION.criteria).length
    expect(criteriaCount).toBeGreaterThanOrEqual(2)
    Object.values(FALLBACK_EVALUATION.criteria).forEach((v) => expect(v).toBe(0))
  })

  it('has a non-empty feedback message', () => {
    expect(FALLBACK_EVALUATION.feedback.length).toBeGreaterThan(0)
  })
})
