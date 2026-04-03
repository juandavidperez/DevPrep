# DevPrep — AI-Powered Interview Preparation Platform

> **Master Document v6.1** | April 2026
> **Status:** Phase 1 complete ✅. Phase 2 (Voice) complete ✅. Phase 3 (Avatar) pending.
>
> **Phase 1 done:** auth, i18n, AI engine (4 providers + Zod validation + smart routing), 200-question EN bank + 120-question ES bank, smart selector, Monaco editor, chat UI, session results, bookmarks + spaced repetition, dashboard analytics, loading skeletons, CI/CD, pre-commit hooks, swap test, `aiLatencyMs` tracking. Pending: unit tests.
>
> **Phase 2 done:** STT pipeline (faster-whisper-server local + OpenAI Whisper API), TTS pipeline (Kokoro local + OpenAI TTS + ElevenLabs), push-to-talk mic button + spacebar shortcut, waveform visualizer, transcript display + edit, audio playback with progress bar, evaluation→question audio chaining, TTS speed control (0.75×/1×/1.25×/1.5×), voice↔text modality toggle with graceful fallback, InteractionManager abstraction (`src/lib/interaction/`).

---

## 1. Vision & Objective

**DevPrep** is a personal AI-powered platform to prepare for software development job interviews. It evolves through three distinct phases — from text chat to voice conversation to animated avatar — each building on the previous one's architecture.

**Primary user:** Juan David Perez Vergara (personal use)
**Portfolio potential:** If well-executed, publishable as a portfolio project demonstrating AI integration, real-time audio, and interactive UI.

### Evolution Path

```
Phase 1 (MVP)          Phase 2                  Phase 3
┌──────────────┐       ┌──────────────┐         ┌──────────────┐
│  Text Chat   │──────▶│  Voice Chat  │────────▶│   Avatar     │
│              │       │              │         │              │
│ - Type Q&A   │       │ - Speak Q&A  │         │ - Animated   │
│ - AI eval    │       │ - AI listens │         │   interviewer│
│ - Progress   │       │ - AI speaks  │         │ - Lip sync   │
│ - Bookmarks  │       │ - Transcript │         │ - Gestures   │
└──────────────┘       └──────────────┘         └──────────────┘
     ~8 weeks               ~4 weeks                ~4 weeks
```

---

## 2. Tech Stack

DevPrep is a **Next.js fullstack application** — frontend and backend API routes live in the same repo, deployed to Vercel.

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Fullstack — API Routes for backend |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Utility-first |
| ORM | Prisma | Type-safe, great DX with PostgreSQL |
| Database | Supabase PostgreSQL | Free tier, `devprep` schema isolated from `public` |
| Auth | NextAuth.js v5 | Google OAuth, JWT sessions, PrismaAdapter |
| AI (dev) | Ollama + Llama 3.1 8B | Local, $0 cost during development |
| AI (prod) | Claude Haiku 4.5 | Best code evaluation, prompt caching ✅ |
| AI (alt) | Gemini 2.0 Flash | Free tier fallback ✅ |
| AI (alt) | OpenAI GPT-4o Mini | Cheapest option ✅ |
| Validation | Zod | Runtime validation of AI responses (planned) |
| Code Editor | Monaco Editor | Embedded in chat for coding questions ✅ |
| i18n | next-intl ^4.8.3 | EN/ES, `localePrefix: 'always'` |
| Deploy | Vercel | Frontend + API Routes |
| Storage | Supabase Storage | Audio files (Phase 2+) |

### Design Philosophy

> **Start local, scale global.** The entire AI layer is abstracted behind a provider interface — switching from Ollama to Claude Haiku is a one-line env var change, not a rewrite.

---

## 3. Architecture

### 3.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App (Vercel)                  │
│                                                         │
│  ┌──────────────────┐     ┌───────────────────────────┐ │
│  │   App Router     │     │      API Routes           │ │
│  │  (React pages)   │     │  /api/sessions            │ │
│  │                  │────▶│  /api/sessions/[id]       │ │
│  │  - Chat UI       │     │  /api/sessions/[id]/      │ │
│  │  - Dashboard     │     │    messages               │ │
│  │  - History       │     │  /api/settings            │ │
│  │  - Bookmarks     │     │                           │ │
│  └──────────────────┘     └──────────┬────────────────┘ │
└─────────────────────────────────────┼──────────────────┘
                                       │
              ┌────────────────────────┼────────────────────┐
              │                        │                    │
              ▼                        ▼                    ▼
   ┌──────────────────┐   ┌────────────────────┐  ┌────────────────┐
   │   AI Provider    │   │  Supabase           │  │  NextAuth.js   │
   │   (abstracted)   │   │  PostgreSQL + Prisma│  │  (Auth)        │
   │                  │   │                    │  │                │
   │ Ollama (dev) ✅  │   │  devprep schema    │  │ Google OAuth   │
   │ Claude Haiku ✅  │   │  - questions       │  │ JWT sessions   │
   │ Gemini Flash ✅  │   │  - sessions        │  │                │
   │ OpenAI 4o-m ✅  │   │                    │  │                │
   └──────────────────┘   │  - messages        │  └────────────────┘
                          │  - bookmarks       │
                          └────────────────────┘
```

### 3.2 Layered Design — Each Phase Adds a Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  Phase 1: Chat UI (messages, scores)                            │
│  Phase 2: + Voice Controls (mic, waveform, transcript)          │
│  Phase 3: + Avatar Canvas (2D character, lip sync, expressions) │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │ Interaction │  ← All input/output goes     │
│                    │  Manager   │    through here               │
│                    └──────┬──────┘                              │
├───────────────────────────┼─────────────────────────────────────┤
│                     PROCESSING LAYER                            │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│   │  AI Engine  │  │ Speech Engine│  │ Avatar Engine │          │
│   │  (Phase 1)  │  │  (Phase 2)   │  │  (Phase 3)   │          │
│   └─────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                              │
│   Prisma ORM → PostgreSQL (Supabase, "devprep" schema) + Auth.js│
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Interaction Manager (Key Abstraction)

All user input and AI output flow through `InteractionManager` regardless of modality. Adding voice in Phase 2 doesn't touch the AI layer.

```typescript
// src/lib/interaction/types.ts

type InputModality  = 'text' | 'voice' | 'code';
type OutputModality = 'text' | 'voice' | 'avatar';

