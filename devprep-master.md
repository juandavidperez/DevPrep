# DevPrep — AI-Powered Interview Preparation Platform

> **Master Document v7.0** | April 2026
> **Status:** Phase 1 complete ✅ · Phase 2 (Voice) complete ✅ · Phase 3 (Avatar) pending ⬜
>
> **Phase 1 done:** auth, i18n, AI engine (4 providers + Zod validation + smart routing), 200-question EN bank + 120-question ES bank, smart selector + spaced repetition, Monaco editor, chat UI, session results, bookmarks, dashboard analytics, loading skeletons, CI/CD, pre-commit hooks, swap test, `aiLatencyMs` tracking.
>
> **Phase 2 done:** STT pipeline (faster-whisper-server local + OpenAI Whisper API), TTS pipeline (Kokoro local + OpenAI TTS + ElevenLabs), push-to-talk mic button + spacebar shortcut, waveform visualizer, transcript display + edit, audio playback with progress bar, evaluation→question audio chaining, TTS speed control (0.75×/1×/1.25×/1.5×), voice↔text modality toggle with graceful fallback, InteractionManager abstraction (`src/lib/interaction/`).
>
> **Phase 3 pending:** Animated 2D avatar interviewer. Avatar character design + animation guide + rigging sheet already generated. Rive work and Next.js integration not started.

---

## 1. Vision & Objective

**DevPrep** is a personal AI-powered platform to prepare for software development job interviews. It evolves through three phases — from text chat to voice conversation to animated avatar — each building on the previous architecture.

**Primary user:** Juan David Perez Vergara (personal use)
**Portfolio potential:** Publishable as a portfolio project demonstrating AI integration, real-time audio, and interactive UI.

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

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Fullstack — API Routes for backend |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Utility-first |
| ORM | Prisma | Type-safe, great DX with PostgreSQL |
| Database | Supabase PostgreSQL | Free tier, `devprep` schema isolated from `public` |
| Auth | NextAuth.js v5 | Google OAuth, JWT sessions, PrismaAdapter |
| Validation | Zod ✅ | Runtime validation of AI responses |
| Code Editor | Monaco Editor ✅ | Embedded in chat for coding questions |
| i18n | next-intl ^4.8.3 | EN/ES, `localePrefix: 'always'` |
| AI (dev) | Ollama + Llama 3.1 8B | Local, $0 cost during development |
| AI (prod) | Claude Haiku 4.5 | Best code evaluation, prompt caching ✅ |
| AI (alt) | Gemini 2.0 Flash | Free tier fallback ✅ |
| AI (alt) | OpenAI GPT-4o Mini | Cheapest option ✅ |
| Avatar (Phase 3) | Rive (`@rive-app/react-canvas`) | Native state machines, lip sync via bone animations |
| Deploy | Vercel | Frontend + API Routes |

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
│  │  - Bookmarks     │     │  /api/speech/stt          │ │
│  └──────────────────┘     │  /api/speech/tts          │ │
│                           └──────────┬────────────────┘ │
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
   │ OpenAI 4o-m ✅   │   │  - messages        │  └────────────────┘
   └──────────────────┘   │  - bookmarks       │
                          └────────────────────┘
```

### 3.2 Layered Design — Each Phase Adds a Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  Phase 1: Chat UI (messages, scores)                            │
│  Phase 2: + Voice Controls (mic, waveform, transcript) ✅       │
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
│   │  (Phase 1✅)│  │  (Phase 2✅) │  │  (Phase 3⬜) │          │
│   └─────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                              │
│   Prisma ORM → PostgreSQL (Supabase, "devprep" schema) + Auth.js│
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Interaction Manager

All user input and AI output flow through `InteractionManager` regardless of modality. Adding voice in Phase 2 didn't touch the AI layer. Phase 3 avatar connects the same way.

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
    case 'ollama':    return new OllamaProvider();
    case 'anthropic': return new AnthropicProvider();
    case 'gemini':    return new GeminiProvider();
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

### 3.7 Speech Engine (Phase 2 ✅)

The Speech Engine sits between the Interaction Manager and the AI layer. The AI layer never changes — it still receives text and returns text.

#### Provider Matrix

```
               DEV ($0)                          PROD (default)          PROD (alternative)
               ──────────────────────────────────────────────────────────────────────────
