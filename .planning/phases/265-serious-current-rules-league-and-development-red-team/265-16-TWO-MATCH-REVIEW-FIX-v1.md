---
phase: 265
fixed_at: 2026-10-10T22:52:09Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-TWO-MATCH-SOURCE-REVIEW-v1.md
iteration: 1
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
source_commit: 50cd6aa9724b22076342bc6756ae451db450a523
---

# Two-Match bounded source fix

## CR-01: charged exceptional closure

**Status:** fixed: requires human verification. Independent review/ROOT validation/source verification still govern admission; this is not an empirical pass.

**Files:** `scripts/run-v1-38-lean-private-matches.ts`, `scripts/run-v1-38-lean-private-matches.test.ts` only. One atomic source commit `50cd6aa9`, from `df77629e`. The other five source owners, legacy routes, gameplay defaults, authority APIs, historical journals, STATE and approval limits are unchanged. This note remains uncommitted for ROOT.

Charged source/composer/projection/producer/reader/terminal-observation refusals stop the lane and retain `lean-private-match-failure-v1`: `system_failure`, finite code `CHARGED_ATTEMPT_STOP`, outcome null, `boardEvidenceAvailable=false`, `fullChronicleVerified=false`, rowCount zero. Unknown cleanup is null, never fabricated success. Missing execution/accounting/semantic provenance is `observed=null`; available actual compact commitments and issued identities are retained. Accounting descriptors are verified when available; unavailable/unqualified/oversized descriptors are explicitly null while their actual opaque accounting commitment remains, not a reconstructed accounting proof. No exception text/private payload is copied.

Any retained stream has an incremental O_RDONLY raw-byte hash/length anchor; it is a partial/raw commitment, never a complete board chain or finalBoardRoot claim. No missing stream is invented. The reader binds the terminal/result anchors to the durable pair/debit/ledger, authenticates available identities/accounting, verifies actual prefix bytes and absence, and preserves normal stream validation unchanged.

Failure resources are explicitly `lean-private-match-finalization-v1`, containing the prior debit-resource commitment and a current bounded observation. They are not a capacity/admission grant or proof of unknown historical memory peaks. Closure checks retain the approved cap/deadline/reserve, memory/scratch/retained/total limits and reserved finite write capacity, with zero further Match reservation, separately from the exhausted 600000ms success guard. Physical inability to persist or violation of the closure budget remains a hard error, not forged availability. No retry/second debit follows a charged failure or uncertain close.

Aggregate `lean-private-match-result-v1` adds finite `stopCode`: null, `ADMISSION_STOP`, `CHARGED_ATTEMPT_STOP`, or `CLEANUP_STOP`. Attempted ordinals and cumulative charges derive from actual durable ledger debits, including an append followed by authority post-write refusal; no handle/seat authority is fabricated. A slot-two capacity refusal keeps terminal zero and a one-debit aggregate readable. An admission stop before a debit can retain a zero-debit result. A stop never establishes feasibility; only two successful terminals with null stopCode can do so.

## Focused verification

Final installed command: `./node_modules/.bin/vitest run scripts/run-v1-38-lean-private-matches.test.ts scripts/lib/v1-38-lean-baseline-match.test.ts scripts/run-v1-38-lean-private-probe.test.ts --maxWorkers=1 --no-file-parallelism`: exit0, 3 files/34 tests passed. Inert temporary fixtures cover composer rejection after debit, partial producer checkpoint refusal, producer transition-cap refusal, terminal-resource observer refusal, and second-capacity refusal after terminal zero. They assert one actual debit/no additional composer dispatch, readable terminal/result anchors, privacy sentinel exclusion, nullable cleanup/provenance, preserved actual commitments and rejection of changed partial bytes. Tier1 affected source/tests re-read and `git diff --check` passed.

One earlier four-file run also included the unchanged authority tests: 43 passed/3 failed (46 total), all three failures were ENOENT for ignored historical probe carry directories absent from the isolated worktree. No private carry was copied/linked/read to repair those fixtures; the final narrow run excludes that unrelated environment-dependent suite. This is disclosed, not a waived authority gate. Initial dependency-only import failure in the isolated worktree was repaired by linking installed package dependencies, without installation or source change.

The exact seven-path strict command from the source handoff was executed against the unchanged main baseline and final isolated source: both exit2, identical 13 inherited diagnostic identities and locations, zero final owned diagnostics:

- assessor `(307,98) TS2379`;
- league-response-runtime `(222,255),(223,184) TS2379`;
- baseline-match.test `(103,48),(103,69),(103,90),(103,111),(104,54) TS18047`;
- run-lean-baseline `(186,60),(306,54) TS2379`;
- run-lean-experiment `(42,38) TS2379`;
- run-serious-league `(300,91) TS2345`, `(333,297) TS2379`.

No actual metadata CLI, preparation, allocation, entry, provider/Strategy/Match execution or empirical retained reader was run. No full suite, historical payload scan, semantic Chronicle reconstruction or genuine positive composer/provider execution is claimed. Full Chronicle, historical resource peaks, empirical feasibility and all LEAG/freeze/formation/public/counting/production gates remain unknown/pending. Source commands are closed and ownership released to ROOT after transactional fast-forward/worktree cleanup; distinct re-review and remaining gates must precede any allocation/entry.
