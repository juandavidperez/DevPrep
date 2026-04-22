# Phase 1: Data Foundation — Research

**Date:** 2026-04-20
**Phase:** 01-data-foundation
**Goal:** Establish the data layer for analytics (Prisma queries + API contract).

## Technical Overview

The analytics layer must aggregate `Session` and `SessionMessage` data for a specific user. The primary challenge is transforming transactional records into time-series data (`trend`) and categorical insights (`topics`, `byCategory`) efficiently.

## Core Findings

### 1. Prisma Aggregation Patterns
Prisma's `groupBy` API is limited when it comes to date truncation (e.g., grouping by day). To avoid raw SQL and maintain cross-database compatibility:
- **Strategy:** Fetch raw records with `findMany` using a focused `select` (to minimize memory overhead) and perform the grouping/reduction in TypeScript.
- **Why:** Grouping 30-90 days of session data in Node.js is extremely fast (< 5ms) and avoids the complexity of database-specific date functions (Postgres `date_trunc` vs MySQL `DATE()`).
- **Optimization:** Always include `userId` and `isDemo: false` in the `where` clause to utilize indexes.

### 2. Efficient Streak Algorithm
For user-level streaks, the most maintainable approach is the "walking" algorithm:
1. Fetch all unique `completedAt` dates for the user (UTC).
2. Sort dates in descending order.
3. Check the gap between `today` and the most recent date. If `gap > 1 day`, streak is 0.
4. Iterate through the sorted dates: as long as `date[i] - date[i+1] === 1 day`, increment the streak counter.
5. Exit loop on the first gap > 1 day.

### 3. Topics Mining (SessionMessage.criteria)
The `criteria` field in `SessionMessage` is a JSON blob. Since we aren't using a summary table yet, we need to:
1. Fetch all messages belonging to the user's sessions in the selected range.
2. Filter for messages where `score` is not null (evaluations).
3. Aggregate the `criteria` values by key (e.g., `correctness`, `depth`).
4. Calculate the average for each key and filter into `weak` (< 60) and `strong` (>= 75).

## Validation Architecture

To verify Phase 1 without a UI, we will use a combination of automated and manual checks:
1. **Prisma Integration Test:** A dedicated script to verify the `getAnalyticsData` logic against mock data in the dev DB.
2. **API Endpoint Test:** Using `curl` or a test script to check the JSON response structure and status codes (200, 400, 401).
3. **Requirement Mapping:** Verify that `API-01` (authenticated range support) and `API-02` (complete response shape) are satisfied.

## Implementation Roadmap (Internal)

1. Create `src/types/analytics.ts` with the validated interfaces.
2. Implement `src/lib/analytics.ts` with the core aggregation logic.
3. Create `src/app/api/analytics/route.ts` as the public interface.
4. Verify with `scripts/test-analytics.ts`.

## References
- `prisma/schema.prisma`
- `src/lib/db.ts`
- `src/app/api/sessions/route.ts` (Auth pattern)
- [Prisma GroupBy Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/aggregation-grouping-summarizing#group-by)
