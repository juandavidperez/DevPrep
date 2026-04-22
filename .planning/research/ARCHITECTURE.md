# Architecture Research — Analytics Milestone

## Component Boundaries

```
src/app/[locale]/analytics/page.tsx  (RSC)
    │
    ├─► src/lib/analytics/queries.ts  (shared aggregation module)
    │         └─► prisma → Supabase devprep schema
    │
    └─► /api/analytics?range=7d       (same queries.ts, called by API route)

page.tsx  →  <AnalyticsClient data={...} />   "use client"
                ├── KpiCards
                ├── ScoreTrendChart (Line)
                ├── CategoryChart (Bar or Radar)
                ├── WeakStrongList
                └── RangeSelector (updates ?range= URL param)
```

## API Design Decision

**Single endpoint: `GET /api/analytics?range=7d|30d|all`**

Page always needs all metrics simultaneously — one auth check, one round trip. Matches existing `/api/sessions` pattern. Separate-per-metric would mean 5-6 `auth()` calls with zero benefit at this scale.

## Data Flow

1. User hits `/[locale]/analytics?range=7d` → RSC runs server-side
2. `auth()` → redirect to signin if unauthenticated
3. `Promise.all([getScoreOverTime(), getScoreByCategory(), getWeakStrong()])` via `queries.ts`
4. Serialize to plain JS objects → pass as props to `<AnalyticsClient />`
5. Chart.js renders client-side from props — **no client fetch needed for initial load**
6. Range change → `RangeSelector` updates `?range=` URL → Next.js re-renders RSC → new props

## Prisma Query Patterns

**Score over time (line chart) — requires `$queryRaw` because Prisma `groupBy` cannot group on `DATE(DateTime)`:**
```sql
SELECT DATE("createdAt") AS date, AVG(score)::float AS avg_score, COUNT(*)::int AS session_count
FROM devprep."Session"
WHERE "userId" = ${userId} AND "isDemo" = false AND score IS NOT NULL
  AND "createdAt" >= ${rangeStart}
GROUP BY DATE("createdAt") ORDER BY date ASC
```

**Score by category (bar chart) — native `groupBy` works:**
```typescript
prisma.session.groupBy({
  by: ["category"],
  where: { userId, isDemo: false, score: { not: null }, createdAt: { gte: rangeStart } },
  _avg: { score: true },
  _count: { id: true },
})
```

**Streak — computed in-memory** from date array returned by query 1 (max 365 entries, trivial). Walk sorted dates descending; count consecutive days ending today.

**Weak/strong questions** — `SessionMessage` where `messageType: "evaluation"`, scoped through `session: { userId, isDemo: false }`. Use `feedback` field (first ~80 chars) as label. `questionText` on evaluation rows is a future DDL improvement.

## Server vs Client Data Fetching

RSC fetches via Prisma directly — not via `fetch()` to its own API route. Chart.js being `"use client"` does NOT require data from `fetch()`. RSC passes pre-aggregated plain objects as props to a `"use client"` child. Standard Next.js 15 App Router pattern, consistent with `/dashboard`, `/history`, `/bookmarks`.

`/api/analytics` is still built (API-01 requirement) calling the same `queries.ts`. Serves future dashboard widgets or client-side re-fetches.

## Caching Strategy

```typescript
// page.tsx
export const revalidate = 300; // 5-minute stale budget
```

API route response headers:
```
Cache-Control: private, max-age=300, stale-while-revalidate=600
```

5 minutes acceptable lag — sessions complete in 10–15 min. `no-store` would hit Supabase pooler on every visit unnecessarily.

## Build Order

1. **`src/lib/analytics/queries.ts`** — Prisma query functions + TypeScript types. No UI dependency. Testable in isolation.
2. **`src/app/api/analytics/route.ts`** — GET handler calling queries.ts. Verify with curl before touching UI.
3. **`src/app/[locale]/analytics/page.tsx`** — RSC shell: auth guard, direct queries.ts call, passes `AnalyticsData` props.
4. **`src/components/analytics/AnalyticsClient.tsx`** + **`RangeSelector.tsx`** — install chart.js + react-chartjs-2, render from props. Parallel.
5. **i18n keys** — `messages/en.json` + `messages/es.json` Analytics namespace.
6. **NAV-01** — update dashboard "Analíticas" tab to `<Link href="/analytics">` from `@/navigation`.
