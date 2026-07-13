---
phase: 256
slug: counted-safety-and-canonical-authority
status: complete
nyquist_compliant: true
wave_0_complete: true
wave_0_current: true
created: 2026-07-12
last_audited: 2026-07-13
audited_head: b2c921a
---

# Phase 256 — Executed Validation Audit

> Adversarial Nyquist audit of all 44 plan tasks and `SAFE-01..04` / `AUTH-01..05` at implementation HEAD `b2c921a`.

## Current Result

- **Task coverage:** 44/44 green.
- **Requirement coverage:** 9/9 green.
- **Test additions:** none by the Nyquist auditor. Existing behavioral suites cover every task class; implementation fix `3d103d4` added the required import/hash/monitor regressions, and artifact fix `b2c921a` restored the complete serialized boundary chain.
- **Protected files:** `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remained untouched by this audit.

## Test Infrastructure and Executed Gates

| Gate | Framework / boundary | Executed command | Result |
|------|----------------------|------------------|--------|
| A | Spec contracts and generators | `pnpm exec tsx scripts/generate-v1-37-integrity-authority.ts --check && pnpm exec tsx scripts/generate-v1-37-runtime-evidence-authority-vectors.ts --check && pnpm --filter @cowards/spec exec vitest run src/integrity-authority.test.ts src/runtime-evidence.test.ts src/runtime-evidence-attestation.test.ts src/runtime-evidence-authority-bundle.test.ts src/competition-entry-eligibility.test.ts src/match-execution-contract.test.ts src/spec.test.ts && pnpm --filter @cowards/spec typecheck` | **green — 119/119** |
| B | Replay compatibility | `pnpm --filter @cowards/replay exec vitest run src/validate.test.ts && pnpm --filter @cowards/replay typecheck` | **green — 22/22** |
| C | Persistence + real PostgreSQL | `DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run --maxWorkers=1 src/migrations.test.ts src/runtime-evidence-import.test.ts src/runtime-evidence-authority-publisher.test.ts src/integrity-evidence.test.ts src/match-service.test.ts src/matchset-service.test.ts src/competition.test.ts src/workshop.test.ts src/dev-smoke.test.ts src/ladder.test.ts src/jobs.test.ts src/chronicle-store.test.ts src/complete-match.test.ts src/governance.test.ts src/standings-recompute.test.ts && pnpm --filter @cowards/persistence typecheck` | **green — 193/193** |
| D | Runtime-service | `pnpm --filter @cowards/runtime-service typecheck && pnpm --filter @cowards/runtime-service test` | **green — 56/56** |
| E | Retired worker | `pnpm --filter @cowards/worker test && pnpm --filter @cowards/worker typecheck` | **green — 34/34** |
| F | Go + real PostgreSQL | `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game go test ./... -count=1` | **green** |
| G | Structural, publisher, history, retirement | `pnpm exec vitest run scripts/publish-v1-37-runtime-evidence-authority.test.ts scripts/check-v1-37-integrity-boundaries.test.ts scripts/check-v1-36-historical-proof.test.ts scripts/check-v1-37-worker-retirement.test.ts` | **green — 52/52** |
| G2 | Canonical lane hash and sole fixture import | `DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run --maxWorkers=1 src/dev-smoke.test.ts src/integrity-evidence.test.ts src/runtime-evidence-import.test.ts` | **green — 32/32** |
| H | Direct executable evidence | `pnpm exec tsx scripts/check-v1-36-historical-proof.ts`; `pnpm exec tsx scripts/check-v1-37-worker-retirement.ts`; `pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` | **green — 8 artifacts / 11 sources; 0 worker findings; exact seven-probe baseline** |
| I | Serialized boundary chain | `pnpm boundary:monitors` | **green — 42/42 boundary rows passed, including v1.37 inventory, immutable v1.36 dispatch, surface labels, runtime authority, privacy, Go parity, worker retirement, and topology** |
| I2 | Surface-label generator drift check | `pnpm exec tsx scripts/generate-typescript-surface-labels.ts --check` plus focused generator/monitor Vitest | **green — JSON/Markdown current for 243 surfaces; 8/8 focused tests passed** |

## Per-Task Verification Map

Every row below was checked against the actual test body and executed through the referenced gate. Tests exercise observable rejection, persistence, rollback, reconstruction, privacy, or process behavior rather than declaration-only shape, except the intentional structural sentinels whose observable behavior is repository rejection.

| Plan / Task | Requirement(s) | Behavioral evidence | Gate | Status |
|-------------|----------------|---------------------|------|--------|
| 01-1 authority registry and tuple | AUTH-01, AUTH-02, AUTH-03, AUTH-05 | distinct owners, every tuple mutation, exact resolution, immutable exports | A | green |
| 01-2 generated manifests/vectors | AUTH-02 | byte-stable artifact check and per-field hash vectors | A | green |
| 02-1 lane evidence evaluation | SAFE-01, SAFE-02 | every lane quarantined; containment/exhibition/counted matrix; every identity mutation | A | green |
| 02-2 runtime/entry facades | SAFE-02, AUTH-03 | provider proof and descriptive registries cannot promote | A | green |
| 02-3 public/operator projections | SAFE-04 | separate allowlists plus nested key/value leak rejection | A | green |
| 03-1 runtime request identity | SAFE-01, SAFE-02, AUTH-03 | complete heterogeneous request succeeds; partial/mixed/alias/drift fails atomically | A | green |
| 03-2 persisted Match evidence | AUTH-02, AUTH-03 | exact tuple/pair persistence, side binding, historical dispatch, public privacy | A | green |
| 03-3 replay tuple/history routing | AUTH-03, AUTH-04 | current mixed tuples reject; v1.4 bytes remain unchanged | B | green |
| 04-1 identity/append-only schema | SAFE-03, AUTH-02, AUTH-04 | migrations and real PostgreSQL constraints/triggers | C | green |
| 04-2 persistence primitives | AUTH-03 | two-to-eight entrants, mutation matrix, direct-certificate rejection, rollback | C | green |
| 05-1 direct Match writer | SAFE-01, SAFE-02, AUTH-02 | pre-transaction rejection, identical Match/job pair, rollback | C | green |
| 05-2 MatchSet matrix writer | AUTH-02, AUTH-03 | complete heterogeneous entrant map, pair derivation, zero-row/late-child rollback | C | green |
| 06-1 Chronicle insert identity | AUTH-02, AUTH-04 | partial/swapped/singular rejection and immutable v1.4 Chronicle hash | C | green |
| 06-2 completion recheck | SAFE-02, AUTH-03 | every side drift is non-penalizing system failure; PostgreSQL no-mutation and late rollback | C | green |
| 07-1 historical resolution | SAFE-03, AUTH-04 | resolved/incomplete/unresolved read-only projections and source-hash equality | C | green |
| 07-2 cohort governance/standings | SAFE-03, SAFE-04, AUTH-03 | deterministic preview, documentation-only rejection, compensation, exact current/historical scoring | C | green |
| 08-1 scheduling evidence gate | SAFE-01, SAFE-02, AUTH-02 | installed publication/source validation and per-entrant aggregate decisions | C | green |
| 08-2 pre-claim gate | SAFE-02, AUTH-03 | exact SQL predicates, lifecycle-equivalent rejection, containment-only exhibition claim | C | green |
| 09-1 mounted runtime authority | SAFE-01, SAFE-02 | Ed25519, exact bytes, graph, pin/high-water, restart/rollback/fork, pre-listen failure | D | green |
| 09-2 per-invocation recheck | SAFE-02, SAFE-04 | production HTTP identity drift, pre/post authority drift, zero result leakage | D | green |
| 10-1 Go tuple/bundle parity | AUTH-02, AUTH-03 | committed vectors, standard-library signature checks, anti-rollback | F | green |
| 10-2 Go readiness | SAFE-01, SAFE-02 | provider proof cannot promote; exact evidence status parity | F | green |
| 10-3 Go startup ordering | SAFE-01 | invalid authority yields zero pool/orchestrator/listen side effects | F | green |
| 11-1 Go claim transaction | SAFE-01, AUTH-03 | exact installed receipt/source/entrant checks before mutation | F | green |
| 11-2 Go transport/recheck | SAFE-02, AUTH-03 | reference-only request validation and no completion on in-flight drift | D, F | green |
| 11-3 Go completion/Chronicle | SAFE-02, AUTH-02 | locked identity propagation and PostgreSQL no-mutation rollback | F | green |
| 12-1 Go creation preflight | SAFE-01, SAFE-02 | evidence rejection before Begin and purpose floors | F | green |
| 12-2 Go receipt-bound persistence | AUTH-02, AUTH-03 | uncertain receipt zero rows, exact reconciliation, full propagation, late rollback | F | green |
| 13-1 Go public/operator projections | SAFE-04 | exact public allowlist, authorized operator shape, recursive privacy scan | F | green |
| 13-2 current/historical Go reads | SAFE-03, AUTH-04 | authorization separation, PostgreSQL historical semantics, concrete-only warnings | F | green |
| 14-1 structural/history sentinels | AUTH-01, AUTH-02, AUTH-05 | live inventory plus synthetic bypasses and immutable archived dispatch | G, H | green |
| 14-2 seven-probe compatibility baseline | AUTH-04 | exact semantic rerun plus mutation/privacy rejection | G, H | green |
| 14-3 complete writer-to-runtime gate | SAFE-01..04, AUTH-01..05 | package/DB/service/Go/history/monitor chain | A-I | green |
| 15-1 closed attestation graph | SAFE-01, SAFE-02 | signature, exact nested keys, closed bytes/graph, trust/freshness forgery matrix | A | green |
| 15-2 sole certificate import | SAFE-01, SAFE-02, AUTH-03 | derive-only import, idempotence, forgery/direct insert/late failure zero rows | C | green |
| 16-1 production caller migration | SAFE-01, SAFE-02, AUTH-02 | competition/Workshop heterogeneous resolution and zero-write failure | C | green |
| 16-2 dev/demo and inventory | SAFE-02, AUTH-05 | no-authority DB preflight, verified fixture import, canonical lane hash, live/synthetic caller inventory | C, G, G2 | green |
| 17-1 bounded signed bundle | SAFE-01, SAFE-02, AUTH-01 | exact bytes/signature, closed graph, atomic replacement, durable high-water | A | green |
| 17-2 reference-only requests/vectors | AUTH-03 | request body authority rejection and byte-stable cross-language vectors | A | green |
| 18-1 authenticated ledgers | SAFE-01, SAFE-02, AUTH-02 | control/revocation/supersession invalid matrix, zero rows, append-only PostgreSQL | C | green |
| 18-2 deterministic publisher | AUTH-01, AUTH-03 | locked source snapshot, signature/provenance replay, failure/concurrency rollback | C | green |
| 18-3 atomic installer | SAFE-02, AUTH-05 | signer/fsync/rename/receipt failures, last-good preservation, reconciliation | C, G | green |
| 19-1 direct-worker retirement | SAFE-01, SAFE-02 | 34-purpose/process tests with zero dependencies/effects and safe stderr | E | green |
| 19-2 retirement sentinel | AUTH-03, AUTH-05 | real repository plus independent purpose/order/loop/injection/route bypass fixtures | G, H | green |

## Requirement Coverage

| Requirement | Executed proof | Status |
|-------------|----------------|--------|
| SAFE-01 | exact evidence, attestation/import, publisher, scheduling/claim, Node/Go startup and creation | green |
| SAFE-02 | disabled/exhibition/counted floors; every drift/failure before gameplay or player mutation | green |
| SAFE-03 | immutable historical resolution, append/compensate/recompute, source-hash proof | green |
| SAFE-04 | separate public/operator allowlists and recursive privacy scans in TS/Go/scripts | green |
| AUTH-01 | one owner registry, sole importer/publisher, independent consumers | green |
| AUTH-02 | one tuple plus complete entrant set and ordered pair through MatchSet/Match/job/Chronicle | green |
| AUTH-03 | exact atomic rejection at schema, DB, schedule, claim, runtime, completion, replay, standings | green |
| AUTH-04 | immutable byte-pinned v1.36 dispatch and original-semantic history | green |
| AUTH-05 | synthetic/live v1.37 sentinels, generated-artifact checks, and the complete serialized default boundary chain | green |

## Resolved Nyquist Findings

### NYQ-256-01 — Live integrity boundary drift after code-review fixes — RESOLVED

- **Classification:** resolved by implementation fix `3d103d4`.
- **Failing test:** `scripts/check-v1-37-integrity-boundaries.test.ts > accounts for the repository creation inventory`.
- **Observed:**
  - `RAW_CERTIFICATE_WRITER` at `packages/persistence/src/dev-smoke.ts`: the development smoke helper directly inserts `runtime_evidence_verified_attestations` and `runtime_evidence_certificates`, bypassing the sole verified importer.
  - `AUTHORITY_CHAIN_DRIFT` at `apps/runtime-service/src/runtime-evidence-authority.ts`: the sentinel still expects the obsolete `verify(null` marker after cryptographic verification was corrected to bind payload bytes.
  - `GO_RECEIPT_AUTHORITY_DRIFT` at `apps/go-backend/integrity_creation.go`: the sentinel still expects the obsolete `for share of h, p` marker after receipt authority moved to the installed-head projection with separate publication-head locking.
- **Debug iteration 1/3:** the pre-fix complete four-file focused suite was 48/49 and reproduced the same three findings.
- **Repair evidence:** `3d103d4` routes development fixture evidence through `importVerifiedRuntimeEvidenceAttestation`, delegates persistence lane hashing to the canonical spec owner, and replaces brittle spelling checks with mutation-tested payload-signature and dual-lock structural guards.
- **Rerun:** Gate G passed 52/52 and Gate G2 passed 32/32 with real PostgreSQL.

### NYQ-256-02 — Regenerated backend inventory left final surface labels stale — RESOLVED

- **Classification:** resolved by artifact fix `b2c921a`.
- **Failing boundary row:** `[surface_labels] v1.16 final TypeScript surface labels: source inventory count drifted`.
- **Observed:** `.planning/artifacts/v1.16-typescript-backend-inventory.json` contains 243 current surfaces after `3d103d4`, while `.planning/artifacts/v1.16-final-typescript-surface-labels.json` still records `sourceInventorySurfaceCount: 240`.
- **Debug iteration 1/3:** the pre-fix `pnpm boundary:monitors` passed every preceding contract/import/inventory/Go/sandbox/runtime/history/v1.37 check, then failed only this row. The generator independently reported both label artifacts stale.
- **Repair evidence:** `b2c921a` regenerated and reviewed the current JSON/Markdown label artifacts for all 243 inventory surfaces without changing immutable v1.36 proof artifacts.
- **Rerun:** generator drift check passed, the focused generator/monitor suite passed 8/8, and the complete boundary chain passed all 42 rows.

## Manual-Only Verification

None. Every Phase-256 behavior has an automated verifier. Later Phase-261 browser proof may assess operator/public presentation realism, but it does not substitute for any Phase-256 contract.

## Audit Trail

| Date | HEAD | Result | Notes |
|------|------|--------|-------|
| 2026-07-12 | planning | draft | Wave-0 validation strategy created before implementation. |
| 2026-07-13 | `7096a3f` | gaps found | 43/44 tasks green; all real PostgreSQL, runtime-service, worker, Go, historical, and audit gates green; live integrity inventory deterministically blocked by NYQ-256-01. |
| 2026-07-13 | `3d103d4` | original gap resolved; one new drift found | NYQ-256-01 closed: focused structural/history 52/52 and canonical lane-hash/import 32/32 with real PostgreSQL. Full boundary chain then found NYQ-256-02: stale v1.16 final surface-label JSON/Markdown after backend inventory growth from 240 to 243 surfaces. |
| 2026-07-13 | `b2c921a` | complete | NYQ-256-02 closed: surface-label generator check current, focused surface-label suite 8/8, focused structural/history 52/52, canonical lane-hash/import 32/32 with real PostgreSQL, and complete boundary chain 42/42. All 44 tasks and nine requirements are green. |

## Sign-Off

- [x] All 19 plans, 44 tasks, 19 summaries, review/fix reports, and nine Phase-256 requirements were audited.
- [x] Every claimed focused behavioral suite was executed; PostgreSQL and Go database paths used the explicit project DSN.
- [x] No implementation file was modified by the Nyquist auditor.
- [x] No manual-only gap was used to hide automatable behavior.
- [x] NYQ-256-01 is repaired and its focused/import/hash tests pass.
- [x] NYQ-256-02 is repaired and its generator/focused tests pass.
- [x] `pnpm boundary:monitors` passes after both repairs.
- [x] `status: complete`, `nyquist_compliant: true`, and current Wave-0 evidence are recorded only after all reruns passed.

**Approval basis:** autonomous fix-all request, 2026-07-12. **Nyquist sign-off: complete at `b2c921a`.**
