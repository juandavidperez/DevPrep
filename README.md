<p align="center">
  <img src="docs/logo-placeholder.svg" alt="DevPrep" width="80" />
</p>

<h1 align="center">DevPrep</h1>

<p align="center">
  AI-powered mock interview simulator for software developers.<br/>
  Practice technical, coding, system design, and behavioral questions — get scored and receive detailed feedback in real time.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## What is DevPrep?

DevPrep simulates real software development interviews through a chat-based interface. An AI interviewer asks you questions from a curated bank (or generates new ones dynamically), evaluates your free-text and code responses, and gives you a detailed score breakdown with actionable feedback.

Unlike flashcard apps, DevPrep evaluates *how* you explain concepts, not just whether you picked the right answer.

```
You: "NgOnInit runs after Angular finishes setting up the component's
     inputs. The constructor runs when the class is instantiated by DI,
     before Angular has done anything with the template or bindings..."

AI:  Score: 82/100
     ✅ Correct distinction between DI instantiation and lifecycle
     ✅ Good mention of input binding timing
     ⚠️  Missing: OnInit is part of a broader lifecycle sequence
     📝 Model answer: [expandable]
```

## Features

**Interview Simulation**
- Chat-style UI — feels like a real conversation, not a quiz
- Four question categories: technical concepts, live coding, system design, behavioral
- Configurable sessions: difficulty (junior/mid/senior), target stack, question count, language
- Monaco code editor embedded in chat for coding questions

**AI Evaluation**
- Per-question scoring (0–100) with criteria breakdown
- Detailed feedback: strengths, areas for improvement, model answer
- Evaluation criteria varies by category (correctness vs. STAR structure vs. scalability trade-offs)

**Hybrid Question System**
- 200+ curated questions from real interviews, organized by category, difficulty, and technology
- AI generates additional questions when the bank runs out for a specific combination
- Spaced repetition: previously failed questions resurface at optimal intervals

**Progress Tracking**
- Session history with scores and duration
- Category-level score trends over time
- Weak areas detection (AI analyzes patterns across sessions)
- Daily practice streak

**Bilingual Support**
- Full EN/ES support for both UI and questions
- AI evaluates in the language the question was asked in

**Multi-Provider AI**
- Swappable AI providers: Ollama (local/free), Claude Haiku, GPT-4o Mini, Gemini Flash
- Smart routing: different providers for different question categories
- Develop offline with Ollama, deploy with cloud APIs

## Demo

> 🚧 Coming soon — currently in active development.

<!-- Replace with actual screenshots when available:
![Session configuration](docs/screenshots/session-config.png)
![Chat session](docs/screenshots/chat-session.png)
![Evaluation](docs/screenshots/evaluation.png)
![Dashboard](docs/screenshots/dashboard.png)
-->

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js v5 (Google OAuth) |
| AI (dev) | Ollama + Llama 3.1 8B (local, free) |
| AI (prod) | Claude Haiku 4.5 (recommended) |
| Code Editor | Monaco Editor |
| i18n | next-intl |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Supabase](https://supabase.com) free tier)
- [Ollama](https://ollama.com) installed (for local AI — optional if using cloud API)

### 1. Clone and install

```bash
git clone https://github.com/juandavidperez/devprep.git
cd devprep
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Provider — choose one:
AI_PROVIDER="ollama"                        # "ollama" | "anthropic" | "openai" | "gemini"

# Ollama (local, free — default for development)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"

# Or Anthropic (recommended for production)
# ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma db seed          # Seeds the question bank (~200 questions)
```

### 4. Set up local AI (optional)

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (~5GB download)
ollama pull llama3.1:8b

# Start the API server
ollama serve
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

DevPrep is designed in layers that evolve across three phases without requiring rewrites:

```
┌──────────────────────────────────────────┐
│           PRESENTATION LAYER             │
│  Chat UI  →  Voice Controls  →  Avatar   │
│          (Phase 1)  (Phase 2)  (Phase 3) │
├──────────────────────────────────────────┤
│         INTERACTION MANAGER              │
│  Unified interface for all modalities    │
├──────────────────────────────────────────┤
│           PROCESSING LAYER               │
│  AI Engine  |  Speech Engine  |  Avatar  │
│  (Phase 1)    (Phase 2)       (Phase 3)  │
├──────────────────────────────────────────┤
│             DATA LAYER                   │
│  Prisma + PostgreSQL  |  NextAuth        │
└──────────────────────────────────────────┘
```

**Key design decisions:**
- **InteractionManager** abstracts all input/output so adding voice or avatar doesn't touch the AI engine
- **AI Provider abstraction** allows swapping Ollama ↔ Anthropic ↔ OpenAI ↔ Gemini via env var
- **Hybrid question system** combines curated bank + AI generation for quality + variety
- **Chat-native schema** (SessionMessage) supports multi-turn conversation, follow-ups, and future voice transcripts

## Project Structure

```
devprep/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Question bank seeder
│   └── seeds/                     # Curated question JSON files
├── src/
│   ├── app/                       # Next.js App Router pages + API routes
│   ├── components/
│   │   ├── chat/                  # ChatContainer, MessageBubble, EvaluationCard
│   │   ├── code/                  # Monaco Editor wrapper
│   │   ├── dashboard/             # ProgressChart, StreakCounter, WeakAreas
│   │   └── session/               # SessionConfigurator, SessionHeader
│   ├── lib/
│   │   ├── ai/                    # Provider abstraction + implementations
│   │   │   └── providers/         # ollama.ts, anthropic.ts, openai.ts, gemini.ts
│   │   ├── questions/             # Bank selector, spaced repetition
│   │   └── interaction/           # InteractionManager (text → voice → avatar)
│   └── hooks/                     # useChat, useTimer, useProgress
└── public/locales/                # EN/ES translations
```

## Roadmap

- [x] Project structure and architecture design
- [ ] **Phase 1 — Text Chat (MVP)** ← current
  - [ ] Foundation: Next.js + Prisma + Auth + Question Bank
  - [ ] Chat core: AI evaluation loop + session flow
  - [ ] Code editor: Monaco integration for coding questions
  - [ ] Progress: Dashboard, streak, weak areas, bookmarks
- [ ] **Phase 2 — Voice Interaction**
  - [ ] Speech-to-text (Web Speech API → Whisper)
  - [ ] Text-to-speech (Web Speech API → ElevenLabs)
  - [ ] Modality switching (text ↔ voice mid-session)
- [ ] **Phase 3 — Avatar Interviewer**
  - [ ] 2D animated character (Rive)
  - [ ] Lip sync from TTS audio
  - [ ] Emotion/gesture system driven by AI evaluation

## AI Provider Costs

| Provider | Cost/session (10 questions) | Use case |
|----------|----------------------------|----------|
| Ollama (local) | $0.00 | Development |
| GPT-4o Mini | $0.01 | Cheapest API |
| Gemini 2.5 Flash | $0.04 | Free tier available |
| Claude Haiku 4.5 | $0.11 | Best code evaluation (recommended) |

For personal use at 1 session/day, expect $1–3/month with Claude Haiku.

## License

MIT

## Author

**Juan David Perez Vergara** — Fullstack Developer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/juandpv/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/juandavidperez)
[![Email](https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white)](mailto:juandavidperezvergara@gmail.com)
