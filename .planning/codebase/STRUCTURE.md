# Codebase Structure

**Analysis Date:** 2026-04-19

## Directory Layout

```
DevPrep/
├── src/
│   ├── app/                        # Next.js App Router root
│   │   ├── [locale]/               # All user-facing pages (locale-prefixed)
│   │   │   ├── layout.tsx          # Root layout with providers
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── auth/signin/        # Google OAuth sign-in page
│   │   │   ├── bookmarks/          # Saved questions + spaced repetition
│   │   │   ├── dashboard/          # Stats and session history overview
│   │   │   ├── history/            # Full session history with filters
│   │   │   ├── session/
│   │   │   │   ├── new/            # Session configuration form
│   │   │   │   └── [id]/           # Live chat interview page
│   │   │   │       └── results/    # Per-question breakdown after session
│   │   │   └── settings/           # User preferences
│   │   ├── api/                    # Next.js API routes (server-side only)
│   │   │   ├── auth/[...nextauth]/ # Auth.js v5 handler
│   │   │   ├── bookmarks/          # Bookmark CRUD + review
│   │   │   │   └── [id]/review/
│   │   │   ├── sessions/           # Create session + list
│   │   │   │   └── [id]/
│   │   │   │       └── messages/   # Send answer, receive eval + next question
│   │   │   ├── settings/           # User settings GET/PUT
│   │   │   └── speech/
│   │   │       ├── stt/            # Speech-to-text proxy route
│   │   │       └── tts/            # Text-to-speech proxy route
│   │   └── globals.css             # Global CSS + design tokens (CSS custom props)
│   ├── components/                 # React components (all client or mixed)
│   │   ├── bookmarks/              # BookmarksClient + tests
│   │   ├── history/                # HistoryFilters, SessionList
│   │   ├── providers/              # AuthProvider (wraps SessionProvider)
│   │   ├── session/                # Core interview UI
│   │   │   ├── ChatContainer.tsx   # Main interview orchestrator (client)
│   │   │   ├── ChatInput.tsx       # Text input with code toggle
│   │   │   ├── CodeEditor.tsx      # Code editor panel
│   │   │   ├── MessageBubble.tsx   # Individual message display
│   │   │   ├── ResultsView.tsx     # Session results display
│   │   │   ├── SessionConfigForm.tsx # New session form
│   │   │   └── voice/              # Phase 2 voice components
│   │   │       ├── MicButton.tsx
│   │   │       ├── VoiceToggle.tsx
│   │   │       ├── WaveformVisualizer.tsx
│   │   │       ├── TranscriptDisplay.tsx
│   │   │       ├── AudioPlayback.tsx
│   │   │       └── useMicrophone.ts
│   │   ├── settings/               # SettingsForm component
│   │   └── ui/                     # Shared UI primitives (e.g., Skeleton.tsx)
│   ├── i18n/
│   │   ├── config.ts               # Locale list + defaultLocale
│   │   └── request.ts              # Server-side next-intl config
│   ├── lib/                        # Business logic and service abstractions
│   │   ├── ai/                     # AI provider abstraction
│   │   │   ├── index.ts            # Factory: getAIProvider(), getDemoAIProvider()
│   │   │   ├── types.ts            # AIProvider interface, Question, Evaluation types
│   │   │   ├── prompts.ts          # Prompt templates for question gen + evaluation
│   │   │   ├── parser.ts           # Zod-validated AI response parser
│   │   │   └── providers/
│   │   │       ├── anthropic.ts
│   │   │       ├── gemini.ts
│   │   │       ├── ollama.ts
│   │   │       └── openai.ts
│   │   ├── interaction/            # Modality abstraction (client-callable)
│   │   │   ├── index.ts            # transcribeAudio(), synthesizeAudio()
│   │   │   └── types.ts            # UserInput, AIOutput, AvatarDirective interfaces
│   │   ├── questions/              # Question selection logic
│   │   │   ├── index.ts            # Re-exports
│   │   │   └── selector.ts         # selectNextQuestion() waterfall
│   │   ├── speech/                 # Speech provider abstraction (server-side)
│   │   │   ├── index.ts            # Factory: getSTTProvider(), getTTSProvider()
│   │   │   ├── types.ts            # STTProvider, TTSProvider interfaces + error classes
│   │   │   └── providers/
│   │   │       ├── WhisperLocalProvider.ts
│   │   │       ├── WhisperAPIProvider.ts
│   │   │       ├── KokoroProvider.ts
│   │   │       ├── OpenAITTSProvider.ts
│   │   │       └── ElevenLabsProvider.ts
│   │   ├── auth.ts                 # Auth.js v5 init with PrismaAdapter
│   │   ├── auth.config.ts          # Auth config (providers, callbacks)
│   │   └── db.ts                   # Prisma singleton (globalThis pattern)
│   ├── navigation.ts               # Locale-aware Link, useRouter, redirect (next-intl)
│   ├── proxy.ts                    # Middleware: Auth.js + next-intl chained
│   ├── test/                       # Shared test utilities and setup
│   └── types/
│       ├── next-auth.d.ts          # NextAuth session type augmentation
│       └── session.ts              # DTO types: SessionMessageDTO, ResultsData, etc.
├── prisma/
│   ├── schema.prisma               # Prisma schema (devprep schema, multiSchema preview)
│   ├── seed.ts                     # Question bank seeder
│   └── seeds/                      # JSON seed files (320 questions)
│       ├── technical.json
│       ├── coding.json
│       ├── system-design.json
│       ├── behavioral.json
│       ├── technical-es.json
│       ├── coding-es.json
│       ├── system-design-es.json
│       └── behavioral-es.json
├── messages/
│   ├── en.json                     # English i18n strings
│   └── es.json                     # Spanish i18n strings
├── public/
│   └── avatar/                     # Phase 3 Rive avatar assets
├── scripts/
│   └── swap-test.ts                # Utility script
├── .agents/skills/                 # Agent skill definitions (Stitch MCP, etc.)
├── .claude/skills/                 # Claude skill definitions
├── .planning/codebase/             # Architecture analysis documents (this directory)
├── .github/workflows/              # CI/CD pipeline definitions
├── .husky/                         # Git hooks
├── CLAUDE.md                       # Project instructions for Claude Code
└── devprep-master.md               # Full architecture spec and phase roadmap
```

