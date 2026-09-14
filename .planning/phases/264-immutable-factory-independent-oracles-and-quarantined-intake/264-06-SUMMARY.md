---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
plan: "06"
subsystem: factory-intake
tags: [private-intake, provenance, disclosure, immutable-ledger, vitest]

requires:
  - phase: 264-01
    provides: private factory contracts, common hostile admission, and durable content-addressed repository
provides:
  - root-bound frozen participant/reviewer intake protocol with strict disclosure and budget policy
  - bounded reviewer projection that rejects prohibited private payload classes
  - charged quarantined source intake with retained invalid, rejected, duplicate, retry, weak, and accepted terminal records
affects: [264-07, 264-08, ORCL-01, ORCL-05]

tech-stack:
  added: []
  patterns: [root derivation omits root field, deep-frozen canonical envelopes, repository-derived budgets]

key-files:
  created: []
  modified:
    - packages/strategy-lab/src/factory/intake-protocol.ts
    - packages/strategy-lab/src/factory/intake-protocol.test.ts
    - packages/strategy-lab/src/factory/intake.ts
    - packages/strategy-lab/src/factory/intake.test.ts

key-decisions:
  - "Require explicit participant and reviewer authorization identifiers; no default or fabricated person is introduced."
  - "Charge and persist an attempt before hostile packet validation, then derive duplicate, reviewer reuse, acceptance, and cumulative time decisions from retained repository records."
  - "Reviewer output is an exact roots-only projection for source/provenance disclosure and rejects unknown or prohibited payload classes."

patterns-established:
  - "All intake metadata uses exact canonical keys, bounded identifiers/integers, domain-separated roots, and recursive freezing."
  - "Source bytes remain data and can proceed only through the existing admitFactory seam; intake never executes source or creates gameplay evidence."

requirements-completed: [ORCL-01, ORCL-05]

coverage:
  - id: D1
    description: "Frozen intake protocol binds authorization identities, disclosure, provenance, validation, conflict, and bounded submission/reviewer/acceptance/time policy."
    requirement: ORCL-05
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/factory/intake-protocol.test.ts#requires actual authorization identifiers and derives a root without an undefined field
        status: pass
      - kind: unit
        ref: packages/strategy-lab/src/factory/intake-protocol.test.ts#projects only verified source/provenance roots to an authorized reviewer
        status: pass
    human_judgment: false
  - id: D2
    description: "Quarantined submissions are charged before validation, admitted only as explicit deterministic source through common admission, and retain all terminal dispositions."
    requirement: ORCL-01
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/factory/intake.test.ts#forwards explicit deterministic source as data through common admission and retains a root
        status: pass
      - kind: unit
        ref: packages/strategy-lab/src/factory/intake.test.ts#charges and retains invalid, incomplete-provenance, conflict, weak, duplicate, and retry outcomes
        status: pass
      - kind: unit
        ref: packages/strategy-lab/src/factory/intake.test.ts#derives reviewer reuse, acceptance, and time budgets from retained records
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-09-14
status: complete
---

# Phase 264 Plan 06 Summary

**Fail-closed private human/external intake now uses a root-bound protocol, bounded reviewer projection, and repository-derived charged terminal ledger.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-14T00:20:00Z
- **Completed:** 2026-09-14T00:28:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added strict frozen protocol validation requiring explicit participant/reviewer identifiers, authorization roots, disclosure, provenance, validation, conflict, confidentiality, acceptance, and bounded resource policy.
- Added deep-frozen roots-only reviewer projection with exact runtime validation and denial of unknown, holdout, other-source, memory, objective, host, evaluator, credential, and security payload classes.
- Replaced caller-controlled ordinals with durable pre-validation charging, repository-derived attempt/reviewer/acceptance/time accounting, unique attempt roots, retry/duplicate detection, and retained terminal evidence.
- Added focused tests covering valid fully rooted protocol, prohibited projection injection, valid source forwarding through a temporary repository, invalid/provenance/conflict/duplicate/retry/weak retention, budget exhaustion, ledger completion, and no gameplay claim.

## Task Commits

1. **Task 1: Define the exact frozen intake protocol and disclosure classes** - `06ab180f` (feat)
2. **Task 2: Admit explicit hostile submissions into the common evidence root** - `f6701dc9` (feat)

## Files Created/Modified

- `packages/strategy-lab/src/factory/intake-protocol.ts` - strict frozen protocol, blocked configuration, root derivation, and reviewer projection.
- `packages/strategy-lab/src/factory/intake-protocol.test.ts` - protocol/projection and hostile-field tests.
- `packages/strategy-lab/src/factory/intake.ts` - provenance schema, pre-validation charge, common admission forwarding, and retained-ledger accounting.
- `packages/strategy-lab/src/factory/intake.test.ts` - temporary-repository intake, terminal disposition, budget, duplicate/retry, and no-gameplay tests.

## Decisions Made

- The channel accepts opaque authorization identifiers only; it does not assert real human/external participation or invent defaults.
- Every call receives a durable start record before hostile packet/provenance/source validation. Failed, rejected, weak, duplicate, retry, and accepted results all receive a terminal record in the common private repository.
- Acceptance, reviewer reuse, duplicate, and cumulative time checks use retained accounting artifacts rather than caller ordinals or claimed counters.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Charge malformed retry metadata before validation**
- **Found during:** post-task self-review of Task 2
- **Issue:** An invalid caller-supplied retry root could fail attempt construction before the required durable charge.
- **Fix:** Normalize malformed retry metadata to a deterministic invalid root for the start record, then retain the terminal `invalid` disposition.
- **Files modified:** `packages/strategy-lab/src/factory/intake.ts`, `packages/strategy-lab/src/factory/intake.test.ts`
- **Verification:** Focused intake tests (6) and strategy-lab TypeScript build pass.
- **Committed in:** follow-up fix commit below.

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Preserves the required charge-before-validation boundary without expanding scope.

## Issues Encountered

None - focused Vitest and strategy-lab TypeScript verification pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The private intake path is ready for downstream readiness/calibration work. No real participant, model, external provider, gameplay, candidate-completion, production, public, or holdout claim was created; empirical participation remains pending explicit authorized inputs.

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/intake-protocol.test.ts packages/strategy-lab/src/factory/intake.test.ts` — passed (9 tests).
- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory` — passed (26 tests).
- `./node_modules/.bin/tsc -b packages/strategy-lab --pretty false` — passed.

## Self-Check: PASSED

- All four scoped source/test files exist.
- Task commits `06ab180f` and `f6701dc9` exist in git history.
- Summary is intentionally limited to Plan 264-06 and does not claim external participation or empirical candidate evidence.

---
*Phase: 264-immutable-factory-independent-oracles-and-quarantined-intake*
*Plan: 06*
*Completed: 2026-09-14*
