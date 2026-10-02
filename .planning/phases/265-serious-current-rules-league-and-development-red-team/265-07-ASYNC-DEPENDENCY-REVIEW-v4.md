---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
reviewed: 2026-10-02T07:45:01Z
depth: standard
iteration: 3
files_reviewed: 6
files_reviewed_list:
  - packages/strategy-lab/src/league/repository.ts
  - packages/strategy-lab/src/league/repository.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
base_commit: 195aff3ad74e37fc76b5a4b237e7b5a74504df33
source_commit: 634b0e84896132a1a9ac5d855763b0793abfe1bc
checkout_head: 634b0e84896132a1a9ac5d855763b0793abfe1bc
six_file_diff_sha256: c74c69f95ad0c7c89146907ef6808e6a8ca3b82e4dcb34d1f170e43577f9d105
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Plan 265-07 asynchronous dependency repair: exact-source rereview v4

## Summary

No remaining BLOCKER or WARNING found in the bounded six-file source review. CR-04 is corrected by conservative original-error rejection after an incomplete inner response failure-publication sequence. CR-01 through CR-03 remain corrected. This closes the supplemental source-review findings only; the root-owned unchanged full source gate remains separate and unperformed by this reviewer.

The prior full six-file source/test analysis is carried forward after independently measuring all current raw hashes. The repository and response-runtime source/test pairs are unchanged from v3. The complete final runner/test fix diff against `9387f3591bb65086b03a5a5a31d8a3e72212829e` was inspected (12 insertions/6 deletions), together with its affected control flow and assertions. New review-fix-v3 was read; AGENTS/current STATE, checked repair contract, execution and preserved v1/v2/v3 reviews remain the existing review context. The GSD review skill was read. No structural pre-pass was supplied.

## Narrative Findings (AI reviewer)

No new actionable finding. This is a scoped `clean` verdict, not a statement that all phase requirements or empirical behavior are established.

### CR-04 disposition and final boundary trace

The `failureEvidenceFault` latch is initialized locally for each `runSeriousLeague` call at line 708. Both development and independent response secondary failure/terminal catches set it (lines 745 and 793), then rethrow their initiating error. The outer catch awaits the existing graph settlement gate before checking the latch (lines 814-815). A latched call throws that same initiating object before per-start terminalization or `run-failure` publication/return. Thus no failure head can be returned based on a ledger advanced by an incomplete inner terminal write. No new publication retry, queued dispatch, capacity call, overwrite, refund or free-form secondary diagnostic is introduced; already retained prefix and failed residue remain inspection evidence.

With no inner secondary fault, the prior normal failure-publication sequence remains intact. It returns `process_invalid` only after its final graph append succeeds; a secondary fault in the outer sequence still rethrows the initiating object at line 823. Earlier owned-provider cleanup/settlement and graph/wrapper failure dispatch stops are untouched.

The bounded actual-public-runner test changes now require identical initiating-error rejection for all six development/independent response-fault cases, no attempted or credited `run-failure`, exactly one retained charged start and no forged terminal. Existing assertions retain real sibling-fsync settlement, no early close/publication, two owned close attempts, one guest call, no usable invocation and conservative charges. The uninterrupted ordinary failure-head case adds empty start/terminal coverage and exact reconstructed empty-ledger/head binding. Synthetic prerequisite matrix/probe fixtures remain explicitly inert; these assertions do not claim whole-history verification. Tests were inspected, not executed here.

### Prior dispositions carried forward

- CR-01: preparation and eligible synchronous invocation fallback failures latch graph-wide dispatch; concurrent pending refusal remains outside that catch and cannot poison the legitimate owner.
- CR-02: ordinary/response cleanup attempts all owned closes after settlement, defers no-primary cleanup faults until all closes, and guards secondary evidence/journal faults without replacing a primary error.
- CR-03: both response-job catches and outer failure retention preserve the initiating error; successful durable failure-result behavior remains intact.

The unchanged publisher/wrapper analysis retains owned two-input snapshots, ordered precharges, bounded dependency fsync overlap, all-settlement fd cleanup and deterministic first-error handoff, no-overwrite/no-follow publication, conservative residue/accounting, dependency-directory barrier before serial descriptor/final barrier, awaited invocation roots and WeakMap issuance, optional response capability/getter forwarding, whole-wrapper race guard and synchronous pending close refusal. No gameplay, resource, lifetime, capacity cadence, provider ownership or authority change appears in the final fix.

## Independently measured exact source identity

| File | Raw SHA-256 |
| --- | --- |
| `packages/strategy-lab/src/league/repository.ts` | `4ee61ed57a07d2d42e58a0e080c731deb8aae3ccdc8f72dcde1d53a54ea44599` |
| `packages/strategy-lab/src/league/repository.test.ts` | `a96cb2025f8e7e26b42d63a85a1796efec8fefe3eb667e8fe9784923a33d0b4b` |
| `scripts/run-v1-38-serious-league.ts` | `5d0d11b438aa8b0109d285a35f7b9cba0a499a1f3eb430c189895d58d297f6ec` |
| `scripts/run-v1-38-serious-league.test.ts` | `2268f4292b6206380290245ea272db6ffa87994cb238f52319987ad9bf2b559d` |
| `scripts/lib/v1-38-league-response-runtime.ts` | `ad75540ffe6853728b69acff058948537ddda564018a540abec1fc2290944c92` |
| `scripts/lib/v1-38-league-response-runtime.test.ts` | `57bb57d6bd9315ae305684bda5b0736584c76274220d4d97a63218047a39fcfa` |

The six-file diff hash is measured from raw `git diff 195aff3a HEAD --` with paths in frontmatter order. Cumulative diff: 713 insertions/66 deletions. Tracked checkout is clean at the stated HEAD. Previous reports and unrelated work were preserved.

## Evidence and authority limits

Review-fix-v3 reports genuine four-case RED, nine-case GREEN (39.98s) and strict named-two-file types; these are author proof, not reviewer-rerun evidence. Reviewer actions were source/git/filesystem reads and creation of only this new report. No source edit, test/import/typecheck/build, profiler, retained verifier, capacity measurement, actual provider/Strategy/Match/model/Docker execution, commit or push occurred. No full-gate pass, speedup, LEAG completion, freeze/formation/holdout eligibility, new human literal, revived closed-route authority or production certificate is claimed. Root may proceed with its existing exact-source gate workflow; this review does not create new execution authority.

_Reviewer: gsd-code-reviewer; standard scoped source rereview; reviewed 2026-10-02T07:45:01Z._
