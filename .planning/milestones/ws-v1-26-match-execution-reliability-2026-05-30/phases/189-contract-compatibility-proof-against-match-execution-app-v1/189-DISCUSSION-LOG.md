# Phase 189: Contract Compatibility Proof Against match-execution-app-v1 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 189-Contract Compatibility Proof Against match-execution-app-v1
**Areas discussed:** Compatibility target, outcome coverage, monitors

---

## Compatibility Target

| Option | Description | Selected |
|--------|-------------|----------|
| Frozen v1 contract | Validate all public outcomes against `match-execution-app-v1`; no additions by default. | ✓ |
| Optional additions | Add optional public fields proactively. | |
| New version | Create a new app-facing contract version. | |

**User's choice:** Confirmed frozen v1 contract.
**Notes:** Same as milestone decision `1A`.

## Outcome Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Full failure catalog | Cover complete, running, degraded, unavailable, timeout, malformed, stale, strategy failure, missing/no-result. | ✓ |
| Happy path plus one failure | Keep proof narrow. | |

**User's choice:** Confirmed full failure catalog coverage.
**Notes:** Compatibility proof should be strong enough for later execution/app parallel work.

## Monitors

| Option | Description | Selected |
|--------|-------------|----------|
| Specific drift monitors | Catch contract, privacy, ownership, fixture, and promotion-language drift. | ✓ |
| Generic smoke only | Rely on broad tests without targeted monitor messages. | |

**User's choice:** Confirmed specific drift monitors.
**Notes:** Failures should point to the type of drift.

## the agent's Discretion

- Decide exact distribution across spec, Go, web, Playwright, and monitor tests.

## Deferred Ideas

None.
