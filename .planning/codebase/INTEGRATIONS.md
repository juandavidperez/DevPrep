# External Integrations

**Analysis Date:** 2026-04-19

## APIs & External Services

**AI Providers (multi-provider with factory pattern):**
- Anthropic Claude - Question generation and response evaluation
  - SDK/Client: `@anthropic-ai/sdk ^0.80.0`
  - Implementation: `src/lib/ai/providers/anthropic.ts`
  - Auth: `ANTHROPIC_API_KEY`
  - Default model: `claude-haiku-4-5-20251001` (overridable via `ANTHROPIC_MODEL`)
  - Used for: coding, system_design categories in smart routing; all categories in single mode; always used for demo sessions via `getDemoAIProvider()` in `src/lib/ai/index.ts`

- Google Gemini - Technical question evaluation
  - SDK/Client: `@google/generative-ai ^0.24.1`
  - Implementation: `src/lib/ai/providers/gemini.ts`
  - Auth: `GEMINI_API_KEY`
  - Default model: `gemini-flash-latest` (overridable via `GEMINI_MODEL`)
  - Used for: technical category in smart routing

- OpenAI - Behavioral questions and speech services
  - SDK/Client: `openai ^6.33.0`
  - Implementation: `src/lib/ai/providers/openai.ts`, `src/lib/speech/providers/WhisperAPIProvider.ts`, `src/lib/speech/providers/OpenAITTSProvider.ts`
  - Auth: `OPENAI_API_KEY`
  - Default model: `gpt-4o-mini` (overridable via `OPENAI_MODEL`)
  - Used for: behavioral category in smart routing; Whisper STT in production; optional TTS

- Ollama - Local AI for development (zero cost)
  - SDK/Client: Direct HTTP to `OLLAMA_BASE_URL`
  - Implementation: `src/lib/ai/providers/ollama.ts`
  - Auth: None (local)
  - Default: `llama3.1:8b` at `http://localhost:11434`
  - Used for: development environment default

**AI Routing:** Factory in `src/lib/ai/index.ts` — `getAIProvider(category?)` returns provider based on `AI_ROUTING` env var (`single` or `smart`).

**Speech — STT (Speech-to-Text):**
- faster-whisper-server (dev, $0) - Local Docker container
  - Implementation: `src/lib/speech/providers/WhisperLocalProvider.ts`
  - Auth: None (local)
  - Config: `WHISPER_LOCAL_URL` (default `http://localhost:8000`), `WHISPER_LOCAL_MODEL`
  - Activated: `STT_PROVIDER=whisper-local`

- OpenAI Whisper API (prod) - Cloud transcription
  - Implementation: `src/lib/speech/providers/WhisperAPIProvider.ts`
  - Auth: `OPENAI_API_KEY` (shared with OpenAI AI provider)
  - Activated: `STT_PROVIDER=whisper-api`

**Speech — TTS (Text-to-Speech):**
- Kokoro FastAPI (dev, $0) - Local Docker container
  - Implementation: `src/lib/speech/providers/KokoroProvider.ts`
  - Auth: None (local)
  - Config: `KOKORO_URL` (default `http://localhost:8880`)
  - Activated: `TTS_PROVIDER=kokoro`

- OpenAI TTS (prod) - Cloud synthesis
  - Implementation: `src/lib/speech/providers/OpenAITTSProvider.ts`
  - Auth: `OPENAI_API_KEY` (shared)
  - Config: `OPENAI_TTS_VOICE_EN`, `OPENAI_TTS_VOICE_ES`
  - Activated: `TTS_PROVIDER=openai`

- ElevenLabs (premium) - High-quality synthesis
  - Implementation: `src/lib/speech/providers/ElevenLabsProvider.ts`
  - Auth: `ELEVENLABS_API_KEY`
  - Config: `ELEVENLABS_VOICE_ID_EN`, `ELEVENLABS_VOICE_ID_ES`
  - Activated: `TTS_PROVIDER=elevenlabs`

