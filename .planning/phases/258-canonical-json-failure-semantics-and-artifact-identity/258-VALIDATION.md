---
phase: 258
slug: canonical-json-failure-semantics-and-artifact-identity
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-13
---

# Phase 258 — Validation Strategy

> Per-phase validation contract for bounded feedback during execution. Phase 258 proves the RABI contract; full four-language conformance certification remains Phase 259.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frameworks** | Vitest, package test scripts, Go `testing`, service-backed PostgreSQL proof |
| **Config files** | `vitest.config.ts`, package-local scripts, `apps/go-backend/go.mod` |
| **Quick run command** | Plan-local `<automated>` command from the map below |
| **Full suite command** | `pnpm lint && pnpm typecheck && pnpm contract:check && pnpm boundary:monitors && (cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -count=1)` |
| **Estimated runtime** | Focused tasks under 120 seconds; full repository/service proof may take several minutes |

## Sampling Rate

- **After every task commit:** Run that task's exact automated command.
- **After every plan wave:** Run all focused commands introduced or affected by that wave.
- **After Waves 7–10:** Also run Go, persistence, contract and boundary gates because these waves bind cross-process authority.
- **Before `$gsd-verify-work`:** Full repository gates, database-backed atomic activation, evaluator, privacy scan, and immutable-v1.16 checks must be green.
- **Max feedback latency:** 120 seconds for ordinary task feedback; database activation is an explicit end-of-wave exception.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 258-01-01 | 01 | 1 | RABI-01/03/06/07/08 | T-258-01 | Exact ceilings and domains are calibrated | contract | `vitest scripts/calibrate-v1-37-runtime-abi.test.ts; calibration --write --check` | ✅ | ⬜ pending |
| 258-01-02 | 01 | 1 | RABI-01/08 | T-258-01 | Frozen profile rejects ambiguity | unit | `vitest packages/spec/src/runtime-abi-v1-17.test.ts; calibration --check` | ✅ | ⬜ pending |
| 258-02-01 | 02 | 2 | RABI-01/02 | T-258-02 | Raw positive/negative corpus is reproducible | generator | `vitest scripts/generate-canonical-json-v1-1-corpus.test.ts; generator --write --check` | ✅ | ⬜ pending |
| 258-02-02 | 02 | 2 | RABI-01/02/08 | T-258-02 | TS and Go consume every named RED vector | contract | `vitest canonical-json-corpus.test.ts; go test -run CanonicalJSONCorpus` | ✅ | ⬜ pending |
| 258-03-01 | 03 | 3 | RABI-01/02 | T-258-03 | Scanner rejects duplicate/UTF-8/limit faults iteratively | unit | `vitest canonical-json-scan.test.ts canonical-json-corpus.test.ts` | ✅ | ⬜ pending |
| 258-03-02 | 03 | 3 | RABI-01/02 | T-258-03 | Parser produces bounded typed values | unit | `vitest canonical-json-parse.test.ts canonical-json-corpus.test.ts` | ✅ | ⬜ pending |
| 258-04-01 | 04 | 3 | RABI-01/02 | T-258-04 | Canonical bytes and numbers are exact | unit | `vitest canonical-json-encode.test.ts canonical-json-corpus.test.ts` | ✅ | ⬜ pending |
| 258-04-02 | 04 | 3 | RABI-06/07 | T-258-04 | Domains and manifest cannot collide | unit | `vitest canonical-identity-domains.test.ts runtime-identity-manifest.test.ts` | ✅ | ⬜ pending |
| 258-05-01 | 05 | 4 | RABI-01/02 | T-258-05 | Spec/service boundaries reject before host conversion | integration | `vitest canonical-json-boundaries.test.ts canonical-json-corpus.test.ts; spec test` | ✅ | ⬜ pending |
| 258-05-02 | 05 | 4 | RABI-02/03 | T-258-05 | Deep audit returns typed bounded result | regression | `runtime-service test; reproduce-core-rule-gaps.ts` | ✅ | ⬜ pending |
| 258-06-01 | 06 | 4 | RABI-03/04/05 | T-258-06 | Three outcomes are schema-exclusive | unit/type | `vitest runtime-invocation-v1-17.test.ts; spec typecheck` | ✅ | ⬜ pending |
| 258-06-02 | 06 | 4 | RABI-03/05/08 | T-258-06 | Adapter-owned envelope binds full request | contract | `vitest runtime-invocation-v1-17.test.ts service-contract.test.ts` | ✅ | ⬜ pending |
| 258-07-01 | 07 | 5 | RABI-03/04/05 | T-258-07 | Only engine applies player consequence | integration | `vitest runtime-ownership.test.ts kernel-contract.test.ts compatibility-fixtures.test.ts` | ✅ | ⬜ pending |
| 258-07-02 | 07 | 5 | RABI-03/05 | T-258-07 | System failure and retry do not mutate | integration | `runtime-service test; engine test` | ✅ | ⬜ pending |
| 258-08-01 | 08 | 6 | RABI-01/02/03/05/08 | T-258-08 | All TS lanes preserve raw bytes/ownership | integration | `vitest runtime-js adapter/hostile/subprocess/container tests; runtime-js test` | ✅ | ⬜ pending |
| 258-09-01 | 09 | 6 | RABI-06 | T-258-09 | Original and normalized source domains stay distinct | integration | `vitest account-revisions.test.ts python-subprocess-adapter.test.ts` | ✅ | ⬜ pending |
| 258-09-02 | 09 | 6 | RABI-01/03/05/08 | T-258-09 | Python raw boundary has exact ownership | integration | `pnpm --filter @cowards/runtime-python test` | ✅ | ⬜ pending |
| 258-10-01 | 10 | 6 | RABI-01/03/05/08 | T-258-10 | WASM host owns envelope and trap attribution | integration | `pnpm --filter @cowards/runtime-wasm-wasi test` | ✅ | ⬜ pending |
| 258-10-02 | 10 | 6 | RABI-06/07/08 | T-258-10 | Rust/Zig bind exact artifact/toolchain/settings | evaluator | `vitest wasm-wasi-subprocess-adapter.test.ts; evaluate-wasm-wasi-runtime.ts` | ✅ | ⬜ pending |
| 258-11-01 | 11 | 7 | RABI-01/02/03/05/06/08 | T-258-11 | Go canonical/signature/retry parity is exact | integration | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -count=1` | ✅ | ⬜ pending |
| 258-11-02 | 11 | 7 | RABI-04/05 | T-258-11 | Completion/persistence rollback is total | DB integration | `persistence test; go test ./... -count=1` | ✅ | ⬜ pending |
| 258-12-01 | 12 | 8 | RABI-01/03/05/08 | T-258-12 | Signed runtime/preflight ledgers are separate | integration | `spec test; runtime-service test` | ✅ | ⬜ pending |
| 258-12-02 | 12 | 8 | RABI-07/08 | T-258-12 | Missing/incomparable meter is uncertified | preflight | `tsx scripts/preflight.ts; runtime-service test` | ✅ | ⬜ pending |
| 258-13-01 | 13 | 9 | RABI-06/07 | T-258-13 | Identity graph is closed DAG with exact cardinality | adversarial | `vitest runtime-evidence-attestation.test.ts runtime-evidence-authority.test.ts` | ✅ | ⬜ pending |
| 258-13-02 | 13 | 9 | RABI-05/06/08 | T-258-13 | v1.17 parity coexists with immutable v1.16 | integration | `runtime-service test; go test ./... -count=1` | ✅ | ⬜ pending |
| 258-14-01 | 14 | 10 | RABI-01..08 | T-258-14 | Evaluator and guards catch bypass/leak | evaluator | `vitest evaluator/boundary tests; evaluator; integrity-boundaries check` | ✅ | ⬜ pending |
| 258-14-02 | 14 | 10 | RABI-03/05/06/07 | T-258-14 | Current activation is atomic and rollback-safe | DB/e2e | `prove-v1-37-atomic-activation.ts --write --check; boundary:monitors` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [x] Existing Vitest, package, Go and PostgreSQL test infrastructure covers every planned task.
- [x] Plan 02 creates the named shared raw corpus and both language consumers before codec implementation; it uses no broad skip.
- [x] Plans 01–02 freeze calibration and RED fixtures before implementation waves.
- [x] Every task names a non-watch automated command; service-backed database proof is reserved for the final wave.
- [x] Protected historical v1.16 artifacts are verified by hash/dispatch tests, never regenerated in place.

## Manual-Only Verifications

All phase behaviors have automated verification. Operator review of the final public-safe Markdown is supplemental and cannot replace the evaluator/privacy scan.

## Validation Sign-Off

- [x] All tasks have `<automated>` verification.
- [x] Sampling continuity: no three consecutive tasks lack automated verification.
- [x] Wave 0 covers shared fixtures and infrastructure dependencies.
- [x] No watch-mode flags or broad pass-with-no-tests flags.
- [x] Ordinary feedback latency target is under 120 seconds.
- [x] `nyquist_compliant: true` is set.

**Approval:** approved 2026-07-13
