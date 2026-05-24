# Phase 97: Go Job Lifecycle and Persistence Contracts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 97-Go Job Lifecycle and Persistence Contracts
**Areas discussed:** Persistence contract shape, Go ownership scope, Time/token determinism, Failure scope, Privacy diagnostics, Rollback/no-fallback

---

## Persistence Contract Shape

| Option | Description | Selected |
|--------|-------------|----------|
| New lifecycle abstraction | Introduce a new queue/broker/scheduler abstraction while migrating ownership. | |
| Direct Postgres parity port | Port `packages/persistence/src/jobs.ts` semantics into Go with parity fixtures. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Phase 97 should preserve current locking and retry behavior rather than changing orchestration architecture.

---

## Go Ownership Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Mixed transitional workers | Allow Go and TypeScript workers to claim normal jobs concurrently during cutover. | |
| Go normal owner, TS parity/rollback/test only | Go owns normal lifecycle primitives; TypeScript is not a normal DB-owning worker. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** This applies the Phase 96 no-mixed-owner rule to job lifecycle contracts.

---

## Time And Token Determinism

| Option | Description | Selected |
|--------|-------------|----------|
| Fully deterministic orchestration clock | Avoid system time/token generation entirely in job orchestration code. | |
| Runtime APIs with test injection | Use normal Go time/token APIs outside the engine, with injectable clock/token sources in tests. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Lifecycle time and tokens are outside deterministic engine logic, but tests must remain stable.

---

## Failure Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Classify all failure types now | Decide runtime violation and MatchSet scoring behavior in Phase 97. | |
| System-failure recording only | Record retryable/exhausted system failures now; leave runtime envelopes and scoring to later phases. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Phase 97 should not pull in Phase 98 runtime boundary or Phase 100 scoring concerns.

---

## Privacy Diagnostics

| Option | Description | Selected |
|--------|-------------|----------|
| Store rich failure diagnostics | Preserve raw runtime/debug context for operator troubleshooting. | |
| Redacted lifecycle diagnostics | Store stable classes/messages and redacted details by default. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Diagnostics must omit Strategy source, memories, objective payloads, stack traces, stderr, tokens, host paths, DB DSNs, and private internals.

---

## Rollback And No-Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Implicit fallback | Let TypeScript worker pick up jobs when Go is unavailable. | |
| Explicit rollback only | Stop Go, switch owner, then start TypeScript rollback worker if needed. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Running jobs, expired leases, retries, and incomplete MatchSets need documented rollback behavior.

---

## the agent's Discretion

- The agent may choose exact package names, fixture format, and test harness structure as long as the resulting implementation is parity-tested, privacy-safe, and no-fallback by default.

## Deferred Ideas

- Runtime service calls, Match completion, Chronicle persistence, MatchSet scoring, public evidence delivery, and topology promotion gates remain later phases.
