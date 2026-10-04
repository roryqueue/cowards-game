---
phase: 265-serious-current-rules-league-and-development-red-team
scope: unique entry-terminal-only verification for fresh prospective v5 route
verified: 2026-10-04T00:26:44Z
status: failed-terminal-verified
held_head: cdcfb8a3087bd212fb465e39d4ed775e05d22f9c
source_commit: 14765a978b528bf5ff61ac6a5567dfd8d3cd5aaa
source_root: sha256:e4879404e048c8c78830f43350697c153a265875498419f9ec4ff9f2d8697337
source_manifest_entries: 863
request_bytes_root: sha256:7c02bb9de301563f614fe8035f5127c78a71a93672bae8e691388d781c448c4f
allocation_root: sha256:0da37dd99cacfc659f6c34f72b223c5aa9618d00cb0be588c3a452b72b537f45
allocation_bytes_root: sha256:f263279e4e8366b7c90d0689bbde5faef032514a14fec7ce5597b2707ec7555a
entry_bytes_root: sha256:274ff16739d89d89550ece0c4d98252e0e15e11153230f9b7389a70f057a6e7b
failure_receipt_bytes_root: sha256:a42aba8742baeccb33ed26d550ac6339e022a8ad26b87d6608ea58e687b918e6
terminal_bytes_root: sha256:c61ebc66937fb865fe435ee12b1cf7e89382bf5e1d2108ee62039d9bb044d2a5
time_bytes_root: sha256:f074a85cc1172b6c4176c2d14548b7b5ee7e6e69c98f6f437316033ee3837bbe
ledger_bytes_root: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
---

# Phase 265-15: Pilot Entry Terminal Verification v5

**Scope:** One bounded metadata-only verification of the unique v5 entry terminal. This is not an ordinary retained-result verification and establishes no pilot result or phase completion.

## Terminal Identity and Closure

| Check | Evidence | Status |
|---|---|---|
| Held source and HEAD | Held `HEAD` is `cdcfb8a3087bd212fb465e39d4ed775e05d22f9c`; the reviewed source commit is `14765a978b528bf5ff61ac6a5567dfd8d3cd5aaa`. Recomputed 863-entry source manifest root is `sha256:e4879404e048c8c78830f43350697c153a265875498419f9ec4ff9f2d8697337`, matching the reviewed source and allocation/request binding. | VERIFIED |
| Request and allocation binding | V6 request raw bytes root is `sha256:7c02bb9de301563f614fe8035f5127c78a71a93672bae8e691388d781c448c4f`. V5 allocation root is `sha256:0da37dd99cacfc659f6c34f72b223c5aa9618d00cb0be588c3a452b72b537f45`; external canonical allocation and store allocation bytes both hash to `sha256:f263279e4e8366b7c90d0689bbde5faef032514a14fec7ce5597b2707ec7555a` and are byte-identical. Request, allocation, entry, and terminal all bind source root `sha256:e4879404…` and the held HEAD. | VERIFIED |
| Entry/request/terminal linkage | Entry raw bytes root is `sha256:274ff16739d89d89550ece0c4d98252e0e15e11153230f9b7389a70f057a6e7b`; it binds allocation root, exact request bytes root, source root, HEAD, parent PID `24037`, and child PID `24067`. Terminal raw bytes root is `sha256:c61ebc66937fb865fe435ee12b1cf7e89382bf5e1d2108ee62039d9bb044d2a5`; bounded `readLeanChildTerminal` accepted its schema, entry root, bindings, and elapsed bound against the closed time record. Both PIDs were absent from the process table at inspection. | VERIFIED |
| Failed terminal and receipt | Terminal status is `child_failed`, exit code `1`, signal `null`, elapsed upper bound `152,945 ms`, and physical snapshot `409,600` bytes. Failure receipt raw root is `sha256:a42aba8742baeccb33ed26d550ac6339e022a8ad26b87d6608ea58e687b918e6`; code is `FACTORY_ASSESSMENT_IMPORT_PROJECTION_LIMIT`, stage `unknown`. The unknown stage does not establish where in the route the error arose. | VERIFIED |
| Closed interval and charges | Time bytes root is `sha256:f074a85cc1172b6c4176c2d14548b7b5ee7e6e69c98f6f437316033ee3837bbe`. It contains exactly one `pilot-entry` start and close, is inactive, and reports cumulative `1,555,387 ms` (`1,402,442 + 152,945`). The ledger raw root is the SHA-256 empty root; bounded ledger reading reports zero events and zero charges. | VERIFIED |
| Store inventory and result absence | Store contains exactly `allocation.json`, `child-terminal.json`, `entry-failure.json`, `entry.json`, `ledger.ndjson`, and `time.ndjson`. No `result.json` exists. | VERIFIED |

## Disk and Resource Accounting

The bounded cumulative physical-byte measurement at inspection is `348,160` bytes. The terminal physical snapshot is `409,600` bytes, so the conservative value to carry forward is the maximum, `409,600` bytes. Historical disk and RSS peaks remain `unknown`; the terminal's observed parent RSS (`337,924,096` bytes) and child RSS (`595,337,216` bytes) are observations, not certified peaks. No reset, refund, charge, or result is inferred.

## Verification Limits

This check used only the six v5 store metadata files, the external request/canonical-allocation bytes, source manifest/HEAD, and bounded `openLeanLedger`, `readLeanChildEntry`, `readLeanChildTerminal`, `readLeanTimeAccounting`, and `readLeanLedger` helpers. It did **not** invoke `readLeanPilotResult`, `verifyLeanEvidence`, an ordinary retained-result reader, historical/full-48 importer, provider, native runtime, Strategy, or Match.

The finite failure code with unknown stage does not prove the original v3 failure cause. The terminal RSS and physical snapshots do not establish certified peaks. This closes only the unique v5 entry-terminal check; it is not pilot success, feasibility credit, LEAG, baseline/freeze, formation/holdout, public, counted, production, or Phase 265 completion credit. Consumed artifacts remain immutable.

---

_Verified: 2026-10-04T00:26:44Z_  
_Verifier: unique entry-terminal-only verification_
