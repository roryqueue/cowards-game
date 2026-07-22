---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "12"
subsystem: event-integrity
tags: [typescript-ast, candidate, chronicle, replay, web, event-vocabulary]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: inactive exact kernel/current-event candidate from Plan 07
provides:
  - Deterministic AST-backed candidate event producer and consumer-disposition matrix
  - Exact candidate-tuple routing seams across Chronicle grammar, replay reconstruction, and web replay consumers
  - Mutation proof for missing, stale, undeclared, unproduced, regex-only, and reintroduced events
  - Fixed active event-contract and current-authority byte guards
affects: [257-19, atomic-authority-flip, chronicle, replay, web-replay]
tech-stack:
  added: []
  patterns: [candidate-only AST generation, exact tuple routing, historical-or-unknown seam]
key-files:
  created:
    - scripts/generate-v1-37-event-coverage.ts
    - scripts/generate-v1-37-event-coverage.test.ts
    - packages/spec/artifacts/v1.37-candidate-event-coverage.json
  modified:
    - packages/replay/src/grammar.ts
    - packages/replay/src/replay-transition.ts
    - apps/web/app/match-intelligence.ts
    - apps/web/app/matches/replay-ready.ts
    - apps/web/app/matches/[matchId]/replay/replay-board-model.ts
key-decisions:
  - "Coverage evidence is accepted only from TypeScript AST nodes: executable engine event(...) calls and named Set literals inside exact tuple-routed consumers."
  - "The candidate tuple recognizes the 21 proposed current events; PUSH_ATTEMPTED and arbitrary future values route to historical-or-unknown, while every non-candidate tuple retains active-current handling."
  - "The artifact is permanently candidate-branded and cannot run without --candidate or claim publication, counted execution, or current-contract status."
patterns-established:
  - "Event drift guard: declarations, executable producers, and every required consumer disposition must form the same closed set."
  - "Pre-activation seam: additive exact-tuple routing can be tested before the active declaration or current authority is changed."
requirements-completed: [KERN-09, KERN-11]
coverage:
  - id: D1
    description: Every proposed current event has at least one executable engine producer and an explicit disposition at all five replay/web surfaces.
    requirement: KERN-09
    verification:
      - kind: contract
        ref: "packages/spec/artifacts/v1.37-candidate-event-coverage.json"
        status: pass
    human_judgment: false
  - id: D2
    description: Missing, stale, undeclared, unproduced, regex-only, and reintroduced event mutations fail closed.
    requirement: KERN-11
    verification:
      - kind: unit
        ref: "scripts/generate-v1-37-event-coverage.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Candidate and old-current tuple routes distinguish proposed current events from historical or unknown values without changing existing event handlers.
    requirement: KERN-09
    verification:
      - kind: unit
        ref: "scripts/generate-v1-37-event-coverage.test.ts#routes exact candidate events without changing the active tuple seam"
        status: pass
    human_judgment: false
  - id: D4
    description: Active event declarations and current authority artifacts retain their locked bytes.
    requirement: KERN-11
    verification:
      - kind: contract
        ref: "scripts/generate-v1-37-event-coverage.test.ts#keeps active event declarations and authority artifacts byte-exact"
        status: pass
    human_judgment: false
duration: 11min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 12: Candidate Event Coverage Summary

**The proposed v1.37 current-event vocabulary now has executable AST-backed producer and replay/web disposition evidence, while active v1.4 declarations, artifacts, tuple handling, and `PUSH_ATTEMPTED` behavior remain intact until Plan 19.**

## Performance

- **Duration:** 11 min
- **Completed:** 2026-07-13T12:03:27-04:00
- **Tasks:** 1 TDD task
- **Files modified:** 8

## Accomplishments

- Generated a deterministic candidate-only matrix for all 21 proposed current events from real TypeScript syntax rather than text matching.
- Proved that every candidate event has at least one executable engine `event(...)` producer and an explicit disposition in Chronicle grammar, replay reconstruction, match intelligence, replay-ready timelines, and replay-board callouts.
- Added exact candidate-tuple routing to all five consumers. `PUSH_ATTEMPTED` and arbitrary future event names are historical-or-unknown only for the candidate tuple; old/current tuple traffic still uses the unchanged active handlers.
- Mutation-tested missing and stale dispositions, undeclared and unproduced events, comment-only regex decoys, candidate declaration drift, and reintroduction of `PUSH_ATTEMPTED`.
- Made `--candidate` mandatory and marked the artifact inactive, untrusted, non-publishable, non-counted, and incapable of claiming the current contract.
- Preserved the active event types, schemas, current authority source, current authority artifacts, and protected consolidated-spec bytes exactly.

## Task Commits

1. **RED: Define closed candidate coverage and mutation behavior** — `8267c5b`
2. **GREEN: Generate AST coverage and exact tuple-routed consumer seams** — `2b51167`

Integration fix completed during the task: `4ffea2d` narrowed Plan 07's public-barrel guard from an over-broad whole-file hash to explicit negative checks for candidate exports. This allowed Plan 05 to add its required non-candidate semantic-integrity export without weakening candidate isolation.

## Files Created/Modified

- `scripts/generate-v1-37-event-coverage.ts` — Candidate-only AST analyzer, closed-set findings, deterministic renderer, and write/check CLI.
- `scripts/generate-v1-37-event-coverage.test.ts` — Runtime tuple-route proof, deterministic artifact checks, mutations, and active-byte guards.
- `packages/spec/artifacts/v1.37-candidate-event-coverage.json` — Reviewable producer/disposition matrix with source hashes and AST line evidence.
- `packages/replay/src/grammar.ts` — Inert exact-tuple grammar contract seam; existing validator cases unchanged.
- `packages/replay/src/replay-transition.ts` — Inert exact-tuple reconstruction seam; existing transition cases unchanged.
- `apps/web/app/match-intelligence.ts` — Inert exact-tuple annotation seam; existing annotations unchanged.
- `apps/web/app/matches/replay-ready.ts` — Inert exact-tuple timeline seam; existing labels unchanged.
- `apps/web/app/matches/[matchId]/replay/replay-board-model.ts` — Inert exact-tuple board seam; existing callouts unchanged.

