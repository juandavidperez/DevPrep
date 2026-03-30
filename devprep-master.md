# DevPrep — AI-Powered Interview Preparation Platform

> **Master Document v5.0** | March 2026
> **Status:** Week 6–7 of MVP — auth, i18n, core pages, sidebar, API routes, AI engine (all 4 providers), question bank (200 questions), smart question selector, Monaco editor, chat UI, session results, design polish (Obsidian Terminal on all pages) are done. Pending: Zod validation, smart provider routing, bookmarks UI, dashboard charts, CI/CD, Vercel deploy.

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
| Framework | Next.js 15 (App Router) | Fullstack — API Routes for backend |
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
// src/middleware.ts
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

```typescript
// src/lib/speech/types.ts

interface STTProvider {
  // Streaming: sends partial results as user speaks (live transcript)
  transcribe(audioStream: ReadableStream): AsyncIterable<TranscriptChunk>;
  // Single-shot: for recorded audio blobs
  transcribeBlob(audio: Blob, language: string): Promise<string>;
}

interface TTSProvider {
  // Single audio buffer (short responses)
  synthesize(text: string, voice: VoiceConfig): Promise<AudioBuffer>;
  // Streaming TTS for real-time playback (lower latency)
  synthesizeStream(text: string, voice: VoiceConfig): ReadableStream<Uint8Array>;
}

interface VoiceConfig {
  language: 'en' | 'es';
  speed: number;   // 0.5–2.0
  voice: string;   // Provider-specific voice ID
}

// Provider options:
// STT: Web Speech API (free, browser-native) → Whisper API (accurate, paid)
// TTS: Web Speech API (free, browser-native) → ElevenLabs (natural, paid)
```

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

Live transcript displayed in chat as user speaks (partial STT results).
Fallback: if mic unavailable → text input mode, no STT/TTS.
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

200 curated questions seeded to Supabase, tailored to Juan David's stack — not generic JS/React questions.

| File | Count | Topics |
|------|-------|--------|
| `technical.json` | 60 | Angular, Spring Boot, PostgreSQL, Docker, Git, GitHub Actions, AWS |
| `coding.json` | 50 | Algorithms, Java, TypeScript, SQL, Testing |
| `system-design.json` | 50 | Architecture, CI/CD, AWS, DB design, monitoring |
| `behavioral.json` | 40 | STAR format, bilingual EN/ES |

**Distribution by difficulty:** 65 junior · 115 mid · 20 senior

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
│       ├── technical.json       (60 questions: Angular, Spring Boot, PostgreSQL, Docker, AWS...)
│       ├── coding.json          (50 questions: Algorithms, Java, TypeScript, SQL, Testing)
│       ├── system-design.json   (50 questions)
│       └── behavioral.json      (40 questions, bilingual EN/ES)
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
│   │   │   └── SessionConfigForm.tsx
│   │   ├── settings/
│   │   │   └── SettingsForm.tsx
│   │   └── providers/
│   │       └── AuthProvider.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── types.ts                      (AIProvider interface, EvaluationResult)
│   │   │   ├── index.ts                      (factory + smart routing)
│   │   │   ├── prompts.ts                    (versioned prompt templates) ⬜
│   │   │   ├── parser.ts                     (Zod validation + retry logic) ⬜
│   │   │   └── providers/
│   │   │       ├── ollama.ts                 ✅
│   │   │       ├── anthropic.ts              ✅
│   │   │       ├── openai.ts                 ✅
│   │   │       └── gemini.ts                 ✅
│   │   ├── interaction/
│   │   │   ├── types.ts
│   │   │   └── InteractionManager.ts
│   │   ├── questions/
│   │   │   └── selector.ts                   (bank → spaced repetition → AI fallback)
│   │   ├── db.ts                             (Prisma client singleton)
│   │   ├── auth.ts                           (NextAuth config + PrismaAdapter)
│   │   └── auth.config.ts                    (callbacks: authorized, jwt, session)
│   ├── i18n/
│   │   ├── config.ts                         (locales array, Locale type)
│   │   └── request.ts                        (server config for next-intl)
│   ├── navigation.ts                         (locale-aware Link, useRouter, usePathname)
│   ├── middleware.ts                          (next-intl + Auth.js chain)
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
| 7 | Zod validation on AI responses, bookmarks UI, dashboard charts | ⬜ |
| 8 | CI/CD (GitHub Actions), deploy to Vercel, README with screenshots | ⬜ |

### Phase 2 — Voice Interaction (~4 weeks)

**Definition of Done:** User can speak answers. AI transcribes, evaluates, and responds in audio. Graceful fallback to text if mic unavailable.

