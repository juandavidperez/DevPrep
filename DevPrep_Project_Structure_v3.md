# DevPrep — AI-Powered Interview Preparation Platform

## Project Structure Document v3.0

---

## 1. Vision & Objective

**DevPrep** is a personal AI-powered platform to prepare for software development job interviews. It evolves through three distinct phases — from text chat to voice conversation to animated avatar — each building on the previous one's architecture.

**Primary user:** Juan David Perez Vergara (personal tool)
**Potential:** If well-executed, publishable as a portfolio project demonstrating AI integration, real-time audio processing, and interactive UI.

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

## 2. Core Features by Phase

### Phase 1 — Text Chat (MVP)

The MVP is a **chat-based interview simulator**. The user interacts with the AI interviewer through a messaging interface, similar to ChatGPT or Claude but purpose-built for interview prep.

**Session flow:**
1. User configures session (category, difficulty, stack, language)
2. AI interviewer sends the first question as a chat message
3. User types their response
4. AI evaluates and responds with feedback + score + follow-up or next question
5. Session ends → results summary with detailed breakdown

**Features:**
- Chat-style UI with message bubbles (AI = interviewer, user = candidate)
- Four question categories: technical, live coding, system design, behavioral
- Monaco code editor embedded in chat for coding questions
- Per-question scoring (0–100) with criteria breakdown
- Session history and progress tracking
- Bookmarks with spaced repetition
- Bilingual support (EN/ES) for both UI and questions
- Auth with Google OAuth + saved progress

### Phase 2 — Voice Interaction

Adds real-time voice as an **alternative input/output mode** alongside text. The text chat remains fully functional — voice is an additional layer.

**New capabilities:**
- Speech-to-Text (STT): User speaks their response, AI transcribes it
- Text-to-Speech (TTS): AI interviewer reads questions and feedback aloud
- Live transcript displayed in the chat as the user speaks
- Voice activity detection (knows when user starts/stops talking)
- Push-to-talk and hands-free modes
- Playback controls for AI responses

**Why this matters for interview prep:** Real interviews are spoken. Practicing only in text doesn't build the skill of articulating technical concepts verbally under pressure.

### Phase 3 — Avatar Interviewer

Adds a visual animated character that acts as the interviewer. Not photorealistic — think Duolingo's Lily: a stylized 2D/3D character with personality.

**New capabilities:**
- Animated avatar with idle, talking, listening, and reacting states
- Lip sync driven by TTS audio output
- Facial expressions matching context (nodding, thinking, positive/negative reactions)
- Avatar appears in a video-call-like layout (split screen: avatar + chat/code)
- Personality variations (friendly interviewer, tough interviewer, peer discussion)

---

## 3. Architecture — Designed for Evolution

The architecture is built in layers. Each phase adds a new layer without rewriting the previous one.

### 3.1 Layered Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│                                                                 │
│  Phase 1          Phase 2              Phase 3                  │
│  ┌────────────┐   ┌────────────────┐   ┌─────────────────────┐ │
│  │ Chat UI    │   │ Voice Controls │   │ Avatar Canvas       │ │
│  │            │   │                │   │                     │ │
│  │ - Messages │   │ - Mic toggle   │   │ - 2D/3D character   │ │
│  │ - Monaco   │   │ - Waveform     │   │ - Lip sync engine   │ │
│  │ - Markdown │   │ - Transcript   │   │ - Expression system │ │
│  │ - Scores   │   │ - Playback     │   │ - Video-call layout │ │
│  └────────────┘   └────────────────┘   └─────────────────────┘ │
│        │                  │                      │              │
│        └──────────────────┼──────────────────────┘              │
│                           │                                     │
│                    ┌──────▼──────┐                               │
│                    │ Interaction │  ← Unified interface:         │
│                    │ Manager     │    all input/output goes      │
│                    │             │    through here                │
│                    └──────┬──────┘                               │
│                           │                                     │
├───────────────────────────┼─────────────────────────────────────┤
│                     PROCESSING LAYER                            │
│                           │                                     │
│         ┌─────────────────┼─────────────────────┐               │
│         │                 │                     │               │
│   ┌─────▼─────┐    ┌─────▼─────┐        ┌─────▼─────┐         │
│   │ AI Engine │    │ Speech    │        │ Avatar    │          │
│   │           │    │ Engine    │        │ Engine    │          │
│   │ - Generate│    │           │        │           │          │
│   │ - Evaluate│    │ - STT     │        │ - Animate │          │
│   │ - Analyze │    │ - TTS     │        │ - Lip sync│          │
│   │ - Prompts │    │ - VAD     │        │ - Express │          │
│   └─────┬─────┘    └─────┬─────┘        └─────┬─────┘         │
│         │                │                     │               │
│   Phase 1          Phase 2               Phase 3               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│   │ Prisma   │  │ NextAuth │  │ Session  │  │ Audio    │      │
│   │ (DB)     │  │ (Auth)   │  │ Store    │  │ Buffer   │      │
│   └────┬─────┘  └──────────┘  └──────────┘  └──────────┘      │
│        │                                                        │
└────────┼────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────┐
  │  Supabase    │
  │  PostgreSQL  │
  └──────────────┘
```

### 3.2 The Interaction Manager (Key Abstraction)

This is the central design decision that makes the evolution possible. All user input and AI output flow through a single `InteractionManager` regardless of modality (text, voice, or avatar).

```typescript
// lib/interaction/types.ts

type InputModality = 'text' | 'voice' | 'code';
type OutputModality = 'text' | 'voice' | 'avatar';

interface UserInput {
  modality: InputModality;
  text: string;              // Always present (typed or transcribed)
  code?: string;             // For coding questions
  audioBlob?: Blob;          // Raw audio (Phase 2+)
  metadata: {
    questionId: string;
    timeSpent: number;
    language: 'en' | 'es';
  };
}

