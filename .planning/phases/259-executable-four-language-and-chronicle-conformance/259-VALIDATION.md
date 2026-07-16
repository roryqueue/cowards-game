---
phase: 259
slug: executable-four-language-and-chronicle-conformance
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-16
---

# Phase 259 — Validation Strategy

> Per-phase validation contract for executable four-language certification and version-strict Chronicle/replay proof. Plan creation must replace each Wave-0 placeholder with an owned test before implementation.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | Vitest 4, package test scripts, package-free Rust native supervisor tests, Go `testing`, real Python/Rust/Zig toolchains, Wasmtime, PostgreSQL integration proof |
| **Config files** | `vitest.config.ts`, workspace package scripts, `apps/go-backend/go.mod` |
| **Quick run command** | Plan-local focused Vitest/package command, targeting under 120 seconds |
| **Full suite command** | Phase-owned three-run four-language certificate evaluator, replay/runtime-service/persistence/Go suites, audit reproduction, contract/privacy/boundary/lint/typecheck gates |
| **Estimated runtime** | Focused checks under 120 seconds; complete fresh-process certification and service proof may take several minutes |

## Sampling Rate

- **After every task commit:** Run the task's exact focused command and its generated-artifact check.
- **After every plan wave:** Run all affected package suites plus the current corpus/Chronicle evaluator.
- **After certificate or authority changes:** Run three fresh-process repetitions for every affected lane and all staleness mutations.
- **Before `$gsd-verify-work`:** All four real lanes, Chronicle/reconstruction, runtime-service, PostgreSQL, Go, audit reproduction, privacy, and boundary suites must be green with no semantic skips.
- **Max ordinary feedback latency:** 120 seconds; compiler builds and complete certification are explicit end-of-wave exceptions.

## Requirement Verification Map

| Requirement | Wave-0 proof asset | Secure behavior | Test type | Automated command target | Status |
|-------------|--------------------|-----------------|-----------|--------------------------|--------|
| CONF-01 | Immutable corpus manifest, pinned native supervisor, and real TS/Python/Rust/Zig executor fixtures | No declaration, direct-spawn fallback, unsupported result, or partial lane can count as execution | integration | supervisor package/native tests plus phase certificate runner | ⬜ pending |
| CONF-02 | Canonical full-trace projector/comparator vectors | Every state, event, memory, objective, terminal, and failure field is byte/hash exact and private | unit/integration | focused golden/spec trace tests | ⬜ pending |
| CONF-03 | Boundary/generated/mutation/failure lane-by-case matrix plus common-meter exact/N+1 vectors | Missing capability, skip, ambiguous cgroup CPU/memory/pids/descendant attribution, nondeterministic seed, or surviving mutation fails the certificate | adversarial | supervisor/profile plus phase corpus evaluator `--check` | ⬜ pending |
| CONF-04 | Complete identity mutation table and protected working-tree baseline | Any bound engine, adapter, supervisor binary/toolchain/OS/settings, ABI, policy, corpus, artifact, or protected-baseline change stales evidence | mutation | certificate freshness plus protected-baseline tests | ⬜ pending |
| CONF-05 | Three-run certificate verifier, two-sided v1.18 receipt vectors, and Phase-256 authority integration fixtures | Only current complete per-lane certificates referenced separately for bottom/top and imported through authenticated plural roots can promote | integration/DB | certificate, spec/Go receipt, bootstrap, and persistence authority tests | ⬜ pending |
| CHRN-01 | Valid interleaved per-slot fixture and stable error-family mutations | Every activation slot retains independent lifecycle and next-Cycle state | unit | `pnpm --filter @cowards/replay test` | ⬜ pending |
| CHRN-02 | Current/historical vocabulary and exact-version dispatch tables | Unknown versions remain unresolved; current and historical vocabularies never cross-accept | unit/compatibility | replay version-dispatch tests | ⬜ pending |
| CHRN-03 | Semantic Chronicle adversarial mutation suite | First subject/state/lifecycle/version/outcome/postcondition mismatch is rejected stably | adversarial | replay semantic-integrity tests | ⬜ pending |
| CHRN-04 | Runtime-service and PostgreSQL invalid-evidence/rollback fixtures | Shared validator rejects before success or durable mutation | integration/DB | runtime-service and persistence suites with `DATABASE_URL` | ⬜ pending |
| CHRN-05 | Per-transition reconstruction differential vectors | Kind, coordinates, hashes, event order, terminal data, final state, and root match exactly | differential | replay reconstruction tests | ⬜ pending |
| CHRN-06 | Frozen v1.4 bytes, digest, parser/grammar/transition interpretation manifest | Historical read is explicit, immutable, compatible, and never migrate-on-read | compatibility | historical replay digest/dispatch tests | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [ ] Closed corpus, trace, run, certificate, and restricted-diff schemas with canonical hash vectors.
- [ ] Audited four-language fixture sources bound to one behavior manifest and invocation script.
- [ ] Raw-envelope observations for every positive and negative ownership class.
- [ ] Seeded generator determinism and mutation-kill registry fixtures.
- [ ] Fresh-process three-run harness plus unavailable/mismatched toolchain fixtures.
- [ ] Additive v1.18 CPU-nanosecond/wall/RSS/byte/cancellation profile and package-free pinned native supervisor fixtures.
- [ ] Explicit supervisor/spec workspace dependencies, TypeScript project references, public barrels, enumerated spec tests, and one offline lockfile owner.
- [ ] Pinned Linux Docker engine/image/kernel/cgroup-v2 certification identity with hardened container arguments and native-macOS non-counted proof.
- [ ] Closed bottom/top certificate-reference receipt schema with spec-owned encoding/parsing/public verification and issuance-only service fixtures.
- [ ] Existing plural import trust-root protected descriptor/bootstrap/high-water fixtures.
- [ ] Exact phase-start protected working-tree bytes/modes/staged/unstaged diff baseline.
- [ ] Interleaved per-slot Chronicle and stable error-family mutation fixtures.
- [ ] Frozen v1.4 Chronicle bytes/digest/interpretation fixtures isolated from current helpers.
- [ ] Runtime-service and PostgreSQL no-success/no-mutation/rollback fixtures.
- [ ] Empty/unproved authority negative fixtures and one complete per-lane promotion path.

