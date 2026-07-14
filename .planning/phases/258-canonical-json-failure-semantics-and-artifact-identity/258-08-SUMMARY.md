---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "08"
subsystem: typescript-successor-runtime-adapters
tags: [runtime-abi, canonical-json, worker, subprocess, container, failure-ownership]
requires:
  - phase: 258-05
    provides: Bounded raw payload admission and method-specific successor schemas
  - phase: 258-06
    provides: Authenticated exclusive v1.17 invocation envelope
  - phase: 258-07
    provides: Engine-only penalties and no-mutation system-failure ownership
provides:
  - One host-only v1.17 bridge shared by TypeScript worker, subprocess, and container paths
  - Raw canonical guest payload frames with exact caps and exclusive authenticated results
  - Artifact-bound execution, redacted cross-path traces, and restored containment guards
affects: [258-11, 258-12, 258-13, 258-14, 259]
tech-stack:
  added: []
  patterns:
    - Authenticate request bytes and bind executable artifact before entering a guest
    - Keep signing material host-only and use a one-byte internal guest observation tag
    - Classify guest serialization separately from proven Strategy exceptions
key-files:
  modified:
    - packages/runtime-js/src/abi-bridge.ts
    - packages/runtime-js/src/adapter.ts
    - packages/runtime-js/src/worker-bridge.ts
    - packages/runtime-js/src/worker-harness.ts
    - packages/runtime-js/src/subprocess-adapter.ts
    - packages/runtime-js/src/subprocess-harness.ts
    - packages/runtime-js/src/container-subprocess-adapter.ts
    - packages/runtime-js/src/worker-thread-adapter.ts
    - packages/runtime-js/src/candidate-bounded-canonical-source.ts
    - packages/runtime-js/src/adapter-contract.test.ts
    - packages/runtime-js/src/hostile-matrix.test.ts
key-decisions:
  - "The successor guest receives only executable source, method, input, and exact budgets; authentication secrets and response signing never cross the host boundary."
  - "A request artifact digest must equal the exact executable UTF-8 bytes before any worker, subprocess, or container starts."
  - "Host-observed timeout is ambiguous and system-owned; only an exception caught directly at the Strategy call site is a proven player exception."
  - "Current v1.14 execute paths, default adapter selection, fixtures, and proof bytes remain unchanged; v1.17 is additive and inactive."
requirements-completed: [RABI-01, RABI-02, RABI-03, RABI-05, RABI-08]
coverage:
  - id: D1
    description: "Worker, subprocess, and container paths produce the same authenticated success, trace, payload binding, and exclusive result shape from one signed request."
    requirement: RABI-03
    verification:
      - kind: unit
        ref: "packages/runtime-js/src/adapter-contract.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Duplicate payload keys and invalid decoded payloads are player-owned, while malformed IPC, wrong artifact binding, host timeout, and mixed frames are redacted system failures."
    requirement: RABI-05
    verification:
      - kind: unit
        ref: "packages/runtime-js/src/hostile-matrix.test.ts and adapter-contract.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Legacy v1.14 defaults and exact v1.16 proof artifacts remain unchanged while successor guests contain forbidden globals without receiving signing material."
    requirement: RABI-08
    verification:
      - kind: other
        ref: "full runtime-js suite and exact v1.16 SHA-256 gate"
        status: pass
    human_judgment: false
duration: 19min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 08: TypeScript Successor Runtime Adapters Summary

**Worker, subprocess, and container TypeScript lanes now share one artifact-bound, host-authenticated v1.17 raw-byte bridge without changing the active v1.14 runtime path.**

## Performance

- **Duration:** 19 min
- **Completed:** 2026-07-14
- **Tasks:** 1 TDD task plus three adversarial review loops
- **Files modified:** 10 runtime and test files

## Accomplishments

