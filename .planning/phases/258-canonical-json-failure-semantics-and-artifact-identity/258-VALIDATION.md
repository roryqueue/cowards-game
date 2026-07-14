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
| **Full suite command** | `PGUSER=cowards PGPASSWORD=cowards DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game scripts/dev-local-postgres.sh --setup-only && DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec tsx scripts/run-v1-37-runtime-abi-test-manifest.ts --stage postactivation --require-all && pnpm exec tsx scripts/check-v1-37-runtime-abi-manifest-closure.ts --write-final --check && pnpm exec tsx scripts/evaluate-v1-37-runtime-abi.ts --write --check && DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec tsx scripts/prove-v1-37-atomic-activation.ts --write --check && pnpm contract:check && pnpm contract:lint && pnpm boundary:imports && pnpm public-discovery:check && pnpm boundary:monitors && pnpm lint && pnpm typecheck && pnpm build` |
| **Estimated runtime** | Focused tasks under 120 seconds; full repository/service proof may take several minutes |

## Sampling Rate

- **After every task commit:** Run that task's exact automated command.
- **After every plan wave:** Run all focused commands introduced or affected by that wave.
- **After Waves 9–12:** Also run exact-manifest Go, persistence, contract and boundary gates because these waves bind cross-process authority.
- **Before `$gsd-verify-work`:** Full repository gates, database-backed atomic activation, evaluator, privacy scan, and immutable-v1.16 checks must be green.
- **Max feedback latency:** 120 seconds for ordinary task feedback; database activation is an explicit end-of-wave exception.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 258-01-01 | 01 | 1 | RABI-01/03/06/07/08 | T-258-01 | Exact ceilings and domains are calibrated | contract | `vitest scripts/calibrate-v1-37-runtime-abi.test.ts; calibration --write --check` | ✅ | ⬜ pending |
| 258-01-02 | 01 | 1 | RABI-01/08 | T-258-01 | Frozen profile rejects ambiguity | unit | `vitest packages/spec/src/runtime-abi-v1-17.test.ts; calibration --check` | ✅ | ⬜ pending |
| 258-02-01 | 02 | 2 | RABI-01/02 | T-258-02 | Raw positive/negative corpus is reproducible | generator | `vitest scripts/generate-canonical-json-v1-1-corpus.test.ts; generator --write --check` | ✅ | ⬜ pending |
| 258-02-02 | 02 | 2 | RABI-01/02/08 | T-258-02 | Exact-sentinel wrapper proves complete TS/Go RED enumeration | contract | `vitest check-canonical-json-v1-1-red.test.ts; RED checker --write --check` | ✅ | ⬜ pending |
| 258-03-01 | 03 | 3 | RABI-01/02 | T-258-03 | Scanner subset greens without full-codec claim | unit | `vitest canonical-json-scan.test.ts` | ✅ | ⬜ pending |
| 258-03-02 | 03 | 3 | RABI-01/02 | T-258-03 | Parser subset greens while exact both-missing RED remains | unit/RED | `vitest canonical-json-parse.test.ts; RED --stage both-missing` | ✅ | ⬜ pending |
| 258-04-01 | 04 | 4 | RABI-01/02 | T-258-04 | Full TS corpus greens and only Go RED remains | unit/RED | `vitest encode+corpus; RED --stage go-missing` | ✅ | ⬜ pending |
| 258-04-02 | 04 | 4 | RABI-06/07 | T-258-04 | Domains and manifest cannot collide | unit | `vitest canonical-identity-domains.test.ts runtime-identity-manifest.test.ts` | ✅ | ⬜ pending |
| 258-05-01 | 05 | 6 | RABI-01/02 | T-258-05 | Boundaries consume Plan-06 schema and bounded codec | integration | `vitest canonical-json-boundaries.test.ts canonical-json-corpus.test.ts` | ✅ | ⬜ pending |
| 258-05-02 | 05 | 6 | RABI-02/03 | T-258-05 | Deep audit returns typed bounded result | regression | `runtime-service test; reproduce-core-rule-gaps.ts` | ✅ | ⬜ pending |
| 258-06-01 | 06 | 5 | RABI-03/04/05 | T-258-06 | Three outcomes are schema-exclusive | unit/type | `vitest runtime-invocation-v1-17.test.ts; spec typecheck` | ✅ | ⬜ pending |
| 258-06-02 | 06 | 5 | RABI-03/05/08 | T-258-06 | Adapter-owned envelope binds full request | contract | `vitest runtime-invocation-v1-17.test.ts service-contract.test.ts` | ✅ | ⬜ pending |
| 258-07-01 | 07 | 7 | RABI-03/04/05 | T-258-07 | Only engine applies player consequence | integration | exact engine files | ✅ | ⬜ pending |
| 258-07-02 | 07 | 7 | RABI-03/05 | T-258-07 | System failure and retry do not mutate | integration | exact service/engine files | ✅ | ⬜ pending |
| 258-08-01 | 08 | 8 | RABI-01/02/03/05/08 | T-258-08 | All TS lanes preserve raw bytes/ownership | integration | exact runtime-js manifest | ✅ | ⬜ pending |
| 258-09-01 | 09 | 8 | RABI-06 | T-258-09 | UI/API and competitive server action preserve exact source | DB/browser | exact web/DB/Go/Playwright manifest | ✅ | ⬜ pending |
| 258-09-02 | 09 | 8 | RABI-01/03/05/08 | T-258-09 | Python raw boundary has exact ownership | integration | exact runtime-python files | ✅ | ⬜ pending |
| 258-10-01 | 10 | 8 | RABI-01/03/05/08 | T-258-10 | WASM host owns envelope/trap attribution | integration | exact WASM files | ✅ | ⬜ pending |
| 258-10-02 | 10 | 8 | RABI-06/07/08 | T-258-10 | Rust/Zig bind exact identity | evaluator | exact WASM evaluator | ✅ | ⬜ pending |
| 258-11-01 | 11 | 9 | RABI-01/02/03/05/06/08 | T-258-11 | Go parity greens final RED stage | integration | `generate-go; RED --stage green; exact Go files` | ✅ | ⬜ pending |
| 258-11-02 | 11 | 9 | RABI-04/05 | T-258-11 | Named DB tests PASS not SKIP | DB integration | exact named DSN tests | ✅ | ⬜ pending |
| 258-12-01 | 12 | 10 | RABI-01/03/05/08 | T-258-12 | Signed ledgers separate | integration | exact spec/service files | ✅ | ⬜ pending |
| 258-12-02 | 12 | 10 | RABI-07/08 | T-258-12 | Missing meter uncertified | preflight | exact preflight/service files | ✅ | ⬜ pending |
| 258-13-01 | 13 | 11 | RABI-06/07 | T-258-13 | Identity graph closed DAG | adversarial | exact evidence files | ✅ | ⬜ pending |
| 258-13-02 | 13 | 11 | RABI-05/06/08 | T-258-13 | Both receipt versions exact | integration | exact generator/service/Go files | ✅ | ⬜ pending |
| 258-14-01 | 14 | 12 | RABI-01..08 | T-258-14 | Preactivation allowlist and exact test manifest green | preactivation | runner `--stage preactivation --require-all` | ✅ | ⬜ pending |
| 258-14-02 | 14 | 12 | RABI-03/05/06/07 | T-258-14 | Small default pointer set flips atomically | activation | runner `--stage activation --require-all` | ✅ | ⬜ pending |
| 258-14-03 | 14 | 12 | RABI-01..08 | T-258-14 | Final hashes/evaluator/DB proof are post-flip | DB/e2e | Full suite command above | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [x] Existing Vitest, package, Go and PostgreSQL test infrastructure covers every planned task.
- [x] Plan 02 uses an outer subprocess verifier that accepts only two exact missing-codec sentinels after complete enumeration; Plans 04/11 own retirement and Plan 14 rejects residue.
- [x] Plans 01–02 freeze calibration and RED fixtures before implementation waves.
- [x] Every task names a non-watch automated command; service-backed database proof is reserved for the final wave.
- [x] The sole Go generator recomputes/checks v1.16 in memory, refuses historical writes, and writes only v1.17/generated Go outputs.
- [x] Protected historical v1.16 artifacts and migration 0017 are verified by hash/dispatch tests, never regenerated in place.
- [x] The final full command supplies both PostgreSQL DSNs and executes persistence, full Go, atomic activation, all runtime packages, repository gates, build, lint and typecheck.
- [x] Residual checks apply only to named Phase-258 consumers/tests; baseline conditional DB skips remain allowed, while named Phase-258 DB tests must report PASS and not SKIP.
- [x] Final activation hashes are generated only after the small default flip.

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
