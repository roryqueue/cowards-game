---
phase: 265-15-v7-pilot
verified: 2026-10-04T11:50:20Z
status: passed
scope: actual new-v7 retained pilot verification only
tier: reduced
issued: false
phase_265_complete: false
strength_or_leag_credit: false
---

# Phase 265-15: New v7 Pilot Retained Verification

**Outcome:** The one authorized ordinary retained verification of the actual new v7 pilot passed. It reports `pilot_complete` at the reduced tier. This closes only the retained-verification gate for this v7 feasibility pilot; Phase 265 and the milestone remain incomplete.

## Provenance and execution

- Actual route producer: MAIN root `93965`, parent PID `96838`, child PID `96867`.
- Independent retained-verifier role: `/root/verify_265_supervisor_source`; invoked the ordinary verifier exactly once, synchronously, with no retry.
- Source hold: HEAD remained `5aa4c4a16548b0ac02ed2743b65217fc92d21057`; source root remained `sha256:83abe344f7d71bf4cd2aa78c2f73fbb8a59c40996c0999536e534b5245f7a590` (863 entries).
- Producer/reviewer roles for the reviewed source: author `/root/debug_lean_v6_supervisor`, co-authors `/root/lean_v7_carry` and `/root`, independent source reviewer `/root/review_265_supervisor_repair`. The retained-verifier invocation is separate from that source review.

Exact command:

```sh
sh scripts/run-v1-38-lean-experiment.sh verify-retained --request .strategy-lab/lean-pilot-request-20261004-v8.json
```

Tool execution returned initial chunk `e1ce7c`, session `43152`; the same session completed on chunk `f90146` with exit code `0`. No other verifier invocation was made.

## Authenticated identities

The retained verifier accepted the actual v7 route and result. Independent raw SHA-256 checks matched the supplied identities:

| Artifact | SHA-256 |
|---|---|
| v7 allocation | `41a60f63b732d56e860fbe247f655e88508196c501a594f8f9e7d97df366d19b` |
| v8 request | `cc0dffaf655b0ed408ae6d7b1fef6dcf9cfd59206224da7ac3084a867bb2c92d` |
| v7 result | `ab4d351ba1ea0363f90fb2fb32a3995f1744db06455ba2987d50c7e1775d54d5` |
| actual entry | `7a5f050495799883aa1bb037cf8abc3499e6427bb56fecd3766d7a6f5de68594` |
| child terminal | `c2e2f3cf1942f7dc530ead1a1f105a93f3cbef7ed0f8a1f9347fb228dce6df4f` |

The entry and terminal bind allocation `sha256:d884bda81501efd67a9570ae2bb316c652b6958eb3f9e3f0144d24c294b740fe`, source root above, held HEAD, request root above, and parent/child PIDs `96838`/`96867`. Terminal is `child_exited`, exit code `0`, no signal; its recorded entry interval is `1,132,533ms`. The verifier closed its one unique retained-verification interval; no historical v6 ordinary reader was invoked.

## Actual pilot result

The retained command returned exit `0` and:

```json
{"issued":false,"evidenceClass":"feasibility_only","allocationRoot":"sha256:d884bda81501efd67a9570ae2bb316c652b6958eb3f9e3f0144d24c294b740fe","evidenceRoot":"sha256:b653736be6666f75e2de4c6f057c1371280acc1151186d95d19e4c9631030bc4","diagnosticRoot":"sha256:08eaa1425c3365f4e6868b1de63e062d5ea3fe19b578595f7ca2724683efed26","diagnostics":[],"charged":9,"maximumCellMs":75186,"maximumCellPhysicalBytes":274432,"scratchHighWaterBytes":1510182912,"status":"pilot_complete","tier":"reduced","elapsedMs":3305606,"physicalHighWaterBytes":1511010304}
```

The retained v3 result contains eight successful fresh v7 cells. `charged: 9` is cumulative and includes the immutable prior v6 failed charge; it is not nine fresh successes. The v6 failure/result/reader was not replayed or modified. The result file had `elapsedMs: 3,296,898` before the independent verifier interval; the verifier's final cumulative output is `3,305,606ms`. Empty diagnostics are authenticated by diagnostic root `sha256:08eaa1425c3365f4e6868b1de63e062d5ea3fe19b578595f7ca2724683efed26`.

The result and verifier confirm the eight-cell reduced pilot fits its current feasibility budget: maximum cell duration `75,186ms`, maximum cell physical allocation `274,432B`, physical high-water `1,511,010,304B`, and scratch high-water `1,510,182,912B`. The v7 predecessor still carries `2,168,630ms`, one prior failed charge, measured cumulative surviving allocation `208,896B`, and conservative debit `516,096B`; historical disk/RSS peaks remain unknown.

## Gate boundary

This result permits the next separately gated current-rules baseline step; it is not a result about strategy strength, comparative outcomes, LEAG, or competition readiness. No freeze, formation materialization, holdout opening, public/counting/production use, or phase/milestone completion is authorized by this verification. The underlying v6 initiating cause remains unknown.

No source files were edited and no commit was made. HEAD remained pinned. `.planning/STATE.md` was observed with the route-active state transition during this shared-workspace task; this report did not edit it.

---

_Verified: 2026-10-04 — one ordinary retained verification of the actual v7 pilot._
