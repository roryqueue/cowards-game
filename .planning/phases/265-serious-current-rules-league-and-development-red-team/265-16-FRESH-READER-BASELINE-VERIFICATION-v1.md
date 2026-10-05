---
phase: 265-16-fresh-reader
verified: 2026-10-05T19:48:04Z
route: baseline-v4
invocations: 1
invocation_session: 26989
process_status: exit_0
accepted: true
status: retained_valid
evidence_class: limited_exploratory
complete: false
phase_complete: false
source_root: sha256:cf9096c68ff0954ed83334f635cf8ac944d4d4bf0b4af3b602f93ebe65ff9bca
head: 74e072c1edc6da7d117ca21a61fe54d5e8a10e22
allocation_root: sha256:229b7738fae7459489a2a6c7126b92c518db89755357bce32b769c435f2b2499
allocation_bytes_root: sha256:1d28bc2ecadc1b7ebe6b62d9e8bc11502656998a591c78a3080a3d33338e89ca
request_bytes_root: sha256:8ae0658ed87c7f9380500efc1c737bfbdb834e424ac52e456a407d9aef92d681
accepted_diagnostic_root: sha256:a323f13fa38805942202d79814c8bd5c3167eb98ab38f35d0e126120eaf4085e
result_root: sha256:55c181fae77a45b775fbd598607fc3bdfde5b4daa8c4b0d466fb315ff2294fea
terminal_bytes_root: sha256:8946fb08942541206034e689bde613e3e143d4d1a51600c5df3cdf0c811d3072
check_root: sha256:cca10fe396c9b0607dd6a89b7df2d4c9fc715ab5825d5f94cf6588fd88a91b4c
check_bytes_root: sha256:57a697237270ea47e1454d51cb81ccfa592197b6f7a2825e0e02e3efbb174bd7
---

# Phase 265-16: Fresh V4 Baseline Verification

The unique ordinary retained verifier was invoked exactly once:

```sh
sh scripts/run-v1-38-lean-correction.sh verify-supervisor-baseline-v4 --request .strategy-lab/lean-correction-supervisor-baseline-request-20261005-v4.json
```

It exited 0 and wrote a retained check with `accepted: true`, `status: retained_valid`, and `evidenceClass: limited_exploratory`. This does **not** mean the planned 36-Match baseline completed: the check is `complete: false`, `phaseComplete: false`, and records only 10 current observations/pairs out of 36. Nine were successful; one was a `system_failure` with code `SUPERVISOR_FAILURE`. Cleanup is true for all ten. No private error text or strategy/source content is included here. The claim remains `no_robust_pure_claimed`; holdout and formation remain unopened, and public/counted/production authorization is false.

The baseline allocation binds to the already accepted v4 diagnostic check `sha256:a323f13fa38805942202d79814c8bd5c3167eb98ab38f35d0e126120eaf4085e`. The verified entry retained HEAD `74e072c1edc6da7d117ca21a61fe54d5e8a10e22` and source root `sha256:cf9096c68ff0954ed83334f635cf8ac944d4d4bf0b4af3b602f93ebe65ff9bca`. After reader closure, HEAD/source remained held and the v4 source manifest had no tracked diff. The child terminal was `child_exited`, exit code 0, no signal; parent and child were absent before verifier entry.

## Safe accounting summary

- Actual baseline terminal elapsed: 1,232,949 ms. Final cumulative elapsed, including verifier closure: 24,910,444 ms of 28,800,000 ms; 3,889,556 ms remain.
- Cumulative charged: 23 of 300; 277 charge slots remain. This comprises the 12 historical charges, one accepted diagnostic charge, and ten current baseline charges.
- Cumulative retained bytes: 9,617,408 of 12,000,000,000; remaining retained allowance: 11,990,382,592 bytes.
- Reader scratch high-water: 1,201,831,936 of 2,000,000,000 bytes.
- The 36 × 600,000 ms amount is a worst-case sum of per-Match caps, not a minimum-runtime estimate. This report records actual counters and does not infer future capacity or authorize another run.

## Reader closure and raw roots

- Reader interval: `correction-supervisor-baseline-v4-verifier`; started `1791229594211`, observed `1791229625303`, closed `1791229625398`. Verifier, reader-gap, and reader-close intervals are all closed; the ledger is inactive.
- Request bytes: `sha256:8ae0658ed87c7f9380500efc1c737bfbdb834e424ac52e456a407d9aef92d681`.
- Allocation bytes: `sha256:1d28bc2ecadc1b7ebe6b62d9e8bc11502656998a591c78a3080a3d33338e89ca`.
- Entry bytes: `sha256:e4b5aabdc2a077626abde231efad83c02a1cf52bb4273bed09c9d94638e800af`.
- Terminal bytes: `sha256:8946fb08942541206034e689bde613e3e143d4d1a51600c5df3cdf0c811d3072`.
- Result bytes: `sha256:98049f6df575ea7f3ef083c81124cc70965abf9e739dfded023e217ae8cc0a69`.
- Supervisor-reason bytes: `sha256:fbea32bdc081b11154ba1ccf68611523b2d491f9efd05047689e69dc9c67dc74`.
- Final time-accounting bytes: `sha256:0d639b4e449961fcd63af40661da564369b53f26ea34a6c5c0baa553382c0a7a`.
- Check semantic root: `sha256:cca10fe396c9b0607dd6a89b7df2d4c9fc715ab5825d5f94cf6588fd88a91b4c`.
- Check raw bytes: `sha256:57a697237270ea47e1454d51cb81ccfa592197b6f7a2825e0e02e3efbb174bd7`.

This records only the unique baseline retained check and its safe summary. It is not a completed 36-Match baseline, phase acceptance, full scientific claim, or downstream authority. No second reader, provider, Match, or other baseline operation was invoked in this verification turn.
