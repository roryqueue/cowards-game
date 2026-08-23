---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-23T21:39:37Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - scripts/check-v1-38-dependency-revision-boundaries.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/lib/v1-38-source-completeness-review-v3.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 262 Plan 262-60: Code Review V6

**Reviewed:** 2026-08-23T21:39:37Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The V5 correction closes the exact attack reported in V5: commits between a discovered prior tip and the next layer base are now first-parent validated, restricted to the two planning carrier paths, and checked for identical Git tree entries across the union of the six protected source paths. The real repository resolves the documented V3, V4, and V5 layers, both one-commit docs-only gaps, and matching protected blobs. The source/non-planning gap attacks reject and the positive planning-carrier fixture accepts.

The prior layers are still not immutable identities, however. They are rediscovered solely from copyable author-run trailer text and allowed aggregate paths. An attacker can extend an authentic prior run with a new malicious commit carrying the old trailer; production then treats the forged commit as the authenticated prior tip, and the new gap checks preserve rather than reject its modified source. This was reproduced through the full V3-to-V4-to-V5 chain.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Copying a prior run trailer forges an “immutable” correction layer

**Classification:** BLOCKER
**File:** `scripts/lib/v1-38-successor-source-seal.ts:5849-5879`
**Issue:** `inspectPriorLayer()` discovers every prior layer by `git log --first-parent ... --grep=<authorRun>`, then authenticates only single-parent continuity, a copyable trailer string, and an allowed aggregate path set. It does not bind the V3 or V4 layer to its already-known commit sequence, tree, parent/base, or per-path blob identities. Consequently, an additional commit appended to an authentic prior run is accepted if it copies that run's trailer and touches an allowed path. `inspectGap()` begins at this forged tip, so its endpoint blob equality merely preserves the attacker-modified source into the next layer.

The full attack succeeded in a disposable clone:

1. Start at authentic V3 tip `32eef5c147dc34b1a75c936ed7a0148f8e5d748e`.
2. Append malicious code to V3-only `scripts/lib/v1-38-current-matrix-reproduction.ts` and commit it with trailer `codex-plan-262-60-a9-review-fix-v3`.
3. Add the exact two-path docs carrier, cherry-pick exact V4 source commit `c5a08bd5`, add another exact docs carrier, and cherry-pick exact V5 source commit `5bf78391`.
4. Call production `inspectV138SourceA9Custody()` with the resulting V5 base/tip.

Production returned `accepted: true`, reported the forged V3 commit `d844a47e...` as `priorCorrectionLayers[0].sourceA9`, reported the cherry-picked V4 commit `1f4cf37a...` as the V4 tip, and retained the malicious current-matrix diff. The analyzer shares this production result at `scripts/check-v1-38-dependency-revision-boundaries.ts:1414-1437`, so production/analyzer agreement does not supply independent identity authentication. The existing alternate-lineage test starts an orphan history without recreating valid prior layers and therefore does not exercise this attack.

**Fix:** Authenticate prior layers from an immutable committed manifest, not from trailer discovery alone. For each already-completed V3 and V4 layer, bind at minimum:

- exact ordered commit OIDs;
- exact base, tip, parent(s), and tree OIDs;
- exact changed-path inventory per commit;
- exact final mode/blob OID/SHA-256/byte length for every protected path;
- exact carrier commit/tree and allowed carrier paths between layers.

The current V5 identity may continue to come from detached review input because the current source cannot predict its own commit, but all predecessor identities are known when V5 is authored and can be pinned directly or supplied by a separately authenticated immutable manifest. Reject any additional commit matching an old run trailer. Add the full attack above as a regression fixture and require both production custody and analyzer custody to reject it.

## Prior Finding Disposition

- **V5 CR-01 — partially closed:** unauthorized commits in the inter-layer gaps now reject, including protected source and unrelated non-planning paths. CR-01 above remains because an attacker can relabel the mutation as an extension of the prior layer before the validated gap begins.
- **V4 WR-01 — closed:** helper signal cleanup retains unrelated host listeners, unregisters only owned hooks, is idempotent, and leaves no new temp directory.
- **V3 CR-01/02/03/04 and WR-01 — closed:** shared correction identity, real disposable B9 execution, provider-seam mismatch, deletion ancestry, and ordinary helper lifecycle remain covered by the passing regression suite.
- Earlier V1/V2 findings remain covered by the corrected production paths. CR-01 is a new predecessor-identity authentication gap, not a regression in those fixes.

## Verification Evidence

- Full serialized focused suite: 2 files and 34 tests passed in 188.40 seconds.
- The suite's source-gap and non-planning-gap attacks rejected; its exact planning-carrier positive fixture accepted.
- Direct real-repository custody resolved V3 commits `136aa20b,6972f62d,5dc66c4d,32eef5c1`, V4 commit `c5a08bd5`, V5 commit `5bf78391`, and docs carriers `7ce7e1e9` and `bff3a3ca` over the expected path inventories.
- Independent forged-run reproduction accepted the malicious extra V3-trailer commit through the complete V4/V5 chain, confirming CR-01.
- `pnpm exec tsc --noEmit --pretty false` — passed.
- `pnpm typecheck` — 27/27 Turbo tasks passed.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check` — passed with `findingCount: 0`, `matrixAdmissionStatus: blocked`, and `downstreamAuthority: denied` on the real repository.
- Pre/post `v138-openat-*` inventories were identical.
- Canonical review/report, authorization/seal, route-start, preflight, calibration, reproduction, and terminal destinations remained absent.
- No source or canonical/live-state file was modified. Only this V6 report was added; pre-existing untracked review reports were preserved.

---

_Reviewed: 2026-08-23T21:39:37Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
