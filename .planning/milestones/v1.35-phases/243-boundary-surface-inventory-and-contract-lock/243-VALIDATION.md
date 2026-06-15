---
phase: 243
slug: boundary-surface-inventory-and-contract-lock
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-14
---

# Phase 243 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest, Go test |
| **Config file** | `vitest.config.ts`, `apps/web/vitest.config.ts`, `apps/go-backend/go.mod` |
| **Quick run command** | `pnpm exec vitest run scripts/evaluate-v1-35-boundary-surface-inventory.test.ts scripts/check-boundary-monitors.test.ts apps/web/app/matches/[matchId]/replay/owner-debug.test.ts packages/spec/src/workshop-checker.test.ts` |
| **Go quick command** | `cd apps/go-backend && go test ./...` |
| **Full suite command** | `pnpm test:fast` and, if monitor/proof inputs are changed, `pnpm boundary:monitors` |
| **Estimated runtime** | ~60-300 seconds, depending on whether `boundary:monitors` is required |

---

## Sampling Rate

- **After every task commit:** Run the focused Vitest or Go command that covers the edited artifact, script, or characterization test.
- **After every plan wave:** Run `pnpm test:fast`; also run `cd apps/go-backend && go test ./...` if Go-owned inventory or characterization coverage changed.
- **Before `$gsd-verify-work`:** Run `pnpm test:fast`; run `pnpm boundary:monitors` if Phase 243 wires a new inventory check into monitor inputs or changes monitor/proof scripts.
- **Max feedback latency:** 300 seconds for focused checks; longer `boundary:monitors` runs are phase-gate only.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 243-01-01 | 01 | 1 | INV-01 | T-243-01 | Inventory includes every required surface group and code/artifact/test reference without exposing private runtime data. | script/unit | `pnpm exec vitest run scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` | Missing until Wave 0 creates script/test | pending |
| 243-01-02 | 01 | 1 | INV-02 | T-243-02 | Every inventory row has disposition, owners, trust boundary, data class, tests/proof, privacy risks, and downstream phase. | script/unit | `pnpm exec vitest run scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` | Missing until Wave 0 creates script/test | pending |
| 243-01-03 | 01 | 1 | INV-03 | T-243-03 | Locked decision register exists before behavior changes and is machine-checkable by later phases. | static/check | `pnpm exec tsx scripts/evaluate-v1-35-boundary-surface-inventory.ts --check` | Missing until Wave 0 creates script | pending |
| 243-01-04 | 01 | 1 | INV-01, INV-02 | T-243-04 | Current TypeScript account-save/provider-proof drift is recorded as an inventory finding, not silently fixed in Phase 243. | Go/static characterization | `cd apps/go-backend && go test ./...` plus inventory evaluator | Partial existing Go coverage; drift-specific row absent | pending |
| 243-01-05 | 01 | 1 | INV-01, INV-02 | T-243-05 | Owner-debug, local Workshop identity, and private replay/source surfaces are inventoried with public/default privacy boundaries. | unit/static | `pnpm exec vitest run apps/web/app/matches/[matchId]/replay/owner-debug.test.ts apps/web/app/workshop/workshop-client.test.tsx` plus inventory evaluator | Existing unit coverage; v1.35 row coverage absent | pending |
| 243-01-06 | 01 | 1 | INV-01, INV-02 | T-243-06 | Workshop compatibility aliases, sandbox labels, TinyGo visibility, and package-policy surfaces are classified without overclaiming support or isolation. | script/unit | `pnpm exec vitest run scripts/evaluate-v1-35-boundary-surface-inventory.test.ts scripts/check-boundary-monitors.test.ts packages/spec/src/workshop-checker.test.ts` | Partial existing coverage; v1.35 row coverage absent | pending |

---

## Wave 0 Requirements

- [ ] `scripts/evaluate-v1-35-boundary-surface-inventory.ts` - deterministic checker for required inventory groups, row fields, dispositions, privacy markers, downstream phases, and forbidden omissions.
- [ ] `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` - focused tests for missing groups, missing row fields, invalid dispositions, stale references, and forbidden public/default data classes.
- [ ] `.planning/artifacts/v1.35-boundary-surface-inventory.md` - human-readable authoritative inventory and decision register.
- [ ] `.planning/artifacts/v1.35-boundary-surface-inventory.json` - monitor-friendly row data consumed by the evaluator.
- [ ] Optional `scripts/check-boundary-monitors.ts` integration only if the evaluator is deterministic and not environment-sensitive.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Row judgment quality for downstream phase assignment | INV-02, INV-03 | A script can require fields and allowed values, but cannot prove that every disposition is strategically correct. | Review `.planning/artifacts/v1.35-boundary-surface-inventory.md` and confirm each row has an appropriate downstream phase: 244 for account/provider proof, 245 for ownership/debug/aliases, 246 for sandbox labels, 247 for package policy, or 248 for proof/privacy monitors. |
| No behavior-changing fixes in Phase 243 | INV-03 | This is a scope judgment across all changed files. | Confirm code changes are limited to artifacts, deterministic inventory evaluators, monitor wiring, and characterization tests. Behavior-changing fixes must be recorded as downstream findings, not implemented here. |

---

## Validation Sign-Off

- [x] All planned task classes have automated verify commands or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks should proceed without an automated inventory evaluator or focused unit check.
- [x] Wave 0 covers all missing validation references.
- [x] No watch-mode flags.
- [x] Feedback latency target documented.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending execution
