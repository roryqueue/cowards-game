---
status: diagnosed
trigger: Lean pilot host heap exhaustion before any retained charge
created: 2026-10-03
updated: 2026-10-03
scope: source-only-diagnosis
---

## Symptoms

- Expected: reviewed compact current-rules eight-cell pilot, same-process capacity, cumulative15GB/28800000ms/300Match caps, measured200/128tier or honest nonpass.
- Actual: root entry session36848/PID66239 exited134 during candidate admission under coordinator768MiBheap. No retained charge or result; one open pilot-entry time event. Unique independent entry-terminal verification is closed. Original trace withheld; no Strategy or gameplay result established.
- Timeline: final source92cc6bfe/root a37b17b1f58ae48e5cce5193716fe57199c8810f5a63797210bbe5f6bb6e6057 independently clean; preparation11minutes/read-only passed using normal host heap; entry's stricter768MiBheap exhausted after about216seconds native process time, not an exact complete empirical stopwatch.
- Reproduction: historical command recorded in STATE; DO NOT invoke it, its allocation, reader, or preparation again.
- Retained witness:265-15-PILOT-ENTRY-TERMINAL-VERIFICATION-v1.md. Entry began2026-10-03T14:42:33.541Z; independent PID closure observed by2026-10-03T14:51:59Z. Existingv1reader conservatively exhausts remaining globaltime for unclosed interval. Do not alter or relabel it as closed/successful.

## Current Focus

hypothesis: confirmed at the architectural level: lean candidate admission replays a heavyweight 48-cell historical assessment three times and materializes full supervision records plus derived token maps before any pilot slot charge. The precise allocation/throw site within that prefix is unproven.
test: source-only call-graph and allocation-shape inspection; no route, reader, preparation, provider, Match, or test execution.
expecting: a prospective lower-memory import retaining historical validation semantics; no claim that raising heap alone fixes the architecture.
next_action: return diagnosis. Any v2 cumulative accounting that substitutes a finite PID-closure upper bound for v1's consumed eight-hour unknown interval requires an explicit human resource-contract amendment before a fresh route is opened.

## Constraints

All consumed allocations, store files, time/charge ledgers, authorization bytes and terminal-verification reports stay immutable. Source/HEADhold is released only after closed root and unique terminal check. No Match/model/holdout/formation/public/counted/production execution. No old default or legacy-reader semantics changes. Do not assume a larger heap will solve it. Propose bounded allocation/streaming/candidate-closure improvements and a prospective-only crash witness under unchanged15GB/eight-hour/300Match caps. Fresh same-scope routes have standing approval, but prior work must be carried forward, not reset or refunded. If a sound bounded time/resource carry-forward cannot be independently established, report a genuine human-only resource decision instead of inventing authority.

## Evidence

- Root process tool returned exit134 and native host heap-exhaustion diagnostic; private details withheld.
- Preparation session47074/PID65912 closedexit0, allocation8520a35e published only preparation_only.
- Unique terminal report binds source/HEAD/allocation rawbytes and zero charge ledger; no ordinary empirical reader invoked.
- `scripts/run-v1-38-lean-experiment.ts:111-127`: entry is published before `readCandidates`; that call precedes the slot loop, resource checkpoint, capacity check, charge, and provider construction. `:162-175` opens the time interval around this whole body. Zero charge rows and no result are consistent with failure in this prefix, not proof of an exact failing instruction.
- `scripts/run-v1-38-lean-experiment.ts:72-75` delegates import to `readLeagueInitialCandidates`. `scripts/run-v1-38-serious-league.ts:278-313` scans/parses each factory artifact for an index, reopens the retained ledger, verifies the historical assessment once at `:292`, and calls `importAssessedFactoryCandidate` once for each of two publications. `packages/strategy-lab/src/league/contracts.ts:88-91` calls the same historical verifier again per imported candidate: three full assessment replays per import invocation.
- `scripts/assess-v1-38-factory-independence.ts:208-212,79-98,116-136,165-202` shows each replay reopens the 48-cell closure, reads supervision streams, projects observations, retains per-slot sample maps, and compares/roots them. `packages/strategy-lab/src/factory/supervision-artifacts.ts:109-175` allocates a whole descriptor-length byte array, parses all records, builds transition/accounting/trace arrays and an execution object before commitment checks; `scripts/v1-38-factory-observations.ts:66-109` expands records into retained token arrays/maps. This is the source-backed allocation architecture; no heap profile identifies the specific final allocation.
- `packages/strategy-lab/src/league/lean-experiment.ts:112-127` treats an unclosed time interval as the full 28,800,000 ms and explicitly says future stages may not recover it. The independent report's start `2026-10-03T14:42:33.541Z` and PID-closed observation by `14:51:59Z` yield a conservative wall upper bound of 565,459 ms, not an exact elapsed duration or a v1 close event. Under the existing v1 reader and D-22 no-reset/no-refund contract, this finite bound does not itself restore shared time.
- Same terminal report shows empty charge ledger, no result/terminal, and unchanged 15GB/28,800,000ms/300-Match allocation. Import occurs before the first `trackBuffer`/resource checkpoint (`scripts/run-v1-38-lean-experiment.ts:119-127`), so no retained peak-RSS/scratch observation establishes actual failed-prefix high-water. A 768 MiB old-space limit is not a whole-process RSS/physical-byte bound.
- Subsequent finite root metadata check: `/cores/core.66239` absent; the current checking shell reports core limit zero, not proof of the historical kernel configuration. Failed store currently occupies 12,288 allocated disk bytes including directory blocks and contains only allocation, entry, empty charge ledger and open time journal. This does not establish historical peak scratch or RSS and grants no budget recovery.

## Eliminated

- hypothesis: provider, Match, or replay retention caused this observed precharge heap failure.
  evidence: the candidate import at `scripts/run-v1-38-lean-experiment.ts:121` precedes the first charge/provider/Match/retention at `:127-148`; the independent retained charge ledger has zero rows.
  timestamp: 2026-10-03

## Resolution

root_cause: The lean pilot reused a historical assessed-candidate import path that scans the factory artifact directory and performs three complete, materializing 48-cell assessment replays for only two candidates before the first charge. Whole supervision streams and derived observation token maps create a high-memory coordinator prefix, and the imposed 768 MiB V8 heap exhausted there. Exact last allocation and minimum successful heap remain unknown; no gameplay/runtime memory conclusion follows.
fix: not applied. Prospective direction only: a new reviewed private low-memory import should authenticate the historical assessment/closure once, avoid duplicate verifier calls, and bound/stream per-cell records and projections while preserving exact assessment roots and candidate membership/source/runtime validation. Add pre-import high-water/time accounting and a crash-safe parent-observed terminal witness to a newly versioned cumulative ledger. Do not change v1 or assume a larger heap suffices.
verification: Diagnosis is source-backed and ordered against immutable terminal evidence; no empirical reproduction was run. A finite 565,459 ms PID-closure upper bound is mathematically available for prospective accounting, but substituting it for v1's explicit full-envelope burn is a resource-contract change needing human approval. Carry forward exact prior charge count (zero), actual/upper-bound time, disk and high-water resources; unknown peak scratch must fail closed or be independently bounded. No fresh route is authorized by this diagnosis.
