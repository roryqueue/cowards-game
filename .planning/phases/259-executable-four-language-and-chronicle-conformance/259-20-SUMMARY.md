---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "20"
subsystem: go-runtime-service-admission
tags: [go, ed25519, canonical-json, certificates, privacy]
requires:
  - phase: 259-17
    provides: Issuance-only v1.18 runtime-service semantic receipt
  - phase: 259-30
    provides: Public spec-owned v1.18 claim, field tables, and verification contract
provides:
  - Strict additive Go v1.18 canonical receipt parser
  - Independent Ed25519 verification and exact expected-claim binding
  - Branded verified result and privacy-safe public projection
affects: [259-21, go-backend, completion, orchestrator]
tech-stack:
  added: []
  patterns:
    - Parse canonical receipt bytes and authenticate shared semantic claims without porting Chronicle or Match semantics
    - Collapse all verifier faults to one system-owned no-mutation public failure
key-files:
  created:
    - apps/go-backend/runtime_service_client_v1_18.go
    - apps/go-backend/runtime_service_client_v1_18_test.go
  modified: []
key-decisions:
  - "Go v1.18 generation validation follows the spec's exact 1-16 digit string grammar rather than the older shared safe-integer cap."
  - "The verified result carries the exact authenticated claim, claim hash, receipt hash, and safe projection; Go does not interpret Chronicle events or replay transitions."
patterns-established:
  - "Generated v1.18 field tables drive exact closed-object presence checks before typed decoding and Ed25519 verification."
requirements-completed: [CONF-04, CONF-05, CHRN-04, CHRN-05]
coverage:
  - id: D1
    description: Go independently accepts the exact generated v1.18 Ed25519 receipt and rejects field, side, freshness, source, version, signature, and canonical-wire mutations.
    requirement: CONF-04
    verification:
      - kind: unit
        ref: "apps/go-backend/runtime_service_client_v1_18_test.go#TestPhase259RuntimeSemanticReceiptV118"
        status: pass
      - kind: integration
        ref: "COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game PATH=/usr/local/go/bin:$PATH go test ./... -count=1"
        status: pass
    human_judgment: false
  - id: D2
    description: Go preserves prior service versions and exposes no source, artifact, memory, objective, diagnostic, host, key, or semantic-engine authority.
    requirement: CHRN-05
    verification:
      - kind: unit
        ref: "apps/go-backend/runtime_service_client_v1_18_test.go#TestPhase259RuntimeSemanticReceiptV118ProjectionAndFailureArePrivacySafe"
        status: pass
      - kind: integration
        ref: "COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm go:parity"
        status: pass
    human_judgment: false
duration: 18min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 20: Go v1.18 Semantic Receipt Verification Summary

**Go now authenticates the exact two-sided v1.18 service-admission receipt while remaining a structural verifier rather than a second Chronicle or Match authority.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-16T20:48:00Z
- **Completed:** 2026-07-16T21:06:00Z
- **Tasks:** 1 TDD task
- **Files modified:** 2

## Accomplishments

- Added strict canonical JSON v1.1 parsing with exact generated field presence for the receipt, claim, tuple, both certificate references, both source identities, terminal, accounting, and result.
- Recomputed the successor semantic tuple identity, enforced generation/freshness/side/source closure, and verified the exact framed claim through Ed25519.
- Bound the receipt to an independently supplied exact expected claim and returned authenticated receipt/claim hashes plus a privacy-safe projection.
- Preserved v1.16/v1.17 descriptors and dispatch and added source guards against Chronicle event parsing, replay, Strategy execution, or Match rules.

## Task Commits

1. **RED: Add failing exact-vector, mutation, privacy, and authority-boundary tests** - `c1c7f2e`
2. **GREEN: Implement strict v1.18 Go parser and Ed25519 verifier** - `d2101bf`

## Files Created/Modified

- `apps/go-backend/runtime_service_client_v1_18.go` - Additive parser, validator, verifier, branded result, and safe projection.
- `apps/go-backend/runtime_service_client_v1_18_test.go` - Exact fixture parity, every-binding mutations, signed invalid claims, closed shapes, key/signature/version confusion, privacy, and prior-version guards.

## Decisions Made

- Used the generated v1.18 claim/reference/source field arrays as runtime shape authority instead of relying on Go zero values to detect missing fields.
- Matched the spec generation grammar exactly as a string; the older Go safe-integer ceiling is not valid for this additive contract.
- Kept all rejection detail internal and returned the fixed `SEMANTIC_RECEIPT_INVALID` system-integrity/no-mutation failure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected v1.18 generation validation drift**

- **Found during:** Inline adversarial code review
- **Issue:** Reusing the older Go generation helper would reject spec-valid 16-digit string generations above JavaScript's safe-integer maximum.
- **Fix:** Added the exact v1.18 regex grammar and positive/negative cross-boundary tests.
- **Files modified:** `apps/go-backend/runtime_service_client_v1_18.go`, `apps/go-backend/runtime_service_client_v1_18_test.go`
- **Verification:** Focused verifier suite, full Go suite, and generated parity gate passed.
- **Committed in:** `d2101bf`

**Total deviations:** 1 auto-fixed bug.
**Impact on plan:** The correction prevents cross-language receipt drift without changing gameplay or prior-version behavior.

## Issues Encountered

- The unqualified full Go/parity commands initially reached mandatory PostgreSQL proofs without `COWARDS_GO_BACKEND_TEST_DATABASE_URL`. Rerunning with the repository's required test database environment passed fully.
- `go vet ./...` reports three pre-existing unreachable-code findings in unrelated test files; the changed files introduce no vet finding.

## User Setup Required

None.

## Next Phase Readiness

Plan 21 can consume only the branded verified v1.18 result and remove current Go Chronicle semantic interpretation from normal completion.

## Self-Check: PASSED

- Both declared files exist.
- RED and GREEN commits exist.
- Focused v1.18 verifier suite passed.
- Full PostgreSQL-backed Go suite passed.
- Generated TypeScript/Go parity passed and v1.16 immutable hashes remained exact.
- Protected working-tree baseline remained exact.
