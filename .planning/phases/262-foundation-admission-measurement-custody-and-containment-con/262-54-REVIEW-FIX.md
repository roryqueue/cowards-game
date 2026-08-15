---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-15T01:25:00Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-54-CODE-REVIEW-V2.md
iteration: 2
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 262 Plan 54: Code Review Fix Report V2

**Fixed at:** 2026-08-15T01:25:00Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-54-CODE-REVIEW-V2.md`
**Iteration:** 2

**Summary:**

- Findings in scope: 5
- Fixed: 5
- Skipped: 0
- sourceBase7: `7c6e23f9e3c856198560093152df61f8ab614222`
- Final source-only A7: `dee17ae4f34c48da6ae053e6dafd6b8d1bc8690a`

## Fixed Issues

### CR-01: The clean-clone fixture fails from the repository's normal post-A7 state

**Files modified:** `scripts/evaluate-v1-38-successor-source-complete.test.ts`, `scripts/lib/v1-38-successor-source-seal.ts`
**Commits:** `c188b3ee`, `608d6a0e`, `dee17ae4`
**Applied fix:** The fixture resolves A7 only from the summary-recorded identity or an explicit immutable 40-hex input, detaches that exact commit, and verifies sourceBase7, the complete linear range, A7 tree, immediate parent, and all four blob OIDs/bytes. A synthetic planning-only descendant proves ambient `HEAD` is never reused as A7.

### CR-02: Plan-262-55 reviewer separation remains caller-asserted and unauthenticated

**Files modified:** `scripts/lib/v1-38-successor-source-seal.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commit:** `c188b3ee`
**Applied fix:** Removed the caller-selected reviewer string from the review document. Review custody now requires a direct-child, one-path commit, exact canonical blob, an author email in `plan-262-55.review.cowards.invalid`, one `Plan-262-55-Reviewer-Run` trailer, and Git author/run separation from every implementation commit. A self-asserted wrong-domain commit is rejected before authorization.

### CR-03: Three pre-observation failure terminals reject the drift they are supposed to record

**Files modified:** `scripts/lib/v1-38-successor-source-seal.ts`, `scripts/lib/v1-38-current-matrix-reproduction.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commits:** `c188b3ee`, `0ad3a040`, `7d781605`
**Applied fix:** Added exact `toolIdentity`, `protectedHistory`, and `formationAbsence` exception types. Each validates committed B7 bytes, self-roots, source/review custody, and every unaffected authorization/seal field while omitting only the named observation-dependent field and its exact derived joins. Terminal evidence validates the frozen route-start and embedded preflight charge, accepts injected observed roots only as observations, and rejects proof tampering.
**Status:** fixed; requires human verification of the narrowly scoped immutable-anchor state model.

### CR-04: Route-start freshness is not atomic across the seven destinations

**Files modified:** `scripts/lib/v1-38-current-matrix-reproduction.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commit:** `c188b3ee`
**Applied fix:** Route start exclusively acquires a pinned no-follow reservation directory, rechecks every destination while holding it, writes the canonical reservation claim, then publishes route start. Every later writer and terminal checker joins the exact reservation root. Racing/dangling paths fail before start, failed acquisition is cleaned up, and a competing start gets one winner and one fail-closed result without overwrite.
**Status:** fixed; requires human verification of the filesystem reservation assumptions.

### WR-01: The claimed full valid CLI/terminal reachability proof is still absent

**Files modified:** `scripts/evaluate-v1-38-successor-source-complete.test.ts`, `scripts/lib/v1-38-current-matrix-reproduction.ts`, `scripts/evaluate-v1-38-successor-route.test.ts`
**Commits:** `9929c987`, `7d781605`, `fb730c1f`, `1ad9529e`, `61174e24`, `4f25163b`, `dee17ae4`
**Applied fix:** The disposable Git proof invokes all ten registered direct commands with valid arguments and covers all eleven dispositions, terminal checks, collision/interruption paths, and no-retry consumption. Injected headroom, shard, and matrix dependencies carry counters; production RSS, child, provider, and canonical-workspace writers remain unreachable. The expanded paths also fixed route-7-specific adapter inventories, registry translation, v10 reproduction translation, and embedded preflight interruption lookup that direct calls had not reached.
**Status:** fixed; requires human verification of the complete CLI state matrix.

## Skipped Issues

None.

## Verification

- Serialized focused route/source/protocol suite with exact final A7: **PASS**, 3 files, 31 tests, 382.61 seconds.
- Exact-A7 clean clone plus planning-only descendant regression: **PASS**.
- Valid CLI calibration/reproduction proof with injected dependencies: **PASS**; selected full path completed in 289.43 seconds.
- Full four-pre-observation-branch run: all four fast tests passed and the long fixture completed its synchronous work in 1,286.13 seconds; the prior 900-second test timer fired afterward. The committed budget is now 1,500 seconds.
- Workspace typecheck: **PASS**, 27/27 tasks.
- `git diff --check`: **PASS**.
- Canonical authorization, seal, reservation, route-start, preflight, calibration, reproduction, consumption, obstruction, and terminal destinations: **absent**.

---

_Fixed: 2026-08-15T01:25:00Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 2_