STT ✅         faster-whisper-server (Docker) →   OpenAI Whisper API
TTS ✅         Kokoro FastAPI (Docker)        →   OpenAI TTS          →   ElevenLabs
AI Engine ✅   Ollama + Llama 3.1            →   Claude Haiku         →   Gemini Flash
```

**Why OpenAI TTS as default (not ElevenLabs):** The same `OPENAI_API_KEY` used for Whisper STT covers TTS — no extra key needed.

#### Phase 2 Data Flow

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

Push-to-talk: user holds mic → records → releases → STT transcribes →
AI evaluates → TTS synthesizes → audio plays back.
Fallback: if mic unavailable or STT_PROVIDER not set → text input mode.
```

#### Phase 3 Data Flow (Avatar)

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
        │ audio → phonemes │             │   (Rive)            │
        └──────────────────┘             └─────────────────────┘

Target: round-trip latency (user stops speaking → avatar starts responding) < 3 seconds.
```

---

## 4. Database Schema (Prisma)

- **Supabase project:** `wjmgvfkwicqhggojlxst`
- **Schema:** `devprep` (isolated from `public` and `auth`)
- **Prisma:** Uses `multiSchema` preview feature
- **Connection:** Transaction pooler (port 6543) — direct IPv6 connection unreachable from dev machine
- **DDL changes:** `prisma migrate dev` hangs on this setup. Use Supabase MCP (`apply_migration`) for all DDL, then `npx prisma generate`.

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
  score          Float?
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

---

## 5. Question Bank

320 curated questions seeded to Supabase (200 EN + 120 ES), tailored to Juan David's stack.

**English bank (200 questions):**

| File | Count | Topics |
|------|-------|--------|
| `technical.json` | 60 | Angular, Spring Boot, PostgreSQL, Docker, Git, GitHub Actions, AWS |
| `coding.json` | 50 | Algorithms, Java, TypeScript, SQL, Testing |
| `system-design.json` | 50 | Architecture, CI/CD, AWS, DB design, monitoring |
| `behavioral.json` | 40 | STAR format |

**Spanish bank (120 questions) ✅:**

| File | Count | Topics |
|------|-------|--------|
| `technical-es.json` | 40 | Angular, Spring Boot, Java 17, PostgreSQL, Docker, AWS |
| `coding-es.json` | 25 | Algoritmos, TypeScript, Java, SQL (window functions) |
| `system-design-es.json` | 25 | Arquitectura, CI/CD, AWS, patrones distribuidos |
| `behavioral-es.json` | 30 | Formato STAR completo en español |

**Distribution EN:** 65 junior · 115 mid · 20 senior
**Distribution ES:** 42 junior · 56 mid · 22 senior

Stack focus: Angular (Standalone, RxJS, Signals) · Java 17 · Spring Boot (Security JWT, JPA/Hibernate) · PostgreSQL · Docker · GitHub Actions · AWS (S3, EC2, RDS, IAM)

> **Language selection:** `selector.ts` queries by `language` field. If no match in the bank → AI generates in the selected language (no English fallback).

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
/bookmarks                → Saved questions + spaced repetition queue
/settings                 → User preferences (language, difficulty, categories, stack)
```

---

## 7. API Routes

```
POST /api/sessions                  → Create session + generate first question
GET  /api/sessions/[id]             → Get session with all messages
POST /api/sessions/[id]/messages    → Send response → AI evaluation + next question
GET  /api/settings                  → Get user settings (upsert if missing)
PUT  /api/settings                  → Update user preferences
POST /api/speech/stt                → Transcribe audio blob → text (multipart/form-data)
POST /api/speech/tts                → Synthesize text → audio stream (JSON body)
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

### Zod Validation ✅

Every AI response is validated before storing or sending to the client. If validation fails → retry once with a stricter prompt → fallback to generic feedback.

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
```

### Prompt Caching (Production — Claude Haiku)

The system prompt (~1,500 tokens) is identical across all requests. With Anthropic prompt caching:
- Cache write: `$0.0015` (first request per session)
- Cache read: `$0.00015` (all subsequent — **90% cheaper**)