interface AIOutput {
  text: string;              // Always present (displayed or spoken)
  score?: Evaluation;
  audioUrl?: string;         // TTS audio URL (Phase 2+)
  avatarDirective?: {        // Animation commands (Phase 3)
    emotion: 'neutral' | 'positive' | 'thinking' | 'concerned';
    gesture: 'nod' | 'shake' | 'point' | 'idle';
    emphasis: string[];      // Words to emphasize with gestures
  };
}

interface InteractionManager {
  sendInput(input: UserInput): Promise<AIOutput>;
  getSessionState(): SessionState;
  switchModality(modality: OutputModality): void;
}
```

**Why this matters:** When Phase 2 adds voice, the AI Engine doesn't change at all — it still receives text and returns text. The Speech Engine converts voice→text before sending and text→voice after receiving. Same for Phase 3 — the Avatar Engine just reads the `avatarDirective` from the same output.

### 3.3 AI Engine (Provider Abstraction + Routing)

The AI engine supports multiple providers and a routing strategy that assigns different providers to different question categories based on cost/quality trade-offs.

```typescript
// lib/ai/types.ts

interface AIProvider {
  generateQuestions(config: SessionConfig): Promise<Question[]>;
  evaluateResponse(question: Question, response: string): Promise<Evaluation>;
  analyzeWeakAreas(history: SessionHistory[]): Promise<WeakAreaAnalysis>;
}

// lib/ai/providers/ollama.ts — Local (FREE, development)
class OllamaProvider implements AIProvider {
  private baseUrl: string; // default: http://localhost:11434

  async evaluateResponse(question: Question, response: string): Promise<Evaluation> {
    const prompt = buildEvaluationPrompt(question, response);
    const result = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });
    return parseEvaluation(await result.json());
  }
}

// lib/ai/providers/anthropic.ts — Claude Haiku (RECOMMENDED for production)
class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  async evaluateResponse(question: Question, response: string): Promise<Evaluation> {
    const prompt = buildEvaluationPrompt(question, response);
    const result = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,           // Cached via prompt caching (90% savings)
      messages: [{ role: 'user', content: prompt }],
    });
    return parseEvaluation(result);
  }
}

// lib/ai/providers/openai.ts — GPT-4o Mini (CHEAPEST API fallback)
class OpenAIProvider implements AIProvider { ... }

// lib/ai/providers/gemini.ts — Gemini 2.5 Flash (FREE TIER available)
class GeminiProvider implements AIProvider { ... }

// lib/ai/index.ts — Factory
export function getAIProvider(category?: QuestionCategory): AIProvider {
  const provider = process.env.AI_PROVIDER || 'ollama';

  // Smart routing: use different providers per question category (Phase 3 optimization)
  if (process.env.AI_ROUTING === 'smart' && category) {
    return getSmartRouted(category);
  }

  switch (provider) {
    case 'ollama':    return new OllamaProvider();    // Dev: $0
    case 'anthropic': return new AnthropicProvider();  // Prod: best quality
    case 'openai':    return new OpenAIProvider();     // Prod: cheapest API
    case 'gemini':    return new GeminiProvider();     // Prod: free tier
    default:          return new OllamaProvider();
  }
}

// Smart routing assigns the best provider per category
function getSmartRouted(category: QuestionCategory): AIProvider {
  switch (category) {
    case 'coding':        return new AnthropicProvider(); // Haiku: best code eval
    case 'system_design': return new AnthropicProvider(); // Haiku: best reasoning
    case 'technical':     return new GeminiProvider();    // Flash: good + cheaper
    case 'behavioral':    return new OpenAIProvider();    // 4o-mini: cheapest, adequate
    default:              return new AnthropicProvider();
  }
}
```

### 3.4 Speech Engine (Phase 2)

```typescript
// lib/speech/types.ts

interface STTProvider {
  // Streaming transcription: sends partial results as user speaks
  transcribe(audioStream: ReadableStream): AsyncIterable<TranscriptChunk>;
  // Single-shot transcription
  transcribeBlob(audio: Blob, language: string): Promise<string>;
}

interface TTSProvider {
  // Generate speech audio from text
  synthesize(text: string, voice: VoiceConfig): Promise<AudioBuffer>;
  // Streaming TTS for real-time playback
  synthesizeStream(text: string, voice: VoiceConfig): ReadableStream<Uint8Array>;
}

interface VoiceConfig {
  language: 'en' | 'es';
  speed: number;          // 0.5 – 2.0
  voice: string;          // Provider-specific voice ID
}

// Possible providers:
// STT: Web Speech API (free, browser) → Whisper API (paid, accurate)
// TTS: Web Speech API (free, browser) → ElevenLabs (paid, natural)
```

**Phase 2 data flow:**

```
User speaks
    │
    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Microphone  │────▶│ STT Engine  │────▶│ text string │
│ (MediaRecor │     │ (transcribe)│     │             │
│  der API)   │     └─────────────┘     └──────┬──────┘
└─────────────┘                                │
                                               ▼
                                    ┌─────────────────┐
                         ┌─────────│ Interaction      │
                         │         │ Manager          │
                         │         └────────┬─────────┘
                         │                  │
                         ▼                  ▼
                  ┌──────────────┐  ┌──────────────┐
                  │ Chat UI      │  │ AI Engine    │
                  │ (transcript) │  │ (evaluate)   │
                  └──────────────┘  └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │ AI response  │
                                    │ (text)       │
                                    └──────┬───────┘
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                       ┌──────────┐ ┌──────────┐ ┌──────────┐
                       │ Chat UI  │ │ TTS      │ │ Avatar   │
                       │ (bubble) │ │ Engine   │ │ Engine   │
                       └──────────┘ │ (speak)  │ │ (Phase 3)│
                                    └──────────┘ └──────────┘
```

### 3.5 Avatar Engine (Phase 3)

```typescript
// lib/avatar/types.ts

interface AvatarState {
  currentEmotion: Emotion;
  isTalking: boolean;
  isListening: boolean;
  gesture: Gesture;
}

