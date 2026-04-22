---
phase: 1
slug: data-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test -- src/lib/analytics.test.ts` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- src/lib/analytics.test.ts`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | API-02 | — | N/A | unit | `npm run test -- src/types/analytics.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | API-01 | T-1-01 | Only current user data | unit | `npm run test -- src/lib/analytics.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | API-01 | T-1-02 | 401 on unauth | integration | `npm run test -- src/app/api/analytics/route.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/analytics.test.ts` — integration test for Prisma aggregation logic
- [ ] `src/app/api/analytics/route.test.ts` — API route mock test (auth + range validation)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `curl` smoke test | API-01 | End-to-end check | Run dev server, login, capture cookie, run `curl -b cookies.txt http://localhost:3000/api/analytics?range=7d` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
