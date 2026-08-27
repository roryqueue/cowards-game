# Phase 262 Research: Bounded Standing Retry Successor

**Researched:** 2026-08-27  
**Status:** implementation-ready; no route authority or live execution created  
**Decision source:** D-23R through D-27R in `262-CONTEXT.md`

## Executive recommendation

Replace the single-use/no-retry route model only for a fresh successor envelope. Keep every earlier route, authorization, charge, obstruction, and terminal immutable.

Freeze one envelope with these exact limits before execution:

| Bound | Frozen value |
|---|---:|
| Maximum route starts | 3 |
| Maximum calibration allocations | 3 allocations, each exactly 8 attempts / 4 shards |
| Maximum reproduction runs | 1 total, only after the first admitted calibration |
| Maximum reproduction cells | exactly 540 |
| Envelope lifetime | 4 hours from the first preflight observation |
| Pre-start headroom observations | at most 12 |
| Headroom observation spacing | at least 5 minutes after a refusal; no delay required after an admitted observation |
| Inter-route backoff | at least 15 minutes after a process-valid calibration system failure |
| Sampling cadence during work | unchanged 200 ms |
| Admission threshold | unchanged inclusive 2,500 basis points |

The first literal 540/540 accepted reproduction closes the envelope successfully. A calibration that is policy-admitted but ends in a process/system failure consumes one route start and its eight identities. A headroom refusal consumes a preflight identity and observation allowance but not a route start or calibration allocation. No second reproduction is permitted: any reproduction integrity/system failure, partial result, or accepted count other than 540 is terminal failure for the envelope.

Three route starts are enough to distinguish a repaired path from a transient host/runtime failure without creating an open-ended evidence-shopping loop. Five historical admitted preflights at roughly 6,900-7,400 basis points still led to failed calibrations, so retry count alone is not the repair. The successor must first add and independently test the missing v13/v14-capable execution producer that caused Route 8's zero-consumption obstruction. The finite envelope then provides limited tolerance for residual transient failures after that structural repair.

## Established evidence

1. Plans 262-69 through 262-74 truthfully closed Route 8 as a pre-start obstruction. The reviewed source could validate dispositions but could not write the required v13/v14 execution evidence. Route 8 never started, charged nothing, accepted nothing, and granted no downstream authority.
2. Earlier v5-v9 routes passed the host preflight at 6,900-7,400 basis points but stopped during calibration. v6 reported `RESOURCE_MEASUREMENT_UNAVAILABLE`; v7-v9 reported `SHARD_EXECUTION_FAILED`. Every route charged all eight calibration identities and accepted zero cells.
3. Repeating unchanged calibration code would therefore be scientifically and operationally unjustified. The source capability must be corrected and reviewed before the retry envelope can open.
4. Plan 262-74 remains an intentionally unsummarized historical sentinel with `gaps_found`. The new successor must not manufacture a Plan-74 summary or reinterpret its obstruction as a pass.
5. The local seal passes only as `single_operator_local_seal_v1`. The new policy does not add external custody, independent permissioning, or malicious-operator resistance.

## Contract shape

### Standing authority

The committed D-23R decision is the sole operator decision carrier for the envelope. A canonical envelope contract binds that decision commit, exact source/review roots, local-seal root, prior-history root, attempt limits, clocks, destinations, and all frozen policies. Individual route attempts derive authority mechanically from the envelope and their unused ordinal. They do not contain, request, or hash a new user literal.

Standing authority is not evergreen. It expires when any one of these becomes true:

- literal 540/540 success;
- three route starts are consumed;
- one reproduction starts and does not produce a valid 540/540 result;
- four hours elapse from the first preflight observation;
- an integrity, lineage, accounting, privacy, semantic, or contamination failure occurs;
- source, review, policy, runtime, kernel, hardware predicate, or local-seal identity changes.

An expired envelope cannot be extended in place. A later change would require a new user decision and a new research/plan/review lineage.

### Immutable attempt identities

Use envelope-scoped identities rather than continuing mutable `latest` versions:

- `retry-envelope:v1`
- `route:v1:0` through `route:v1:2`
- `preflight:v1:0` through `preflight:v1:11`
- `calibration:v1:{routeOrdinal}:{0..7}`
- `reproduction:v1:{0..539}`

Every identity can transition exactly once from unused to a terminal disposition. A process crash after reservation leaves the identity charged/indeterminate; it is never reclaimed. A fresh invocation reads the committed journal and selects the next unused ordinal.

### Cumulative accounting

The envelope contract must bind an ordered protected-history manifest covering all earlier authorization bytes, preflight/calibration/reproduction consumption markers, charged identities, terminals, Route-8 obstruction, Plan-73 disposition, Plan-74 binder, and `gaps_found` verification.

Each new journal record binds the previous record root. Counters are derived from the ordered journal, never accepted from CLI input:

- preflight observations consumed;
- route starts consumed;
- calibration identities charged;
- reproduction identities charged;
- accepted cells;
- remaining envelope capacity.

Historical identities are read-only inputs and can never become remaining capacity.

## Execution topology

### 1. Source repair before authority

Create a fresh successor module and focused tests that can actually produce:

- a Pattern-C main-orchestrator execution context;
- the Darwin effective-available-basis-points preflight;
- one eight-attempt/four-shard supervised calibration;
- conditionally, one 540-cell reproduction;
- append-only consumption records and a terminal envelope result.

