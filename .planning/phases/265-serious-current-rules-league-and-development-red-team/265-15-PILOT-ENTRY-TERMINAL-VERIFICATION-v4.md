---
phase: 265-serious-current-rules-league-and-development-red-team
scope: unique entry-terminal-only verification for fresh prospective v4 route
verified: 2026-10-03T23:59:14Z
status: failed-terminal-verified
held_head: 1fe30e56a8a708905fd2f1cb5dc95b71f3acc1c8
source_commit: 0a77df62ca06196275db4316a5615888103034bc
source_root: sha256:9ac5823e745dd907b4ea3540e8892ca39f6026010b28f9932af36099db9827ff
allocation_root: sha256:ec9cc8bbd0648042c2a94120c74fb4fda2744fa509c59f1836a5dc45f8ff6ce7
allocation_bytes_root: sha256:9accf6e1cd147911f060c7d2cb85ec9783e65346195084c2e0197cc03d66a61d
request_bytes_root: sha256:159c74ded8312a154d6ba085349fe889268e7fc9e3e4be5a1f72dedfac2c5182
entry_bytes_root: sha256:a777cb3119ff2201ffdc3bb92381da2443098c1207cf56e0d30fd426644702ac
failure_receipt_bytes_root: sha256:a42aba8742baeccb33ed26d550ac6339e022a8ad26b87d6608ea58e687b918e6
terminal_bytes_root: sha256:0714c37b1a6bb8658d4eed9a22f802932d4cae145bccd69a567b0e814e7ef76b
time_bytes_root: sha256:f4dc79aaa7df0627236c3f2bcc95cbfb3bcd71358184d4a3db8ea5fe4a97a4ef
request_review_bytes_root: sha256:63849b15002d627b1486f7e30901a3f7ef7cafe92568cb6f2624b13ef33c99eb
predecessor_terminal_report_bytes_root: sha256:72d24058b46cf579b6962f4f8ac2bc4c091d9988638be94d5e97290175ff28df
---

# Phase 265-15: Pilot Entry Terminal Verification v4

**Scope:** One unique bounded verification of the fresh v4 entry terminal. This is not an ordinary retained-result verification and establishes no pilot result or phase completion.

## Terminal Identity and Closure

| Check | Evidence | Status |
|---|---|---|
| Held source and HEAD | `HEAD` is `1fe30e56a8a708905fd2f1cb5dc95b71f3acc1c8`. Source root is `sha256:9ac5823e745dd907b4ea3540e8892ca39f6026010b28f9932af36099db9827ff` (863-entry reviewed manifest). I confirmed the reviewed source files did not change between source-review commit `0a77df62ca06196275db4316a5615888103034bc` and the held HEAD. | VERIFIED |
| Request and allocation binding | The v5 request raw root is `sha256:159c74ded8312a154d6ba085349fe889268e7fc9e3e4be5a1f72dedfac2c5182`; its source root matches the v4 allocation. The allocation root is `sha256:ec9cc8bbd0648042c2a94120c74fb4fda2744fa509c59f1836a5dc45f8ff6ce7`; store and canonical allocation bytes match at `sha256:9accf6e1cd147911f060c7d2cb85ec9783e65346195084c2e0197cc03d66a61d`. Request v4 data-only review is PASS, bound to raw request root above and source root above. | VERIFIED |
| Entry/request/terminal linkage | Entry bytes root `sha256:a777cb3119ff2201ffdc3bb92381da2443098c1207cf56e0d30fd426644702ac` binds the allocation, source, exact request, held HEAD and parent/child PIDs `19433`/`19465`. Terminal bytes root `sha256:0714c37b1a6bb8658d4eed9a22f802932d4cae145bccd69a567b0e814e7ef76b` repeats those bindings and references the exact entry bytes root. `readLeanChildTerminal` accepted the schema and derived elapsed bound against the entry and closed time record. Both PIDs were absent from the process table. | VERIFIED |
| Failed terminal | Root entry session `28831` closed exit `1` per the dispatch record. Terminal status is `child_failed`, exit code `1`, signal `null`, elapsed upper bound `39,966 ms`, physical snapshot `311,296` bytes. | VERIFIED |
| Bounded failure receipt | Receipt bytes root is `sha256:a42aba8742baeccb33ed26d550ac6339e022a8ad26b87d6608ea58e687b918e6`; code `FACTORY_ASSESSMENT_IMPORT_PROJECTION_LIMIT`, stage `unknown`. It is an allowlisted diagnostic only; the unknown stage does not establish where in the route the error arose. | VERIFIED |
| Closed interval and charges | Time bytes root `sha256:f4dc79aaa7df0627236c3f2bcc95cbfb3bcd71358184d4a3db8ea5fe4a97a4ef` has exactly one `pilot-entry` start and close; accounting is inactive at `1,402,442 ms`, exactly `1,362,476 + 39,966`. The ledger is empty (zero bytes, SHA-256 empty root), and bounded ledger reading reports zero events and zero charges. | VERIFIED |
| Store inventory and result absence | Store contains exactly `allocation.json`, `child-terminal.json`, `entry-failure.json`, `entry.json`, `ledger.ndjson`, and `time.ndjson`; no `result.json` exists. | VERIFIED |

## Disk and Resource Accounting

The v4 allocation revalidated its predecessor chain, including the prior v3 terminal-verification report bytes `sha256:72d24058b46cf579b6962f4f8ac2bc4c091d9988638be94d5e97290175ff28df`. Prior measured survivors are `90,112` bytes; the conservative prior allocation debit is `212,992` bytes, with historical peak disk/RSS still `unknown`. The current v4 route owns `36,864` allocated bytes. Measured survivors across the chain are therefore `126,976` bytes; the current cumulative accounting floor is `249,856` bytes (`212,992 + 36,864`). The terminal snapshot, `311,296` bytes, exceeds that floor by `61,440` bytes and is the conservative value to carry forward. This is not a historical-peak measurement.

Terminal fields record parent RSS `469,897,216` bytes and child RSS observed `597,983,232` bytes. These are recorded observations, not a certified RSS peak. The unchanged limits remain 15 GB total (12/2/1 GB partitions), 28,800,000 ms, 300 Matches, and existing guest/host/Match/runtime/privacy/gameplay bounds.

## Verification Limits

This verifier used bounded allocation, request, entry, failure receipt, terminal, time and empty-ledger metadata plus exact source/HEAD checks. It did **not** invoke `readLeanPilotResult`, `verifyLeanEvidence`, an ordinary retained reader, candidate import, a full-48 assessment, provider, native runtime or Match. No result or head was fabricated.

The current bounded receipt does not prove the original v3 failure cause, and the RSS observations do not establish a certified peak. This closes only the unique v4 entry-terminal check; there is no pilot success, feasibility credit, LEAG, baseline/freeze, formation/holdout, public, counted, production or Phase 265 completion credit. Consumed artifacts remain immutable.

---

_Verified: 2026-10-03T23:59:14Z_
_Verifier: unique entry-terminal-only verification_