type Emotion = 'neutral' | 'happy' | 'thinking' | 'impressed'
             | 'concerned' | 'encouraging';

type Gesture = 'idle' | 'nod' | 'shake' | 'hand_raise'
             | 'chin_stroke' | 'thumbs_up';

interface AvatarEngine {
  // Initialize avatar on a canvas/container element
  init(container: HTMLElement, config: AvatarConfig): void;

  // Driven by TTS audio for mouth movement
  startTalking(audioSource: AudioBuffer): void;
  stopTalking(): void;

  // Expression changes driven by AI output directives
  setEmotion(emotion: Emotion, duration?: number): void;
  playGesture(gesture: Gesture): void;

  // Listening state (user is speaking)
  setListening(active: boolean): void;

  // Cleanup
  destroy(): void;
}

interface AvatarConfig {
  character: 'professional' | 'friendly' | 'tough'; // personality variants
  style: '2d_illustrated' | '3d_low_poly';           // visual style
  size: { width: number; height: number };
}

// Possible implementations:
// Phase 3a: Lottie/Rive animations (2D, lightweight, like Duolingo)
// Phase 3b: Three.js + Ready Player Me (3D, more complex)
```

**Avatar-TTS integration (lip sync):**

```
AI response text
       │
       ▼
┌──────────────┐
│  TTS Engine  │──────▶ AudioBuffer
└──────────────┘             │
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌───────────┐ ┌────────────┐
       │ Audio      │ │ Viseme    │ │ Avatar     │
       │ Playback   │ │ Analyzer  │ │ Renderer   │
       │ (speaker)  │ │ (mouth    │ │ (emotion + │
       └────────────┘ │  shapes)  │ │  gesture)  │
                      └─────┬─────┘ └─────┬──────┘
                            │             │
                            └──────┬──────┘
                                   ▼
                            ┌────────────┐
                            │  Canvas /  │
                            │  WebGL     │
                            └────────────┘
```

**Viseme analysis** extracts mouth shape data from the audio stream in real-time, mapping phonemes to mouth positions (A, E, I, O, U, closed, etc.). Libraries like `oculus-lipsync-js` or a simple FFT-based approach can handle this.

---

## 4. Tech Stack by Phase

### Phase 1 — Text Chat (MVP)

```
Framework:      Next.js 15 (App Router) + React 19
Styling:        Tailwind CSS
Language:       TypeScript
Auth:           NextAuth.js v5 (Google OAuth)
Database:       PostgreSQL (Supabase free tier)
ORM:            Prisma
AI (dev):       Ollama + Llama 3.1 8B or Qwen 3 7B (local, FREE)
AI (prod):      Claude Haiku 4.5 (recommended) or Gemini 2.5 Flash (free tier)
Code Editor:    Monaco Editor
i18n:           next-intl
Deploy:         Vercel
```

### Phase 2 — Voice (adds)

```
STT (free):     Web Speech API (SpeechRecognition)
STT (paid):     OpenAI Whisper API ($0.006/min) — fallback for accuracy
TTS (free):     Web Speech API (SpeechSynthesis)
TTS (paid):     ElevenLabs API ($5/mo for 30min) — fallback for natural voice
Audio capture:  MediaRecorder API (browser native)
Audio viz:      Web Audio API (waveform display)
```

### Phase 3 — Avatar (adds)

```
2D animation:   Rive (free tier) or Lottie
                → Lightweight, vector-based, like Duolingo's characters
3D alternative: Three.js + custom low-poly model
                → More complex but more impressive for portfolio
Lip sync:       Audio FFT analysis → viseme mapping
                → Or ElevenLabs Viseme API if using their TTS
State machine:  XState (manages avatar states/transitions)
```

### Cost Breakdown (all phases)

#### AI Provider Comparison (prices as of March 2026)

| Provider | Model | Input/1M tokens | Output/1M tokens | Cost/session (10 pregs) | Quality | Notes |
|----------|-------|-----------------|-------------------|------------------------|---------|-------|
| **Ollama (local)** | Llama 3.1 8B | $0 | $0 | **$0.00** | ⭐⭐⭐ | Needs 8GB+ RAM. Offline, private. Best for dev. |
| **Ollama (local)** | Qwen 3 7B | $0 | $0 | **$0.00** | ⭐⭐⭐ | Better multilingual (EN/ES). Needs 8GB+ RAM. |
| **OpenAI** | GPT-4o Mini | $0.15 | $0.60 | **$0.01** | ⭐⭐⭐½ | Cheapest API. $5 free credits on signup. |
| **Google** | Gemini 2.5 Flash | $0.30 | $2.50 | **$0.04** | ⭐⭐⭐⭐ | Free tier: 1,000 req/day. Good quality. |
| **OpenAI** | GPT-5 Mini | $0.25 | $2.00 | **$0.04** | ⭐⭐⭐⭐ | Good balance. Newer model. |
| **Anthropic** | Claude Haiku 4.5 | $1.00 | $5.00 | **$0.11** | ⭐⭐⭐⭐½ | **Recommended.** Best code evaluation. Excellent Spanish. |
| **Anthropic** | Claude Sonnet 4.6 | $3.00 | $15.00 | **$0.28** | ⭐⭐⭐⭐⭐ | Premium. Best for complex system design. |

*Session estimate: ~2,000 input tokens + ~1,500 output tokens per question (system prompt + question + user response + AI evaluation).*

#### AI Cost Strategy by Development Phase

| Phase | Provider | Monthly Cost | When to use |
|-------|----------|-------------|-------------|
| **Development** | Ollama (Llama 3.1 8B) | **$0** | All local dev and testing. No API keys needed. |
| **MVP Deploy** | Claude Haiku 4.5 | **$1–3** | Production. Best code eval quality. Prompt caching cuts input costs 90%. |
| **Optimization** | Smart routing (mixed) | **$0.50–1.50** | Haiku for code/design, Gemini Flash for technical, GPT-4o Mini for behavioral. |

#### Infrastructure Cost (all phases)

| Service | Phase 1 | Phase 2 | Phase 3 |
|---------|---------|---------|---------|
| Vercel (hosting) | $0 | $0 | $0 |
| Supabase PostgreSQL | $0 | $0 | $0 |
| AI provider (see above) | $0–3/mo | $0–3/mo | $0–3/mo |
| Web Speech API (STT+TTS) | — | $0 | $0 |
| ElevenLabs (optional TTS) | — | $5/mo | $5/mo |
| Rive (avatar) | — | — | $0 (free tier) |
| **Total** | **$0–3** | **$0–8** | **$0–8** |

#### Ollama Local Setup Requirements

```
Minimum hardware:
  RAM:    8GB (16GB recommended for Qwen 3 7B)
  Disk:   ~5GB per model
  GPU:    Optional (CPU works, but slower)
  OS:     macOS, Linux, or Windows

