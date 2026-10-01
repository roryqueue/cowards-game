---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "14"
subsystem: private-diagnostic-execution
tags: [retry-v4, supervised-runtime, retained-evidence]
requires: [265-13]
provides: [one-process-valid-private-diagnostic, immutable-retry-envelope-closeout]
affects: [265, 266]
requirements-completed: []
completed: 2026-10-01
source_commit: e440763a75c0e66beb402548681a9acfddad9b24
process_validity: process_valid
attempted_ordinals: [1]
unused_ordinals: [2, 3, 4, 5]
charged_count: 1
stop_reason: process_valid
league_requirements_evidence: false
---

# Phase265 Plan14 — First diagnostic valid; sequence closed

Exactly one private S01/S03 Smoke diagnostic ran through the reviewed v4
harness. Attempt1 passed its own fresh preflight and completed a canonical
Match with process-valid retained evidence, full cleanup and owned-container
absence. The harness stopped on that first valid result; ordinals2–5 are unused
and cannot be resumed under this terminal envelope. No LEAG requirement is
completed by the diagnostic.

## Task1: immutable prospective envelope

Root captured the latest direct human approval verbatim once, with no trailing
newline, through the reviewed envelope helpers after independent source
acceptance. This is the same checked preparation logic as the CLI, not a new
issuer or approval ritual. It introduced no live observation or Match.

| Binding | Root |
|---|---|
| Reviewed source closure | `sha256:4fb9963bd4c61d219b3b72e261f8a75f5d48b547824a13c5c3be72734941d159` |
| Closure record | `sha256:7b7b3f0b2c2f8ae42e0bf733a6998003061dda470c5a90bbcf7a2321434af333` |
| Independent source review bytes | `sha256:f30b84337a2432bea2f5902cfa65ac85e5cfc182acaad833b3a0a19babe40a3f` |
| Actual approval message hash | `sha256:64a60ee89d53d89052b06e9237339866bc936a3aff273c59de4f6f4a50843bae` |
| Authority envelope | `sha256:a25f9bb3d40012811bcbb213497174abc33bb18e5f7229c4529e30e6202a9a13` |
| Five-ordinal allocation set | `sha256:b55169d8138f883dd1683e55bd459cf785835cb0ac9e83ea021d9f5af1a8d3cc` |
| Protected historical snapshot | `sha256:5e5907c67ee16200ce4c043871001a172f4b9757821020b7848bbbe672f09dfc` |

`check-envelope` exits0. The original v3 gameplay seed and all capacity/runtime
bounds are unchanged. The set fixes at most five serial attempts, separate
ordinal roots/namespaces/owners, own fresh preflight,240000-ms cell,
600000-ms run-command entry and30000-ms cleanup reserve.

## Task2: one main-orchestrator invocation

Root invoked the `run` selector exactly once. Attempt1 fresh preflight admitted
at6200 effective-available-memory basis points (unchanged inclusive2500 gate),
with no owned-container collision and all other frozen capacity/runtime checks
passing. The historical assessed-candidate reader took11252ms. No attempt2
preflight, provider or Match occurred.

| Attempt1 record | Root / disposition |
|---|---|
| Allocation | `sha256:cdfbb41e1162631479df4032a8c2e08ce7a35617cc0601f82d39c92c2d85ffe2` |
| Fresh preflight | `sha256:0f368828dcd5ada875df37fe3c129c7b6e1fa0889c222525729c1ad194de95ba` — admitted |
| Durable start | `sha256:2a30760555c67bd22dacb1135f04f89b5140fdbbb2553f02666e2103f800172f` |
| Terminal | `sha256:b93e66491b2287ab325b55f144a9e8dc7be7c66c615d3a9766d60eeeb1fc0dd3` — success/process_valid |
| Retained execution | `sha256:ed607dc66a82b20299b5aecc95228a4400054290d48ea6e39ced3a2ba6e10f7a` |
| Parent | `sha256:41e239946fdf46649f4e18b0046bdd689dcd52a2e07f70dc62e32c5aa1d850cb` — exit0/no timeout/cleanup complete |
| Result | `sha256:6a81f21a9fe89fc082f956ae1b2f03281c16b4ea73390de006eaba3f4f58593d` — one charged cell/container absence |
| Publication | `sha256:d67df7e3f601eca9c43d9545348cd077a353391622b4cfd696994c6aefa2fb0b` — durable |
| Verification receipt | `sha256:76db3d2ef1e1399ddd5a7fcca1dc7dead2c4cd648618178778b15242cefb6a82` |
| Closed serial sequence | `sha256:b33c1b27ffe9ae5929c2bff9eea2ab090369fa2f6ff721fc6ae3e60666f8dcf7` — first-valid stop, four unused |

