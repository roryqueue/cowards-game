---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "11"
subsystem: go-runtime-and-persistence-authority
tags: [go, canonical-json, runtime-abi, retry, postgres, rollback]
requires:
  - phase: 258-05
    provides: Bounded canonical JSON service admission
  - phase: 258-06
    provides: Authenticated exclusive v1.17 invocation envelope
  - phase: 258-07
    provides: Engine-only penalties and no-mutation system failure
  - phase: 258-08
    provides: TypeScript raw ABI candidate
  - phase: 258-09
    provides: Python raw ABI and exact source identity
  - phase: 258-10
    provides: Rust/Zig host-owned ABI and exact execution identity
provides:
  - Go canonical JSON v1.1 parity over the complete 70-vector corpus
  - Exact signed v1.17 request, success, failure, budget, and retry admission
  - One generated deny-default version and failure authority with immutable v1.16 checks
  - Service-backed PostgreSQL rollback and zero-mutation proof for system and persistence failures
affects: [258-12, 258-13, 258-14, 259]
tech-stack:
  added: []
  patterns:
    - Raw bytes are bounded and canonically admitted before Go map conversion
    - Retry is Go-owned, limited to retryable system failure, and reuses identical signed request bytes
    - Generated historical failure membership is exposed only through deny-default accessors and fresh snapshots
key-files:
  created:
    - apps/go-backend/canonical_json_v1_1.go
    - apps/go-backend/runtime_invocation_v1_17.go
    - apps/go-backend/runtime_invocation_v1_17_helpers_test.go
  modified:
    - apps/go-backend/runtime_execution_contract_gen.go
    - apps/go-backend/runtime_invocation_v1_17_test.go
    - apps/go-backend/runtime_service_client.go
    - scripts/generate-go-parity-fixtures.ts
    - scripts/generate-go-parity-fixtures.test.ts
    - packages/persistence/src/complete-match.test.ts
key-decisions:
  - "Go v1.17 consumes the same bounded canonical JSON profile and corpus as TypeScript; v1.16 keeps its historical dispatch and immutable wire bytes."
  - "The Go client owns a fixed three-attempt ceiling, retries only signed retryable system failures, and never lets caller input expand the signed cumulative budget."
  - "Successful payloads are admitted by the exact method-bound schema and memory/objective ceilings before the service may consume them."
  - "Generated version, retryability, and historical failure lookups are deny-default functions; callers receive fresh snapshots rather than mutable authority maps."
requirements-completed: [RABI-01, RABI-02, RABI-03, RABI-04, RABI-05, RABI-06, RABI-08]
coverage:
  - id: D1
    description: "Go enumerates the complete canonical JSON corpus and agrees with TypeScript on duplicate keys, Unicode, ordering, numbers, depth, collection limits, canonical bytes, and corpus identity."
    requirement: RABI-01
    verification:
      - kind: integration
        ref: apps/go-backend/canonical_json_corpus_test.go
        status: pass
    human_judgment: false
  - id: D2
    description: "Signed requests bind exact prestate, method, tuple, identity, input, and budgets; only retryable system failures repeat identical bytes within the local and signed cumulative attempt ceilings."
    requirement: RABI-03
    verification:
      - kind: integration
        ref: apps/go-backend/runtime_invocation_v1_17_test.go
        status: pass
    human_judgment: false
  - id: D3
    description: "Named PostgreSQL proofs show retry, system failure, stale identity, and injected persistence failure cannot partially commit Chronicle, Match, job, attempt, memory, receipt, or gameplay state."
    requirement: RABI-04
    verification:
      - kind: service
        ref: TestPhase258CanonicalRetryPostgres
        status: pass
      - kind: service
        ref: TestPhase258CompletionRollbackPostgres
        status: pass
    human_judgment: false
duration: 1h 2min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 11: Go Retry and Persistence Authority Summary

**Go now admits the same bounded canonical v1.17 bytes as TypeScript, verifies exact signed runtime results, owns a finite byte-identical retry policy, and proves through PostgreSQL that system or persistence failure leaves no partial gameplay or evidence mutation.**

## Performance

- **Duration:** 1h 2min
- **Started:** 2026-07-14T14:07:33-04:00
- **Completed:** 2026-07-14T15:09:25-04:00
- **Tasks:** 2 TDD tasks plus three independent review/fix loops
- **Files changed:** 24 implementation, test, generator, and artifact files

## Requirements and Coverage

