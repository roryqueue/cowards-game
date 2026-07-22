---
phase: 256-counted-safety-and-canonical-authority
verified: 2026-07-13T12:45:07Z
status: passed
score: 71/71 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
---

# Phase 256: Counted Safety and Canonical Authority Verification Report

**Phase Goal:** Operators can trust that only currently proved runtime lanes and atomically compatible evidence enter counted competition while historical v1.4 evidence remains unchanged.

**Verified:** 2026-07-13T12:45:07Z  
**Implementation HEAD:** `fc60007`  
**Status:** passed  
**Re-verification:** No — initial goal-backward verification

## Goal Achievement

The phase goal is achieved. Verification started from the four roadmap success criteria, merged all 71 non-duplicate PLAN truths, then checked the implementation, wiring, behavior, persisted evidence, and failure paths without treating the 19 SUMMARY files as proof. All behavior-dependent truths have fresh executable evidence; no human-only item or unresolved prohibition remains.

### Roadmap Contract

| # | Roadmap truth | Status | Evidence |
|---|---|---|---|
| 1 | Counted lanes require current exact containment and conformance evidence and fail closed before scheduling or execution. | VERIFIED | The canonical evaluator returns `disabled` without valid containment, `exhibition_only` without valid conformance, and `counted` only with both (`packages/spec/src/runtime-evidence.ts:452-495`). Runtime-service, TypeScript scheduling/claim, Go creation/claim, and database-backed no-mutation tests all passed. |
| 2 | New Match/evidence records carry one atomic six-part tuple and every consumer rejects missing, unknown, mixed, or uncertified tuples. | VERIFIED | The tuple has exactly six fixed-order fields, domain-separated SHA-256 bytes, exact registered expansion lookup, and immutable copies (`packages/spec/src/integrity-authority.ts:105-290`). PostgreSQL persistence, replay, runtime-service, and Go parity gates passed. |
| 3 | Operators can classify/invalidate/recompute affected history while original Match evidence and v1.4 interpretation remain immutable. | VERIFIED | Read-only historical resolution, append-only classification/compensation, deterministic standings recomputation, immutable SQL triggers, source-hash tests, and the pinned v1.36 dispatcher passed against 8 artifacts and 11 archived sources. |
| 4 | Public/default safety output is privacy-safe and monitors reject duplicate authority and stale execution entry points. | VERIFIED | Separate public/operator constructors, recursive TypeScript/Go privacy tests, the retired worker and 404 route, synthetic bypass fixtures, current inventory, and the serialized 42-row boundary chain passed. |

### Merged PLAN Must-Haves

The 71 PLAN truths are grouped below only for readability; every quoted truth in every PLAN frontmatter was included in the score.

