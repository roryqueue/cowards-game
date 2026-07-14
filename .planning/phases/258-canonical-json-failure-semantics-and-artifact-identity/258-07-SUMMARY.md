---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "07"
subsystem: successor-runtime-transition-ownership
tags: [runtime-abi, engine-authority, no-mutation, retry-identity, compatibility]
requires:
  - phase: 258-05
    provides: Bounded method-specific successor payload admission
  - phase: 258-06
    provides: Authenticated exclusive v1.17 invocation envelope
  - phase: 257
    provides: Sole canonical transition kernel and locked v1.4 consequences
provides:
  - Engine-only conversion of authenticated player violations into the existing v1.4 consequence
  - Exact request-to-effect, full-prestate, tuple, budget, input, trace, and retry binding
  - No-mutation system-failure bridge from runtime-service to the canonical kernel
  - Tuple-isolated v1.17 candidate execution with unchanged v1.14 runtime behavior
affects: [258-08, 258-09, 258-10, 258-11, 258-13, 258-14, 259]
tech-stack:
  added: []
  patterns:
    - Authenticate the exact yielded effect and pin the admitted request before adapter invocation
    - Domain-hash the complete pre-effect machine and private prestate into successor effect identity
    - Branch runtime calling convention and result dispatch exclusively by semantic tuple
key-files:
  created:
    - packages/engine/src/kernel/runtime-ownership.test.ts
  modified:
    - packages/engine/src/kernel/types.ts
    - packages/engine/src/kernel/driver.ts
    - packages/engine/src/kernel/validate.ts
    - packages/engine/src/public-surface.test.ts
    - packages/spec/src/runtime.ts
    - apps/runtime-service/src/execute-match.ts
    - apps/runtime-service/src/execute-match.test.ts
    - apps/runtime-service/src/semantic-integrity.test.ts
key-decisions:
  - "The v1.17 effect request ID binds a canonically encoded, domain-separated projection of the complete pre-effect machine and private prestate; an identical clone is stable while match, initiative, hidden memory, or other prestate drift changes identity."
  - "Current v1.14 runtime calls remain one-argument and mutable, including permissive legacy result metadata; frozen two-argument requests and authenticated bound results apply only to the inactive v1.17 tuple."
  - "Plan-05 owns raw proposal admission, runtime-service owns authenticated transport, and only the kernel owns the established v1.4 gameplay consequence."
  - "The service invokes an adapter once per call, pins the admitted signed request against mutation, and leaves bounded system retry to its Go owner."
patterns-established:
  - "A successor result is accepted only when the authenticated request and trace match the exact yielded kernel effect across request, invocation, method, tuple, source, artifact, budget, input, retry, and full-prestate identity."
  - "Malformed adapter returns, wrong binding, adapter throws, and system results fail with registered v1.17 codes, zero transitions, unchanged state, and privacy-safe public output."
requirements-completed: [RABI-03, RABI-04, RABI-05]
coverage:
  - id: D1
    description: "Duplicate valid-prefix tails, partial nested JSON, over-cap SoldierMemory, and illegal Actions are admitted by the Plan-05 boundary as distinct malformed paths, then produce one authenticated player violation and only the existing engine-owned v1.4 consequence with prior memory retained."
    requirement: RABI-03
    verification:
      - kind: unit
        ref: "apps/runtime-service/src/execute-match.test.ts and packages/engine/src/kernel/runtime-ownership.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Adapter crashes, wrong bindings, malformed transport values, and direct candidate runtime throws return registered system failures with zero transitions and byte-equivalent unchanged gameplay/private state."
    requirement: RABI-04
    verification:
      - kind: unit
        ref: "focused successor engine/service ownership suite (20/20)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Exact authenticated request, trace, tuple, budget, input, retry, and complete prestate bindings reach the kernel; request mutation and cross-prestate replay fail closed."
    requirement: RABI-05
    verification:
      - kind: unit
        ref: "runtime-ownership and runtime-service binding/retry tests"
        status: pass
      - kind: other
        ref: "engine, runtime-service, and spec typechecks/lints"
        status: pass
    human_judgment: false
