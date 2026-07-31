# Phase 262 Plan 21: A3 Runtime-Observer Repair and Successor Custody Research

**Researched:** 2026-07-31
**Domain:** Archived-fixture identity, direct-child RSS observation, immutable successor custody, and single-use Pattern C authority
**Confidence:** HIGH — the failing fixture, v6 terminal, sampler lifecycle, public projection, and required successor topology are all present in committed source/evidence.

## Executive finding

Plan 262-20 established two independent facts that must not be conflated:

1. The committed A2/B2 route and its `calibration_stopped` terminal are internally valid and immutable.
2. The post-integration focused selector is not clean: three temporary-clone tests fail with `V138_SOURCE_A2_AGGREGATE_DELTA_INVALID` because their archived-A2 fixture is derived from post-integration HEAD instead of the exact reviewed A2 commit `6db9f79e38340b303d73d6e379c13f667b5eadc9`.

Static review of the v6 live branch explains its legitimate public stop. All four calibration shards were cancelled after the direct-child RSS observer returned unavailable; the parent projected `SYSTEM_FAILURE`/`RESOURCE_MEASUREMENT_UNAVAILABLE`, charged all eight attempts, accepted zero evidence, completed cleanup, and did not create reproduction:v7. This is not permission to reinterpret or retry v6. It identifies a successor-source repair that must be reviewed and sealed as A3/B3 before any new live observation.

## Sources reviewed

- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-CONTEXT.md`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-18-RESEARCH.md`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-18-PLAN.md`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-19-PLAN.md`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-20-PLAN.md`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-20-SUMMARY.md`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VALIDATION.md`
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VERIFICATION.md`
- `scripts/lib/v1-38-current-matrix-reproduction.ts`
- `scripts/lib/v1-38-successor-source-seal.ts`
- `scripts/evaluate-v1-38-foundation-contract.test.ts`

## Locked constraints carried forward

- Per D-01/D-02, A2/B2 and every v5/v6 receipt, marker, root, absence fact, and charged identity remain immutable; a successor receives new schemas, roots, destinations, and route ordinal.
- Per D-03/D-10, the supervised v1.18/v1.19/MATCH_KERNEL route and historical Starter/Advanced fixture predicate remain unchanged. The repair does not change game rules, fixture outcomes, runtime ownership, or the 200 ms RSS sampling timeout.
- Per D-04/D-06/D-22, no formation material, public/product reachability, alternate scheduler, or gameplay experiment may enter A3.
- Per D-05/D-16, v5 and v6 charges remain cumulative protected history. A new allocation is additive; stopped or partial work is never reused.
- Per D-07 through D-09, identity drift or failed custody is a stop, not something Plan 262-21 may normalize.
- Per D-11 through D-18, the frozen inclusive 2,500-basis-point headroom threshold, 8-attempt/4-shard calibration, 540-cell reproduction cardinality, accounting, predicate, and public taxonomy do not change.

## Finding 1 — archived A2 fixture must be exact

`deriveV138SourceA2Custody` rejects any aggregate path outside the three authorized A2 source/test paths. The three failing temporary-clone tests build their fixture boundary from a moving post-integration HEAD; later planning/evidence commits therefore appear inside `sourceBase2..sourceA2` and trigger `V138_SOURCE_A2_AGGREGATE_DELTA_INVALID` even though the canonical A2/B2 checker remains green.

The correct repair is test-only identity fidelity: clone or initialize the fixture at exact A2 `6db9f79e38340b303d73d6e379c13f667b5eadc9`, preserve exact sourceBase2/A2 review metadata, and create mutations from that archived point. Do not loosen the aggregate-path allowlist, accept planning paths, replace A2 with HEAD, or weaken lineage validation. The three previously failing selectors must turn green while the negative aggregate-delta mutations still fail closed.

## Finding 2 — direct-child RSS sampling needs serialized lifecycle ownership

The v6 runner permits interval-driven RSS callbacks to overlap and to resolve after the shard child has closed. That creates three race classes:

- multiple `ps` children may be in flight for one shard while the target exits;
- a late callback can classify an already successful child as measurement failure or affect sibling cancellation;
- close can finish before pending RSS work is invalidated and awaited.

The successor must implement one in-flight direct-child RSS request per shard. A tick while a sample is pending performs no second spawn. Child close marks the sampler generation closed, invalidates future callback effects, clears the interval, and awaits the pending sample before the terminal is sealed. The callback may update that shard only when its generation is current; it cannot abort a sibling and cannot overwrite an already determined successful exit.

`ESRCH` and exact no-row output are benign only after that same child has produced at least one valid external RSS sample. Before the first valid sample they remain `RESOURCE_MEASUREMENT_UNAVAILABLE` and fail closed. EPERM, spawn denial, malformed/multiple/negative output, timeout, and other errors retain the existing public-safe classifications. The fixed 200 ms sampler timeout remains exact.

## Finding 3 — global Darwin observer failure remains a real global stop

The direct-child race repair must not turn every resource observation failure into success. Add an injected shared Darwin observer that returns valid ticks and then fails after N valid observations. The scheduler must still cancel all active shards, charge their work, accept zero evidence, complete cleanup, and project the existing public system-failure taxonomy. This test distinguishes a legitimate scheduler-wide observer failure from a stale per-child RSS callback.