---

## 9. Design System — "The Obsidian Terminal"

Design source: **Google Stitch** (project ID: `15023765856949113622`).

### Design Tokens

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
- **Shadows:** `rgba(0,0,0,0.4)` tinted with ghost border outline.
- **Border radius:** `rounded-xl` (0.75rem) for cards.

### Implementation Status

| Screen | Status |
|--------|--------|
| Login | ✅ |
| Sidebar | ✅ Collapsible, localStorage persistence |
| Dashboard | ✅ Glassmorphism panels, stat deltas, font-mono numbers |
| Landing Page | ✅ Hero with radial glow, terminal visualization |
| History | ✅ Filtered session list, badges, score color coding |
| New Session | ✅ Background decorative blurs, SessionConfigForm |
| Settings | ✅ Ambient background, grid overlay, animated pulse |
| Chat (Session) | ✅ Message bubbles, evaluation cards, code editor |
| Session Results | ✅ Per-question breakdown |
| Bookmarks | ✅ Saved questions with spaced repetition |
| Loading skeletons | ✅ All routes |

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
│       ├── technical.json            (60 questions EN)
│       ├── coding.json               (50 questions EN)
│       ├── system-design.json        (50 questions EN)
│       ├── behavioral.json           (40 questions EN)
│       ├── technical-es.json         (40 questions ES) ✅
│       ├── coding-es.json            (25 questions ES) ✅
│       ├── system-design-es.json     (25 questions ES) ✅
│       └── behavioral-es.json        (30 questions ES) ✅
├── messages/
│   ├── en.json
│   └── es.json
├── src/
│   ├── app/
│   │   ├── globals.css               (design tokens as CSS custom properties)
│   │   ├── [locale]/
│   │   │   ├── layout.tsx            (Sidebar + AuthProvider + NextIntlClientProvider)
│   │   │   ├── page.tsx              (Landing / redirect to dashboard)
│   │   │   ├── auth/signin/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── session/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx              ← Chat interface
│   │   │   │       └── results/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── bookmarks/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── sessions/
│   │       │   ├── route.ts                  ← POST: create session
│   │       │   └── [id]/
│   │       │       ├── route.ts              ← GET: session details
│   │       │       └── messages/route.ts     ← POST: send message, get AI response
│   │       ├── settings/route.ts             ← GET + PUT
│   │       ├── bookmarks/
│   │       │   ├── route.ts                  ← GET + POST
│   │       │   └── [id]/
│   │       │       ├── route.ts              ← DELETE
│   │       │       └── review/route.ts       ← POST: update spaced repetition
│   │       └── speech/
│   │           ├── stt/route.ts              ← POST: audio → text ✅
│   │           └── tts/route.ts              ← POST: text → audio stream ✅
│   ├── components/
│   │   ├── Sidebar.tsx                       (collapsible, localStorage, mobile drawer)
│   │   ├── LanguageSwitcher.tsx
│   │   ├── LandingPage.tsx
│   │   ├── PublicNavbar.tsx
│   │   ├── Footer.tsx
│   │   ├── history/
│   │   │   ├── HistoryFilters.tsx
│   │   │   └── SessionList.tsx
│   │   ├── session/
│   │   │   ├── ChatContainer.tsx             (voice state, STT/TTS orchestration, audio chaining)
│   │   │   ├── ChatInput.tsx                 (text + voice mode, TTS speed selector)
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
│   │   ├── interaction/                      ✅ Phase 2
│   │   │   ├── types.ts                      (UserInput, AIOutput, SessionState, AvatarDirective)
│   │   │   └── index.ts                      (transcribeAudio, synthesizeAudio)
│   │   ├── speech/                           ✅ Phase 2
│   │   │   ├── types.ts                      (STTProvider, TTSProvider interfaces)
│   │   │   ├── index.ts                      (getSTTProvider, getTTSProvider factories)
│   │   │   └── providers/
│   │   │       ├── WhisperLocalProvider.ts   (faster-whisper-server)
│   │   │       ├── WhisperAPIProvider.ts     (OpenAI Whisper API)
│   │   │       ├── KokoroProvider.ts         (local FastAPI, af_heart EN / ef_dora ES)
│   │   │       ├── OpenAITTSProvider.ts
│   │   │       └── ElevenLabsProvider.ts
│   │   ├── questions/
│   │   │   └── selector.ts                   (bank → spaced repetition → AI fallback)
│   │   ├── db.ts                             (Prisma client singleton)
│   │   ├── auth.ts                           (NextAuth config + PrismaAdapter)
│   │   └── auth.config.ts                    (callbacks: authorized, jwt, session)
│   ├── i18n/
│   │   ├── config.ts                         (locales array, Locale type)
│   │   └── request.ts                        (server config for next-intl)
│   ├── navigation.ts                         (locale-aware Link, useRouter, usePathname)
│   ├── proxy.ts                              (next-intl + Auth.js chain)
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