- Added an additive `executeV117` contract to all three TypeScript adapters. It verifies canonical authenticated request bytes before materialization, checks the exact executable artifact digest, invokes one guest, admits raw payload bytes, and emits one authenticated response envelope.
- Kept the signing identity exclusively in the host bridge. Successor worker and subprocess harnesses receive only executable source, method, input, and exact wall/output limits; their source contains no HMAC, signature, or signing-secret path.
- Used a minimal one-byte guest observation tag plus untouched payload bytes. Success payloads are scanned by the shared canonical profile before schema materialization; non-success tags cannot carry a hidden legacy or diagnostic tail.
- Unified worker, subprocess, and container trace fields and registered classifications. Duplicate/noncanonical/schema-invalid payloads remain player-owned; malformed IPC, runtime/host/transport failures, wrong bindings, and ambiguous timeout remain system-owned.
- Restored the existing capability containment posture for the successor harness: `globalThis`, `Math.random`, Function-constructor escape, process, network, timing, Buffer, console, and scheduling surfaces remain blocked.
- Preserved the current worker-thread default and every existing v1.14 adapter behavior. The v1.17 route remains an inactive candidate for Plan 258-14.

## Task and Review Commits

1. **Task RED: Expose missing successor adapter contract** — `ba842e6`
2. **Task GREEN: Unify successor runtime adapters** — `a3f8f29`
3. **Review RED: Expose artifact and mixed-frame binding gaps** — `0e10f83`
4. **Review fix: Bind artifacts and reject mixed frames** — `3eeda73`
5. **Review RED: Expose successor containment escape** — `31774e9`
6. **Review fix: Restore successor containment guards** — `57efc24`
7. **Review RED: Expose serialization ownership drift** — `7e50d74`
8. **Review fix: Preserve successor failure ownership** — `f7cf7d1`
9. **Independent-review RED: Expose zero-budget, allocation, and IPC ownership gaps** — `6b8beaf`
10. **Independent-review fix: Close adapter boundary findings** — `a5a7df8`

## Verification