The source must use the unchanged canonical runtime/kernel path. It must not contain candidate, formation, holdout-opening, public, product, production, counted-play, or gameplay-change capability.

Before review, run synthetic/fake-process tests only. They must cover admitted/refused headroom, shard success/system failure, reproduction success/failure, crash at every reservation/write boundary, elapsed-window exhaustion, stale source, duplicate invocation, and mutation of every protected-history root.

### 2. Independent source review

A separate reviewer consumes the committed source tree and focused test result. The review is non-authorizing and produces a zero-finding or blocked result. It must confirm that the execution producer exists—the precise capability absent from Route 8—and that no obsolete Plan-262-62 review path is revived.

### 3. Envelope seal

After review, create one separately committed direct-child source seal and one canonical retry-envelope contract. The contract is inactive until a checker joins:

- D-23R decision commit;
- source commit and tree;
- independent source-review root;
- direct-child seal;
- `single_operator_local_seal_v1` verification root;
- exact protected-history root;
- exact retry limits and frozen policy roots.

No live preflight occurs before this join passes.

### 4. Autonomous controller

The main orchestrator is the only controller. Its loop is deterministic:

1. Recheck envelope, source, review, seal, history, local seal, clock, and journal.
2. If no preflight allowance remains or the window expired, terminalize exhausted.
3. Reserve and durably commit the next preflight identity.
4. Observe effective available memory using the frozen Darwin metric.
5. On `< 2500`, record refusal and wait at least five minutes before another observation.
6. On `>= 2500`, reserve the next route ordinal and all eight calibration identities before child launch.
7. Run exactly four shards / eight attempts with 200 ms measurement.
8. On process-valid system failure, charge all identities, clean up, wait at least fifteen minutes, and continue only if capacity/time remain.
9. On admitted calibration, atomically reserve the sole 540-cell reproduction allocation and run it once.
10. Accept only a complete, unique, internally consistent 540/540 result; otherwise terminalize failure.

The controller may resume after a crash but may not retry a reserved identity. It must reconcile committed reservations, child-process cleanup, artifact presence, and terminal markers before doing more work.

## Canonical destinations

Use new names that cannot collide with v5-v14 or Route 8:

- `.planning/artifacts/v1.38-plan-262-77-retry-envelope-v1.json`
- `.planning/artifacts/v1.38-successor-source-seal-v11.json`
- `.planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl`
- `.planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json`
- `.planning/artifacts/v1.38-current-matrix-reproduction-v15.json` (success only)
- `.planning/artifacts/v1.38-foundation-activation-root-route9.json` (success only, after independent verification)

Per-observation and per-route detail should live under a versioned private artifact directory with immutable ordinal filenames. Canonical summary/status files contain only safe projections and roots; they must not expose raw runtime diagnostics, Strategy source/memory, objective payloads, or local-seal secret material.

## Verification and failure rules

Required focused tests:

- exact three-start and twelve-observation caps;
- no reproduction before an admitted calibration;
- exactly one reproduction allocation globally;
- first success closes all remaining capacity;
- failure/partial/duplicate reproduction is terminal and never retried;
- time-window boundary is inclusive and derived from monotonic controller receipts, not engine logic;
- preflight refusal does not charge calibration, but every reserved calibration charges eight identities;
- crash after reservation cannot reuse an identity;
- concurrent controller invocation fails closed under an atomic lock/lease receipt;
- stale or mutated source/review/seal/history/local-seal roots fail before observation;
- no-follow absence of all candidate/formation/holdout/public/production destinations;
- prior v5-v14, Plans 262-62/74, and every historical artifact remain byte-identical.

After live execution, a separately authored verifier must recompute the journal chain, counts, exact 540-cell coverage, runtime/kernel identities, policy bounds, cleanup, privacy projection, and Git ancestry. Only that verifier may create the activation root and mark ADMIT-03 complete. A valid exhausted or failed envelope remains publishable process evidence but leaves Phase 262 incomplete and Phase 263 denied.

Rollback is additive: code can be reverted with a new commit, but committed attempt records, terminal evidence, and charges are never deleted or rewritten. Any rollback after the envelope opens terminalizes it.

## Minimum additive plan sequence

1. **Plan 262-75 — successor source and retry controller:** implement the v15-capable execution producer, journal, bounded controller, and exhaustive synthetic tests; no live work.
2. **Plan 262-76 — independent source review:** review the committed source/test tree and publish a non-authorizing zero-finding or blocked result.
3. **Plan 262-77 — seal and envelope contract:** create/check the direct-child seal and inactive standing-authority envelope with exact limits and protected history.
4. **Plan 262-78 — bounded live envelope:** run the deterministic controller, producing either one literal 540/540 result or one immutable terminal failure/exhaustion record.
5. **Plan 262-79 — independent admission join and lifecycle closeout:** verify the result, create activation root only on pass, refresh validation/verification, summarize the successor, and complete Phase 262 only on pass. A non-pass remains summarized as a completed attempt but keeps the historical Plan-74 sentinel and Phase 262 blocker truthful.

No UI phase is needed. The work is private CLI/evidence infrastructure with no user-facing surface.

## RESEARCH COMPLETE

Recommendation: implement Plans 262-75 through 262-79 as the five-step additive chain above, with a three-route/four-hour envelope, twelve preflight observations, one reproduction maximum, standing authority from D-23R, and literal 540/540 as the unchanged admission condition.
