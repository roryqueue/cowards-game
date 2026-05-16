---
phase: 1
slug: foundation-and-spec-contracts
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm format:check && pnpm lint && pnpm typecheck` |
| **Full suite command** | `pnpm verify` |
| **Estimated runtime** | ~60 seconds after dependencies are installed |

---

## Sampling Rate

- **After every task commit:** Run `pnpm format:check && pnpm lint && pnpm typecheck` when dependencies/config exist; otherwise run the narrow command introduced by that task.
- **After every plan wave:** Run `pnpm verify`.
- **Before `$gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 90 seconds for scaffold checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | FOUND-01 | — | N/A | config | `pnpm --version && pnpm install --lockfile-only` | ❌ W0 | pending |
| 1-01-02 | 01 | 1 | FOUND-03 | — | N/A | command | `pnpm verify` | ❌ W0 | pending |
| 1-02-01 | 02 | 2 | FOUND-04 | T-1-01 | Boundary rules block unsafe imports | lint | `pnpm lint` | ❌ W0 | pending |
| 1-03-01 | 03 | 2 | SPEC-01 | — | N/A | typecheck | `pnpm typecheck` | ❌ W0 | pending |
| 1-03-02 | 03 | 2 | SPEC-02 | — | Runtime boundary outputs are schema-validated | unit | `pnpm --filter @cowards/spec test` | ❌ W0 | pending |
| 1-04-01 | 04 | 3 | FOUND-02 | T-1-02 | Full dev topology keeps runtime inert | command | `pnpm verify` | ❌ W0 | pending |

*Status: pending until execution creates the files and commands.*

---

## Wave 0 Requirements

- [ ] `package.json` — root scripts for `dev`, `dev:full`, `lint`, `typecheck`, `test`, and `verify`.
- [ ] `pnpm-workspace.yaml` — workspace package globs.
- [ ] `turbo.json` — task graph for build/lint/typecheck/test/dev.
- [ ] `vitest.config.ts` — initial test configuration.
- [ ] `eslint.config.*` — lint and boundary configuration.
- [ ] package-level `tsconfig.json` files — TypeScript references.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Long-running `pnpm dev` and `pnpm dev:full` process behavior | FOUND-02 | Dev servers are intentionally long-running | Start command, confirm web and worker boot messages, then stop processes. |
| Docker service health | FOUND-02 | Depends on local Docker availability | Run `docker compose up -d`, confirm Postgres and Redis containers are healthy or listening, then `docker compose down`. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies.
- [x] Sampling continuity avoids long stretches without automated verification.
- [x] Wave 0 covers all missing test infrastructure references.
- [x] No watch-mode flags are required for automated verification.
- [x] Feedback latency target is under 90 seconds for scaffold checks.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-05-16
