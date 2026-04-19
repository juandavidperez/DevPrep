# Coding Conventions

**Analysis Date:** 2026-04-19

## Naming Patterns

**Files:**
- React components: PascalCase — `ChatContainer.tsx`, `BookmarksClient.tsx`, `MicButton.tsx`
- Hooks: camelCase prefixed with `use` — `useMicrophone.ts`, `useAvatarState.ts`
- API route handlers: Next.js convention — `route.ts` inside `app/api/[segment]/`
- Library modules: camelCase index — `src/lib/ai/index.ts`, `src/lib/speech/index.ts`
- Type declaration files: `*.d.ts` suffix — `src/types/next-auth.d.ts`
- Test files: `__tests__/` subdirectory, same name as module — `parser.test.ts`

**Functions:**
- Exported utility functions: camelCase — `getAIProvider()`, `transcribeAudio()`, `selectNextQuestion()`
- React components: PascalCase named exports — `export function ChatContainer()`
- Private class methods: camelCase — `private async chat()`
- Formatters/helpers: camelCase verb+noun — `formatTime()`, `parseEvaluation()`

**Variables:**
- State variables: camelCase noun — `isLoading`, `pendingTranscript`, `ttsSpeed`
- Boolean state: `is*` prefix — `isLoading`, `isComplete`, `isDemo`
- Map state: descriptive noun — `audioUrls` (type `Map<string, string>`)
- Constants: UPPER_SNAKE_CASE for module-level consts — `VALID_CATEGORIES`, `DEFAULT_MODEL`, `MIN_QUESTIONS`, `DEMO_MAX_QUESTIONS`

**Types/Interfaces:**
- Interfaces: PascalCase with descriptive suffix — `AIProvider`, `SessionConfig`, `ChatContainerProps`, `STTOptions`
- Type aliases: PascalCase — `QuestionCategory`, `Difficulty`
- DTOs: PascalCase with `DTO` suffix — `SessionMessageDTO`
- Request types: PascalCase with `Request` suffix — `CreateSessionRequest`

## Code Style

**Formatting:**
- No Prettier config detected — project relies on ESLint (next/core-web-vitals, next/typescript)
- Indentation: 2 spaces (consistent throughout source)
- Quotes: double quotes in TSX/JSX files (`"use client"`, JSX props), single quotes in pure TS files
- Semicolons: present throughout

**Linting:**
- Tool: ESLint flat config (`eslint.config.mjs`)
- Extends: `next/core-web-vitals`, `next/typescript`
- Custom rule: `@typescript-eslint/no-unused-vars: error` with `argsIgnorePattern: "^_"` (underscore prefix to suppress warnings)

## Import Organization

**Order observed in source files:**
1. React/Next.js core — `import { useState, useRef } from "react"`, `import { NextResponse } from "next/server"`
2. Third-party packages — `import Anthropic from '@anthropic-ai/sdk'`
3. Internal absolute imports via `@/` alias — `import { auth } from "@/lib/auth"`, `import { prisma } from "@/lib/db"`
4. Internal relative imports — `import { parseEvaluation } from '../parser'`
5. Type-only imports last — `import type { AIProvider, Question } from '../types'`

**Path Aliases:**
- `@/*` maps to `src/*` (configured in `tsconfig.json` and `vitest.config.ts`)
- Always use `@/` for cross-directory imports; relative paths only within the same module folder

## Error Handling

**API route pattern:**
- Top-level validation first, return `NextResponse.json({ error: "..." }, { status: 4xx })` early
- Wrap DB/external calls in `try/catch`, return `{ status: 500 }` with a user-facing message
- Log with `console.error("context:", error)` before returning

**Library pattern:**
- Provider methods catch their own errors and return fallback values (e.g., `FALLBACK_EVALUATION`, `null`, `[]`)
- Never throw from public API surfaces — callers should not need to wrap provider calls
- Parse retries: first attempt with normal prompt; if `parseEvaluation` throws, retry with strict prompt (`AnthropicProvider.evaluateResponse`)

**Client functions:**
- Return `null` on failure instead of throwing — `transcribeAudio()` and `synthesizeAudio()` both return `Promise<string | null>`
- Swallow catch blocks silently when failure is non-critical (TTS is marked "fail silently")

## Logging

**Pattern:**
- Namespace prefix in brackets: `[AnthropicProvider]`, `[AI]`, `"Failed to create session:"`
- `console.error` for unrecoverable errors
- `console.warn` for recoverable/retry situations
- `console.error` in catch blocks always includes the error object as second argument

## Comments

**When to Comment:**
- Module-level JSDoc blocks for exported utility functions explaining purpose and return semantics
- Inline `//` comments to explain non-obvious logic (running average formula, API limits)
- Phase markers: `// Phase 2: voice state`, `// Phase 3 will extend this...`
- Section dividers with `// ──` rule lines (used in test files to separate describe blocks)

**Example pattern from `src/lib/interaction/index.ts`:**
```typescript
/**
 * Transcribe an audio blob to text via the STT API route.
 * Returns null if the provider is unavailable (caller should fallback to text mode).
 */
export async function transcribeAudio(blob: Blob, options: STTOptions): Promise<string | null>
```

## Function Design

**Size:** Functions are small and single-purpose. Provider methods (`generateQuestions`, `evaluateResponse`) each handle one API call.

**Parameters:** 
- Prefer options objects for 3+ parameters — `STTOptions`, `TTSOptions`, `selectNextQuestion(options)`
- Simple scalar params stay positional — `parseEvaluation(input: string)`, `formatTime(seconds: number)`

**Return Values:**
- Async functions explicitly return typed promises — `Promise<Question[]>`, `Promise<string | null>`
- Nullable returns use `| null` union, not `undefined`

## Module Design

**Exports:**
- Named exports only — no default exports for components or lib functions (except Next.js page/layout files where default export is required)
- Class implementations exported by name: `export class AnthropicProvider`

**Barrel Files:**
- Each `src/lib/*/index.ts` re-exports the public API — `src/lib/ai/index.ts`, `src/lib/interaction/index.ts`
- Internal implementation files (providers, parser) are not re-exported unless needed externally

**"use client" directive:**
- Placed as first line in client component files: `"use client";`
- Server components have no directive (default in Next.js App Router)

## TypeScript Patterns

**Type assertions:** `as never` used in mock data in tests to satisfy Prisma's complex generated types — not used in production code.

**Const assertions:** `as const` used with discriminated unions in Anthropic SDK calls:
```typescript
{ type: 'text' as const, cache_control: { type: 'ephemeral' as const } }
```

**Interface vs type:** Interfaces used for object shapes (`AIProvider`, `Question`), `type` used for union aliases (`QuestionCategory`, `Difficulty`).

---

*Convention analysis: 2026-04-19*