| Plan | Truths | Status | Implementation and behavioral evidence |
|---|---:|---|---|
| 256-01 | 3 | VERIFIED | One six-domain owner registry; fixed-order tuple encoding/hash; exact lookup; frozen exports; generated artifact and mutation vectors. Spec Gate A passed 119/119. |
| 256-02 | 4 | VERIFIED | All lanes quarantined; containment/exhibition/counted floors; operator controls reduce only; separate safe public/operator projections. Gate A passed. |
| 256-03 | 3 | VERIFIED | Runtime request and Match evidence use one tuple plus ordered side references; partial/mixed data rejects atomically; drift is system failure. Spec and replay gates passed. |
| 256-04 | 2 | VERIFIED | PostgreSQL stores tuple, normalized entrant set, per-entrant evidence, ordered Match/job/Chronicle pairs, and append-only evidence/governance records. Real-PostgreSQL Gate C passed 195/195. |
| 256-05 | 2 | VERIFIED | Direct and matrix TypeScript writers validate before SQL and copy complete identity transactionally or leave zero rows. Gate C passed. |
| 256-06 | 2 | VERIFIED | Completion locks/rechecks persisted authority before mutation and Chronicle insertion; historical Chronicles remain tuple-unmodified. Gate C passed. |
| 256-07 | 4 | VERIFIED | Historical resolution is read-only; current standings require exact certification; only explicitly resolved v1.4 history retains original semantics; correction is append/compensate/recompute. Gate C passed. |
| 256-08 | 3 | VERIFIED | TypeScript scheduling evaluates all entrants against the installed publication; claim rechecks provenance before lifecycle mutation. Gate C passed. |
| 256-09 | 5 | VERIFIED | Runtime-service verifies a separately keyed signed bundle, deployment pin, durable high-water, and pre/post invocation identity; drift is a redacted non-penalizing system failure; request fixtures are reference-only and fixture-domain. Runtime-service passed 56/56. |
| 256-10 | 3 | VERIFIED | Go reproduces tuple/bundle bytes and hashes, independently verifies Ed25519 authority, enforces deployment pin/high-water before live startup, and never promotes provider proof. Full Go suite passed with PostgreSQL. |
| 256-11 | 4 | VERIFIED | Go claim, transport, post-response check, completion, and Chronicle preserve the locked tuple/pair/receipt or make only a system-failure mutation. Full Go/PostgreSQL suite passed. |
| 256-12 | 5 | VERIFIED | Normal Go MatchSet creation verifies every entrant, locks an exact installed receipt before inserts, propagates complete identity, and leaves zero rows for rejected/drifted input. Full Go/PostgreSQL suite passed. |
| 256-13 | 3 | VERIFIED | Go public/operator projections are structurally separate and recursively safe; historical reads retain original profile/counting and never upgrade unresolved history. Full Go suite passed. |
| 256-14 | 8 | VERIFIED | Current structural monitors, pinned v1.36 dispatch, immutable history, exact seven-probe baseline, full writer/runtime/receipt chain, production publication/install/rollback, and package-wide reference-only request proof all passed. |
| 256-15 | 3 | VERIFIED | Certificates derive only from a successfully verified closed attestation graph; caller certificate fields cannot promote; production conformance remains empty until Phase 259. Spec and PostgreSQL gates passed. |
| 256-16 | 4 | VERIFIED | Every active TypeScript creation caller supplies exact per-entrant evidence or writes zero rows; heterogeneous entrants are retained; inventory rejects bypasses; demos cannot re-enable the worker. Persistence and structural gates passed. |
| 256-17 | 4 | VERIFIED | Node and Go independently verify one bounded signed bundle; both enforce deployment pin plus durable high-water; requests carry references only; production bundle has no conformance certificates. Spec, runtime-service, and Go gates passed. |
| 256-18 | 5 | VERIFIED | Publisher derives from authenticated append-only records under locks, persists exact provenance, installs with temp/fsync/rename/directory-fsync, preserves last-good bytes, and reconciles uncertainty only from verified bytes. PostgreSQL and structural publisher suites passed. |
| 256-19 | 4 | VERIFIED | Worker entry/run-once/run-loop reject every purpose before effects; dependency spies stay at zero; structural sentinel rejects purpose, order, loop, injection, and route bypasses. Worker passed 34/34 and the live sentinel reported zero findings. |

**Score:** 71/71 truths verified; 0 present-but-behavior-unverified.

## Required Artifacts

All 50 PLAN artifact declarations (45 unique paths) passed the GSD existence/substance checker. The unique artifact set contains 31,632 lines and includes executable modules, SQL migrations, tests, signed/generated manifests, audit baselines, and drift guards rather than placeholders.