## Required Phase Gate

The final plan must provide one reproducible command or checked script that:

1. executes the complete immutable corpus three times in fresh supervised processes for TypeScript, Python, Rust, and Zig;
2. requires identical full-trace roots and exact Linux cgroup-v2 aggregate CPU/wall/memory/pids/events/byte/cancellation/empty-cgroup evidence with no skip, unsupported, fallback, escape, ambiguous attribution, or synthetic success;
3. verifies certificate staleness for every bound identity and distinct bottom/top certificate references in each current v1.18 receipt;
4. proves spec-owned canonical receipt parsing/public verification, issuance-only runtime-service signing, independent Go verification, and persistence consumption without app imports;
5. runs current per-slot Chronicle validation and per-transition reconstruction;
6. verifies frozen v1.4 bytes and interpretation under explicit historical dispatch;
7. proves authenticated existing plural import-root bootstrap, signing/import, shared runtime-service/PostgreSQL admission, rollback, and privacy-safe projections;
8. requires exact equality to the captured phase-start protected working-tree baseline; and
9. runs the audit reproduction, Go, contract, boundary, lint, and typecheck suites.

## Manual-Only Verifications

All required phase behaviors must be automated. Every candidate golden semantic diff is persisted and independently checker-reviewed. A proven zero count across valid v1.4 state, Action legality, event order, outcome, terminal timing/reason, Strategy observation, and historical interpretation may receive only the immutable machine disposition `no_semantic_delta`. Any nonzero protected-category diff records `suspended_pending_approval` and reaches an explicit user checkpoint for the exact candidate/diff; human approval is an authorization boundary, not a substitute for executable proof.

## Validation Sign-Off

- [x] Every plan task has an `<automated>` command or an explicit Wave-0 dependency.
- [x] Sampling continuity has no three consecutive tasks without automated verification.
- [x] Every Wave-0 asset is owned before its consumer task.
- [x] No watch-mode, pass-with-no-tests, skipped semantic case, or synthetic lane result.
- [x] Focused feedback target is under 120 seconds.
- [x] Final gate requires all four real lanes and immutable historical compatibility.
- [x] `nyquist_compliant: true` and `wave_0_complete: true` are set only after plan checking.

**Approval:** 2026-07-16 — 31 plans across 10 dependency-valid waves; mechanical structure validation, full decision/requirement coverage, file-conflict analysis, and final independent checker all passed.
