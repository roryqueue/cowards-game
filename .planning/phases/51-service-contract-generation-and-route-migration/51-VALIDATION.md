---
phase: 51
slug: service-contract-generation-and-route-migration
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-22
---

# Phase 51 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 for TypeScript packages; Redocly CLI 2.31.4 for OpenAPI lint after install |
| **Config file** | Root Vitest workspace/package scripts; `packages/spec/package.json`; `packages/service/package.json`; `apps/web/package.json` |
| **Quick run command** | `pnpm --filter @cowards/spec test && pnpm --filter @cowards/service test` |
| **Full suite command** | `pnpm test:fast` |
| **Estimated runtime** | ~120 seconds for full suite; <30 seconds for focused package tests |

---

## Sampling Rate

- **After every task commit:** Run the task's focused automated command from the plan.
- **After every plan wave:** Run `pnpm --filter @cowards/spec test && pnpm --filter @cowards/service test`.
- **Before `$gsd-verify-work`:** Run `pnpm test:fast`.
- **Max feedback latency:** 120 seconds for full local feedback.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 51-01-01 | 01 | 1 | GEN-01, GEN-02, GEN-04 | T-51-01-02 / T-51-01-03 | Public schema metadata excludes private Strategy/runtime fields | unit/typecheck | `pnpm --filter @cowards/spec typecheck` | ✅ | ⬜ pending |
| 51-01-02 | 01 | 1 | GEN-02, GEN-04 | T-51-01-02 | Public examples pass leak scanner | unit | `pnpm --filter @cowards/spec test` | ❌ W0 | ⬜ pending |
| 51-01-03 | 01 | 1 | GEN-01, GEN-03 | T-51-01-01 / T-51-01-04 | Generated artifact is reproducible and linted | script/lint | `pnpm --filter @cowards/spec contract:check && pnpm contract:lint` | ❌ W0 | ⬜ pending |
| 51-02-01 | 02 | 2 | GEN-04, GEN-05, GEN-06 | T-51-02-01 | Public Strategy page service DTO is privacy-safe | unit | `pnpm --filter @cowards/service test` | ✅ | ⬜ pending |
| 51-02-02 | 02 | 2 | GEN-05, GEN-06 | T-51-02-02 | Migrated reads preserve DTO behavior and public errors | web/unit | `pnpm --filter @cowards/web test` | ✅ | ⬜ pending |
| 51-03-01 | 03 | 3 | GEN-03, GEN-07 | T-51-03-01 | Named migrated routes fail on direct forbidden imports | script/test | `pnpm boundary:imports` | ❌ W0 | ⬜ pending |
| 51-03-02 | 03 | 3 | GEN-07 | T-51-03-02 | Broad app scan reports debt without blocking | script/test | `pnpm boundary:imports -- --report-only` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/spec/src/service-contract.test.ts` — route metadata and public leak tests for GEN-02 and GEN-04.
- [ ] `packages/spec/scripts/generate-service-openapi.ts` — deterministic generation and stale-output check for GEN-01 and GEN-03.
- [ ] `packages/spec/artifacts/service-api-v1.8.openapi.json` — committed generated artifact for review and Phase 52 parity.
- [ ] Import guard script/test command — strict named-slice direct import failures and report-only broad scan for GEN-07.
- [ ] `@redocly/cli@2.31.4` — OpenAPI lint dependency.

---

## Manual-Only Verifications

All Phase 51 behaviors have automated verification. Manual review is still useful for generated artifact readability and route-slice sanity, but is not required as the only validation path.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-22
