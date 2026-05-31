# Phase 203: Result Page Tactical Summary and Comparison Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 203-result-page-tactical-summary-and-comparison-model
**Areas discussed:** Result-page intelligence placement and comparison model

---

## Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Existing result page section | Adds Match Intelligence near lifecycle/availability evidence on the current MatchSet result page. | ✓ |
| Separate intelligence page | More room, but splits the inspection workflow too early. | |
| Decide during implementation | Leaves planners without a clear integration point. | |

**User's choice:** `confirm 203`
**Notes:** User confirmed the recommended default.

---

## Panel Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Compact operational panels | `Intelligence Summary`, `Evidence Confidence`, `Turning Points`, `Match Comparison`, and `Limitations`. | ✓ |
| Large narrative cards | More editorial, but less suitable for repeated tactical inspection. | |
| Minimal one-line summary | Too thin for the milestone ambition. | |

**User's choice:** `confirm 203`
**Notes:** Panels should feel like serious workbench UI, not marketing.

---

## Comparison Grain

| Option | Description | Selected |
|--------|-------------|----------|
| Per Match first | Uses public Match rows and replay-backed evidence directly. | ✓ |
| Entrant narrative first | Riskier because public evidence may not support broad entrant-level claims. | |
| No comparison | Leaves a major Phase 203 requirement unmet. | |

**User's choice:** `confirm 203`
**Notes:** Entrant-level summaries are allowed only when public evidence supports them.

---

## Low-Signal States

| Option | Description | Selected |
|--------|-------------|----------|
| Visible but limited | Every fixture gets an intelligence state with explicit limitations. | ✓ |
| Hide intelligence when weak | Cleaner but makes degraded/unavailable states less useful. | |
| Force tactical summaries | Rejected because it invents insight where evidence is absent. | |

**User's choice:** `confirm 203`
**Notes:** This carries forward the Phase 201/202 low-signal stance.

---

## the agent's Discretion

- Exact component names, section order, and responsive layout details are left to the agent/planner.

## Deferred Ideas

- Separate intelligence report page.
