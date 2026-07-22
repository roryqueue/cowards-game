---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "11"
subsystem: executable-conformance-corpus
tags: [typescript, python, rust, zig, candidate-only, independent-review, immutable-history]

requires:
  - phase: 260-03
    provides: Kernel-owned v1.19 initiative and activation-slot Advance observation truth table
  - phase: 260-10
    provides: Exact v1.19 observation transport through all four real runtime providers
provides:
  - Immutable 30-case corpus-v3 observation candidate with D-01 through D-08 coverage
  - Independently reviewed inactive candidate pin binding corpus, diff, review, every case root, and every source root
  - Byte-exact guards for the Phase-259 v2 registry, reviewed pin, and immutable v1/v2 corpus history
affects: [260-12, 260-13, 260-14, 260-19, four-language-certification]

tech-stack:
  added: []
  patterns: [explicit-inactive-candidate, exact-root-independent-review, immutable-current-byte-guard]

key-files:
  created:
    - packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json
    - packages/golden/src/fixtures/v1-37-conformance-corpus/v3/semantic-diff.json
    - packages/golden/src/fixtures/v1-37-conformance-corpus/v3/independent-review.json
    - packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts
  modified:
    - packages/golden/src/v1-37-conformance-corpus.ts
    - packages/golden/src/v1-37-conformance-corpus.test.ts
    - scripts/generate-v1-37-conformance-corpus.ts
    - scripts/generate-v1-37-conformance-corpus.test.ts

key-decisions:
  - "Keep the released current loader on v2 and expose v3 only through its explicit inactive candidate version and pin until Plan 14."
  - "Make fixture outputs depend on every new observation field and enumerate each D-01 through D-08 transition case rather than treating additive JSON as sufficient evidence."
  - "Review exact roots and an allowlisted semantic diff while rejecting self-authored, stale, gameplay/history, and HOLD/END_ACTIVATION changes."

patterns-established:
  - "Candidate corpus review binds exact corpus, diff, review, case inventory, and source inventory roots without consulting or mutating current selection."
  - "Historical byte guards pin the registry, current reviewed pin, and v1/v2 corpus files until the single atomic activation owner changes them."

requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-05]

coverage:
  - id: D1
    description: "Corpus v3 enumerates both-observer and later-Round initiative, first/post-Advance/later-Cycle slot state, TURN, blocked MOVE/PUSH, pushed target, successful pusher, reset, transport ownership, revalidation, and observational-only cases."
    requirement: STRAT-01
    verification:
      - kind: unit
        ref: "scripts/generate-v1-37-conformance-corpus.test.ts#creates an inactive v3 observation candidate"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/golden test"
        status: pass
    human_judgment: false
  - id: D2
    description: "TypeScript, Python, Rust, and Zig candidate source bytes consume all four initiative fields and hasAdvancedThisActivation; Rust and Zig compile with the pinned toolchains."
    requirement: STRAT-03
    verification:
      - kind: integration
        ref: "scripts/generate-v1-37-conformance-corpus.test.ts#compiles the v3 observation fixtures"
        status: pass
    human_judgment: false
  - id: D3
    description: "The independent review and candidate pin bind exact v3 roots and all D-01 through D-08 dispositions while rejecting stale, self-authored, gameplay/history, and HOLD deltas."
    requirement: SET-05
    verification:
      - kind: other
        ref: "pnpm exec tsx scripts/generate-v1-37-conformance-corpus.ts --check-candidate=v3"
        status: pass
    human_judgment: false
  - id: D4
    description: "Current registry/default lookup remains v2 and exact Phase-259 registry, reviewed pin, v1, and v2 bytes remain unchanged."
    requirement: STRAT-04
    verification:
      - kind: unit
        ref: "packages/golden/src/v1-37-conformance-corpus.test.ts#keeps Phase-259 current bytes exact"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-37-conformance-corpus.ts --check"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 11: Reviewed Corpus-v3 Candidate Summary

**A fully reviewed 30-case observation corpus candidate now forces all four language fixtures to consume truthful v1.19 initiative and activation-slot Advance facts while Phase-259 v2 remains byte-exact current.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-17T06:47:20Z
- **Completed:** 2026-07-17T06:58:55Z
- **Tasks:** 3, including 2 TDD tasks
- **Files modified:** 8

## Accomplishments

