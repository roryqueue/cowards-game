# Phase 36: Replay Review and Tuning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 36-Replay Review and Tuning
**Areas discussed:** Replay Review Scope, Quality Criteria, Tuning and Rerun Policy

---

## Replay Review Scope

| Question | Option | Selected |
| --- | --- | --- |
| Source set | Starter gauntlets, advanced gauntlets, examples, and tournament | ✓ |
| Source set | Tournament only | |
| Source set | Examples only | |
| Per-Strategy coverage | At least one reviewed replay per accepted Advanced Strategy | ✓ |
| Per-Strategy coverage | Only top and bottom Strategies | |
| Per-Strategy coverage | Only review triggered anomalies | |
| Priority | Close, unfavorable, specialist, failure, surprising, and example replays | ✓ |
| Priority | Random sample | |
| Priority | Best wins only | |
| Review method | Browser replay plus Chronicle/evidence summaries | ✓ |
| Review method | Chronicle metrics only | |
| Review method | Manual browser only | |

**User's choice:** Applied recommended defaults from milestone requirements.
**Notes:** Replay review should cover both tactical proof and product presentation quality.

---

## Quality Criteria

| Question | Option | Selected |
| --- | --- | --- |
| Rules realism | Cycle-interleaved scheduling and Cycle-boundary Backstab | ✓ |
| Rules realism | General replay plausibility only | |
| Diversity | Required broad tactical families | ✓ |
| Diversity | Aggregate matchup diversity only | |
| Tuning target | Credible diversity, tactical texture, role clarity | ✓ |
| Tuning target | Maximize champion strength | |
| Tuning target | Equalize all records | |
| Hard blockers | Privacy/rules regressions block acceptance | ✓ |
| Hard blockers | Record as caveats only | |

**User's choice:** Applied recommended defaults.
**Notes:** The phase is a quality gate, not just a bug hunt.

---

## Tuning and Rerun Policy

| Question | Option | Selected |
| --- | --- | --- |
| Tuning record | Issue, old/new hash, provenance, archetype claim, evidence profile | ✓ |
| Tuning record | Short changelog only | |
| Tuning record | Commit message only | |
| Rerun scope | Affected gauntlets/MatchSets plus smoke evidence | ✓ |
| Rerun scope | All gauntlets every time | |
| Rerun scope | Failed matchup only | |
| Tournament changes | Regenerate or invalidate tournament evidence | ✓ |
| Tournament changes | Leave tournament as historical artifact | |
| Local report | Add direct links to tournament, MatchSets, and reviewed replays | ✓ |
| Local report | Keep links in generated JSON only | |

**User's choice:** Applied recommended defaults.
**Notes:** Tuning should preserve deterministic provenance and prevent stale demo evidence.

---

## the agent's Discretion

- Exact replay review checklist format.
- Exact reviewer note structure.
- Exact screenshot or browser evidence artifacts.
- Exact rerun commands.

## Deferred Ideas

- Final browser/privacy/runtime/docs verification belongs to Phase 37.
