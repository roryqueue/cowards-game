---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
fixed_at: 2026-10-08T20:52:15Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-PREPARATION-CONTINUATION-SOURCE-REVIEW-v1.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
source_only: true
admits_execution: false
source_commit: 1baed2ee
source_root: sha256:880d55e93a4ba5ed417f39720457edabb8d2af9116d203066a478113be84a4ae
---

# Plan16 preparation continuation review fixes

CR-01 and WR-01 are implemented; independent fresh SOURCE-REVIEW-v2 remains the next source gate, not fabricated here. Findings-bearing v1 is preserved. No private artifact/helper/request, allocation, entry, empirical verifier, Strategy/provider/Match, push, STATE/root record or phase credit was produced.

## Fixed issues

### CR-01: Final publication capacity

**Status:** fixed: requires human verification (resource/state logic).
**Commits:** RED `600aa066`; GREEN `948e1e53`.
**Files:** `scripts/lib/v1-38-lean-correction-retained.ts`, `scripts/run-v1-38-lean-correction.ts`, `packages/strategy-lab/src/league/lean-experiment.ts`, `scripts/run-v1-38-lean-preparation-continuation-v13.test.ts`.

Actual final publisher now refuses the reviewer's11999995904B near-cap case before carry/hold writes. Every new terminal start/close/report/carry/hold/refusal publication has independent current full no-refund inventory, block-rounded projection,65536B terminal headroom, scratch/total and continuous wall/reserve checks before and after writes. Carry+hold are projected together before either writes; actual ledger is supplied when present. Ordinary v13 report/FINAL also retain these resource checks through the shared publisher; old/default behavior remains untouched. Saved completed-hold authentication rechecks resources and rejects refusal/tampering. No exhausted-budget refusal may bypass the guard.

The fresh exact source-review pointer is `265-16-PREPARATION-CONTINUATION-SOURCE-REVIEW-v2.md`. Both v1/v2 are excluded from functional source; the sole new package allowlist entry adds v2's physical debit while preserving v1. No cap increase, refunds, exclusions or old custody/pin/reader change. Same165600000ms cap/full108000000ms plus all wall since1791455941097,2026-10-09T02:39:01.097Z deadline,1860000ms reserve,34charges,15GB/12GB retained/300,2GB scratch/768MiB, guest1000/host5000/startup2500/Match600000 remain.

### WR-01: Actual v13 lifecycle composition

**Status:** fixed.
**Commit:** `1baed2ee`.
**File:** `scripts/run-v1-38-lean-preparation-continuation-v13.test.ts`.

Extended the existing trusted-declaration HOST map, not production injection. Actual new terminal owner and ordinary wrapper/full retained audit execute their real publishers and saved authenticators. Covers no-ledger refusal, allocated zero-charge refusal, entered/result-absent terminal, accepted diagnostic/own FINAL/carry followed by conditional36 join,0600 exclusive writes, duplicate identity, saved semantic join tampering, publication failure and projected/final disk/time plus scratch exhaustion. Synthetic host effects/inherited full-audit fixture only; no old reader or actual private bytes.

## Exact focused evidence

All processes below actually CLOSED; no active child remains. No full suite or heavy historical scan.

- RED: `node /Users/roryquinlan/runtime/cowards-game/node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-preparation-continuation-v13.test.ts -t CR-01 --maxWorkers=1`;14251 CLOSED1, actual pre-fix publisher returned normally and expected refusal failed.
- Final GREEN: `node /Users/roryquinlan/runtime/cowards-game/node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-preparation-continuation-v13.test.ts scripts/run-v1-38-lean-preparation-provenance-v12.test.ts --maxWorkers=1`;4497 CLOSED0,48/48,114.15s. Earlier same-scope96611 CLOSED0,48/48.
- Configured package script equivalent: `node /Users/roryquinlan/runtime/cowards-game/node_modules/typescript/bin/tsc -b packages/strategy-lab`;48184 and final64fbeb CLOSED0.
- `git diff --check` and `sh -n scripts/run-v1-38-lean-correction.sh`: CLOSED0.
- Strict: `node /Users/roryquinlan/runtime/cowards-game/node_modules/typescript/bin/tsc --ignoreConfig --types node --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck scripts/run-v1-38-lean-correction.ts scripts/lib/v1-38-lean-correction-retained.ts scripts/lib/v1-38-lean-preparation-continuation-v13.ts scripts/run-v1-38-lean-preparation-continuation-v13.test.ts`;60704 CLOSED2, only six inherited diagnostics at feasibility-protocol.ts52 and planner/missions.ts52,60,66,68,69. **Not strictPASS.**
- Initial worktree `pnpm exec` refused dependency validation before running tests (no install/change). Direct installed binaries and temporary ignored dependency links avoided dependency mutation.

## Fresh manifest recipe and handoff

Public-only23695 CLOSED0:930 entries, root shown in frontmatter, zero private entries and zero own downstream source-review entries; both review versions remain on the physical allowlist. Recompute from the held tree with `node node_modules/tsx/dist/cli.mjs -e 'import {leanCorrectionSourceManifest} from "./scripts/run-v1-38-lean-correction.ts"; import {LEAN_PREPARATION_CONTINUATION_V13_EXTENSION} from "./packages/strategy-lab/src/league/lean-experiment.ts"; const s=leanCorrectionSourceManifest("v13-1",LEAN_PREPARATION_CONTINUATION_V13_EXTENSION); console.log(JSON.stringify({root:s.root,entries:s.entries.length}));'`.

Independent v2 review must bind this exact new source root/commit and its own real frontmatter. Data/helper review, committed allocation, SAME-PROCESS capacity/unique entry and one appropriate actual verifier remain later gates. Initiating old cause remains UNKNOWN. GSD code-review fix guidance shaped per-finding commits and focused verification; no broader assurance claim.

**ACTUALLY CLOSED.** Fixer owns no active child; all source/test changes committed. Isolated worktree transaction fast-forwards main, removes only this worktree/temp branch and then its distinct recovery sentinel. Older recovery sentinels/worktrees/untracked blank artifacts are preserved. This report is intentionally uncommitted for ROOT's documentation commit.