interface UserInput {
  modality: InputModality;
  text: string;           // Always present (typed or transcribed)
  code?: string;          // For coding questions
  audioBlob?: Blob;       // Phase 2+
  metadata: {
    questionId: string;
    timeSpent: number;
    language: 'en' | 'es';
  };
}

interface AIOutput {
  text: string;
  score?: EvaluationResult;
  audioUrl?: string;        // Phase 2+
  avatarDirective?: {       // Phase 3+
    emotion: 'neutral' | 'positive' | 'thinking' | 'concerned';
    gesture: 'nod' | 'shake' | 'point' | 'idle';
  };
}
```

### 3.4 AI Provider Abstraction

Every provider implements the same interface. The rest of the app never knows which one is active.

```typescript
// src/lib/ai/types.ts

interface AIProvider {
  generateQuestions(config: SessionConfig): Promise<Question[]>;
  evaluateResponse(question: Question, response: string, code?: string): Promise<EvaluationResult>;
}

interface EvaluationResult {
  score: number;                        // 0–100
  criteria: Record<string, number>;     // Per-category breakdown (0–100 each)
  feedback: string;                     // Human-readable critique
  modelAnswer: string;                  // Reference answer
}
```

**Provider factory:**

```typescript
// src/lib/ai/index.ts
export function getAIProvider(category?: QuestionCategory): AIProvider {
  const provider = process.env.AI_PROVIDER || 'ollama';

  // Smart routing: best provider per category (activate with AI_ROUTING=smart)
  if (process.env.AI_ROUTING === 'smart' && category) {
    switch (category) {
      case 'coding':        return new AnthropicProvider(); // Haiku: best code eval
      case 'system_design': return new AnthropicProvider(); // Haiku: best reasoning
      case 'technical':     return new GeminiProvider();    // Flash: good + cheaper
      case 'behavioral':    return new OpenAIProvider();    // 4o-mini: cheapest
    }
  }

  switch (provider) {
    case 'ollama':    return new OllamaProvider();    // Dev: $0
    case 'anthropic': return new AnthropicProvider(); // Prod: best quality ⬜
    case 'gemini':    return new GeminiProvider();    // Prod: free tier    ⬜
    default:          return new OllamaProvider();
  }
}
```

### 3.5 Auth & Middleware Chain

Auth.js v5 (NextAuth beta) with PrismaAdapter and JWT strategy. The middleware chains `next-intl` with Auth.js — all routes live under `src/app/[locale]/`.

```typescript
// src/proxy.ts  (Next.js 16: middleware.ts was renamed to proxy.ts)
import { auth } from '@/lib/auth';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({ locales, defaultLocale: 'en', localePrefix: 'always' });

export default auth((req) => {
  // Skip API routes and Next.js internals
  if (req.nextUrl.pathname.startsWith('/api') || ...) return;
  return intlMiddleware(req);
});
```

**Why this matters:** Adding i18n to a protected app requires careful chaining — if done wrong, the auth redirect loses the locale prefix or the locale middleware blocks API routes.

### 3.6 i18n Navigation Rule

In client components, always use `Link` and `useRouter` from `@/navigation` (not from `next/link` or `next/navigation`) so locale prefixes are applied automatically. `useSearchParams` still comes from `next/navigation`.

```typescript
// ✅ Correct
import { Link, useRouter } from '@/navigation';

// ❌ Wrong — loses locale prefix
import Link from 'next/link';
```

### 3.7 Speech Engine (Phase 2)

When Phase 2 arrives, the Speech Engine sits between the Interaction Manager and the AI layer. The AI layer never changes — it still receives text and returns text.

Same abstraction pattern as the AI engine — swap providers via env var, no code changes. Provider selection is **env-only**: not exposed in the UI, only configurable by the developer.

#### Provider Matrix

```
               DEV ($0)                      PROD (default)          PROD (alternative)
               ──────────────────────────────────────────────────────────────────────
STT ✅         faster-whisper-server (Docker) →   OpenAI Whisper API
TTS ✅         Kokoro FastAPI (Docker)        →   OpenAI TTS          →   ElevenLabs
AI Engine ✅   Ollama + Llama 3.1            →   Claude Haiku         →   Gemini Flash
```

**Why OpenAI TTS as default (not ElevenLabs):**
The same `OPENAI_API_KEY` already used for Whisper STT covers TTS — no extra key needed. ElevenLabs is available as an upgrade if higher voice quality is needed, switchable via a single env var.

#### Interfaces

```typescript
// src/lib/speech/types.ts

interface STTProvider {
  // Batch transcription — user records, stops, then submits (push-to-talk flow)
  transcribe(audio: Blob, language: 'en' | 'es'): Promise<string>;
  healthCheck(): Promise<boolean>;
}

interface TTSProvider {
  // Single audio buffer for the interviewer's response
  synthesize(text: string, language: 'en' | 'es'): Promise<ArrayBuffer>;
  // Streaming variant for lower latency (starts playing before fully generated)
  synthesizeStream(text: string, language: 'en' | 'es'): ReadableStream<Uint8Array>;
  healthCheck(): Promise<boolean>;
}
```

#### STT Factory

```typescript
// src/lib/speech/stt/index.ts

export function getSTTProvider(): STTProvider {
  const provider = process.env.STT_PROVIDER || 'whisper-local';
  switch (provider) {
    case 'whisper-local': return new WhisperLocalProvider();  // Ollama — dev, $0
    case 'whisper-api':   return new WhisperAPIProvider();    // OpenAI — prod
    default:              return new WhisperLocalProvider();
  }
}
```

#### TTS Factory

```typescript
// src/lib/speech/tts/index.ts

export function getTTSProvider(): TTSProvider {
  const provider = process.env.TTS_PROVIDER || 'openai';
  switch (provider) {
    case 'kokoro':     return new KokoroProvider();     // Local — dev, $0
    case 'openai':     return new OpenAITTSProvider();  // API — prod default
    case 'elevenlabs': return new ElevenLabsProvider(); // API — higher quality alt
    default:           return new OpenAITTSProvider();
  }
}
```

#### Provider Notes

**STT — faster-whisper-server (dev):** ✅ OpenAI-compatible local server (`fedirz/faster-whisper-server`). Run with Docker on port 8000. Model configured via `WHISPER_LOCAL_MODEL` (default: `Systran/faster-whisper-small`). Supports EN/ES. Latency ~2–4s without GPU, acceptable for push-to-talk flow. Note: Ollama does NOT have a `/api/transcribe` endpoint — faster-whisper-server is the correct local alternative.

**STT — OpenAI Whisper API (prod):** $0.006/min (~$0.012 per 2-min answer). High accuracy on technical terms (NgRx, JPA, PostgreSQL). Same API key as OpenAI TTS.

**TTS — Kokoro (dev):** Open-source TTS model (~82M params, very lightweight). Requires a small local FastAPI server (~20 lines). Quality significantly better than browser TTS. EN/ES support.

**TTS — OpenAI TTS (prod default):** Voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`. ~$15/1M chars — effectively free for personal use. No extra API key beyond what Whisper already uses.

