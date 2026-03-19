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
npx prisma migrate dev       # Create/apply migrations
npx prisma db seed           # Seed question bank
npx prisma generate          # Regenerate Prisma client after schema changes

# Local AI (requires Ollama running)
# Default: llama3.1:8b at http://localhost:11434
```

## Architecture

**Layered design — each phase adds a layer without rewriting the previous one:**

```
Presentation Layer
  Phase 1: Chat UI (messages, Monaco editor, scores)
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
Data Layer: Prisma ORM → PostgreSQL (Supabase) + NextAuth
```

### Key abstractions

- **AI Provider** (`src/lib/ai/`): `AIProvider` interface with `generateQuestions()`, `evaluateResponse()`, `analyzeWeakAreas()`. Factory in `index.ts` returns provider based on `AI_PROVIDER` env var. Currently only Ollama implemented; Anthropic/OpenAI/Gemini providers planned. Supports smart routing (different providers per question category) via `AI_ROUTING=smart`.

- **Interaction Manager** (`src/lib/interaction/`): All user input and AI output flows through `InteractionManager` regardless of modality. `UserInput` always has `text` (typed or transcribed) + optional `code`/`audioBlob`. `AIOutput` always has `text` + optional `audioUrl`/`avatarDirective`.

- **Question Selector** (`src/lib/questions/` — planned): Selection priority: spaced repetition due → unseen bank questions → AI-generated fallback. This hybrid strategy ensures quality with Ollama (no generation needed) and infinite variety with API providers.

### Database models (Prisma)

Core models: `User`, `UserSettings`, `Session`, `SessionMessage`, `Bookmark`, `QuestionBank`. Uses `SessionMessage` (chat-style) instead of rigid Q&A — supports multi-turn conversation, follow-ups, code content, scoring per message, audio URLs (Phase 2), and bilingual content (EN/ES).

### Question bank

Curated questions in `prisma/seeds/*.json`, loaded via `prisma/seed.ts` using upsert on `externalId`. Target: ~200 questions across 4 categories (technical, coding, system design, behavioral) and 3 difficulty levels (junior, mid, senior). Primary stack focus: Angular, Spring Boot, PostgreSQL, TypeScript, Java.

### AI evaluation

The AI acts as a senior interviewer. Evaluation responses use structured JSON with `score` (0-100), `criteria` breakdown, `strengths`, `improvements`, and `modelAnswer`. Criteria vary by category:
- Technical: correctness, depth, practical examples, clarity
- Coding: correctness, time/space complexity, readability, edge cases
- System design: scalability, trade-offs, completeness, communication
- Behavioral: STAR structure, specificity, self-awareness, relevance

### Planned pages

```
/                        → Landing / Dashboard
/auth/signin             → Google OAuth
/dashboard               → Progress, stats, streak
/session/new             → Configure session (category, difficulty, stack, language)
/session/[id]            → Chat interface (main experience)
/session/[id]/results    → Session summary + detailed feedback
/history                 → Past sessions
/bookmarks               → Saved questions + review queue
/settings                → Preferences (language, modality, avatar)
```

## Path alias

`@/*` maps to `src/*` (configured in tsconfig.json).

## Environment

Copy `.env.example` to `.env`. Key variables:
- `DATABASE_URL` — PostgreSQL connection string (Supabase)
- `AI_PROVIDER` — `"ollama"` | `"anthropic"` | `"openai"` | `"gemini"`
- `AI_ROUTING` — `"single"` (one provider) | `"smart"` (route by question category)
- `OLLAMA_BASE_URL` / `OLLAMA_MODEL` — local AI config (dev default)
- `ANTHROPIC_API_KEY` — recommended for production (Claude Haiku 4.5, with prompt caching)
- Auth keys (`NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`) and other API keys are optional during dev

## AI cost strategy

- **Development:** Ollama locally ($0). No API keys needed.
- **Production:** Claude Haiku 4.5 (~$0.11/session of 10 questions). Prompt caching on system prompt saves 90% on input costs.
- **Optimization:** Smart routing — Haiku for code/design, Gemini Flash for technical, GPT-4o Mini for behavioral.