- Added immutable corpus v3 with the existing 16 boundary/failure/differential cases plus 14 explicit D-01 through D-08 observation cases.
- Replaced passive fixture behavior with four language-specific candidate programs whose deterministic outputs depend on initial and Round initiative facts plus pre-Action `hasAdvancedThisActivation`.
- Generated an allowlisted semantic diff and independent review with explicit disposition for D-01 through D-08 and every protected gameplay, history, failure, HOLD, and privacy surface.
- Minted a separately named inactive candidate pin binding exact corpus, diff, review, 30 case roots, four source roots, and candidate paths.
- Added exact byte guards proving the current registry, reviewed pin, v1 corpus, v2 corpus, and default lookup remain Phase-259 artifacts.

## Task Commits

1. **Task 1 RED: observation corpus candidate contract** - `e577d24`
2. **Task 1 GREEN: immutable corpus-v3 generation** - `4984856`
3. **Task 2 RED: independent review and pin contract** - `c36d679`
4. **Task 2 GREEN: exact reviewed inactive candidate** - `70404b4`
5. **Task 3: current selection and historical byte guards** - `9b30f46`, `ad9ba39`
6. **Quality-gate formatting/lint repair** - `022c8b7`

## Decisions Made

- The active loader remains intentionally unaware of candidate v3. Candidate consumers must name the exact v3 pin; only Plan 14 may replace the active registry and reviewed pin.
- Existing cases are copied byte-semantically and every new case declares `gameplayMutation: false`; the review rejects modifications to any baseline case.
- Rust and Zig consume the new fields through exact guest-input byte probes, while TypeScript and Python read the fields structurally. Plan 19 remains responsible for three fresh full real-lane executions.
- Generalized invocation-manifest validation accepts a closed ordered script containing both Strategy methods, allowing the candidate truth table without weakening current v2 validation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved historical cases whose established expectation legitimately records gameplay mutation**
- **Found during:** Task 2 independent review generation
- **Issue:** The first review guard rejected baseline mutation/differential cases because their existing expectations intentionally set `gameplayMutation: true`.
- **Fix:** Require exact equality for every baseline case and require `gameplayMutation: false` only for newly added observation cases.
- **Verification:** Exact v1/v2 byte guards and candidate review checks pass.
- **Committed in:** `70404b4`

**2. [Rule 3 - Blocking] Annotated literal guest-source escaping for ESLint**
- **Found during:** Overall quality gates
- **Issue:** ESLint interpreted quote escapes required inside embedded Rust/Zig source bytes as unnecessary JavaScript escapes.
- **Fix:** Added a narrow documented rule suppression around only the embedded guest-source literals, preserving exact generated bytes.
- **Verification:** ESLint, Prettier, pinned Rust/Zig compilation, and exact candidate-root checks pass.
- **Committed in:** `022c8b7`

---

**Total deviations:** 2 auto-fixed (1 review correctness bug, 1 embedded-source lint blocker).
**Impact on plan:** Both fixes strengthen exact validation without changing candidate bytes, active selection, gameplay, history, or runtime ownership.

## Verification

- Golden package: 3 files, 29 tests passed.
- Focused corpus/generator: 2 files, 19 tests passed.
- Candidate checker: exact v3 root `sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d`, inactive.
- Current checker: exact v2 root `sha256:238347225defaaabcf9e57141ac7a54b4b277bd149bebe2b21903febc9ce7ac2`, current.
- Golden typecheck, package lint, script ESLint, and Prettier checks passed.
- Candidate Rust and Zig fixtures compiled with the pinned local toolchains.
- Protected working-tree baseline remains `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## TDD Gate Compliance

- Task 1 RED `e577d24` failed because the observation-corpus constructor and committed candidate writer did not exist; GREEN `4984856` produced and validated exact v3 bytes.
- Task 2 RED `c36d679` failed because the independent review checker and candidate pin did not exist; GREEN `70404b4` binds every exact root and rejects stale/self-authored evidence.

## Next Phase Readiness

- Plan 12 can bind its trace-v4 candidate directly to `V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN` and the explicit 30-case inventory.
- Plan 19 can execute the exact four candidate sources three fresh times per real lane without reusing Phase-259 evidence.
- Plan 14 remains the sole activation owner; nothing in this plan changes current corpus selection, certificates, Workshop defaults, gameplay, HOLD semantics, or historical dispatch.
- Protected user modifications remain untouched and uncommitted.

## Self-Check: PASSED

- All eight planned source/artifact files exist and the seven implementation/test commits are present.
- Exact candidate, current, history, compiler, typecheck, lint, format, and protected-baseline gates pass.
- Candidate status is explicitly inactive/current false and the Phase-259 registry and reviewed pin remain exact.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