duration: 46min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 07: Successor Transition Ownership Summary

**The inactive v1.17 runtime path now binds every authenticated result to the exact canonical kernel effect and complete prestate, while player penalties remain engine-only, system failures remain no-mutation, and current v1.14 behavior remains unchanged.**

## Performance

- **Duration:** 46 min
- **Started:** 2026-07-14T10:22:43-04:00
- **Completed:** 2026-07-14T11:08:20-04:00
- **Tasks:** 2 TDD tasks plus adversarial review fixes
- **Files created:** 1
- **Files modified:** 8

## Accomplishments

- Added an explicit inactive v1.17 kernel machine path whose semantic tuple, transitions, effect requests, authenticated runtime requests, outcomes, and recorder material all carry the successor runtime ABI identity; default constructors and current v1.14 remain unchanged.
- Bound accepted outcomes to the exact yielded effect across kernel request ID, method, canonical input hash/length, full semantic tuple, signed request digest, invocation, budget profile, retry identity, and trace.
- Made v1.17 effect IDs depend on a bounded canonical projection of the complete machine and private prestate. Replaying a response across a different match, initiative owner, hidden Soldier memory, or other state now fails as `OUTER_FRAME_WRONG_BINDING`, while an identical cloned prestate keeps byte-identical identity.
- Preserved the historical v1.14 runtime convention exactly: one mutable input argument, permissive extra result metadata, and legacy failure codes. Frozen detached requests, the second binding argument, exclusive bound-result dispatch, and registered successor codes apply only to v1.17.
- Proved the real Plan-05 admission paths for a valid prefix with duplicate tail, partial nested memory, over-cap nested memory, and an illegal Action. Runtime-service authenticates their player classification; the kernel alone emits the existing `RUNTIME_VIOLATION`/`SOLDIER_STONED` consequence and preserves every prior memory.
- Pinned the admitted request before adapter execution, rejected adapter-side request/retry mutation, invoked each adapter at most once, converted non-byte returns and throws to registered system failures, and exposed only safe IDs/classification/code/retryability publicly.

## Task Commits

1. **Task 1 RED: Expose successor ownership gaps** — `09b8cb7`
2. **Task 1 GREEN: Enforce successor runtime ownership** — `ed91fe0`
3. **Task 2 RED: Expose candidate service ownership gaps** — `75770e7`
4. **Task 2 GREEN: Bind candidate service outcomes** — `fd794e6`
5. **Review RED: Expose retry request mutation** — `692e9fb`
6. **Review fix: Pin admitted retry identity** — `03ad166`
7. **Review RED: Expose cross-prestate input binding** — `122ea3d`
8. **Review fix: Bind runtime effects to successor identity** — `3babe7e`
9. **Final review RED: Expose compatibility and identity gaps** — `b802b29`
10. **Final review fix: Isolate successor runtime identity** — `def599d`
11. **Final ownership proof: Distinct admissions and registered failures** — `c348776`
12. **Full-suite drift guard: Register explicit successor surface** — `afb1de3`

## Verification

