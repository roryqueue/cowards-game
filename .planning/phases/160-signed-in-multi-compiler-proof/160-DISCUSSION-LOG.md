# Phase 160: Signed-In Multi-Compiler Proof - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 160-Signed-In Multi-Compiler Proof
**Areas discussed:** Proof shape, Failure policy, Evidence privacy

---

## Proof Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Signed-in product proof | Save JS/TS, Rust, and Zig revisions and run four non-counted exhibitions through live product paths. | ✓ |
| Fixture-only proof | Use lower-cost fixtures without account/product flow. | |
| Runtime-only proof | Exercise runtime-service without MatchSet/result/replay pages. | |

**User's choice:** Approved by milestone plan.
**Notes:** v1.22 lacked this exact proof, so this phase closes that gap.

---

## Failure Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Fail loud and block affected beta | Incomplete Zig proof blocks Zig beta, without fallback substitution. | ✓ |
| Substitute another runtime | Continue proof with JS/TS or Rust when Zig fails. | |
| Ignore partial failures | Treat partial proof as sufficient. | |

**User's choice:** Approved.
**Notes:** Split promotion outcomes are intentional.

---

## the agent's Discretion

- Planner can choose automation shape and retry budget.
- Planner can choose artifact schema, provided privacy and proof completeness are preserved.

## Deferred Ideas

- Ranked/ladder proof.
- Broad multi-language proof beyond required MatchSets.
