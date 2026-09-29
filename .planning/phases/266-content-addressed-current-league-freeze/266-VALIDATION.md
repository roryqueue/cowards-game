---
phase: 266
slug: content-addressed-current-league-freeze
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-23
---

# Phase 266 — Validation Strategy

> Source-only checks may proceed before Phase 265 closes. The cycle-free order is Wave 1 `266-01 + 266-06`, Wave 2 `266-02 + 266-03`, Wave 3 `266-04`, Wave 4 `266-05`. Plan 06's independent exact-source review is an inter-wave gate before Plan 02; Plan 04 independently rereviews integrated source. A real freeze preflight, publication and `--check` require a complete independently verified retained Phase 265 league result and the original unopened seal; synthetic fixtures never substitute.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6, TypeScript 6.0.3 |
| Config file | Existing workspace Vitest and `packages/strategy-lab/tsconfig.json` |
| Quick run command | `pnpm exec vitest run --maxWorkers=1 scripts/lib/v1-38-current-freeze-parent-context.test.ts scripts/lib/v1-38-current-freeze-inventory.test.ts packages/strategy-lab/src/league/freeze.test.ts` once each file exists |
| Full source-suite commands | Focused Vitest for factory/league repository observer tests, `v1-38-current-freeze-parent-context.test.ts`, `v1-38-current-freeze-inventory.test.ts`, `v1-38-current-freeze-authentication.test.ts`, `freeze-v1-38-current-league.test.ts`, `verify-v1-38-local-seal.test.ts`, `freeze.test.ts`, and `freeze-finalists.test.ts`; `pnpm exec tsc -b packages/strategy-lab/tsconfig.json --pretty false`; strict script TypeScript for parent-context/inventory/carriers/authentication/publication/expected-root/CLI; both existing lab and serious-league boundary commands; `pnpm exec turbo test --concurrency=1` after each source-review freeze |
| Estimated runtime | Measure after the source-only files exist; do not claim a feedback-time bound from missing tests |

## Sampling Rate

- After each source task: run its exact `<verify><automated>` command; after the corresponding files exist, run the quick command.
- Before Plan 02: complete Plan 06 Task 3's focused and serialized full applicable source suite, independent zero-actionable review, and exact reviewed-source record; changed source requires rerun and rereview.
- After each wave: run the applicable full Phase 266 source suite, not an empirical league replay. Before Plan 05, Plan 04 reviews the integrated Plan 06/02/04 source and pins its distinct source-review record.
- Before `$gsd-verify-work`: source suite and, only if real prerequisites exist, read-only retained-evidence preflight and final `--check` must pass. A blocked empirical gate is recorded as blocked, never a synthetic pass.
- Max feedback latency: measure during source execution; a long historical reopener may require a separately bounded source gate rather than every task.

## Per-Task Verification Map

