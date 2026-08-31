# Phase262 Native Deadlock Recovery Research

**Date:** 2026-08-31  
**Researcher:** `/root/research_262_deadlock_recovery`, typed `gsd-phase-researcher`  
**Recorded by:** main orchestrator from the researcher's returned findings after a timeboxed research turn. The researcher did not write this file, change implementation, or run operational selectors/tests.  
**Source baseline:** `7e2e3ffa6ba16a5457a9fd7a6819add245f2f537`  
**Scope:** D-33R's one corrected invocation only; not a general assurance redesign or the unadopted lean milestone rewrite.

## User Constraints

The operator answered `yes` to allowing one corrected run after fixing the deadlock, keeping all resource limits unchanged. Preserve failed110 and all prior source, seal, authorization, charge and outcome history. Never rerun110, fabricate its missing producer terminal or clear its empty directory to restore apparent pre-run absence. The corrected invocation needs fresh identities and independently reviewed repaired source; no further retry is implied.

Unchanged: 200ms sampling, inclusive2500bp memory gate, eight calibration attempts/four shards per started route, maximum three routes/twelve observations, four hours from first observation, five/fifteen-minute backoffs, one conditional540-cell reproduction, canonical kernel/runtime and all privacy/gameplay/formation boundaries. The old bootstrap allocated zero observations or Matches; its failed invocation still counts as an invocation.

## Findings and Smallest Repair

The owner native helper holds an exclusive root flock while awaiting stdin EOF. The TypeScript custody wrapper closes the parent's original root descriptor after acquisition. A transaction separately opens the root and blocks on its own exclusive flock, while the parent synchronously waits and can release the owner only afterward. The existing producer test publishes PAIR before acquiring ownership, so it misses the failing real order.

Retain the original parent root descriptor throughout the owner lease. Pass that exact descriptor through numeric child stdio to every transaction under that lease. Use an opaque capability backed by module-private active/root/descriptor state; validate supplied root, device/inode, active lifetime and retained descriptor before use. Thread it through journal bootstrap, append, receipt reconciliation, terminal/reproduction publication and every PAIR/LIFE call under ownership. Never accept arbitrary caller FD numbers, silently reopen the root, unlock between transactions, or remove the owner lock.

The existing owner-v1 and transaction-v6 C bytes can remain unchanged if native integration proves duplicated/inherited descriptors share the retained lock. Parent retention changes owner-death behavior: invalidate the lease and close retained descriptors during bounded cleanup, rejecting later transactions. Account honestly for delayed child-exit callbacks during synchronous work; do not claim immediate detection or abrupt-death filesystem cleanup.

Use finite synchronous subprocess timeouts with a termination signal that cannot be ignored; a JavaScript timer cannot interrupt spawnSync. Bound owner acquisition/release and settle child closure, descriptor cleanup and temporary-build cleanup in finally paths. The existing private-native-bootstrap-v2 also has unbounded compiler/signing calls and a prelaunch descriptor leak on compile failure. If needed for this repaired lifecycle, create a narrowly scoped v3 bootstrap; preserve v2. The planner must choose practical timeout constants and verify them in fixtures; research did not measure them.

## Compact Plan Sequence

1. **145 — Repair and source closure:** additive v4 model/producer/native custody, live-v15 consumer, exact fresh map, real native tests and bounded cleanup. No operational invocation.
2. **146 — Independent repair review:** source/runtime identities, actual native composition, frozen bounds and historical preservation; eligibility for exactly one corrected invocation. Do not recursively add reviewer layers or repeat unchanged historical143/144 heavyweight proof.
3. **147 — Sole corrected invocation:** replaces110, never revives it; unconditional post-check, preserve producer bytes, stop on terminal outcome. Bootstrap failure without terminal remains a recorded failure, not a synthetic terminal.

Proposed DAG: `145 → 146 → 147 → 94 → 123 → 124 → 95 → 125 → 126 → 106 → 127 → 128 → 129`. Pending94–129 need corrected source/evidence identities and stage-aware immutable custody. Their normal execution remains conditional on147 producing the required committed terminal/journal. Preserve independent source/review/publication separation without a new custody system.

