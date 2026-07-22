---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "19"
subsystem: executable-observation-language-conformance
tags: [typescript, python, rust, zig, runtime-v1.19, conformance, candidate-pins]

requires:
  - phase: 260-12
    provides: Reviewed inactive observation trace-v4 candidate
  - phase: 260-18
    provides: Pinned inactive Workshop and SDK v1.19 examples
provides:
  - Strict exact-candidate lane certifier for corpus v3, trace v4, Workshop v1.19, and the successor semantic tuple
  - Twelve fresh contained real-language runs in distinct processes and workspaces
  - Four canonical public-safe unsigned inactive candidate files and one synchronized inventory
affects: [260-13, 260-14, 260-20, 260-21, runtime-conformance]

tech-stack:
  added: []
  patterns: [explicit-candidate-binding, candidate-only-runner-mode, canonical-evidence-check]

key-files:
  created:
    - scripts/certify-v1-37-observation-v1-19-language-lane.ts
    - scripts/certify-v1-37-observation-v1-19-language-lane.test.ts
    - .planning/artifacts/v1.37-observation-v1.19-language-conformance-typescript.json
    - .planning/artifacts/v1.37-observation-v1.19-language-conformance-python.json
    - .planning/artifacts/v1.37-observation-v1.19-language-conformance-rust.json
    - .planning/artifacts/v1.37-observation-v1.19-language-conformance-zig.json
    - .planning/artifacts/v1.37-observation-v1.19-language-conformance-candidates.md
  modified:
    - scripts/run-v1-37-real-language-lane.ts

key-decisions:
  - "Address candidate execution with one exact explicit corpus/trace/Workshop/tuple binding value; no current registry or implicit default participates."
  - "Extend the established pinned real-lane runner with an explicit candidate mode while preserving its no-argument Phase-259 behavior."
  - "Regenerate all real evidence whenever the adapter source identity changes, including formatting-only source changes."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-05]

coverage:
  - id: D1
    description: "The certifier rejects missing, old, current, substituted, skipped, fallback, synthetic, mixed, or unsafe candidate evidence."
    requirement: STRAT-01
    verification:
      - kind: unit
        ref: "scripts/certify-v1-37-observation-v1-19-language-lane.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "TypeScript, Python, Rust, and Zig each have three fresh complete contained runs bound to exact inactive v1.19 authority."
    requirement: STRAT-03
    verification:
      - kind: integration
        ref: "pnpm exec tsx scripts/certify-v1-37-observation-v1-19-language-lane.ts --attempt-all --check-reviewed-lane-results"
        status: pass
    human_judgment: false
  - id: D3
    description: "The four fixed lane artifacts and synchronized inventory contain twelve distinct process/workspace identities with zero skips, fallbacks, unsupported cases, or synthetic evidence."
    requirement: STRAT-04
    verification:
      - kind: other
        ref: "candidate artifact matrix and recursive privacy scan"
        status: pass
    human_judgment: false
  - id: D4
    description: "Phase-259 lane artifacts, active selectors, trace history, and the protected working-tree baseline remain exact."
    requirement: SET-05
    verification:
      - kind: integration
        ref: "Phase-259 certifier check, trace-v4 candidate check, and protected-baseline check"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 19: Real Observation-v1.19 Language Candidate Summary

**Twelve fresh contained TypeScript, Python, Rust, and Zig runs now prove the exact inactive observation-v1.19 candidate graph without consulting or promoting any Phase-259 selector.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-17T07:40:00Z
- **Completed:** 2026-07-17T08:05:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added a strict certifier that binds exact corpus-v3, trace-v4, Workshop-v1.19, runtime ABI, arena catalog, Set policy, tuple, source, artifact, adapter, runtime, toolchain, budget, containment, process, workspace, and protected-baseline authority.
- Executed three fresh complete contained runs in each of TypeScript, Python, Rust, and Zig: 12 distinct processes, 12 distinct workspaces, 30 required cases per run, and no skips, unsupported cases, fallbacks, or synthetic evidence.
- Wrote four canonical unsigned inactive candidate files and one exact public-safe inventory while leaving every current Phase-259 lane, corpus, trace, Workshop default, certificate, and evidence artifact unchanged.

## Task Commits

1. **Task 1 RED: exact candidate certification contract** - `7beec07`
2. **Task 1 GREEN: strict certifier and explicit candidate runner mode** - `7feb9bb`
3. **Task 1 FIX: canonical equality and distinct freshness identities** - `c5367f3`
4. **Task 2: twelve contained real-language executions** - `6fe3f5d`
5. **Source normalization** - `7266831`
6. **Final adapter-bound real execution refresh** - `35ab98c`

## Files Created/Modified