| Artifact group | Representative paths | Status | Details |
|---|---|---|---|
| Canonical specification authority | `packages/spec/src/integrity-authority.ts`, `runtime-evidence.ts`, `runtime-evidence-attestation.ts`, `runtime-evidence-authority-bundle.ts`, `runtime-execution-service.ts`, `schemas.ts`, generated authority/vector JSON | VERIFIED | Substantive exports, fixed encodings, strict schemas, closed evidence graph, privacy projections, and committed vectors; imported by active consumers. |
| Persistence authority and lifecycle | migrations `0012` through `0016`; `integrity-evidence.ts`, writers, jobs, completion, Chronicle store, governance, publisher/importer | VERIFIED | Real PostgreSQL exercised constraints, append-only triggers, exact source/receipt equality, transactional rollback, installed-head monotonicity, and historical immutability. |
| Runtime-service | `runtime-evidence-authority.ts`, `execute-match.ts`, counted-safety and direct/four-language tests | VERIFIED | Independent Ed25519/SHA-256 verification, separate key, pin/high-water, reference-only request resolution, pre/post checks, safe failure. |
| Go backend | `runtime_evidence_authority.go`, `integrity_evidence.go`, `live_backend.go`, `job_lifecycle.go`, `runtime_service_client.go`, `completion.go` and tests | VERIFIED | Standard-library verification, startup ordering, exact creation/claim/completion, receipt locks, projections, and PostgreSQL rollback all executed. |
| Worker retirement | `apps/worker/src/runner.ts`, `runner.test.ts`, `scripts/check-v1-37-worker-retirement.ts` | VERIFIED | Unconditional retirement boundary and mutation-tested structural sentinel. |
| Current/historical proof | `check-v1-37-integrity-boundaries.ts`, `check-v1-36-historical-proof.ts`, dispatch JSON, core-rules baseline JSON/Markdown | VERIFIED | Current inventory and synthetic bypasses plus tag/blob-pinned, read-only v1.36 execution and exact semantic reproduction. |

## Key Link Verification

All 27 declared key links are wired. The automatic checker found 26 directly and reported the Plan-19 index-to-runner pattern as absent because its regex expected `Retired` after the assertion name. Manual verification found the stronger real link: `apps/worker/src/index.ts` imports and invokes `assertTypeScriptWorkerEntrypointAllowed()` at lines 1-7 before any configuration, pool, loop, or readiness effect. The worker package and structural sentinel then executed the behavior.

| From | To | Via | Status |
|---|---|---|---|
| Spec generators/fixtures | canonical authority and bundle modules | Imports plus committed byte/hash vectors | WIRED |
| Legacy runtime and competition entry facades | canonical evidence evaluator | `evaluateExecutableLaneEligibility` and canonical reasons | WIRED |
| Request/replay schemas | tuple and evidence contracts | Exact tuple expansion, authority refs, system-failure vocabulary | WIRED |
| TypeScript creation/scheduling/completion | integrity persistence and Chronicle store | Validated normalized set, ordered pair, installed receipt, lock-then-copy | WIRED |
| Runtime-service startup/execution | mounted authority loader | Startup load plus acceptance/pre-invocation/post-execution reload | WIRED |
| Go startup/creation/orchestration/completion | independent authority and receipt validators | Standard-library verifier plus transaction locks and exact transport refs | WIRED |
| Persistence importer/publisher/CLI | attestation verifier and strict bundle renderer | Verify-derive-only importer, locked snapshot, external signer, atomic installer | WIRED |
| Boundary chain | v1.37 monitor, v1.36 dispatcher, worker sentinel | Root `boundary:monitors` composition | WIRED |
| Worker index | retired runner | First-operation assertion | WIRED (manual plus behavioral proof) |

## Behavioral Verification

All commands below were executed fresh by this verifier at HEAD `fc60007`; results are not copied from SUMMARY files.

