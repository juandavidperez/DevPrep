# Research Summary — Analytics Milestone

## Stack

- `chart.js ^4.4` + `react-chartjs-2 ^5.2` — install both; stable pair since 2023
- `date-fns v4` already installed — no new date library needed
- `"use client"` boundary mandatory on every chart file — Chart.js accesses DOM
- `ChartJS.register()` at module scope only — create `src/lib/chartSetup.ts` on day 1
- Prisma `groupBy` works for category aggregation; use JS-side `reduce` on `createdAt.toISOString().slice(0,10)` for day-level trend bucketing (Prisma cannot group by `DATE(DateTime)`)

## Table Stakes Features

- KPI cards with delta badges vs prior period — without delta, cards are decoration
- Score trend line: individual session dots, fixed Y-axis 0–100, clickable dot → `/session/[id]/results`
- Category bar chart ordered highest → lowest with session-count secondary label
- Weak/Strong topics panels: bottom-3 / top-3 with "Practice Again" button
- Time range selector (7d / 30d / all) persisted in URL as `?range=`, uses `router.replace()`
- Per-widget empty states — never blank/broken for zero-session users

## Architecture Pattern

- `src/lib/analytics/queries.ts` — shared aggregation module used by both RSC page and API route; testable in isolation
- RSC page fetches via Prisma directly, passes serialized plain objects as props to `<AnalyticsClient />` — no client fetch on initial load
- Single `GET /api/analytics?range=` endpoint — one auth check, one round trip
- Range change → URL update → RSC re-render (no client-side fetch loop)
- `export const revalidate = 300` on page; `Cache-Control: private, max-age=300` on API route

## Critical Pitfalls (High severity only)

1. **SSR crash** — `"use client"` + `dynamic(..., { ssr: false })` as two-layer defense; no barrel re-exports from server files
2. **Blank canvas, zero errors** — missing Chart.js registrations; create `chartSetup.ts` before any chart component
3. **Prisma null scores + date bucketing** — filter `score: { not: null }` on all queries; use JS reduce for day grouping
4. **Container 0px height** — wrap every chart in `<div className="relative h-64">` + `maintainAspectRatio: false` from the start

## Build Order (recommended)

1. `src/lib/analytics/queries.ts` — Prisma functions + types; no UI dependency
2. `src/app/api/analytics/route.ts` — GET handler; verify with curl before touching UI
3. `src/lib/chartSetup.ts` — all Chart.js registrations; import at top of every chart
4. `src/app/[locale]/analytics/page.tsx` — RSC shell: auth guard, queries call, date serialization, empty state
5. `src/components/analytics/AnalyticsClient.tsx` + `RangeSelector.tsx` — parallel with step 4 using mock data
6. Chart components (`ScoreTrendChart`, `CategoryChart`) — height wrapper + memoized data/options
7. i18n keys — map DB category enums through `useTranslations` before passing to chart labels
8. NAV-01 — wire dashboard "Analíticas" tab to `<Link href="/analytics">` from `@/navigation`

## Key Decisions Made

| Decision | Constraint on Plan |
|----------|--------------------|
| Chart.js / react-chartjs-2 (user-selected) | Registration pattern mandatory; no other chart lib |
| RSC passes props — no client fetch on initial load | All dates must serialize to ISO strings before prop handoff |
| Single `/api/analytics` endpoint | Response shape must satisfy all widgets simultaneously |
| UTC throughout for streak/date bucketing | No timezone inference this milestone; document in code |
| `isDemo: false` on all queries | Demo sessions excluded from all aggregations |
| Weak/strong sourced from `SessionMessage` evaluations | Use `feedback` first 80 chars as label |
