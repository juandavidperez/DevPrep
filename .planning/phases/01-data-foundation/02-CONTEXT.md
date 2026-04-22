# Context 02: Page Shell & Chart Infrastructure

Capture decisions for building the analytics dashboard foundation.

## Decisions

### 1. Dedicated Route
- **Path**: `/[locale]/analytics/page.tsx`
- **Rationale**: Moving away from the dashboard tab placeholder to a dedicated route allows for better deep-linking, cleaner bundle separation, and easier maintenance of complex chart logic.

### 2. Visualization Library
- **Library**: `recharts`
- **Rationale**: High performance, React-native, better tree-shaking, and easier integration with TypeScript compared to Chart.js wrappers.
- **Action**: Install `recharts`.

### 3. State Management (Time Range)
- **Mechanism**: URL search parameters (`?range=7d|30d|all`).
- **Rationale**: Persists selection across refreshes, supports browser back/forward, and allows the RSC to read the value for the initial data fetch without hydration mismatches.

### 4. Component Architecture
- **Server Component (Page)**:
    - Verifies auth.
    - Reads `range` from `searchParams`.
    - Fetches data using `getAnalyticsData`.
    - Wraps client components in `Suspense`.
- **Client Component (AnalyticsClient)**:
    - Receives serialized data.
    - Manages local UI states (if any).
    - Renders the `RangeSelector` and the individual widget containers.
- **Loading UI**:
    - `loading.tsx` or inline `Skeleton` components for individual tiles.

### 5. Reusable Components
- `RangeSelector`: Component to switch between 7d/30d/all via URL navigation (`useRouter`, `usePathname`).
- `AnalyticsHeader`: Title and range selector.
- `ChartContainer`: Reusable wrapper with consistent styling and empty states.

## Constraints
- **Auth**: Must redirect to `/auth/signin` if not authenticated.
- **Empty States**: Must use the designed empty state (`EMPTY-01`) if no sessions exist.
- **SSR**: Page must be SSR-safe despite using interactive charts.

## Decisions Log
- [2026-04-20]: Recharts selected over Chart.js.
- [2026-04-20]: Dedicated `/analytics` route confirmed.
- [2026-04-20]: Suspense + Skeletons selected for UX consistency.
