---
phase: 261-integrated-service-proof-drift-guards-and-release
plan: "03"
subsystem: integrated-service-proof
tags: [runtime-service, four-language, containment, chronicle, replay, failure-safety]
requires:
  - phase: 261-integrated-service-proof-drift-guards-and-release
    plan: "01"
    provides: closed scenario manifest and restricted evidence lifecycle
  - phase: 261-integrated-service-proof-drift-guards-and-release
    plan: "02"
    provides: privacy-safe release boundaries and fail-closed strict inventory
provides:
  - real HTTP runtime-service proof for TypeScript, Python, Rust, and Zig
  - exact functional, containment, Chronicle, reconstruction, replay, and failure receipts
  - deterministic live-write and byte-read-only strict-check commands
  - explicit non-counted status for proof-local, non-deployed containment
affects: [261-04, 261-05, 261-06, 261-07, 261-08, 261-09, 261-10, 261-11, 261-12, 261-13]
tech-stack:
  added: []
  patterns:
    - proof-local authority may exercise production-shaped routes without promoting counted deployment authority
    - functional conformance and counted containment are independent signed facts
    - restricted-first evidence with safe opaque public handoff references
key-files:
  created:
    - scripts/run-v1-37-integrated-service-proof.ts
    - scripts/run-v1-37-integrated-service-proof.test.ts
    - scripts/activate-v1-37-proof-local-runtime-authority.ts
    - packages/spec/src/runtime-containment-trusted-producers-v1-37.ts
    - apps/runtime-service/src/pinned-wasmtime-container-runtime.ts
  modified:
    - apps/runtime-service/src/execute-match.ts
    - package.json
    - scripts/capture-v1-37-protected-baseline.ts
key-decisions:
  - "The proof-local route exercises the actual HTTP runtime service and selected v1.19 adapters, but all four lanes remain explicitly non-counted because no deployment authority was promoted."
  - "The additive v1.18 service envelope may carry the selected v1.19 semantic tuple without rewriting historical v1.18 evidence or creating a second gameplay authority."
  - "Rust proof execution uses the exact pinned Wasmtime runtime and absolute bounded temporary paths so container identity and lifecycle remain deterministic."
patterns-established:
  - "Three-way truth: functional result, containment attestation, and counted eligibility are recorded separately and cannot imply one another."
  - "Strict check is read-only: live execution and restricted capture occur only through the dedicated write command."
requirements-completed: [PROOF-02, PROOF-03]
coverage:
  - id: D1
    description: A real production-shaped HTTP topology executes exact current TypeScript, Python, Rust, and Zig providers with current runtime and toolchain identities.
    requirement: PROOF-02
    verification:
      - kind: integration
        ref: scripts/run-v1-37-integrated-service-proof.test.ts#preflight-topology-four-lanes
        status: pass
      - kind: integration
        ref: pnpm v1.37:integrated-service-proof:check
        status: pass
    human_judgment: false
  - id: D2
    description: Success, player violation, and system failure remain distinct; system failure leaves gameplay, memory, results, and standings unchanged while Chronicle reconstruction and replay remain equivalent.
    requirement: PROOF-03
    verification:
      - kind: integration
        ref: scripts/run-v1-37-integrated-service-proof.test.ts#typed-failure-chronicle-reconstruction-replay-no-mutation
        status: pass
      - kind: integration
        ref: pnpm v1.37:integrated-service-proof:check
        status: pass
    human_judgment: false
  - id: D3
    description: Live write is the sole collector and repeated strict checks detect missing, edited, stale, or identity-mixed evidence without starting services or mutating evidence.
    requirement: PROOF-03
    verification:
      - kind: integration
        ref: scripts/run-v1-37-integrated-service-proof.test.ts#write-check-tamper-missing-evidence
        status: pass
      - kind: integration
        ref: pnpm v1.37:integrated-service-proof:check#repeated
        status: pass
    human_judgment: false
  - id: D4
    description: Protected user-owned source identity remains exact even as Git object-count abbreviation changes.
    requirement: PROOF-02
    verification:
      - kind: unit
        ref: scripts/capture-v1-37-protected-baseline.test.ts
        status: pass
      - kind: integration
        ref: pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check
        status: pass
    human_judgment: false
duration: multi-session-resumed
completed: 2026-07-22
status: complete
---

# Phase 261 Plan 03: Integrated Four-Language Service Proof Summary

**The actual HTTP runtime-service route now executes all four exact current language lanes, validates full semantic traces and failure ownership, and emits signed restricted evidence while truthfully leaving every proof-local lane non-counted.**

## Performance

- **Duration:** Multi-session, resumed after executor interruption
- **Completed:** 2026-07-22
- **Tasks:** 3
- **Proof cardinality:** 4 lanes, 12 fresh runs, 23 scenarios

