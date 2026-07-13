---
phase: 256
slug: counted-safety-and-canonical-authority
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-12
---

# Phase 256 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6, Go test, PostgreSQL integration harness |
| **Config file** | `vitest.config.ts`, `apps/go-backend/go.mod`, `docker-compose.yml` |
| **Quick run command** | `pnpm --filter @cowards/spec exec vitest run src/integrity-authority.test.ts src/runtime-evidence.test.ts` |
| **Full suite command** | `pnpm test && (cd apps/go-backend && go test ./...) && pnpm boundary:monitors` |
| **Estimated runtime** | ~300 seconds |

## Sampling Rate

- **After every task commit:** Run the affected focused Vitest or Go test plus tuple hash vectors.
- **After every plan wave:** Run focused spec, persistence, runtime-service, Go, migration, boundary, and privacy gates.
- **Before `$gsd-verify-work`:** Full suite must be green and the committed audit reproduction snapshot must match current HEAD.
- **Max feedback latency:** 300 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 256-W0-01 | 01 | 1 | AUTH-01, AUTH-02, AUTH-05 | T-256-01 | Exact owner registry and tuple hash vectors reject duplication and drift | unit/structural | `pnpm --filter @cowards/spec exec vitest run src/integrity-authority.test.ts` | ❌ W0 | ⬜ pending |
| 256-W0-02 | 02 | 2 | SAFE-01, SAFE-02, SAFE-04, AUTH-03 | T-256-02 | Eligibility derives only from exact current evidence and emits safe projections | unit/privacy | `pnpm --filter @cowards/spec exec vitest run src/runtime-evidence.test.ts` | ❌ W0 | ⬜ pending |
| 256-W0-03 | 04, 07 | 4-6 | SAFE-03, AUTH-02, AUTH-03, AUTH-04 | T-256-05, T-256-08 | Current standings points require exact tuple resolution plus certified evidence for every entrant; only explicitly resolved v1.4 history retains original-semantic eligibility, and all source rows remain immutable through append/compensate/recompute | integration | `pnpm --filter @cowards/persistence exec vitest run src/integrity-evidence.test.ts src/governance.test.ts src/standings-recompute.test.ts` | ❌ W0 | ⬜ pending |
| 256-W0-04 | 09, 17 | 4-7 | SAFE-01, SAFE-02, AUTH-03 | T-256-10, T-256-19 | Runtime-service independently verifies a mounted signed bundle, enforces pinned/durable anti-rollback before listen and refresh, migrates every request builder to reference-only fixture authority, and aborts stale/mismatched evidence as system failure | integration/parity | `pnpm --filter @cowards/runtime-service typecheck && pnpm --filter @cowards/runtime-service test` | ❌ W0 | ⬜ pending |
| 256-W0-05 | 10-12 | 7-8 | SAFE-01, SAFE-02, AUTH-02, AUTH-03 | T-256-12, T-256-13, T-256-14 | Go independently verifies/anchors the same bundle, requires an exact immutable installed-publication receipt/source set before creation inserts, preserves per-entrant ordered-pair evidence through claim/completion, and treats later receipt uncertainty as no-mutation system failure | integration/parity | `cd apps/go-backend && go test ./...` | ❌ W0 | ⬜ pending |
| 256-W0-06 | 14, 16, 19 | 2, 7-10 | SAFE-04, AUTH-01, AUTH-05 | T-256-16, T-256-17, T-256-20, T-256-23, T-256-24, T-256-25 | Synthetic duplicate authorities, publisher/anti-rollback bypasses, every caller/writer bypass, unsafe evidence projections, direct-worker reachability, and version-mixed historical validation fail closed | structural/privacy/history | `pnpm exec vitest run scripts/check-v1-37-integrity-boundaries.test.ts scripts/check-v1-37-worker-retirement.test.ts scripts/check-v1-36-historical-proof.test.ts && pnpm boundary:monitors` | ❌ W0 | ⬜ pending |
| 256-W0-07 | 15 | 5 | SAFE-01, SAFE-02, AUTH-03 | T-256-18 | Forged, docs-only, renamed-gate, missing-artifact, fixture-domain, and unverifiable attestations cannot create certificates | unit/integration | `pnpm --filter @cowards/spec exec vitest run src/runtime-evidence-attestation.test.ts && pnpm --filter @cowards/persistence exec vitest run src/runtime-evidence-import.test.ts` | ❌ W0 | ⬜ pending |
| 256-W0-08 | 18 | 6 | SAFE-01, SAFE-02, AUTH-01, AUTH-03, AUTH-05 | T-256-21, T-256-22 | Authenticated lane controls plus exact certificate revocation/supersession imports reject forged/wrong-target/unknown/replay/conflict/cycle/missing-evidence cases with zero rows, and only verified closed records publish with selected-record provenance through external signing and last-good-preserving installation | integration/security | `pnpm --filter @cowards/persistence exec vitest run src/runtime-evidence-authority-publisher.test.ts && pnpm exec vitest run scripts/publish-v1-37-runtime-evidence-authority.test.ts` | ❌ W0 | ⬜ pending |

