---
phase: 265
fixed_at: 2026-10-07T23:06:00Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-TWO-PAIR-REVIEW-v1.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
source_head: e025739ac25e67a7be8a0b67327ac4deaa40dc67
source_root: sha256:f4340180cc94daa4d85764d6be11e5eaf416e9a6098009bee21f1cf9a36e6ee1
source_entries: 910
empirical_admission: false
---

# Phase 265: Two-pair v11 Code Review Fix Report

**Source review:** `265-16-TWO-PAIR-REVIEW-v1.md`  
**Iteration:** 1  
**Summary:** Four BLOCKER findings fixed in four atomic commits; none skipped. All are logic/state fixes requiring independent verification. This report is intentionally not committed by the fixer.

## Fixed Issues

### CR-01: Preserve every inherited physical debit without deletion or shrink refunds

**Status:** fixed: independent source re-review required  
**Commit:** `6e5ebf3c`  
**Files modified:** `scripts/run-v1-38-lean-correction.ts`, `scripts/run-v1-38-lean-correction.test.ts`, `scripts/lib/v1-38-lean-correction-retained.ts`.

The v11 inventory now carries both authenticated prior rows and their cumulative debit. Every inherited identity remains required; deletion or shrink rejects instead of reducing the charge. Only positive growth and genuinely new bytes add to the prior debit. The implementation is used for the first predecessor, terminal carry, diagnostic-to-baseline carry, and pair-two predecessor; closed outcomes retain the actual charged rows, not merely paths. The maximum inherited cumulative debit and reporting reserve remain charged.

Focused filesystem regressions cover shrink, deletion, new growth, inherited reserve, and deletion after a newly observed row has become consumed. RED initially failed on the absent no-refund helper; GREEN passed after implementation.

### CR-02: Authenticate the actual finite admission/refusal lifecycle

**Status:** fixed: independent source re-review required  
**Commit:** `f269f027`  
**Files modified:** `scripts/run-v1-38-lean-correction.ts`, `scripts/lib/v1-38-lean-correction-retained.ts`, `scripts/lib/v1-38-lean-correction-retained.test.ts`.

Authentication reconstructs the full exact request and joins the finite actual admission start/close records, authentic predecessor, failure witness or entry/terminal/run custody, reader interval, ledger/time accounting, and report. Partial requests and rooted fabricated reports are not authority. Counts, elapsed time, failure roots, result absence, and null/actual entry identities are rederived rather than trusted from the report. One complete accepted closure audit is reused within each consumer invocation; there is no cross-consumer cache.

Admission-failure authentication accepts only the original pre-verifier time prefix plus the exact appended terminal-reader start/close interval. It does not require the pre-verifier saved hash to equal the later whole stream and does not allow an unrelated suffix or rewritten prefix.

The previous fabricated four-field fixture is explicitly rejected. A complete inert lifecycle fixture exercises real newly written metadata, actual admission helper records, report/carry publication, and no-entry/entered-no-result branches. Re-rooted count, predecessor, clock, failure-root, identity, and missing custody records reject. RED against the pre-fix owned source demonstrated that the old fabricated carry was accepted; GREEN rejects it.

### CR-03: Validate the complete predecessor before schedule filtering

**Status:** fixed: independent source re-review required  
**Commit:** `78645d38`  
**Files modified:** `packages/strategy-lab/src/league/lean-experiment.ts`, `scripts/run-v1-38-lean-correction.test.ts`.

A complete v11 predecessor validator runs before deriving the legacy schedule view. It enforces exact keys/root, natural safe-integer counts and bytes, approved elapsed/debit ranges, unknown historical peaks/history root, complete inherited rows, canonical allowed identities, uniqueness, safe bounded sums, and report-inclusive sums no greater than debit. Report rows cannot escape validation merely because the scheduling view later filters them.