**TTS — ElevenLabs (prod alternative):** Best voice quality available. Switch with `TTS_PROVIDER=elevenlabs`. Requires separate API key and voice IDs per language.

**Phase 2 data flow:**
```
┌─────────────┐     ┌─────────────┐     ┌────────────────────┐     ┌─────────────┐
│  Microphone │────▶│ STTProvider │────▶│ InteractionManager │────▶│ AI Provider │
│  (browser)  │     │ transcribe()│     │  sendInput(text)   │     │  evaluate() │
└─────────────┘     └─────────────┘     └────────────────────┘     └──────┬──────┘
                                                                           │ AIOutput.text
                    ┌─────────────┐     ┌────────────────────┐            │
│     Speaker │◀────│ TTSProvider │◀────│  synthesizeStream()│◀───────────┘
│   (browser) │     │   audio     │     │                    │
└─────────────┘     └─────────────┘     └────────────────────┘

Push-to-talk flow: user holds mic button → records → releases → STT transcribes →
AI evaluates → TTS synthesizes → audio plays back.
Fallback: if mic unavailable or STT_PROVIDER not set → text input mode, no STT/TTS.
```

**Phase 3 data flow (Avatar):**
```
                                          ┌─────────────────────────────────┐
                                          │        AIOutput                 │
                                          │  .text + .avatarDirective       │
                                          │  { emotion, gesture }           │
                                          └────────────┬────────────────────┘
                                                       │
                   ┌───────────────────────────────────┼──────────────────────┐
                   │                                   │                      │
                   ▼                                   ▼                      ▼
        ┌──────────────────┐             ┌─────────────────────┐   ┌──────────────────┐
        │   TTSProvider    │             │   Avatar Engine     │   │    Chat UI       │
        │ synthesizeStream │             │                     │   │  (text display)  │
        │                  │             │ - Set emotion state │   └──────────────────┘
        └────────┬─────────┘             │ - Trigger gesture  │
                 │ AudioBuffer           │ - Drive lip sync   │
                 │                       └────────┬────────────┘
                 ▼                                │
        ┌──────────────────┐             ┌────────▼────────────┐
        │  Viseme Mapping  │────────────▶│   AvatarCanvas.tsx  │
        │ audio → phonemes │             │   (Rive / Lottie)   │
        └──────────────────┘             └─────────────────────┘

Target: round-trip latency (user stops speaking → avatar starts responding) < 3 seconds.
```

---

## 4. Database Schema (Prisma)

- **Supabase project:** `wjmgvfkwicqhggojlxst`
- **Schema:** `devprep` (isolated from `public` and `auth`)
- **Prisma:** Uses `multiSchema` preview feature
- **Connection:** Transaction pooler (port 6543) — direct IPv6 connection unreachable from dev machine

```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  image         String?
  emailVerified DateTime?
  accounts      Account[]
  sessions      Session[]
  bookmarks     Bookmark[]
  settings      UserSettings?
  createdAt     DateTime      @default(now())
  @@map("users")
  @@schema("devprep")
}

model UserSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  uiLanguage        String   @default("en")
  questionLanguage  String   @default("en")   // Independent of UI language
  defaultDifficulty String   @default("mid")
  defaultCategories String[] @default(["technical", "coding", "system_design", "behavioral"])
  targetStack       String[] @default(["angular", "spring_boot", "postgresql"])
  outputModality    String   @default("text") // Phase 2+: "voice" | "avatar"
  voiceSpeed        Float    @default(1.0)    // Phase 2+
  avatarCharacter   String   @default("default") // Phase 3+
  @@schema("devprep")
}

model Session {
  id             String           @id @default(cuid())
  userId         String
  user           User             @relation(fields: [userId], references: [id])
  category       String           // "technical" | "coding" | "system_design" | "behavioral"
  difficulty     String           // "junior" | "mid" | "senior"
  targetStack    String[]
  language       String           @default("en")
  totalQuestions Int
  completedAt    DateTime?
  score          Float?           // Final average score
  duration       Int?             // Seconds
  messages       SessionMessage[]
  createdAt      DateTime         @default(now())
  @@schema("devprep")
}

model SessionMessage {
  id            String   @id @default(cuid())
  sessionId     String
  session       Session  @relation(fields: [sessionId], references: [id])
  role          String   // "interviewer" | "candidate"
  content       String   @db.Text
  codeContent   String?  @db.Text
  messageType   String   @default("message") // "message" | "question" | "evaluation" | "follow_up"
  questionIndex Int?
  score         Float?
  criteria      Json?    // { correctness: 85, depth: 70, clarity: 90, ... }
  feedback      String?  @db.Text
  modelAnswer   String?  @db.Text
  audioUrl      String?  // Phase 2+
  aiLatencyMs   Int?
  createdAt     DateTime @default(now())
  bookmark      Bookmark?
  @@index([sessionId, createdAt])
  @@schema("devprep")
}

model Bookmark {
  id           String         @id @default(cuid())
  userId       String
  user         User           @relation(fields: [userId], references: [id])
  messageId    String         @unique
  message      SessionMessage @relation(fields: [messageId], references: [id])
  notes        String?        @db.Text
  reviewCount  Int            @default(0)
  nextReviewAt DateTime?      // Spaced repetition due date
  createdAt    DateTime       @default(now())
  @@index([userId, nextReviewAt])
  @@schema("devprep")
}

model QuestionBank {
  id                 String   @id @default(cuid())
  category           String
  difficulty         String
  tags               String[]
  language           String   @default("en")
  questionText       String   @db.Text
  hints              String[]
  modelAnswer        String?  @db.Text
  evaluationCriteria String[]
  timeEstimate       Int      @default(180) // Seconds
  codeTemplate       String?  @db.Text      // For coding questions
  testCases          Json?
  codeLanguage       String?
  constraints        Json?                  // For system design
  timesServed        Int      @default(0)
  avgScore           Float?
  source             String?  // "curated" | "ai_generated"
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@index([category, difficulty, language])
  @@index([tags])
  @@schema("devprep")
}
```

