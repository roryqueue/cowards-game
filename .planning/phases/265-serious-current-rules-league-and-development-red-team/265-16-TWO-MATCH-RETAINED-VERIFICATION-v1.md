---
phase: 265-serious-current-rules-league-and-development-red-team
verified: 2026-10-10T22:59:25Z
status: gaps_found
scope: single-independent-actual-retained-reader
reader_invocations: 1
reader_exit_code: 0
fullChronicleVerified: false
feasibilityEstablished: false
---

# Actual retained verification v1

One independent reader process accepted the retained result. This is **partial retained-evidence verification, not two completed Matches or goal achievement**. No tests, probes, entry, prepare, provider/Strategy execution, retries, source changes, STATE changes, or commits were performed by this verifier.

## Invocation and finite result

```text
./node_modules/.bin/tsx scripts/run-v1-38-lean-private-matches.ts verify --allocation-commit 85d395828521742eb9089a2930cb931b094c0830 --allocation-path .planning/artifacts/v1.38-phase-265-private-match-allocation-v1.json --store .strategy-lab/lean-private-matches-v1/72badb26e31c11e3281d0e5317bc7347e24cf9a98bb4ddf9d5c1bfa7e6f85255
```

Actual stdout, exit 0:

```json
{"verified":true,"resultRoot":"sha256:2bd0e8bab1562a3b646bc778c44cbd7191f99367740bf9a936c5189b4d4a4ec4","attemptedCount":1,"stopCode":"CLEANUP_STOP","fullChronicleVerified":false,"feasibilityEstablished":false}
```

Reader process elapsed approximately 2.8 seconds in returned command/poll timing. Checks occurred within the authorized 22:06:36–00:06:36 UTC window. No command remains active.

## Authenticated scope and terminal facts

The actual reader authenticated the allocation commit/source parent, source/prefix and prior-probe carry, bounded retained inventory, ledger/debit/terminal anchors, resource bounds, available provider provenance, accounting consistency, and stopped-attempt evidence. Acceptance does not create missing compact-board evidence or full Chronicle proof.

- HEAD before/after: `85d395828521742eb9089a2930cb931b094c0830`; direct parent: `a0a70ca5a1dfbcf18ca44bc1a4a66d97839f3081`.
- Allocation root: `sha256:72badb26e31c11e3281d0e5317bc7347e24cf9a98bb4ddf9d5c1bfa7e6f85255`.
- Result: attempted ordinal 0; unattempted ordinal 1; planned Match count 2; cumulative charged 41 (historical 40 plus one retained debit).
- Terminal ordinal 0: `system_failure`, `SUPERVISOR_FAILURE`, `cleanupComplete=true`, elapsed 20,513 ms, 165 invocations, outcome null. Result-level `CLEANUP_STOP` is preserved as recorded; it is not relabeled from terminal cleanup status.
- Two retained provider identities authenticated by the reader; no raw identity/accounting/Strategy payload is reproduced here.
- Board evidence unavailable; start/final/last-frame board roots null; semantic root null; 0 replay rows, bytes, transitions, and events. Empty retained replay is evidence of no retained replay, not successful reconstruction.
- Terminal resource values: parent RSS 560,377,856 bytes; aggregate memory upper bound 1,944,793,088 bytes; retained upper bound 199,655,424 bytes; available disk 195,238,416,384 bytes; new allocated 32,768 bytes; remaining resource slots 1. These are retained authenticated observations, not fresh capacity permission or admission for another attempt.

## Read-only before/after evidence

Bounded finite inventory below was identical before and after the reader, including sizes, modes, and raw SHA-256 digests. Directory mode checked after: `0700`; all eight files `0600`. Canonical allocation raw digest also remained equal to retained allocation raw digest. No retained file changed.

| File | Bytes | Raw SHA-256 before = after |
| --- | ---: | --- |
| allocation.json | 15295 | d012b94baa7703ec98c4f27e77ddddf474e2a3e52b6134ff7d5fa81232e5401c |
| debit-0.json | 1179 | 1e00a93d2061d22daf45de0542600ee1c0d64ec5bc4b381d9fde6b25b1e0f0a7 |
| entry.json | 974 | 1073f7d31f227224c9cf760ebc4e3369ec3b1bf854b1c1e64cdabcc556df350f |
| ledger.ndjson | 1180 | 2739bca4716ce59b9b507e07147e10885f443a92d1e185fee71027703ae1e45e |
| pair-0.json | 2436 | 466e713eff5d2cb59e69a7de70f6c51677cb3753d8f36db5b0b97d50c14eea88 |
| replay-0.ndjson | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| result.json | 794 | 73a37d158a594cc2329e7d87f71f7ab98f3e5d9d35611b7f12634084d4a1daf8 |
| terminal-0.json | 304992 | 9e596dcce5abc6a48421d154b447db2810a36f5c4ff2422c3a19773113fedb4f |

## Closure

BLOCKER: Two-Match feasibility is not established: only one charged attempt exists, it ended in system failure, and no board/replay evidence exists. The accepted reader result is not LEAG, baseline, freeze, or full Chronicle credit. No retry or route reuse is authorized by this report. Human decision is required before any new route or remediation; this verifier performs neither. All verifier commands are closed and its source hold is releasable on this handoff.
