---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "20"
subsystem: strategy-revision-revalidation
tags: [runtime-v1.19, revision-inventory, provider-proof, fail-closed, privacy]

requires:
  - phase: 260-19
    provides: Exact inactive four-language candidate pins and real lane evidence
  - phase: 260-26
    provides: Revision-specific six-probe runtime-service revalidation boundary
provides:
  - Exact frozen inventory of every persisted pre-v1.19 Strategy Revision
  - Real TypeScript guest execution path for six candidate observations
  - Explicit non-counted disposition for every inventory row lacking immutable exact provider ownership
  - Canonical public-safe artifact with no selector activation or evidence inheritance
affects: [260-21, 260-14, counted-strategy-admission, strategy-revision-migration]

tech-stack:
  added: []
  patterns: [serializable-frozen-inventory, exact-provider-proof, revision-specific-receipt, explicit-non-counted-disposition]

key-files:
  created:
    - scripts/revalidate-v1-37-strategy-revisions-v1-19.ts
    - scripts/revalidate-v1-37-strategy-revisions-v1-19.test.ts
    - .planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json
  modified: []

key-decisions:
  - "The frozen inventory covers all persisted pre-v1.19 rows, including unlocked rows; unlocked rows are explicitly non-counted rather than silently omitted."
  - "Provider ownership requires the persisted provider proof to match exact source and artifact identity; language-level inference or a provider-id-only claim is inadmissible."
  - "Historical revisions without exact provider ownership remain immutable and non-counted; they are not rewritten, relabeled, or allowed to inherit sibling or language evidence."

requirements-completed: [STRAT-03, STRAT-04]

coverage:
  - id: D1
    description: "Every persisted pre-v1.19 Strategy Revision appears exactly once under a frozen source/artifact/language/provider inventory root."
    requirement: STRAT-03
    verification:
      - kind: unit
        ref: "scripts/revalidate-v1-37-strategy-revisions-v1-19.test.ts#frozen-pre-v1.19-Strategy-Revision-inventory"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=... pnpm exec tsx scripts/revalidate-v1-37-strategy-revisions-v1-19.ts --write --check"
        status: pass
    human_judgment: false
  - id: D2
    description: "An exact immutable TypeScript revision completes all six v1.19 observations in a real guest worker and receives its own deterministic receipt."
    requirement: STRAT-03
    verification:
      - kind: integration
        ref: "scripts/revalidate-v1-37-strategy-revisions-v1-19.test.ts#executes-all-six-v1.19-observations-in-a-real-guest-worker"
        status: pass
    human_judgment: false
  - id: D3
    description: "Copied, sibling, partial, provider-id-only, unsupported, mutable, player-violating, and system-failed claims cannot become counted candidate admission."
    requirement: STRAT-04
    verification:
      - kind: security
        ref: "Plan-20 and Plan-26 combined focused test suites"
        status: pass
    human_judgment: false
  - id: D4
    description: "The artifact remains inactive and excludes source, artifact payloads, memories, objectives, diagnostics, and host data."
    requirement: STRAT-04
    verification:
      - kind: security
        ref: ".planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 20: Frozen Strategy Revision Revalidation Summary

**All nine persisted pre-v1.19 Strategy Revisions now have one exact candidate disposition: none inherits compatibility, and every historical row remains non-counted because it is either mutable or lacks complete persisted provider ownership.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-17T08:13:00Z
- **Completed:** 2026-07-17T08:26:00Z
- **Tasks:** 2 plus one provider-proof hardening
- **Files modified:** 3

## Accomplishments

- Froze all nine persisted pre-v1.19 revisions under one deterministic inventory root covering revision, creation/lock state, prior ABI, source, artifact, language, provider, and candidate lane identity.
- Added the real TypeScript guest-worker path through Plan 26's six-probe runtime-service boundary and proved it emits a revision-specific deterministic receipt without current-selector fallback.
- Executed the actual database inventory under a serializable transaction. Three unlocked revisions received `REVISION_NOT_IMMUTABLE`; six locked historical revisions received `REVISION_IDENTITY_INVALID` because no exact persisted provider proof owns their source/artifact identity.
- Emitted a canonical artifact with nine unique records, zero inferred eligibility, exact candidate pins, `current: false`, `selectorActivated: false`, and a recursive private-output guard.

## Task Commits

1. **Task 1 RED: frozen inventory and real revalidation contract** — `8a8e0b5`
2. **Task 1 GREEN: exact six-probe inventory orchestration** — `4e1675f`
3. **Task 2: canonical nine-row disposition artifact** — `6b58489`
4. **Hardening: exact persisted provider proof** — `c49c126`