Cell duration75373ms; parent run-entry observation93739ms. Both are well below
their unchanged240000/600000-ms ceilings. Cleanup completes under the separate
reserve; no retry, refund, replacement or old-route reuse occurred.

## Task3: retained verification and independent review

Root and independent reviewer `/root/265_retry_plan_check` each ran the exact
read-only command, both exit0:

```sh
pnpm exec tsx scripts/run-v1-38-diagnostic-retry-v4.ts check-retained --envelope .planning/phases/265-serious-current-rules-league-and-development-red-team/265-14-RETRY-V4-AUTHORITY-ENVELOPE.json --allocation .planning/artifacts/v1.38-phase-265-retry-v4-allocation.json --repository .strategy-lab/league-265-retry-v4
```

The checker reopens the exact source/review/historical bindings, fresh preflight,
charge, terminal, complete evidence graph, cleanup, publication, parent and
sequence; no orphan/duplicate or unused ordinal is silently consumed. Independent
retained review reports zero actionable findings and records actual checker
coverage without claiming a new live operation or arbitrary-host certification.

## Realism and outcome checks

Root's additional read-only evidence check confirms1473 canonical transition
rows,500 completed/charged runtime accounting rows,81915 output bytes and
4114384 retained artifact bytes in85 evidence records. Canonical semantic
validation, exact state rehydration, gameplay-state continuity, event/outcome and
no-orphan checks pass. The terminal is a top-side `WIN`; one seeded condition
is not an estimate of strategy strength or a metagame result.

A read-only positional scan checked all2946 before/after state views. The Match
starts on bounds x=0..11/y=0..11 with16 distinct Soldiers in the unchanged edge
ranks x=2..9/y={0,11}; Smoke has zero initial terrain STONEs. No active Soldier
or terrain position lies outside its active bounds in any retained state.
No browser replay was exposed or public UI altered by this private headless
diagnostic; this is positional/semantic validation, not a browser-render claim.

## Preserved boundaries and remaining work

Old full-league/pilot/v3 allocation, results, stores and source baselines remain
byte-identical. The old v3 initiating exception is still unknown; the valid new
result does not rewrite historical failure. All LEAG/freeze/formation/holdout/
counted/public/production flags remain false. Private stores stay0700/files0600
and source/memory/objective payloads were not copied to planning or public views.

Plan14 is complete for approved diagnostic accounting. Phase265 remains
empirically incomplete: the serious complete league, solver/response/red-team,
portfolio/finalist evidence is still required. A full league needs its own fresh
prospective allocation; neither unused diagnostic slots nor generic continuation
can expand this terminal envelope. No new exact-literal ceremony is required.

## Task commits and deviations

- `e9fc1661`: exact approved prospective envelope/allocation, committed before run.
- Preparation used the reviewed exported helpers to capture the exact message
  without a shell-created temporary message file/newline. No source changed.
- The first diagnostic succeeded, so four slots were intentionally unused.

Plan13 source/review corrections revealed two real evidence defects (protocol
machine-hash continuity and oversized state rows). The new genuine run validates
the repaired private path, not a full-league throughput or competition claim.
