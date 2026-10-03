# 265-15 crash accounting and lean CLI source handoff

Status: source-only Task B implementation for the approved 2026-10-03 amendment. This is not a Plan 265-15 SUMMARY, pilot result, capacity receipt, or Phase 265 pass. No preparation, historical reader, provider, container, or Match was run by this executor.

## Implemented boundary

- A new `lean-experiment-allocation-v2` and disjoint default store/canonical allocation (`.strategy-lab/lean-experiment-20261003-v2`, `.planning/artifacts/v1.38-lean-pilot-allocation-v2.json`) bind the exact failed allocation/request/entry/time/empty-charge raw digests, independent terminal report and approved decision. The prospective reader rejects any change to those files or the four-file failed store inventory. The v1 allocation, open interval, reader, result absence and other consumed artifacts remain untouched.
- The v2 cumulative baseline is 565,459 ms as a conservative upper bound, zero historical Match charges, and 12,288 allocated disk bytes. The old peak whole-process RSS remains `unknown`; no guessed memory amount is charged as cumulative disk. The 28,800,000-ms, 15,000,000,000-byte, 300-Match caps and 12/2/1-GB partitions are unchanged. An open new interval still burns the entire time cap. Later use must reopen the parent terminal and shared cumulative reader, not reset to an empty route.
- `prepare-pilot` reads only the two bounded publication headers for candidate IDs. The child uses Task A's one-verifier, per-cell bounded import and checks combined parent/child RSS, the 512-MB external reserve, 64-MiB cell ceiling, 256-MiB projection ceiling, remaining elapsed time, measured allocated blocks and real free bytes before import and at each of 48 historical cells. The child checks the same-process free-space and memory facts again before each durable slot charge/provider construction.
- `run-pilot` is the sole trusted launcher. Its inert direct child has no evidence-work release without a one-use IPC secret matching a create-exclusive, fsynced entry bound to request bytes, source, HEAD, allocation, parent PID, child PID and wall/monotonic start. The parent samples diagnostic RSS, enforces time and joint working-set bounds, observes exit even without child `finally`, and publishes one create-exclusive, fsynced terminal with conservative wall/monotonic upper-bound elapsed, exit/signal and bounded resource snapshot. A child exit is not success; result interpretation waits for one retained verifier. Parent crash, torn/missing/duplicate witness, uncertain capacity, stale identity or cap overrun fails closed. The verifier interval is also counted before tier selection.

## Source-only checks

- Focused lean ledger/runner Vitest: 22/22 passing, including v1 open-interval regression, predecessor tampering, upper-bound arithmetic, old zero-charge carry-forward, joint capacity denial, missing/torn/duplicate parent witness, cap overrun, forged handshake and stale entry bindings. No empirical Strategy route used.
- `pnpm --filter @cowards/strategy-lab typecheck`: passed.
- Strict script `tsc` command in the checked supplement: passed.
- `check-v1-38-lab-boundaries`, `check-v1-38-factory-boundaries`, `check-v1-38-serious-league-boundaries`: each passed with zero violations over 1,360 scanned files.
- `git diff --check`: passed.

## Remaining root-owned gate

Independent source review must still verify the importer root equality, v1 nonrelaxation, parent/child identity, source manifest, terminal/cap arithmetic and precharge writable-path inventory. Before any root-only live preparation/entry, independently inspect old store allocated blocks and possible crash/core destinations; the observed 12,288 bytes are not a historical high-water proof. Recheck same-process physical capacity and source/HEAD hold. Only a distinct fresh allocation and one root entry plus one independent retained verification may establish an honest pilot or `feasibility_not_established`. Source-only green grants no empirical, LEAG, freeze, formation, holdout, public, counted or production credit.
