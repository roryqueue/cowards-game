---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 38
subsystem: custody-mechanics
tags: [synthetic-custody, restricted-store, one-open, hmac, fail-closed, non-authorizing]
requires:
  - phase: 262-37
    provides: profile-neutral protocol root and zero-finding pre-formation containment policy
provides:
  - closed synthetic custody lifecycle with outside-repository restricted storage
  - exact external custody handoff schema and fail-closed bounded reference checker
  - canonical synthetic mechanics receipt with unavailable custody and no SEAL-01 credit
affects: [262-39, 262-40, MEAS-10, SEAL-01]
tech-stack:
  added: []
  patterns: [outside-repo no-follow store, append-only fsynced ledger, one-open state machine, closed safe projection]
key-files:
  created:
    - scripts/lib/v1-38-custody.ts
    - scripts/check-v1-38-authorized-custody-handoff.ts
    - scripts/evaluate-v1-38-custody.test.ts
    - .planning/artifacts/v1.38-synthetic-custody-mechanics.json
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-38-SUMMARY.md
  modified: []
key-decisions:
  - "Keep synthetic custody status unavailable and satisfiesSeal01 false even when every mechanical lifecycle test passes."
  - "Persist only synthetic non-holdout bytes outside the repository under 0700 directories, 0600 exclusive files, no-follow bounded reads, and append-only fsynced events."
  - "Require approved external identities plus separately supplied authenticated provenance before the handoff checker can render any bounded reference; repository defaults contain no approvals and render nothing."
patterns-established:
  - "Synthetic mechanics and operational authority are separate: mechanics success cannot create a custodian, trust identity, SEAL-01 credit, or downstream authority."
  - "Invalid safe projection after opening is terminal contamination, not a diagnostic-query or replacement opportunity."
requirements-completed: [MEAS-10]
coverage:
  - id: D1
    description: "Closed deterministic custody commands enforce commitment, authorization, one open, bounded projection, verification, terminal contamination, and retirement."
    requirement: MEAS-10
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-custody.test.ts#Phase 262 closed synthetic custody mechanics"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exact handoff schemas reject every missing, extra, unapproved, self-issued, or unauthenticated field without rendering a reference."
    requirement: MEAS-10
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-custody.test.ts#Phase 262 authorized custody handoff boundary"
        status: pass
    human_judgment: false
  - id: D3
    description: "Canonical receipt binds exact implementation and policy bytes while keeping custody unavailable, SEAL-01 false, and downstream authority false."
    requirement: MEAS-10
    verification:
      - kind: integration
        ref: "scripts/evaluate-v1-38-custody.test.ts#Phase 262 explicit no-credit synthetic custody receipt"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check"
        status: pass
    human_judgment: false
duration: 12min
completed: 2026-08-12
status: complete
---

# Phase 262 Plan 38: Synthetic Custody Mechanics Without Operational Credit Summary

**Restricted outside-repository custody mechanics now prove a one-open HMAC lifecycle and fail-closed handoff boundary while custody stays unavailable, `satisfiesSeal01` stays false, and every downstream authority stays denied.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-12T22:13:24Z
- **Completed:** 2026-08-12T22:25:16Z
- **Tasks:** 2/2
- **Files modified:** 4 implementation/test/artifact files plus this summary

## Accomplishments

- Added closed `commit`, `authorizeOpen`, `openOnce`, `projectSafeReceipt`, `verify`, `markContaminated`, and `retire` mechanics without a generic read/query/getter surface.
- Enforced absolute outside-repository storage, traversal and symlink rejection, `0700` directories, `0600` exclusive files, bounded no-follow reads, append-only fsynced events, HMAC-SHA-256 framing, and length-checked timing-safe verification.
- Persisted the exact synthetic opening actor/command authorization privately so mismatched and repeated opens fail durably; invalid post-open projection terminally contaminates the lifecycle.
- Defined an exact external handoff schema covering commitment, approved control identities, one-open identities, access/query ledger roots, bounded safe projection, terminal contamination, retention/retirement, six lineage exclusions, pre-search root/bytes, and authenticated external provenance.
- Rendered canonical receipt root `sha256:5615979933dfcf3aa0a65556084565adeaf5a0cfb7cc590b4126e0a02e295890` with `custodyStatus: unavailable`, `satisfiesSeal01: false`, and four exact false downstream authority fields.

## Task Commits

Each TDD gate was committed independently:

1. **Task 1 RED: custody lifecycle and handoff tests** - `fdc05268` (test)
2. **Task 1 GREEN: closed synthetic custody mechanics** - `92d2b9df` (feat)
3. **Task 2 RED: deterministic no-credit receipt tests** - `a9e6d4f9` (test)
4. **Task 2 GREEN: source-bound synthetic mechanics receipt** - `0b10b8de` (feat)

## Files Created/Modified

- `scripts/lib/v1-38-custody.ts` - Restricted synthetic store, lifecycle commands, safe projection, exact handoff schema/validator, and no-credit receipt builder.
- `scripts/check-v1-38-authorized-custody-handoff.ts` - Fail-closed checker whose repository default has no approvals and emits no reference.
- `scripts/evaluate-v1-38-custody.test.ts` - Integration, lifecycle, filesystem, mutation, identity, authentication, privacy, and deterministic artifact proof.
- `.planning/artifacts/v1.38-synthetic-custody-mechanics.json` - Canonical non-authorizing receipt bound to exact source, test, protocol, and containment bytes.

