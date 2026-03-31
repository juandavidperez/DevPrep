<p align="center">
  <img src="public/logo-devprep.svg" alt="DevPrep" width="80" />
</p>

<h1 align="center">DevPrep</h1>

<p align="center">
  AI-powered mock interview simulator for software developers.<br/>
  Practice technical, coding, system design, and behavioral questions — get scored with detailed feedback in real time.
</p>

<p align="center">
  <a href="https://dev-prep-xi.vercel.app"><strong>Live Demo →</strong></a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## What is DevPrep?

DevPrep simulates real software development interviews through a chat-based interface. An AI interviewer asks questions from a curated bank of 200 questions (or generates new ones dynamically), evaluates your free-text and code responses, and gives you a detailed score breakdown with actionable feedback.

Unlike flashcard apps, DevPrep evaluates *how* you explain concepts — not just whether you picked the right answer.

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

---

## Features

**Interview Simulation**
- Chat-style UI — feels like a real conversation, not a quiz
- 4 question categories: Technical, Coding (with Monaco editor), System Design, Behavioral
- Configurable sessions: difficulty (junior / mid / senior), stack, question count, language (EN/ES)
- Timer and progress indicator per session

**AI Evaluation**
- Per-question scoring (0–100) with criteria breakdown
- Criteria vary by category: correctness/depth for technical, scalability/trade-offs for system design, STAR structure for behavioral
- Detailed feedback + model answer after each response

**Question System**
- 200 curated questions tailored to Angular, Java/Spring Boot, PostgreSQL, Docker, AWS
- Smart selection: spaced repetition queue → unseen from bank → AI-generated fallback
- Distribution: 65 junior · 115 mid · 20 senior

**Multi-Provider AI**
- Swappable providers via env var: Ollama (local/free), Claude Haiku, Gemini Flash, GPT-4o Mini
- Smart routing: auto-selects the best provider per question category
- Develop fully offline with Ollama — zero API cost

