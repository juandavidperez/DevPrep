# Pitfalls Research — Analytics Milestone

## P1: Chart.js SSR — "window is not defined" [High]

**Warning signs:** `ReferenceError: window is not defined` in Chart.js internals. Fails on `next build` but passes `next dev`. Stack trace points to `Chart.register(...)` or `defaults` at module scope.

**Prevention:** Two-layer defense — `"use client"` alone is not sufficient:
1. Mark every chart component `"use client"`
2. Also wrap with `dynamic(() => import("react-chartjs-2").then(m => m.Line), { ssr: false })`
3. Never import Chart.js in any file that could be evaluated server-side (no barrel re-exports from layout/page)

**Phase:** Phase 2 — first chart component created.

---

## P2: Responsive Container — chart collapses to 0px height [High]

**Warning signs:** Chart canvas present in DOM but invisible. `height` prop on `<Line>` is ignored.

**Prevention:** Wrap every chart in `<div className="relative h-64">` (explicit height). Set `options.maintainAspectRatio: false`. Chart.js reads parent container height — without explicit height the flex/grid parent resolves to 0.

**Phase:** Phase 2 — apply wrapper pattern to every chart card from the start.

---

## P3: Missing Chart.js Registrations — blank canvas, no error [High]

**Warning signs:** Blank canvas, zero console errors. Common offender for radar: `RadialLinearScale` not registered.

**Prevention:** Create `src/lib/chartSetup.ts` (with `"use client"`) as the first Phase 2 task. Register: `CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Filler, Tooltip, Legend`. Import at top of every chart component.

**Phase:** Phase 2 — day 1, before writing any chart component.

---

## P4: Prisma groupBy — null scores + date bucketing [High]

**Warning signs:** API returns `_avg: { score: null }` for some groups. Chart shows gaps or `NaN`. Date bucketing returns one entry per session (not per day).

**Prevention:**
- Filter `score: { not: null }` before aggregation, or coerce `_avg.score ?? null` and skip null data points (never render as 0)
- Prisma `groupBy` on `DateTime` groups by exact timestamp — cannot group by "day". Use JS-side aggregation:

```ts
const byDay = sessions.reduce((acc, s) => {
  const day = s.createdAt.toISOString().slice(0, 10);
  if (!acc[day]) acc[day] = { total: 0, count: 0 };
  acc[day].total += s.score ?? 0;
  acc[day].count++;
  return acc;
}, {});
```

**Phase:** Phase 1 (API route design) — much harder to retrofit.

---

## P5: UTC vs Local Time — off-by-one day near midnight [Medium]

**Warning signs:** Sessions at 11pm local appear in the "wrong" day bucket. Streak count off by 1 near midnight.

**Prevention:** Use UTC throughout for MVP. Define "a day" as a UTC calendar day for streak calculation. Document explicitly in a code comment. Do not attempt to infer browser timezone this milestone.

**Phase:** Phase 1 (API) — note the decision in a comment.

---

## P6: Empty State — new user crash or broken UI [Medium]

**Warning signs:** New user gets blank canvas or `TypeError: Cannot read properties of undefined`.

**Prevention:**
- API always returns a typed shape even when empty: `{ trend: [], categoryBreakdown: {}, kpis: { avgScore: null, totalSessions: 0, strongestCategory: null, weakestCategory: null }, weakTopics: [], strongTopics: [] }`
- Every chart component: `if (data.length === 0) return <EmptyState />` before rendering charts
- KPI cards: `avgScore !== null ? avgScore.toFixed(1) : "—"`
- Empty state includes CTA to `/session/new`

**Phase:** Phase 1 (API shape) + Phase 2 (UI guard on every chart).

---

## P7: i18n — chart labels and number formatting [Medium]

**Warning signs:** Spanish-locale user sees "Technical" instead of "Técnico". Score tooltip shows `85.3` instead of `85,3`.

**Prevention:**
- Map DB enum values through `useTranslations("Analytics")` before passing to `data.labels`
- Tooltip number formatting via Chart.js `callbacks.label` using `Intl.NumberFormat(locale, ...)`
- Date labels formatted via `date-fns/format` with `es` / `enUS` locale objects (already in stack)
- `locale` available via `useLocale()` on the client

**Phase:** Phase 2 — establish pattern on first chart; don't retrofit later.

---

## P8: Chart Flicker on Re-renders [Low]

**Warning signs:** Chart "flashes" or re-draws from scratch when time range selector hover state changes.

**Prevention:** `useMemo` on every `data` object and `options` object. Chart components accept primitive props (string arrays + number arrays), not raw session objects.

**Phase:** Phase 2 — apply `useMemo` as charts are created.

---

## P9: Non-serializable Date Objects — Server to Client [Low]

**Warning signs:** `Error serializing ... returned from analytics/page.tsx` — only fails in production build.

**Prevention:** `/api/analytics` returning JSON handles this automatically — `JSON.stringify` converts `Date` to strings. If RSC directly queries Prisma and passes as props, serialize all dates: `.toISOString()`.

**Phase:** Phase 1 (API route design prevents this by design).

---

## Summary Table

| Pitfall | Severity | Phase to Address |
|---------|----------|-----------------|
| P1: Chart.js SSR `window` crash | High | Phase 2 — first chart component |
| P2: Container height collapse | High | Phase 2 — every chart card |
| P3: Missing registrations, blank canvas | High | Phase 2 — `chartSetup.ts` day 1 |
| P4: Prisma groupBy null + date bucketing | High | Phase 1 — API design |
| P5: UTC vs local time, midnight boundary | Medium | Phase 1 — document decision |
| P6: Empty state crash / broken UI | Medium | Phase 1 (shape) + Phase 2 (guard) |
| P7: i18n labels/number formatting | Medium | Phase 2 — first chart |
| P8: Chart flicker on re-render | Low | Phase 2 — `useMemo` |
| P9: Date serialization Server→Client | Low | Phase 1 — API route prevents it |