Install:
  curl -fsSL https://ollama.com/install.sh | sh    # Linux/macOS
  ollama pull llama3.1:8b                            # Download model (~4.7GB)
  ollama serve                                       # Start local API on :11434

The Ollama API is OpenAI-compatible, so the provider
implementation is a simple HTTP client pointing to localhost.
```

#### Prompt Caching Strategy (Production)

When using Claude Haiku in production, enable prompt caching to reduce costs:

```
System prompt (~1,500 tokens) is identical across all requests.
With caching:
  - First request:  1,500 tokens × $1.00/MTok = $0.0015 (cache write)
  - Subsequent:     1,500 tokens × $0.10/MTok = $0.00015 (cache read = 90% off)

For 300 requests/month (1 session/day × 10 questions):
  - Without caching: $0.45 just for system prompt input
  - With caching:    $0.045 (saves $0.40/month on system prompt alone)
```

---

## 5. Database Schema

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  image         String?
  sessions      Session[]
  bookmarks     Bookmark[]
  settings      UserSettings?
  createdAt     DateTime       @default(now())
}

model UserSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  uiLanguage        String   @default("en")          // "en" | "es"
  questionLanguage  String   @default("en")          // independent of UI
  defaultDifficulty String   @default("mid")
  defaultCategories String[] @default(["technical", "coding", "system_design", "behavioral"])
  targetStack       String[] @default(["angular", "spring_boot", "postgresql"])
  outputModality    String   @default("text")        // "text" | "voice" | "avatar"
  voiceSpeed        Float    @default(1.0)           // Phase 2
  avatarCharacter   String   @default("professional") // Phase 3
}

model Session {
  id             String            @id @default(cuid())
  userId         String
  user           User              @relation(fields: [userId], references: [id])
  category       String            // "technical" | "coding" | "system_design" | "behavioral" | "mixed"
  difficulty     String
  targetStack    String[]
  language       String            @default("en")
  inputModality  String            @default("text")   // "text" | "voice"
  totalQuestions  Int
  completedAt    DateTime?
  score          Float?
  duration       Int?              // seconds
  messages       SessionMessage[]
  createdAt      DateTime          @default(now())
}

// Chat-based message history (replaces rigid Q&A structure)
model SessionMessage {
  id            String    @id @default(cuid())
  sessionId     String
  session       Session   @relation(fields: [sessionId], references: [id])
  role          String    // "interviewer" | "candidate"
  content       String    @db.Text
  codeContent   String?   @db.Text             // code from Monaco editor
  messageType   String    @default("message")  // "message" | "question" | "evaluation" | "follow_up"
  questionIndex Int?                            // which question number (1, 2, 3...)
  score         Float?                          // only on evaluation messages
  criteria      Json?                           // score breakdown
  feedback      String?   @db.Text
  modelAnswer   String?   @db.Text
  audioUrl      String?                        // Phase 2: stored audio
  createdAt     DateTime  @default(now())

  bookmark      Bookmark?

  @@index([sessionId, createdAt])
}

model Bookmark {
  id            String          @id @default(cuid())
  userId        String
  user          User            @relation(fields: [userId], references: [id])
  messageId     String          @unique
  message       SessionMessage  @relation(fields: [messageId], references: [id])
  notes         String?         @db.Text
  reviewCount   Int             @default(0)
  nextReviewAt  DateTime?
  createdAt     DateTime        @default(now())

  @@index([userId, nextReviewAt])
}
```

**Note:** The schema uses `SessionMessage` (chat-style) instead of `SessionQuestion` (form-style). This fits the conversational UI and naturally supports follow-up questions, multi-turn evaluation, and voice transcripts.

---

## 5b. Question Bank System (Hybrid Strategy)

DevPrep uses a **hybrid question strategy**: a curated bank of real interview questions stored in the database, supplemented by AI-generated questions when the bank doesn't cover a specific topic or runs out for a given combination.

### Why hybrid?

| Aspect | Bank only | AI only | Hybrid (chosen) |
|--------|-----------|---------|-----------------|
| Question quality | Excellent (curated) | Variable (depends on model) | Excellent + good fallback |
| Works with Ollama (local) | Perfect (no generation needed) | Risky (weak questions) | Great (bank = primary, AI = backup) |
| Token cost | Zero (for questions) | High (generation + evaluation) | Low (AI only evaluates + occasional generation) |
| Variety | Limited (~200 questions) | Infinite | Large (bank + infinite AI) |
| Spaced repetition | Easy (questions have stable IDs) | Hard (each question is ephemeral) | Best of both (bank has IDs, AI fills gaps) |
| Initial setup effort | Medium (must curate) | Zero | Medium (same as bank only) |

### Question Bank Schema