| Gate | Command / boundary | Fresh result | Status |
|---|---|---|---|
| Spec + generated artifacts | authority/vector `--check`; seven focused spec files; spec typecheck | 119/119, artifacts current | PASS |
| Replay | `validate.test.ts`; replay typecheck | 22/22 | PASS |
| Persistence + PostgreSQL | 15 focused files under explicit `DATABASE_URL`, one worker, then typecheck | 195/195 | PASS |
| Monotonic installed head | `authority-installed-head.test.ts` under explicit `DATABASE_URL` | 3/3 | PASS |
| Runtime-service | package typecheck and package test | 56/56; Rust and Zig conditional tests were not skipped | PASS |
| Retired worker | package test and typecheck | 34/34 | PASS |
| Go + PostgreSQL | full `go test ./... -count=1` with `COWARDS_GO_BACKEND_TEST_DATABASE_URL` | package pass; DB-backed creation, claim, orchestrator, completion, and read tests enabled | PASS |
| Structural/history/publisher | four focused Vitest files | 52/52 | PASS |
| Direct historical proof | `check-v1-36-historical-proof.ts` | 8 artifacts, 11 sources | PASS |
| Direct worker proof | `check-v1-37-worker-retirement.ts` | 0 findings | PASS |
| Exact audit reproduction | `reproduce-core-rule-gaps.ts` | Exact six-defect plus `RIGHT` result listed below | PASS |
| Serialized boundary chain | `pnpm boundary:monitors` | 42/42 PASS rows; `strict_offenses=0` | PASS |
| Surface drift | generator `--check` plus generator/monitor tests | current; 31/31 | PASS |

### Exact Seven Audit Probes

The direct executable reproduction matched the committed baseline exactly:

| Probe | Fresh observation | Phase-256 disposition |
|---|---|---|
| No-Advance removes last Soldier | `STONE`, no outcome, 0 Match-ended events | Reproduced defect, owned by Phase 257 |
| Cycle-end Backstab stones actor | `STONE`, slot not ended, terminal reason null | Reproduced defect, owned by Phase 257 |
| Valid order followed by malformed excess order | 0 valid orders retained, 1 violation event | Reproduced defect, owned by Phase 257 |
| 3,000-deep memory | `threw:RangeError` | Reproduced defect, owned by Phase 258 |
| Terrain overlaps canonical start | accepted | Reproduced defect, owned by Phase 257 |
| Historical Backstab boundary in active schema | accepted | Reproduced defect, owned by Phase 259 |
| Successful-push pusher history | `RIGHT` | Preserved v1.4 ruling |

These later-phase defects are intentionally preserved observations, not Phase-256 failures: Phase 256's contract was to revalidate and pin them without gameplay or Strategy-observation change.

## Requirements Coverage

| Requirement | Source plans | Status | Evidence |
|---|---|---|---|
| SAFE-01 | 02, 03, 05, 08-12, 14-19 | SATISFIED | Exact full-lane identity, closed certificate import, signed publication, per-entrant schedule/create/claim/runtime checks, and Node/Go startup gates passed. |
| SAFE-02 | 02, 03, 05-12, 14-19 | SATISFIED | Disabled/exhibition/counted floors and all pre/in/post drift paths have executable no-gameplay/no-player-penalty proof. |
| SAFE-03 | 04, 07, 13, 14 | SATISFIED | Read-only historical resolver, immutable source hashes, deterministic cohort preview, append/compensate/recompute. |
| SAFE-04 | 02, 07, 09, 13, 14 | SATISFIED | Separate allowlists and recursive privacy scans across TypeScript, Go, fixtures, proofs, and diagnostics. |
| AUTH-01 | 01, 02, 09, 14, 17, 18 | SATISFIED | One registry, sole importer, one locked publisher, independently verifying consumers, structural inventory. |
| AUTH-02 | 01, 03-06, 08, 10-12, 14, 16, 18 | SATISFIED | One tuple plus complete entrant set and ordered pair through MatchSet, Match, job, request, Chronicle, Go, and receipt-bound persistence. |
| AUTH-03 | 01-19 | SATISFIED | Atomic rejection at schema, database, scheduling, claim, runtime, completion, replay, standings, and boundary monitors. |
| AUTH-04 | 03, 04, 06, 07, 13, 14 | SATISFIED | Byte-pinned v1.36 tag dispatch, immutable Chronicles/source rows, explicit historical semantics, exact seven-probe baseline. |
| AUTH-05 | 01, 14, 16, 18, 19 | SATISFIED | Current parsed inventory, synthetic bypass fixtures, retired route/worker, pinned history, and complete serialized boundary chain. |

