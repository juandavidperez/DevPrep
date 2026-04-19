# DevPrep — Analytics Milestone

## What This Is

DevPrep is an AI-powered mock interview simulator for software developers. Users practice behavioral, technical, coding, and system design questions via text or voice, get AI-evaluated scores per answer, and build toward interview readiness. This milestone adds a dedicated Analytics page so users can track progress over time.

## Core Value

Users must be able to see if they're actually improving — score trends and category breakdowns that make "keep practicing" feel worth it.

## Requirements

### Validated

- ✓ Text-based chat interview with AI evaluation (score 0–100, criteria breakdown, feedback, model answer) — Phase 1
- ✓ Voice interaction (STT/TTS) alongside text — Phase 2
- ✓ Session history with filters and pagination (`/history`) — Phase 1
- ✓ Bookmarks + spaced repetition queue (`/bookmarks`) — Phase 1
- ✓ Dashboard with stats + recent sessions (`/dashboard`) — Phase 1
- ✓ 320-question bank (EN + ES, 4 categories, 3 difficulty levels) — Phase 1
- ✓ i18n (en/es), Google OAuth, user settings — Phase 1
- ✓ Guest demo mode (no login required) — Phase 2

### Active

- [ ] **NAV-01**: Tab "Analíticas" in dashboard navigates to `/analytics` route
- [ ] **CHART-01**: Line chart — score promedio por sesión en el tiempo (filtrable 7d / 30d / todo)
- [ ] **CHART-02**: Category breakdown — score promedio por categoría (Technical, Coding, Behavioral, System Design) as bar or radar chart
- [ ] **CARD-01**: KPI cards — score promedio global, sesiones totales, categoría más fuerte, categoría más débil
- [ ] **WEAK-01**: Weak/strong topics surface — top 3 preguntas con score más bajo y más alto
- [ ] **STREAK-01**: Streak and frequency — días consecutivos de práctica + sesiones en período seleccionado
- [ ] **FILTER-01**: Time range selector — 7 días / 30 días / todo el historial, persiste en la URL
- [ ] **API-01**: `/api/analytics` endpoint that aggregates session + message data from Supabase for current user
- [ ] **I18N-01**: Analytics page and all labels translated in `messages/en.json` and `messages/es.json`

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