## Directory Purposes

**`src/app/[locale]/`:**
- Purpose: All user-facing pages using Next.js App Router
- Contains: Server Components that fetch data server-side, then pass to client components as props
- Key files: `layout.tsx` (root layout), `session/[id]/page.tsx` (main interview page)

**`src/app/api/`:**
- Purpose: All server-side API handlers — AI calls, DB writes, speech proxy
- Contains: `route.ts` files only. No shared utilities here; those live in `src/lib/`
- Key files: `sessions/route.ts`, `sessions/[id]/messages/route.ts`, `speech/stt/route.ts`, `speech/tts/route.ts`

**`src/components/session/`:**
- Purpose: Core interview experience UI — the most complex component subtree
- Key file: `ChatContainer.tsx` — orchestrates all modalities, audio chaining, and message state

**`src/components/session/voice/`:**
- Purpose: Phase 2 voice modality UI components
- All voice-specific UI is isolated here; `ChatContainer.tsx` conditionally renders based on `inputModality`

**`src/lib/ai/`:**
- Purpose: All AI-related logic. Never import AI providers directly in API routes — always go through the factory in `index.ts`
- Key files: `index.ts` (factory + smart routing), `prompts.ts` (prompt templates), `parser.ts` (Zod validation)

**`src/lib/speech/`:**
- Purpose: Server-only speech provider abstractions. These are never imported by client components
- Client code uses `src/lib/interaction/index.ts` instead, which calls `/api/speech/*` routes

**`src/lib/interaction/`:**
- Purpose: Client-importable functions that abstract speech API calls. The bridge between client components and server speech routes
- Key: This is the only speech-related code that runs in the browser

**`src/lib/questions/`:**
- Purpose: Question selection logic with spaced repetition, bank lookup, and AI fallback

**`prisma/seeds/`:**
- Purpose: Static JSON files loaded once via `prisma db seed`. 8 files covering 4 categories × 2 languages
- Generated: No. Committed: Yes

**`messages/`:**
- Purpose: i18n translation strings. Namespaces: `HomePage`, `Navbar`, `Metadata`, `Dashboard`, `Login`, `SessionConfig`, `Settings`, `History`
- Generated: No. Committed: Yes

**`public/avatar/`:**
- Purpose: Phase 3 Rive `.riv` animation files (planned; idle/listening/thinking assets may be present)
- Generated: No. Committed: Yes

## Key File Locations

**Entry Points:**
- `src/proxy.ts`: Middleware — runs on every non-API request; chains Auth.js + next-intl
- `src/app/[locale]/layout.tsx`: Root layout wrapping all pages
- `src/app/[locale]/page.tsx`: Landing page (redirects authenticated users to `/dashboard`)

