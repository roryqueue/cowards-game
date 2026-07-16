---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "21"
subsystem: go-current-completion
tags: [go, ed25519, chronicle, postgresql, privacy, transactions]
requires:
  - phase: 259-17
    provides: Additive v1.18 service admission and signed semantic receipt
  - phase: 259-18
    provides: Shared semantic and reconstruction admission before persistence
  - phase: 259-20
    provides: Independent branded Go v1.18 receipt verifier
provides:
  - Explicit v1.18 Go request, client, router, orchestrator, and completion route
  - Token-protected internal completion envelope with unchanged receipt-only default response
  - Structural-only Go Chronicle persistence with strict v1.18 receipt versioning
affects: [259-22, 259-23, go-backend, runtime-service, persistence]
tech-stack:
  added: []
  patterns:
    - Authenticate the public receipt before accepting separately protected Chronicle/final-state documents
    - Persist signed canonical anchors without reimplementing current event, transition, terminal, or replay semantics in Go
key-files:
  created:
    - packages/persistence/migrations/0025_runtime_semantic_receipts_v1_18.sql
  modified:
    - apps/go-backend/runtime_service_client_v1_18.go
    - apps/go-backend/runtime_service_router.go
    - apps/go-backend/orchestrator.go
    - apps/go-backend/completion.go
    - apps/runtime-service/src/server.ts
key-decisions:
  - "The v1.18 default service response remains receipt-only; Chronicle and final-state documents cross only a constant-time token-protected internal envelope."
  - "Go validates canonical document hashes, exact tuple/request/certificate/source/freshness bindings, privacy, locked authority, and transaction state, but does not inspect current event vocabulary/order, snapshots, terminal semantics, or replay transitions."
  - "The selected production pointer remains v1.17 until Plan 22 installs managed signer and producer trust; the v1.18 route is executable but fail-closed without explicit dependencies and keys."
  - "The additive v1.18 service envelope continues to bind the canonical v1.17 gameplay semantic tuple; it does not fabricate a second gameplay tuple."
patterns-established:
  - "Current v1.18 completion accepts only an unexported authenticated verifier result plus its exact canonical receipt bytes."
requirements-completed: [CONF-05, CHRN-04, CHRN-05]
coverage:
  - id: D1
    description: Exact v1.18 request/response, receipt, trace, two-sided certificate, source, freshness, tuple, accounting, document-hash, and version bindings reach completion only through the branded verifier.
    requirement: CONF-05
    verification:
      - kind: unit
        ref: "apps/go-backend/runtime_service_client_v1_18_test.go#TestPhase259RuntimeServiceV118AdmitsOnlyTheExactAuthenticatedPublicResponse"
        status: pass
      - kind: integration
        ref: "apps/go-backend/completion_test.go#TestPhase259RuntimeServiceV118CompletionIsStructuralAndTransactional"
        status: pass
    human_judgment: false
  - id: D2
    description: Current Go completion performs no event-order, snapshot, terminal, transition, or reconstruction interpretation and preserves prior versions.
    requirement: CHRN-04
    verification:
      - kind: unit
        ref: "apps/go-backend/completion_test.go#TestPhase259CurrentV118CompletionHasNoGoChronicleSemanticAuthority"
        status: pass
      - kind: integration
        ref: "COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm go:parity"
        status: pass
    human_judgment: false
  - id: D3
    description: Default service output omits gameplay documents, the protected internal envelope is exact, and early or late failures preserve zero durable gameplay mutation.
    requirement: CHRN-05
    verification:
      - kind: integration
        ref: "apps/runtime-service/src/execute-match-v1-18.test.ts#keeps completion documents behind the authenticated internal envelope"
        status: pass
      - kind: integration
        ref: "apps/go-backend/completion_test.go#TestPhase259RuntimeServiceV118CompletionIsStructuralAndTransactional"
        status: pass
    human_judgment: false
duration: 31min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 21: Authenticated Go Completion Summary

**Go can now consume the shared v1.18 semantic authority as a structural persistence owner without becoming another Chronicle, replay, or gameplay engine.**

## Accomplishments

- Added strict v1.18 request/public-response decoding, closed shapes, canonical request hashing, independent Ed25519 verification, and safe system failures.
- Added explicit router and orchestrator v1.18 branches with exact two-sided certificate lanes, source identities, freshness, tuple, accounting, and receipt bytes.
- Added a token-protected internal completion envelope while leaving the default service response receipt-only.
- Added structural Go completion that hashes exact Chronicle/final/outcome bytes but does not inspect event types/order, snapshot kinds, terminal outcome derivation, state transitions, or replay.
- Added migration 0025 so persisted v1.18 receipts are version-strict through their nested signed claim without rewriting historical rows.
- Preserved exact v1.16 byte hashes and explicit v1.17 dispatch.

## Commits

- `b934882` — implement authenticated v1.18 service, Go routing, structural completion, internal document channel, and strict receipt persistence.
- `65adda5` — preserve v1.17 Strategy validation when the additive v1.18 execution envelope is selected.

## Review and Auto-Fixed Issues

- Exact conformance lane ID was initially unavailable from the claimed SQL identity; the claim now carries `conformance_lane_id` from the locked certificate row instead of deriving or guessing it.
- Adding v1.18 failure shape to the shared client changed immutable v1.16 bytes; the field was isolated in a v1.18-only type and historical hashes returned exact.
- A receipt-only response could otherwise leave a Go job waiting for completion documents; the client now converts missing protected documents into a retryable system failure.
- The first review found Strategy validation would become unavailable under the v1.18 service selector; it now explicitly reuses the unchanged v1.17 provider-validation contract because the Strategy ABI remains v1.17.

## Verification

- PostgreSQL-backed full Go suite and generated parity: passed.
- Runtime-service v1.18, HTTP boundary, and migration suites: passed.
- Workspace typecheck: 27/27 tasks.
- Workspace lint: 15/15 packages.
- Boundary imports: zero strict offenses.
- Protected working-tree baseline: exact.
- `go vet ./...` reports only the three pre-existing unreachable-code findings documented in Plan 20.

## Historical and Activation Boundaries

- No Match state, Action legality, event order, outcome, Strategy observation, or v1.4 ruling changed.
- The v1.18 route remains fail-closed and inactive by default until managed trust and signing are installed in Plan 22.
- The internal completion envelope is not a public/default product output and requires the existing constant-time private artifact token.

## Self-Check: PASSED

- All focused and full gates pass with the required database environment.
- Historical v1.16 hashes remain exact.
- Only the two protected pre-existing working-tree files remain dirty.