> **DDL changes:** `prisma migrate dev` hangs on this setup. Use Supabase MCP (`apply_migration`) for all DDL, then `npx prisma generate`.

---

## 5. Question Bank

320 curated questions seeded to Supabase (200 EN + 120 ES), tailored to Juan David's stack — not generic JS/React questions.

**English bank (200 questions):**

| File | Count | Topics |
|------|-------|--------|
| `technical.json` | 60 | Angular, Spring Boot, PostgreSQL, Docker, Git, GitHub Actions, AWS |
| `coding.json` | 50 | Algorithms, Java, TypeScript, SQL, Testing |
| `system-design.json` | 50 | Architecture, CI/CD, AWS, DB design, monitoring |
| `behavioral.json` | 40 | STAR format, bilingual EN/ES |

**Spanish bank (120 questions) ✅:**

| File | Count | Topics |
|------|-------|--------|
| `technical-es.json` | 40 | Angular, Spring Boot, Java 17, PostgreSQL, Docker, AWS |
| `coding-es.json` | 25 | Algoritmos, TypeScript, Java, SQL (window functions) |
| `system-design-es.json` | 25 | Arquitectura, CI/CD, AWS, patrones distribuidos |
| `behavioral-es.json` | 30 | Formato STAR completo en español |

**Distribution EN:** 65 junior · 115 mid · 20 senior
**Distribution ES:** 42 junior · 56 mid · 22 senior

> **Language selection:** `selector.ts` queries by `language` field. If no match in the bank → AI generates in the selected language (no English fallback).

### Target Stack Focus

Angular (Standalone, RxJS, Signals) · Java 17 · Spring Boot (Security JWT, JPA/Hibernate) · PostgreSQL · Docker · GitHub Actions · AWS (S3, EC2, RDS, IAM)

### Seed Format

```json
{
  "category": "technical",
  "difficulty": "mid",
  "tags": ["angular", "rxjs"],
  "language": "en",
  "questionText": "Explain the difference between switchMap, mergeMap, concatMap, and exhaustMap in RxJS.",
  "hints": [
    "Think about what happens to the inner observable when a new outer value arrives",
    "Consider HTTP request scenarios for each"
  ],
  "modelAnswer": "switchMap cancels the previous inner observable when a new value arrives — ideal for search typeahead...",
  "evaluationCriteria": [
    "Correctly describes cancellation behavior of each operator",
    "Provides practical Angular use cases",
    "Explains when NOT to use switchMap (e.g., POST requests)"
  ],
  "timeEstimate": 240
}
```

### Question Selection Priority

```
1. Spaced repetition queue — bookmarked questions with nextReviewAt <= now
2. Unseen questions from bank — matching category + difficulty + stack, ordered by timesServed ASC
3. Previously seen questions — least recently served
4. AI-generated fallback — only when bank is exhausted for this config
```

---

## 6. Pages & Routes

All pages are under `src/app/[locale]/`:

```
/                         → Landing (redirects to /dashboard if authenticated)
/auth/signin              → Google OAuth sign-in
/dashboard                → Stats, recent sessions, new session button
/session/new              → Configure session (category, difficulty, question count)
/session/[id]             → Chat interface — main interview experience
/session/[id]/results     → Session summary with per-question breakdown
/history                  → Past sessions with filters and pagination
/bookmarks                → Saved questions + spaced repetition queue (planned)
/settings                 → User preferences (language, difficulty, categories, stack)
```

### Chat Session UI

```
┌─────────────────────────────────────────┐
│  DevPrep    3/10    ⏱ 04:32      [EN]  │
├─────────────────────────────────────────┤
│                                         │
│  🤖 Interviewer                         │
│  ┌───────────────────────────────────┐  │
│  │ Explain the difference between    │  │
│  │ NgOnInit and the constructor in   │  │
│  │ Angular. When would you use each? │  │
│  └───────────────────────────────────┘  │
│                                         │
│                        You 👤           │
│  ┌───────────────────────────────────┐  │
│  │ The constructor is called by DI.. │  │
│  └───────────────────────────────────┘  │
│                                         │
│  🤖 Evaluation                          │
│  ┌───────────────────────────────────┐  │
│  │ Score: 78/100                     │  │
│  │ ✅ Correct about DI instantiation │  │
│  │ ⚠️  Missing: lifecycle hook timing│  │
│  │ 📝 Model Answer [expandable]      │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  [Type your response...]      [Send ▶] │
│  [📎 Code Editor]                       │
└─────────────────────────────────────────┘
```

---

## 7. API Routes

```
POST /api/sessions                  → Create session + generate first question
GET  /api/sessions/[id]             → Get session with all messages
POST /api/sessions/[id]/messages    → Send response → AI evaluation + next question
GET  /api/settings                  → Get user settings (upsert if missing)
PUT  /api/settings                  → Update user preferences
```

All routes authenticate via `auth()` from Auth.js and validate user ownership.

### Session Message Flow

```
POST /api/sessions
  → Create Session record
  → selectNextQuestion() from bank
  → Create first SessionMessage (role: "interviewer", type: "question")
  → Return { sessionId }

POST /api/sessions/[id]/messages  (repeated until totalQuestions reached)
  → Save candidate response (role: "candidate")
  → AI evaluates: score + criteria + feedback + modelAnswer
  → Save evaluation as SessionMessage
  → If complete: mark completedAt + calculate avgScore
  → If not: selectNextQuestion() + save next question
  → Return { messages, isComplete, finalScore? }
```

### Response Shape — `POST /api/sessions/[id]/messages`