### Phase 1 — Text Chat MVP ✅ (~8 weeks)

All features complete and deployed to Vercel. Key deliverables: full interview loop, 4 AI providers with smart routing, Zod-validated responses, 320-question bilingual bank, Obsidian Terminal design, bookmarks + spaced repetition, CI/CD.

### Phase 2 — Voice Interaction ✅ (~4 weeks)

Full voice interview sessions working end-to-end. STT + TTS pipelines implemented with local (dev, $0) and API (prod) providers. InteractionManager abstraction ready for Phase 3 avatar integration.

### Phase 3 — Avatar Interviewer ⬜ (~4 weeks)

**Definition of Done:** Animated 2D avatar acts as interviewer. 4 states (idle, listening, thinking, talking) with positive/concerned sub-states. Lip sync driven by TTS audio. Split-screen layout (avatar left, chat right). Round-trip latency < 3 seconds.

**Technology:** Rive (`@rive-app/react-canvas`) — chosen over Lottie for native state machine support, interactive inputs from code, and built-in lip sync capability via bone animations.

| Week | Milestone |
|------|-----------|
| 13 | Fix eye component backgrounds → import 13 rigging sheet components into Rive → assemble character → create bones (Head, Chest, Brow_L/R, Eye_L/R, Mouth) → export `.riv` |
| 14 | Animate 5 states (idle, listening, thinking, talking_positive, talking_concerned) → build state machine with boolean inputs (`isListening`, `isThinking`, `isTalking`, `isPositive`, `isConcerned`) → crossfade 300ms |
| 15 | Install `@rive-app/react-canvas` → build `AvatarCanvas.tsx` → build `useAvatarState` hook → connect `avatarDirective` from AI output to Rive inputs → split-screen layout |
| 16 | Lip sync (TTS audio → viseme mapping → mouth shapes) → mobile fallback (avatar collapsed top) → graceful degradation if Rive fails → performance monitoring |

### Phase 4 — Scale & Community (~weeks 17+)

- Timed mock interviews (30/45/60 min formats)
- Multi-round sessions (phone screen → technical → system design → behavioral)
- Company-specific question sets
- Community-submitted questions with moderation

---

## 13. Task Breakdown — Phase 3

> Effort: **S** = few hours · **M** = half–full day · **L** = 1–2 days · **XL** = 2–3 days
> Avatar character design, animation guide, and rigging sheet already generated — see Section 17.

### Epic 7: Avatar Character — Rive Setup (Week 13) ⬜

| Task | Effort | Status |
|------|--------|--------|
| Fix eye components (4 & 5) — remove white background in Canva/Figma | S | ⬜ |
| Import all 13 rigging sheet components into Rive as assets | M | ⬜ |
| Assemble character on canvas — position each layer (torso, head, hair, eyes, eyebrows, mouth) | L | ⬜ |
| Create bone structure: Head (pivot at neck), Chest (breathing), Brow_L/R, Eye_L/R, Mouth | L | ⬜ |
| Bind each component to its bone | M | ⬜ |
| Export `.riv` file and verify it loads in browser via `@rive-app/react-canvas` | S | ⬜ |

### Epic 8: State Machine & Animations (Week 14) ⬜