- Complete `@cowards/runtime-service` suite passed **73/73** across seven files.
- Complete `@cowards/engine` suite passed **127/127** across sixteen files, including compatibility fixtures and the explicit candidate public-surface guard.
- Complete `packages/spec/src` suite passed **242/242** across twenty-four files; the stable `@cowards/spec` package suite passed **73/73**.
- Focused semantic-integrity, invocation, and v1.4 compatibility suite passed **30/30**; focused successor engine/service ownership passed **20/20**.
- Engine, runtime-service, and spec typechecks and ESLint all passed; `git diff --check` passed.
- The permanent audit remained exact: final no-Advance Soldier became Stone with one Match outcome/event; Cycle-end Backstab closed as `BACKSTABBED`; one valid excess order was retained without violation; depth 3,000 returned `MAX_DEPTH_EXCEEDED`; overlapping arena was rejected; legacy boundary was accepted; successful PUSH history remained `RIGHT`.
- Protected dirty `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remained unstaged and untouched by this plan.

## Decisions Made

- Treat the complete pre-effect machine/private state as request identity material, not as public output. The request exposes only the domain hash, preventing both replay ambiguity and private-state disclosure.
- Keep current and successor calling conventions structurally separate. Tuple identity determines whether the driver uses legacy one-argument results or frozen authenticated v1.17 results; shape inspection cannot silently cross that boundary.
- Keep retry ownership outside runtime-service. A service call performs one authenticated invocation; callers may retry only a system failure with the same signed request, prestate, and budgets.

## Deviations from Plan

### Auto-fixed Issues

1. **[Critical — request/effect authority] A signed response initially matched only cursor request ID and observable input.**
   - **Issue:** Distinct matches or hidden prestates with the same local Strategy observation could reuse one response.
   - **Fix:** Added a domain-separated canonical effect ID over complete machine/private prestate material and verified every authenticated request/trace binding.
   - **Committed in:** RED `122ea3d`/`b802b29`, GREEN `3babe7e`/`def599d`

2. **[Critical — v1.4 compatibility] Detaching/freezing every input changed the current runtime calling convention.**
   - **Issue:** Valid v1.4 Strategies could mutate input memory before returning it and could observe one argument; the first successor implementation froze both and passed a second argument.
   - **Fix:** Isolated freeze, detachment, second argument, and bound-result dispatch to the v1.17 tuple and locked the historical behavior in a regression.
   - **Committed in:** RED `b802b29`, GREEN `def599d`

3. **[Critical — successor bypass] A v1.17 machine initially accepted legacy `{ok: true}` results.**
   - **Issue:** Legacy fallthrough bypassed authenticated request, tuple, budget, input, retry, and trace validation.
   - **Fix:** Made result dispatch tuple-exclusive; v1.17 requires `v1_17_bound`, while v1.14 retains its permissive legacy path.
   - **Committed in:** `def599d`

4. **[High — retry TOCTOU] Adapter-side mutation could alter the request used after admission.**
   - **Issue:** The service serialized and verified a request but later passed the caller-owned mutable object to the kernel.
   - **Fix:** Pinned the admitted request and used it for response verification, kernel execution, and public identity.
   - **Committed in:** RED `692e9fb`, GREEN `03ad166`

5. **[High — fail-safe transport] Non-byte adapter returns and direct v1.17 throws could escape or use a legacy unregistered code.**
   - **Fix:** Converted them to registered `TRANSPORT_CRASH`/`ADAPTER_CRASH` system failures with zero mutation and redacted output.
   - **Committed in:** `3babe7e`, `c348776`

6. **[Coverage — malformed proposal ownership] Four labels initially reused one synthetic player violation.**
   - **Fix:** Moved raw distinctions to their actual Plan-05 service admission owner and carried each authenticated classification through the service-to-kernel boundary with exact memory/event assertions.
   - **Committed in:** `c348776`

**Total deviations:** 6 auto-fixed correctness, compatibility, and coverage issues. **Impact:** Stronger request authority and failure isolation with no valid v1.4 gameplay or current dispatch change.

## Issues Encountered

The full engine suite correctly failed its exact public-surface guard after the four explicit `*V117` candidate methods were added. The guard was updated to name only those deliberate additive methods; the stale contiguous-Activation entry point remains absent.

## User Setup Required

None.

## Next Phase Readiness

Plans 258-08 through 258-10 can migrate TypeScript, Python, Rust, and Zig adapters onto one authenticated envelope without owning penalties or replay identity. The candidate remains inactive until Plan 258-14.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
