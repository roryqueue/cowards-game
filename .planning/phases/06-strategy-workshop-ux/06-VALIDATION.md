---
phase: 6
slug: strategy-workshop-ux
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-17
---

# Phase 6 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest, Playwright or browser verification for UI |
| **Config file** | `package.json`, `apps/web/package.json`, workspace package configs |
| **Quick run command** | `pnpm --filter @cowards/web typecheck && pnpm --filter @cowards/web test` |
| **Full suite command** | `pnpm verify` |
| **Estimated runtime** | ~90 seconds local full suite, excluding browser/manual dev server checks |

---

## Sampling Rate

- **After every task commit:** Run the relevant package typecheck/test command for touched files.
- **After every plan wave:** Run `pnpm verify`.
- **Before `$gsd-verify-work`:** Full suite must be green and the Workshop must be browser-checked.
- **Max feedback latency:** 5 minutes during implementation.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | UX-01, UX-02, UX-03, UX-04, UX-05, UX-06 | T-06-01 | Web/API code validates and persists source but does not execute Strategy runtime behavior | unit/integration | `pnpm --filter @cowards/web test` | W0 | pending |
| 06-02-01 | 02 | 2 | UX-01, UX-02, UX-03 | T-06-02 | Client editor cannot bypass server validation for submission | component/browser | `pnpm --filter @cowards/web typecheck` | W0 | pending |
| 06-03-01 | 03 | 2 | UX-04, UX-06 | T-06-03 | Immutable revisions are inserted, not mutated, and invalid drafts are rejected | unit/integration | `pnpm --filter @cowards/persistence test && pnpm --filter @cowards/web test` | W0 | pending |
| 06-04-01 | 04 | 3 | UX-05, UX-06 | T-06-04 | Test launch enqueues MatchSets through persistence services and never runs Strategy code in web/API process | integration | `pnpm --filter @cowards/web test && pnpm --filter @cowards/persistence test` | W0 | pending |
| 06-05-01 | 05 | 4 | UX-01, UX-02, UX-03, UX-04, UX-05, UX-06 | T-06-05 | UI exposes pending/running/complete truthfully and does not expose opponent source or private replay data | browser/e2e | `pnpm verify` plus browser check | W0 | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] Add or configure a web test surface if `apps/web` still has no useful tests.
- [ ] Add a browser verification path for Monaco rendering and responsive Workshop layout.
- [ ] Add template validation tests before relying on bundled doctrine samples.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Monaco render and resize quality | UX-01 | Monaco canvas/DOM rendering needs browser confirmation | Start `pnpm --filter @cowards/web dev`, open the Workshop, verify editor is visible, editable, non-overlapping, and responsive on desktop and mobile widths. |
| End-to-end Workshop feel | UX-01..UX-06 | First authoring experience quality is partly ergonomic | Load a template, edit source, wait for live validation, submit a revision, select it from history, launch smoke test, and confirm status/result display. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify commands or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags in verification commands.
- [ ] Feedback latency < 5 minutes.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
