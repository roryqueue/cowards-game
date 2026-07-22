---
phase: 261
slug: integrated-service-proof-drift-guards-and-release
status: current
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-19
---

# Phase 261 — Validation Strategy

Every source/fixture test precedes its collector write. Service, rollback/history, and browser collectors are serialized because they share production-shaped topology/database state. Every `:check` is read-only and fails missing/stale evidence. Prearchive validation closes 55 requirements and leaves PROOF-08 to the archive/tag/post-check operation.

## Test Infrastructure

| Property | Value |
|---|---|
| Frameworks | Vitest 4.1.6, Playwright 1.60.0, Go `testing`, PostgreSQL integration, real TypeScript/Python/Rust/Zig lanes |
| Quick source run | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/check-v1-37-release-boundaries.test.ts scripts/evaluate-v1-37-prearchive-proof.test.ts scripts/check-v1-37-release-tag.test.ts` |
| Collector order | service `:write/:check` -> rollback `:write/:check` -> browser `:write/:check` |
| Full deterministic suite | `pnpm test:fast && pnpm e2e:smoke && pnpm e2e:visual && pnpm boundary:monitors` |
| Prearchive gate | integrated proof -> prearchive proof -> release-ready audit -> handoff -> readiness -> strict release boundaries |
| Postarchive gate | create annotated tag only after archive commit, then `pnpm v1.37:release-tag:check` |

## Plan Task Verification Map

| Plan task | Requirements | Behavior under test | Fastest automated target | Status |
|---|---|---|---|---|
| 261-01-01 | PROOF-02,03,04,05 | Closed scenario/decision/requirement manifest | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/lib/v1-37-integrated-proof-manifest.test.ts` | pass / covered |
| 261-01-02 | PROOF-03,04,05 | Restricted store, selected 90-day policy, safe refs, deletion/access | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/lib/v1-37-restricted-evidence-store.test.ts` | pass / covered |
| 261-02-01 | PROOF-05,06 | Source/privacy mutations plus strict missing/stale artifact fixtures | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/check-v1-37-release-boundaries.test.ts scripts/check-v1-37-integrity-boundaries.test.ts` | pass / covered |
| 261-02-02 | PROOF-05,06 | Construction source mode exactly once; strict mode not premature | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/check-boundary-monitors.test.ts && pnpm v1.37:release-boundaries:source-check` | pass / covered |
| 261-03-01 | PROOF-02,03 | Service topology preflight/lifecycle/owned cleanup before artifacts | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/run-v1-37-integrated-service-proof.test.ts -t "preflight|topology|cleanup"` | pass / covered |
| 261-03-02 | PROOF-02,03 | Four lanes, failures/no-mutation, Chronicle/replay, restricted browser ID handoff | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/run-v1-37-integrated-service-proof.test.ts -t "four lanes|typed failure|Chronicle|proof data"` | pass / covered |
| 261-03-03 | PROOF-02,03 | Service collector write once then read-only missing/stale checks | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/run-v1-37-integrated-service-proof.test.ts && COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:integrated-service-proof:write && COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:integrated-service-proof:check` | pass / covered |
| 261-04-01 | PROOF-01 | Fresh exact audit reproduction/ruling join | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/check-v1-37-audit-reproduction.test.ts && pnpm exec tsx scripts/check-v1-37-audit-reproduction.ts` | pass / covered |
| 261-04-02 | PROOF-03,04 | Serialized real DB rollback/recompute/no-mutation matrix | `DATABASE_URL="$DATABASE_URL" pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/persistence/src/v1-37-release-rollback.test.ts && (cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL="$COWARDS_GO_BACKEND_TEST_DATABASE_URL" PATH=/usr/local/go/bin:$PATH go test ./... -run TestV137ReleaseRollback -count=1)` | pass / covered |
| 261-04-03 | PROOF-01,03,04 | Rollback/history collector write then read-only check | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/run-v1-37-rollback-proof.test.ts && COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:rollback-proof:write && COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:rollback-proof:check` | pass / covered |
| 261-05-01 | PROOF-03,04,05 | Dedicated browser start/health/handoff/Playwright/store/teardown and receipt schema | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/run-v1-37-browser-proof.test.ts` | pass / covered |
| 261-05-02 | PROOF-03,04,05 | Live Playwright public/network scan and board realism plus fixture complement | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:browser-proof:write && PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop --project=mobile --workers=1 v1-37-rules-integrity-proof.spec.ts` | pass / covered (current signed receipt; no collector rewrite during audit) |
| 261-05-03 | PROOF-05 | Signed browser receipt, proof-data digest, evaluator join, read-only check | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:browser-proof:check && COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:browser-proof:check` | pass / covered |
| 261-06-01 | PROOF-01..06 | Pure aggregate evaluator and missing/stale/tamper matrix | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/evaluate-v1-37-integrated-service-proof.test.ts scripts/check-v1-37-release-boundaries.test.ts` | pass / covered |
| 261-06-02 | PROOF-01..06 | Checked collector receipts -> aggregate write -> two read-only checks | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:integrated-proof:write && COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:integrated-proof:check` | pass / covered (current artifact checked read-only) |
| 261-07-01 | PROOF-01..08 | Exact 48 prior + 7 current passed + PROOF-08 ready/pending schema | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/evaluate-v1-37-prearchive-proof.test.ts` | pass / covered |
| 261-07-02 | PROOF-01..08 | Canonical prearchive write then two read-only checks | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:prearchive-proof:write && COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:prearchive-proof:check` | pass / covered (current artifact checked read-only) |
| 261-08-01 | PROOF-01..08 | Release-ready audit: 56 traced, 55 passed, one outer operation pending | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/generate-v1-37-milestone-audit.test.ts scripts/evaluate-v1-37-prearchive-proof.test.ts` | pass / covered |
| 261-08-02 | PROOF-01..08 | Synchronized audit write/check determinism | `pnpm v1.37:milestone-audit:write && pnpm v1.37:milestone-audit:check` | pass / covered (current artifact checked read-only) |
| 261-09-01 | PROOF-02,05,07 | Safe immutable non-authorizing Strategy foundation | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/generate-v1-37-strategy-foundation-handoff.test.ts` | pass / covered |
| 261-09-02 | PROOF-02,05,07 | Handoff write/check determinism | `pnpm v1.37:strategy-foundation:write && pnpm v1.37:strategy-foundation:check` | pass / covered (current artifact checked read-only) |
| 261-10-01 | PROOF-07,08 | Readiness exact hashes/tag absence/no future Git identity | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/evaluate-v1-37-release-readiness.test.ts` | pass / covered |
| 261-10-02 | PROOF-07,08 | Readiness write/check with missing/stale/already-tagged rejection | `pnpm v1.37:release-readiness:write && pnpm v1.37:release-readiness:check` | pass / covered (current artifact checked read-only) |
| 261-11-01 | PROOF-08 | Pretag archive membership/tag absence plus annotated post-tag type/target/message/signing fixtures | `pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/check-v1-37-release-tag.test.ts` | pass / covered (fixtures only; outer operation remains pending) |
| 261-11-02 | PROOF-05,06 | Final strict boundary mode, every missing/stale artifact mutation | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm v1.37:release-boundaries:check && COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm boundary:monitors` | pass / covered |
| 261-12-01 | PROOF-01..08 | Zero-finding prearchive review/validation/UAT/audit convergence | `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1 pnpm boundary:monitors && pnpm v1.37:release-readiness:check` | pass / covered |
| 261-12-02 | PROOF-01..08 | Requirements/roadmap/state agree on 55 passed + PROOF-08 pending | `pnpm v1.37:milestone-audit:check && pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check` | pass / covered |
| 261-13-01 | PROOF-08 | Dedicated archive commit contains truthful release-ready artifacts; pretag checker proves membership and tag absence | `test "$(git show -s --format=%s HEAD)" = "chore: archive v1.37 milestone" && pnpm v1.37:release-tag:check -- --pretag-archive HEAD` | pending — outer archive operation intentionally not performed |
| 261-13-02 | PROOF-08 | Actual annotated tag closes outer operation through post-tag join | `pnpm v1.37:release-tag:check && test "$(git cat-file -t v1.37)" = "tag" && test "$(git rev-parse 'v1.37^{}')" = "$(git rev-parse HEAD)"` | pending — outer tag/post-check intentionally not performed |

## Wave Gates

- Wave 1: source/fixture contracts only; no future artifact requirement.
- Waves 2-4: service, rollback/history, and browser collectors run serially; each test precedes write and each write precedes strict check.
- Waves 5-10: pure rollups, prearchive state, audit, handoff, readiness, and strict final boundaries; mutation tests reject every missing/stale artifact.
- Wave 11: verification/audit convergence records 55 passed plus PROOF-08 ready/pending.
- Wave 12: archive commit, then annotated tag, then read-only post-tag closure; no archived file predicts the tag.

## Validation Sign-Off

- [x] Every executable task has an automated target.
- [x] Plan 261-05-02 explicitly includes the live Playwright network scan and fixture complement.
- [x] Shared PostgreSQL/topology collectors are serialized.
- [x] Every write precedes its strict read-only check and missing/stale evidence is mutation-tested.
- [x] Prearchive and post-tag requirement states are non-circular.
- [x] Protected-path checks remain terminal gates.

**Approval:** approved for planning 2026-07-19; exact task map finalized during checker revision

## Validation Audit 2026-07-22

| Metric | Count |
|--------|-------|
| Prearchive task rows checked | 24 |
| Prearchive task rows pass / covered | 24 |
| Outer-operation rows intentionally pending | 2 |
| Escalated implementation gaps | 0 |

Executed the focused Phase-261 Vitest mutation/source suite (manifest, restricted evidence, release boundaries, monitor wiring, service, audit reproduction, rollback, browser, aggregate, prearchive, audit, handoff, readiness, tag, and CLI-dispatch targets), the PostgreSQL/Go rollback targets, and the strict read-only chain with `COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT=/tmp/cowards-v1-37-restricted-evidence`, documented local PostgreSQL DSNs, and `COWARDS_V1_37_REQUIRE_INTEGRATED_PROOF=1`.

Observed strict evidence: four functional containment-attested non-counted lanes (12 runs, 23 scenarios); 17 rollback/history scenarios; a signed restricted browser receipt; integrated-proof check; 55 passed with `PROOF-08` `ready_pending`; release-ready audit, Strategy handoff, readiness, strict release boundaries, root boundary monitor, and protected-baseline checks all passed. The exact audit reproduction returned `passed-exact`. The final 261 review is clean with zero findings.

`nyquist_compliant: true` is justified for the completed prearchive scope: every Plan 01-12 behavior has executable test/check coverage that ran green, and the only remaining Plan 13 rows are the explicitly deferred, non-circular archive/tag/post-check operation. No archive commit or tag was created or mutated during this audit.
