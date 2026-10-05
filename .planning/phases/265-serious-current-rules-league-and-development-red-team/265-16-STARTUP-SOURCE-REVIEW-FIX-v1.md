---
phase: 265
fixed_at: 2026-10-05T22:35:30Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-STARTUP-SOURCE-REVIEW-v1.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
scope: source_only
execution_authorized: false
empirical_credit: false
phase_complete: false
---

# Phase 265: Startup source review fix report

Three findings addressed in three atomic commits. Report remains uncommitted for the orchestrator. Independent source re-review remains required; this is not empirical admission or phase credit.

## Fixed issues

### CR-01: Actual-loader undefined supervisor helper

**Status:** fixed
**Commit:** f5f1fc2d
**Files modified:** `scripts/lib/v1-38-lean-container-match-session.ts`, `scripts/run-v1-38-lean-startup-v5.test.ts`
**Applied fix:** Replaced loader-transformed function serialization with explicit checked-in closure-free trusted JavaScript. The exported fake-host supervisor compiles exactly this fixed trusted control string; the broker embeds the identical string. No guest or generated broker is evaluated by the inert loader check, and no helper stripping/rewrite was added. Legacy builder initializer/harness hashes remain pinned unchanged.
**Regression:** Actual `node --import tsx` import/build test failed RED with helper present, then passed GREEN. Existing fake-host startup/guest/receipt/termination branches exercise the same control source.

### CR-02: Effective close timestamp custody mismatch

**Status:** fixed: requires human verification
**Commit:** 2041a988
**Files modified:** `packages/strategy-lab/src/league/lean-experiment.ts`, `scripts/run-v1-38-lean-correction.ts`, `scripts/lib/v1-38-lean-correction-retained.ts`, `scripts/run-v1-38-lean-startup-v5.test.ts`
**Applied fix:** V5 admission closure now records raw wall/monotonic observations separately from exact effective `ledgerCloseMs`, published after ledger closure. Retained gap authentication keeps raw elapsed authentication and exact effective journal joins. Reader-close starts at the returned effective verifier close; historical gap import uses exact authenticated endpoints and charges its publication work through the real closing interval. V5 wall rollback with forward monotonic time retains a conservative debit. Terminal publication closes at its authenticated monotonic observation rather than silently resampling a later clock; subsequent work belongs to admission finalization. Old receipt schemas and old clock behavior stay unchanged.
**Regression:** Three effective-close fixtures failed RED on raw reader-close starts, then passed GREEN: wall1000/+1ns closes1001; monotonic1ms ahead; wall rollback/forward monotonic. Complete synthetic diagnostic authentication succeeds after rounded closure and rollback. A separate terminal-publication fixture proves same-wall/+1ns exact terminal/ledger join despite a later monotonic sample. Identity checks were not removed or relaxed; consumed journals were not rewritten.

### WR-01: Missing positive filesystem authorization composition

**Status:** fixed
**Commit:** 33c0243b
**File modified:** `scripts/run-v1-38-lean-startup-v5.test.ts`
**Applied fix:** Added one exact synthetic private filesystem request/carrier/setup/source-review/data-review/hash-graph fixture reaching the real request reader and complete accepted diagnostic authentication. Native execution remains deny-by-default, with only registered fake OS/identity surfaces. Historical cold reuse authentication is replaced by an exact synthetic grant; no old payload is opened.
**Regression:** Positive exact read and accepted-check authentication pass. Authorization root, request-data root, policy, source/review root, cap, HEAD, terminal allocation, charge ordinal and effective verifier close mutations refuse individually; restoring exact bytes passes. This was a coverage warning, not a separate demonstrated production fault.

## Exact final checks

- `node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-startup-v5.test.ts --maxWorkers=1`: 36/36 passed, final start18:34:50 America/New_York;27.25s.
- `node node_modules/typescript/bin/tsc --noEmit --project packages/strategy-lab/tsconfig.json --pretty false`: passed.
- Script-inclusive type closure using `/tmp/lean-startup-fix-types-v5.json`: exit2, exactly nine inherited diagnostics, zero new production/fixture diagnostics. Inherited locations: factory-independence307; league-response-runtime222/223; child-cli-terminal86; baseline123/238; experiment41; serious-league300/333. This is not a global type pass.
- `bash -n scripts/run-v1-38-lean-correction.sh scripts/run-v1-38-lean-baseline.sh`: passed.
- `git diff --check`: passed.
- Modified sections reread; generated JavaScript parse/legacy-pin checks are part of the focused suite.
- Worktree dependency/build-output links reused the existing installation. `pnpm exec` initially attempted automatic installation and refused its non-TTY purge before installing; checks used the identical installed Vitest/TypeScript executables directly. No install was performed. Installed GSD CLI uses direct `commit`, not `query commit`.

## Exact execution-loader source closure

Inert `node --import tsx` imports/build-only after final source fixes,888entries:

- sourceRoot: `sha256:55f49cc0a3dfd9a6664e07df21632fb049d03611d01a9b350645d9e0b2efa31d`
- harnessRoot: `sha256:ce33dc1d4eaba6eed31362f533a4dcc2e2b6091f16b5c34efae085af1e7188f2`
- brokerRoot: `sha256:60e65349ce3095943d5fc65b6e90ae40e126a4c359365c98342275ae78bceb0e`
- undefined transpiler helper present: false

Roots are source identities only, not authorization.

## Boundaries and custody

Startup2500/guest1000/host5000/Match600000 remain unchanged; exact admitted v5 alone selects43200000ms. Global old28800000ms,15GB/300charges, prior23charges and surviving-file debits remain unchanged. All active fix/test/report/administration time carries from26634447ms before1791235144280; no budget reset, old credit or refund.

No native Worker/child transport/provider/Docker/Strategy/Match, real preparation/allocation/capacity, empirical reader, historical private-payload scan, public/counting/production change, formation or holdout opening occurred. The only real subprocess fixture performs a known trusted inert tsx source import/string build. Synthetic filesystem destinations are temporary and removed by fixture cleanup.

Remaining gaps: no native lifecycle/performance/startup-sufficiency proof, no actual diagnostic or36baseline, no independent re-review, and no global type pass. Original v4 cause remains UNKNOWN.

Isolation base:65de957e2109d501d10c148bf11fce84eb3039ac; worktree `/tmp/sv-265-reviewfix-RkYfAI`, branch `gsd-reviewfix/265-10418`. Transactional cleanup fast-forwards only unchanged main, transfers this uncommitted report, removes only this disposable worktree/temp branch, then drops only its recovery sentinel. Unrelated untracked reservations/sentinels are preserved.

---

_Fixer: gsd-code-fixer; iteration1; source-only, no empirical/phase credit._
