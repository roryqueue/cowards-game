---
phase: 265-serious-current-rules-league-and-development-red-team
scope: consumed pilot entry and parent-observed child terminal only
verified: 2026-10-03
status: terminal-closed-child-failed
held_head: 8961bf9b485e16cdd7ac49f44f98be0daa88e534
source_root: sha256:28dbd0ec7de8954d53ffa67ff3b4db34b0a6c6f0ec02b501950f1ef7c8d58695
allocation_root: sha256:4a3dfb516d13c6c0816185af30e0d9b6b516752091ac525639bcf91474c4d846
---

# Plan 265-15 pilot entry terminal verification (v2)

Terminal-only, read-only verification. The ordinary empirical result verifier, retained-evidence verifier, result fabrication, journal mutation, and any new preparation or execution were not used. No private Strategy/source/memory/IO or child error details are included.

## Binding and terminal evidence

| Check | Result |
| --- | --- |
| Current HEAD / held HEAD | Match: `8961bf9b485e16cdd7ac49f44f98be0daa88e534`; relevant source files have no working-tree changes. |
| Recomputed source manifest / allocation / entry / terminal | Source root `sha256:28dbd0ec7de8954d53ffa67ff3b4db34b0a6c6f0ec02b501950f1ef7c8d58695` matches the allocation, entry and terminal. Allocation root `sha256:4a3dfb516d13c6c0816185af30e0d9b6b516752091ac525639bcf91474c4d846`; canonical allocation raw digest `bc7789b14530c4f585ce006bbe8576c57421621fed3f0e74b0172febcf3ec1fb`. Request raw digest `3c2abfd6d3171efaedd5fa9fe72b006bcb76dcd98a91156c31c066ee43a9cd3d`. |
| Entry to parent/child terminal binding | Validated by read-only `openLeanLedger` + `readLeanChildTerminal`: entry raw digest `sha256:842c1ce65d419ee92a1e0bb9d3be5f6250616dbdb29f55e84495481bdf8ea438`; terminal raw digest `sha256:74fc7885311158e587a101fc06b7cae4b52dae6597740c150cdfaa8637c9510a`; both bind parent PID 86485, child PID 86519, allocation/source/HEAD, and the terminal's entry-byte root matches. |
| Parent-observed terminal | Closed, `status: child_failed`, `exitCode: null`, `signal: SIGTERM`; `elapsedUpperBoundMs: 757571`. The reason the child failed is **unknown**. No specific throw/block cause is established. |
| Time carry-forward | Prior `565459 ms` plus this terminal upper bound `757571 ms` = `1323030 ms`, below the unchanged `28800000 ms` cap. `readLeanChildTerminal` accepted the persisted start/close accounting and bound. |
| Charges / result / process state | `ledger.ndjson` is 0 bytes with the empty-file SHA-256; no charges. The exact store listing has no `result.json`; no result/head was manufactured. A read-only `ps` check found no live process for PIDs 79864, 86485, or 86519. |
| Physical accounting | Terminal snapshot records `114688` physical bytes and `209068257280` free bytes. Read-only current measurement: store `20480` allocated bytes; current cumulative accounting `53248` bytes. These are current/snapshot values, not historical peak disk or RSS claims. |

## Disposition

The entry is terminally closed as a child failure; it is not a successful pilot and has no result to verify. The held source/HEAD for this consumed route can be released: the source manifest and HEAD match the bound terminal, the parent-published terminal is validated, and the recorded parent/child are no longer running. This releases only the route-specific source/HEAD hold; it grants no empirical, pilot, LEAG/freeze, or Phase 265 credit.

This was not a diagnosis of the original child failure and did not use the ordinary result/retained verifier. Consumed store, allocation, request, journal, and terminal were left unchanged.
