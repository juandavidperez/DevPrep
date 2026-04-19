# Codebase Concerns

**Analysis Date:** 2026-04-19

## Tech Debt

**Phase 3 Avatar — Incomplete State Machine:**
- Issue: `idle`, `listening`, `thinking` Rive animations exist but the state machine, `talking` animation, and all Next.js integration code (`AvatarCanvas.tsx`, `useAvatarState` hook, lip sync, split-screen layout) are not yet built.
- Files: `src/lib/avatar/` (does not exist yet), `devprep-master.md` Section 17
- Impact: Phase 3 is fully blocked until Rive state machine wiring is done in the Rive editor. No code in the repo yet references the avatar engine layer.
- Fix approach: Complete Rive state machine first (inputs: `isListening`, `isThinking`, `isTalking`, `isPositive`, `isConcerned`, `mouthOpen`), export `.riv`, then build the Next.js layer per CLAUDE.md Phase 3 notes.

**Blob URL Memory Leak — TTS Audio:**
- Issue: `synthesizeAudio()` in `src/lib/interaction/index.ts` creates blob URLs via `URL.createObjectURL(blob)` but never calls `URL.revokeObjectURL()`. URLs accumulate in `audioUrls` Map state throughout the session lifetime.
- Files: `src/lib/interaction/index.ts:65`, `src/components/session/ChatContainer.tsx:52`
- Impact: Memory grows for each AI message in voice mode. In a 10-question session, 20+ blob URLs are created and never freed until the page is closed.
- Fix approach: Add a `useEffect` cleanup in `ChatContainer` or inside `synthesizeTTS` that revokes old URLs when new ones are set. Alternatively, use a `useRef` map with cleanup on unmount.

**`AudioPlayback` Suppressed Dependency Warning:**
- Issue: `useEffect` in `src/components/session/voice/AudioPlayback.tsx:62` omits `autoPlay` and `onEnded` from the dependency array, suppressed with `// eslint-disable-next-line react-hooks/exhaustive-deps`. This means prop changes to `autoPlay` or `onEnded` after mount are silently ignored.
- Files: `src/components/session/voice/AudioPlayback.tsx:62`
- Impact: Stale closure risk — if `onEnded` callback reference changes (e.g., parent re-renders), the audio element still fires the old callback. Low probability in practice but fragile.
- Fix approach: Either stabilize `onEnded` with `useCallback` in parent and add it to deps, or use a `useRef` for the callback.

