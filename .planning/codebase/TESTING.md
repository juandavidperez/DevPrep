# Testing Patterns

**Analysis Date:** 2026-04-19

## Test Framework

**Runner:**
- Vitest (version in devDependencies)
- Config: `vitest.config.ts` (project root)
- React plugin: `@vitejs/plugin-react`

**Assertion Library:**
- Vitest built-in (`expect`) + `@testing-library/jest-dom` matchers (`.toBeInTheDocument()`, `.not.toBeInTheDocument()`)

**Run Commands:**
```bash
npm run test          # Vitest watch mode
npm run test:run      # Run all tests once (CI)
npm run test:coverage # Run with v8 coverage report
```

## Test File Organization

**Location:**
- Co-located under `__tests__/` subdirectory within the module or component folder
- Pattern: `src/lib/<module>/__tests__/<module>.test.ts`
- Pattern: `src/components/<feature>/__tests__/<Component>.test.tsx`

**Naming:**
- `<subject>.test.ts` for pure logic
- `<Component>.test.tsx` for React components

**Structure:**
```
src/
  lib/
    ai/
      __tests__/
        parser.test.ts
        routing.test.ts
    questions/
      __tests__/
        selector.test.ts
  components/
    bookmarks/
      __tests__/
        BookmarksClient.test.tsx
  test/
    setup.ts          # Global setup (imports @testing-library/jest-dom)
```

## Test Structure

**Suite Organization:**
```typescript
// Separate describe blocks per feature area, not one big block
describe('ComponentName — rendering', () => { ... })
describe('ComponentName — tab switching', () => { ... })
describe('ComponentName — category filter', () => { ... })

// Library functions: one describe per exported function
describe('parseEvaluation', () => { ... })
describe('parseQuestions', () => { ... })
describe('FALLBACK_EVALUATION', () => { ... })
```

**Patterns:**
- Setup: `beforeEach(() => vi.clearAllMocks())` to reset mock state between tests
- Env restoration: save/restore `process.env` in `beforeEach`/`afterEach`:
  ```typescript
  const original = { ...process.env }
  beforeEach(() => { delete process.env.AI_ROUTING })
  afterEach(() => { process.env = { ...original } })
  ```
- Global stubs: `vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))` for fetch-dependent tests

**Section dividers in test files:**
```typescript
// ── parseEvaluation ────────────────────────────────────────────────────────────
```

## Mocking

**Framework:** Vitest (`vi`)

**Module mocking (hoisted):**
```typescript
// Must appear before any imports of the module under test
vi.mock('../providers/anthropic', () => ({ AnthropicProvider: vi.fn() }))
vi.mock('@/lib/db', () => ({
  prisma: {
    questionBank: { findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    bookmark: { findMany: vi.fn() },
  },
}))
```

**Typed mock references:**
```typescript
const mockPrisma = vi.mocked(prisma)
// Then use:
mockPrisma.questionBank.findFirst.mockResolvedValue({ id: 'qb-1', avgScore: 60, timesServed: 4 } as never)
```

**Note:** `as never` is used on Prisma mock return values because Prisma's generated types are complex; this is intentional in test code only.

**Constructor mocks (for factory pattern testing):**
```typescript
// vi.fn() without arrow — allows use as constructor with `new`
vi.mock('../providers/ollama', () => ({ OllamaProvider: vi.fn() }))
// Assertion:
expect(OllamaProvider).toHaveBeenCalledOnce()
```

**One-off mock implementations:**
```typescript
vi.mocked(AnthropicProvider).mockImplementationOnce(() => {
  throw new Error('Missing API key')
})
```

**next-intl mock (for i18n components):**
```typescript
vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string) => key,
}))
// Result: translation keys render as-is, making assertions straightforward
// expect(screen.getByText('title')).toBeInTheDocument()  // 'title' is the key
```

**What to Mock:**
- All external providers (AI providers, DB clients) — never hit real APIs in tests
- `fetch` global when component calls API routes directly
- `next-intl` `useTranslations` in component tests
- `process.env` for env-dependent routing logic

**What NOT to Mock:**
- Pure parsing/validation logic (test `parseEvaluation` with real inputs)
- Domain logic utilities — test them directly

## Fixtures and Factories

**Factory pattern for complex test objects:**
```typescript
const makeBookmark = (overrides: Partial<{
  id: string
  nextReviewAt: Date | null
  reviewCount: number
  score: number | null
  modelAnswer: string | null
  category: string
  difficulty: string
  content: string
}> = {}) => {
  const {
    id = 'bm-1',
    nextReviewAt = null,
    // ... defaults
  } = overrides

  return { id, createdAt: new Date('2025-01-01'), /* full shape */ }
}
```

**Inline test data:**
- Simple primitives defined inline within `it()` blocks
- Shared across a `describe` scope when used in multiple tests (const at `describe` level)

**Location:**
- Fixtures defined at the top of each test file — no shared fixture files

## Coverage

**Requirements:** No minimum enforced (no `thresholds` in `vitest.config.ts`)

**Provider configuration:** v8 (fast, native)

**Excluded from coverage:**
- `node_modules`, `.next`, `src/test/`
- `**/*.d.ts`, `**/*.config.*`
- Next.js scaffold files: `layout.tsx`, `loading.tsx`, `not-found.tsx`

**View Coverage:**
```bash
npm run test:coverage
# HTML report generated in coverage/ directory
```

## Test Types

**Unit Tests:**
- Pure logic: `src/lib/ai/__tests__/parser.test.ts` — tests parser with raw string inputs
- Factory routing: `src/lib/ai/__tests__/routing.test.ts` — tests provider selection by env var
- Domain logic: `src/lib/questions/__tests__/selector.test.ts` — tests DB-backed question selection

**Integration Tests (component + DOM):**
- Component behavior: `src/components/bookmarks/__tests__/BookmarksClient.test.tsx` — renders real component, uses `@testing-library/react`, fires DOM events

**E2E Tests:** Not used

## Common Patterns

**Async component testing:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

it('removes bookmark from the list after delete', async () => {
  render(<BookmarksClient bookmarks={[bookmark]} />)
  fireEvent.click(removeBtn)

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/bookmarks/bm-1', { method: 'DELETE' })
  })
})
```

**Error/throw testing:**
```typescript
it('throws on invalid JSON', () => {
  expect(() => parseEvaluation('not json at all')).toThrow()
})
```

**Negative assertions:**
```typescript
expect(screen.queryByText('Future question.')).not.toBeInTheDocument()
// Use queryBy* (not getBy*) when asserting element absence
```

**Env-based routing testing:**
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.AI_ROUTING
})
it('returns OllamaProvider when AI_PROVIDER is unset', () => {
  delete process.env.AI_PROVIDER
  getAIProvider()
  expect(OllamaProvider).toHaveBeenCalledOnce()
})
```

**Inline logic tests (mirroring production code in tests):**
```typescript
// selector.test.ts mirrors the interval logic from the API route to test it in isolation
const INTERVALS_DAYS = [1, 3, 7, 14, 30]
const getIntervalDays = (bookmarkReviewCount: number) => {
  const newReviewCount = bookmarkReviewCount + 1
  return INTERVALS_DAYS[Math.min(newReviewCount, INTERVALS_DAYS.length - 1)]
}
```

## Setup File

`src/test/setup.ts` — single line:
```typescript
import '@testing-library/jest-dom'
```
Loaded via `vitest.config.ts` `setupFiles` — makes all jest-dom matchers available globally without per-file imports.

---

*Testing analysis: 2026-04-19*
