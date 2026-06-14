---
phase: 244
slug: account-revision-provider-proof-and-entry-gates
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-14
---

# Phase 244 - Validation Strategy

> Per-phase validation contract for provider-proof-backed account save and entry readiness.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Go `testing`, Vitest, deterministic TypeScript proof evaluators |
| **Config file** | `apps/go-backend/go.mod`, `vitest.config.ts`, package workspace scripts |
| **Quick run command** | `cd apps/go-backend && go test ./... -run 'TestRuntimeServiceClient|TestProviderReadiness|Test.*Runtime.*Play|Test.*Entry'` |
| **TypeScript quick command** | `pnpm --filter @cowards/runtime-service test -- server.test.ts && pnpm --filter @cowards/persistence test -- competition.test.ts ladder.test.ts` |
| **Phase proof command** | `pnpm exec vitest run scripts/evaluate-v1-35-account-provider-entry-proof.test.ts scripts/check-boundary-monitors.test.ts` |
| **Full suite command** | `pnpm test:fast`, plus `pnpm boundary:monitors` after monitor/proof wiring |
| **DB-backed command** | Existing Go/PostgreSQL service-backed account-save tests after `pnpm services:up` or documented equivalent; if PostgreSQL is unavailable, run the required deterministic substitute described below |
| **Estimated runtime** | ~60-300 seconds for focused checks; DB/service-backed proof depends on local service startup |

---

## Sampling Rate

- **After every task commit:** Run the focused Go/Vitest command named in the task.
- **After every plan wave:** Run the wave's full verification command and any upstream helper/client tests affected by shared provider-proof logic.
- **Before execution wrap:** Run `pnpm test:fast`; run `pnpm boundary:monitors` after Plan 04 monitor wiring.
- **DB/service caveat:** Account-save persistence proof is required for ACCT-02/ACCT-03. Prefer existing DB-backed Go tests with local services started. If PostgreSQL is unavailable, the executor must add and run a deterministic substitute proving `createStrategyRevision`/the save-path assembly passes provider runtime, validation, engine compatibility, source identity, artifact identity, and provider proof metadata into `accountRevisionInsert`.
- **Max feedback latency:** 300 seconds for focused checks; service startup may exceed this and must be recorded in the summary.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 244-01-01 | 01 | 1 | ACCT-01, ACCT-04, ACCT-05 | T-244-01-01 | Go client accepts TypeScript provider validation only through runtime-service and fails closed on malformed/mismatched/oversized responses. | Go client unit + runtime-service Vitest | `cd apps/go-backend && go test ./... -run TestRuntimeServiceClient` and `pnpm --filter @cowards/runtime-service test -- server.test.ts` | Existing files, missing TS parity cases | pending |
| 244-02-01 | 02 | 2 | ACCT-02, ACCT-03, ACCT-04, ACCT-05 | T-244-02-02 | Provider-readiness helper separates execution-ready, invalid/non-execution draft, unavailable/system, and proof-invalid states. | Go unit/table | `cd apps/go-backend && go test ./... -run TestProviderReadiness` | Missing until Wave 2 adds helper/test | pending |
| 244-02-02 | 02 | 2 | ACCT-02, ACCT-03 | T-244-02-02, T-244-02-03 | Account-save path persists proof-backed runtime/validation/engine/source/artifact/provider metadata or deterministically proves those fields reach `accountRevisionInsert`. | Go DB integration or deterministic save-path substitute | `cd apps/go-backend && go test ./... -run 'Test.*Account.*Revision|Test.*CreateStrategyRevision|TestProviderReadiness'` | Partial existing save path; proof-specific coverage missing | pending |
| 244-03-01 | 03 | 3 | ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04 | T-244-03-01, T-244-03-02 | Counted and non-counted Go entry gates require provider proof for TypeScript/Python/Rust/Zig and reject package/TinyGo/proof/runtime negatives. | Go + persistence unit/table | `cd apps/go-backend && go test ./... -run 'Test.*Runtime.*Play|Test.*Entry'` and `pnpm --filter @cowards/persistence test -- competition.test.ts ladder.test.ts` | Existing files, missing matrix cases | pending |
| 244-03-02 | 03 | 3 | ENTRY-02, ENTRY-03 | T-244-03-03 | Entry path still rejects invalid owner/revision state: missing revision, wrong owner, and invalid validation state. | Go entry/loadOwnedEntrants regression | `cd apps/go-backend && go test ./... -run 'Test.*Entry|Test.*LoadOwnedEntrants|Test.*Ownership'` | Existing ownership checks, missing explicit Phase 244 regression | pending |
| 244-03-03 | 03 | 3 | ENTRY-04 | T-244-03-05 | Public Strategy, result, and replay-facing labels derive from provider proof and registry policy; TypeScript missing-proof rows do not display local/dev fallback or counted-ready labels. | Go public DTO + spec schema + web page/view-model tests | `cd apps/go-backend && go test ./... -run 'Test.*Runtime.*Semantics|Test.*PublicStrategy'`, `pnpm --filter @cowards/spec test -- schemas.test.ts service.test.ts`, and `pnpm --filter @cowards/web test -- public-go-read-client.test.ts result-view-model.test.ts` | Existing public/read surfaces, missing proof-aware label coverage | pending |
| 244-04-01 | 04 | 4 | ACCT-01..ACCT-05, ENTRY-01..ENTRY-04 | T-244-04-01 | Proof artifact records implemented account/provider/entry evidence without overclaims or private markers. | Vitest proof evaluator | `pnpm exec vitest run scripts/evaluate-v1-35-account-provider-entry-proof.test.ts` | Missing until Wave 4 | pending |
| 244-04-02 | 04 | 4 | ACCT-01..ACCT-05, ENTRY-01..ENTRY-04 | T-244-04-02 | Boundary monitor fails on stale proof artifact, missing TS provider validation evidence, entry parity omissions, TinyGo/package/sandbox overclaims, or private markers. | static monitor | `pnpm boundary:monitors` | Missing until Wave 4 | pending |

---

## Wave 0 Requirements

- [ ] TypeScript `/validate-strategy` Go client tests before changing `runtime_service_client.go`.
- [ ] Provider readiness helper tests before adding `provider_readiness.go`.
- [ ] Account-save persistence or deterministic save-path substitute test before wiring `createStrategyRevision`.
- [ ] Entry parity matrix tests, including invalid owner/revision state, before changing entry helpers.
- [ ] Public Strategy/result/replay-facing label tests before changing public DTO/page/view-model semantics.
- [ ] Phase 244 proof evaluator tests before adding proof artifacts and monitor wiring.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Draft semantics are not misleading | ACCT-03, ACCT-04 | Tests can assert fields/categories, but human review confirms product wording does not imply readiness. | Review account-save response labels and proof artifact language for invalid/unavailable/draft states. |
| Phase boundary discipline | All Phase 244 requirements | The phase must not pull in Phase 245 auth/alias work, Phase 246 sandbox labels, Phase 247 package policy, or Phase 248 final privacy scans. | Review changed files and summaries; behavior changes should be limited to account save, provider proof readiness, entry gates, and Phase 244 proof/monitor artifacts. |

---

## Validation Sign-Off

- [x] All planned task classes have automated verify commands or explicit Wave 0 dependencies.
- [x] Account-save persistence evidence is required, with a deterministic fallback if local PostgreSQL is unavailable.
- [x] Invalid owner/revision state is explicitly required for ENTRY-02 coverage.
- [x] No watch-mode flags.
- [x] Feedback latency target documented.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending execution
