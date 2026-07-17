---
phase: 260
slug: truthful-strategy-inputs-arena-authority-and-set-fairness
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-16
---

# Phase 260 — Validation Strategy

> Per-phase validation contract for truthful scheduler observations, one immutable arena authority, and exact side-by-initiative Set coverage. Plan creation must replace every Wave-0 placeholder with an owned test before implementation.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | Vitest 4, Go `testing`, PostgreSQL integration tests, real TypeScript/Python/Rust/Zig certification |
| **Config files** | `vitest.config.ts`, package scripts, `apps/go-backend/go.mod` |
| **Quick run command** | Plan-local focused spec/engine/catalog/policy/persistence/Go command, targeting under 120 seconds |
| **Full suite command** | Spec, engine, map-configs, persistence/PostgreSQL, replay, runtime-service, Go parity, four-language certification, privacy, compatibility, and boundary monitors |
| **Estimated runtime** | Focused checks under 120 seconds; full certification and database-backed boundary proof may take several minutes |

## Sampling Rate

- **After every task commit:** Run the task's exact focused command plus any generated-artifact check.
- **After every plan wave:** Run all affected package suites and tuple/catalog/policy parity checks.
- **After ABI or certificate changes:** Run the complete successor corpus three times in every real language lane and prove historical evidence unchanged.
- **Before `$gsd-verify-work`:** Full service, database, Go, replay, privacy, compatibility, and boundary proof must be green.
- **Max ordinary feedback latency:** 120 seconds; complete certification and database-backed boundary proof are explicit end-of-wave exceptions.

## Requirement Verification Map

| Requirement | Wave-0 proof asset | Secure behavior | Test type | Automated command target | Status |
|-------------|--------------------|-----------------|-----------|--------------------------|--------|
| STRAT-01 | Successor StrategyInput schema and absolute/relative initiative mutation vectors | Unknown or inconsistent initial/current initiative is rejected before runtime execution | unit/integration | spec schema plus engine input tests | ⬜ pending |
| STRAT-02 | Complete `hasAdvancedThisActivation` truth-table fixtures | Only earlier successful self displacement in the same slot sets the pre-Action observation | unit/invariant | engine activation/runtime-input tests | ⬜ pending |
| STRAT-03 | Four-language successor corpus and Workshop/generated example fixtures | Direct, service, provider, examples, and all four lanes transport one exact observation ABI | integration/conformance | golden/runtime/service/certification suites | ⬜ pending |
| STRAT-04 | Runtime ownership import and negative execution fixtures | No Strategy evaluator or execution path enters web, API, persistence, replay, or Go | boundary/security | boundary imports and monitors | ⬜ pending |
| SET-01 | Spec arena manifest plus generated TypeScript/Go projection fixtures | Every current consumer derives or exact-validates one versioned catalog | generation/integration | spec/map-configs/persistence/Go/replay checks | ⬜ pending |
| SET-02 | Geometry canonicalization/hash/alias mutation matrix | Duplicate active semantic geometry and alias/hash mismatch fail closed | unit/adversarial | arena manifest/hash tests and drift monitor | ⬜ pending |
| SET-03 | Canonical four-condition scenario vectors | Each entrant receives both sides and both initiative states with explicit persisted identity | unit/integration | Set policy and persistence creation tests | ⬜ pending |
| SET-04 | Entrant-level Cartesian parity and completion-order fixtures | TypeScript, Go, persistence, and service evidence agree on exact four-row membership and counting | integration/DB/differential | PostgreSQL, Go parity, service-backed Set proof | ⬜ pending |
| SET-05 | Frozen arena bytes and v1.4 trace differential fixtures | Consolidation adds no geometry and changes no valid gameplay or historical interpretation | compatibility | manifest digest and engine/replay compatibility suites | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [x] Successor StrategyInput and SoldierBrainInput schema, consistency, and signed-invocation fixtures — owned by Plans 260-01, 260-03, and 260-10.
- [x] Engine initiative and `hasAdvancedThisActivation` transition table, including push, pushed Soldier, blocked actions, Round change, yielded continuation, and slot reset — owned by Plan 260-03.
- [x] Spec arena manifest, semantic preimage/hash, alias, active-duplicate, and projection fixtures — owned by Plans 260-01, 260-16, and 260-17.
- [x] Spec four-condition Set policy, exact enumeration, permutation, scenario identity, and seed-independence fixtures — owned by Plans 260-01, 260-05, and 260-06.
- [x] Additive historical-safe persistence migration and atomic matrix/status/scoring/retry fixtures — owned by Plans 260-04, 260-05, and 260-07.
- [x] Generated Go catalog/policy parity plus entrant-level Cartesian database fixtures — owned by Plans 260-06, 260-08, and 260-16.
- [x] New immutable four-language observation corpus, reviewed traces, and successor certificate candidate checks — owned by Plans 260-11 through 260-13 and 260-18 through 260-20.
- [x] Replay condition/catalog reproducibility, alias, and historical dispatch fixtures — owned by Plans 260-09 and 260-24.
- [x] Public contract condition projection and prohibited-private-field scans — owned by Plan 260-23.
- [x] Boundary monitors for handwritten arena authority, seed-parsed fairness, mixed tuple identities, stale certificates, and execution ownership — owned by Plans 260-15 and 260-25.

## Required Phase Gate

The final plan must provide one reproducible checked proof that:

1. derives initial/current initiative and pre-Action Advance observation only from kernel state;
2. rejects every absolute/relative initiative mismatch and preserves the three-way failure model;
3. proves the complete D-05 through D-07 truth table without changing Action legality, no-Advance cleanup, terminal behavior, or valid traces;
4. establishes one immutable spec arena manifest, identical Smoke/Open Field geometry hash, only Smoke schedulable, and unchanged Standard Cross geometry;
5. creates exactly four canonical conditions atomically for every semantic scenario and proves each entrant appears twice per side and twice with initial initiative;
6. proves insertion/completion permutation independence, identical system-failure retry identity, player-violation validity, and non-counting partial/degraded matrices;
7. executes and certifies the successor observation corpus three fresh times in TypeScript, Python, Rust, and Zig without reusing Phase-259 evidence;
8. preserves all historical tuple, arena, Chronicle, certificate, and v1.4 gameplay bytes under explicit dispatch;
9. passes service, PostgreSQL, Go, replay, privacy, boundary, typecheck, lint, and build gates; and
10. preserves the exact protected working-tree baseline.

## Manual-Only Verifications

All required behaviors must be automated. No UI design or subjective visual acceptance is part of this phase. Any discovered change to valid gameplay, historical interpretation, official geometry, or Strategy observation beyond D-01 through D-08 must stop for explicit compatibility approval.

## Validation Sign-Off

- [x] Every plan task has an `<automated>` command or an explicit Wave-0 dependency.
- [x] Sampling continuity has no three consecutive tasks without automated verification.
- [x] Every Wave-0 asset is owned before its consumer task.
- [x] No watch mode, semantic skip, synthetic language success, seed-derived fairness assertion, or partial matrix pass.
- [x] Focused feedback target is under 120 seconds.
- [x] Final gate requires all four real lanes, exact Cartesian Set evidence, immutable history, and the protected baseline.
- [x] `nyquist_compliant: true` and `wave_0_complete: true` are set only after plan checking.

**Approval:** 2026-07-16 — 26 bounded plans across 13 dependency-valid waves; requirements and D-01..D-16 coverage, candidate-only preactivation, nine-file atomic activation, generated-output inventory, file-conflict analysis, and independent checking passed with zero blockers and zero warnings.
