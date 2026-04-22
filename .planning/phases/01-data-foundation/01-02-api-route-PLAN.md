---
wave: 2
depends_on:
  - 01-01
files_modified:
  - src/app/api/analytics/route.ts
  - src/app/api/analytics/route.test.ts
autonomous: true
requirements:
  - API-01
  - API-02
---

# Plan 01-02: API Route Implementation

Expose the analytics data via an authenticated endpoint.

## Tasks

<task id="1-02-01" read_first="src/app/api/sessions/route.ts">
<action>
Create `src/app/api/analytics/route.ts`.
1. Use `auth()` to verify current user.
2. Extract `range` from search params.
3. Validate `range` against `["7d", "30d", "all"]`. Return 400 if invalid.
4. Call `getAnalyticsData(userId, range)`.
5. Return `NextResponse.json(data)`.
</action>
<acceptance_criteria>
- `src/app/api/analytics/route.ts` exists.
- Handler returns 401 if unauthenticated.
- Handler returns 400 with "Invalid range" if `?range=90d` is passed.
- Handler returns 200 with typed JSON on success.
</acceptance_criteria>
</task>

<task id="1-02-02">
<action>
Create `src/app/api/analytics/route.test.ts`.
Mock `auth()` and `src/lib/analytics.ts` to verify:
- Unauthenticated request behavior.
- Parameter validation.
- Successful delegation to the library.
</action>
<acceptance_criteria>
- `src/app/api/analytics/route.test.ts` exists.
- `npx vitest run src/app/api/analytics/route.test.ts` passes.
</acceptance_criteria>
</task>

## Verification

### Automated
- `npx vitest run src/app/api/analytics/route.test.ts`

### must_haves
- [ ] Authentication requirement is strictly enforced.
- [ ] Invalid `range` values are rejected with 400.
- [ ] The full JSON response structure is returned.
