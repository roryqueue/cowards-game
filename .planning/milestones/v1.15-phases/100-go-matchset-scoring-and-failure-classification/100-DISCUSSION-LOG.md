# Phase 100: Go MatchSet Scoring and Failure Classification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 100-Go MatchSet Scoring and Failure Classification
**Areas discussed:** Go scoring ownership, Parity scope, Status refresh, Failure classification, Public safety

---

## Go Scoring Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy TypeScript scoring | Let public reads or TypeScript service refresh scoring during migration. | |
| Go proactive scoring owner | Go refreshes MatchSet scoring/status after terminal Match updates; TypeScript is parity/rollback/test only. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Scoring ownership follows Phase 99 completion ownership.

---

## Parity Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Redesign scoring | Use Go migration to improve ranking or point rules. | |
| Port existing semantics | Match TypeScript `scoreMatchSet` and `refreshMatchSetStatus` behavior with parity fixtures. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** This phase is an ownership migration, not a competition-rules redesign.

---

## Status Refresh

| Option | Description | Selected |
|--------|-------------|----------|
| Read-time refresh | Refresh status/scoring when public MatchSet reads occur. | |
| Completion-time refresh | Update `match_sets.status`, `scoring`, `degraded`, and `completed_at` after terminal Match completion. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Public reads should not depend on TypeScript lazy refresh.

---

## Failure Classification

| Option | Description | Selected |
|--------|-------------|----------|
| Collapse failures into losses | Treat system failures or runtime-service failures as player losses. | |
| Preserve strategy/system split | Strategy failures get penalties where rules require; system failures degrade/fail without false player losses. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Runtime service infrastructure faults are system failures, not Strategy/player losses.

---

## Public Safety

| Option | Description | Selected |
|--------|-------------|----------|
| Include debug-rich scoring evidence | Expose detailed failure/runtime context to explain standings locally. | |
| Public-safe standings | Keep standings source-safe and replay-safe by default. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Outputs must omit Strategy source, memories, objectives, owner debug, raw Awareness Grid, stack traces, stderr, tokens, paths, DB DSNs, and private internals.

---

## the agent's Discretion

- The agent may choose Go package boundaries, fixture format, SQL helpers, and refresh call sites if scoring remains parity-tested and Go-owned for normal workflows.

## Deferred Ideas

- Public evidence route cutover, topology promotion gates, scoring redesign, production sandbox replacement, and final TypeScript runtime retirement are deferred.
