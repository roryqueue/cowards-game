# Phase 8 — UI Review

**Audited:** 2026-05-18
**Baseline:** focused re-review of prior remaining FLAG: replay visual assertion strength and `maxDiffPixelRatio`
**Screenshots:** no standalone CLI screenshots captured because no dev server answered on `localhost:3000`, `localhost:5173`, or `localhost:8080`; current Playwright mobile snapshots were inspected

---

## Result

**PASS**

The prior remaining FLAG is cleared. The visual regression gate now has a focused `maxDiffPixelRatio` of `0.02`, validates darker ink pixels on both canvas halves, passes the full visual suite, and uses regenerated mobile snapshots that frame the full board/callouts at `340 x 341`.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Not re-reviewed in this focused pass; prior non-blocking raw enum copy findings remain outside this flag. |
| 2. Visuals | 4/4 | Prior visual assertion gap is resolved by full-size mobile baselines and stricter per-half canvas checks. |
| 3. Color | 3/4 | Not re-reviewed in this focused pass; prior non-blocking palette duplication findings remain outside this flag. |
| 4. Typography | 2/4 | Not re-reviewed in this focused pass; prior typography findings remain outside this flag. |
| 5. Spacing | 3/4 | Focused evidence confirms mobile replay board snapshots now hold the full `340 x 341` target. |
| 6. Experience Design | 4/4 | Visual gate now catches blank, clipped, and low-ink half-render states before screenshot comparison. |

**Focused Result: PASS**

---

## Top 3 Priority Fixes

No priority fixes remain for the focused visual assertion/max-diff flag.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

- **WARNING:** Not re-reviewed by request. Earlier copywriting concerns were unrelated to the prior remaining visual assertion FLAG.

### Pillar 2: Visuals (4/4)

- **PASS:** `apps/web/e2e/replay.visual.spec.ts:14-17` now sets `maxDiffPixelRatio: 0.02`, replacing the previously loose `0.06` threshold called out in the prior review.
- **PASS:** `apps/web/e2e/replay.visual.spec.ts:204-231` now parses the canvas PNG and requires both halves to contain nonblank pixels and darker ink pixels. This closes the prior weakness where off-white board/background pixels could satisfy a coarse nonblank-only check.
- **PASS:** All 7 mobile replay visual snapshots are `340 x 341`, including board scale, push positions, contraction bounds, and all callout scenarios:
  - `apps/web/e2e/replay.visual.spec.ts-snapshots/replay-board-compound-tour-scale-mobile.png`
  - `apps/web/e2e/replay.visual.spec.ts-snapshots/replay-board-contraction-bounds-mobile.png`
  - `apps/web/e2e/replay.visual.spec.ts-snapshots/replay-board-endgame-callout-mobile.png`
  - `apps/web/e2e/replay.visual.spec.ts-snapshots/replay-board-legal-backstab-callout-mobile.png`
  - `apps/web/e2e/replay.visual.spec.ts-snapshots/replay-board-push-callout-mobile.png`
  - `apps/web/e2e/replay.visual.spec.ts-snapshots/replay-board-push-soldier-positions-mobile.png`
  - `apps/web/e2e/replay.visual.spec.ts-snapshots/replay-board-runtime-failure-callout-mobile.png`

### Pillar 3: Color (3/4)

- **WARNING:** Not re-reviewed by request. Earlier color concerns were unrelated to the prior remaining visual assertion FLAG.

### Pillar 4: Typography (2/4)

- **WARNING:** Not re-reviewed by request. Earlier typography concerns were unrelated to the prior remaining visual assertion FLAG.

### Pillar 5: Spacing (3/4)

- **PASS:** The regenerated mobile snapshot dimensions confirm the prior oversized/clipped mobile board state is no longer present in the checked baselines.

### Pillar 6: Experience Design (4/4)

- **PASS:** `pnpm e2e:visual --reporter=list` passed `14/14` tests in this re-review run.
- **PASS:** The occupancy helper is invoked before screenshot comparison for the initial board render and every selected event path at `apps/web/e2e/replay.visual.spec.ts:292` and `apps/web/e2e/replay.visual.spec.ts:302`, with `selectEvent` covering the remaining screenshot cases.
- **PASS:** Screenshot comparison still covers desktop and mobile boards/callouts through `toHaveScreenshot(..., screenshotOptions)` at `apps/web/e2e/replay.visual.spec.ts:303-306`, `314-317`, `325-328`, and `337-340`.

---

## Registry Safety

Skipped: `components.json` is not present, so shadcn registry audit does not apply.

---

## Files Audited

- `AGENTS.md`
- `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-UI-REVIEW.md`
- `apps/web/e2e/replay.visual.spec.ts`
- `apps/web/e2e/replay.visual.spec.ts-snapshots/`