```json
{
  "messages": [
    {
      "id": "msg_abc123",
      "role": "candidate",
      "content": "The constructor is called by Angular's DI system...",
      "messageType": "message",
      "createdAt": "2026-03-24T10:00:00Z"
    },
    {
      "id": "msg_def456",
      "role": "interviewer",
      "content": "Good answer! You covered the DI aspect well.",
      "messageType": "evaluation",
      "score": 78,
      "criteria": {
        "correctness": 85,
        "depth": 70,
        "practical_examples": 75,
        "clarity": 80
      },
      "feedback": "You correctly identified that the constructor is called by Angular's DI system before ngOnInit. Missing: lifecycle hook timing and why async operations don't belong in constructors.",
      "modelAnswer": "The constructor is invoked by JavaScript when the class is instantiated — Angular uses it purely for DI. ngOnInit is Angular's first lifecycle hook, called after inputs are bound...",
      "createdAt": "2026-03-24T10:00:03Z"
    }
  ],
  "isComplete": false,
  "sessionProgress": {
    "questionsAnswered": 3,
    "questionsRemaining": 7,
    "runningAverage": 74.3
  }
}
```

---

## 8. AI Prompt Design

### System Prompt (Interviewer Persona)

```
You are a senior technical interviewer conducting a mock interview.
Speak in a conversational but professional tone — direct, fair, genuinely helpful.

Session config:
- Category: {category}
- Difficulty: {difficulty}
- Target stack: {stack}
- Language: {language}
- Question {current} of {total}

KEY POINTS TO EVALUATE: {question.evaluationCriteria}

Present the pre-selected question naturally, as if you thought of it.
Add brief context when helpful ("Let's move to a coding problem").

After receiving the candidate's response, evaluate and return ONLY valid JSON.
No markdown. No preamble. No trailing text.

{
  "score": 0-100,
  "criteria": {
    "<criterion_1>": 0-100,
    "<criterion_2>": 0-100,
    ...
  },
  "feedback": "Conversational feedback referencing the candidate's specific answer",
  "modelAnswer": "A complete reference answer for this question"
}
```

**Criteria by category:**

| Category | Criteria keys |
|----------|--------------|
| `technical` | `correctness`, `depth`, `practical_examples`, `clarity` |
| `coding` | `correctness`, `time_complexity`, `readability`, `edge_cases` |
| `system_design` | `scalability`, `trade_offs`, `completeness`, `communication` |
| `behavioral` | `star_structure`, `specificity`, `self_awareness`, `relevance` |

### Zod Validation (to implement)

AI output is unpredictable. Every response must be validated before storing or sending to the client. If validation fails → retry once with a stricter prompt → fallback to generic feedback.

```typescript
// src/lib/ai/parser.ts
const EvaluationSchema = z.object({
  score:       z.number().min(0).max(100),
  criteria:    z.record(z.number().min(0).max(100)).refine(
                 obj => Object.keys(obj).length >= 2,
                 { message: 'At least 2 criteria required' }
               ),
  feedback:    z.string().min(20),
  modelAnswer: z.string().min(20),
});

// Usage: strip ```json fences → JSON.parse → Zod validate → retry on failure
```

### Prompt Caching (Production — Claude Haiku)

The system prompt (~1,500 tokens) is identical across all requests. With Anthropic prompt caching:
- Cache write: `$0.0015` (first request per session)
- Cache read: `$0.00015` (all subsequent — **90% cheaper**)

### Prompt Versioning

Export a version string from every prompt template. Log which version was used per evaluation to track quality and A/B test improvements.

```typescript
// src/lib/ai/prompts.ts
export const PROMPT_VERSION = 'v1.0';
export const EVALUATION_PROMPT = `...`;
```

---

## 9. Design System — "The Obsidian Terminal"

Design source: **Google Stitch** (project ID: `15023765856949113622`).

### Design Tokens (CSS custom properties)

```css
--background:         #131313   /* The Infinite Void */
--text-primary:       #EAEAEA
--text-secondary:     #A1A1AA
--surface-lowest:     #0e0e0e   /* Recessed sections */
--surface-container:  #201f1f   /* Default card bg */
--surface-highest:    #353534   /* Hover / elevated */
--primary:            #d2bbff   /* Electric Violet — links, accents */
--primary-container:  #7c3aed   /* CTAs, buttons */
--border-subtle:      rgba(255,255,255,0.1)
```

### Design Rules

- **No-Line rule:** No 1px solid high-contrast borders. Use color shifts or ghost borders (10–15% white opacity).
- **Glassmorphism:** Floating elements use `backdrop-blur` (20–40px) + semi-transparent surface fill.
- **Typography:** Inter for UI, JetBrains Mono for numerical/data/code values.
- **Elevation:** Surface hierarchy — `surface-lowest` → `surface-container` → `surface-highest`.
- **Accent links:** `#d2bbff` (primary), never `blue-400`.
- **Shadows:** `rgba(0,0,0,0.4)` tinted with ghost border outline, not standard black drop-shadows.
- **Border radius:** `rounded-xl` (0.75rem) for cards.

### Implementation Status

| Screen | Status | Notes |
|--------|--------|-------|
| Login | ✅ Done | Aligned with Stitch |
| Sidebar | ✅ Done | Collapsible, localStorage persistence |
| Dashboard | ✅ Done | Glassmorphism panels, stat deltas, font-mono numbers, backdrop-blur |
| Landing Page | ✅ Done | Hero with radial glow, terminal visualization, feature cards |
| History | ✅ Done | Filtered session list, category/difficulty badges, score color coding |
| New Session | ✅ Done | Background decorative blurs, SessionConfigForm |
| Settings | ✅ Done | Ambient background, grid overlay, animated pulse indicator |
| Chat (Session) | ✅ Done | Message bubbles, evaluation cards, code editor, session header |
| Session Results | ✅ Done | Per-question breakdown with Obsidian styling |
| Bookmarks | ✅ Done | Saved questions list with category/difficulty badges |
| Loading skeletons | ✅ Done | All routes: dashboard, history, session, results, settings, bookmarks, new session |

---

## 10. AI Cost Strategy

| Provider | Model | Cost/session (10 Qs) | When |
|----------|-------|---------------------|------|
| Ollama (local) | Llama 3.1 8B | **$0.00** | All development |
| Gemini Flash | 2.5 Flash | **$0.04** | Production — free tier |
| Claude Haiku | 4.5 | **$0.11** | Production — best code eval |
| Claude Sonnet | 4.6 | **$0.28** | System design only (smart routing) |

**Strategy:**
- `AI_PROVIDER=ollama` → always during development
- `AI_PROVIDER=anthropic` + prompt caching → production (~$1–3/month personal use)
- `AI_ROUTING=smart` → category-based routing for cost optimization at scale

---

## 11. File Structure