| Task | Effort | Status |
|------|--------|--------|
| `idle` animation — breathing (chest), occasional blink, gentle head sway | M | ⬜ |
| `listening` animation — head tilted forward, eyebrows raised, pupils wider | M | ⬜ |
| `thinking` animation — eyes up-left (cognitive recall), slow blink, hand-to-chin | L | ⬜ |
| `talking_positive` animation — mouth lip sync shapes (A/I, O/U, M/B/P, F/V), slight smile, head emphasis | L | ⬜ |
| `talking_concerned` animation — same mouth shapes, furrowed brows, focused expression | L | ⬜ |
| Build state machine with boolean inputs: `isListening`, `isThinking`, `isTalking`, `isPositive`, `isConcerned` | M | ⬜ |
| Define transitions — all states return to idle when booleans are false, crossfade 300ms | M | ⬜ |
| Test all state combinations manually in Rive editor | S | ⬜ |

### Epic 9: Next.js Integration & Layout (Week 15) ⬜

| Task | Effort | Status |
|------|--------|--------|
| Install `@rive-app/react-canvas` | S | ⬜ |
| `AvatarCanvas.tsx` — loads `.riv`, exposes methods to set state machine inputs | L | ⬜ |
| Connect `avatarDirective` from `InteractionManager` to Rive inputs (emotion → isPositive/isConcerned, gesture → isTalking/isThinking) | M | ⬜ |
| `useAvatarState` hook — maps session flow to avatar state (user speaking → listening, AI processing → thinking, AI responding → talking) | M | ⬜ |
| Split-screen layout — avatar panel (left, 50%) + chat panel (right, 50%) | L | ⬜ |
| Avatar panel glassmorphism styling — Obsidian Terminal design system | M | ⬜ |
| State label indicator below avatar (dev/debug, hidden in prod) | S | ⬜ |

### Epic 10: Lip Sync, Polish & Latency (Week 16) ⬜

| Task | Effort | Status |
|------|--------|--------|
| Lip sync — map TTS audio to viseme sequence (A/I, O/U, M/B/P, F/V mouth shapes) | XL | ⬜ |
| Measure round-trip latency: user stops speaking → avatar starts responding — target < 3s | M | ⬜ |
| Optimize `.riv` file size (target < 500KB) | S | ⬜ |
| Mobile layout — avatar collapsed to top strip, chat full screen below | L | ⬜ |
| Fallback: if Rive fails to load → graceful degradation to voice-only mode | M | ⬜ |
| Cross-browser testing (Chrome, Firefox, Safari, Edge) | M | ⬜ |
| Performance monitoring — log avatar load time + state transition latency | S | ⬜ |

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

# OpenAI (used for both Whisper STT API and OpenAI TTS)
OPENAI_API_KEY="..."

# STT — Phase 2 ✅
STT_PROVIDER="whisper-local"        # "whisper-local" | "whisper-api"
WHISPER_LOCAL_URL="http://localhost:8000"
WHISPER_LOCAL_MODEL="Systran/faster-whisper-small"

# TTS — Phase 2 ✅
TTS_PROVIDER="kokoro"               # "kokoro" | "openai" | "elevenlabs"
KOKORO_URL="http://localhost:8880"
OPENAI_TTS_VOICE_EN="alloy"
OPENAI_TTS_VOICE_ES="alloy"
ELEVENLABS_API_KEY="..."            # Only needed if TTS_PROVIDER=elevenlabs
ELEVENLABS_VOICE_ID_EN="..."
ELEVENLABS_VOICE_ID_ES="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LOCALE="en"
```

---

## 15. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| AI evaluation quality varies | High | Rubrics per question, Zod validation, log all evaluations with `aiLatencyMs` |
| Inconsistent JSON from AI | High | Zod validation with retry logic, fallback to generic feedback |
| Rive animation complexity | Medium | Start with simple bone animations, validate `.riv` loads in browser before animating |
| Lip sync latency | Medium | Pre-generate viseme sequence while TTS is streaming; target < 3s round-trip |
| Ollama slow on weak hardware | Medium | Loading state, use Phi-3 Mini as lighter alternative |
| AI costs at scale | Low (personal) | Prompt caching cuts input costs 90% on Claude; ~$1–3/month personal use |

---

## 16. Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| 1 | MVP functional | ✅ Full interview loop works end-to-end, deployed to Vercel |
| 2 | Voice adoption | ✅ Full voice interview session completes without errors |
| 3 | Avatar latency | Round-trip (user speaks → avatar responds) under 3 seconds |
| Portfolio | Code quality | Clean architecture, Zod validation, CI/CD, README with screenshots |

---

## 17. Avatar Assets (Phase 3)

All assets generated via Google Gemini + Google Flow. Ready to import into Rive — character assembly and animation not started.

### Character Design

**Approved design (variant 2 selected):**
- Style: Flat 2D, semi-stylized (between Duolingo and Notion AI)
- Clothing: Black hoodie with purple `>_` terminal symbol
- Eyes: Electric violet (`#d2bbff`) — primary brand accent on character
- Skin: Warm medium tone — works on dark backgrounds
- Format: Transparent background, bust/portrait crop, gender-neutral

