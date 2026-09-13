---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
plan: "01"
subsystem: private-strategy-factory
tags: [private, immutable, content-addressed, supervised-runtime]
dependency_graph:
  requires: [phase-263-admitted-roots, strategy-lab-runtime-bridge]
  provides: [factory-packet-contract, charged-attempt-ledger, factory-subpath]
  affects: [phase-264-oracle-leaves, private-calibration-cli]
tech_stack:
  added: []
  patterns: [canonical-json, sha256-content-addressing, hard-link-publication, injected-supervision]
key_files:
  created:
    - packages/strategy-lab/src/factory/contracts.ts
    - packages/strategy-lab/src/factory/identity.ts
    - packages/strategy-lab/src/factory/ledger.ts
    - packages/strategy-lab/src/factory/repository.ts
    - packages/strategy-lab/src/factory/admission.ts
    - packages/strategy-lab/src/factory/index.ts
  modified:
    - packages/strategy-lab/package.json
decisions:
  - "Factory identity stages are packet -> proposal -> validation evidence -> fingerprinted candidate."
  - "Factory failures are private charged evidence and are never scored as gameplay."
  - "Oracle leaves import only @cowards/strategy-lab/factory, never the strategic root barrel."
metrics:
  duration: "~8 minutes"
  completed_date: "2026-09-13"
  tasks_completed: 3
  files_changed: 13
status: complete
---

# Phase 264 Plan 01: Immutable Factory Foundation Summary

Private candidates now have a noncircular, immutable evidence chain from oracle packet through validation and fingerprints to a content-addressed candidate, with charged terminal attempts and a narrow non-strategic package entry point.

## Completed Tasks

1. Defined strict canonical schemas and domain-separated roots for private packet, proposal, validation, and candidate artifacts. Native source/lane identity, predecessor lineage, and all six required fingerprint roots are bound and immutable.
2. Added an append-only attempt ledger and content-addressed private repository. Start records are durable before work; missing, duplicate, unreadable, or start-only terminal coverage fails closed. Admission handles candidate source only as bytes and maps supervised failure to unscored evidence.
3. Added `@cowards/strategy-lab/factory`, which exports only factory contracts, roots, ledger, repository, and admission helpers. The existing root barrel remains unchanged and does not expose the factory API.

## Verification

- Final after same-plan repairs: all5focused test files pass18tests (main3.90seconds, independent reviewer3.81seconds); unfiltered `tsc -b packages/strategy-lab` passes in both checks. `264-FOUNDATION-REVIEW.md` is independently clean at459017f8. Earlier9-test task result below is historical, not the final assurance claim.

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/contracts.test.ts packages/strategy-lab/src/factory/identity.test.ts packages/strategy-lab/src/factory/ledger.test.ts packages/strategy-lab/src/factory/repository.test.ts packages/strategy-lab/src/factory/admission.test.ts` — passed (5 files, 9 tests).
- `./node_modules/.bin/tsc -b packages/strategy-lab` — passed.
- `git diff --check` — passed.

## Commits

- `dd71f732` — `feat(264-01): define immutable factory identities`
- `17d406d6` — `feat(264-01): retain charged factory attempts`
- `9cb9b701` — `feat(264-01): expose private factory subpath`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical package boundary] Added a factory-only subpath barrel**
- **Found during:** Task 3
- **Issue:** `package.json` cannot expose the required contracts, identities, ledger, repository, and admission API as one narrow subpath without an entry module.
- **Fix:** Added `packages/strategy-lab/src/factory/index.ts` and exported it only as `@cowards/strategy-lab/factory`; no root barrel, planner, selector, or source-execution entry point was widened.
- **Files modified:** `packages/strategy-lab/src/factory/index.ts`, `packages/strategy-lab/package.json`
- **Verification:** package TypeScript build passed.
- **Commit:** `9cb9b701`

**Total deviations:** 1 auto-fixed. **Impact:** a required import boundary is explicit and remains private/non-strategic.

## Known Stubs

None.

## Independent review and same-plan corrections

The original implementation had provenance, exact-provider binding, durability, path/recovery, finalization and opponent-attribution gaps. Two repair passes fixed them without a new plan or empirical allocation; see264-FOUNDATION-REVIEW-FIX.md and historical reviews6d103482/ec38006f. Final flow is `admitFactory(packet, proposal, sourceBytes)` → `authorizeFactorySupervision` → `superviseFactory` issued participant-bound receipt → `finalizeFactoryCandidate` after fingerprints. Finalization cannot use pre-execution authorization, fabricated receipts or failed Match evidence. Main commits:f7e28680,32ac8941,7189b470,6aa9d349,87bf320a,c05588dd,459017f8. All work remains private source/injected-test proof, not empirical independence or gameplay evidence.

## Next Phase Readiness

Oracle leaves can emit `FactoryOraclePacket` and compose the immutable packet -> proposal -> validation -> candidate chain through `@cowards/strategy-lab/factory`. This foundation makes no empirical success claim, runs no Match, and creates no production, public, holdout, formation, or calibration authority.

## Self-Check: PASSED

- All six factory implementation files, five focused test files, and the narrow subpath entry exist.
- All three task commits are present in git history.
