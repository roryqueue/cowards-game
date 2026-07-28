---
phase: 261-integrated-service-proof-drift-guards-and-release
plan: "01"
subsystem: release-proof-contracts
tags: [service-proof, restricted-evidence, retention, privacy, fail-closed]
requires:
  - phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
    provides: current v1.19 authority, four-language evidence, arena/Set policy, and protected baseline
provides:
  - closed ordered 44-scenario integrated service proof manifest
  - outside-Git content-addressed restricted evidence store with safe public references
  - executable certificate-validity-plus-90-days retention and deletion policy
affects: [261-02, 261-03, 261-04, 261-05, 261-06]
tech-stack:
  added: []
  patterns:
    - exact immutable transport manifests with stable public-safe rejection codes
    - restricted-first content-addressed capture with safe schema projection
key-files:
  created:
    - scripts/lib/v1-37-integrated-proof-manifest.ts
    - scripts/lib/v1-37-restricted-evidence-store.ts
    - .planning/artifacts/v1.37-restricted-evidence-policy.json
    - .planning/artifacts/v1.37-restricted-evidence-policy.md
  modified:
    - eslint.config.mjs
key-decisions:
  - "The live proof inventory is exactly 44 ordered required scenarios across the seven D-03 groups; infrastructure absence is a failure, never a skipped pass."
  - "Restricted evidence is addressed only by SHA-256 and remains present through the latest bound certificate validity plus 90 calendar days; safe attestations outlive eligible raw-preimage deletion."
patterns-established:
  - "Closed manifest: downstream runners consume V137_INTEGRATED_PROOF_SCENARIOS and cannot add, skip, relabel, or reorder cases."
  - "Restricted lifecycle: exclusive object and attestation writes, no-follow bounded reads, append-only access evidence, strict release presence, then logged policy deletion."
requirements-completed: [PROOF-02, PROOF-03, PROOF-04, PROOF-05]
coverage:
  - id: D1
    description: Exact immutable requirement/decision-traced 44-scenario service manifest rejects incomplete or relabeled input.
    requirement: PROOF-02
    verification:
      - kind: unit
        ref: scripts/lib/v1-37-integrated-proof-manifest.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Restricted content-addressed evidence storage fails closed for overwrite, size, traversal, symlink, digest, access-log, release-presence, and retention violations.
    requirement: PROOF-03
    verification:
      - kind: unit
        ref: scripts/lib/v1-37-restricted-evidence-store.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: Canonical JSON and Markdown lock the selected certificate-validity-plus-90-days retention posture and permanent safe attestation behavior.
    requirement: PROOF-05
    verification:
      - kind: unit
        ref: scripts/lib/v1-37-restricted-evidence-store.test.ts#loads synchronized certificate-validity-plus-90-days policy artifacts
        status: pass
    human_judgment: false
duration: 13min
completed: 2026-07-19
status: complete
---

# Phase 261 Plan 01: Closed Proof and Restricted Evidence Contracts Summary

**A frozen 44-scenario service matrix and no-follow content-addressed evidence lifecycle now make all downstream v1.37 proof collection closed, private-by-construction, and fail-closed.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-19T16:17:34Z
- **Completed:** 2026-07-19T16:30:22Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Froze exactly 44 ordered required scenarios covering four live language lanes, typed failures/no-mutation, identity drift, Chronicle/replay, Set persistence, rollback/retry, and browser/public privacy, with exact PROOF-01 through PROOF-06 and D-01 through D-12 union coverage.
- Added stable public-safe rejection codes for every missing, extra, duplicate, reordered, skipped, unavailable, malformed, extra-keyed, or mis-traced manifest input.
- Added an outside-repository evidence store using exclusive digest-derived object and attestation paths, bounded no-follow reads, verify-on-read, append-only access events, strict release presence checks, and logged eligible deletion.
- Committed byte-synchronized JSON/Markdown policy artifacts selecting the latest certificate validity plus 90 calendar days while preserving permanent safe attestation verification after raw evidence deletion.

