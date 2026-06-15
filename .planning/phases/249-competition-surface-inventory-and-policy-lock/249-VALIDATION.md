---
phase: 249
slug: competition-surface-inventory-and-policy-lock
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 249-01-contract | TBD | TBD | POST-01, POST-03 | T-249-01 | Policy contract exposes public beta trial posture, resettable Season labels, no durable rating labels, public projection vocabulary, privacy exclusions, and forbidden claim categories/examples. | unit/contract | `pnpm exec vitest run packages/spec/src/spec.test.ts` | Existing | pending |
| 249-02-inventory | TBD | TBD | POST-04 | T-249-02 | Markdown and JSON inventory artifacts are generated from the same typed source and include required row fields/dispositions. | unit/artifact | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts` | New | pending |
| 249-03-copy-monitor | TBD | TBD | POST-01, POST-02, POST-05 | T-249-03 | Forbidden durable-rating, production-sandbox, package-ecosystem, TinyGo-production, raw-diagnostic, and private-runtime overclaims fail loud; required posture labels are present where inventory requires them. | unit/static-monitor | `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts` | Mixed | pending |
| 249-04-boundary-chain | TBD | TBD | POST-05 | T-249-04 | v1.36 monitor is wired into package scripts and the boundary monitor hub without replacing existing v1.35 checks. | integration/static-monitor | `pnpm v1.36:competition-policy:check && pnpm exec tsx scripts/check-boundary-monitors.ts` | New | pending |

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

- [ ] All tasks have automated verify commands or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s for focused checks
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
