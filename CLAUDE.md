# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevPrep is an AI-powered mock interview simulator for software developers. It evolves through three phases:
- **Phase 1 (MVP, ~8 weeks):** Text-based chat interview with AI evaluation
- **Phase 2 (~4 weeks):** Voice interaction (STT/TTS) as alternative input/output alongside text
- **Phase 3 (~4 weeks):** Animated 2D avatar interviewer with lip sync and expressions

Full architecture spec: `DevPrep_Project_Structure_v3.md`

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint

# Database
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma db seed            # Seed question bank (200 questions)

# IMPORTANT: prisma migrate dev hangs on this setup.
# Use Supabase MCP (apply_migration) for DDL changes, then npx prisma generate.

# Local AI (requires Ollama running)
# Default: llama3.1:8b at http://localhost:11434
```

## Architecture

**Layered design — each phase adds a layer without rewriting the previous one:**

```
Presentation Layer
  Phase 1: Chat UI (messages, scores)
  Phase 2: + Voice Controls (mic, waveform, transcript, playback)
  Phase 3: + Avatar Canvas (2D character, lip sync, expressions)
        ↓
Interaction Manager (src/lib/interaction/) — unified interface for all modalities
        ↓
Processing Layer
  Phase 1: AI Engine (src/lib/ai/)
  Phase 2: + Speech Engine (src/lib/speech/) — STT/TTS
  Phase 3: + Avatar Engine (src/lib/avatar/) — animation state machine
        ↓
Data Layer: Prisma ORM → PostgreSQL (Supabase, "devprep" schema) + Auth.js
```

### Key abstractions

- **AI Provider** (`src/lib/ai/`): `AIProvider` interface with `generateQuestions()`, `evaluateResponse()`. Factory in `index.ts` returns provider based on `AI_PROVIDER` env var. Currently only Ollama implemented; Anthropic/OpenAI/Gemini providers planned.

- **Interaction Manager** (`src/lib/interaction/`): All user input and AI output flows through `InteractionManager` regardless of modality. `UserInput` always has `text` (typed or transcribed) + optional `code`/`audioBlob`. `AIOutput` always has `text` + optional `audioUrl`/`avatarDirective`.

- **Auth** (`src/lib/auth.ts`): Auth.js v5 (NextAuth beta) with Google OAuth, JWT session strategy, PrismaAdapter. Middleware in `src/middleware.ts` protects `/dashboard`, `/session`, `/history`, `/bookmarks`, `/settings`.

- **Prisma singleton** (`src/lib/db.ts`): Shared PrismaClient instance, prevents multiple clients during hot reload.

### Database

- **Supabase project:** `wjmgvfkwicqhggojlxst` (shared with another app)
- **Schema:** `devprep` (isolated from `public` and `auth`)
- **Prisma:** Uses `multiSchema` preview feature with `schemas = ["devprep"]`
- **Connection:** Transaction pooler (port 6543) for both `DATABASE_URL` and `DIRECT_URL`. Direct connection (IPv6) is unreachable from dev machine.
- **Core models:** `User`, `Account`, `UserSettings`, `Session`, `SessionMessage`, `Bookmark`, `QuestionBank`

### Question bank

200 curated questions in `prisma/seeds/*.json`, loaded via `prisma/seed.ts`. Distribution: 65 junior, 115 mid, 20 senior. Seeded to Supabase.

- `technical.json` (60): Angular, Spring Boot, PostgreSQL, Docker, Git, GitHub Actions, AWS
- `coding.json` (50): Algorithms, Java, TypeScript, SQL, Testing
- `system-design.json` (50): Architecture, CI/CD, AWS, DB design, monitoring
- `behavioral.json` (40): STAR format, bilingual EN/ES

Stack focus: Angular (Standalone, RxJS, Signals), Java 17, Spring Boot (Security JWT, JPA/Hibernate), PostgreSQL, Docker, GitHub Actions, AWS (S3, EC2, RDS, IAM).

### AI evaluation

The AI acts as a senior interviewer. Evaluation responses use structured JSON with `score` (0-100), `criteria` breakdown, `feedback`, and `modelAnswer`. Criteria vary by category:
- Technical: correctness, depth, practical examples, clarity
- Coding: correctness, time/space complexity, readability, edge cases
- System design: scalability, trade-offs, completeness, communication
- Behavioral: STAR structure, specificity, self-awareness, relevance

### Implemented pages

```
/                        → Landing (redirects to /dashboard if authenticated)
/auth/signin             → Google OAuth sign-in
/dashboard               → Stats, recent sessions, new session button
/session/new             → Configure session (category, difficulty, question count)
/session/[id]            → Chat interface (main interview experience)
```

### API routes

```
POST /api/sessions              → Create session + generate first question
GET  /api/sessions/[id]         → Get session with messages
POST /api/sessions/[id]/messages → Send response, get AI evaluation + next question
```

## Path alias

`@/*` maps to `src/*` (configured in tsconfig.json).

## Environment

Copy `.env.example` to `.env`. Key variables:
- `DATABASE_URL` — Supabase transaction pooler (port 6543, with `?pgbouncer=true`)
- `DIRECT_URL` — Supabase transaction pooler (port 6543, without pgbouncer)
- `AUTH_SECRET` — Auth.js secret (generated with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `AI_PROVIDER` — `"ollama"` | `"anthropic"` | `"openai"` | `"gemini"`
- `OLLAMA_BASE_URL` / `OLLAMA_MODEL` — local AI config (dev default)

## AI cost strategy

- **Development:** Ollama locally ($0). No API keys needed.
- **Production:** Claude Haiku 4.5 (~$0.11/session of 10 questions). Prompt caching on system prompt saves 90% on input costs.
- **Optimization:** Smart routing — Haiku for code/design, Gemini Flash for technical, GPT-4o Mini for behavioral.

## TODO — Remaining MVP features

- [ ] **Results page** — `/session/[id]/results` with detailed session summary, per-question scores, strengths/weaknesses
- [ ] **History page** — `/history` with full list of past sessions, filtering, sorting
- [ ] **Bookmarks** — `/bookmarks` with save questions, spaced repetition queue, review UI
- [ ] **Settings page** — `/settings` for user preferences (language, difficulty, stack, modality)
- [ ] **Monaco Editor** — Code editor integration in chat for coding questions
- [ ] **i18n (EN/ES)** — next-intl integration, language switcher, translation dictionaries
- [ ] **Question Selector** — Smart selection from bank (spaced repetition due → unseen → AI-generated fallback)
- [ ] **Additional AI providers** — Anthropic, OpenAI, Gemini implementations + smart routing
