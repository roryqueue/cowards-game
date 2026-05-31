# Phase 202: Fixture-Backed Intelligence Derivation Adapter - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 202-fixture-backed-intelligence-derivation-adapter
**Areas discussed:** Adapter boundary and output model

---

## Adapter Home

| Option | Description | Selected |
|--------|-------------|----------|
| Keep in `apps/web` | Minimizes surface area and keeps intelligence app-side for v1.30. | ✓ |
| Shared package now | Could aid reuse, but risks implying a public contract surface too early. | |
| Decide during implementation | Leaves planners without a clear ownership boundary. | |

**User's choice:** `confirm 202`
**Notes:** User confirmed the recommended default.

---

## Input Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Public DTO/projection inputs only | Uses result DTO/view-model data, replay metadata/evidence, `ReplayReadyDto`, public timeline entries, public board states, and fixture adapter outputs. | ✓ |
| Include gated owner debug | Might support deeper analysis, but would violate default public derivation boundary. | |
| Allow internals if useful | Rejected by milestone constraints and frozen boundary. | |

**User's choice:** `confirm 202`
**Notes:** Carries forward Phase 201 and milestone public-only defaults.

---

## Output Model

| Option | Description | Selected |
|--------|-------------|----------|
| Single deterministic view model | Includes evidence band, confidence, summaries, annotations, tactical sections, and limitations. | ✓ |
| Many small ad hoc helpers | Flexible but harder for UI phases and monitors to reason about. | |
| Planner decides later | Leaves too much ambiguity for downstream planning. | |

**User's choice:** `confirm 202`
**Notes:** Unsupported sections should be empty-with-reason via limitations.

---

## Momentum Style

| Option | Description | Selected |
|--------|-------------|----------|
| Rich but copy-limited scoring | Combines public event spikes, status changes, occupancy, contraction pressure, and engagement events while avoiding hidden-intent claims. | ✓ |
| Conservative event counts only | Simpler but less useful as a tactical inspection workbench. | |
| AI/coach-style interpretation | Out of scope and not public-safe. | |

**User's choice:** `confirm 202`
**Notes:** Momentum must point back to public evidence and confidence bands.

---

## the agent's Discretion

- Exact filenames, type names, helper structure, confidence scale, and snapshot/assertion test balance are left to the agent/planner.

## Deferred Ideas

- Shared package extraction is deferred until later reuse is proven.
