# Phase 259: Executable Four-Language and Chronicle Conformance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-07-12
**Phase:** 259-executable-four-language-and-chronicle-conformance
**Areas discussed:** Corpus composition and governance, full-trace comparison oracle, certification and freshness, Chronicle grammar and historical routing

## Corpus composition and governance

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Layers | Layered mandatory; goldens only; generated only | Layered mandatory |
| Programs | Audited ports; generated sources; stub responses | Audited ports |
| Changes | Append/version; update in place; version breaking only | Append/version |
| Applicability | No semantic skips; reviewed exceptions; core subset | No semantic skips |

## Full-trace comparison oracle

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Oracle | Committed trace; live TypeScript; majority | Committed trace |
| Equality | All canonical fields; final only; object equality | All canonical fields |
| Failure | Full semantics; class only; exit only | Full semantics |
| Mismatch | Block/review oracle; tolerance; regenerate | Block/review oracle |

## Certification and freshness

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Repeats | Three clean; one; soak only | Three clean |
| Unavailable tool | Fail/no new evidence; reuse indefinitely; skip | Fail/no new evidence |
| Freshness | Event plus 30 days; event only; every deploy | Event plus 30 days |
| Promotion | Independent; all four together | Independent |

## Chronicle grammar and historical routing

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Slot state | Full per-slot; Cycle only; global cursor | Full per-slot |
| Reconstruction | Every transition; final only; snapshots | Every transition |
| Dispatch | Exact tuple; parser probing; migrate on read | Exact tuple |
| Vocabulary | Strict version bundle; individual review | Strict version bundle |

**User's choice:** Selected the recommended option for every Phase 259 question.

## the agent's Discretion

- Internal corpus/runner layout and naming within the locked certification model.

## Deferred Ideas

None.
