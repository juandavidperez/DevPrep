# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevPrep is an AI-powered mock interview simulator for software developers. It evolves through three phases:
- **Phase 1 (MVP):** Text-based chat interview with AI evaluation ✅
- **Phase 2:** Voice interaction (STT/TTS) alongside text ✅
- **Phase 3:** Animated 2D avatar interviewer with lip sync and expressions ⬜

Full architecture spec: `devprep-master.md`

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint

# Database
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db seed   # Seed question bank (320 questions)

# IMPORTANT: prisma migrate dev hangs on this setup.
# Use Supabase MCP (apply_migration) for DDL changes, then npx prisma generate.

# Local AI (requires Ollama running)
# Default: llama3.1:8b at http://localhost:11434

# Local speech services (Phase 2)
# docker run --rm -p 8000:8000 fedirz/faster-whisper-server:latest-cpu   # STT
# docker run --rm -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest  # TTS
```

## Architecture

**Layered design — each phase adds a layer without rewriting the previous one:**

```
Presentation Layer
  Phase 1: Chat UI (messages, scores)
  Phase 2: + Voice Controls (mic, waveform, transcript, playback) ✅
  Phase 3: + Avatar Canvas (2D character, lip sync, expressions) ⬜
        ↓
Interaction Manager (src/lib/interaction/) — unified interface for all modalities
        ↓
Processing Layer
  Phase 1: AI Engine (src/lib/ai/)
  Phase 2: + Speech Engine (src/lib/speech/) — STT/TTS ✅
  Phase 3: + Avatar Engine (src/lib/avatar/) — animation state machine ⬜
        ↓
