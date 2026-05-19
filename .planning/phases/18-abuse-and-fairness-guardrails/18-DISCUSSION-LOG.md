# Phase 18: Abuse and Fairness Guardrails - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 18-Abuse and Fairness Guardrails
**Areas discussed:** Rate limiting policy, strategy failure penalty, system failure handling, valid competitive result criteria, duplicate active-window policy, public penalty visibility, privacy gate test coverage

---

## Rate Limiting Policy

| Option | Description | Selected |
| --- | --- | --- |
| Per-user create limit with small burst | Limit exhibition creation per signed-in User, allow alpha-friendly burst. | ✓ |
| Per-IP only | Easier but weaker with signed-in identity. | |
| Preset-weighted limits | More nuanced but complex. | |
| You decide | Planner defines simplest practical limit. | |

**User's choice:** Per-user create limit with small burst.
**Notes:** Exact numbers can be chosen in planning/config.

---

## Strategy Failure Penalty

| Option | Description | Selected |
| --- | --- | --- |
| Any runtime strategy violation penalizes affected entrant for affected Match | Timeout, thrown exception, invalid output, forbidden capability, memory/output violations. | ✓ |
| Only repeated failures penalize | Friendlier but harder to explain/game. | |
| Any strategy failure disqualifies whole MatchSet | Strong but too harsh for alpha. | |
| You decide | Planner maps failure taxonomy to penalties. | |

**User's choice:** Penalize affected entrant for affected Match.
**Notes:** Do not automatically disqualify the whole MatchSet.

---

## System Failure Handling

| Option | Description | Selected |
| --- | --- | --- |
| Degrade or invalidate, never player loss | System failures do not count as entrant losses. | ✓ |
| Retry then count as no-result | Needs extra degraded/valid policy. | |
| Retry then fail MatchSet entirely | Clean but harsh. | |
| You decide | Planner chooses retry/degrade mechanics. | |

**User's choice:** Degrade or invalidate, never player loss.
**Notes:** Retries allowed internally, but public scoring must preserve distinction.

---

## Valid Competitive Result Criteria

| Option | Description | Selected |
| --- | --- | --- |
| Strict valid-result gate | Locked entrants, known versions, complete/degraded inputs, privacy gates, no unresolved system failures affecting standings. | ✓ |
| Best-effort publication | More transparent but weaker trust. | |
| All-or-nothing validity | Any degraded Match invalidates whole MatchSet. | |
| You decide | Planner formalizes criteria. | |

**User's choice:** Strict valid-result gate.
**Notes:** Trustworthy while allowing explicit degraded evidence.

---

## Duplicate Active-Window Policy

| Option | Description | Selected |
| --- | --- | --- |
| Block exact same revision set in active duplicate MatchSet | Same creator/preset/revision-id set cannot be queued/running twice. | ✓ |
| Block same revision set for cooldown window | Stronger but annoying for alpha debugging. | |
| Allow duplicates, rely on rate limits | Simpler but spammy. | |
| You decide | Planner chooses active-window semantics. | |

**User's choice:** Block active duplicate MatchSets.
**Notes:** Allow intentional reruns after completion/degradation/failure.

---

## Public Penalty Visibility

| Option | Description | Selected |
| --- | --- | --- |
| Show penalties in standings and Match ledger | Public penalty count/points and per-Match reason category. | ✓ |
| Show only final adjusted score | Cleaner but hides score changes. | |
| Owner-only penalty detail | Safer but weak public fairness. | |
| You decide | Planner chooses visibility policy. | |

**User's choice:** Show penalties publicly.
**Notes:** No private runtime internals.

---

## Privacy Gate Test Coverage

| Option | Description | Selected |
| --- | --- | --- |
| Golden public-result leak tests | Assert public DTOs omit source/memory/objectives/debug/private errors. | ✓ |
| Reuse replay privacy tests only | Lower effort but misses new result DTOs. | |
| Manual review only | Not enough for trust milestone. | |
| You decide | Planner defines test matrix. | |

**User's choice:** Golden public-result leak tests.
**Notes:** Cover MatchSet/result/replay DTOs.

## the agent's Discretion

- Exact rate-limit numbers.
- Retry counts.
- Penalty point value.
- Public reason enum names.
- Test fixture construction.

## Deferred Ideas

- Ranked ladder anti-abuse systems.
- Moderation/admin tooling.
- IP/device fingerprinting.
- Public operational dashboards.
