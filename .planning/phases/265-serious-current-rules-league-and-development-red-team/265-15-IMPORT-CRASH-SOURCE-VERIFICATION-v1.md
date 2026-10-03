---
phase: 265-serious-current-rules-league-and-development-red-team
scope: Plan 265-15 SOURCE-REPAIR subgoal only
source_anchor: 1f90bbcc3e1bbc2062f9eccd3b2f4aa76dd12e9a
docs_anchor: cdeee476633f1316449dbc2a0b0643d175fa6d85
verified: 2026-10-03
disposition: source-repair-partial
empirical_admission: not-established
---

# Plan 265-15 source-repair verification (narrow)

This is not verification of all Phase 265 or an empirical route. I inspected the source at the requested fixed source anchor and the focused repair/review/validation records at the docs anchor. No tests, scans, private historical readers, preparation, allocation, provider, Match, or retained verifier were run. The worktree already contained unrelated untracked files; they were left untouched.

## Source-repair truths

| Truth | Status | Evidence |
| --- | --- | --- |
| Both candidate closures reuse one genuine authenticated assessment per selected root, with exact candidate/root binding; ordinary legacy imports retain their existing default path. | VERIFIED (source-only) | `scripts/run-v1-38-serious-league.ts`: lean branch invokes the complete historical verifier once per assessment root and closes over the result with repository/root equality checks; prospective path still checks assessment, threshold and implementation roots. The validation record reports genuine two-candidate fixture root equality and 3 legacy verifier calls versus 1 lean call. |
| Import names, indexed artifacts, supervision streams and projected records have bounded precharge paths. | WARNING | Lean inventory is incrementally capped before sorting/body parsing; indexed factory artifacts use `readFactoryArtifact`, whose shared `boundedRead` checks file type/size before opening and caps the read buffer at `CAP + 1`; bounded supervision and projection ceilings are present. However, `readRetainedFactoryLedger` still does `lstatSync(path)` followed by `readFileSync(path)` (in `scripts/assess-v1-38-factory-independence.ts`). The size check is not bound to the opened file, so concurrent growth/replacement can invalidate the claimed per-record allocation cap. The clean v4 review and focused tests do not establish race-bounded ledger reads. |
| A child crash is accounted by a trusted parent-observed terminal and conservative elapsed upper bound, not child `finally` or fabricated success. | VERIFIED (source-only) | `scripts/run-v1-38-lean-experiment.ts` binds entry to source/request/allocation/HEAD and parent/child PIDs, enforces the handshake and parent-observation guard, and checks joint resource/time limits; `packages/strategy-lab/src/league/lean-experiment.ts` validates terminal identity and closes the interval using `elapsedUpperBoundMs`. Crash/torn/missing witness remains fail-closed. |
| Failed v1 and runtime/gameplay/privacy/public boundaries remain unchanged. | VERIFIED (scoped source review) | The repair adds lean-only bounded entrypoints and v2 accounting. Existing ordinary import default remains separate; the review and validation records report no change to strategy/runtime/gameplay or public evidence boundaries and preserve the immutable failed-v1 route. No full phase boundary audit was repeated here. |
| Source evidence establishes historical capacity/admission or empirical results. | FAILED (not in scope / not claimed) | All cited positive checks are synthetic or source-only. They do not open the historical 48-cell store, produce a measured peak RSS, or constitute same-process admission, a pilot, retained verification, LEAG/freeze credit, or Phase 265 certification. |

## Evidence and limits

- Focused final validation v2 records 45 distinct focused passing tests, type/shell checks, and three zero-violation boundary scans. It explicitly does not claim broad legacy suites: older stress/pipeline suites were not rerun or were partial/interrupted. These are recorded results, not tests rerun for this verification.
- Independent source review v4 is clean at `60148fd5`; requested anchor `1f90bbcc` is a later accounting-test-only change. The tested synthetic v2 ledger witnesses remain separate from historical admission, which is still denied.
- The former launch's disk high-water remains unknown. The proposed historical disk-accounting decision is pending and unapplied; the four-file 12,288-byte surviving allocation is a present lower bound, not historical peak evidence. No measured peak-memory value is asserted.

## Escalation gate

Source repair is substantially present, but the retained-ledger `lstat`/`readFileSync` gap above means the bounded-file acceptance claim is not fully demonstrated against concurrent file growth. Resolve with a bounded descriptor read (or explicitly establish an immutable-input precondition and enforce it) plus a focused regression, then obtain a narrow source re-review. Separately, a human must decide whether to approve the proposed treatment of the unknown historical disk peak or keep admission closed; that decision cannot be inferred from this source review.

**Disposition:** partial source-repair credit only. The pending historical disk decision and empirical/human admission boundary remain open. No measured peak-memory claim, pilot result, or phase certification.