No Phase-256 requirement is orphaned; all nine appear in PLAN frontmatter and all nine map to executable evidence.

## Test Quality and Provenance

- The relevant suites contain conditional PostgreSQL and toolchain tests, but this verification supplied the explicit PostgreSQL DSNs and the runtime-service reported no skipped Rust/Zig tests.
- The Go run supplied `COWARDS_GO_BACKEND_TEST_DATABASE_URL`, enabling DB-backed creation, lifecycle, completion, orchestration, and status tests that otherwise call `t.Skip`.
- Production conformance intentionally remains empty. The four-language runtime-service fixtures prove execution shape only and are explicitly rejected as production eligibility evidence; no lane is counted from test names or documentation.
- Certificate persistence has one application writer: `importVerifiedRuntimeEvidenceAttestation` verifies immutable input before SQL and again inside the transaction, then derives every certificate field. The live inventory rejects raw writers.
- Migrations enforce append-only identity/evidence, a highest-ever-installed monotonic head, uncertainty closure, and a publication-head lock shared with scheduling/lifecycle transactions. The post-review installed-head suite passed against real PostgreSQL.

### Adversarial Disconfirmation Pass

1. **Potential partial wiring:** GSD's Plan-19 regex did not match the worker link. Reading the code showed the assertion import and first-operation call; 34 worker tests and mutation-tested sentinel fixtures proved it. Information only, not a gap.
2. **Potential misleading test:** A static audit fixture could pass without exercising engine behavior. The verifier therefore ran the reproduction script directly and matched all seven exact observations.
3. **Potential uncovered error path:** The original Phase validation table did not list the later `0016` monotonic installed-head test. The verifier ran that PostgreSQL suite independently (3/3), covering higher-generation uncertainty and both lifecycle/writer lock orderings.

## Anti-Patterns Found

| Scope | Pattern | Severity | Assessment |
|---|---|---|---|
| 45 unique required artifacts and active implementation files | `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, placeholder/not-implemented markers | None | No unresolved debt marker or implementation stub found. |
| Serialized web-boundary report | 19 report-only legacy broad web imports | INFO | `strict_offenses=0`; these are pre-existing inventory rows and not duplicate Phase-256 authority or Strategy execution. |
| Plan-19 key-link regex | Pattern wording stale relative to actual symbol name | INFO | Real import/call and behavior are verified; no production gap. |

## Data-Flow Trace

This phase has no user-facing dynamic UI artifact, so component-level render data-flow checks do not apply. The relevant trust flow was traced and executed instead:

`verified attestation bytes -> sole importer -> immutable certificate rows -> locked publisher -> signed installed bundle/receipt -> deployment pin + durable high-water -> per-entrant scheduling/claim -> runtime-service pre/post verification -> locked completion -> receipt-bound Chronicle -> replay/standings/public projection`

Every transition above has a substantive artifact, active caller, failure classification, and passing behavioral test. System/evidence failure never becomes gameplay or player penalty in the verified paths.

## Human Verification Required

None. Phase 256 is infrastructure/foundation work with no visual or user-flow deliverable. All state transitions, ordering invariants, external PostgreSQL paths, process-start ordering, cryptographic checks, privacy rules, historical dispatch, and audit probes have automated executable proof.

## Gaps Summary

No gaps. No override was required. The six known audit defects remain explicitly assigned to Phases 257-259 and were preserved exactly as Phase 256 required.

---

_Verified: 2026-07-13T12:45:07Z_  
_Verifier: the agent (gsd-verifier)_