### Animation States

| State | Key Animation Points |
|-------|---------------------|
| **Idle** | Chest rise/fall (breathing), occasional blink (eyelids), gentle head sway (pivot at neck) |
| **Listening** | Head tilted forward/right, eyebrows raised gently, eyes wide & focused (pupils larger) |
| **Thinking** | Eyes up & left (cognitive recall direction), slow blink rate, hand-to-chin |
| **Talking — Positive** | Mouth shapes A/I + O/U + M/B/P + F/V, head emphasis movements, slight smile |
| **Talking — Concerned** | Same mouth shapes, furrowed brows, focused/serious expression |

### Rigging Sheet — 13 Components

> ⚠️ **Components 4 & 5 (eyes)** have a white background instead of transparent. Remove the white fill in Canva, Figma, or Photoshop before importing — otherwise a white rectangle will cover the face.

| # | Component | Purpose |
|---|-----------|---------|
| 1 | Full body base (torso + neck, no head) | Static base layer |
| 2 | Head — neutral, front-facing | Bone: rotates for emphasis/thinking |
| 3 | Hair — isolated | Static, sits on top of head |
| 4 | Eyes open — purple iris | Bone: Eye_L / Eye_R |
| 5 | Eyes mid-blink — halfway closed | Blink animation frame |
| 6 | Eyes closed — fully closed | Blink animation frame |
| 7 | Eyebrow_L and Eyebrow_R — neutral | Bone: Brow_L / Brow_R |
| 8 | Eyebrow_L and Eyebrow_R — raised | Listening state expression |
| 9 | Mouth closed — neutral slight smile | Base mouth shape |
| 10 | Mouth mid-open (Eee/Oo) | Lip sync viseme |
| 11 | Mouth fully open (Ah) | Lip sync viseme |
| 12 | Mouth M/B/P — lips pressed | Lip sync viseme |
| 13 | Hand — hand-to-chin gesture | Thinking state prop |

### Rive State Machine — Input Reference

| Input | Type | Triggers |
|-------|------|---------|
| `isListening` | Boolean | User is recording (mic active) |
| `isThinking` | Boolean | AI is processing response |
| `isTalking` | Boolean | AI audio is playing back |
| `isPositive` | Boolean | Evaluation score ≥ 70 (used with `isTalking`) |
| `isConcerned` | Boolean | Evaluation score < 70 (used with `isTalking`) |

> **Idle** = all inputs false (default state)
> **Talking Positive** = `isTalking + isPositive`
> **Talking Concerned** = `isTalking + isConcerned`

### Viseme Mapping — Lip Sync

| Viseme | Mouth Shape | Phonemes |
|--------|-------------|----------|
| A/I | Wide open | "ah", "ay", "eye" |
| O/U | Rounded | "oh", "oo", "you" |
| M/B/P | Lips pressed | "mm", "bb", "pp" |
| F/V | Teeth on lip | "ff", "vv" |
| Closed | Neutral smile | Rest, silence |

---

## 18. Open Questions

- **Monetization:** Freemium (limited sessions/day) vs subscription vs keep it free as portfolio?
- **AI personality:** Should the interviewer have a name/personality, or stay neutral?
- **Mobile:** Responsive design first, or native mobile eventually?
- **Community:** When to open question submissions to other users?
- **Prompt language:** Should the evaluation prompt switch language (EN/ES) based on session language, or always in English?

---

*Document version: 7.0*
*Last updated: April 2026*
*Author: Juan David Perez Vergara*
