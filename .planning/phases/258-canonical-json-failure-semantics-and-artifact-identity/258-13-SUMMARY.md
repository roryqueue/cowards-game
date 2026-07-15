---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "13"
subsystem: runtime-evidence-graph-and-successor-receipt
tags: [runtime-identity, evidence-dag, canonical-receipt, managed-attestation, ts-go-parity]
requires:
  - phase: 258-04
    provides: bounded canonical JSON and framed identity domains
  - phase: 258-09
    provides: exact original and normalized source identity
  - phase: 258-11
    provides: Go canonical parity and rollback authority
  - phase: 258-12
    provides: exact ledgers, causal receipts, and fail-closed capability evidence
provides:
  - Closed 15-node and 26-edge runtime evidence graph with one root and ten exact pins
  - Managed-identity import, persistence, publication, and mounted-loader authority
  - Additive canonical v1.17 full-service receipt with exact TypeScript and Go parity
  - Disjoint invocation and full-service fixture namespaces under one sole-writer generator
affects: [258-14, 259]
key-files:
  created:
    - packages/spec/src/runtime-evidence-v1-17.ts
    - packages/spec/src/runtime-evidence-attestation-v1-17.ts
    - packages/spec/src/runtime-execution-service-v1-17.ts
    - packages/persistence/migrations/0020_runtime_evidence_v1_17_graph.sql
    - apps/runtime-service/src/semantic-receipt-v1-17.ts
    - apps/go-backend/runtime_semantic_receipt_v1_17.go
  modified:
    - packages/spec/src/runtime-evidence-authority-bundle.ts
    - packages/persistence/src/runtime-evidence-import.ts
    - packages/persistence/src/runtime-evidence-authority-publisher.ts
    - apps/runtime-service/src/runtime-evidence-authority.ts
    - scripts/generate-go-parity-fixtures.ts
key-decisions:
  - "The v1.17 evidence profile is an exact 15-node, 26-edge DAG with one evidence-bundle root and ten ABI-ordered exact pins."
  - "Only canonical managed-identity signatures over the complete typed record can certify evidence; production trusted producers remain empty."
  - "Invocation and full-service receipt fixtures have disjoint namespaces and both are mandatory in the normal generator check."
  - "The v1.17 receipt is additive and u64-framed; immutable v1.16 insertion-ordered bytes and dispatch remain independently valid."
requirements-completed: [RABI-05, RABI-06, RABI-07, RABI-08]
coverage:
  - id: D1
    description: "The complete evidence DAG is exact, acyclic, cardinality-correct, domain-separated, and reconstructable across storage and publication."
    requirement: RABI-05
    verification:
      - kind: integration
        ref: packages/spec/src/runtime-evidence-attestation-v1-17.test.ts
        status: pass
      - kind: database
        ref: packages/persistence/src/runtime-evidence-authority-publisher.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "Managed identity, canonical signature spelling, exact generations, and all ten runtime/toolchain/policy pins fail closed when incomplete or substituted."
    requirement: RABI-07
    verification:
      - kind: integration
        ref: apps/runtime-service/src/runtime-evidence-authority.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: "TypeScript and Go produce and verify identical canonical v1.17 full-service claims while v1.16 bytes remain immutable."
    requirement: RABI-08
    verification:
      - kind: cross-language
        ref: apps/go-backend/runtime_semantic_receipt_v1_17_test.go
        status: pass
      - kind: generation
        ref: scripts/generate-go-parity-fixtures.test.ts
        status: pass
    human_judgment: false
duration: 1h 12min active implementation plus resumed final validation
completed: 2026-07-15
status: complete
---

# Phase 258 Plan 13: Evidence Graph and Successor Receipt Summary

The successor runtime now has one exact, language-neutral evidence graph from source through full-service receipt, and every storage or publication boundary recomputes that authority instead of accepting a shallow declaration. The work remains additive and inactive until Plan 14.

## Performance

- Active implementation: 1h 12min (2026-07-14T20:31:50-04:00 to 2026-07-14T21:43:30-04:00)
- Final validation resumed: 2026-07-15 after an overnight model-capacity interruption
- Tasks: 3 TDD tasks plus four adversarial review/fix loops
- Change range: 14 atomic commits, 33 files, 4,161 insertions and 91 deletions

## Accomplishments

- Froze `runtime-evidence-graph-v1.17` / `runtime-identity-evidence-dag-v1` as exactly 15 nodes, 26 typed root-to-dependency edges, one evidence-bundle root, and ten ABI-ordered exact pins.
- Recomputed domain-separated nodes, edges, cardinalities, root, acyclicity, pins, record hashes, and certificates at import, persistence, publication, and mounted loading. Floating, stale, shallow, cyclic, extra, missing, swapped, or self-certified variants fail closed.
- Added migration 0020 without reinterpreting old evidence and kept production trusted-producer authority empty.
- Minted a strict additive v1.17 full-service receipt whose canonical claim, signature, certificate, and wire bytes agree in TypeScript and Go.
- Separated per-invocation and full-service fixture families and made the sole-writer generator require both in its normal check while retaining an explicit historical-only audit mode.
- Expanded immutable v1.16 guards to cover the legacy semantic receipt and preserved historical request, response, receipt, dispatch, generator, and migration bytes.

## Verification

- Database-backed focused matrix: 9 files / 96 tests passed.
- Both generator modes passed; immutable v1.16 request and response hashes remained exact.
- Full Go package passed with PostgreSQL.
- Root test, typecheck, lint, and build gates passed.
- Final independent deep review returned ZERO actionable findings.
- Protected pre-existing edits to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` were neither staged nor modified by this plan.

## Decisions Made

- Evidence certification is one exact graph assertion, not a collection of independently mutable declarations.
- Signature identity includes canonical textual encoding: cryptographically equivalent but noncanonical Base64 is rejected before it can mint a second evidence identity.
- Candidate generation/freshness is part of the persisted and published trust statement and cannot be supplied or advanced by a caller.
- Receipt-version selection stays explicit. v1.17 canonical framing does not reinterpret v1.16 insertion-ordered evidence.

## Deviations and Surprises

1. Cryptographic verification alone was insufficient: alternate Base64 spellings of identical signature bytes could create different certificate identities. Exact round-trip spelling is now part of admission in schema, TypeScript, Go, and persistence.
2. Generator compatibility needed two intentional modes. The normal check now fails if either successor fixture family is absent; historical-only auditing must be requested explicitly.
3. Several shallow scalar seams survived the first graph implementation, including floating pins and publication-generation mismatch. Adversarial rereviews closed them symmetrically across TypeScript and Go.
4. The implementation executor reached model capacity after the final reviewer returned zero findings. Root validation and this closeout resumed the next morning; the implementation duration above excludes that inactive interruption.

## Residual Posture

No runtime lane is counted, no production producer is trusted, and no default changed. Plan 14 must prepare every candidate and required gate first, make the default switch in a small allowlisted commit, generate only postactivation hashes afterward, and prove rollback and privacy end to end.

## Self-Check: PASSED

- All plan must-haves are implemented and tested.
- Final code review is clean.
- Historical and protected user-owned files remain intact.