**`SettingsForm` Untyped `any` Cast:**
- Issue: Explicit `any` cast at `src/components/settings/SettingsForm.tsx:75` with `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.
- Files: `src/components/settings/SettingsForm.tsx:75`
- Impact: Bypasses type safety in the settings form submission path; could silently pass wrong shape to the PUT `/api/settings` endpoint.
- Fix approach: Extract and use the proper `UserSettings` Prisma type or a defined request DTO.

**`mixed` Category — Incomplete in Messages Route:**
- Issue: The sessions route accepts `"mixed"` as a valid category (line 7 of `src/app/api/sessions/route.ts`), but `src/app/api/sessions/[id]/messages/route.ts` casts category directly to `Question["category"]` without handling `"mixed"` specially. `selectNextQuestion` supports `"mixed"` but message route line 116 creates a `Question` object with raw category, which may fail type narrowing downstream.
- Files: `src/app/api/sessions/[id]/messages/route.ts:116`, `src/app/api/sessions/route.ts:7`
- Impact: Mixed sessions use whatever category the AI provider evaluates — no explicit category routing in smart mode for mixed sessions.
- Fix approach: Resolve the actual sampled category for each question and store it alongside the question message, or handle `"mixed"` explicitly in the messages route AI call.

**Demo Sessions — No Rate Limiting:**
- Issue: `POST /api/sessions` and `POST /api/sessions/[id]/messages` allow unauthenticated demo traffic with no IP-based rate limit or throttle. Any visitor can trigger unlimited Anthropic Haiku API calls.
- Files: `src/app/api/sessions/route.ts:19-25`, `src/app/api/sessions/[id]/messages/route.ts:35-43`
- Impact: Unbounded API cost if the demo is linked publicly or scraped. Even at Haiku pricing (~$0.002/session), 10k automated sessions = $20+. No protection against denial-of-wallet.
- Fix approach: Add Vercel KV or Upstash Redis rate limiting keyed by IP, or add a CAPTCHA/token on the demo session create endpoint.

**AI Provider Smart Routing Fails Silently:**
- Issue: `getAIProvider()` in `src/lib/ai/index.ts:29-34` catches all errors from `SMART_ROUTE[category]()` and falls back to the static provider. If an API key is missing, the fallback to Ollama (default) might produce vastly different evaluation quality without any user-visible signal.
- Files: `src/lib/ai/index.ts:26-35`
- Impact: Production sessions configured for smart routing could silently use Ollama if env vars are missing or misconfigured, producing low-quality evaluations.
- Fix approach: Log a structured warning to an observability service (not just `console.warn`). Consider a startup validation that checks required API keys when `AI_ROUTING=smart`.

**Silent Mode Batch Evaluation — No Partial Failure Handling:**
- Issue: In silent mode final evaluation (`src/app/api/sessions/[id]/messages/route.ts:172-213`), `Promise.all()` runs all N evaluations in parallel. If any one throws (beyond the inner `null` return for mismatched indexes), the entire batch fails and the session is never marked complete.
- Files: `src/app/api/sessions/[id]/messages/route.ts:172`
- Impact: A transient AI error on question 9 of 10 in silent mode loses all evaluations — user gets a 500 and session hangs open with no score.
- Fix approach: Wrap individual evaluation calls in try/catch, substitute `FALLBACK_EVALUATION` on failure (same pattern used in `AnthropicProvider.evaluateResponse`), and still mark session complete.

## Security Considerations

**Demo API Unauthenticated Surface:**
- Risk: `POST /api/sessions` with `isDemo: true` is fully unauthenticated. Any request body claiming `isDemo: true` skips all auth and creates a DB record + triggers AI calls.
- Files: `src/app/api/sessions/route.ts:19-25`
- Current mitigation: Demo sessions are capped at 3 questions (`DEMO_MAX_QUESTIONS`), and only use a fixed cheap model.
- Recommendations: Add IP rate limiting (Vercel Edge middleware or Upstash). Consider a signed token for the demo endpoint to prevent automated bulk creation.

**STT Route Does Not Handle Demo Sessions:**
- Risk: `POST /api/speech/stt` always requires `session?.user?.id` (line 10) and checks `interviewSession.userId !== session.user.id`. Demo sessions have `userId = null`, so authenticated users can't use voice with demo sessions, and unauthenticated demo users are entirely blocked from STT.
- Files: `src/app/api/speech/stt/route.ts:10-46`
- Current mitigation: Demo sessions use text-only (no voice toggle exposed in the demo landing flow).
- Recommendations: If voice demo is ever desired, extend STT auth check to allow demo sessions analogously to the messages route pattern.

**TTS Route Does Not Handle Demo Sessions:**
- Risk: Same as STT — `POST /api/speech/tts` requires auth unconditionally (line 9).
- Files: `src/app/api/speech/tts/route.ts:9`
- Current mitigation: Demo flow doesn't use voice mode.
- Recommendations: Align with messages route pattern if voice demo is needed.

## Performance Bottlenecks

**N+1 Question Bank Queries — Silent Mode:**
- Problem: Silent mode batch evaluation at session end runs `Promise.all()` across all N answers, each calling `ai.evaluateResponse()` independently. For a 10-question session, this fires 10 parallel AI API calls simultaneously.
- Files: `src/app/api/sessions/[id]/messages/route.ts:172-193`
- Cause: No batching or concurrency limit. Haiku handles this fine at N=10, but at N=15 (max), 15 parallel calls could hit Anthropic's per-minute token limits.
- Improvement path: Add a concurrency limiter (e.g., `p-limit` with limit=5) around the evaluation calls.

**`ChatContainer` Re-renders on Every TTS URL Update:**
- Problem: `audioUrls` is stored as `Map<string, string>` in component state. Every TTS synthesis call creates a new `Map` instance (`new Map(prev).set(...)`), triggering a full re-render of the messages list.
- Files: `src/components/session/ChatContainer.tsx:52`, `src/components/session/ChatContainer.tsx:170`
- Cause: React treats the new Map reference as a state change even if the visible content is identical.
- Improvement path: Use a `useRef` for the audio URL map and manage individual message audio state closer to `MessageBubble`, or use a reducer.

**Large Dashboard Page Component:**
- Problem: `src/app/[locale]/dashboard/page.tsx` is 507 lines — largest file in the codebase — and mixes server-side data fetching, stats calculation, and rendering logic.
- Files: `src/app/[locale]/dashboard/page.tsx`
- Cause: No extraction of sub-components or data-fetching helpers.
- Improvement path: Extract stats fetching to `src/lib/stats.ts`, split into `<RecentSessions>`, `<StatsCards>`, and `<QuickStart>` sub-components.

## Fragile Areas

**Audio Chaining Logic:**
- Files: `src/components/session/ChatContainer.tsx:119-131`, `src/components/session/ChatContainer.tsx:260-270`, `src/components/session/voice/AudioPlayback.tsx:66-71`
- Why fragile: The chain relies on `lastEvalId` and `chainPlayId` state syncing across message renders. If TTS for the next question resolves before `onEnded` fires, or if React batches state updates in an unexpected order, the chain breaks silently (no audio plays).
- Safe modification: Trace the full chain path (eval ends → `setChainPlayId(nextQ.id)` → `triggerPlay` prop → `audio.play()`) before changing any of the three files. Test with slow TTS responses.
- Test coverage: No tests for the audio chaining flow.

**`selectNextQuestion` AI Fallback — Language Consistency:**
- Files: `src/lib/questions/selector.ts:60+`
- Why fragile: When the question bank is exhausted, AI generation is used as fallback. The AI is prompted to generate in the session language, but there is no Zod/schema validation that the returned question actually matches the requested language. A misconfigured or overloaded model could return English for a Spanish session.
- Safe modification: Add a language assertion or post-generation language check before returning.
- Test coverage: Selector tests mock the AI fallback; no test verifies language correctness of AI-generated questions.

## Missing Critical Features

**No Request Input Validation on Message Content:**
- Problem: `POST /api/sessions/[id]/messages` only checks `content?.trim()` is non-empty. There is no maximum length check on `content` or `codeContent`. A user (or bot) can submit arbitrarily large payloads, which are passed directly to the AI provider and persisted to the DB.
- Blocks: Could cause AI provider timeouts (>25s Anthropic limit), Supabase row size issues, or inflated token costs.

**No Structured Error Logging / Observability:**
- Problem: All error handling uses `console.error` / `console.warn`. No structured logging, no error tracking service (Sentry, Datadog, etc.), no alerting.
- Files: All API routes and AI providers use console-only logging.
- Blocks: Production debugging requires Vercel log tailing. No error rate visibility.

## Test Coverage Gaps

**Voice Flow — No Tests:**
- What's not tested: `useMicrophone.ts`, `MicButton.tsx`, `WaveformVisualizer.tsx`, `AudioPlayback.tsx`, `TranscriptDisplay.tsx`, `VoiceToggle.tsx`, the full `transcribeAudio`/`synthesizeAudio` interaction manager path.
- Files: `src/components/session/voice/`, `src/lib/interaction/index.ts`
- Risk: Voice mode regressions go undetected. The audio chaining logic has never been tested.
- Priority: High (core Phase 2 feature, no coverage at all)

**API Routes — No Tests:**
- What's not tested: All routes in `src/app/api/` — sessions, messages, speech (STT/TTS), settings, bookmarks.
- Files: `src/app/api/`
- Risk: Breaking changes to request/response contracts are not caught before deploy.
- Priority: High (auth bypass logic in demo mode is especially risky without tests)

**AI Provider Evaluation — Partial Coverage:**
- What's not tested: `AnthropicProvider`, `OpenAIProvider`, `GeminiProvider`, `OllamaProvider` — only the parser (`src/lib/ai/__tests__/parser.test.ts`) and question selector are tested.
- Files: `src/lib/ai/providers/`
- Risk: Provider-specific JSON parsing failures and fallback behavior are untested.
- Priority: Medium

---

*Concerns audit: 2026-04-19*