```
devprep/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── seeds/
│       ├── technical.json       (60 questions EN: Angular, Spring Boot, PostgreSQL, Docker, AWS)
│       ├── coding.json          (50 questions EN: Algorithms, Java, TypeScript, SQL, Testing)
│       ├── system-design.json   (50 questions EN)
│       ├── behavioral.json      (40 questions EN, bilingual model answers)
│       ├── technical-es.json    (40 questions ES) ✅
│       ├── coding-es.json       (25 questions ES) ✅
│       ├── system-design-es.json (25 questions ES) ✅
│       └── behavioral-es.json   (30 questions ES, STAR format) ✅
├── messages/
│   ├── en.json                  (namespaces: HomePage, Navbar, Dashboard, Login, SessionConfig, Settings, History)
│   └── es.json
├── src/
│   ├── app/
│   │   ├── globals.css          (design tokens as CSS custom properties)
│   │   └── [locale]/
│   │       ├── layout.tsx       (Sidebar + AuthProvider + NextIntlClientProvider)
│   │       ├── page.tsx         (Landing / redirect to dashboard)
│   │       ├── auth/signin/page.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── session/
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx              ← Chat interface (main experience)
│   │       │       └── results/page.tsx
│   │       ├── history/page.tsx
│   │       └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── sessions/
│   │       │   ├── route.ts                  ← POST: create session
│   │       │   └── [id]/
│   │       │       ├── route.ts              ← GET: session details
│   │       │       └── messages/route.ts     ← POST: send message, get AI response
│   │       └── settings/route.ts             ← GET + PUT: user settings
│   ├── components/
│   │   ├── Sidebar.tsx                       (collapsible, localStorage, mobile drawer)
│   │   ├── Navbar.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── LandingPage.tsx
│   │   ├── PublicNavbar.tsx
│   │   ├── Footer.tsx
│   │   ├── DashboardSearch.tsx
│   │   ├── DashboardTopbar.tsx
│   │   ├── history/
│   │   │   ├── HistoryFilters.tsx
│   │   │   └── SessionList.tsx
│   │   ├── session/
│   │   │   ├── ChatContainer.tsx             (voice state, STT/TTS orchestration, audio chaining)
│   │   │   ├── ChatInput.tsx                 (text + voice mode paths, TTS speed selector)
│   │   │   ├── MessageBubble.tsx             (audio playback, triggerPlay chaining)
│   │   │   ├── SessionConfigForm.tsx         (EN/ES language selector, input modality)
│   │   │   ├── CodeEditor.tsx
│   │   │   └── voice/                        ✅ Phase 2
│   │   │       ├── useMicrophone.ts          (MediaRecorder hook, stream, analyser)
│   │   │       ├── MicButton.tsx             (hold-to-record + spacebar shortcut)
│   │   │       ├── WaveformVisualizer.tsx    (canvas frequency bars)
│   │   │       ├── TranscriptDisplay.tsx     (editable STT result)
│   │   │       ├── AudioPlayback.tsx         (play/pause/progress, triggerPlay, onEnded)
│   │   │       └── VoiceToggle.tsx           (text ↔ voice mode button)
│   │   ├── settings/
│   │   │   └── SettingsForm.tsx
│   │   └── providers/
│   │       └── AuthProvider.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── types.ts                      (AIProvider interface, EvaluationResult)
│   │   │   ├── index.ts                      (factory + smart routing)
│   │   │   ├── prompts.ts                    (versioned prompt templates per category)
│   │   │   ├── parser.ts                     (Zod validation + retry + FALLBACK_EVALUATION)
│   │   │   └── providers/
│   │   │       ├── ollama.ts                 ✅
│   │   │       ├── anthropic.ts              ✅
│   │   │       ├── openai.ts                 ✅
│   │   │       └── gemini.ts                 ✅
│   │   ├── interaction/                          ✅ Phase 2
│   │   │   ├── types.ts                      (UserInput, AIOutput, SessionState, AvatarDirective)
│   │   │   └── index.ts                      (transcribeAudio, synthesizeAudio — used by ChatContainer)
│   │   ├── speech/                           ✅ Phase 2
│   │   │   ├── types.ts                      (STTProvider, TTSProvider interfaces, error types)
│   │   │   ├── index.ts                      (getSTTProvider, getTTSProvider factories)
│   │   │   └── providers/
│   │   │       ├── WhisperLocalProvider.ts   (faster-whisper-server, OpenAI-compatible API)
│   │   │       ├── WhisperAPIProvider.ts     (OpenAI Whisper API)
│   │   │       ├── KokoroProvider.ts         (local FastAPI, af_heart EN / ef_dora ES)
│   │   │       ├── OpenAITTSProvider.ts
│   │   │       └── ElevenLabsProvider.ts
│   │   ├── questions/
│   │   │   └── selector.ts                   (bank → spaced repetition → AI fallback, no EN fallback)
│   │   ├── db.ts                             (Prisma client singleton)
│   │   ├── auth.ts                           (NextAuth config + PrismaAdapter)
│   │   └── auth.config.ts                    (callbacks: authorized, jwt, session)
│   ├── i18n/
│   │   ├── config.ts                         (locales array, Locale type)
│   │   └── request.ts                        (server config for next-intl)
│   ├── navigation.ts                         (locale-aware Link, useRouter, usePathname)
│   ├── proxy.ts                              (next-intl + Auth.js chain — Next.js 16 convention)
│   └── types/
│       ├── next-auth.d.ts                    (augments session.user with id)
│       └── session.ts                        (CreateSessionRequest, SessionMessageDTO, ResultsData)
├── .env.example
├── CLAUDE.md
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 12. Roadmap

### Phase 1 — Text Chat MVP (~8 weeks)

**Definition of Done:** Full interview loop works end-to-end, deployed to Vercel. AI evaluation returns Zod-validated JSON. 200+ curated questions.

| Week | Milestone | Status |
|------|-----------|--------|
| 1 | Project setup, DB schema, Prisma, question bank (200 questions) | ✅ |
| 2 | AI engine (Ollama), evaluation prompt v1, API routes | ✅ |
| 3 | Auth (NextAuth + Google OAuth), user settings, i18n EN/ES | ✅ |
| 4 | Core pages (landing, dashboard, history, sidebar, layout) + design tokens | ✅ |
| 5 | Chat UI (session/[id]), Monaco code editor, session results page | ✅ |
| 6 | Anthropic + OpenAI + Gemini providers, smart question selector | ✅ |
| 6 | Design polish — Obsidian Terminal on all pages | ✅ |
| 7 | Bookmarks UI, dashboard analytics (score trend, weak areas, streak) | ✅ |
| 7 | Loading skeletons on all pages, README | ✅ |
| 8 | CI/CD (GitHub Actions), deploy to Vercel | ✅ |
| 8 | Zod validation on AI responses (`parser.ts`), smart provider routing (`AI_ROUTING=smart`) | ✅ |

### Phase 2 — Voice Interaction (~4 weeks) ✅

**Definition of Done:** User can speak answers via push-to-talk. AI transcribes (STT), evaluates, and responds in audio (TTS). Graceful fallback to text if mic unavailable. Provider swap (STT/TTS) via env var only — not exposed in UI.

| Week | Milestone | Status |
|------|-----------|--------|
| 9–10 | STT pipeline: faster-whisper-server (dev) + OpenAI Whisper API (prod), push-to-talk mic button + spacebar shortcut, waveform visualizer, transcript display + edit | ✅ |
| 11–12 | TTS pipeline: Kokoro local (dev, `af_heart` voice) + OpenAI TTS + ElevenLabs, audio playback controls, evaluation→question chaining, TTS speed control (0.75×/1×/1.25×/1.5×), voice↔text toggle with graceful fallback | ✅ |
| 11–12 | InteractionManager abstraction (`src/lib/interaction/`) — `transcribeAudio()`, `synthesizeAudio()`, `UserInput`/`AIOutput`/`AvatarDirective` types ready for Phase 3 | ✅ |
| 11–12 | Spanish question bank (120 questions) + removed English fallback in selector | ✅ |

### Phase 3 — Avatar Interviewer (~4 weeks)

**Definition of Done:** Animated 2D avatar acts as interviewer. Distinct states (idle, talking, listening, thinking). Lip sync driven by TTS. Round-trip latency < 3 seconds.

| Week | Milestone |
|------|-----------|
| 13–14 | Avatar design (Rive/Lottie), idle/talking/listening states, split-screen layout |
| 15–16 | Lip sync (audio → viseme mapping), emotion/gesture system from AI output |

### Phase 4 — Scale & Community (~weeks 17+)

- Timed mock interviews (30/45/60 min formats)
- Multi-round sessions (phone screen → technical → system design → behavioral)
- Company-specific question sets
- Community-submitted questions with moderation
- Leaderboards and daily streaks

### Technical Debt Milestones

These run in parallel with feature work — not blockers, but scheduled checkpoints:

| When | Task |
|------|------|
| End of Phase 1 | CI/CD (GitHub Actions), ESLint + pre-commit hooks, basic test coverage |
| End of Phase 2 | Staging environment, environment-based config (dev/staging/prod) |
| End of Phase 3 | Performance monitoring (latency per AI call), error reporting (Sentry) |
| End of Phase 4 | Load testing, rate limiting, CDN for frontend, DB connection pooling |

---

## 13. Task Breakdown — Phase 1

> Effort: **S** = few hours · **M** = half–full day · **L** = 1–2 days · **XL** = 2–3 days

### Epic 0: Project Setup ✅

| Task | Effort | Status |
|------|--------|--------|
| Initialize Next.js 16 + TypeScript + Tailwind | S | ✅ |
| Configure Prisma + Supabase PostgreSQL | M | ✅ |
| DB schema + migration (devprep schema) | M | ✅ |
| Question bank seeded (200 questions) | XL | ✅ |
| Auth (NextAuth v5 + Google OAuth) | M | ✅ |
| i18n (next-intl, EN/ES, [locale] routing) | L | ✅ |
| Core pages scaffold (landing, dashboard, history, settings, session/new) | M | ✅ |
| Design tokens + Obsidian Terminal styles | M | ✅ |
| Sidebar (collapsible, localStorage, mobile drawer) | M | ✅ |
| `.env.example` with all variables | S | ✅ |
| ESLint (`eslint.config.mjs`, `next/core-web-vitals`) | S | ✅ |
| GitHub Actions CI (lint → type-check → build) | M | ✅ |
| Pre-commit hooks (husky + lint-staged — runs ESLint on staged `.ts/.tsx`) | S | ✅ |

### Epic 1: AI Response Quality ✅

| Task | Effort | Status |
|------|--------|--------|
| `lib/ai/prompts.ts` — versioned prompt templates per category | L | ✅ |
| `lib/ai/parser.ts` — Zod schema + retry logic + graceful fallback | M | ✅ |
| Unit tests: mocked AI responses, validation failure paths | M | ⬜ | <!-- no test runner configured yet --> |
| `lib/ai/providers/anthropic.ts` — Claude Haiku adapter | L | ✅ |
| `lib/ai/providers/openai.ts` — GPT-4o Mini adapter | L | ✅ |
| `lib/ai/providers/gemini.ts` — Gemini Flash adapter | L | ✅ |
| Swap Test: `scripts/swap-test.ts` — runs evaluation across all providers, validates schema | M | ✅ |
| Verify smart routing with all providers (`AI_ROUTING=smart`) | M | ✅ |

### Epic 2: Chat UI ✅

| Task | Effort | Status |
|------|--------|--------|
| `ChatContainer.tsx` — message list, auto-scroll | L | ✅ |
| `MessageBubble.tsx` — interviewer vs candidate styles | M | ✅ |
| `EvaluationCard.tsx` — score, criteria breakdown, expandable model answer | L | ✅ |
| `ChatInput.tsx` — textarea + submit + loading state ("Evaluating...") | M | ✅ |
| `SessionHeader.tsx` — progress indicator (3/10), timer | M | ✅ |
| `CodeEditorInline.tsx` — Monaco editor for coding questions | L | ✅ |
| Loading skeletons | S | ✅ |

### Epic 3: Session Results & Dashboard ✅

| Task | Effort | Status |
|------|--------|--------|
| Session results page — per-question breakdown + expandable detail | L | ✅ |
| Score visualization — bar chart per category | M | ✅ |
| Dashboard charts — score trends over time | M | ✅ |
| Dashboard weak areas card — categories with lowest avg scores | M | ✅ |
| Streak counter | M | ✅ |

### Epic 4: Bookmarks & Spaced Repetition ✅

| Task | Effort | Status |
|------|--------|--------|
| `POST /api/bookmarks` — save/unsave a message | M | ✅ |
| `GET /api/bookmarks`, `DELETE /api/bookmarks/[id]` | M | ✅ |
| Bookmarks page — saved questions list | L | ✅ |
| Spaced repetition queue — due questions surfaced first in selector | L | ✅ |
| `updateNextReviewAt()` — interval schedule [1,3,7,14,30] days via `/api/bookmarks/[id]/review` | M | ✅ |
| Spaced repetition UI — Due/All tabs, due count badge, model answer expand, review button | M | ✅ |

### Epic 5: Design Polish ✅

| Task | Effort | Status |
|------|--------|--------|
| Dashboard — sidebar nav, glassmorphism panels, stat delta indicators | XL | ✅ |
| Landing Page — compare with Stitch, implement | L | ✅ |
| History — compare with Stitch, implement | M | ✅ |
| New Session — compare with Stitch, implement | M | ✅ |
| Settings — Obsidian Terminal styling | M | ✅ |
| Session Results — Obsidian Terminal styling | M | ✅ |

### Epic 6: Production & Deploy ✅

| Task | Effort | Status |
|------|--------|--------|
| Switch `AI_PROVIDER=anthropic` for production | S | ✅ |
| GitHub Actions: lint → type-check → build | M | ✅ |
| Deploy to Vercel (https://dev-prep-xi.vercel.app) | M | ✅ |
| README with setup instructions + live demo | L | ✅ |
| Enable Anthropic prompt caching (`cache_control: ephemeral` on system prompt) | M | ✅ |
| Performance baseline — `aiLatencyMs` recorded per evaluation message in DB | S | ✅ |

---

## 14. Environment Variables

```env
# Database (Supabase — transaction pooler, port 6543)
DATABASE_URL="postgresql://...@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Auth
AUTH_SECRET="generate with: openssl rand -base64 32"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI — Provider selection
AI_PROVIDER="ollama"          # "ollama" | "anthropic" | "gemini"
AI_ROUTING="single"           # "single" | "smart" (category-based routing)

