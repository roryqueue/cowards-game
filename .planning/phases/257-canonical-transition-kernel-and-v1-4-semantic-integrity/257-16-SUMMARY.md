---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "16"
subsystem: persistence-semantic-integrity
tags: [persistence, candidate-kernel, chronicle, replay, authority, rollback]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: trusted candidate execution, transition recorder, and every-boundary replay validation
  - phase: 256-counted-safety-and-canonical-authority
    provides: installed publication receipts and exact ordered Match execution evidence
provides:
  - Pre-derivation candidate semantic admission with immutable trusted Chronicle evidence
  - Claim-strength completion locks over publication, source, receipt, entrant, job, and attempt identity
  - Exact Chronicle conflict/idempotence checks and zero-mutation system-failure rollback proof
affects: [257-19, 257-20, persistence, runtime-service, chronicle, counted-scheduling]
tech-stack:
  added: []
  patterns: [weakset admission brand, validate-before-derive, claim-strength lock, exact idempotence]
key-files:
  created: []
  modified:
    - packages/persistence/src/complete-match.ts
    - packages/persistence/src/complete-match.test.ts
    - packages/persistence/src/chronicle-store.ts
    - packages/persistence/src/chronicle-store.test.ts
    - packages/persistence/src/semantic-integrity.test.ts
key-decisions:
  - "Candidate persistence consumes only an in-process branded admission produced from trusted execution, exact recording, every-boundary validation, and explicit reconstruction."
  - "Candidate success remains impossible without a real installed candidate publication and receipt; Plan 16 neither fabricates nor bypasses that authority."
  - "Active old-current completion retains its original route until Plan 19 while receiving cloned inputs, stronger lock checks, and exact idempotence."
  - "Semantic integrity, authority drift, and operational lease/attempt failures remain distinct system failures and never become player penalties."
patterns-established:
  - "Candidate chain: trusted execution -> candidate validation -> reconstruction -> cloned branded admission -> cross-document identity -> locked authority -> Chronicle/result write."
  - "Completion idempotence is acceptance of the exact same artifact and result, not acceptance of any already-complete Match row."
requirements-completed: [KERN-02, KERN-03, KERN-10, KERN-11]
coverage:
  - id: D1
    description: Candidate execution, Chronicle boundaries, reconstruction, terminal hash/outcome, full state, and cross-document identity are checked before derivation or transaction entry.
    requirement: KERN-02
    verification:
      - kind: integration
        ref: "packages/persistence/src/semantic-integrity.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Completion rechecks the exact installed publication, payload, envelope, source graph, receipt, certificates, entrants, Match/job evidence, lease, and running attempt under lock.
    requirement: KERN-03
    verification:
      - kind: integration
        ref: "packages/persistence/src/complete-match.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Invalid candidate, reconstruction drift, attempt mismatch, response drift, late write failure, Chronicle conflict, and idempotent retry preserve exact canonical row content.
    requirement: KERN-10
    verification:
      - kind: integration
        ref: "real PostgreSQL random-schema semantic/rollback suite"
        status: pass
    human_judgment: false
  - id: D4
    description: Historical v1.4 evidence remains read-only and unchanged while the active old-current completion path proves exact success.
    requirement: KERN-11
    verification:
      - kind: historical
        ref: "scripts/check-v1-36-historical-proof.ts"
        status: pass
    human_judgment: false
duration: 48min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 16: Semantic Persistence Admission Summary

**TypeScript persistence now admits candidate completion only after trusted every-boundary semantic reconstruction, then rechecks exact scheduling authority under lock before writing any canonical row.**

## Accomplishments

- Added an exact full candidate completion route carrying compatibility identity, Chronicle, boundary anchors, trusted execution, final state, terminal state hash, outcome, job lease, and execution evidence. Unknown/mixed route fields fail closed.
- Added a non-serializable `WeakSet` admission brand. Candidate Chronicle storage can consume only a cloned, frozen admission created after trusted execution verification, candidate semantic validation, explicit reconstruction, and replay creation.
- Validates canonical final-state shape and semantics, completion/outcome, Chronicle Match/seed/arena/versions/revisions, terminal state hash/outcome, and candidate execution-evidence tuple before deriving result fields or opening a transaction.
- Strengthened completion locking to the same authority level as claiming: installed publication generation, tuple manifest, payload, envelope, source manifest/set, receipt, source-record hashes, certificate status/freshness, revocation/supersession/lane controls, ordered entrants, Match/job evidence, lease, worker, and current attempt must all agree.
- Added exact candidate DB identity checks for Match, seed, arena, players, sides, and Strategy revisions. Candidate semantic admission remains non-authorizing until Plan 19 installs its real receipt.
- Strengthened Chronicle insert conflicts and completion idempotence to compare exact artifact bytes/hash/metadata/outcome, result fields, ordered evidence, MatchSet, publication, receipt, and source identity. An unrelated completed row can no longer masquerade as a successful retry.
- Added guarded row-count predicates for Match, job, and attempt completion. Lease/attempt drift is an operational system failure; semantic invalidity is non-retryable system integrity; authority drift remains retryable system failure. All have `playerPenalty: false`.
- Migrated both persistence-owned `buildChronicleFromMatch` references to one candidate execution and one recording. The persistence-ready inventory now reports exactly **8 executable references** and **12 non-executable mentions**.
- Replaced count-only RED proof with real-PostgreSQL exact row-content snapshots for invalid candidate state, reconstruction drift, response drift, job-attempt mismatch, forced late rollback, exact current success, idempotence, and Chronicle conflict.