```prisma
model QuestionBank {
  id            String   @id @default(cuid())
  category      String   // "technical" | "coding" | "system_design" | "behavioral"
  difficulty    String   // "junior" | "mid" | "senior"
  tags          String[] // ["angular", "spring_boot", "postgresql", "ngrx", ...]
  language      String   @default("en")   // "en" | "es"

  questionText  String   @db.Text
  hints         String[] // Optional hints for the candidate
  modelAnswer   String?  @db.Text         // Reference ideal answer
  evaluationCriteria String[]             // What the AI should check
  timeEstimate  Int      @default(180)    // Suggested seconds

  // For coding questions
  codeTemplate  String?  @db.Text         // Starter code
  testCases     Json?                     // [{ input: "...", expected: "..." }]
  codeLanguage  String?                   // "typescript" | "java" | "kotlin" | "sql"

  // For system design
  constraints   Json?                     // { users: "10M", latency: "100ms", ... }

  // Tracking
  timesServed   Int      @default(0)      // How many times this question has been used
  avgScore      Float?                    // Average score across all users
  source        String?                   // "curated" | "ai_generated" | "community"
  isActive      Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([category, difficulty, language])
  @@index([tags])
}
```

### Question Selection Algorithm

When a session starts, the system selects questions through this priority chain:

```typescript
// lib/questions/selector.ts

async function selectQuestions(config: SessionConfig, userId: string): Promise<SelectedQuestion[]> {
  const { category, difficulty, targetStack, language, totalQuestions } = config;

  // Step 1: Find questions due for spaced repetition (previously failed/bookmarked)
  const reviewDue = await getReviewDueQuestions(userId, category, difficulty, language);

  // Step 2: Find unseen bank questions matching the config
  const unseenBank = await getUnseenBankQuestions(userId, {
    category,
    difficulty,
    tags: targetStack,
    language,
    exclude: reviewDue.map(q => q.id),
  });

  // Step 3: Fill remaining slots with AI-generated questions (if needed)
  const fromBank = [...reviewDue, ...unseenBank].slice(0, totalQuestions);
  const remaining = totalQuestions - fromBank.length;

  let aiGenerated: SelectedQuestion[] = [];
  if (remaining > 0) {
    const aiProvider = getAIProvider(category);
    aiGenerated = await aiProvider.generateQuestions({
      count: remaining,
      category,
      difficulty,
      stack: targetStack,
      language,
      // Avoid duplicates: send titles of bank questions as context
      existingQuestions: fromBank.map(q => q.questionText.substring(0, 80)),
    });
  }

  // Step 4: Shuffle and return
  return shuffle([...fromBank, ...aiGenerated]);
}
```

**Selection priority:**
1. Spaced repetition queue (questions you failed before, due for review)
2. Unseen bank questions matching category + difficulty + stack tags
3. Previously seen but not recently served bank questions
4. AI-generated questions (only when bank is exhausted for this config)

### Initial Question Bank Structure

The bank starts with ~150-200 curated questions distributed across categories:

```
Question Bank (~200 initial questions)
├── Technical (80 questions)
│   ├── Angular (20)
│   │   ├── Junior: lifecycle hooks, data binding, directives, pipes
│   │   ├── Mid: lazy loading, change detection, RxJS operators, NgRx
│   │   └── Senior: custom decorators, micro-frontends, performance tuning
│   ├── Spring Boot (20)
│   │   ├── Junior: annotations, DI, REST controllers, Spring Data basics
│   │   ├── Mid: security, transactions, caching, exception handling
│   │   └── Senior: custom starters, reactive, event-driven, optimization
│   ├── PostgreSQL / SQL (15)
│   │   ├── Junior: CRUD, JOINs, GROUP BY, indexes basics
│   │   ├── Mid: window functions, CTEs, query plans, normalization
│   │   └── Senior: partitioning, replication, jsonb, full-text search
│   ├── TypeScript (10)
│   ├── Java (10)
│   └── General CS (5)
│
├── Coding (50 questions)
│   ├── Data structures (15): arrays, linked lists, trees, hashmaps, graphs
│   ├── Algorithms (15): sorting, searching, dynamic programming, greedy
│   ├── String manipulation (10)
│   └── SQL challenges (10): complex queries, optimization
│
├── System Design (30 questions)
│   ├── Junior: REST API design, database schema, caching basics
│   ├── Mid: URL shortener, chat system, notification service
│   └── Senior: distributed systems, event-driven architecture, scaling
│
└── Behavioral (40 questions)
    ├── Conflict resolution (10)
    ├── Leadership / ownership (10)
    ├── Failure and learning (10)
    └── Teamwork and communication (10)
```

### Question Bank Seeding

Questions are stored as JSON seed files and loaded via a Prisma seed script:

```
prisma/
├── seed.ts                    # Main seed script
└── seeds/
    ├── technical-angular.json
    ├── technical-spring-boot.json
    ├── technical-postgresql.json
    ├── coding-algorithms.json
    ├── coding-data-structures.json
    ├── system-design.json
    └── behavioral.json
```

Example seed file structure:

```json
// prisma/seeds/technical-angular.json
[
  {
    "category": "technical",
    "difficulty": "mid",
    "tags": ["angular", "rxjs"],
    "language": "en",
    "questionText": "Explain the difference between switchMap, mergeMap, concatMap, and exhaustMap in RxJS. When would you use each one in an Angular application?",
    "hints": [
      "Think about what happens to the inner observable when a new outer value arrives",
      "Consider HTTP request scenarios for each"
    ],
    "modelAnswer": "switchMap cancels the previous inner observable when a new value arrives — ideal for search typeahead where only the latest result matters...",
    "evaluationCriteria": [
      "Correctly describes cancellation behavior of each operator",
      "Provides practical Angular use cases",
      "Mentions race condition prevention",
      "Explains when NOT to use switchMap (e.g., POST requests)"
    ],
    "timeEstimate": 240
  }
]
```

### AI-Generated Questions (Fallback)

When the bank doesn't have enough questions for a specific config, the AI generates them using a focused prompt:

```
Generate {count} NEW interview questions. Do NOT repeat or rephrase
any of the following existing questions:
{existingQuestions}

Parameters:
- Category: {category}
- Difficulty: {difficulty}
- Technologies: {stack}
- Language: {language}

Requirements:
- Questions must be specific and realistic
- Include evaluation criteria for each
- For coding: include clear input/output specs
- For system design: include scale constraints
```

AI-generated questions that score well (high average user scores, positive feedback) can be promoted to the permanent bank via a simple admin flag.

### How this changes token costs

With the hybrid approach, token usage drops significantly:

```
Session with 100% AI generation:
  - Generate 10 questions:    ~3,000 tokens input + ~4,000 output = $0.025 (Haiku)
  - Evaluate 10 responses:    ~20,000 tokens input + ~15,000 output = $0.095 (Haiku)
  - Total:                    $0.12/session

Session with hybrid (bank questions):
  - Generate 0 questions:     $0.00 (questions come from bank)
  - Evaluate 10 responses:    ~20,000 tokens input + ~15,000 output = $0.095 (Haiku)
  - Total:                    $0.095/session (21% cheaper)

Session with hybrid + Ollama (dev):
  - Everything local:         $0.00
```

---

## 6. Pages & UI Structure

```
/                           → Landing / Dashboard (if logged in)
/auth/signin                → Google OAuth sign-in
/dashboard                  → Progress overview, stats, streak
/session/new                → Configure session
/session/[id]               → Chat interface (the main experience)
/session/[id]/results       → Session summary + detailed feedback
/history                    → Past sessions
/bookmarks                  → Saved questions + review queue
/settings                   → Preferences (language, modality, avatar)
```

### Chat Session UI Layout

**Phase 1 — Text only:**

```
┌─────────────────────────────────────────────┐
│  DevPrep    Session 3/10    ⏱ 04:32   [EN] │
├─────────────────────────────────────────────┤
│                                             │
│  🤖 Interviewer                             │
│  ┌─────────────────────────────────────┐    │
│  │ Explain the difference between      │    │
│  │ NgOnInit and the constructor in     │    │
│  │ Angular. When would you use each?   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│                          You 👤             │
│    ┌─────────────────────────────────────┐  │
│    │ The constructor is called when the  │  │
│    │ class is instantiated by the DI...  │  │
│    └─────────────────────────────────────┘  │
│                                             │
│  🤖 Evaluation                              │
│  ┌─────────────────────────────────────┐    │
│  │ Score: 78/100                       │    │
│  │ ✅ Correct about DI instantiation   │    │
│  │ ⚠️  Missing: lifecycle hook timing  │    │
│  │ 📝 Model answer: [expandable]       │    │
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│  [Type your response...]          [Send ▶] │
│  [📎 Code Editor]                           │
└─────────────────────────────────────────────┘
```

**Phase 2 — Voice added:**

```
┌─────────────────────────────────────────────┐
│  DevPrep    Session 3/10    ⏱ 04:32   [EN] │
├─────────────────────────────────────────────┤
│                                             │
│  (same chat messages as above)              │
│                                             │
├─────────────────────────────────────────────┤
│  [Type your response...]          [Send ▶] │
│  [📎 Code]  [🎤 Voice]  [🔊 Playback]      │
│             ~~~~ waveform ~~~~              │
└─────────────────────────────────────────────┘
```

**Phase 3 — Avatar added:**

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│   Avatar View        │   Chat / Code        │
│                      │                      │
│   ┌──────────────┐   │  🤖 Interviewer      │
│   │              │   │  ┌────────────────┐  │
│   │   (Animated  │   │  │ Question...    │  │
│   │   character  │   │  └────────────────┘  │
│   │   speaking)  │   │                      │
│   │              │   │  (chat continues)    │
│   └──────────────┘   │                      │
│                      │                      │
│   😊 Impressed       ├──────────────────────┤
│                      │ [Input area]    [▶]  │
│   🔊 ████████░░ 1x   │ [📎] [🎤] [🔊]      │
└──────────────────────┴──────────────────────┘
```

---

## 7. AI Prompt Design

### 7.1 System Prompt (Interviewer Persona)

The AI acts as an interviewer and evaluator. With the hybrid strategy, the AI receives pre-selected questions (from bank or AI-generated) and focuses on delivering them conversationally and evaluating responses.

```
You are a senior technical interviewer conducting a mock interview.
You speak in a conversational but professional tone — not robotic,
not overly casual. You are direct, fair, and helpful.

Session config:
- Category: {category}
- Difficulty: {difficulty}
- Target stack: {stack}
- Language: {language}
- Question {current} of {total}