## Automated Evidence

- Focused Vitest: 9 passed, 0 failed.
- Dependency-revision boundary monitor: `passed_absence`; 148 protected paths, seven successor sources scanned, matrix admission blocked, downstream authority denied.
- Standalone strict TypeScript: passed for the custody module, checker, and focused test.
- Repository typecheck: 27/27 Turbo tasks passed.
- Filesystem lifecycle: external temporary root, no-follow and path/traversal/symlink rejection, `0700`/`0600` modes, exclusive writes, bounded reads, durable rejected events, actor/command equality, repeated-open rejection, contamination, and retirement pass.
- Handoff mutation coverage: every section and nested field is required; unapproved store, key, custodian role, opening actor/command, retirement authority, trust identity, or failed provenance authentication renders no reference.
- Deterministic artifact and privacy scans: committed receipt matches the builder byte-for-byte and contains no genuine identity, signature, external-receipt, private-path, credential, provider, database, or host material.
- Product boundary: no `apps/` or `packages/` source changed; no candidate, formation, live matrix, provider, database, public output, protected-history, or replay-manifest work occurred.

## Decisions Made

- Synthetic identifiers are explicitly test-only and can exercise schema mechanics, but their approval function is false for authentication and they receive no operational credit.
- The command log's last event, including a rejection, determines current state so a terminally contaminating rejection cannot be erased by the last accepted event.
- Genuine separately permissioned controls are absent and only Plan 262-40 may accept them; this plan does not create, select, or infer any such control.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected stale privacy-seam read path**
- **Found during:** Task 1 required reads
- **Issue:** The plan named nonexistent `packages/spec/src/public-projection-privacy.ts`.
- **Fix:** Used the existing canonical `packages/spec/src/public-output-privacy.ts` seam identified by repository search and prior implementations.
- **Files modified:** None for the correction; imports use the canonical module.
- **Verification:** Focused tests, privacy scan, boundary monitor, and both typechecks pass.
- **Committed in:** `92d2b9df`

**2. [Rule 1 - Bug] Closed authorization identity and contamination-state gaps**
- **Found during:** Task 1 GREEN adversarial review
- **Issue:** An authorization event initially did not persist actor/command equality, and rejected terminal projection had to remain the current state.
- **Fix:** Added a private `0600` exact authorization record, matched both identities during open, and derived current state from the last durable event.
- **Files modified:** `scripts/lib/v1-38-custody.ts`, `scripts/evaluate-v1-38-custody.test.ts`
- **Verification:** Mismatched actor, repeated open, forbidden projection, diagnostic-query, contamination, and retirement cases pass.
- **Committed in:** `92d2b9df`

**3. [Rule 1 - Bug] Closed standalone TypeScript narrowing gaps**
- **Found during:** Tasks 1 and 2 GREEN verification
- **Issue:** Direct TypeScript compilation found unknown-record narrowing and exhaustive-return gaps not surfaced by Vitest.
- **Fix:** Bound validated records explicitly, narrowed command discriminants, and made terminal failures return `never` visibly.
- **Files modified:** `scripts/lib/v1-38-custody.ts`, `scripts/evaluate-v1-38-custody.test.ts`
- **Verification:** Standalone strict TypeScript and repository typecheck pass.
- **Committed in:** `92d2b9df`, `0b10b8de`

---

**Total deviations:** 3 auto-fixed (2 Rule 1 implementation bugs, 1 Rule 3 stale read path).  
**Impact on plan:** The fixes strengthen the declared fail-closed mechanics and use the canonical privacy seam; none adds authority, genuine controls, live data, product reachability, or scope.

## Issues Encountered

None beyond the auto-fixed stale path and implementation defects.

## Authentication Gates

None. No genuine external control or authentication material was provided or requested.

## User Setup Required

None - the test-owned external store is disposable and contains synthetic non-holdout bytes only.

## Known Stubs

None. The repository-default empty approval arrays are deliberate fail-closed controls: they prevent the checker from rendering any reference until Plan 262-40 receives genuine separately controlled inputs.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: external_file_access | `scripts/lib/v1-38-custody.ts` | New offline synthetic custody store writes only to caller-owned absolute roots outside the repository with no-follow, mode, size, traversal, and symlink enforcement. |

## Live Truth Preserved

Route 5 remains `calibration_stopped`; reproduction:v10 remains absent; fresh charged/accepted evidence remains 0/0; expired no-retry authority remains unchanged. ADMIT-03 is blocked and SEAL-01 is unmet. Custody remains unavailable, and candidate search, Phase 263, formation materialization, holdout opening, live work, provider/database work, production authorization, and public exposure remain denied. The frozen replay manifest's unreachable commit was not repaired, substituted, waived, or credited.

## Next Phase Readiness

Plan 262-39 may bind this exact non-authorizing mechanics receipt into the pre-search policy root. It receives no genuine custody credit, SEAL-01 pass, matrix admission, candidate, formation, holdout, Phase 263, live-work, product, or public authority.

## Self-Check: PASSED

All four created implementation/test/artifact files exist; commits `fdc05268`, `92d2b9df`, `a9e6d4f9`, and `0b10b8de` resolve in Git; focused tests, strict script typecheck, 27/27 repository typecheck, deterministic regeneration, privacy scan, protected-history boundary monitor, external-store lifecycle, and explicit denial projection pass.
