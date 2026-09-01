---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "169"
subsystem: admission-security
tags: [typescript-ast, module-resolution, fail-closed, recovery-proof, tdd]
requires:
  - phase: 262-168
    provides: Exact v4 source review and CR-168-01 function-declaration bypass reproduction
provides:
  - Parsed TypeScript recovery call graph covering declarations, function expressions, arrows, aliases, imports, re-exports, and callback dataflow
  - Fail-closed unresolved-callee and exact process-capability policies
  - Additive source-only v5 manifest, review, readiness, and outcome contracts
affects: [262-170, 262-158, ADMIT-03]
tech-stack:
  added: []
  patterns: [compiler-API source proof, exact capability allowlist, immutable failed-review predecessor]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-169-SUMMARY.md
  modified:
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
    - scripts/run-v1-38-lean-runner-feasibility.ts
key-decisions:
  - "Use the installed TypeScript compiler API and explicit relative-module indexing instead of extending the reviewed regex proof."
  - "Load the recovery checker through a static relative namespace import so dynamic import remains rejected in the recovery graph."
  - "Retire v4 execution consumption and prepare only an additive v5 review-outcome path; no v5 artifact or effect is emitted by this plan."
requirements-completed: []
coverage:
  - id: D1
    description: The exact CR-168-01 function-declaration bypass is reproduced RED and rejected GREEN.
    requirement: ADMIT-04
    verification:
      - kind: unit
        ref: scripts/check-v1-38-lean-admission.test.ts#rejects the exact CR-168-01 function-declaration recovery bypass
        status: pass
    human_judgment: false
  - id: D2
    description: Recovery reachability follows all required declaration, relative-module, alias, re-export, and injected callback shapes while rejecting unresolved or capability-bearing calls.
    requirement: MEAS-04
    verification:
      - kind: unit
        ref: scripts/check-v1-38-lean-admission.test.ts#recovery call-shape and process-capability tests
        status: pass
      - kind: integration
        ref: node --import tsx scripts/check-v1-38-lean-admission.ts --check-corrective-recovery-only-structure
        status: pass
    human_judgment: false
  - id: D3
    description: The fresh v5 trust path is source-only and binds the immutable nonzero v4 review without creating readiness, invocation, recovery, or Match effects.
    requirement: MEAS-09
    verification:
      - kind: unit
        ref: scripts/check-v1-38-lean-admission.test.ts#prepares only the additive v5 review-outcome trust contract
        status: pass
      - kind: integration
        ref: Plan 169 v5 destination absence and 36-lock inventory checks
        status: pass
    human_judgment: false
duration: 18min
completed: 2026-09-01
status: complete
---

# Phase 262 Plan 169: Fail-Closed Recovery Call-Graph Proof Summary

**The reviewed regex bypass is replaced by a TypeScript AST and relative-module recovery proof with exact callback and process-capability policies, while the new v5 trust path remains source-only and effect-free.**

## Performance

- **Duration:** 18 minutes
- **Started:** 2026-09-01T21:39:00Z
- **Completed:** 2026-09-01T21:57:07Z
- **Tasks:** 2 TDD gates
- **Files modified:** 4

## Accomplishments

- Reproduced the exact `function unsafeRecoveryHop(): void { buildLeanSchedule() }` CR-168-01 bypass as a failing RED test before implementation.
- Replaced the regex definition/call scan with compiler-API parsing, lexical declaration indexing, relative-module resolution, callback-object binding, and fail-closed reachable-call traversal.
- Covered function declarations, parenthesized and single-parameter arrows, function expressions, aliases, default/named/namespace imports, named/default re-exports, multi-hop calls, and all three recovery callback properties.
- Enforced exact recovery `execFileSync` and `process.kill` forms, rejected computed/dynamic/external/ambiguous/parse/unsupported shapes, and preserved the real inert recovery route.
- Added source-only v5 manifest/review/readiness schemas and the exact nonzero-without-readiness or zero-with-valid-readiness outcome contract while binding immutable v4 failed-review history.

## Task Commits

1. **RED: reproduce exact function-declaration bypass** — `317243ce`
2. **GREEN: implement AST/module recovery proof and v5 trust contracts** — `c1bda8cf`

## Verification

- Focused serial Vitest suite: **71/71 passed** across all three lean runner/admission files.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- Current recovery-only structural selector: passed with zero authority.
- Immutable v4 source-review checker: passed.
- Corrective source-only checker: passed.
- v5 manifest, review, and readiness destinations: absent.
- Corrective invocation, terminal, adjudication, eligibility, and child ownership effects: absent.
- Successor locks: exactly 36 and untouched.
- `git diff --check`: passed.

## Decisions Made

- The real recovery selector now uses a static relative namespace import; the structural proof rejects dynamic imports instead of carving out an exception.
- Exact audited inert language/global operations are allowed, while unresolved bare calls and non-audited property/capability calls fail closed.
- V4 remains immutable non-authorizing history. Only a later separately rendered and independently reviewed v5 lineage can make Plan 158 eligible.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The change hardens an existing private recovery-only source proof and adds no network endpoint, production path, persistence schema, or public surface.

## Next Phase Readiness

Plan 262-170 may now render the exact committed v5 manifest and dispatch exactly one fresh independent review. Plan 158 remains ineligible unless that review is literal zero and a valid v5 readiness artifact is separately created. No Match, recovery selector, readiness, invocation, or broader authority exists from Plan 169.

## Self-Check: PASSED

Both TDD commits resolve; all three modified source/test files and this summary exist; 71 focused tests, TypeScript, structural, immutable-v4, source-only, no-effect, artifact-absence, and 36-lock checks pass; and no v5 artifact or corrective effect was created.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-09-01*