Data Layer: Prisma ORM → PostgreSQL (Supabase, "devprep" schema) + Auth.js
```

### Key abstractions

- **AI Provider** (`src/lib/ai/`): `AIProvider` interface with `generateQuestions()`, `evaluateResponse()`. Factory in `index.ts` returns provider based on `AI_PROVIDER` env var. Ollama, Anthropic, OpenAI, and Gemini all implemented ✅.

- **Interaction Manager** (`src/lib/interaction/`): All user input and AI output flows through `InteractionManager` regardless of modality. `UserInput` always has `text` (typed or transcribed) + optional `code`/`audioBlob`. `AIOutput` always has `text` + optional `audioUrl`/`avatarDirective`.

- **Auth** (`src/lib/auth.ts`): Auth.js v5 (NextAuth beta) with Google OAuth, JWT session strategy, PrismaAdapter. Proxy (middleware) in `src/proxy.ts` chains Auth.js with next-intl middleware. (Next.js 16: `middleware.ts` was renamed to `proxy.ts`)

- **Prisma singleton** (`src/lib/db.ts`): Shared PrismaClient instance, prevents multiple clients during hot reload.

### Database

- **Supabase project:** `wjmgvfkwicqhggojlxst` (shared with another app)
- **Schema:** `devprep` (isolated from `public` and `auth`)
- **Prisma:** Uses `multiSchema` preview feature with `schemas = ["devprep"]`
- **Connection:** Transaction pooler (port 6543) for both `DATABASE_URL` and `DIRECT_URL`. Direct connection (IPv6) is unreachable from dev machine.
- **Core models:** `User`, `Account`, `UserSettings`, `Session`, `SessionMessage`, `Bookmark`, `QuestionBank`

### Question bank

320 curated questions in `prisma/seeds/*.json`, loaded via `prisma/seed.ts`. Seeded to Supabase.

**English (200):** 65 junior · 115 mid · 20 senior
- `technical.json` (60): Angular, Spring Boot, PostgreSQL, Docker, Git, GitHub Actions, AWS
- `coding.json` (50): Algorithms, Java, TypeScript, SQL, Testing
- `system-design.json` (50): Architecture, CI/CD, AWS, DB design, monitoring
- `behavioral.json` (40): STAR format

**Spanish (120):** 42 junior · 56 mid · 22 senior
- `technical-es.json` (40): mismo stack, todo en español
- `coding-es.json` (25): algoritmos, TypeScript, Java, SQL con window functions
- `system-design-es.json` (25): arquitectura, patrones distribuidos, AWS
- `behavioral-es.json` (30): formato STAR completo en español

Stack focus: Angular (Standalone, RxJS, Signals), Java 17, Spring Boot (Security JWT, JPA/Hibernate), PostgreSQL, Docker, GitHub Actions, AWS (S3, EC2, RDS, IAM).

> **Selector:** filtra por `language` del campo de sesión. Si no hay match en el banco → AI genera en el idioma seleccionado (sin fallback a inglés).

### AI evaluation

The AI acts as a senior interviewer. Evaluation responses use structured JSON (Zod-validated) with `score` (0-100), `criteria` breakdown, `feedback`, and `modelAnswer`. Criteria vary by category:
- Technical: correctness, depth, practical examples, clarity
- Coding: correctness, time/space complexity, readability, edge cases
- System design: scalability, trade-offs, completeness, communication
- Behavioral: STAR structure, specificity, self-awareness, relevance

### i18n

- **Library:** `next-intl ^4.8.3` with `localePrefix: 'always'`
- **Locales:** `en` (default), `es`
- **Config:** `src/i18n/config.ts` (locales), `src/i18n/request.ts` (server config)
- **Navigation:** `src/navigation.ts` exports locale-aware `Link`, `useRouter`, `usePathname`, `redirect` via `createNavigation()`
- **Translations:** `messages/en.json`, `messages/es.json` — namespaces: HomePage, Navbar, Metadata, Dashboard, Login, SessionConfig, Settings, History
- **Middleware/Proxy:** `src/proxy.ts` chains `next-intl` middleware with Auth.js v5. All routes under `src/app/[locale]/`.
- **IMPORTANT:** In client components, use `Link` and `useRouter` from `@/navigation` (NOT from `next/link` or `next/navigation`), so URLs get the locale prefix automatically. `useSearchParams` still comes from `next/navigation`. Server component `redirect()` uses `next/navigation`.
- **Language switcher:** `src/components/LanguageSwitcher.tsx`

### Implemented pages

All pages are under `src/app/[locale]/`:

```
/                        → Landing (redirects to /dashboard if authenticated)
/auth/signin             → Google OAuth sign-in
/dashboard               → Stats, recent sessions, new session button
/session/new             → Configure session (category, difficulty, question count)
/session/[id]            → Chat interface (main interview experience)
/session/[id]/results    → Session results with per-question breakdown
/history                 → Session history with filters and pagination
/bookmarks               → Saved questions + spaced repetition queue
/settings                → User preferences (language, difficulty, categories, stack)
```

### API routes

```
POST /api/sessions                  → Create session + generate first question
GET  /api/sessions/[id]             → Get session with messages
POST /api/sessions/[id]/messages    → Send response, get AI evaluation + next question
GET  /api/settings                  → Get user settings
PUT  /api/settings                  → Update user settings
POST /api/speech/stt                → Transcribe audio blob → text (multipart/form-data)
POST /api/speech/tts                → Synthesize text → audio stream (JSON body)
```

## Design System — "The Obsidian Terminal"

Design source: **Google Stitch** (project ID: `15023765856949113622`). The Stitch MCP is configured in `.mcp.json` (gitignored, contains API key). Skill `stitch-design` is installed for design workflows.

### Stitch MCP setup

- **MCP config:** `.mcp.json` with `mcp-remote` bridge to `https://stitch.googleapis.com/mcp`
- **Skill:** `.agents/skills/stitch-design/` — handles prompt enhancement, design system synthesis, screen generation/editing
- **Key tools:** `mcp__stitch__list_projects`, `mcp__stitch__list_screens`, `mcp__stitch__get_screen`, `mcp__stitch__generate_screen_from_text`, `mcp__stitch__edit_screens`
- **Project screens available (with HTML):**
  - `13f1dcce...` — Dashboard Redesign (desktop)
  - `a4089fbf...` — Landing Page
  - `06a7aee6...` — Historial de Sesiones
  - `8b61ad3b...` — Crear Nueva Sesión
  - `f46e1030...` — Inicio de Sesión
  - `6abe91e9...` — Login Refined Layout
  - `dd09e42f...` — Obsidian Terminal Edition
  - `36a25a88...` — Dashboard Mobile

### Design tokens (CSS custom properties in `globals.css`)

```
--background: #131313          (The Infinite Void)
--text-primary: #EAEAEA
--text-secondary: #A1A1AA
--surface-lowest: #0e0e0e      (recessed sections)
--surface-container: #201f1f   (default card bg)
--surface-highest: #353534     (hover/elevated)
--primary: #d2bbff             (Electric Violet)
--primary-container: #7c3aed   (CTAs, accent)
--border-subtle: rgba(255,255,255,0.1)
```

### Design rules

- **"No-Line" rule:** No 1px solid high-contrast borders. Use color shifts or ghost borders (10-15% white opacity).
- **Glassmorphism:** Floating elements use backdrop-blur (20-40px) + semi-transparent surface fill.
- **Typography:** Inter for UI, JetBrains Mono for numerical/data/code values.
- **Elevation:** Hierarchy via surface tier stacking (surface-lowest → surface-container → surface-highest).
- **Accent links:** Use `#d2bbff` (primary) not `blue-400`.
- **Shadows:** Tinted shadows `rgba(0,0,0,0.4)` with ghost border outline, not standard black drop-shadows.
- **Border radius:** `rounded-xl` (0.75rem) for cards.

### Design implementation status

All screens implemented ✅:
Login · Dashboard · Landing Page · History · New Session · Settings · Chat (Session) · Session Results · Bookmarks · Loading skeletons (all routes)

## Phase 2 — Voice ✅

### Speech providers

| | Dev ($0) | Prod |
|---|---|---|
| STT | `faster-whisper-server` (Docker, port 8000) | OpenAI Whisper API |
| TTS | `Kokoro FastAPI` (Docker, port 8880) | OpenAI TTS / ElevenLabs |

### Voice components (`src/components/session/voice/`)
- `MicButton.tsx` — hold to record + spacebar shortcut
- `useMicrophone.ts` — MediaRecorder hook with stream + analyser
- `WaveformVisualizer.tsx` — canvas frequency bars
- `TranscriptDisplay.tsx` — editable STT result before sending
- `AudioPlayback.tsx` — play/pause/progress + `triggerPlay` chain prop
- `VoiceToggle.tsx` — text ↔ voice mode toggle in session header

### InteractionManager (`src/lib/interaction/`)
- `types.ts` — `UserInput`, `AIOutput`, `AvatarDirective` (Phase 3 ready)
- `index.ts` — `transcribeAudio()`, `synthesizeAudio()` (used by ChatContainer)

### Audio chaining
Evaluation message auto-plays with `autoPlay`. When it ends (`onEnded`), the next question's audio triggers via `triggerPlay` prop. Handles async TTS (chains even if question audio isn't ready yet when eval ends).

### TTS speed control
Presets in voice mode UI: `0.75×` `1×` `1.25×` `1.5×`. State in `ChatContainer`, passed to `/api/speech/tts` as `speed` field.

## Phase 3 — Avatar ⬜

Technology: **Rive** (`@rive-app/react-canvas`). Avatar character design, animation guide, and rigging sheet already generated (see `devprep-master.md` Section 17). Rive work and Next.js integration not started.

**What I (Claude) can build:** All Next.js code — `AvatarCanvas.tsx`, `useAvatarState` hook, split-screen layout, lip sync algorithm, mobile fallback, Obsidian Terminal styling.

**What requires manual work in Rive editor:** Character assembly, bone rigging, animations, state machine (Weeks 13–14).

State machine boolean inputs (to be created in Rive): `isListening`, `isThinking`, `isTalking`, `isPositive`, `isConcerned`.

---

## Environment

Copy `.env.example` to `.env`. Key variables:
- `DATABASE_URL` — Supabase transaction pooler (port 6543, with `?pgbouncer=true`)
- `DIRECT_URL` — Supabase transaction pooler (port 6543, without pgbouncer)
- `AUTH_SECRET` — Auth.js secret (generated with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `AI_PROVIDER` — `"ollama"` | `"anthropic"` | `"gemini"`
- `AI_ROUTING` — `"single"` | `"smart"` (category-based provider routing)
- `OLLAMA_BASE_URL` / `OLLAMA_MODEL` — local AI config (dev default)
- `STT_PROVIDER` — `"whisper-local"` | `"whisper-api"` (OpenAI)
- `WHISPER_LOCAL_URL` — default `http://localhost:8000`
- `WHISPER_LOCAL_MODEL` — default `Systran/faster-whisper-small`
- `TTS_PROVIDER` — `"kokoro"` | `"openai"` | `"elevenlabs"`
- `KOKORO_URL` — default `http://localhost:8880`

## AI cost strategy

- **Development:** Ollama locally ($0). No API keys needed.
- **Production:** Claude Haiku 4.5 (~$0.11/session of 10 questions). Prompt caching on system prompt saves 90% on input costs.
- **Optimization:** Smart routing — Haiku for code/design, Gemini Flash for technical, GPT-4o Mini for behavioral.

## Path alias

`@/*` maps to `src/*` (configured in tsconfig.json).
