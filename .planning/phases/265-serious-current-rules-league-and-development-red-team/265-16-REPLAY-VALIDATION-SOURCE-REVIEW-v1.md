---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: replay-validation-source-only
reviewed: 2026-10-05T23:50:02Z
depth: standard
status: clean
source_commit: 838d21fcd15c6a53ce280d406af546eb3a10a658
diff_base: e5545f7d
independently_reviewed: true
reviewer_agent: /root/review_265_startup_v5_fixed
raw_source_root: sha256:6372438dbf0fe8257cc9b6fd84cab89eb0878e31a7040079ccdddee3d4dff222
fixture_root: sha256:f4e10b8186f6103c4d5a4542d7d25529102fa88757b78681879ccf28fd8a5382
files_reviewed: 2
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-replay-validation-v5.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
execution_authorized: false
empirical_admission: false
phase_complete: false
---

# Plan 16 replay-validation source review

## Narrative Findings (AI reviewer)

No concrete BLOCKER or WARNING found in the exact two-file supplement. This is an independent source review, not approval of empirical execution or Phase 265 completion.

Read the supplement plan, plan check and source summary, then inspected the full changed fixture and production diff, tracing the unchanged canonical parser, transient guard, allocation admission, retained ledger admission and evidence construction.

## Source and boundary checks

- `lean-experiment.ts:892–909`: the validator retains the decoder's metadata checks, compressed and uncompressed byte/root checks, envelope-root check, 256,000,000-byte ceiling, exact gzip output-limit expression, failure ordering and pre-inflate 4× transient guard. It counts all byte-newline delimiters before parsing, rejects missing terminal newlines/count mismatches, and parses every frame with the existing require-canonical parser. Empty zero-frame input, empty/internal blank lines, escaped newlines, multibyte characters and malformed/truncated UTF-8 retain the decoder's replacement-and-re-encoding semantics. A byte newline cannot form part of a valid multibyte UTF-8 sequence, so the per-line decoding does not introduce a different cross-line decoding boundary.
- `lean-experiment.ts:1356–1376`: only the two exact supervisor v5 discriminants select validation-only behavior, after full passed-allocation admission. Retained allocation admission still precedes replay access. Selected samples, failed/unclean records, missing terminals/replays, canonical late-frame rejection, all records and evidence roots retain the previous logic. Other/default versions keep the decoder branch. No audit caller or cadence changed in the diff.
- The original decoder, cap/startup policy region and replay ceiling/reserve/guard region remain byte-identical; the dedicated fixture independently checks their pins. The validator does not build a full replay UTF-8 string, line collection or parsed-frame array. It still retains the synchronous full inflated buffer, plus the current frame's transient parser allocations; this is not streaming inflation or proof of sufficiently low real RSS.
- The new fixture is separately bound by its raw hash above. The unchanged manifest builders explicitly include `lean-experiment.ts`; their inherited executable closure excludes ordinary `.test.` files, and the unchanged v5 explicit test additions do not add this fixture. This source change naturally changes any newly computed runtime manifest identity; it does not reinterpret or repair a historical manifest.

## Independent synthetic check

Ran only:

```text
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1
```

Result: **70 passed, zero skipped, one test file, 2.37 seconds**, exit 0. The fixture uses trusted tiny synthetic gzip/frame values and owner-only synthetic temporary ledgers; its denied child-process/Worker hooks and restricted file-read checks passed. Mock restoration and temporary fixture cleanup also passed. Raw source and fixture hashes were independently recomputed and match the source summary. `git diff --check` for these two files passed.

The worker-reported package and dedicated strict type checks were not rerun in this review. Synthetic success demonstrates these exercised source contracts, not real replay capacity or an empirical Match outcome.

## Scope and cumulative limits

No real replay/Strategy/private history payload was opened. No ordinary reader, empirical helper, native helper, Strategy, Match, Docker or provider execution was invoked; no new allocation, source edit or commit was made. Unrelated worktree files were preserved.

The ended v5 envelope remains ended. Historical outcomes and custody remain immutable, with 24 carried charges. At the review observation above, the supplied conservative accounting expression is `33,812,347 + (1,791,244,202,000 − 1,791,242,322,180) = 35,692,167 ms`, leaving 7,507,833 ms of the same 43,200,000-ms ceiling at that instant only. Subsequent review time continues accruing; this is not a fresh balance. The same 15-GB/300-Match bounds and guest 1000 / absolute host 5000 / Match 600000 / startup 2500 / cancellation 100-ms policy remain unchanged. No execution authority, retry authority, capacity guarantee or baseline completion follows from this clean source review.