The six plans pass the plan-structure check. Commands below summarize task-local `<verify>` gates; source-only fixtures never prove a real store scan.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 266-01/T1–T2 | 01 | 1 | FRZE-01, FRZE-04 | leaf substitution, incomplete charge | Typed leaf/root and every charge reject mismatch; synthetic non-pass is representable but non-authorizing | unit | `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/league/freeze.test.ts` | planned | ⬜ pending |
| 266-06/T0 | 06 | 1 | FRZE-01, FRZE-02 | forged or omitted read set | Opt-in post-validation artifact observers preserve ordinary repository semantics; the checker constructs observers itself and cannot trust caller lists | unit | Factory/league repository Vitest only; parent-context tests begin in T1 | planned | ⬜ pending |
| 266-06/T1 | 06 | 1 | FRZE-01, FRZE-02 | raw role spoofing, unobserved journals | Exact packet/proposal/source, complete matrix/snapshot/cell payoff and report joins; factory/league/response journals reopen through no-follow non-mutating reads | unit | `pnpm exec vitest run --maxWorkers=1 scripts/lib/v1-38-current-freeze-parent-context.test.ts` | planned | ⬜ pending |
| 266-06/T2 | 06 | 1 | FRZE-01, FRZE-02 | tag-only/orphan admission | Closed producer/history-kind registry and exact physical factory/response/league sets reject unknown, missing and orphan bytes; compatible duplicate edges remain explicit | unit | Parent-context Vitest plus strict script TypeScript and lab boundary command | planned | ⬜ pending |
| 266-06/T3 | 06 | 1→2 gate | FRZE-01, FRZE-02 | unreviewed upstream map | Independent zero-actionable exact-source review over observer and context source; changed bytes require rerun and rereview before Plan 02 | source review | Repository/parent-context Vitest, package and strict script TypeScript, lab boundary command, `pnpm exec turbo test --concurrency=1` | review record planned | ⬜ pending |
| 266-02/T1 | 02 | 2 | FRZE-02 | hidden scope/opaque direct-root file | Freshly checked Plan 06 map supplies path roles; exact reviewed root-entry bytes admit only policy prose | unit | `pnpm exec vitest run --maxWorkers=1 scripts/lib/v1-38-current-freeze-inventory.test.ts` | planned | ⬜ pending |
| 266-02/T2 | 02 | 2 | FRZE-02 | hidden carrier/scale bypass | All forbidden classes and carrier parent links reject; projected-scale scan remains bounded | unit | Parent-context and inventory Vitest, strict script TypeScript, lab boundary command | planned | ⬜ pending |
| 266-03/T1–T2 | 03 | 2 | FRZE-03 | seal opening/false finalist | Original committed seal inspection is read-only; exact source-hash preliminary receipts retain failures and empty list | unit | `pnpm exec vitest run --maxWorkers=1 scripts/verify-v1-38-local-seal.test.ts packages/strategy-lab/src/league/freeze-finalists.test.ts` | planned | ⬜ pending |
| 266-04/T1–T2 | 04 | 3 | FRZE-01–04 | false empirical/root authority | Recheck Plan 06 context and Plan 02 absence, retained graph/custody/verification, staged private leaves and safe projection | integration | `pnpm exec vitest run --maxWorkers=1 scripts/lib/v1-38-current-freeze-authentication.test.ts scripts/freeze-v1-38-current-league.test.ts` plus strict TypeScript | planned | ⬜ pending |
| 266-04/T3 | 04 | 3→4 gate | FRZE-01–04 | integrated source drift | Full source suite and independent zero-actionable review of Plans 06/02/04; E0/E1 path-byte review remains distinct | source review | Full source-suite commands above and `--check-source-review` command in Plan 04 | review record planned | ⬜ pending |
| 266-05/T1 | 05 | 4 | FRZE-01–04 | premature real freeze | Complete independently verified Phase 265 head, actual unopened seal and same-epoch checked raw map/absence are required | real read-only gate | Exact `--preflight` command in Plan 05; nonzero is a blocking result, not a pass | unavailable | ⬜ blocked upstream |
| 266-05/T2 | 05 | 4 | FRZE-01–04 | false publication | E1-reviewed expected root, exact checked raw map/absence, no-replace publication, independent read-only check | real gated integration | Exact `--check` command in Plan 05 only after successful write | unavailable | ⬜ blocked upstream |

## Source-Test Scaffold Requirements

- [ ] Plan 06 creates verified-read observer fixtures, historical Git-blob source-root fixtures, actual-format raw parent fixtures, non-mutating direct-journal/temporary-file controls, complete history/physical-set reconciliations, compatible duplicate-edge and incompatible-parent mutations for source, payoff, report, untagged kinds and orphan objects before Plan 02 consumes a checked map.
- [ ] Plan 02 creates inventory canaries for all configured scopes, direct-root opaque files and each forbidden class, with reviewed policy prose as a negative control.
- [ ] Plans 01/03 create source-only freeze graph and fake restricted-store seal/finalist fixtures, with no real holdout preimage.
- [ ] Measure focused and full source-suite feedback times; keep `nyquist_compliant: false` until executed evidence exists.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Independent interpretation of complete real Phase 265 evidence and freeze claim scope | FRZE-01, FRZE-03, FRZE-04 | Source tests cannot attest actual source/custody completeness or a sealed operator-local store | After Phase 265 retained verification, independently inspect exact manifest and privacy-safe projection, actual unopened commitment/ledger receipt, charged evidence closure, finalist eligibility, and empty-eligibility branch if applicable. Do not query the holdout preimage. |

## Validation Sign-Off

- [ ] Every finalized task has an automated check or explicit Wave 0 dependency.
- [ ] No three consecutive source tasks lack an automated check.
- [ ] Source-test scaffolds cover every currently missing Plan 06/02/01/03/04 test reference.
- [ ] No watch-mode flags or source-only fixture is represented as empirical proof.
- [ ] Actual quick feedback latency is measured and recorded.
- [ ] `nyquist_compliant: true` is set only after all evidence above is complete.

**Approval:** six-plan planning checked; source-only execution and independent reviews pending. Phase 265 empirical closure and the original unopened seal remain blockers to real Plan 05.