- **RABI-01 / RABI-02:** Go performs bounded raw admission before materialization and emits the frozen canonical JSON profile with TypeScript-equivalent errors and hashes.
- **RABI-03 / RABI-04:** The signed request and response preserve exactly one success, player-violation, or system-failure owner; system failure is the only retryable class and causes no persistence mutation.
- **RABI-05 / RABI-06:** Method inputs, success payloads, traces, StrategyMemory, SoldierMemory, objectives, collections, and complete envelopes enforce the shared exact limits and failure semantics.
- **RABI-08:** The sole generator writes the additive v1.17 Go contract, recomputes immutable v1.16 evidence in memory, rejects v1.16 writes, and produces deny-default accessors instead of mutable authority maps.

## Accomplishments

- Implemented the Go canonical JSON v1.1 codec and retired the Go expected-RED sentinel only after both languages enumerated the same 70-vector corpus, root, and enumeration identity.
- Made `scripts/generate-go-parity-fixtures.ts` the sole writer of versioned Go contract output. The generator refuses historical writes, checks exact v1.16 request and response bytes, and emits explicit v1.16/v1.17 deny-default dispatch.
- Added an inactive v1.17 Go invocation path that verifies authenticated request/response bindings, exact runtime/toolchain/artifact identity, method-specific inputs and successful payloads, exclusive result ownership, and redacted registered failures.
- Bound retry to identical signed request bytes and prestate. Player violations never retry; system failures retry only when the generated contract says they are retryable; cancellation stops processing immediately after transport returns; and the Go-owned ceiling cannot exceed three total attempts or the signed cumulative budget.
- Enforced exact successful-output shapes and resource ceilings: closed activation orders/actions/directions, 32 KiB StrategyMemory, 2 KiB SoldierMemory, 1 KiB objective, and 256 KiB aggregate payload/collection limits.
- Added exact named PostgreSQL tests with no skip path. Eight canonical-retry cases and eight completion/rollback cases prove state equality or atomic rollback across Chronicle, Match, job, attempt, receipt, memory, standings, and gameplay persistence.
- Replaced generated mutable retryability and historical failure-code maps with immutable deny-default lookup functions and fresh diagnostic snapshots whose mutation cannot change classification.

## Full Task and Review Commit History

1. **Task 1: Isolate versioned Go parity generation** — `b895921`
2. **Task 1: Verify signed runtime invocation retries** — `30d6c46`
3. **Canonical-admission RED: Expose strict canonical admission gaps** — `ab3ab3d`
4. **Canonical-admission GREEN: Enforce canonical v1.17 admission** — `9851ff5`
5. **Task 2 fixture: Align deployment fixture engine identity** — `a09dc02`
6. **Task 2 proof: Prove canonical retry leaves persistence unchanged** — `27aee26`
7. **Corpus closure: Retire Go canonical expected RED** — `fcfb21f`
8. **Persistence cleanup: Satisfy clone lint** — `1b43ee0`
9. **Generator cleanup: Declare Node Buffer imports** — `891aaf5`
10. **Review RED: Expose retryability pair drift** — `05e1716`
11. **Review RED: Expose signed success validation gaps** — `9ea38a5`
12. **Review GREEN: Bind system-failure retryability** — `114d50e`
13. **Review RED: Expose unbounded retry policy** — `6625490`
14. **Review GREEN: Validate success payloads and bound retries** — `ad69a5f`
15. **Review RED: Expose retryability generation drift** — `f36aad9`
16. **Review RED: Expose nested payload stripping** — `89b4211`
17. **Review GREEN: Generate Go retryability authority** — `cef7ff6`
18. **Review RED: Expose signed payload admission drift** — `2a864eb`
19. **Review GREEN: Reject noncanonical success shapes** — `231e807`
20. **Rereview RED: Expose cancellation and retry-attempt drift** — `4e62dc6`
21. **Rereview RED: Expose generated authority mutability** — `abf684b`
22. **Rereview GREEN: Close retry and generated-authority gaps** — `fc8e2ce`
23. **Final P2 RED: Expose historical failure-map mutation** — `fe089bc`
24. **Final P2 GREEN: Make historical failure lookup immutable** — `bce2a2c`

## Exact Verification

