# Phase 134: Hostile Probe and No-Fallback Parity Across Subprocess and Container - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 134-hostile-probe-and-no-fallback-parity-across-subprocess-and-container
**Areas discussed:** Probe scope, no-fallback drills, privacy posture

---

## Probe Scope

| Option | Description | Selected |
| --- | --- | --- |
| Practical parity | Run the v1.19 taxonomy across subprocess and container where practical. | yes |
| Container only | Focus only on the stronger candidate. | |
| Documentation only | Record taxonomy without new execution evidence. | |

**User's choice:** Practical parity.

---

## No-Fallback Drills

| Option | Description | Selected |
| --- | --- | --- |
| Broad fail-loud drills | Include stopped services, unavailable candidates, stale artifacts, and substitution. | yes |
| Candidate-only drills | Focus only on Docker/image/runsc failure. | |
| Monitor-only drills | Let monitors catch fallback without explicit drill artifacts. | |

**User's choice:** Broad fail-loud drills.

---

## Privacy Posture

| Option | Description | Selected |
| --- | --- | --- |
| Product categories | Redact internals and describe exclusions using public-safe product categories. | yes |
| Internal names | List exact private fields and diagnostic names. | |
| Minimal copy | Avoid explaining privacy exclusions. | |

**User's choice:** Product categories.

## the agent's Discretion

- Exact probe grouping is open, provided lane/pass/fail/skip/non-promotion states remain clear.

## Deferred Ideas

- Unbounded hostile-code stress/fuzzing.
- Promotion based only on taxonomy breadth.