**App**
- Google OAuth authentication (Auth.js v5)
- Session history with filters, pagination, and score breakdown
- Bookmarks — save questions to review later
- Dashboard with score trends, weak areas chart, and practice streak
- Bilingual UI and questions: English and Spanish
- Obsidian Terminal design system — dark glassmorphism + loading skeletons on every page

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL (`devprep` schema) |
| ORM | Prisma 6 |
| Auth | Auth.js v5 (NextAuth beta) — Google OAuth |
| AI (dev) | Ollama + Llama 3.1 8B — free, local |
| AI (prod) | Claude Haiku 4.5 — best code evaluation |
| Code editor | Monaco Editor |
| i18n | next-intl 4 — EN / ES |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com))
- [Ollama](https://ollama.com) for local AI (optional — can use cloud APIs instead)

### 1. Clone and install

```bash
git clone https://github.com/juandavidperez/DevPrep.git
cd DevPrep
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` (see [Environment Variables](#environment-variables) below).

### 3. Set up the database

```bash
npx prisma generate
npx prisma db seed        # Seeds 200 curated questions
```

> **Note:** `prisma migrate dev` hangs with Supabase's transaction pooler. Apply DDL via the Supabase dashboard or MCP, then run `npx prisma generate`.

### 4. (Optional) Set up Ollama for local AI

```bash
# Install Ollama — https://ollama.com
ollama pull llama3.1:8b   # ~5 GB download
ollama serve
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en).

---

## Environment Variables

```env
# Supabase — transaction pooler (port 6543)
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@pooler.supabase.com:6543/postgres"

# Auth.js
AUTH_SECRET=""              # openssl rand -base64 32
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI provider
AI_PROVIDER="ollama"        # "ollama" | "anthropic" | "gemini" | "openai"
AI_ROUTING="single"         # "single" | "smart" (category-based routing)

# Ollama (local dev — free)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"

# Anthropic (production — recommended)
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-haiku-4-5-20251001"

# Gemini (production — free tier available)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.0-flash"

# OpenAI (optional)
OPENAI_API_KEY=""

# App
NEXT_PUBLIC_DEFAULT_LOCALE="en"
```

For production on Vercel, also add `NEXTAUTH_URL` with your deployment URL.

---

## Architecture

DevPrep is designed in layers that evolve across three phases without requiring rewrites:

```
┌──────────────────────────────────────────────┐
│             PRESENTATION LAYER               │
│  Chat UI  →  + Voice Controls  →  + Avatar   │
│  (Phase 1)      (Phase 2)          (Phase 3) │
├──────────────────────────────────────────────┤
│           INTERACTION MANAGER                │
│  Unified interface — text, voice, or avatar  │
├──────────────────────────────────────────────┤
│             PROCESSING LAYER                 │
│  AI Engine  |  Speech Engine  |  Avatar Eng  │
├──────────────────────────────────────────────┤
│               DATA LAYER                     │
│  Prisma + PostgreSQL  |  Auth.js             │
└──────────────────────────────────────────────┘
```

**Key decisions:**
- `InteractionManager` abstracts all input/output — adding voice or avatar doesn't touch the AI layer
- AI provider abstraction allows swapping Ollama ↔ Claude ↔ Gemini ↔ OpenAI via a single env var
- Curated bank + AI fallback: consistent quality when questions are available, infinite variety when they run out
- Chat-native schema (`SessionMessage`) natively supports follow-ups, multi-turn, and future voice transcripts
- Auth.js chains with next-intl middleware via `src/proxy.ts` so locale-prefixed redirects work correctly

### AI Provider Switching

```env
AI_PROVIDER=ollama      # Free, offline (development)
AI_PROVIDER=anthropic   # Claude Haiku — best for code evaluation
AI_PROVIDER=gemini      # Gemini Flash — free tier
AI_PROVIDER=openai      # GPT-4o Mini — cheapest paid

AI_ROUTING=smart        # Auto-routes by question category
```

### AI Cost (10-question session)

| Provider | Cost/session | Notes |
|----------|-------------|-------|
| Ollama (local) | $0.00 | Development |
| Gemini Flash | ~$0.04 | Free tier available |
| Claude Haiku 4.5 | ~$0.11 | Best code/design eval (recommended) |

Personal use at 1 session/day ≈ $1–3/month with Claude Haiku.

---

## Project Structure

```
devprep/
├── prisma/
│   ├── schema.prisma           # DB schema (devprep schema, Supabase)
│   ├── seed.ts                 # Question bank seeder
│   └── seeds/                  # technical.json, coding.json, system-design.json, behavioral.json
├── messages/
│   ├── en.json                 # English translations
│   └── es.json                 # Spanish translations
└── src/
    ├── app/
    │   ├── [locale]/           # All pages — dashboard, history, session/[id], settings, bookmarks
    │   │   └── */loading.tsx   # Skeleton loading states for every route
    │   └── api/                # API routes — sessions, messages, settings, bookmarks
    ├── components/
    │   ├── session/            # ChatContainer, MessageBubble, CodeEditor, ResultsView
    │   ├── history/            # HistoryFilters, SessionList
    │   ├── bookmarks/          # BookmarksClient
    │   ├── settings/           # SettingsForm
    │   └── ui/                 # Skeleton, shared primitives
    └── lib/
        ├── ai/                 # AIProvider interface + Ollama/Anthropic/Gemini/OpenAI adapters
        ├── questions/          # Smart selector (spaced repetition → bank → AI fallback)
        ├── interaction/        # InteractionManager (input/output abstraction)
        ├── auth.ts             # Auth.js config + PrismaAdapter
        └── db.ts               # Prisma singleton
```

---

## Roadmap

- [x] **Phase 1 — Text Chat MVP** ← done, deployed to Vercel
  - [x] Auth (NextAuth v5 + Google OAuth)
  - [x] 200 curated questions seeded
  - [x] Chat UI with Monaco code editor
  - [x] AI evaluation — 4 providers
  - [x] Session history, bookmarks, dashboard analytics
  - [x] Bilingual EN/ES
  - [x] Obsidian Terminal design system
  - [x] Loading skeletons on every page
  - [ ] Zod validation on AI responses
  - [ ] Smart AI provider routing
- [ ] **Phase 2 — Voice Interaction**
  - [ ] Speech-to-text (Web Speech API → Whisper)
  - [ ] Text-to-speech (Web Speech API → ElevenLabs)
  - [ ] Modality switching mid-session
- [ ] **Phase 3 — Avatar Interviewer**
  - [ ] Animated 2D character (Rive/Lottie)
  - [ ] Lip sync from TTS audio
  - [ ] Emotion/gesture system from AI output

---

## Author

**Juan David Perez Vergara** — Fullstack Developer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/juandpv/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/juandavidperez)
[![Email](https://img.shields.io/badge/Email-D14836?style=flat&logo=gmail&logoColor=white)](mailto:juandavidperezvergara@gmail.com)
