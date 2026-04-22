# Stack Research — Analytics Milestone

## Recommended Additions

| Package | Version | Why |
|---------|---------|-----|
| `chart.js` | `^4.4.x` | Peer dep of react-chartjs-2; v4 stable with tree-shaking |
| `react-chartjs-2` | `^5.2.x` | React wrapper targeting Chart.js v4 + React 18/19 |

```bash
npm install chart.js@^4.4 react-chartjs-2@^5.2
```

**date-fns v4 already installed** — no additional date library needed.

## Chart.js + Next.js 15 App Router Integration

Chart.js writes to a canvas DOM node — no SSR path. In App Router, components default to Server Components. Chart.js will throw `ReferenceError: window is not defined` on the server.

**Required pattern:** Every file importing from `chart.js` or `react-chartjs-2` must declare `"use client"`.

**Do NOT use `dynamic(() => import(...), { ssr: false })`** — escape hatch for uncontrolled third-party components. Since you own the chart wrappers, `"use client"` is the right boundary.

**Recommended component boundary:**
```
/analytics/page.tsx           ← Server Component: auth check, Prisma fetch, pass serialized data
  └─ AnalyticsDashboard.tsx   ← "use client": receives data as props, renders everything
       ├─ ScoreTrendChart.tsx  ← "use client"
       └─ CategoryChart.tsx   ← "use client"
```

**Registration pattern** (module-level, outside component — registering inside causes re-registration per render):
```tsx
"use client";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
```
For bar: add `BarElement`. For radar: `RadialLinearScale, Filler`.

## Date Handling

`date-fns v4` already installed. Use directly:
```ts
import { subDays, startOfDay, format } from "date-fns";
const since = startOfDay(subDays(new Date(), 7)); // 7d filter
```

## Prisma Aggregation Patterns

Prisma 6.x has identical `groupBy` + `_avg` / `_count` syntax to Prisma 5.x — no breaking changes.

**Average score by category:**
```ts
const byCategory = await prisma.session.groupBy({
  by: ["category"],
  where: { userId: session.user.id, createdAt: { gte: since }, score: { not: null } },
  _avg: { score: true },
  _count: { id: true },
});
```

**Trend line:** Use `findMany` with `select: { score, createdAt, category }` + `orderBy: { createdAt: "asc" }`. Session.score is already aggregated at session level.

**Streak calculation:** Prisma has no `DATE_TRUNC`. Fetch all `createdAt` values, compute consecutive days in TypeScript using `format(date, "yyyy-MM-dd")` to dedupe and count runs. Simpler and testable vs `$queryRaw`.

## API Route Pattern

```ts
// src/app/api/analytics/route.ts
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const range = new URL(request.url).searchParams.get("range"); // "7d" | "30d" | "all"
  const since = range === "7d" ? startOfDay(subDays(new Date(), 7))
              : range === "30d" ? startOfDay(subDays(new Date(), 30))
              : undefined;

  const [sessions, byCategory] = await Promise.all([
    prisma.session.findMany({
      where: { userId: session.user.id, createdAt: { gte: since } },
      select: { score: true, createdAt: true, category: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.session.groupBy({
      by: ["category"],
      where: { userId: session.user.id, createdAt: { gte: since }, score: { not: null } },
      _avg: { score: true },
      _count: { id: true }
    }),
  ]);

  return NextResponse.json({ sessions, byCategory });
}
```

## What NOT to Use

| Rejected | Why |
|----------|-----|
| `dynamic(() => import, { ssr: false })` | Unnecessary when you own the component; `"use client"` is correct |
| `ChartJS.register()` inside component | Re-registers per render — module scope only |
| `recharts` / `@nivo/*` / `victory` | User selected Chart.js |
| `dayjs` or other date libs | date-fns v4 already present |
| `$queryRaw` for groupBy | Typed `groupBy` sufficient; raw SQL loses type safety |
| Client-side Prisma calls | All DB access stays server-side |

## Confidence

| Area | Level | Reason |
|------|-------|--------|
| react-chartjs-2 v5 + Chart.js v4 | HIGH | Stable documented pair since 2023 |
| `"use client"` requirement | HIGH | DOM dependency is architectural |
| Registration at module scope | HIGH | Required by Chart.js v4 design |
| Prisma 6.x `groupBy` + `_avg` | HIGH | API stable from Prisma 5→6 |
| date-fns v4 already available | HIGH | Confirmed in existing STACK.md |
| Streak in TypeScript (not SQL) | MEDIUM | Simpler but requires careful deduplication |
