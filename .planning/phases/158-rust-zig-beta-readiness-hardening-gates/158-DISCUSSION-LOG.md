# Phase 158: Rust/Zig Beta Readiness Hardening Gates - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 158-Rust/Zig Beta Readiness Hardening Gates
**Areas discussed:** Evidence categories, Failure taxonomy, Non-sandbox wording

---

## Evidence Categories

| Option | Description | Selected |
|--------|-------------|----------|
| Full Rust/Zig hardening matrix | Cover compile, artifact, runtime, caps, malformed output, traps, stale/missing artifacts, forbidden capabilities, and no inherited host access. | ✓ |
| v1.22 rerun only | Re-run existing probes without expanding beta readiness evidence. | |
| Signed-in proof only | Let browser proof stand in for runtime hardening. | |

**User's choice:** Approved by milestone plan.
**Notes:** This phase strengthens readiness evidence before live proof.

---

## Failure Taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Distinguish Strategy vs system failure | Preserve runtime violation/system failure boundaries and redaction. | ✓ |
| One generic failure class | Simpler public status, less useful for retry/promotion decisions. | |
| Raw diagnostics | Easier debugging, unacceptable privacy risk. | |

**User's choice:** Carry-forward default from prior runtime milestones.
**Notes:** Worker/runtime tests must distinguish Strategy failure from system failure.

---

## the agent's Discretion

- Planner can choose probe IDs and whether the evaluator or package tests own each probe.

## Deferred Ideas

- Production sandbox certification.
- Broad stress/fuzz campaigns.
