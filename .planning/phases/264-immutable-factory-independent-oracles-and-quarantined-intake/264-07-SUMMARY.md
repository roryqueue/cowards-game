---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
plan: "07"
subsystem: private-model-factory-route
tags: [private, immutable-provenance, source-only, codex-cli, calibration-manifest]
status: complete
completed: "2026-09-14"
dependency_graph:
  requires: [264-05, 264-06]
  provides: [truthful-v2-model-provenance, frozen-authoring-allocation, source-review-handoff]
  affects: [264-08]
tech_stack:
  added: []
  patterns: [explicit-unavailable-serving-snapshot, rooted-pre-output-allocation, inert-command-description]
key_files:
  created:
    - scripts/author-v1-38-factory-model-source.ts
    - scripts/author-v1-38-factory-model-source.test.ts
  modified:
    - packages/strategy-oracle-model/src/bundle.ts
    - packages/strategy-oracle-model/src/model.test.ts
    - scripts/ingest-v1-38-factory-packet.test.ts
    - scripts/prepare-v1-38-factory-calibration.ts
    - scripts/prepare-v1-38-factory-calibration.test.ts
decisions:
  - "A v2 model bundle declares an unavailable internal serving snapshot instead of turning client version into an invented model revision."
  - "The route is frozen as source-only data: four authoring slots, token accounting ceilings, twelve source recipes, and 48 workload cells are fixed before any output."
  - "Only independent source review may release the bounded empirical path; this plan does not invoke it."
---

# Phase 264 Plan 07: Fresh Route Summary

Truthful successor model provenance and the complete private fresh-route allocation are source-ready for independent review, with no model request, generated source, workload, Match, or empirical claim produced.

## Accomplishments

- Added immutable `frozen-model-bundle-v2` admission with requested and reported model IDs, client/settings identity, exact request/response record roots, actual usage, and explicit `servingSnapshot.availability: unavailable`.
- Preserved v1 model bundle validation and reload behavior unchanged; v2 rejects fabricated snapshots and a client version substituted as a model revision.
- Frozen A-01 through A-04 inside one 30-minute window with 50,000 input-plus-output tokens per attempt and 200,000 total as experiment ceilings, not provider hard caps.
- Declared S01–S12 recipes and all 48 two-geometry, side-confounded, one-phase workload cells before output; each keeps `maxInvocations: 256`, `maxLifetimeMs: 120000`, and the existing one-second per-method limit.
- Added a documented-capability-gated, disclosed-packet-only command description. It is inert and returns capability-unavailable without the documented read-only/JSON/ephemeral/config-isolation facts.
- Recorded an explicit `source_ready_for_independent_review` handoff with `empiricalAction: not_authorized`.

## Task Commits

1. `db1149cf` — `feat(264-07): add truthful successor model provenance`
2. `37160246` — `feat(264-07): freeze authoring allocation before output`
3. `51743784` — `feat(264-07): record independent review handoff`

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-model/src/model.test.ts packages/strategy-lab/src/factory/contracts.test.ts scripts/author-v1-38-factory-model-source.test.ts scripts/ingest-v1-38-factory-packet.test.ts scripts/prepare-v1-38-factory-calibration.test.ts` — passed 22/22.
- `./node_modules/.bin/tsc -b packages/strategy-lab packages/strategy-oracle-tactical packages/strategy-oracle-teacher packages/strategy-oracle-model --pretty false` — passed.
- Standalone strict TypeScript 6 check over authoring, preparation, ingestion, runner, boundary monitor, and supervised-runtime scripts — passed.
- `./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts` — passed: 1,273 files scanned, zero violations.

## Deviations from Plan

### Auto-fixed Issues

1. [Rule 1 - Bug] Corrected the strict TypeScript cast in allocation admission after the initial implementation exposed a structural-cast error.
   - Files modified: `scripts/author-v1-38-factory-model-source.ts`
   - Verification: focused authoring tests and standalone TypeScript check passed.

## Known Stubs

None. The command builder intentionally returns inert argv/cwd data and never launches a process; this is the plan's required isolation boundary, not an unwired output.

## Next Phase Readiness

Independent source review is the only permitted next release gate. No readiness, independence, provider/model availability, token-cap enforcement, generated-source validity, calibration, Match, runtime, human/external intake, holdout, formation, public, counted, production, or gameplay claim is made here.

## Self-Check: PASSED

- All six source/test paths named above exist.
- All three task commits are present in git history.
- The summary is limited to source mechanics and reports no empirical action.