- Generator suite passed **10/10**; write/check mode reported immutable v1.16 request SHA-256 `5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5` and response SHA-256 `9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97`.
- Canonical corpus green proof passed all **70 vectors** with corpus root `f658a8...2722c0` and enumeration identity `0a70be...8ef7`; no Go expected-RED sentinel remains.
- Relevant spec proof passed **6 files / 56 tests** plus typecheck and ESLint. The final strict contract/hash subset passed **4 files / 47 tests** plus typecheck and ESLint.
- Persistence passed **20 files / 229 tests** serially, followed by package typecheck and ESLint.
- Final `pnpm go:parity` passed generator check and the complete Go package in **7.513s**.
- `TestPhase258CompletionRollbackPostgres` passed **8/8** subtests with no skip: injected faults after Chronicle, Match, job, attempt, and at commit, plus three late-status fail-closed cases.
- `TestPhase258CanonicalRetryPostgres` passed **8/8** subtests with no skip: proven timeout, adapter crash, transport error, truncated envelope, unavailable accounting, signed system crash, invalid output, and stale artifact.
- Historical semantic receipt `360520...d1d`, Go client test `4a5298...18f5`, and migration 0017 `ac19e1...a69` remained exact. The only approved source-integrity rebase was `runtime_service_client.go` to `9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c` after replacing a mutable lookup with an equivalent immutable accessor.
- `git diff --check` passed. Protected pre-existing changes to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` were not touched or staged.

## Decisions Made

- Keep v1.17 additive and inactive. Go version dispatch is explicit and deny-default, while v1.16 request/response serialization, receipt inputs, migration, parser behavior, and failure-code membership retain their historical meaning.
- Interpret `Retry.Attempt` as a local zero-based attempt index and clamp total work to both the three-attempt Go policy and the remaining signed cumulative budget. Caller input cannot widen retry authority.
- Check cancellation after every transport return before success or player classification. Once host cancellation is observed, untrusted returned bytes cannot be consumed into a gameplay or player-owned outcome.
- Treat generated tables as diagnostics, not mutable authority. Runtime classification uses generated switch accessors, and any exported/test snapshot is a fresh clone.
- Validate success semantically before consumption, not merely as canonical outer JSON. A correctly signed but method-invalid or oversized nested payload is a system-owned boundary failure, never silently stripped or accepted.

## Deviations and Surprises

### Auto-fixed Issues

1. **[High — signed success] Canonical outer bytes did not initially prove a method-valid success payload.**
   - Added one shared exact payload schema and Go checks for action, direction, memory, objective, collection, and aggregate limits.
   - Closed by RED `9ea38a5` / GREEN `ad69a5f`, then strict-shape RED `2a864eb` / GREEN `231e807`.

2. **[High — retry authority] Caller limits, failure-code/retryability pairs, and signed cumulative attempts could drift.**
   - Moved the ceiling to Go, generated the exact retryability relation, reused identical request bytes, and clamped local plus signed remaining attempts.
   - Closed by REDs `05e1716`, `6625490`, `f36aad9`, and `4e62dc6`; GREENs `114d50e`, `ad69a5f`, `cef7ff6`, and `fc8e2ce`.

3. **[High — generated authority] Mutable generated maps allowed tests or package code to change retry and historical failure classification.**
   - Replaced both with deny-default accessors and fresh snapshots, including a hardcoded 13-code historical truth table.
   - Closed by REDs `abf684b` and `fe089bc`; GREENs `fc8e2ce` and `bce2a2c`.

4. **[Medium — fixture identity] A PostgreSQL deployment fixture carried stale engine identity.**
   - Updated only the active fixture identity so the named service proof exercised current exact authority rather than bypassing or weakening the check.
   - Closed in `a09dc02`.

5. **[Positive surprise — transactional seam] Completion and persistence already had the required transaction boundary.**
   - No production completion rewrite was necessary. The work added adversarial named proofs and minor test hygiene, and all injected partial-write cases rolled back under the existing transaction authority.

**Total deviations:** Five reviewed findings/surprises, all closed without gameplay activation or v1.16 semantic reinterpretation.

## Issues Encountered

The final immutable historical failure lookup necessarily changed the exact source bytes of `runtime_service_client.go`. This was explicitly approved as behavior-preserving integrity hardening. Only the active source-hash guards were rebased; the v1.16 wire, receipt/signature inputs, parser behavior, failure membership, client proof, and migration remained byte-identical.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-12 can consume one strict Go/TypeScript contract, immutable version/failure lookup, exact per-invocation budget evidence, and service-backed rollback proof to construct runtime/preflight ledgers and publish truthful fail-closed lane capabilities. v1.17 remains inactive until the Plan 258-14 atomic activation decision.

## Review Closure: ZERO

Independent review, external rereview, and final P2 rereview are closed. Every reproduced finding has a committed RED/GREEN pair, the focused and full suites pass, and the final reviewer reported **ZERO remaining findings**.

## Self-Check: PASSED

- Summary, roadmap, and state record Plan 258-11 complete and Plan 258-12 next.
- All listed implementation and proof commits exist.
- Exact named PostgreSQL tests passed without `SKIP`.
- v1.16 request/response and protected historical evidence hashes remain exact.
- Only the three requested planning documents are staged by the documentation commit.

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
