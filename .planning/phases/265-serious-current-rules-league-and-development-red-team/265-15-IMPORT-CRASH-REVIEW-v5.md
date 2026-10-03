---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T20:06:16Z
depth: deep
source_commit: 748d7869a50d1311db1aa2d3edbb86f667ae0553
reviewer_agent: /root/review_265_15_import_crash
files_reviewed: 4
files_reviewed_list:
  - packages/strategy-lab/src/factory/repository.ts
  - packages/strategy-lab/src/factory/repository.test.ts
  - packages/strategy-lab/src/factory/ledger.ts
  - scripts/assess-v1-38-factory-independence.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Plan 265-15 retained-attempt source re-review, v5

## Narrative Findings (AI reviewer)

No BLOCKER or WARNING remains in the narrowly reviewed `748d7869` change. The prior [source-verification finding](265-15-IMPORT-CRASH-SOURCE-VERIFICATION-v1.md) identified `readRetainedFactoryLedger`'s `lstat` followed by uncapped `readFileSync` as a race in the claimed bounded attempt-record path. That callsite now uses the shared descriptor reader for both starts and terminals. The reader checks the named and opened regular-file sizes before allocating, reads at most `CAP + 1` bytes, detects short reads or growth, and closes its descriptor in `finally`. The start helper also binds the parsed root to its filename; the terminal helper validates schema/root and the exact start-terminal linkage. See `packages/strategy-lab/src/factory/repository.ts:17-38,85-101` and `scripts/assess-v1-38-factory-independence.ts:69-80`.

The lean inventory still caps names and requires 48 start/terminal pairs before ledger reopening. Its assessor call uses those names and the new bounded attempt readers; the ordinary call retains its original no-`leanNames` path. For stable valid retained files, both paths parse the same canonical bytes, preserve sorted start-root order and the ledger-root calculation, and reject missing/mismatched terminals. `resumeFactoryAttemptInventory` also uses the same bounded helpers without changing its valid-root derivation. See `scripts/assess-v1-38-factory-independence.ts:48-80,125`; `packages/strategy-lab/src/factory/repository.ts:101-114`.

The added inert repository tests target start and terminal growth after opening and oversize denial before decoding. I inspected their injection and assertions but did not run them. No full source rescan, private historical reader, preparation, provider, container, Match, model, or empirical entry was performed. This clean result closes only the named retained-attempt source gap; it is not a measured peak-memory proof, a capacity receipt, pilot admission, or Phase 265 pass. Historical disk accounting remains pending and v2 allocation remains separately fail-closed.
