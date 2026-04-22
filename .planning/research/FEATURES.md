# Features Research — Analytics Milestone

## Feature Deep-Dives

### Score Over Time

**Expected UX:** Individual session dots (not smoothed) — users want real scores. Fixed Y-axis 0–100. Tooltip on hover: date, category, difficulty, score. Clicking a dot navigates to `/session/[id]/results` — turns chart into re-review tool.

**Edge cases:**
- 0 sessions → empty state + CTA to `/session/new`
- 1 session → single dot, no line drawn (valid)
- All sessions same day → space by session order, not time
- Range with no sessions → "No sessions in last 7 days, try All time?" prompt

**Paired micro-features:**
- Dashed horizontal reference line at user's overall average
- Category color-coded dots
- Trend badge: "↑ +8 pts vs previous period" (current avg minus prior period avg of equal length)

---

### Category Breakdown

**Expected UX:** Bar chart over radar — radar collapses when categories are missing. Order bars highest → lowest so weakness is immediately visible. Clicking a bar filters score-over-time chart AND weak/strong panel to that category.

**Edge cases:**
- 1 category practiced → single bar, valid
- 1-session category → label "(1 session)" so user knows it's not significant

**Paired micro-features:** Secondary label per bar: "Technical — 72 avg (8 sessions)". Without session counts a 1-session 90 looks like mastery.

---

### Weak / Strong Topics

**Expected UX:** Two panels — "Needs Work" (bottom 3) and "Strongest" (top 3). Each item: question text (~80 chars), category badge, score, difficulty. "Practice Again" button starts a new session pre-filtered to that category + difficulty. For repeated questions, use most recent score.

**Edge cases:**
- Fewer than 3 questions → show what exists, no empty placeholders
- Tie scores → break by most recent

**Paired micro-features:** "Bookmarked" indicator (bookmarks already exist). Delta vs prior period.

---

### Streak / Frequency

**Expected UX:** Current streak (consecutive calendar days), longest streak (personal record), sessions in selected period. For v1: "🔥 5-day streak" card + "12 sessions this month" satisfies the need.

**Critical edge case — timezone:** Streak MUST use user's local timezone, not UTC. Session at 11pm EST stored as 4am UTC breaks the streak. For v1, use UTC consistently and document the decision.

**Paired micro-features:** "X of 30 days practiced" (more honest than streak alone). "3 this week vs 1 last week."

---

### KPI Cards

**Expected UX:** 4 cards: global avg score, total sessions, strongest category, weakest category. **Delta vs previous period is table stakes** — without it, cards are static decoration. "↑ +6 pts vs last 30 days" in green/red. Use JetBrains Mono for numbers (in design system).

**Edge cases:**
- 1 session total → no delta, show "—" or "First session!"
- "All time" filter → hide delta or show cumulative
- Strongest = weakest (only one category) → label clearly
- Score of 0 → show it, never filter out

**Paired micro-features:** Tooltip on delta explaining comparison period. Sparkline (5–7 mini bars) inside avg score card.

---

### Time Range Filter

**Expected UX:** Segmented control (pill buttons), not dropdown — 3 options don't warrant one. Persists in URL as `?range=7d|30d|all`. Use `router.replace()` not `push` (back button goes to prior page, not prior filter). All widgets react simultaneously.

**Edge cases:**
- Invalid URL param → default to 30d silently
- No `range` param on first visit → default to 30d (not 7d — may be empty for new users)
- Range with no data → per-widget empty states, not page-level error

**Paired micro-features:** Session count in the control: "30 days (12 sessions)". Date range label: "Showing Mar 20 – Apr 19, 2026."

---

## Edge Cases Across All Features

| Scenario | Expected behavior |
|----------|-----------------|
| 0 sessions total | Full-page empty state + CTA to `/session/new`. No broken charts. |
| 1 session total | All charts render. No delta. Weak/strong show same question if applicable. |
| No sessions in selected range | Per-widget empty states + filter change suggestion. |
| Only 1 category practiced | 1 bar, strongest = weakest = same. Valid. |
| Score = 0 | Include in all calculations. Never filter out. |
| Timezone mismatch | Use UTC consistently for v1; document decision in code. |

## Highest-Impact Additions Within Scope

1. **Delta badges on KPI cards** — without them cards are decoration
2. **Clickable chart dots → session results** — turns chart into navigation
3. **"Practice Again" on Weak Topics** — closes improvement loop; highest retention value
4. **Timezone-aware streak** — correctness issue, not nice-to-have

## V2 Candidates (not in scope now)

| Feature | Why deferred |
|---------|-------------|
| GitHub-style heatmap calendar | Medium complexity; streak card covers v1 need |
| Per-question improvement trajectory | Needs stable question ID across sessions |
| Difficulty breakdown (Easy/Medium/Hard) | Easy to add; deferred by scope |
| Session duration | `Session` model has no `endedAt` — needs schema change |
| AI-generated insights | Separate LLM call per load; cost + latency risk |
| Goal setting | Adds state complexity; not core to v1 |
| Streak reminder notifications | Needs notification infrastructure |
| Export CSV/PDF | Explicitly out of scope |
| Peer comparison / percentiles | Explicitly out of scope |
