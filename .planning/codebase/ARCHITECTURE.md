# Architecture

**Analysis Date:** 2026-04-19

## Pattern Overview

**Overall:** Layered Next.js 15 App Router application with provider-pattern abstractions at every processing boundary.

**Key Characteristics:**
- Each phase (text → voice → avatar) adds a new layer without rewriting previous ones
- Server-side API routes handle all AI/speech/DB operations; client components call these routes via fetch
- All user input and AI output flow through the `InteractionManager` abstraction regardless of modality
- Provider pattern used for every external service (AI, STT, TTS) — swap via env vars, no code changes required
- Demo mode is a first-class concern: sessions without auth are supported via `isDemo` flag

## Layers

**Presentation Layer:**
- Purpose: Render UI, collect user input, play audio output
- Location: `src/app/[locale]/`, `src/components/`
- Contains: Page components (Server Components for data fetching), client components for interactivity
- Depends on: API routes, `@/navigation`, `@/types/session`
- Used by: End users via browser

**Interaction Manager:**
- Purpose: Unified interface for all input/output modalities — text, voice, and (Phase 3) avatar
- Location: `src/lib/interaction/`
- Contains: `types.ts` (UserInput, AIOutput, AvatarDirective interfaces), `index.ts` (`transcribeAudio()`, `synthesizeAudio()` functions)
- Depends on: `/api/speech/stt`, `/api/speech/tts` API routes
- Used by: `src/components/session/ChatContainer.tsx`

**Processing Layer — AI Engine:**
- Purpose: Generate interview questions and evaluate candidate responses
- Location: `src/lib/ai/`
- Contains: `AIProvider` interface (`types.ts`), provider implementations in `providers/`, factory in `index.ts`, prompt templates in `prompts.ts`, Zod-validated response parser in `parser.ts`
- Depends on: External AI APIs (Anthropic, OpenAI, Gemini) or local Ollama
- Used by: `src/app/api/sessions/route.ts`, `src/app/api/sessions/[id]/messages/route.ts`, `src/lib/questions/selector.ts`

**Processing Layer — Speech Engine:**
- Purpose: Speech-to-text transcription and text-to-speech synthesis
- Location: `src/lib/speech/`
- Contains: `STTProvider`/`TTSProvider` interfaces (`types.ts`), provider implementations in `providers/`, factory in `index.ts`
- Depends on: faster-whisper-server (local) or OpenAI Whisper API (STT); Kokoro FastAPI, OpenAI TTS, or ElevenLabs (TTS)
- Used by: `src/app/api/speech/stt/route.ts`, `src/app/api/speech/tts/route.ts`

**Processing Layer — Question Selector:**
- Purpose: Smart question selection: spaced repetition → bank → AI fallback
- Location: `src/lib/questions/`
- Contains: `selector.ts` (`selectNextQuestion()`), `index.ts` re-exports
- Depends on: `src/lib/db.ts` (Prisma), `src/lib/ai/` (AI fallback)
- Used by: `src/app/api/sessions/route.ts`, `src/app/api/sessions/[id]/messages/route.ts`

**Data Layer:**
- Purpose: Persist sessions, messages, user accounts, question bank, bookmarks
- Location: `src/lib/db.ts`, `prisma/schema.prisma`
- Contains: Singleton `PrismaClient`, Prisma schema with `devprep` schema isolation
- Depends on: Supabase PostgreSQL (transaction pooler, port 6543)
- Used by: All API routes

**Auth Layer:**
- Purpose: Authentication and session management
- Location: `src/lib/auth.ts`, `src/lib/auth.config.ts`
- Contains: Auth.js v5 (NextAuth beta) with Google OAuth, PrismaAdapter, JWT strategy
- Depends on: `src/lib/db.ts`, Google OAuth credentials
- Used by: `src/proxy.ts` (middleware), all protected API routes via `auth()`

## Data Flow

**Standard Interview Turn (Text Mode):**

1. User types answer in `ChatContainer.tsx` → calls `POST /api/sessions/[id]/messages`
2. API route retrieves session + question history from Prisma
3. API calls `getAIProvider(category)` to get correct provider (smart routing or static)
4. AI provider `evaluateResponse()` returns `Evaluation` (score, criteria, feedback, modelAnswer)
5. API calls `selectNextQuestion()` → spaced repetition → bank → AI fallback
6. Both evaluation and next question messages saved to `SessionMessage` table
7. Response JSON `{ messages, isComplete, finalScore }` returned to client
8. `ChatContainer` appends new messages to local state, updates UI

**Voice Turn Extension (Phase 2):**

1. User holds MicButton → `useMicrophone` hook records audio blob
2. `ChatContainer` calls `transcribeAudio(blob, options)` from `@/lib/interaction`
3. `transcribeAudio` posts to `/api/speech/stt` → `getSTTProvider()` → STT service
4. Transcript returned, user reviews/edits in `TranscriptDisplay`, then submits
5. After AI response arrives, `synthesizeAudio(text, options)` posts to `/api/speech/tts`
6. TTS audio blob URL stored in `audioUrls` map keyed by `messageId`
7. Evaluation audio auto-plays; on `onEnded`, next question audio plays via `chainPlayId` (chained TTS)

