---
wave: 1
depends_on: []
files_modified:
  - src/types/analytics.ts
  - src/lib/analytics.ts
  - src/lib/analytics.test.ts
autonomous: true
requirements:
  - API-01
  - API-02
---

# Plan 01-01: Data Layer Foundation

Implement the core analytics logic and TypeScript contract.

## Tasks

<task id="1-01-01" read_first="src/types/session.ts">
<action>
Create `src/types/analytics.ts` with the exact contract from `01-CONTEXT.md`.
Include `AnalyticsRange` ("7d" | "30d" | "all") and `AnalyticsData` interface.
</action>
<acceptance_criteria>
- `src/types/analytics.ts` exists.
- File contains `export type AnalyticsRange`.
- File contains `export interface AnalyticsData` with `overview`, `trend`, `topics`, and `byCategory`.
</acceptance_criteria>
</task>

<task id="1-01-02" read_first="src/lib/db.ts">
<action>
Create `src/lib/analytics.ts`.
Implement `getAnalyticsData(userId: string, range: AnalyticsRange)`.
Queries:
1. Fetch `Session` records where `userId` matches, `isDemo: false`, and `createdAt` is within the range.
2. Calculate `overview` (totals, avg score from completed sessions).
3. Group `trend` by day (UTC).
4. Aggregate `byCategory` avg scores and completed count.
5. Fetch `SessionMessage` with scores and aggregate `criteria` into `weak` (< 60) and `strong` (>= 75) topics.
6. Implement walking streak logic based on `Session.completedAt` unique UTC dates.
</action>
<acceptance_criteria>
- `src/lib/analytics.ts` exists.
- Exports `getAnalyticsData`.
- Logic filters `isDemo: false`.
- Streak algorithm follows "walking" pattern from research.
</acceptance_criteria>
</task>

<task id="1-01-03">
<action>
Create `src/lib/analytics.test.ts`.
Add Vitest unit tests for `getAnalyticsData` logic. Mock Prisma to return edge cases:
- User with 0 sessions.
- User with 1 session today.
- User with 3-day streak.
- User with mixed weak/strong topics.
</action>
<acceptance_criteria>
- `src/lib/analytics.test.ts` exists.
- `npx vitest run src/lib/analytics.test.ts` passes.
</acceptance_criteria>
</task>

## Verification

### Automated
- `npx vitest run src/lib/analytics.test.ts`

### must_haves
- [ ] Correct filtering of demo sessions.
- [ ] Streak calculation correctly handles UTC boundaries and 1-day gap.
- [ ] JSON response keys match the contract 100%.
