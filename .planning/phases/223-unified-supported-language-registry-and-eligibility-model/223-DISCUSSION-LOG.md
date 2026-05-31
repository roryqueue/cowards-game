# Phase 223: Unified Supported Language Registry and Eligibility Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 223-Unified Supported Language Registry and Eligibility Model
**Areas discussed:** Source of truth, eligibility semantics

---

## Source of Truth

| Option | Description | Selected |
|--------|-------------|----------|
| Shared registry/provider model | One canonical language model consumed by product, runtime, docs, and monitors. | X |
| Patch existing UI labels directly | Faster but repeats the drift problem v1.32 is meant to solve. | |

**User's choice:** Shared registry/provider model.
**Notes:** This follows the approved milestone defaults and research recommendation.

---

## Eligibility Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence-gated counted semantics | Represent all four as supportable/countable only through provider proof and tests. | X |
| Immediate counted flag flip | Label-only promotion risk. | |

**User's choice:** Evidence-gated counted semantics.
**Notes:** Downstream planners should keep active behavior honest until proof lands.

## The Agent's Discretion

- Choose new module versus evolving existing spec registry based on smallest durable change.

## Deferred Ideas

- None.