**Question Selection:**

1. `selectNextQuestion(options)` called by API route
2. If authenticated: check `Bookmark` table for spaced-repetition-due questions
3. Try `QuestionBank` — stack-matched first, then any in category
4. If bank exhausted: AI generates via `getAIProvider().generateQuestions()`

**State Management:**
- Server state: Prisma (PostgreSQL via Supabase)
- Client state: React `useState` in `ChatContainer.tsx` — messages array, loading, audio URLs, modality, TTS speed, chain play IDs
- No global client state library (no Redux/Zustand); each page is largely self-contained

## Key Abstractions

**AIProvider Interface:**
- Purpose: Uniform interface for all AI backends
- Examples: `src/lib/ai/providers/anthropic.ts`, `src/lib/ai/providers/ollama.ts`, `src/lib/ai/providers/gemini.ts`, `src/lib/ai/providers/openai.ts`
- Pattern: Factory function `getAIProvider(category?)` in `src/lib/ai/index.ts` selects provider based on `AI_PROVIDER` env var or smart routing table keyed by `QuestionCategory`

**STTProvider / TTSProvider Interfaces:**
- Purpose: Swap speech services without touching call sites
- Examples: `src/lib/speech/providers/WhisperLocalProvider.ts`, `src/lib/speech/providers/KokoroProvider.ts`, `src/lib/speech/providers/OpenAITTSProvider.ts`, `src/lib/speech/providers/ElevenLabsProvider.ts`
- Pattern: Factory functions `getSTTProvider()` / `getTTSProvider()` in `src/lib/speech/index.ts`; TTS providers loaded lazily with dynamic `import()`

**InteractionManager (functional, not class-based):**
- Purpose: Client-facing functions that abstract STT/TTS API calls
- Examples: `transcribeAudio()`, `synthesizeAudio()` in `src/lib/interaction/index.ts`
- Pattern: Functions return `null` on provider unavailability — callers degrade gracefully (voice → text fallback)

**Question Selector:**
- Purpose: Prioritized question sourcing with no duplication within a session
- Location: `src/lib/questions/selector.ts`
- Pattern: Waterfall — spaced repetition → bank (stack-matched) → bank (any) → AI generation

## Entry Points

**App Entry (Next.js):**
- Location: `src/app/[locale]/layout.tsx`
- Triggers: All page requests under `/{locale}/`
- Responsibilities: Locale setup, auth provider, global layout

**Middleware:**
- Location: `src/proxy.ts`
- Triggers: Every non-API, non-static request
- Responsibilities: Auth.js v5 check + next-intl locale prefix enforcement (chained)

**API: Create Session:**
- Location: `src/app/api/sessions/route.ts`
- Triggers: `POST /api/sessions`
- Responsibilities: Validate input, create `Session` record, select first question, persist first `SessionMessage`

**API: Send Message:**
- Location: `src/app/api/sessions/[id]/messages/route.ts`
- Triggers: `POST /api/sessions/[id]/messages`
- Responsibilities: Evaluate response via AI, select next question, persist messages, mark session complete when done

**API: Speech:**
- Location: `src/app/api/speech/stt/route.ts`, `src/app/api/speech/tts/route.ts`
- Triggers: `POST /api/speech/stt`, `POST /api/speech/tts`
- Responsibilities: Proxy audio to/from speech providers; STT accepts `multipart/form-data`, TTS streams audio back

## Error Handling

**Strategy:** Fail-silent for non-critical paths (speech), throw-and-return-500 for critical paths (AI, DB)

**Patterns:**
- STT/TTS unavailability: `SttUnavailableError`/`TtsUnavailableError` caught at route level, returns `{ error: 'stt_unavailable' }` JSON; `transcribeAudio()` / `synthesizeAudio()` return `null` on any failure
- AI provider errors: caught in API routes, returned as `{ error: "..." }` with HTTP 500
- Auth failures: API routes call `auth()` and return HTTP 401 if no session
- Client errors: `ChatContainer` maintains `error` state shown in UI with retry option

## Cross-Cutting Concerns

**Logging:** `console.warn` / `console.error` in server code only (e.g., `[AI] Smart routing failed...`). No structured logging framework.

**Validation:** Zod used for AI response parsing in `src/lib/ai/parser.ts`. Request body validation done with manual checks in API routes (no Zod on HTTP layer).

**Authentication:** `auth()` from `src/lib/auth.ts` called at the top of every protected API route handler. Demo mode bypasses auth by checking `isDemo` flag in request body.

**i18n:** `next-intl` with `localePrefix: 'always'`. All pages under `src/app/[locale]/`. Client components use `Link`/`useRouter` from `@/navigation` for locale-aware routing. Server component `redirect()` uses `next/navigation`.

---

*Architecture analysis: 2026-04-19*
