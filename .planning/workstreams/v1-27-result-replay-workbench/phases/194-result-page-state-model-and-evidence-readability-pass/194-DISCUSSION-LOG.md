# Phase 194: Result Page State Model and Evidence Readability Pass - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 194-Result Page State Model and Evidence Readability Pass
**Areas discussed:** View-Model Boundary, Evidence Layout, Copy Tone

---

## View-Model Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated result view-model helper | Add/extend a non-React helper that transforms `match-execution-app-v1` DTOs into page sections, badges, rows, and empty states. React renders the model. | ✓ |
| Keep in evidence-copy helper | Expand `evidence-copy.ts` to include more result page state decisions. Smaller change, but the helper may become a mixed copy/model bucket. | |
| Keep in page component | Fastest local edit, but it repeats the v1.25 warning against lifecycle inference inside React components. | |

**User's choice:** Dedicated result view-model helper.
**Notes:** This gives later phases and tests a stable place to assert fixture states without burying lifecycle decisions in JSX.

---

## Evidence Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Workbench sections | Separate sections for lifecycle, availability/retry, Match ledger, runtime eligibility, provenance, and privacy. More scannable and more serious. | ✓ |
| Compact details grid | Keep the current details-grid shape but improve labels/copy. Lower design risk, less workbench feel. | |
| Timeline-style evidence | Present result states as an execution timeline. Expressive, but could imply internals we are intentionally hiding. | |

**User's choice:** Workbench sections.
**Notes:** This matches the serious workbench goal while keeping public evidence categories clear and not runtime-internal.

---

## Copy Tone

| Option | Description | Selected |
|--------|-------------|----------|
| Plain operational language | Short, specific statements like "Runtime unavailable; no public Match evidence yet." Avoid drama, avoid raw diagnostic language. | ✓ |
| Player-facing explanatory language | More tutorial-like explanations. Friendlier, but risks cluttering the workbench. | |
| Sparse status labels | Mostly chips and one-line states. Clean, but not enough evidence readability for this milestone. | |

**User's choice:** Plain operational language.
**Notes:** The tone should be serious, public-safe, and easy to scan across many fixture states.

---

## the agent's Discretion

- The agent may decide exact helper filename, section component names, and copy strings.

## Deferred Ideas

None.
