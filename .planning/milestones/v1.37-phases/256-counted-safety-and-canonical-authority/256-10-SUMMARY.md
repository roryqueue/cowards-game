---
phase: 256-counted-safety-and-canonical-authority
plan: "10"
subsystem: go-authority
tags: [go, ed25519, semantic-tuple, anti-rollback, readiness, startup]
requires:
  - phase: 256-02
    provides: executable lane eligibility and exact evidence rules
  - phase: 256-03
    provides: atomic semantic tuple contract
  - phase: 256-17
    provides: signed authority envelope and durable anti-rollback contract
  - phase: 256-18
    provides: production-empty certificate authority and generated evidence graph
provides:
  - independent Go tuple and signed-authority verification against committed TypeScript vectors
  - evidence-derived disabled, exhibition-only, and counted readiness classification
  - restart-safe authority pin and durable high-water enforcement before Go live startup
affects: [go-runtime-client, go-match-creation, go-completion, service-proof]
tech-stack:
  added: []
  patterns: [standard-library Ed25519 verification, fixed-field tuple framing, atomic fsync high-water, dependency-injected startup]
key-files:
  created:
    - apps/go-backend/integrity_evidence.go
    - apps/go-backend/integrity_evidence_test.go
    - apps/go-backend/runtime_evidence_authority.go
    - apps/go-backend/runtime_evidence_authority_test.go
  modified:
    - apps/go-backend/provider_readiness.go
    - apps/go-backend/provider_readiness_test.go
    - apps/go-backend/live_backend.go
    - apps/go-backend/main.go
    - apps/go-backend/main_test.go
    - apps/go-backend/phase244_account_provider_db_test.go
key-decisions:
  - "Go consumes exact generated tuple and authority bytes; it does not maintain an independent semantic-version or promotion registry."
  - "Provider validation can describe an artifact but cannot promote provider readiness without current authority-selected executable evidence."
  - "Live Go startup verifies and durably anchors production authority before opening PostgreSQL, constructing orchestration, returning routes, or listening."
patterns-established:
  - "Go authority activation: verify exact envelope and payload, enforce deployment pin, atomically fsync high water, reread the installed anchor, then expose authority."
  - "Startup ordering is dependency-injected and asserted by zero-call tests for pool, orchestrator, handler, and listener boundaries."
requirements-completed: [SAFE-01, SAFE-02, AUTH-02, AUTH-03]
coverage:
  - id: D1
    description: "Go reproduces canonical tuple bytes and exact signed authority identity"
    requirement: AUTH-02
    verification:
      - kind: unit
        ref: "apps/go-backend/integrity_evidence_test.go"
        status: pass
      - kind: unit
        ref: "apps/go-backend/runtime_evidence_authority_test.go"
        status: pass
    human_judgment: false
  - id: D2
    description: "Readiness is derived from exact current containment and conformance evidence, never provider proof"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "apps/go-backend/provider_readiness_test.go"
        status: pass
      - kind: unit
        ref: "apps/go-backend/integrity_evidence_test.go"
        status: pass
    human_judgment: false
  - id: D3
    description: "Invalid or unanchored authority prevents every live Go startup side effect"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "apps/go-backend/main_test.go#TestNewLiveServerRejectsAuthorityBeforePoolOrOrchestrator"
        status: pass
      - kind: unit
        ref: "apps/go-backend/main_test.go#TestRunGoBackendDoesNotListenWhenAuthorityInvalid"
        status: pass
    human_judgment: false
duration: 17min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 10: Go Authority Parity and Fail-Closed Startup Summary

