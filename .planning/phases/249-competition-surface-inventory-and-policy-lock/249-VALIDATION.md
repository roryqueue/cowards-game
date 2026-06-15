---
phase: 249
slug: competition-surface-inventory-and-policy-lock
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-15
---

# Phase 249 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm exec vitest run packages/spec/src/spec.test.ts scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts` |
| **Full suite command** | `pnpm test:fast && pnpm boundary:monitors` |
| **Estimated runtime** | ~60-180 seconds focused; repo-level runtime depends on baseline |

---

## Sampling Rate

- **After every task commit:** Run the focused Vitest command for touched spec/evaluator/monitor files.
- **After every plan wave:** Run `pnpm v1.36:competition-policy:check` and `pnpm exec tsx scripts/check-boundary-monitors.ts`.
- **Before `$gsd-verify-work`:** Run `pnpm test:fast` and `pnpm boundary:monitors` where the existing baseline permits; disclose unrelated pre-existing failures.
- **Max feedback latency:** 180 seconds for focused checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 249-01-task-1-policy-tests | 249-01 | 1 | POST-01, POST-02, POST-03 | T-249-01, T-249-02 | Failing tests pin exact public beta posture, reset/no-durable labels, public projection vocabulary, privacy exclusions, forbidden claim categories, and owner vocabulary before implementation. | unit/contract-red | `pnpm exec vitest run packages/spec/src/spec.test.ts` | Existing | pending |
| 249-01-task-2-policy-contract | 249-01 | 1 | POST-01, POST-02, POST-03 | T-249-01, T-249-02, T-249-03, T-249-04 | Spec-owned policy module exports the v1.36 contract and leak-safe public payload without downstream behavior. | unit/contract | `pnpm exec vitest run packages/spec/src/spec.test.ts` | New + existing | pending |
| 249-02-task-1-inventory-tests | 249-02 | 2 | POST-01, POST-02, POST-03, POST-04 | T-249-05, T-249-06, T-249-07, T-249-08 | Failing evaluator tests pin row schema, required surface groups, dispositions, posture labels, privacy markers, forbidden claims, and temp/generated artifact sync behavior. | unit/artifact-red | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts` | New | pending |
| 249-02-task-2-inventory-evaluator | 249-02 | 2 | POST-04 | T-249-05, T-249-06, T-249-07, T-249-08 | Deterministic evaluator validates typed rows and passes using temp/generated fixture artifacts at the task boundary. | unit/artifact | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts` | New | pending |
| 249-02-task-3-inventory-artifacts | 249-02 | 2 | POST-04 | T-249-05, T-249-06, T-249-07 | Markdown and JSON inventory artifacts are generated from the same typed source and current repository artifacts pass `--check`. | unit/artifact-current | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts && pnpm exec tsx scripts/evaluate-v1-36-competition-policy.ts --check` | New | pending |
| 249-03-task-1-monitor-scan-tests | 249-03 | 3 | POST-01, POST-02, POST-05 | T-249-09, T-249-10, T-249-12 | Temp-root tests cover default scan roots, file filtering, forbidden/private markers, required posture labels, package script wiring, and documented false-positive suppressions. | unit/static-monitor-red | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts` | Mixed | pending |
| 249-03-task-2-monitor-scan-implementation | 249-03 | 3 | POST-01, POST-02, POST-05 | T-249-09, T-249-10, T-249-11, T-249-12 | Broad scanner and monitor chain enforce artifact currency, default roots, text filtering, forbidden/private marker absence, posture presence, and documented suppression schema. | unit/static-monitor | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts && pnpm v1.36:competition-policy:check && pnpm exec tsx scripts/check-boundary-monitors.ts` | Mixed | pending |
| 249-03-task-3-final-validation | 249-03 | 3 | POST-01, POST-02, POST-03, POST-04, POST-05 | T-249-09, T-249-10, T-249-11, T-249-12 | Focused Phase 249 gates pass and grep gates show no downstream behavior, Strategy execution, React rules, Node `vm`, or public overclaim scope creep. | integration/static-monitor | `pnpm exec vitest run packages/spec/src/spec.test.ts scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts && pnpm v1.36:competition-policy:check && pnpm exec tsx scripts/check-boundary-monitors.ts` | Mixed | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `packages/spec/src/spec.test.ts` additions for `competition-policy-v1.36` contract and vocabulary.
- [ ] `scripts/evaluate-v1-36-competition-policy.test.ts` for artifact generation, row validation, forbidden claims, required labels, private markers, and Markdown/JSON synchronization.
- [ ] `scripts/check-boundary-monitors.test.ts` additions for package script wiring and named v1.36 monitor registration.
- [ ] Root `package.json` scripts for write/check commands and boundary monitor chain wiring.

---

## Manual-Only Verifications

All Phase 249 behaviors should have automated verification through spec tests, evaluator tests, static monitor tests, and boundary monitor commands.

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 180s for focused checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved for execution after checker-feedback revision