## Accomplishments

- Activated a narrowly scoped, attested proof-local authority and exercised the selected v1.19 runtime path through the real HTTP runtime service rather than importing provider or kernel helpers into the collector.
- Executed TypeScript, Python, Rust, and Zig three times each using pinned toolchains and production adapters, including pinned Wasmtime for the Rust and Zig WASM lanes.
- Proved success, player violation, representative system failures, no-mutation behavior, semantic Chronicle admission, reconstruction equivalence, and replay equivalence.
- Stored raw execution and service traces in the restricted evidence store while exposing only opaque, schema-checked safe references.
- Added deterministic `v1.37:integrated-service-proof:write` and pure `v1.37:integrated-service-proof:check` commands; strict check passed twice against the same evidence.
- Preserved the fail-closed counted boundary: the final status is `passed-functional-containment-attested-non-counted`, with `countedLaneCount: 0`.

## Verification

- Integrated service proof suite: 10/10 tests passed.
- Strict integrated proof check: passed twice with 4 lanes, 12 runs, 23 scenarios, and 0 counted lanes.
- Lower executable-conformance proof: passed.
- Phase-260 aggregate proof: passed.
- Workspace typecheck: 27/27 tasks passed.
- Protected working-tree baseline: exact expected SHA-256 passed.
- Protected baseline unit suite: 9/9 tests passed.

## Decisions Made

- Proof-local containment is sufficient to run a real local service proof, but it is not deployment authority and cannot make a runtime lane counted.
- Current v1.19 execution may traverse the additive v1.18 service envelope only when the complete selected semantic tuple is validated; immutable v1.18 and v1.4 evidence remains under its original semantics.
- Full service, Chronicle, reconstruction, replay, and failure receipts are restricted artifacts. Public/default surfaces receive only bounded opaque references and aggregate status.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Activated a real selected-current service route**
- **Found during:** Topology execution
- **Issue:** The runtime service lacked a current v1.19 production route even though lower conformance evidence existed.
- **Fix:** Added the narrow selected-current bridge, exact v1.19 adapter selection, and proof-local authority activation without changing gameplay, ABI, or public counting policy.
- **Verification:** All four real language lanes and typed-failure scenarios passed through HTTP.

**2. [Rule 2 - Missing Critical] Added exact containment producer trust for the proof topology**
- **Found during:** Counted/containment preflight
- **Issue:** Documentation and gate names could not provide executable containment evidence.
- **Fix:** Added managed proof-local producer identities and certificates bound to the exact lane, toolchain, adapter, runtime, and containment tuple.
- **Verification:** Containment is attested for all four lanes while counted eligibility remains independently false.

**3. [Rule 3 - Blocking] Stabilized Wasmtime and temporary-path execution**
- **Found during:** Real Rust/Zig service execution
- **Issue:** Relative temporary paths and floating runtime selection made production-shaped WASM execution environment-dependent.
- **Fix:** Pinned Wasmtime and used absolute bounded temporary paths under the owned lifecycle.
- **Verification:** Repeated Rust/Zig runs passed with exact identities and cleanup.

**4. [Rule 3 - Blocking] Stabilized protected Git-diff identity**
- **Found during:** Final protected-baseline check
- **Issue:** Git lengthened object abbreviations as the repository grew, changing diff bytes although protected file bytes, modes, and blobs were identical.
- **Fix:** Fixed diff abbreviation at seven characters in both staged and unstaged protected-baseline capture.
- **Verification:** Baseline SHA-256 and all nine capture tests passed.

**Total deviations:** 4 auto-fixed. No gameplay rule, action legality, event order, Match outcome, Strategy observation, ABI, public output, or counted-lane policy changed.

## Issues Encountered

The first collector result used a direct-provider-only receipt and correctly failed the production-boundary contract. It was retained as an explicitly nonconforming restricted artifact; the passing proof was recollected through the real runtime-service route.

## User Setup Required

None for the checked local proof. A future counted deployment still requires separately approved deployable containment and current lane authority; this plan intentionally does not promote it.

## Known Stubs

None in the functional proof path. Counted deployment authority is intentionally absent, observable, and fail-closed.

## Next Phase Readiness

Plan 261-04 can consume the exact service receipts and restricted proof-data handoff to prove persistence and rollback without re-executing or weakening the service boundary.

## Self-Check: PASSED

- The real service collector, tests, proof-local authority, selected-current adapters, and package commands exist.
- Strict proof checks pass repeatedly without mutation.
- All lower conformance, Phase-260, typecheck, and protected-baseline gates remain green.
- Public/default output contains no source, artifact, memory, objective, diagnostics, host, or security-internal payloads.

---
*Phase: 261-integrated-service-proof-drift-guards-and-release*
*Completed: 2026-07-22*
