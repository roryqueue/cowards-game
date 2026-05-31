# Phase 228: Cross-Language Golden Strategy Corpus and Parity Matrix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 228-Cross-Language Golden Strategy Corpus and Parity Matrix
**Areas discussed:** Corpus depth, parity gates

---

## Corpus Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Tactical equivalent corpus | Real equivalent Strategy behavior across all four languages. | X |
| Minimal smoke-only corpus | Faster but weak drift prevention. | |

**User's choice:** Tactical equivalent corpus.
**Notes:** Recommended because the milestone wants honest support parity.

---

## Parity Gates

| Option | Description | Selected |
|--------|-------------|----------|
| Behavior, failure, result/replay, privacy | Full conformance wall across runtime and public evidence. | X |
| Runtime-only conformance | Misses public evidence and privacy drift. | |

**User's choice:** Behavior, failure, result/replay, privacy.
**Notes:** This phase should become the durable drift prevention layer.

## The Agent's Discretion

- Choose runner location and artifact format during planning.

## Deferred Ideas

- Language balance/performance tuning.