## Files Created

- `scripts/revalidate-v1-37-strategy-revisions-v1-19.ts` — Serializable inventory query, exact candidate pin loading, real guest execution, disposition logic, append-or-verify persistence, and canonical writer/checker.
- `scripts/revalidate-v1-37-strategy-revisions-v1-19.test.ts` — Inventory drift, real guest execution, explicit disposition, copied-receipt, and privacy coverage.
- `.planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json` — Exact frozen inventory result: 9 rows, 0 revalidated, 9 explicitly non-counted.

## Decisions Made

- "Existing" means every persisted pre-v1.19 revision, not only currently locked or previously counted rows. Mutable rows are frozen in the milestone inventory and explicitly excluded.
- A supported language does not supply provider ownership. The persisted provider proof must independently bind provider ID, contract, source hash/bytes, artifact hash/bytes, and proof before real candidate execution is admissible.
- The historical rows are evidence, not migration targets. Missing provider ownership is an honest non-counted result and cannot be repaired by editing immutable bytes, copying a sibling receipt, or applying language-level candidate evidence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Integrity] Database trigger rejected language-inferred provider ownership**
- **Found during:** Task 2 real database execution.
- **Issue:** The first runner version selected the TypeScript provider from language alone. Persistence correctly rejected the insert because historical locked rows do not carry matching `providerValidation.providerId`.
- **Fix:** Made provider ownership part of frozen identity and return an explicit `REVISION_IDENTITY_INVALID` disposition before execution when it is absent.
- **Verification:** Real `--write --check` covers all nine rows and persistence contains zero manufactured admissions.
- **Committed in:** `6b58489`.

**2. [Rule 2 - Missing critical integrity] Provider ID alone did not bind the provider proof to exact bytes**
- **Found during:** Post-artifact security review.
- **Issue:** A persisted provider ID could have admitted stale proof for different source or artifact bytes.
- **Fix:** Require nonempty contract/proof plus exact source hash/bytes and artifact hash/bytes before execution.
- **Verification:** Focused suites remain 35/35 and the actual frozen inventory is unchanged at nine explicit non-counted records.
- **Committed in:** `c49c126`.

**Total deviations:** 2 auto-fixed integrity gaps. **Impact:** Both remove evidence inference; no current selector, immutable revision, historical result, gameplay behavior, or public/private boundary changed.

## Surprises

- The committed database has nine pre-v1.19 revisions, not only the six locked examples. Three are still mutable and therefore cannot enter candidate compatibility at all.
- All six locked historical revisions have valid source artifacts but lack exact persisted provider ownership. The truthful D-04 result is consequently zero grandfathered revisions, not six inferred TypeScript successes.
- This is intentionally conservative but operationally realistic: new or explicitly reissued postactivation revisions must earn fresh v1.19 provider evidence before counted use.

## Verification

- Focused Plan-20 plus Plan-26 suites: 2 files, 35 tests passed serially.
- Real database writer/checker: `inventory=9`, `revalidated=0`, `nonCounted=9`, `current=false`.
- Check-only rerun passed without database mutation; append-only revalidation row count remains zero.
- Repository serialized typecheck: all 15 packages passed.
- ESLint, Prettier, `git diff --check`, canonical artifact equality, and private-output poison checks passed.
- Protected baseline remains `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## TDD Gate Compliance

- RED `8a8e0b5` failed because the inventory/revalidation runner did not exist.
- GREEN `4e1675f` proved exact inventory roots, real six-probe guest execution, explicit dispositions, copied-receipt rejection, and privacy.
- Database execution and the provider-proof hardening preserved the green contract and added exact persistence-level identity behavior.

## Next Phase Readiness

- Plan 260-21 can prove preactivation readiness with an exact zero-grandfathered-revision posture rather than assuming historical source tolerance.
- Plan 260-14 may activate v1.19 authority without silently promoting any existing revision; entrants must present exact postactivation admission evidence.
- Historical v1.4 revisions, Matches, Chronicles, and results remain unchanged and readable under their original semantics.

## Self-Check: PASSED

- All three planned files exist and all four Plan-20 commits are present.
- Focused, real-database, canonical-byte, typecheck, lint, format, privacy, current-selector, and protected-baseline gates pass.
- Plan-20 staged and committed only its own files; concurrent Plan-13 work and the two protected user files were not staged.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