- `scripts/certify-v1-37-observation-v1-19-language-lane.ts` - Strict candidate-only three-run certifier, canonical artifact writer, and fixed checker.
- `scripts/certify-v1-37-observation-v1-19-language-lane.test.ts` - Candidate substitution, current-registry, partial-evidence, freshness, drift, and privacy rejection tests.
- `scripts/run-v1-37-real-language-lane.ts` - Explicit v1.19 candidate mode using the established pinned supervisor and toolchains; existing current invocation is unchanged.
- `.planning/artifacts/v1.37-observation-v1.19-language-conformance-*.json` - Four canonical unsigned inactive lane candidates containing twelve real runs.
- `.planning/artifacts/v1.37-observation-v1.19-language-conformance-candidates.md` - Exact candidate authority and four-lane inventory.

## Decisions Made

- Candidate authority is a complete explicit value. The certifier and child runner reject omitted, partial, old, current, or substituted corpus, trace, Workshop, or tuple identities.
- The candidate mode reads the pinned corpus and trace bundle directly; it never resolves either active registry. The original runner path remains the complete Phase-259 route when no candidate binding is supplied.
- Canonical hash equality, rather than JavaScript property order, governs persisted evidence checks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added an explicit candidate mode to the established real-lane runner**
- **Found during:** Task 1
- **Issue:** The Phase-259 runner resolved active corpus and trace registries unconditionally, so a wrapper-only certifier would have relabeled old evidence instead of executing the successor candidate.
- **Fix:** Added a fail-closed explicit candidate binding argument that reads only exact candidate files, executes v1.19 observation sources, and emits successor identity while preserving the original no-argument path.
- **Files modified:** `scripts/run-v1-37-real-language-lane.ts`
- **Verification:** Both certifier suites pass; Phase-259 reviewed artifacts still check exactly.
- **Committed in:** `7feb9bb`

**2. [Rule 1 - Bug] Compared canonical candidate values independent of JSON key order**
- **Found during:** Task 2 artifact verification
- **Issue:** Canonical artifact serialization sorts keys, while the in-memory exact object retained construction order; a raw `JSON.stringify` equality check rejected valid canonical bytes after all twelve runs completed.
- **Fix:** Compare canonical hashes and separately enforce exact keys, values, process IDs, and workspace IDs.
- **Files modified:** `scripts/certify-v1-37-observation-v1-19-language-lane.ts`
- **Verification:** Fixed checker passes all four canonical files and rejects all mutation tests.
- **Committed in:** `c5367f3`

**3. [Rule 1 - Correctness] Refreshed evidence after final adapter formatting**
- **Found during:** Final formatting gate
- **Issue:** Formatting changed the runner source bytes and therefore its adapter-build identity after the first twelve executions.
- **Fix:** Re-ran all twelve contained executions and replaced the candidate artifacts with evidence bound to the final committed adapter source.
- **Files modified:** Five candidate artifacts.
- **Verification:** Authoritative attempt-all plus check reports four lanes, twelve runs, and `current: false`.
- **Committed in:** `35ab98c`

**Total deviations:** 3 auto-fixed (1 missing critical candidate execution path, 2 correctness fixes). **Impact:** The deviations prevent Phase-259 evidence reuse and stale adapter identity; no current selector, gameplay behavior, historical artifact, or public/private boundary changed.

## Issues Encountered

- The first artifact check exposed JSON property-order sensitivity only after all real runs had completed. The run evidence itself was valid and preserved, then final formatting correctly triggered a complete fresh rerun because adapter source bytes are part of identity.

## User Setup Required

None - the existing pinned Docker, Rust, Zig, Wasmtime, supervisor, and local toolchain environment completed all real runs.

## Verification

- Candidate certifier tests: 4/4 passed; combined current/candidate certifier tests: 8/8 passed.
- Real candidate execution: 4 lanes, 12 runs, 12 distinct processes, 12 distinct workspaces, 30 cases per run, zero skips/fallbacks/unsupported/synthetic evidence.
- Candidate checker: `{"status":"passed","lanes":4,"runs":12,"current":false}`.
- Phase-259 reviewed lane checker: 4/4 current lanes passed unchanged.
- Trace-v4 candidate checker passed exact and inactive.
- Repository typecheck: 27/27 tasks passed.
- Prettier and ESLint passed for every changed source and inventory file.
- Recursive public-safe poison scan passed.
- Protected baseline remains `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## TDD Gate Compliance

- RED `7beec07` failed because the candidate certifier did not exist.
- GREEN `7feb9bb` passed exact binding, three-run, substitution, freshness, drift, current-route, and privacy behavior.
- Final formatting retained green behavior and all evidence was regenerated against the final adapter bytes.

## Next Phase Readiness

- Plan 260-13 can define the strict v1.19 certificate discriminator and sign/import these four exact payloads as inactive append-only evidence.
- Plan 260-20 can consume the same exact lane/pin graph for revision-specific D-04 proof.
- Plan 260-14 remains the sole activation owner; all current Phase-259 selectors and artifacts remain unchanged.

## Self-Check: PASSED

- All eight implementation/evidence files exist and all six Plan-19 production commits are present.
- Unit, real-run, canonical-byte, current-selector, trace, typecheck, format, lint, privacy, and protected-baseline gates pass.
- Only the two protected user files remain dirty.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
