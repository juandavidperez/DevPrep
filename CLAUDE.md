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

- **Auth** (`src/lib/auth.ts`): Auth.js v5 (NextAuth beta) with Google OAuth, JWT session strategy, PrismaAdapter. Middleware in `src/middleware.ts` chains Auth.js with next-intl middleware.

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

### i18n (Implemented)

- **Library:** `next-intl ^4.8.3` with `localePrefix: 'always'`
- **Locales:** `en` (default), `es`
- **Config:** `src/i18n/config.ts` (locales), `src/i18n/request.ts` (server config)
- **Navigation:** `src/navigation.ts` exports locale-aware `Link`, `useRouter`, `usePathname`, `redirect` via `createNavigation()`
- **Translations:** `messages/en.json`, `messages/es.json` — namespaces: HomePage, Navbar, Metadata, Dashboard, Login, SessionConfig, Settings, History
- **Middleware:** `src/middleware.ts` chains `next-intl` middleware with Auth.js v5. All routes under `src/app/[locale]/`.
- **IMPORTANT:** In client components, use `Link` and `useRouter` from `@/navigation` (NOT from `next/link` or `next/navigation`), so URLs get the locale prefix automatically. `useSearchParams` still comes from `next/navigation`. Server component `redirect()` uses `next/navigation` (the intl middleware handles the locale redirect).
- **Language switcher:** `src/components/LanguageSwitcher.tsx`

### Implemented pages

All pages are under `src/app/[locale]/`:

```
/                        → Landing (redirects to /dashboard if authenticated)
/auth/signin             → Google OAuth sign-in (Login component)
/dashboard               → Stats, recent sessions, new session button
/session/new             → Configure session (category, difficulty, question count)
/session/[id]            → Chat interface (main interview experience)
/session/[id]/results    → Session results with per-question breakdown
/history                 → Session history with filters and pagination
/settings                → User preferences (language, difficulty, categories, stack)
```

### API routes

```
POST /api/sessions              → Create session + generate first question
GET  /api/sessions/[id]         → Get session with messages
POST /api/sessions/[id]/messages → Send response, get AI evaluation + next question
PUT  /api/settings              → Update user settings
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
- **Elevation:** Hierarchy via surface tier stacking (surface_dim → surface_container → surface_highest).
- **Accent links:** Use `#d2bbff` (primary) not `blue-400`.
- **Shadows:** Tinted shadows `rgba(0,0,0,0.4)` with ghost border outline, not standard black drop-shadows.
- **Border radius:** `rounded-xl` (0.75rem) for cards.

### Design implementation status

- [x] **Login** — Aligned with Stitch (radial glow 0.08, ghost borders, terms footer, version tag, rounded-xl card, font-mono status)
- [x] **Dashboard** — Redesigned with glassmorphism panels, stat deltas, font-mono numbers, backdrop-blur, Obsidian tokens
- [x] **Landing Page** — Hero with radial glow, terminal visualization, feature cards, Obsidian aesthetics
- [x] **History** — Filtered session list, category/difficulty badges, score color coding, pagination
- [x] **New Session** — Background decorative blurs, SessionConfigForm, focused layout
- [x] **Settings** — Ambient background with grid overlay, animated pulse indicator, Obsidian tokens
- [x] **Session Results** — Per-question breakdown with Obsidian styling

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

- [x] **Design implementation** — Obsidian Terminal applied to all pages (login, dashboard, landing, history, new session, settings, results)
- [x] **Monaco Editor** — Code editor integration in chat with language selector, dark theme, JetBrains Mono
- [x] **Question Selector** — Smart selection wired end-to-end (spaced repetition due → unseen from bank → AI-generated fallback)
- [x] **Additional AI providers** — Anthropic (Haiku 4.5), OpenAI (GPT-4o Mini), Gemini (2.0 Flash) + Ollama fallback
- [ ] **Smart provider routing** — Dynamic AI provider selection based on question category/difficulty (currently static via env var)
- [ ] **Bookmarks UI** — `/bookmarks` page, bookmark management API (CRUD), review UI. Data model and spaced repetition logic exist but no user-facing UI