## Task Commit

1. **Task 1: Validate before derive/write and lock exact completion identity** — `7380adb`

## Files Modified

- `packages/persistence/src/complete-match.ts` — Candidate pre-admission, claim-strength locked completion, exact idempotence, DB identity, and guarded result/job/attempt writes.
- `packages/persistence/src/complete-match.test.ts` — Candidate run-once/record-once fixture, exact authority fixture, full-row rollback, current success, idempotence, conflict, and attempt mismatch proof.
- `packages/persistence/src/chronicle-store.ts` — Branded candidate admission, route-aware insertion, cloned evidence, and strict PostgreSQL/memory conflict comparison.
- `packages/persistence/src/chronicle-store.test.ts` — Exact duplicate/conflict behavior and unbranded candidate rejection.
- `packages/persistence/src/semantic-integrity.test.ts` — Random-schema candidate invalidity, reconstruction failure, inactive authorization, and exact canonical row snapshots.

## Decisions Made

- Candidate validation does not grant publication authority. A semantically valid candidate with no installed candidate receipt reaches no canonical write and fails as a non-penalizing operational system failure.
- The candidate admission object clones all persistable inputs but never clones or serializes the engine's trusted execution brand. This closes mutation-after-validation without creating a forgeable execution receipt.
- Historical v1.4 remains a read-only retrieval/replay concern. No historical insertion or backfill route was added.
- Publication/source/receipt checks are repeated in SQL and in application-level exact comparisons. This makes late drift and partial row matches fail closed even if a future query is weakened accidentally.

## Deviations from Plan

None in Plan-16-owned scope. Candidate receipt-backed success remains intentionally deferred to the atomic Plan 19 authority activation.

## Issues Encountered

- `scripts/dev-local-postgres.sh --setup-only` detected the running local PostgreSQL service but its host-user bootstrap probe requested an unavailable password. The explicit required DSN (`postgresql://cowards:cowards@localhost:5432/cowards_game`) was already live, so every Plan 16 PostgreSQL test ran directly against it.
- The full persistence package run reached **203/212 passing**. The only failures are nine existing `runtime-evidence-authority-publisher.test.ts` installed-publication RED cases, all failing with `Stored lane identity is not canonical`; they reproduce identically in that file alone and do not import or exercise a Plan-16-owned file. The Plan 16 focused PostgreSQL suite, current completion path, inactive-candidate proof, and every other persistence file pass. This inherited RED must be closed by its publication-authority owner before the milestone-wide green gate.
- Runtime-service files were concurrently under the Plan 17/18 workstream while verification ran. The settled service suite nevertheless passed 94/94 and no concurrent file was staged in the Plan 16 commit.

## Verification

- Final Plan-16 real-PostgreSQL suite: **15/15 passed** across semantic integrity, Match completion, and Chronicle storage.
- Exact focused `semantic|rollback|reconstruction` checkpoint: **4/4 passed**, with unrelated tests skipped by the plan filter.
- Active current completion: exact success, full receipt/evidence copy, idempotent retry, conflict refusal, and rollback passed.
- Candidate receipt absence: semantically valid evidence remains non-authorizing with exact zero-row mutation.
- Persistence TypeScript build/typecheck and ESLint: passed.
- Full replay package: **162/162 passed**; replay typecheck passed.
- Full runtime-service package: **94/94 passed**; service typecheck passed.
- v1.36 historical proof: passed with **8 artifacts and 11 sources**.
- v1.37 integrity-authority artifact check: current.
- Persistence-ready executable inventory: passed with **8 exact references** and **12 non-executable mentions**.
- Targeted Prettier, `git diff --check`, and protected-byte checks: passed.

## Protected Working Bytes

- `.planning/config.json` remains `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`; binary diff remains `1372d196c86ee3907fcac07a7075b06814f2eaedf328314a31641713c71e6765`.
- `CowardsGameSpec_Full_Consolidated_v1.md` remains `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`; binary diff remains `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`.
- Neither protected file, `STATE.md`, nor `ROADMAP.md` was staged or modified by this plan.

## User Setup Required

None.

## Next Phase Readiness

- Plan 19 can register/install the candidate tuple and exercise the already-staged receipt-backed success branch without weakening semantic admission or changing the active route piecemeal.
- Plan 20 can audit one transition authority, exact persistence drift guards, zero-mutation failure ownership, and the remaining executable inventory.
- The publication-authority RED noted above remains visible for milestone-wide convergence; Plan 16 did not conceal or bypass it.

## Self-Check: PASSED

- All five Plan-16-owned implementation/test files and task commit `7380adb` exist.
- Candidate validation precedes derivation and transaction entry; exact current success is proved now; candidate authority is not fabricated.
- Every planned invalidity/rollback/idempotence class snapshots exact row content and preserves player-penalty boundaries.
- Historical proof, replay, service, inventory, type, lint, format, and protected-byte gates pass; the independent publication RED is explicitly recorded for milestone closure.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
