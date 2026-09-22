---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
task: "2-lean-amendment"
reviewed: 2026-09-22T11:39:55Z
depth: standard
review_scope: incremental-seven-file-lean-amendment
diff_base: 184b0cb2
reviewed_head: 916711a6dacee3214860f8165da60a7b407109cf
source_commit: 3db4347b
approval_commit: 06cdb050
files_reviewed: 7
files_reviewed_list:
  - packages/strategy-lab/src/factory/fingerprint.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - packages/strategy-lab/src/league/allocation.ts
  - scripts/lib/v1-38-league-authoring.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/run-v1-38-serious-league.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
empirical_authority: false
---

# Phase 265: Incremental Lean Amendment Code Review

## Narrative Findings (AI reviewer)

### Summary

Three correctness blockers remain in the prospective path: an import-order crash, a refreshable once-only run marker, and a missing host-capacity check before response-Match issuance. Fix these before the remaining source gate and conditional Task 3. This report is separate from, and does not replace, the completed 47-file review or any existing `265-REVIEW.md` history.

Review followed the seven files in full, with narrow dependent-call inspection of historical import, repository reservation, supervision, runtime creation, and retained verification. The approved private single-operator representative capacity contract—not external custody or a worst-case benchmark—was the review standard. Actual measured preflight witnesses remain future technical preparation, not an empirical result supplied by this review.

### Critical Issues

### CR-01: Eager prospective-policy initialization crashes direct red-team imports

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/allocation.ts:109`

**Issue:** The new module-level `LEAGUE_PROBES.map(...)` reads a binding before initialization when the module graph is entered through `league/red-team.ts`. The existing dependency cycle is `red-team → league/contracts → factory/supervision-artifacts → factory/admission → factory/fingerprint → allocation → red-team`. Previously the allocation module only called the imported red-team function after initialization; the new eager policy constant makes the cycle fail during import. Thus even read-only use of the existing red-team API can crash, independently of allocation validity or empirical work. The league CLI's import order happens to succeed, so its `--help` smoke check does not cover this regression.

**Evidence:** Both the ordinary `tsx -e` import and this fresh native-ESM process exited 1 at `allocation.ts:109` with `ReferenceError: Cannot access 'LEAGUE_PROBES' before initialization`:

```sh
node --import tsx --input-type=module -e 'import { LEAGUE_PROBES } from "./packages/strategy-lab/src/league/red-team.ts"; console.log(LEAGUE_PROBES.length)'
```

**Fix:** Move the shared probe constants into a dependency-free module imported by both allocation and red-team, or otherwise remove eager reads across this cycle without changing the policy values. Add fresh-process import tests for both entry orders; a test runner's already-initialized module graph is insufficient.

### CR-02: Refreshing the capacity receipt creates a new reservation for an already-consumed allocation

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:451-458`

**Classification:** BLOCKER

**Issue:** The prospective `runMarker` includes `capacityReceiptRoot`, and the durable exclusive filename is the hash of that entire marker. Refreshing the five-minute receipt therefore changes the exclusive reservation filename even though `allocation.root` is unchanged. If the process crashes after `reserveRun`, or a host-capacity stop occurs before the first cell journal, the directory contains an allocation marker and possibly run-start/failure graph artifacts but no cell starts. The pre-run check at line 545 examines only `reopenLeagueEvidence(...).records.length`; the repository reader deliberately ignores `league-artifact-*.bin` when deriving those records (`league/repository.ts:156-157`). A later invocation with a fresh receipt passes that check and creates a different marker, reusing the consumed allocation and orphaning its prior run history. This contradicts the adjacent once-only/crash/no-refund invariant; no artifact deletion or malicious operator is required.

**Evidence:** A source-only, in-memory check used the existing injected allocation/capacity fixtures and the actual `runMarker` function. Changing only the receipt measurement/expiry times produced `sameAllocation: true`, `differentReceipts: true`, and `differentRunMarkers: true`. No allocation or receipt artifact was written and no run was attempted. The crash-window acceptance follows from the reservation and repository-reader branches above.

**Fix:** Key the exclusive reservation by the immutable allocation alone. Retain the receipt root as authenticated reservation/run-start content, but do not let it change the once-only key. Reject an existing or partial reservation for that allocation regardless of receipt refresh. Add a source-only regression that interrupts immediately after reservation (before any cell journal), refreshes the receipt, and proves the second call rejects without another marker or provider issuance. Keep legacy V1 marker bytes unchanged.

### CR-03: Response Matches start containers before the new live-capacity guard

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-league-response-runtime.ts:163-184`

**Classification:** BLOCKER

**Related file:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:51-60,75-82,547-552`

**Issue:** The newly added host-capacity guard runs for `*.started.json`, ordinary `LeagueConnectedSession.execute`, and `beforeInvocation`. Response Matches instead append a `response-match-start` graph node at line 166, whose files are ordinary `.bin` artifacts, then call `createFactorySupervisedRuntime` for both sides at lines 181/193. No host-capacity check occurs between authoring or the previous response Match and those charges/issuances. The next guard is only in the wrapper's first invocation at line 184. Provider creation is already effectful: it calls `createPlannerSupervisedRuntime`, whose `createLeanContainerMatchSession` performs Docker create/start/exec during construction (`v1-38-lean-container-match-session.ts:224-231`). If available memory or disk falls below the approved floor during an authoring job or between response Matches, this path still charges a Match and launches two containers before rejecting. The prior factory-attempt check does not cover the later per-Match dispatches, potentially hours later.

**Fix:** Expose the live capacity check through the response retention/dispatch interface and call it before incrementing `matchCount`, publishing each response-Match start, or creating either provider. Retain the invocation-time check as an additional safeguard. Add an injected regression that makes capacity insufficient after authoring and between response Matches, and asserts zero additional Match starts and provider creations while preserving the already-charged producer's failure evidence. Apply the same pre-charge rule to the coordinator's red-team starts so an already-known capacity failure does not create another producing-attempt charge.

### Verification and boundaries

- Focused source-only command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/run-v1-38-serious-league.test.ts -t 'approved prospective three-base admission|prospective CLI source-only gates'` — **2 suites passed; 12 tests passed, 38 skipped; 24.34 seconds**. Imported test modules affect the count; this is not 12 new tests.
- CLI `--help` passed. Fresh direct red-team imports failed as documented in CR-01. The allocation-first import succeeded, confirming the import-order dependency.
- The isolated marker comparison used injected values only and wrote no artifacts. CR-03 was established by tracing the actual dispatch-to-container-creation call chain, not by launching a runtime.
- `git diff --check` for the seven-file range passed. HEAD remained `916711a6dacee3214860f8165da60a7b407109cf`; no source files were edited and no commit was created.
- No structural pre-pass was supplied. The prior 47-file review was not repeated. The complete 29-suite gate remains with the main agent.
- No empirical allocation, actual preflight, provider/model/Match execution, holdout, formation, public/counting, or production action was performed. Source-only injected test fixtures are not empirical evidence. Phase 265 and Task 3 remain incomplete.

_Reviewer: independent gsd-code-reviewer; standard incremental review with cross-file admission/dispatch analysis._
