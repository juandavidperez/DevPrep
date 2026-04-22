# DevPrep — Analytics Milestone

## What This Is

DevPrep is an AI-powered mock interview simulator for software developers. Users practice behavioral, technical, coding, and system design questions via text or voice, get AI-evaluated scores per answer, and build toward interview readiness. This milestone adds a dedicated Analytics page so users can track progress over time.

## Core Value

Users must be able to see if they're actually improving — score trends and category breakdowns that make "keep practicing" feel worth it.

## Requirements

### Validated

- ✓ Text-based chat interview with AI evaluation — Phase 1
- ✓ Voice interaction (STT/TTS) alongside text — Phase 2
- ✓ Session history with filters and pagination — Phase 1
- ✓ Bookmarks + spaced repetition queue — Phase 1
- ✓ Dashboard with stats + recent sessions — Phase 1
- ✓ 320-question bank (EN + ES) — Phase 1
- ✓ i18n (en/es), Google OAuth, user settings — Phase 1
- ✓ Guest demo mode — Phase 2
- ✓ **Analytics Dashboard** (KPIs, Charts, Topics, Streak) — v1.1 (Phase 6)
- ✓ **Shared Analytics Foundation** (Consolidated stats logic) — v1.1 (UAT)
- ✓ **Auto-bookmarking** (Spaced repetition for < 70 score) — v1.1 (UAT)

### Active

- [ ] *No active requirements — Milestone 1.1 Complete*

### Out of Scope

- Comparar con otros usuarios (leaderboard) — privacidad, complejidad; v2 if demand emerges
- Predicciones / ML sobre desempeño futuro — fuera del alcance de este milestone
- Export de datos (CSV, PDF) — nice to have, no prioritario
- Analytics para sesiones demo (sin auth) — sin usuario = sin historial persistente

## Context

- **Existing dashboard:** `src/app/[locale]/dashboard/` has a tab UI with "General" and "Analíticas" — the Analíticas tab click handler exists but the route/page does not
- **Data available:** `Session` has `score`, `category`, `difficulty`, `language`, `createdAt`; `SessionMessage` has `score`, `category`, `questionText`; both in Supabase `devprep` schema
- **Chart library decision:** Chart.js / react-chartjs-2 (user selected)
- **Route:** `/[locale]/analytics` — follows existing pattern (`src/app/[locale]/analytics/page.tsx`)
- **Auth:** Page must be authenticated-only (redirect to signin if no session), same as dashboard
- **i18n:** All routes under `[locale]/`, use `next-intl` server + client patterns already established

## Constraints

- **Tech Stack**: Next.js 15 App Router, Prisma + Supabase (`devprep` schema), next-intl v4, Auth.js v5 — no deviation
- **DB migrations**: `prisma migrate dev` hangs — use Supabase MCP (`apply_migration`) for any DDL, then `npx prisma generate`
- **Charts**: react-chartjs-2 + chart.js — install if not already present
- **Design system**: "Obsidian Terminal" — `--background: #131313`, `--primary: #d2bbff`, glassmorphism, no 1px borders, `rounded-xl` cards, Inter + JetBrains Mono
- **Navigation**: Use `Link`/`useRouter` from `@/navigation` (not next/link) for locale-aware routing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dedicated `/analytics` route (not tab-within-dashboard) | Cleaner URL, bookmarkable, matches existing page pattern | — Pending |
| Chart.js / react-chartjs-2 | User preference; widely used, good React integration | — Pending |
| Server-side data aggregation via `/api/analytics` | Keep heavy Prisma queries off client; consistent with existing API pattern | — Pending |
| No analytics for demo sessions | Demo sessions aren't persisted per user — no meaningful data to aggregate | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-19 after initialization*