## Decisions Made

- Comments, free strings, and regex-shaped text are not coverage. Producer evidence must be a TypeScript `CallExpression` whose callee is `event` and whose first argument is a string literal.
- Consumer evidence must be an AST-readable named `Set` paired with a resolver that references both the exact candidate tuple and that set, and that exposes candidate-current, historical-or-unknown, and active-current outcomes.
- Every candidate event receives all five dispositions, including explicit generic/no-special-effect dispositions where a visual surface has no dedicated treatment.
- Active `PUSH_ATTEMPTED` cases remain executable in all five existing consumers. Plan 19 alone may remove the active declaration and flip the current identity.

## Active-Contract Byte Invariance

| Active file | Locked SHA-256 |
| --- | --- |
| `packages/spec/src/types.ts` | `d32ba8a46f06b3b896d96114c72747e4a9fc61897cfc53a14f77fd2b53d1ae21` |
| `packages/spec/src/schemas.ts` | `43c3f6b08791cafe92b5cd2a6d3f30c1a74c9241dda70e550df8fd11600d91c1` |
| `packages/spec/src/versions.ts` | `98ac9b63482c0a392694551db9a5de2443aa3119f62387316457f03d64341821` |
| `packages/spec/src/integrity-authority.ts` | `11ed27e5646f8f908e2d2b9558a144b28f362ebe395c7a66b58c308953ca83b9` |
| Current authority artifact | `90bd23acff825349ed80b3df6b8e350ecd91153de44e17c952f5a302c7d3499d` |
| Current authority vectors | `cf8ac66719f06c7ebfb4db987524809495be6b6b5a2cbbb75fefbf1c06daafad` |

The protected consolidated-spec working bytes remain `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`, and its binary-diff bytes remain `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`. `.planning/config.json` remained outside every commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan 07's whole-barrel byte guard conflicted with a valid Plan 05 export**

- **Found during:** Plan 12 implementation while Plan 05 completed semantic-integrity exports.
- **Issue:** Pinning all of `packages/spec/src/index.ts` prevented unrelated approved public exports even though the real invariant is that candidate symbols remain private.
- **Fix:** Removed the whole-barrel hash and asserted that the candidate module and its two authority symbols are not exported. Required current authority files remain hash-pinned.
- **Verification:** Focused Plan 07 tests passed 3/3 and the spec suite passed 72/72 at the integration checkpoint.
- **Committed in:** `4ffea2d`

**2. [Rule 3 - Blocking] Ignored duplicate Next type outputs obscured the web typecheck**

- **Found during:** Final web typecheck.
- **Issue:** Three ignored `.next/types/* 2.ts` copies duplicated generated declarations and caused unrelated module-augmentation conflicts.
- **Fix:** Removed only those ignored duplicate generated files and reran the normal web typecheck.
- **Verification:** `pnpm --filter @cowards/web typecheck` passed.

---

**Total deviations:** 2 auto-fixed blocking issues
**Impact on plan:** No scope expansion and no active event or gameplay change. Both fixes strengthened the intended candidate boundary and verification signal.

## Issues Encountered

- The package-wide replay suite contains one intentional downstream RED contract, `EXPECTED_RED:MISSING_SEMANTIC_ENFORCEMENT:REPLAY`, owned by the later semantic-enforcement wiring work. The other 127 replay tests pass, and the Plan 12 grammar/reconstruction tests pass 36/36. This is not a Plan 12 regression.
- Concurrent Plan 06 briefly edited `versions.ts` while proving immutable initial-state ownership. Coordination moved version isolation into candidate state cloning and restored `versions.ts` to its exact locked hash before this summary.

## Verification

- Candidate `--write` followed by `--check` — byte-identical and current.
- Candidate generator/runtime route tests — 6/6 passed.
- Replay grammar and replay-transition tests — 36/36 passed.
- Relevant web match-intelligence, replay-board, and replay-fixture tests — 32/32 passed.
- Spec package suite — 72/72 passed at the final Plan 12 gate.
- Replay and web typechecks — passed.
- Targeted ESLint, Prettier, and `git diff --check` — passed.
- Active declaration/current-authority hashes and protected working-copy hashes — exact.

## TDD Gate Compliance

The task has a distinct failing RED commit and GREEN implementation commit. RED failed because the generator did not exist. GREEN satisfies the closed AST contract, mutation suite, deterministic write/check, exact tuple routes, and byte invariants without weakening the failure.

## User Setup Required

None.

## Next Phase Readiness

- Plan 19 can consume this candidate matrix when it removes `PUSH_ATTEMPTED` from the active vocabulary and flips the complete candidate identity atomically.
- Any producer or consumer drift now makes candidate `--check` fail with a bounded finding rather than silently refreshing coverage.
- Historical and unknown events already have an explicit safe route, so old v1.4 evidence can remain valid after the candidate becomes current.

## Self-Check: PASSED

- All eight plan files and both TDD commits exist.
- Candidate write/check, mutation tests, targeted consumer tests, typechecks, lint, formatting, and active-byte guards pass.
- Current schema and authority bytes remain exact, and only the two protected pre-existing dirty files remain unstaged.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
