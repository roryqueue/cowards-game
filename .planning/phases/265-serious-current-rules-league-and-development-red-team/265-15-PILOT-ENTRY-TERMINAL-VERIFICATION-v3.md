---
phase: 265-serious-current-rules-league-and-development-red-team
scope: unique entry-terminal-only verification for fresh prospective v3 route
verified: 2026-10-03T23:09:08Z
status: failed-terminal-verified
held_head: 4f728e055a18b011fa5382eaacbe881ea36c79ec
source_commit: 35f67b8d06cdad6098134c83d4e6dac8fe132353
source_root: sha256:0c88f6ba85d010617d9902edf872f3dd5bb53dedef9228df7881b5b1c6035080
allocation_root: sha256:46bf3f4b4ddd7fa3dbf4d1c44ba3bc8c7833c6c7afab9d62615b69c758818226
allocation_bytes_root: sha256:aadc20e1e1355b723f2771797969cba85445d4d8df47cd1da72616d012b13920
request_bytes_root: sha256:1ce6b4ce6197f0d276e2f299a6f3724300ab9ddc793984fe9cee413be5493014
entry_bytes_root: sha256:9164628789ef3faa4ea953091113884753d1f5129af01f79bd0c443d7b827127
terminal_bytes_root: sha256:0d63ac6c5710faa7fb1b1d61d4eaee695ad7d2acb1925e752cebbf3679f70c8b
---

# Phase 265-15: Pilot Entry Terminal Verification v3

**Scope:** One unique bounded verification of the closed fresh v3 entry terminal. This is not the ordinary retained empirical reader and does not establish a pilot result or phase completion.

## Terminal Identity and Closure

| Check | Evidence | Status |
|---|---|---|
| Held source and HEAD | `HEAD` is `4f728e055a18b011fa5382eaacbe881ea36c79ec`; allocation, request, entry, terminal and the source review all bind source root `sha256:0c88f6ba85d010617d9902edf872f3dd5bb53dedef9228df7881b5b1c6035080`. | VERIFIED |
| Disjoint v3 allocation and v4 request | Store schema is `lean-experiment-allocation-v3`; allocation root `sha256:46bf3f4b4ddd7fa3dbf4d1c44ba3bc8c7833c6c7afab9d62615b69c758818226`. Stored and canonical allocation bytes match at `sha256:aadc20e1e1355b723f2771797969cba85445d4d8df47cd1da72616d012b13920`. The v4 request bytes root is `sha256:1ce6b4ce6197f0d276e2f299a6f3724300ab9ddc793984fe9cee413be5493014`; request and allocation source roots agree. | VERIFIED |
| Entry/request/terminal linkage | Entry bytes root is `sha256:9164628789ef3faa4ea953091113884753d1f5129af01f79bd0c443d7b827127`; it binds the exact allocation, source, request and held HEAD. Entry PIDs are parent `13322`, child `13351`. The terminal repeats those bindings and PIDs, and its `entryBytesRoot` equals the exact entry bytes root. `readLeanChildTerminal` validated the terminal schema, derivation and time-close linkage. Both PIDs were absent from the process table at verification. | VERIFIED |
| Failed terminal | Root entry session `64011` closed exit `1` per the dispatch record. Terminal bytes root is `sha256:0d63ac6c5710faa7fb1b1d61d4eaee695ad7d2acb1925e752cebbf3679f70c8b`; status `child_failed`, exit code `1`, signal `null`, elapsed upper bound `39,446 ms`, terminal physical snapshot `212,992` bytes. | VERIFIED |
| Closed time and charges | The time journal contains exactly one `pilot-entry` start and one close; `readLeanTimeAccounting` reports inactive, closed elapsed `1,362,476 ms`. This equals the carried `1,323,030 ms` plus this entry's `39,446 ms`. The charge journal is empty (zero bytes, SHA-256 empty root), and bounded `readLeanLedger` reports zero events/charges. | VERIFIED |
| Result and store inventory | Store contains only `allocation.json`, `child-terminal.json`, `entry-failure.json`, `entry.json`, `ledger.ndjson`, and `time.ndjson`; no `result.json` exists. | VERIFIED |

## Resource Accounting

The v3 predecessor carries `1,323,030 ms`, zero prior charges, `historicalPeakDiskBytes: "unknown"`, and a conservative `114,688`-byte allocation debit. Current bounded surviving owned paths measure `36,864` bytes; cumulative surviving allocation accounting is therefore `151,552` bytes. The terminal's `212,992`-byte physical snapshot is larger by `61,440` bytes and remains the conservative observation for this entry. This comparison does not claim a historical peak measurement.

Unchanged caps remain 15,000,000,000 total bytes (12/2/1 GB partitions), 28,800,000 ms, 300 Matches, and the existing runtime limits. No budget reset or charge is recorded.

## Failure Receipt and Limits

The bounded `entry-failure.json` reports `UNKNOWN_INTERNAL_FAILURE` at stage `unknown`. This is a generic sanitized receipt, not proof of the original child exception or root cause. The failed terminal is authoritative; the cause remains undetermined from this check.

Verification used only bounded allocation, entry, terminal, time, charge-ledger and file metadata reads (`openLeanLedger`, `readLeanChildEntry`, `readLeanChildTerminal`, `readLeanTimeAccounting`, `readLeanLedger`, and cumulative owned-byte accounting). It did **not** invoke `verify-retained`, `verifyLeanEvidence`, or `readLeanPilotResultBody`; it performed no full-48 historical assessment, provider call, Match, preparation, or allocation. No result/head was fabricated.

This closes only the unique v3 entry-terminal check. It gives no pilot success, feasibility credit, LEAG/baseline/freeze/formation/holdout, public, counted, production, or Phase 265 completion authority. Consumed records remain immutable.

---

_Verified: 2026-10-03T23:09:08Z_
_Verifier: unique entry-terminal-only verification_