## Wave 0 Requirements

- [ ] `packages/spec/src/integrity-authority.test.ts` — owner/tuple registry and cross-language hash vectors.
- [ ] `packages/spec/src/runtime-evidence.test.ts` — exact certificates, status derivation, and public projection.
- [ ] `packages/spec/src/runtime-evidence-attestation.test.ts` — closed trusted evidence graph and forgery rejection.
- [ ] `packages/spec/src/runtime-evidence-authority-bundle.test.ts` — signed envelope/hash/refresh/reference vectors.
- [ ] `packages/persistence/src/integrity-evidence.test.ts` — append-only storage, legacy resolution, cohort action, and compensation.
- [ ] `packages/persistence/src/runtime-evidence-import.test.ts` — sole verified certificate import and zero-row forgery proof.
- [ ] `packages/persistence/src/runtime-evidence-authority-publisher.test.ts` — authenticated lane/revocation/supersession imports, invalid zero-row matrix, locked snapshot, selected-record publication provenance, concurrency, and PostgreSQL immutability proof.
- [ ] `scripts/publish-v1-37-runtime-evidence-authority.test.ts` — external signer and temp-write/file-fsync/rename/directory-fsync/last-good/reconciliation failures.
- [ ] `apps/runtime-service/src/counted-safety.test.ts` — request-time and in-flight identity mismatch.
- [ ] `apps/runtime-service/src/runtime-evidence-authority.test.ts` — startup/pre/post mounted authority verification plus deployment pin, durable high-water, restart rollback, and anchor-write failures.
- [ ] `apps/runtime-service/src/execute-match.test.ts` and `four-language-parity.test.ts` — every request builder uses reference-only fixture-domain authority identities that production mode rejects.
- [ ] `apps/go-backend/integrity_evidence_test.go` — schedule/claim/execute parity and tuple vectors.
- [ ] `apps/go-backend/integrity_creation_test.go` — immutable installed-receipt lock-before-insert, exact source-set equality, missing/failed/uncertain/mismatched and post-rename/pre-receipt zero-row cases, successful reconciliation, and receipt identity propagation.
- [ ] `apps/go-backend/runtime_evidence_authority_test.go` — independent Go bundle/signature/hash parity plus deployment pin, durable high-water, restart rollback, and anchor-write failures.
- [ ] `apps/go-backend/main_test.go` — invalid authority fails before `NewLiveServer` returns, orchestrator starts, or HTTP listen becomes reachable.
- [ ] `scripts/check-v1-37-integrity-boundaries.test.ts` — authority, duplicate-route, and privacy monitor fixtures.
- [ ] `scripts/check-v1-37-worker-retirement.test.ts` — all-purpose before-claim retirement and structural-bypass fixtures.
- [ ] `scripts/check-v1-36-historical-proof.test.ts` — pinned archived artifact/source dispatch, current-monitor independence, tamper/drop rejection, and no-rewrite proof.

## Manual-Only Verifications

All phase behaviors have automated verification. Operator/public presentation realism is exercised later in the milestone's integrated browser proof without replacing these contract gates.

## Validation Sign-Off

- [x] All planned task classes have an automated verifier or an explicit Wave 0 dependency.
- [x] Sampling continuity prevents three consecutive tasks without automated feedback.
- [x] Wave 0 covers every missing test reference identified by research.
- [x] No watch-mode flags are used.
- [x] Feedback latency target is under five minutes for focused gates.
- [x] `nyquist_compliant: true` is set in frontmatter.

**Approval:** approved by autonomous milestone execution request, 2026-07-12