## Focused Regression Contract

- Real owner acquisition → journal-bootstrap PAIR → lifecycle append → terminal-style PAIR completes in an isolated synthetic root.
- A distinct owner remains excluded during and after transactions until release, then succeeds.
- Wrong-root, fabricated, released, closed and descriptor-reuse capabilities fail before writes.
- Transaction failure/timeout invalidates the lease and unwinds without further transactions.
- Owner death/cancellation cleans up or truthfully reports uncertainty, never renewing live authority.
- A separately supervised outer process imposes a hard deadline, because an in-process test timeout cannot rescue a spawnSync deadlock.
- Zero preflight/calibration/Match/producer-selector calls in fixtures; no canonical or old-evidence writes.
- Focused pure tests during development, one final exact-source native composition suite and targeted typecheck; rerun only affected proof after changes.

Suggested native test: `scripts/lib/v1-38-bounded-retry-v4-native-custody-v1.test.ts`.

## Fresh Identity Map

The researcher reported direct lstat absence at the source baseline; recheck before freezing/writing.

| Purpose | Proposed fresh path/version |
| --- | --- |
| Producer | `scripts/run-v1-38-bounded-retry-envelope-v4.ts` |
| Model | `scripts/lib/v1-38-bounded-retry-envelope-v4.ts` |
| Native custody | `scripts/lib/v1-38-bounded-retry-v4-native-custody-v1.ts` |
| Optional bounded bootstrap | `scripts/lib/v1-38-private-native-bootstrap-v3.ts` |
| Consumer | `scripts/run-v1-38-bounded-retry-envelope-v4-live-v15.ts` |
| Envelope | `.planning/artifacts/v1.38-plan-262-145-retry-envelope-v4.json` |
| Seal | `.planning/artifacts/v1.38-successor-source-seal-v14.json` |
| Journal/private/terminal | `v1.38-current-matrix-retry-journal-v4.jsonl`, `v1.38-current-matrix-retry-private-v4`, `v1.38-current-matrix-retry-terminal-v4.json` under `.planning/artifacts/` |
| Reproduction | `.planning/artifacts/v1.38-current-matrix-reproduction-v18.json` |
| Aggregate/disposition/readiness/lifecycle | corresponding existing destination stems with fresh `v4` suffix |
| Correction | `.planning/artifacts/v1.38-phase-262-review-fix-correction-v12.json` |
| Activation | `.planning/artifacts/v1.38-plan-262-route-12-activation-v1.json` |

Use new `retry-envelope:v4`, `route:v4:N`, `preflight:v4:N`, `calibration:v4:R:A`, `reproduction:v4:N` identities and hash domains. Bind the failed v3 bootstrap separately; do not reuse its destinations or permission. Preserve local-seal verification as an immutable prerequisite without opening holdout material.

## Sources, Confidence and Remaining Uncertainty

Direct repository evidence: native owner-lock-v1 C; transaction-helper-v6 C; native-custody-v1 TS; producer-v3 TS and its test beginning around508;110 summary/failure review. Research observed Node24.15.0, pnpm11.1.2, TypeScript6.0.3, Vitest4.1.6 and tsx4.22.0. No new package is needed.

The researcher consulted [Apple flock(2)](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/flock.2.html), corroborated by local `man 2 flock`, and [Node24.15 child_process](https://nodejs.org/download/release/v24.15.0/docs/api/child_process.html). Duplicated/inherited descriptors share lock references; numeric stdio shares parent descriptors; synchronous timeout still waits for child termination. External guidance was classified MEDIUM; actual integration proof remains mandatory.

Remaining uncertainty: retained-FD implementation behavior and practical timeout constants. The observed deadlock, missing real-order test and approved one-run scope are established. The unavailable Jina research seam was bypassed with direct official-source retrieval; no dependency was installed.
