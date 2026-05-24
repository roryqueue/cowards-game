# Phase 99: Go Match Completion and Chronicle Persistence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 99-Go Match Completion and Chronicle Persistence
**Areas discussed:** Go completion ownership, Atomic persistence, Idempotency/conflicts, Completion field parity, Chronicle validation, Privacy/public safety

---

## Go Completion Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Keep TypeScript completion normal | Let TypeScript continue completing normal product Matches while Go claims jobs. | |
| Go normal completion owner | Go completes normal Matches after valid leases and execution results; TypeScript is parity/rollback/test only. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** This applies the Phase 96 and Phase 97 no-mixed-owner rule to Match completion.

---

## Atomic Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Split writes | Persist Chronicle and update Match/job/attempt state through separate operations. | |
| Single transaction | Validate lease and Chronicle, then insert Chronicle and update Match/job/attempt rows atomically. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Any failure leaves the Match incomplete.

---

## Idempotency And Conflicts

| Option | Description | Selected |
|--------|-------------|----------|
| Broad idempotency | Return success for duplicate calls whenever a Chronicle conflict exists. | |
| Conservative idempotency | Return existing metadata only when the Match is already complete and an existing compatible Chronicle row exists. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Hash drift, mismatched metadata, invalid lease, or ambiguous conflict fails closed.

---

## Completion Field Parity

| Option | Description | Selected |
|--------|-------------|----------|
| Persist runtime-provided fields | Trust execution-service completion fields if present. | |
| Derive in Go with parity | Derive outcome, winner, Soldier counts, and survival turns from final state with TypeScript parity. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** TypeScript `deriveMatchCompletionFields` is the parity oracle.

---

## Chronicle Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Schema-only validation | Validate only that the Chronicle parses before insertion. | |
| Strict integrity validation | Validate schema, ids, terminal outcome, counts, metadata, hash, and projection safety before persistence. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Go-completed Chronicles must remain readable by existing replay reconstruction and public projection code.

---

## Privacy And Public Safety

| Option | Description | Selected |
|--------|-------------|----------|
| Use raw Chronicle evidence | Use raw stored Chronicles for completion/topology evidence while developing. | |
| Public-safe evidence | Use projected/public-safe evidence and redact private runtime/source data by default. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Outputs must omit Strategy source, memories, objectives, owner debug, raw Awareness Grid, stack traces, stderr, tokens, paths, DB DSNs, and private internals.

---

## the agent's Discretion

- The agent may choose Go package boundaries, helper names, transaction helpers, and fixture formats if completion stays atomic, parity-tested, source-safe, and conservative about idempotency.

## Deferred Ideas

- MatchSet scoring, final failure classification, public evidence cutover, topology promotion gates, production sandbox replacement, and final TypeScript runtime retirement are deferred.