| Week | Milestone |
|------|-----------|
| 9–10 | STT (Web Speech API), mic toggle, waveform visualizer, live transcript |
| 11–12 | TTS (Web Speech API → ElevenLabs), playback controls, modality switching |

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
| Initialize Next.js 15 + TypeScript + Tailwind | S | ✅ |
| Configure Prisma + Supabase PostgreSQL | M | ✅ |
| DB schema + migration (devprep schema) | M | ✅ |
| Question bank seeded (200 questions) | XL | ✅ |
| Auth (NextAuth v5 + Google OAuth) | M | ✅ |
| i18n (next-intl, EN/ES, [locale] routing) | L | ✅ |
| Core pages scaffold (landing, dashboard, history, settings, session/new) | M | ✅ |
| Design tokens + Obsidian Terminal styles | M | ✅ |
| Sidebar (collapsible, localStorage, mobile drawer) | M | ✅ |
| `.env.example` with all variables | S | ✅ |
| ESLint + pre-commit hooks | S | ⬜ |
| GitHub Actions CI (lint → type-check → build) | M | ⬜ |

### Epic 1: AI Response Quality 🟡

| Task | Effort | Status |
|------|--------|--------|
| `lib/ai/prompts.ts` — versioned prompt templates per category | L | ⬜ |
| `lib/ai/parser.ts` — Zod schema + retry logic + graceful fallback | M | ⬜ |
| Unit tests: mocked AI responses, validation failure paths | M | ⬜ |
| `lib/ai/providers/anthropic.ts` — Claude Haiku adapter | L | ✅ |
| `lib/ai/providers/openai.ts` — GPT-4o Mini adapter | L | ✅ |
| `lib/ai/providers/gemini.ts` — Gemini Flash adapter | L | ✅ |
| Swap Test: run same evaluation against all providers, assert identical output schema | M | ⬜ |
| Verify smart routing with all providers | M | ⬜ |

### Epic 2: Chat UI ✅

| Task | Effort | Status |
|------|--------|--------|
| `ChatContainer.tsx` — message list, auto-scroll | L | ✅ |
| `MessageBubble.tsx` — interviewer vs candidate styles | M | ✅ |
| `EvaluationCard.tsx` — score, criteria breakdown, expandable model answer | L | ✅ |
| `ChatInput.tsx` — textarea + submit + loading state ("Evaluating...") | M | ✅ |
| `SessionHeader.tsx` — progress indicator (3/10), timer | M | ✅ |
| `CodeEditorInline.tsx` — Monaco editor for coding questions | L | ✅ |
| Loading skeletons + error boundary | S | ⬜ |

### Epic 3: Session Results & Dashboard 🟡

| Task | Effort | Status |
|------|--------|--------|
| Session results page — per-question breakdown + expandable detail | L | ✅ |
| Score visualization (bar chart or radar per category) | M | ⬜ |
| Dashboard charts — score trends over time | M | ⬜ |
| Dashboard weak areas card — categories with lowest avg scores | M | ⬜ |
| Streak counter | M | ⬜ |

### Epic 4: Bookmarks & Spaced Repetition ⬜

| Task | Effort | Status |
|------|--------|--------|
| `POST /api/bookmarks` — save/unsave a message | M | ⬜ |
| Bookmarks page — saved questions list | L | ⬜ |
| Spaced repetition queue — due questions surfaced first | L | ⬜ |
| `updateNextReviewAt()` — SM-2 algorithm or simple interval | M | ⬜ |

### Epic 5: Design Polish ✅

| Task | Effort | Status |
|------|--------|--------|
| Dashboard — sidebar nav, glassmorphism panels, stat delta indicators | XL | ✅ |
| Landing Page — compare with Stitch, implement | L | ✅ |
| History — compare with Stitch, implement | M | ✅ |
| New Session — compare with Stitch, implement | M | ✅ |
| Settings — Obsidian Terminal styling | M | ✅ |
| Session Results — Obsidian Terminal styling | M | ✅ |

### Epic 6: Production & Deploy ⬜

| Task | Effort | Status |
|------|--------|--------|
| Switch `AI_PROVIDER=anthropic` for production | S | ⬜ |
| Enable Anthropic prompt caching on system prompt | M | ⬜ |
| GitHub Actions: lint → type-check → test → deploy to Vercel | M | ⬜ |
| Performance baseline — avg AI latency per provider | S | ⬜ |
| README with setup instructions + screenshots + live demo | L | ⬜ |

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

# Phase 2 (optional)
ELEVENLABS_API_KEY="..."
ELEVENLABS_VOICE_ID="..."

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
| Auth middleware | Chain next-intl + Auth.js | Both need middleware — chaining avoids duplication, handles locale-prefixed redirects correctly |
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
| 1 | MVP functional | Full interview loop works end-to-end, deployed to Vercel |
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

*Document version: 5.0*
*Last updated: March 2026*
*Author: Juan David Perez Vergara*