## Task Commits

Each TDD task was committed in RED then GREEN order:

1. **Task 1 RED: closed manifest contract** - `9e9ed80`
2. **Task 1 GREEN: immutable 44-scenario authority** - `48b2341`
3. **Task 2 RED: restricted evidence lifecycle contract** - `6314a61`
4. **Task 2 GREEN: store and retention policy** - `af176e8`

## Files Created/Modified

- `scripts/lib/v1-37-integrated-proof-manifest.ts` - Immutable scenario authority and exact fail-closed parser.
- `scripts/lib/v1-37-integrated-proof-manifest.test.ts` - Ordered inventory, coverage, and mutation matrix.
- `scripts/lib/v1-37-restricted-evidence-store.ts` - Exclusive content-addressed store, safe projector, access log, release checks, and retention deletion.
- `scripts/lib/v1-37-restricted-evidence-store.test.ts` - Storage, privacy, path, digest, release, and retention adversarial tests.
- `.planning/artifacts/v1.37-restricted-evidence-policy.json` - Versioned executable policy.
- `.planning/artifacts/v1.37-restricted-evidence-policy.md` - Deterministic human-readable render.
- `eslint.config.mjs` - Includes the plan-mandated `scripts/lib/*.ts` sources in typed linting.

## Verification

- Manifest contract: 6/6 tests passed.
- Restricted evidence contract: 8/8 tests passed.
- Focused typed ESLint passed for both implementations and both tests.
- Workspace typecheck: 27/27 tasks passed.
- Policy JSON and Markdown matched their deterministic renderers byte-for-byte.
- Protected working-tree baseline remained exact at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## Decisions Made

- The 44-row inventory is transport-only: it names owners and observations but contains no transition, Chronicle interpretation, failure consequence, Set derivation, standings, or lane-promotion logic.
- Public evidence references contain exactly schema version, object digest, evidence class, attestation digest, retention class, and availability posture. Root paths, environment values, actors, raw bytes, credentials, logs, and internal IDs remain restricted.
- Strict release requires the raw object, its attestation, and its original write access event. After eligible deletion, only the permanent attestation check remains valid and the safe posture changes to `policy-deleted`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Included plan-mandated nested scripts in typed linting**
- **Found during:** Task 1 focused lint verification
- **Issue:** The existing ESLint project service admitted only `scripts/*.ts`, while the approved plan requires new files under `scripts/lib/*.ts`.
- **Fix:** Added the single nested pattern to `allowDefaultProject`; no lint rule or package boundary was weakened.
- **Files modified:** `eslint.config.mjs`
- **Verification:** Focused ESLint and full workspace typecheck passed.
- **Committed in:** `48b2341`

**Total deviations:** 1 auto-fixed (Rule 3 blocking issue).  
**Impact on plan:** Necessary tooling coverage only; no product, gameplay, evidence, or privacy scope changed.

## Issues Encountered

The initial direct single-file TypeScript invocation was incompatible with the repository's TypeScript configuration mode. The canonical workspace `pnpm typecheck` target was used and passed all 27 tasks. No implementation gap remained.

## User Setup Required

None for these contracts. Live collectors in later plans must set `COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT` to a workspace-external restricted directory; missing configuration remains a strict proof failure.

## Known Stubs

None.

## Next Phase Readiness

Plans 261-02 through 261-06 can now consume one exact manifest and one exclusive restricted evidence seam. No raw evidence was written to Git, no package was added, no gameplay semantics changed, and both protected user paths remain byte-identical to the Phase-261 baseline.

## Self-Check: PASSED

- All seven created/modified production, test, policy, and lint files exist.
- All four TDD commits exist in repository history.
- Both focused suites, typed lint, workspace typecheck, canonical policy render checks, and protected baseline passed.

---
*Phase: 261-integrated-service-proof-drift-guards-and-release*
*Completed: 2026-07-19*