# Ollama (local dev — FREE)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"

# Anthropic (production — recommended)
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-haiku-4-5-20251001"

# Gemini (production — free tier fallback)
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-2.5-flash"

# STT — Phase 2 ✅
STT_PROVIDER="whisper-local"        # "whisper-local" (faster-whisper-server) | "whisper-api" (OpenAI)
WHISPER_LOCAL_URL="http://localhost:8000"          # faster-whisper-server Docker port
WHISPER_LOCAL_MODEL="Systran/faster-whisper-small" # tiny | small | base | large-v3
OPENAI_API_KEY="..."                # Used for both Whisper API (STT) and OpenAI TTS

# TTS — Phase 2 ✅
TTS_PROVIDER="kokoro"               # "kokoro" (local, dev) | "openai" | "elevenlabs"
KOKORO_URL="http://localhost:8880"  # Kokoro FastAPI Docker port (dev only)
# Kokoro voices: EN=af_heart (default), ES=ef_dora
OPENAI_TTS_VOICE_EN="alloy"         # OpenAI voice for English sessions
OPENAI_TTS_VOICE_ES="alloy"         # OpenAI voice for Spanish sessions
ELEVENLABS_API_KEY="..."            # Only needed if TTS_PROVIDER=elevenlabs
ELEVENLABS_VOICE_ID_EN="..."
ELEVENLABS_VOICE_ID_ES="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LOCALE="en"
```

---

## 15. Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15 (App Router) | Fullstack in one repo, API Routes included, Vercel deploy is trivial |
| No separate backend | API Routes in Next.js | Eliminates Express complexity for a solo project |
| Database | Supabase PostgreSQL | Already in use, free tier, isolated `devprep` schema |
| ORM | Prisma | Best DX with PostgreSQL, type-safe, schema as source of truth |
| AI abstraction | Adapter pattern + factory | Swap Ollama ↔ Claude ↔ Gemini via one env var, zero code changes |
| AI dev provider | Ollama (local) | $0 cost, works offline, private, identical adapter interface |
| AI response validation | Zod on every response | AI output is unpredictable — validate or retry, never trust raw output |
| Question source | Curated bank + AI fallback | Bank = consistent quality + rubrics. AI = infinite variety when bank runs out |
| Session schema | `SessionMessage` (not `SessionQuestion`) | Chat-native: supports follow-ups, multi-turn, voice transcripts natively |
| i18n | next-intl with `localePrefix: 'always'` | Clean URLs, server + client components both supported, avoids hydration issues |
| Auth middleware | Chain next-intl + Auth.js in `proxy.ts` | Both need middleware — chaining avoids duplication, handles locale-prefixed redirects correctly. File renamed from `middleware.ts` → `proxy.ts` in Next.js 16. |
| Prisma DDL | Supabase MCP, not `prisma migrate dev` | `migrate dev` hangs with Supabase transaction pooler; MCP applies SQL directly |

---

## 16. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| AI evaluation quality varies | High | Rubrics per question, Zod validation, log all evaluations with `aiLatencyMs`, iterate on prompts |
| Inconsistent JSON from AI | High | Zod validation with retry logic, fallback to generic feedback, never crash session |
| Ollama slow on weak hardware | Medium | Loading state, use Phi-3 Mini as lighter alternative, document RAM requirements |
| Scope creep before MVP | Medium | Strict phase boundaries — MVP is text-only chat with 200 questions, no avatar |
| AI costs at scale | Low (personal use) | Prompt caching cuts input costs 90% on Claude; $1–3/month for personal use |

---

## 17. Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| 1 | MVP functional | ✅ Full interview loop works end-to-end, deployed to Vercel |
| 2 | Voice adoption | Full voice interview session completes without errors |
| 3 | Avatar latency | Round-trip (user speaks → avatar responds) under 3 seconds |
| Portfolio | Code quality | Clean architecture, Zod validation, CI/CD, README with screenshots |

---

## 18. Open Questions

- **Monetization:** Freemium (limited sessions/day) vs subscription vs keep it free as portfolio?
- **AI personality:** Should the interviewer have a name/personality, or stay neutral?
- **Mobile:** Responsive design first, or native mobile eventually?
- **Community:** When to open question submissions to other users?
- **Prompt language:** Should the evaluation prompt switch language (EN/ES) based on session language, or always in English?

---

*Document version: 6.1*
*Last updated: April 2026*
*Author: Juan David Perez Vergara*
