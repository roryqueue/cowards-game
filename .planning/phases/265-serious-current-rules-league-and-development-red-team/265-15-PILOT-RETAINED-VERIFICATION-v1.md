---
phase: 265-serious-current-rules-league-and-development-red-team
scope: one authorized ordinary retained-result verification of the final v6 pilot
verified: 2026-10-04T01:02:57Z
status: feasibility_not_established
verifier_session: 91074
verifier_command_exit: 0
held_head: 73b97a3d390a66300713ec9a91fb3829b75e8173
source_commit: 005650cdae79673dc4321c4c0fbabd63c1ec023a
source_root: sha256:b4245f41df4d06eac9dd6fdf43f822a39c97b9792e75b4bdc01dd4899bbbf905
request_bytes_root: sha256:9c9c2d50f6fdb229e65b3f77534060c7cca25116ec77e53ae06110313a2ce399
allocation_root: sha256:edb27fbe5c5491c526059b2b8770d84c814b096a9144ee99f03fee732430c56b
allocation_bytes_root: sha256:aa766ee396b1d0e6ca19cc8f151288f39105efe98936415747b5dafc1ed87e23
result_bytes_root: sha256:686a0e51898a8d21b74c3eba7c89abe86fc5ab47834d42aa318f820d65429fe4
evidence_root: sha256:ae82de483a9e773897a842b2f912449d1785ecc6032d1a4329b5cd8a1daf9cd6
entry_bytes_root: sha256:422d2fef443223552985e4cd58ab85736ce5d2ed750d18e56c8902bf36cb5d84
terminal_bytes_root: sha256:2a38ef91a3a89b0c2d8518d147043a3f7649880f2c31b6a46c1e6905fed15253
---

# Phase 265-15: Final Pilot Retained Verification v1

**Scope:** Exactly one ordinary retained-result verification for the final prospective v6 route. The result is feasibility-only and does not meet the feasibility gate.

## Source, request, and result identity

Before the verifier, held `HEAD` was `73b97a3d390a66300713ec9a91fb3829b75e8173`; the 863-entry source manifest matched reviewed source commit `005650cdae79673dc4321c4c0fbabd63c1ec023a` and root `sha256:b4245f41df4d06eac9dd6fdf43f822a39c97b9792e75b4bdc01dd4899bbbf905`. The v7 request raw root was `sha256:9c9c2d50f6fdb229e65b3f77534060c7cca25116ec77e53ae06110313a2ce399`. The canonical and store allocation bytes both had root `sha256:aa766ee396b1d0e6ca19cc8f151288f39105efe98936415747b5dafc1ed87e23`, and the admitted allocation root was `sha256:edb27fbe5c5491c526059b2b8770d84c814b096a9144ee99f03fee732430c56b`.

The one authorized command, `sh scripts/run-v1-38-lean-experiment.sh verify-retained --request .strategy-lab/lean-pilot-request-20261003-v7.json`, exited 0. It verified the existing result bytes root `sha256:686a0e51898a8d21b74c3eba7c89abe86fc5ab47834d42aa318f820d65429fe4` against the retained ledger and returned evidence root `sha256:ae82de483a9e773897a842b2f912449d1785ecc6032d1a4329b5cd8a1daf9cd6`. The command was invoked exactly once; no second ordinary reader or fabricated result was used.

The held source/HEAD, request, canonical/store allocation, result, entry, and child-terminal raw roots remained unchanged after verification. Entry root is `sha256:422d2fef443223552985e4cd58ab85736ce5d2ed750d18e56c8902bf36cb5d84`; terminal root is `sha256:2a38ef91a3a89b0c2d8518d147043a3f7649880f2c31b6a46c1e6905fed15253`. The entry was bound to parent PID `37210` and child PID `37239`; both were absent after closure. The terminal was `child_exited`, exit code 0, null signal, elapsed upper bound `611,074 ms`, physical snapshot `516,096` bytes.

## Retained outcome

The safe retained-verifier summary reports `issued: false`, `evidenceClass: feasibility_only`, one charged cell, zero successful cells, maximum cell time `6,258 ms`, maximum cell physical bytes `8,192`, scratch high-water `1,501,970,432` bytes, physical high-water `1,502,416,896` bytes, and cumulative elapsed `2,168,630 ms`. The v5 predecessor carry of `1,555,387 ms`, zero predecessor charges, and conservative `409,600`-byte predecessor debit remain included; verification closed its own time interval, leaving the accounting inactive.

The one compact cell record was classified `system_failure` with the allowlisted code `SUPERVISOR_FAILURE`; outcome was null, cleanup was complete, invocation count was 2, and compact telemetry counts were zero transitions and zero events. This distinguishes a system/supervisor failure from a player violation without exposing private I/O, source, objective data, raw replay, or error text. Across the whole pilot, charged `1`, successful `0`, and the verifier's result was `feasibility_not_established` (tier `feasibility_not_established`). No LEAG, baseline/freeze, formation/holdout, public, counted, production, or Phase 265 completion credit follows.

## Limits and disposition

After the ordinary verifier closed, bounded metadata inspection confirmed unchanged source/HEAD and raw request/allocation/result/entry/terminal identities, one charge and one terminal, inactive time accounting, and absent parent/child PIDs. The verifier-added interval is retained in cumulative elapsed accounting. No further importer, provider, Match, retry, preparation, test suite, or scan was run.

This final bounded route failed to establish feasibility. Per the approved stop boundary, the outcome is terminal `feasibility_not_established`; there is no further correction or pilot route authorized by this plan. Historical disk/RSS peaks remain unknown. The result remains private, feasibility-only evidence and is not a competitive, public, counted, production, or phase-completion result.

---

_Verified: 2026-10-04T01:02:57Z_  
_Verifier: unique ordinary retained-result verifier_