Required concurrency tests also cover multiple shard children exiting successfully at nearly the same time while their final serialized RSS samples settle. Every child must retain its own terminal, no stale callback may abort a sibling, no duplicate terminal may appear, and all pending sample handles must be drained.

## Additive contract topology

Plan 262-21 adds, rather than replaces, these contracts:

- sourceBase3 and reviewed source A3 custody;
- `v1.38-plan-262-21-authorization-v3` at `.planning/artifacts/v1.38-plan-262-21-authorization-v3.json`;
- `v1.38-successor-source-seal-v3` at `.planning/artifacts/v1.38-successor-source-seal-v3.json`;
- a direct-child B3 whose changed-path set is exactly those two artifacts;
- route ordinal 3;
- fresh destinations: execution-context:v7, preflight:v7, calibration:v7, reproduction:v8, and Plan-262-22 terminal-v1.

All v1/v2 schemas and checkers remain supported byte-for-byte. The v3 authorization/seal checker must bind:

- exact sourceBase3, A3 tree/parents/lineage and the independently reviewed three-path repair delta;
- exact A2 `6db9f79e38340b303d73d6e379c13f667b5eadc9` and B2 `b00af0406b97aa5f0538209d1f31a6e36659e570` ancestry/custody;
- v6 context root `sha256:e98e782f243acbf3dc80964ce08f2168516e44ef8257fa72a96f7e7e552671aa`;
- v6 preflight root `sha256:df76d3e5a29ed56652c08492d4eb178f783970a6e2d0baffe6bda71651b6f956` and its consumption marker `sha256:7702bb26e6cff22427b2d8149f2566e09115aa783d26039e5722a44cf3a26257`;
- v6 calibration root `sha256:3d2af132430bd3a460eb06058c97fb19ef82da9108e5235b1ea817b5da2a8c4e` and its consumption marker `sha256:3fec062f357936f51075ae666647cb7a5c0b1289e8f7458bc9d70e9eddc46e85`;
- v6 terminal root `sha256:a74e13e25b0bc51ddf5ed5fdaffff1ac6b5eea22de32c1bebab3d70be00e542f`;
- reproduction:v7 artifact and consumption-marker absence;
- cumulative immutable calibration charges `calibration:v5:0..7` and the eight v6 public attempt IDs exactly as recorded by calibration:v6;
- every earlier protected root, privacy boundary, formation-absence proof, and unchanged frozen policy.

## Plan topology

1. **262-21 — repair, review, and seal.** TDD-repair the exact A2 fixture and sampler lifecycle; inject the legitimate Darwin failure case; run the full focused suite and typecheck; deep-review sourceBase3/A3; render a fresh exact authorization literal; obtain a blocking human checkpoint; commit exactly authorization-v3 and seal-v3 as direct-child B3.
2. **262-22 — one main-only Pattern C route.** After checking B3 and zero active helpers/executors, perform exactly one preflight:v7, one calibration:v7 allocation of eight attempts/four shards, at most one conditional reproduction:v8 allocation of 540 cells, and exactly one terminal-v1. No retry.
3. **262-23 — independent read-only verification.** Invoke no writer or live observation. Recompute A3/B3/protected history, check the terminal-first presence table, and pass ADMIT-03 only for literal `reproduction_passed` with exactly 540 charged and 540 accepted fresh cells.

## Discovery conclusion

This is Level 0 codebase-pattern work: it extends existing v1/v2 receipt, custody, terminal, and injected-runner patterns without a new library or external API. No package install is required, so no package-legitimacy gate applies.

## Source audit

| Source | ID | Requirement / constraint | Coverage | Status |
|---|---|---|---|---|
| GOAL | — | Restore a clean, exact-authority path to current-rules fixture reproduction | Plans 262-21..23 | COVERED |
| REQ | ADMIT-01 | Preserve predecessor/A2/B2 admission and add reviewed A3/B3 custody | Plans 262-21, 262-23 | COVERED |
| REQ | ADMIT-02 | Bind exact runtime/source/policy/route identities | Plans 262-21..23 | COVERED |
| REQ | ADMIT-03 | One supervised conditional fresh 540-cell fixture reproduction | Plans 262-22, 262-23 | COVERED |
| REQ | ADMIT-04 | Every malformed/stopped/drifted branch fails closed without repair/reuse | Plans 262-21..23 | COVERED |
| REQ | MEAS-01..MEAS-10, SEAL-01, DECI-02 | Existing Plans 262-03..07 remain downstream of exact route verification | none | EXCLUDED — existing downstream plans |
| RESEARCH | — | Exact A2 fixture, serialized RSS sampling, pending-sample close, Darwin failure injection | Plan 262-21 | COVERED |
| RESEARCH | — | Additive v3/v7/v8 contracts and route ordinal 3 | Plans 262-21..23 | COVERED |
| CONTEXT | D-01..D-22 | Immutable evidence, unchanged gameplay/runtime/policy, privacy and formation absence | Plans/prohibitions | COVERED |
| CONTEXT | Deferred Ideas | Planner/factory/league/formation/product/rule work | none | EXCLUDED |
