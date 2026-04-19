# Technology Stack

**Analysis Date:** 2026-04-19

## Languages

**Primary:**
- TypeScript 5.x - All application code in `src/`
- TSX - React component files throughout `src/app/` and `src/components/`

**Secondary:**
- JSON - Seed data in `prisma/seeds/*.json`, translations in `messages/*.json`

## Runtime

**Environment:**
- Node.js (LTS) - Server-side rendering and API routes

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js ^16.2.1 - Full-stack React framework (App Router, RSC, API routes)
- React 19.0.0 - UI library
- next-intl ^4.8.3 - i18n with `localePrefix: 'always'`, locales `en` and `es`

**Auth:**
- next-auth ^5.0.0-beta.30 (Auth.js v5) - Authentication with JWT session strategy
- @auth/prisma-adapter ^2.11.1 - Prisma adapter for Auth.js

**ORM:**
- Prisma ~6.2.1 - ORM with `multiSchema` preview feature; schema isolated to `devprep` schema in Supabase

**Testing:**
- Vitest ^4.1.2 - Test runner (config at `vitest.config.ts`)
- @testing-library/react ^16.3.2 - React component testing
- @testing-library/user-event ^14.6.1 - User interaction simulation
- jsdom ^29.0.1 - Browser environment for tests

**Build/Dev:**
- TypeScript ^5 - Type checking; config in `tsconfig.json`
- ESLint ^9 + eslint-config-next ^15.5.14 - Linting; config in `eslint.config.*`
- Husky ^9.1.7 + lint-staged ^16.4.0 - Pre-commit hooks (auto-fix ESLint on `*.ts` and `*.tsx`)
- tsx ^4.19.2 - TypeScript script runner (used for `prisma/seed.ts` and `scripts/swap-test.ts`)
- autoprefixer ^10.4.27 + postcss ^8 - CSS processing

**Styling:**
- Tailwind CSS ^3.4.1 - Utility-first CSS; config in `tailwind.config.ts`
- tailwind-merge latest - Conditional class merging
- clsx latest - Conditional className utility

## Key Dependencies

**Critical:**
- zod ^4.3.6 - Runtime schema validation for AI response parsing (Zod-validated structured JSON from AI)
- @anthropic-ai/sdk ^0.80.0 - Anthropic Claude API client (primary production AI)
- @google/generative-ai ^0.24.1 - Gemini API client (technical questions in smart routing)
- openai ^6.33.0 - OpenAI client (behavioral questions, Whisper STT, optional TTS)
- @prisma/client ~6.2.1 - Database ORM client

**UI:**
- @monaco-editor/react ^4.7.0 - In-browser code editor for coding interview questions
- lucide-react latest - Icon library
- date-fns ^4.1.0 - Date formatting for session history and results

**Auth/Security:**
- jose ^6.2.2 - JWT utilities

## Configuration

**Environment:**
- Copy `.env.example` to `.env` — required before running dev
- Key required vars: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- AI selection: `AI_PROVIDER` (`ollama` | `anthropic` | `gemini` | `openai`), `AI_ROUTING` (`single` | `smart`)
- Speech: `STT_PROVIDER` (`whisper-local` | `whisper-api`), `TTS_PROVIDER` (`kokoro` | `openai` | `elevenlabs`)

**Build:**
- `next.config.ts` - Next.js config; wraps with `createNextIntlPlugin()` from `next-intl`
- `tsconfig.json` - Strict TypeScript; path alias `@/*` → `src/*`; target ES2017
- `tailwind.config.ts` - Tailwind configuration
- `postcss.config.*` - PostCSS with autoprefixer
- `prisma/schema.prisma` - Database schema with `multiSchema` preview feature

## Platform Requirements

**Development:**
- Node.js LTS
- npm
- Ollama running locally at `http://localhost:11434` (optional, for $0 AI dev)
- Docker for local speech services (optional):
  - faster-whisper-server at port 8000 (STT)
  - Kokoro FastAPI at port 8880 (TTS)

**Production:**
- PostgreSQL via Supabase (transaction pooler port 6543)
- Node.js server running `next start`
- Anthropic API key required (Haiku 4.5 for demos and coding/system_design questions)
- `npm run build` runs `prisma generate && next build`

---

*Stack analysis: 2026-04-19*
