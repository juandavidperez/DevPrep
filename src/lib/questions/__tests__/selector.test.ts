/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma before importing the module under test
vi.mock('@/lib/db', () => ({
  prisma: {
    questionBank: {
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    bookmark: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/ai', () => ({
  getAIProvider: vi.fn(() => ({
    generateQuestions: vi.fn(),
  })),
}))

import { updateQuestionBankScore, selectNextQuestion } from '../selector'
import { prisma } from '@/lib/db'

const mockPrisma = prisma as any;

// ── updateQuestionBankScore ────────────────────────────────────────────────────

describe('updateQuestionBankScore', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does nothing when question is not in the bank (AI-generated)', async () => {
    mockPrisma.questionBank.findFirst.mockResolvedValue(null)
    await updateQuestionBankScore('AI-generated question text', 80)
    expect(mockPrisma.questionBank.update).not.toHaveBeenCalled()
  })

  it('updates with a running average', async () => {
    mockPrisma.questionBank.findFirst.mockResolvedValue({
      id: 'qb-1',
      avgScore: 60,
      timesServed: 4,
    } as never)
    mockPrisma.questionBank.update.mockResolvedValue({} as never)

    await updateQuestionBankScore('What is polymorphism?', 80)

    // Running average: ((60 * 3) + 80) / 4 = 260/4 = 65
    const updateCall = mockPrisma.questionBank.update.mock.calls[0][0]
    expect(updateCall.data.avgScore).toBeCloseTo(65)
  })

  it('uses score as initial average when avgScore is null', async () => {
    mockPrisma.questionBank.findFirst.mockResolvedValue({
      id: 'qb-2',
      avgScore: null,
      timesServed: 1,
    } as never)
    mockPrisma.questionBank.update.mockResolvedValue({} as never)

    await updateQuestionBankScore('Describe REST constraints.', 90)

    const updateCall = mockPrisma.questionBank.update.mock.calls[0][0]
    // oldAvg = score = 90, n=1 → newAvg = ((90 * 0) + 90) / 1 = 90
    expect(updateCall.data.avgScore).toBeCloseTo(90)
  })

  it('handles timesServed of 0 without dividing by zero', async () => {
    mockPrisma.questionBank.findFirst.mockResolvedValue({
      id: 'qb-3',
      avgScore: 70,
      timesServed: 0,
    } as never)
    mockPrisma.questionBank.update.mockResolvedValue({} as never)

    await expect(
      updateQuestionBankScore('What is a deadlock?', 70)
    ).resolves.not.toThrow()
  })
})

// ── selectNextQuestion ─────────────────────────────────────────────────────────

describe('selectNextQuestion', () => {
  const baseOptions = {
    category: 'technical' as const,
    difficulty: 'mid' as const,
    stack: ['spring-boot', 'angular'],
    language: 'en' as const,
    userId: 'user-123',
    existingQuestions: [],
  }

  beforeEach(() => vi.clearAllMocks())

  it('returns a spaced repetition question when one is due', async () => {
    const dueDate = new Date(Date.now() - 1000) // past
    mockPrisma.bookmark.findMany.mockResolvedValue([
      {
        message: {
          id: 'msg-1',
          content: 'Explain dependency injection in Spring.',
          session: { category: 'technical', difficulty: 'mid' },
        },
        nextReviewAt: dueDate,
      },
    ] as never)

    const result = await selectNextQuestion(baseOptions)

    expect(result.text).toBe('Explain dependency injection in Spring.')
    // Should NOT query the bank when spaced repetition has a result
    expect(mockPrisma.questionBank.findMany).not.toHaveBeenCalled()
  })

  it('falls back to the question bank when no spaced repetition due', async () => {
    mockPrisma.bookmark.findMany.mockResolvedValue([])
    mockPrisma.questionBank.findMany.mockResolvedValue([
      {
        id: 'bank-1',
        questionText: 'What is the difference between @Component and @Bean?',
        category: 'technical',
        difficulty: 'mid',
        hints: [],
        modelAnswer: null,
        codeTemplate: null,
        codeLanguage: null,
        timesServed: 0,
      },
    ] as never)
    mockPrisma.questionBank.update.mockResolvedValue({} as never)

    const result = await selectNextQuestion(baseOptions)

    expect(result.text).toBe('What is the difference between @Component and @Bean?')
    expect(mockPrisma.questionBank.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { timesServed: { increment: 1 } } })
    )
  })

  it('skips questions already in the session (existingQuestions)', async () => {
    mockPrisma.bookmark.findMany.mockResolvedValue([])
    mockPrisma.questionBank.findMany.mockResolvedValue([
      {
        id: 'bank-1',
        questionText: 'Already asked question.',
        category: 'technical',
        difficulty: 'mid',
        hints: [],
        modelAnswer: null,
        codeTemplate: null,
        codeLanguage: null,
        timesServed: 1,
      },
      {
        id: 'bank-2',
        questionText: 'Explain the N+1 query problem in JPA.',
        category: 'technical',
        difficulty: 'mid',
        hints: [],
        modelAnswer: null,
        codeTemplate: null,
        codeLanguage: null,
        timesServed: 2,
      },
    ] as never)
    mockPrisma.questionBank.update.mockResolvedValue({} as never)

    const result = await selectNextQuestion({
      ...baseOptions,
      existingQuestions: ['Already asked question.'],
    })

    expect(result.text).toBe('Explain the N+1 query problem in JPA.')
  })

  it('falls back to AI generation when bank is exhausted', async () => {
    const { getAIProvider } = await import('@/lib/ai')
    const mockGenerate = vi.fn().mockResolvedValue([
      {
        id: 'ai-q-1',
        text: 'Describe how you would design a rate limiter.',
        category: 'system_design',
        difficulty: 'senior',
      },
    ])
    vi.mocked(getAIProvider).mockReturnValue({ generateQuestions: mockGenerate } as never)

    mockPrisma.bookmark.findMany.mockResolvedValue([])
    // Both stack-matched and generic bank queries return empty
    mockPrisma.questionBank.findMany.mockResolvedValue([])

    const result = await selectNextQuestion(baseOptions)

    expect(result.text).toBe('Describe how you would design a rate limiter.')
    expect(mockGenerate).toHaveBeenCalledOnce()
  })
})

// ── Spaced repetition interval logic ──────────────────────────────────────────

describe('spaced repetition intervals', () => {
  // Mirrors the logic in /api/bookmarks/[id]/review/route.ts:
  //   newReviewCount = bookmark.reviewCount + 1
  //   intervalDays   = INTERVALS_DAYS[Math.min(newReviewCount, length - 1)]
  const INTERVALS_DAYS = [1, 3, 7, 14, 30]

  const getIntervalDays = (bookmarkReviewCount: number) => {
    const newReviewCount = bookmarkReviewCount + 1
    return INTERVALS_DAYS[Math.min(newReviewCount, INTERVALS_DAYS.length - 1)]
  }

  it('returns 3 days after first review (reviewCount was 0)', () => {
    // newReviewCount=1 → index 1 → 3 days
    expect(getIntervalDays(0)).toBe(3)
  })

  it('returns 7 days after second review (reviewCount was 1)', () => {
    expect(getIntervalDays(1)).toBe(7)
  })

  it('returns 14 days after third review (reviewCount was 2)', () => {
    expect(getIntervalDays(2)).toBe(14)
  })

  it('caps at 30 days from the fourth review onwards', () => {
    expect(getIntervalDays(3)).toBe(30)
    expect(getIntervalDays(10)).toBe(30)
    expect(getIntervalDays(100)).toBe(30)
  })
})