Constructor and re-rooted JSON round-trip admission regressions reject malformed counts/bytes, duplicate rows, extra keys, noncanonical paths, and report-inclusive sum overflow. RED with only the validation hook bypassed demonstrated malformed acceptance; GREEN passed after restoring enforcement.

### CR-04: Hold source, HEAD, request, and entry through final publication

**Status:** fixed: independent source re-review required  
**Commit:** `e025739a`  
**Files modified:** `scripts/lib/v1-38-lean-correction-retained.ts`, `scripts/lib/v1-38-lean-correction-retained.test.ts`.

The terminal-only verifier holds the functional source root, fixed Git HEAD, exact request bytes, and actual entry bytes/null identity throughout substantive reads, audit, reader close, report publication, carry publication, and postpublication checks. Successful completion emits a finite completed-hold seal joining source/HEAD/request/entry to report and carry bytes/roots. Missing completion or a postpublication refusal marker cannot authenticate a carry. Later historical authentication validates those immutable completed joins without incorrectly demanding that a future checkout keep the historical HEAD forever.

Controlled mutation regressions cover source, HEAD, request, entry, post-report, post-carry, and post-seal drift, plus genuine clean no-entry and entered/no-result success. The RED fixture lacked the final enforcement seam; GREEN verifies rejection at each controlled boundary. This is not a claim that a pre-fix real source-drift empirical run was performed.

## Verification

All expensive gates ran against a fixed source snapshot. No source edits occurred during the final test runs.

- Final focused v11 gate: **17 passed**, four files passed; 116 tests excluded by the name filter. Duration 41.55 seconds.
- Final full affected five-file regression: **128 passed / 4 failed / 9 skipped** (141 tests), four files passed and one failed. Duration 104.34 seconds.
- Full retained-only regression after restoring the native directory-reader seam: **47 passed / 9 skipped**.
- Strategy-lab TypeScript project build: passed.
- Shell syntax for `scripts/run-v1-38-lean-correction.sh`: passed.
- Factory-boundary scan: passed, zero violations, 1,415 scanned files.
- Diff whitespace checks and per-finding source rereads: passed.
- Strict transitive script type check: exit 2 with only six known inherited errors, in `feasibility-protocol.ts:52` and `planner/missions.ts:52,60,66,68,69`. It is not reported as a passing gate.

The four full-regression failures are older lean-experiment tests requiring absent private stores in the isolated checkout: the two v6 charge/routing tests require `.strategy-lab/lean-experiment-20261003-v6`; the older parent-witness/crash tests require `.strategy-lab/lean-experiment-20261003`. No old private history was fabricated or copied to make these pass, and no unrelated stage-eleven full suite was repeated.

The inert complete-lifecycle fixture injects the authenticated historical-predecessor authority and functional-source observer seams. New lifecycle files, actual admission metadata, canonical byte reads, and its small Git HEAD are real isolated fixtures. This is source/regression evidence, not a live old-store accepted closure audit or empirical admission.

## Scope and Remaining Gates

Only five existing source/test files changed across the four commits. Consumed old v10 constants and artifacts, unrelated old recovery markers/locks, ordinary historical-reader behavior, private payloads, provider/runtime behavior, allocations, and gameplay remain untouched. No helper, Match, provider request, actual empirical admission, live verifier, or old ordinary-reader replay was performed.

The continuous clock remains rooted at **2026-10-07T21:43:30.738Z** (`1791409410738`), with the old **93,600,000 ms** debit plus all elapsed time since that instant, the **108,000,000 ms** cap, and expiry **2026-10-08T01:43:30.738Z**. Source, test, and administrative work consume that same clock; there is no reset or refund. The **15 GB**, **300 Match**, **32 historical charge**, **1,860,000-byte reserve**, and route/runtime bounds remain unchanged.

Independent fixed-source re-review and verification are still required before any fresh empirical/helper/data gates. This report grants no Phase completion, league credit, or old-store custody certification.

---

_Fixer: gsd-code-fixer_  
_Iteration: 1_