- Plan-focused worker/subprocess/container/hostile matrix passed **103/103** across four files after the independent-review fixes.
- Complete `@cowards/runtime-js` suite passed **201/201** across eleven files.
- Runtime-js typecheck and ESLint passed.
- Stable `@cowards/spec` suite passed **73/73**; successor ABI, canonical-boundary, runtime ABI, runtime-js integration, and legacy executor subset passed **61/61**.
- Exact v1.16 hashes remained unchanged: request `5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5`, response `9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97`, service `9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc`, semantic receipt `36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d`, Go client `8fdd3cbc206d2d7e1f77a3603a4f9ea5e664c5ab6f649c87d3e308d99556043f`, Go client test `4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185`, and migration `ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69`.
- Protected dirty `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remained unstaged and untouched.

## Decisions Made

- Bind executable bytes at the adapter edge rather than trusting an authenticated artifact identifier whose resolved bytes were not rechecked.
- Treat the guest tag as private transport evidence, never as a public result. Only the host bridge may create and authenticate the public three-way result.
- Keep host timeout system-owned because the current TypeScript lanes cannot prove whether exhaustion occurred solely in guest code. Counted certification therefore remains unavailable until the required equivalent meters exist.
- Preserve the intentionally permissive valid-field behavior of the shared successor payload schemas established in Plan 05; this plan adds raw-byte and ownership enforcement without redefining valid gameplay payload semantics.

## Deviations from Plan

### Auto-fixed Issues

1. **[Critical — executable authority] Authenticated requests did not initially bind the bytes actually executed.**
   - A caller could supply source whose digest differed from the signed artifact identity.
   - The bridge now hashes exact executable UTF-8 bytes before guest startup and returns signed `OUTER_FRAME_WRONG_BINDING` with zero invocation on mismatch.
   - **Committed in:** RED `0e10f83`, GREEN `3eeda73`

2. **[High — mixed transport] Non-success guest tags initially ignored trailing bytes.**
   - A legacy or diagnostic tail could have crossed the private transport while still producing a player result.
   - Every non-success tag now requires an exactly one-byte frame; any tail is a redacted `TRANSPORT_CRASH` system failure.
   - **Committed in:** RED `0e10f83`, GREEN `3eeda73`

3. **[Critical — containment] The first successor harness omitted several legacy capability guards.**
   - `globalThis.process`, `Math.random`, and Function-constructor escape executed successfully in the candidate worker.
   - Both successor harnesses now restore the frozen global proxy, sanitized Math, constructor block, and forbidden timing/host surfaces.
   - **Committed in:** RED `31774e9`, GREEN `57efc24`

4. **[High — ownership] Guest serialization errors were initially labeled as Strategy exceptions.**
   - A non-JSON return such as `ArrayBuffer` produced `THROWN_EXCEPTION` rather than `INVALID_OUTPUT`.
   - Strategy invocation and canonical serialization now have separate catch boundaries; forbidden access remains forbidden, direct throws remain proven exceptions, and serialization faults are invalid output.
   - **Committed in:** RED `7e50d74`, GREEN `f7cf7d1`

5. **[High — timeout consistency] A signed zero wall budget reached `spawnSync` as `timeout: 0`.**
   - Node interprets a zero subprocess timeout as no timeout, while the worker lane observed immediate exhaustion; the three TypeScript paths could therefore disagree and start guest infrastructure for an already exhausted invocation.
   - The authenticated host bridge now returns redacted `AMBIGUOUS_ATTRIBUTION` before invoking any worker, subprocess, or container when the wall budget is zero.
   - **Committed in:** RED `6b8beaf`, GREEN `a5a7df8`

6. **[Critical — bounded allocation] Successor harnesses built a complete canonical string and then a complete UTF-8 payload before checking the output limit.**
   - An oversized or adversarial return could amplify memory independently of the signed payload budget and could evaluate later getters even after the first N+1 bytes already proved overflow.
   - Both harnesses now embed one shared bounded canonical writer. It writes directly into a budget-sized frame, enforces the frozen depth/node/collection ceilings, preserves unsigned UTF-8 key order and canonical escapes/numbers, and stops on the first attempted byte beyond N without reading later values or constructing a second payload buffer.
   - **Committed in:** RED `6b8beaf`, GREEN `a5a7df8`

7. **[Critical — failure ownership] Malformed or schema-invalid internal guest IPC emitted player-owned exception/invalid-output tags.**
   - Broken host-to-guest framing could therefore be converted into a player penalty even though no valid Strategy call was attributable.
   - Malformed and schema-invalid internal requests now emit the private `T` transport tag, which the host maps only to redacted retryable `TRANSPORT_CRASH`. Pre-method artifact-load failure uses `R` and remains system-owned as `RUNTIME_CRASH`; only an exception caught directly at the Strategy method call site uses the player-owned exception tag.
   - **Committed in:** RED `6b8beaf`, GREEN `a5a7df8`

**Total deviations:** 7 correctness/security fixes. **Impact:** Stronger artifact authority, containment, allocation bounds, timeout consistency, and failure ownership with no current-runtime or gameplay activation.

## Independent Review Addendum

The post-completion independent review reproduced all three reported gaps before any fix. The final regression additionally proves canonical Unicode key ordering, escaping, exponent and negative-zero encoding, exact N/N+1 output behavior, no access to later values after overflow, zero runtime starts for zero wall budget, and system ownership for malformed request IPC and pre-method load failure. Active v1.14 execution and all pinned v1.16 proof bytes remain unchanged.

## User Setup Required

None.

## Next Phase Readiness

Plans 258-09 and 258-10 can use the same authenticated request/result and raw payload semantics for Python and WASM. Plan 258-11 can rely on exact TypeScript failure ownership when proving Go retry and rollback. Activation remains owned solely by Plan 258-14.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