**Speech provider factory:** `src/lib/speech/index.ts` — `getSTTProvider()` and `getTTSProvider()` (async, lazy-loads TTS providers).

## Data Storage

**Databases:**
- PostgreSQL via Supabase (project ID: `wjmgvfkwicqhggojlxst`)
  - Schema: `devprep` (isolated — not `public` or `auth`)
  - Connection: Transaction pooler port 6543 for both `DATABASE_URL` and `DIRECT_URL`
  - `DATABASE_URL` includes `?pgbouncer=true` query param
  - Client: Prisma ~6.2.1 with `multiSchema` preview feature
  - Singleton: `src/lib/db.ts`
  - Models: `User`, `Account`, `UserSettings`, `Session`, `SessionMessage`, `Bookmark`, `QuestionBank`
  - DDL changes: Supabase MCP `apply_migration` tool (not `prisma migrate dev` — it hangs)

**File Storage:**
- None — audio URLs stored in `SessionMessage.audioUrl` field, but no file storage service configured

**Caching:**
- Anthropic prompt caching - System prompt cached to save 90% on input tokens (implemented in `src/lib/ai/providers/anthropic.ts`)
- No Redis or in-memory cache layer

## Authentication & Identity

**Auth Provider:**
- Google OAuth (via Auth.js v5 / next-auth ^5.0.0-beta.30)
  - Implementation: `src/lib/auth.ts` + `src/lib/auth.config.ts`
  - Adapter: `@auth/prisma-adapter ^2.11.1` — stores accounts in Supabase `devprep` schema
  - Session strategy: JWT
  - Sign-in page: `/auth/signin`
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Secret: `AUTH_SECRET`

**Guest/Demo Mode:**
- Anonymous sessions supported — `Session.userId` is nullable (`null` for demo/anonymous sessions)
- `Session.isDemo` boolean field tracks demo sessions
- Demo sessions always use `AnthropicProvider` via `getDemoAIProvider()` in `src/lib/ai/index.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected — no Sentry or similar service configured

**Performance:**
- `SessionMessage.aiLatencyMs` field tracks AI response time per message (stored in DB)

**Logs:**
- `console.warn` / `console.error` for provider fallbacks and errors (e.g., smart routing failure in `src/lib/ai/index.ts`)
- No structured logging service

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured — project targets Node.js with `next start`

**CI Pipeline:**
- Not detected — no CI config files found

**Pre-commit:**
- Husky ^9.1.7 with lint-staged — runs `eslint --fix` on staged `*.ts` and `*.tsx` files

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` — Supabase transaction pooler with `?pgbouncer=true`
- `DIRECT_URL` — Supabase transaction pooler without pgbouncer
- `AUTH_SECRET` — Auth.js JWT secret (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `ANTHROPIC_API_KEY` — Required for production AI and all demo sessions
- `NEXTAUTH_URL` — Auth.js base URL

**Optional env vars (depending on routing/providers):**
- `GEMINI_API_KEY` — Required for smart routing technical category
- `OPENAI_API_KEY` — Required for smart routing behavioral + Whisper API STT + OpenAI TTS
- `ELEVENLABS_API_KEY` — Required for ElevenLabs TTS
- `OLLAMA_BASE_URL` / `OLLAMA_MODEL` — Local dev AI
- `WHISPER_LOCAL_URL` / `WHISPER_LOCAL_MODEL` — Local STT
- `KOKORO_URL` — Local TTS

**Secrets location:**
- `.env` file (gitignored); template at `.env.example`

## Webhooks & Callbacks

**Incoming:**
- Auth.js handles OAuth callback at `/api/auth/[...nextauth]` (managed by next-auth)

**Outgoing:**
- None — no webhook dispatch to external services

## i18n

**Service:** next-intl ^4.8.3 (local — no external translation service)
- Translation files: `messages/en.json`, `messages/es.json`
- Plugin: `createNextIntlPlugin()` wraps Next.js config in `next.config.ts`
- Server config: `src/i18n/request.ts`

---

*Integration audit: 2026-04-19*
