# Phase 201: v1.30 Result/Replay Intelligence Signal Inventory - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 201-v1.30 Result/Replay Intelligence Signal Inventory
**Areas discussed:** Inventory shape and v1.29 baseline

---

## Inventory Shape and v1.29 Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Full signal matrix | Source path, field/signal, public/gated classification, supported intelligence use, privacy risk, fixture coverage, and phase relevance. | ✓ |
| Prose-only summary | Faster to write but weaker for later planning, tests, and monitors. | |
| Agent decides later | Defer inventory structure to Phase 201 planning. | |

**User's choice:** `confirm 201`
**Notes:** User confirmed the recommended Phase 201 defaults after asking to restart the sequential `$gsd-discuss-phase` flow. The confirmation also carries the milestone-level preference that similar decisions can be assumed when they match the recommended default.

---

## Fixture Bands

| Option | Description | Selected |
|--------|-------------|----------|
| Capability bands | Classify frozen and v1.29 app-only fixtures as `tactical-ready`, `summary-only`, `pending`, `unavailable`, `failed`, `missing-replay`, or `invalid-or-stale`. | ✓ |
| Binary ready/unready | Simpler, but loses low-signal distinctions needed by later intelligence states. | |
| Agent decides later | Defer fixture taxonomy to planning. | |

**User's choice:** `confirm 201`
**Notes:** Capability bands should help downstream phases avoid invented insight for low-signal fixtures.

---

## Contract Stance

| Option | Description | Selected |
|--------|-------------|----------|
| No DTO expansion | Record gaps as future contract-evolution notes and keep v1.30 planning on existing public DTOs/projections. | ✓ |
| Allow small additions | Consider backward-compatible additions if inventory finds a gap. | |
| Agent decides later | Defer the contract stance to planning. | |

**User's choice:** `confirm 201`
**Notes:** This carries forward v1.25/v1.27/v1.29 frozen-contract posture and matches the user's approved v1.30 defaults.

---

## the agent's Discretion

- Exact artifact filename, table columns, and optional JSON catalog shape are left to the agent/planner, provided Phase 201 requirements are covered.

## Deferred Ideas

None.