**Configuration:**
- `src/i18n/config.ts`: Locale list `['en', 'es']` and `defaultLocale`
- `src/lib/auth.config.ts`: Auth.js providers and JWT callbacks
- `prisma/schema.prisma`: Database schema with `devprep` schema isolation
- `src/app/globals.css`: Design tokens as CSS custom properties

**Core Logic:**
- `src/lib/ai/index.ts`: AI provider factory with smart routing
- `src/lib/ai/prompts.ts`: All AI prompt templates
- `src/lib/ai/parser.ts`: Zod schema for AI response validation
- `src/lib/questions/selector.ts`: `selectNextQuestion()` waterfall logic
- `src/lib/speech/index.ts`: Speech provider factories (lazy TTS loading)
- `src/lib/interaction/index.ts`: Client-side `transcribeAudio()` / `synthesizeAudio()`
- `src/lib/db.ts`: Prisma singleton
- `src/navigation.ts`: Locale-aware navigation exports

**Main Interview Flow:**
- `src/app/api/sessions/route.ts`: Session creation
- `src/app/api/sessions/[id]/messages/route.ts`: Answer evaluation + next question
- `src/components/session/ChatContainer.tsx`: Client-side interview orchestrator

**Types:**
- `src/lib/ai/types.ts`: `AIProvider`, `Question`, `Evaluation`, `SessionConfig`
- `src/lib/interaction/types.ts`: `UserInput`, `AIOutput`, `AvatarDirective`
- `src/lib/speech/types.ts`: `STTProvider`, `TTSProvider`, error classes
- `src/types/session.ts`: HTTP DTO types (`SessionMessageDTO`, `ResultsData`, etc.)

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `ChatContainer.tsx`, `MicButton.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useMicrophone.ts`)
- Library modules: `camelCase.ts` (e.g., `selector.ts`, `prompts.ts`, `parser.ts`)
- Provider implementations: `PascalCaseProvider.ts` (e.g., `AnthropicProvider.ts`, `KokoroProvider.ts`)
- API routes: always named `route.ts`
- Page files: always named `page.tsx` or `layout.tsx`

**Directories:**
- Feature grouping: `kebab-case` (e.g., `session/`, `system-design`)
- Next.js dynamic segments: bracket notation (`[id]`, `[locale]`)

## Where to Add New Code

**New Page:**
- Page file: `src/app/[locale]/{page-name}/page.tsx`
- Loading skeleton: `src/app/[locale]/{page-name}/loading.tsx`
- Client component: `src/components/{feature}/{ComponentName}.tsx`
- i18n strings: add namespace to `messages/en.json` and `messages/es.json`

**New API Route:**
- Location: `src/app/api/{resource}/route.ts`
- Pattern: import `auth` from `@/lib/auth`, call `auth()` first, then use `prisma` from `@/lib/db`

**New AI Provider:**
- Implementation: `src/lib/ai/providers/{ProviderName}.ts` implementing `AIProvider` interface
- Registration: add case to `staticProvider()` in `src/lib/ai/index.ts`

**New STT Provider:**
- Implementation: `src/lib/speech/providers/{Name}Provider.ts` implementing `STTProvider`
- Registration: add case to `getSTTProvider()` in `src/lib/speech/index.ts`

**New TTS Provider:**
- Implementation: `src/lib/speech/providers/{Name}Provider.ts` implementing `TTSProvider`
- Registration: add lazy-import case to `getTTSProvider()` in `src/lib/speech/index.ts`

**Shared UI Primitive:**
- Location: `src/components/ui/{ComponentName}.tsx`

**Shared Business Logic:**
- Location: `src/lib/{domain}/` with an `index.ts` re-exporting the public API

**Phase 3 Avatar Code (planned):**
- Canvas component: `src/components/session/AvatarCanvas.tsx`
- Hook: `src/components/session/useAvatarState.ts`
- Engine: `src/lib/avatar/` (new directory, mirrors `src/lib/speech/` pattern)
- Rive assets: `public/avatar/*.riv`

## Special Directories

**`.planning/codebase/`:**
- Purpose: Architecture analysis documents for GSD workflow
- Generated: Yes (by gsd-map-codebase)
- Committed: Yes

**`.agents/skills/`:**
- Purpose: Agent skill definitions (Stitch MCP design workflow)
- Generated: No
- Committed: Yes (except `.mcp.json` which contains API keys)

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No

**`prisma/seeds/`:**
- Purpose: Static question bank JSON (320 questions across 8 files)
- Generated: No (hand-curated)
- Committed: Yes

---

*Structure analysis: 2026-04-19*