**Go now independently agrees with canonical tuple and signed-authority bytes, derives readiness only from exact evidence, and cannot start its live backend before production authority is verified and durably anchored.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-13T07:14:17Z
- **Completed:** 2026-07-13T07:31:03Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Implemented the fixed-order, domain-separated UTF-8 tuple encoder and verified every committed TypeScript byte/hash vector, including exact-selector and tuple-expansion rejection.
- Added an independent standard-library Go Ed25519 loader with strict bounded JSON, exact payload hashing, closed-graph/freshness checks, production/fixture trust isolation, deployment pins, and restart-safe generation/hash high water.
- Replaced provider-readiness promotion with exact authority evidence classification: no containment is disabled, containment alone is exhibition-only, and counted requires the complete current pair.
- Moved production authority verification ahead of PostgreSQL connection, orchestrator construction/start, live route return, and HTTP listen while preserving fixture mode as an explicitly non-live test surface.

## Task Commits

1. **Task 1 RED: Go tuple and authority parity cases** - `830b264` (test)
2. **Task 1 GREEN: independent Go verifier and durable anchor** - `f1072d6` (feat)
3. **Task 2 RED: evidence-derived readiness cases** - `5f17560` (test)
4. **Task 2 GREEN: exact classifier-backed readiness** - `a92e859` (feat)
5. **Task 3 RED: startup authority ordering cases** - `7a11333` (test)
6. **Task 3 GREEN: fail-closed live startup wiring** - `b8acbb4` (feat)

## Files Created/Modified

- `apps/go-backend/integrity_evidence.go` and `integrity_evidence_test.go` - Consume canonical generated tuple data and classify exact evidence with committed cross-language vectors.
- `apps/go-backend/runtime_evidence_authority.go` and `runtime_evidence_authority_test.go` - Verify Ed25519 authority and atomically maintain restart-safe generation/hash high water under failure, concurrency, rollback, and fork cases.
- `apps/go-backend/provider_readiness.go` and `provider_readiness_test.go` - Remove provider-proof promotion and expose disabled/exhibition/counting status from authority evidence.
- `apps/go-backend/live_backend.go`, `main.go`, and `main_test.go` - Enforce verified authority before any live mutable dependency or listener and retain non-live fixture behavior.
- `apps/go-backend/phase244_account_provider_db_test.go` - Align persisted provider-readiness expectations with fail-closed evidence requirements.

## Decisions Made

- The semantic tuple remains exactly six fields. Language, toolchain, adapter, artifact, corpus, and certificate identity are executable evidence and never affect tuple minting.
- A provider proof is validation metadata, not executable containment or conformance authority; production conformance remains intentionally empty until Phase 259.
- All live-startup authority failures collapse to `live Go backend authority unavailable`; configured paths, key material, signatures, graph nodes, and anchor details are not returned.

## Deviations from Plan

None - all three tasks were implemented in RED/GREEN order.

## Issues Encountered

- The Go live entrypoint originally combined database creation, orchestration construction, and listener startup with no injectable ordering boundary. Small dependency seams made the fail-before-side-effect property directly testable without opening a database or socket.

## User Setup Required

Production live mode requires the same six runtime-authority environment values as runtime-service: bundle path, public-key path, high-water path, minimum generation, minimum bundle hash, and explicit bootstrap mode when installing the first exact pin. The integrity manifest path is optional and defaults to the committed generated artifact.

## Verification

- `pnpm exec tsx scripts/generate-v1-37-integrity-authority.ts --check` passed.
- `pnpm exec tsx scripts/generate-v1-37-runtime-evidence-authority-vectors.ts --check` passed.
- Focused Go tuple, authority, readiness, and startup run passed.
- Full `cd apps/go-backend && go test ./... -count=1` passed.
- `git diff --check` passed for plan-owned changes.

## Next Phase Readiness

- Plan 256-11 can bind claim, transport, completion, and Chronicle persistence to the verified authority object without trusting request or response echoes.
- Plan 256-12 can replace legacy Go MatchSet creation gates with exact per-entrant authority evidence while production conformance remains empty.
- No Match state, Action legality, event order, outcome, Strategy observation, or historical v1.4 evidence changed.

## Self-Check: PASSED

- Six RED/GREEN commits exist in task order.
- Generated vectors, focused authority/startup cases, and the full Go suite pass.
- The protected consolidated spec and `.planning/config.json` remain untouched and unstaged.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