You will be given a pre-selected question to ask. Present it naturally
as if you thought of it — don't say "here's question #3" robotically.
Add brief context or framing when it helps (e.g., "Let's switch to
a coding problem now" or "This one is about your experience working
in teams").

Behavior rules:
- Present ONE question at a time, conversationally
- Wait for the candidate's response before evaluating
- After evaluation, naturally transition to the next question
- Adjust follow-up depth based on the quality of the response
- If the response is partial, ask a targeted follow-up before scoring
- Be encouraging but honest — don't sugarcoat poor answers

Response format for evaluation (use JSON inside markdown code block):
```json
{
  "score": 0-100,
  "criteria": { ... },
  "strengths": ["..."],
  "improvements": ["..."],
  "modelAnswer": "..."
}
```

Evaluation criteria by category:
- Technical: correctness, depth, practical examples, clarity
- Coding: correctness, time/space complexity, readability, edge cases
- System design: scalability, trade-offs, completeness, communication
- Behavioral: STAR structure, specificity, self-awareness, relevance
```

### 7.2 Avatar Directive Extension (Phase 3)

In Phase 3, the AI output includes animation directives:

```
Additional instruction for Phase 3:
After your evaluation JSON, include an avatar directive:
```json
{
  "avatar": {
    "emotion": "impressed",           // or neutral, thinking, concerned, encouraging
    "gesture": "nod",                 // or idle, shake, thumbs_up, chin_stroke
    "emphasis_words": ["excellent", "well-structured"]  // words to gesture on
  }
}
```
Choose emotion and gesture based on the candidate's performance:
- Score >= 80: impressed/happy + nod/thumbs_up
- Score 50-79: encouraging + nod
- Score < 50: concerned + chin_stroke (never negative or discouraging)
```

---

## 8. Project File Structure

```
devprep/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                          # Seed script for question bank
│   └── seeds/                           # Curated question bank JSON files
│       ├── technical-angular.json       # ~20 Angular questions
│       ├── technical-spring-boot.json   # ~20 Spring Boot questions
│       ├── technical-postgresql.json    # ~15 PostgreSQL/SQL questions
│       ├── technical-typescript.json    # ~10 TypeScript questions
│       ├── technical-java.json          # ~10 Java questions
│       ├── coding-algorithms.json       # ~15 algorithm challenges
│       ├── coding-data-structures.json  # ~15 data structure challenges
│       ├── coding-sql-challenges.json   # ~10 SQL challenges
│       ├── coding-strings.json          # ~10 string manipulation
│       ├── system-design.json           # ~30 system design questions
│       └── behavioral.json              # ~40 behavioral questions
├── public/
│   ├── locales/
│   │   ├── en.json
│   │   └── es.json
│   └── avatars/                          # Phase 3: avatar assets
│       └── professional/
│           ├── model.riv                  # Rive animation file
│           └── expressions.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── auth/signin/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── session/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Main chat session
│   │   │       └── results/page.tsx
│   │   ├── history/page.tsx
│   │   ├── bookmarks/page.tsx
│   │   ├── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── sessions/
│   │       │   ├── route.ts              # POST: create
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET: details
│   │       │       └── chat/route.ts     # POST: send message, get AI response
│   │       ├── progress/route.ts
│   │       └── bookmarks/route.ts
│   │
│   ├── components/
│   │   ├── ui/                           # Reusable primitives
│   │   ├── chat/                         # Phase 1
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── EvaluationCard.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── CodeEditorInline.tsx      # Monaco embedded in chat
│   │   ├── session/
│   │   │   ├── SessionConfigurator.tsx
│   │   │   └── SessionHeader.tsx
│   │   ├── dashboard/
│   │   │   ├── ProgressChart.tsx
│   │   │   ├── StreakCounter.tsx
│   │   │   └── WeakAreasCard.tsx
│   │   ├── voice/                        # Phase 2
│   │   │   ├── VoiceControls.tsx
│   │   │   ├── Waveform.tsx
│   │   │   ├── TranscriptOverlay.tsx
│   │   │   └── PlaybackControls.tsx
│   │   └── avatar/                       # Phase 3
│   │       ├── AvatarCanvas.tsx
│   │       ├── AvatarVideoLayout.tsx
│   │       └── EmotionIndicator.tsx
│   │
│   ├── lib/
│   │   ├── interaction/                  # Core abstraction
│   │   │   ├── types.ts                  # UserInput, AIOutput, InteractionManager
│   │   │   ├── manager.ts               # InteractionManager implementation
│   │   │   └── modality.ts              # Modality switching logic
│   │   ├── questions/                   # Question bank + selection
│   │   │   ├── selector.ts              # Selection algorithm (bank → AI fallback)
│   │   │   ├── bank.ts                  # DB queries for question bank
│   │   │   └── spaced-repetition.ts     # Review scheduling logic
│   │   ├── ai/                          # Phase 1
│   │   │   ├── types.ts
│   │   │   ├── index.ts                 # Provider factory + smart routing
│   │   │   ├── prompts.ts              # Prompt templates
│   │   │   └── providers/
│   │   │       ├── ollama.ts            # Local dev (FREE)
│   │   │       ├── anthropic.ts         # Claude Haiku/Sonnet (production)
│   │   │       ├── openai.ts            # GPT-4o Mini (cheapest API)
│   │   │       └── gemini.ts            # Gemini Flash (free tier)
│   │   ├── speech/                      # Phase 2
│   │   │   ├── types.ts
│   │   │   ├── stt/
│   │   │   │   ├── web-speech.ts        # Free browser STT
│   │   │   │   └── whisper.ts           # Paid Whisper fallback
│   │   │   └── tts/
│   │   │       ├── web-speech.ts        # Free browser TTS
│   │   │       └── elevenlabs.ts        # Paid natural voice
│   │   ├── avatar/                      # Phase 3
│   │   │   ├── types.ts
│   │   │   ├── engine.ts               # Avatar state machine
│   │   │   ├── lipsync.ts              # Audio → viseme mapping
│   │   │   └── renderer/
│   │   │       ├── rive.ts             # 2D Rive renderer
│   │   │       └── three.ts            # 3D Three.js renderer (alt)
│   │   ├── db.ts                        # Prisma client
│   │   └── auth.ts                      # NextAuth config
│   │
│   ├── hooks/
│   │   ├── useChat.ts                   # Chat state management
│   │   ├── useTimer.ts
│   │   ├── useProgress.ts
│   │   ├── useVoice.ts                  # Phase 2: mic + playback
│   │   └── useAvatar.ts                 # Phase 3: avatar control
│   │
│   └── types/
│       └── index.ts
│
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 9. Development Roadmap

### Phase 1 — Text Chat MVP (~8 weeks)

**Week 1–2: Foundation**
- [ ] Initialize Next.js + TypeScript + Tailwind
- [ ] Set up Prisma + Supabase PostgreSQL
- [ ] Configure NextAuth with Google OAuth
- [ ] Run initial migration with full schema (including QuestionBank model)
- [ ] Build app shell (layout, navbar, responsive sidebar)
- [ ] Set up next-intl for EN/ES
- [ ] Create settings page
- [ ] Install Ollama + pull Llama 3.1 8B (local AI for development)
- [ ] Implement AI provider abstraction layer with Ollama provider
- [ ] Create seed JSON files for initial question bank (~50 questions across categories)
- [ ] Implement Prisma seed script + run initial seed

**Week 3–4: Chat Core**
- [ ] Implement Anthropic, OpenAI, and Gemini providers (swap via env var)
- [ ] Build question selector algorithm (bank → spaced repetition → AI fallback)
- [ ] Build InteractionManager (text-only initially)
- [ ] Implement prompt templates for all 4 categories
- [ ] Build SessionConfigurator page
- [ ] Build ChatContainer + MessageBubble components
- [ ] Implement `/api/sessions/[id]/chat` endpoint
- [ ] Wire up: configure → start → chat → evaluate loop

**Week 5–6: Code Editor + Polish**
- [ ] Integrate Monaco Editor as inline chat component
- [ ] Implement coding question flow (write → submit → evaluate)
- [ ] Add system design question support
- [ ] Add per-question timer + session timer
- [ ] Build session results page with full breakdown
- [ ] Handle session persistence (resume interrupted sessions)

**Week 7–8: Progress + Bookmarks + Deploy**
- [ ] Build dashboard (stats, score trends chart, streak tracker)
- [ ] Implement weak areas detection
- [ ] Build session history page with filters
- [ ] Implement bookmarks + spaced repetition
- [ ] UI polish pass + loading states + error handling
- [ ] Switch AI_PROVIDER from ollama → anthropic for production
- [ ] Enable Anthropic prompt caching on system prompt
- [ ] Write README with screenshots
- [ ] Deploy to Vercel

### Phase 2 — Voice Interaction (~4 weeks)

**Week 9–10: STT + Recording**
- [ ] Implement Web Speech API STT provider
- [ ] Build VoiceControls component (mic toggle, push-to-talk)
- [ ] Build Waveform visualizer (Web Audio API)
- [ ] Build TranscriptOverlay (real-time transcript in chat)
- [ ] Wire STT output → InteractionManager → AI Engine
- [ ] Store audio references + transcripts in DB

**Week 11–12: TTS + Playback**
- [ ] Implement Web Speech API TTS provider
- [ ] Build PlaybackControls component
- [ ] Add voice speed setting
- [ ] Implement modality switching (text ↔ voice mid-session)
- [ ] Optional: ElevenLabs integration for natural voice
- [ ] Test full voice loop: speak → transcribe → AI → speak back
- [ ] Polish + deploy Phase 2

### Phase 3 — Avatar Interviewer (~4 weeks)

**Week 13–14: Avatar Design + Rendering**
- [ ] Design avatar character (2D illustrated style)
- [ ] Create avatar assets in Rive (idle, talking, listening, expressions)
- [ ] Build AvatarCanvas component
- [ ] Implement avatar state machine (XState)
- [ ] Build AvatarVideoLayout (split screen: avatar + chat)

**Week 15–16: Lip Sync + Integration**
- [ ] Implement audio → viseme mapping for lip sync
- [ ] Connect TTS audio output to avatar mouth animation
- [ ] Implement emotion/gesture system driven by AI directives
- [ ] Add avatar directive to AI prompts
- [ ] Add avatar character selection in settings
- [ ] Polish transitions and animation smoothness
- [ ] Final deploy

---

## 10. Environment Variables

```env
# Database
DATABASE_URL="postgresql://...@supabase:5432/devprep"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI — Provider selection
AI_PROVIDER="ollama"                       # "ollama" | "anthropic" | "openai" | "gemini"
AI_ROUTING="single"                        # "single" (one provider) | "smart" (route by category)

# AI — Ollama (local, FREE — default for development)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"                 # or "qwen3:7b" for better multilingual

# AI — Anthropic (recommended for production)
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-haiku-4-5-20251001"

# AI — OpenAI (cheapest API option)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"

# AI — Google Gemini (free tier available)
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-2.5-flash"

# Phase 2 (optional paid speech providers)
WHISPER_API_KEY="sk-..."                   # OpenAI Whisper STT (reuses OPENAI_API_KEY)
ELEVENLABS_API_KEY="..."                   # Natural TTS
ELEVENLABS_VOICE_ID="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LOCALE="en"
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Hybrid question strategy | Bank questions = guaranteed quality + work with Ollama. AI fallback = infinite variety. Best of both worlds. |
| Chat UI over form-based Q&A | More natural, supports follow-ups, matches real interview flow, reusable for voice/avatar |
| InteractionManager abstraction | Single interface for text/voice/avatar — new modalities plug in without rewriting core logic |
| AI provider abstraction | Swap Ollama ↔ Anthropic ↔ OpenAI ↔ Gemini without touching business logic. Shows clean architecture in portfolio |
| Ollama for development | $0 cost during dev. All AI calls run locally. Switch to cloud API by changing one env var. |
| Claude Haiku for production | Best code evaluation quality. With prompt caching, system prompt costs drop 90%. $1–3/month for personal use. |
| Smart routing (Phase 3 optimization) | Route code/design questions to Haiku (quality), technical to Gemini Flash (free tier), behavioral to GPT-4o Mini (cheapest). Cuts costs 60%+. |
| Speech provider abstraction | Start free (Web Speech API), upgrade to paid (Whisper/ElevenLabs) when needed |
| Web Speech API first | Free, zero-config, works in Chrome. Good enough for MVP. Upgrade path exists |
| Rive over Three.js for avatar | Lightweight 2D animations, smaller bundle, easier to design, Duolingo-style aesthetic |
| SessionMessage over SessionQuestion | Chat-native schema — supports multi-turn conversation, follow-ups, and voice transcripts |
| XState for avatar | State machines are the right tool for managing complex animation states and transitions |
| Phase 3 avatar is 2D illustrated | Realistic 3D is expensive, slow, and uncanny. Illustrated style is charming and achievable |

---

## 12. Name

**DevPrep** — simple, clear, professional. Open to change.

---

*Document version: 3.1*
*Created: March 2026*
*Author: Juan David Perez Vergara + Claude*
