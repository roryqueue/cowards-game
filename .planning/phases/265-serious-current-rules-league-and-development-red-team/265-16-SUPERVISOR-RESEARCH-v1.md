# Plan 265-16 Supervisor Continuation — Source Research

Scope: implementation guidance for the directly approved `265-16-CORRECTION-SUPERVISOR-DECISION-v1`. Source-only; not a diagnosis or execution authorization.

## Recommendation

Implement one additive v2 route family. Keep all correction-v1 source behavior, destinations, consumed artifacts, and readers immutable. Add finite supervisor branch-reason logging to the existing parent terminal flow without changing any uncertainty latch, check order, classification, cleanup, timing, or resource policy. Do not assert or patch a speculative RSS sampling race.

The only changed gate is cause-neutral baseline admission: older initiating cause may remain unknown, but the *new* diagnostic must have a clean `child_exited` terminal and its unique ordinary retained reader must accept the complete evidence, custody, and cleanup. A success-shaped Match or reason log alone never suffices. If diagnostic execution, terminal, custody, cleanup, or reader fails/does not accept, stop: no baseline and no second diagnostic. At most one distinct 36-cell baseline follows acceptance; its failures remain partial.

## Minimal Source Touchpoints

| Source seam | Narrow change |
|---|---|
| `scripts/run-v1-38-lean-baseline.ts` | Capture a finite reason enum/bitset at existing supervisor uncertainty setters. Preserve terminal outcomes and every check. Bind reasons to the actual entry/allocation/source/request/child; never capture raw errors, source, input, or IO. |
| `scripts/run-v1-38-lean-correction.ts` | Add a separate v2 dispatcher/request/admission path; do not reuse or overload consumed v1 routes. Existing source review, committed allocation, unique entry, capacity-before-charge/provider, source+HEAD hold remain. |
| `scripts/lib/v1-38-lean-correction-retained.ts` | Add the narrow v2 audit path. Require the existing full evidence/custody/cleanup checks plus clean terminal; reason metadata does not replace any audit. Preserve the v1 reader. |
| `packages/strategy-lab/src/league/lean-experiment.ts` | Define unique v2 route identities and predecessor binding. Keep global bounds unchanged; recursively include nested TMP files in survivor accounting. |
| `scripts/lib/v1-38-lean-baseline-reuse.ts`, `scripts/lib/v1-38-lean-baseline-pipeline.ts` | Reuse existing frozen grant/pipeline and seven role roots; do not call cold builders, regenerate/search, or invoke old empirical readers. |
| Existing correction, parent, retained, reuse, and pipeline tests | Add mocks/mutations for reason completeness/bounds, unchanged failure behavior, cause-neutral but accepted-reader-only gate, route uniqueness, zero cold regeneration, and cumulative accounting. No provider calls or empirical credit. |

Use disjoint v2 destinations, for example `lean-correction-supervisor-diagnostic-20261004-v2` and `lean-correction-supervisor-baseline-20261004-v2`, with matching v2 request, TMP, allocation, and check names. Reject pre-existing paths; never alias v1 or earlier pilot paths.

Reason metadata should be canonical, exact-key, finite, private, and at most 4,096 bytes. Enumerate existing parent uncertainty branches (IPC/error or malformed message; resource sample/exception; final identity check/throw; failure-receipt publication; timeout/cleanup/terminalization) and allow explicit `unknown`/unobserved. Multiple reasons may coexist. Logging must not suppress uncertainty or turn failure into success.

## Carry and Limits

Start from the actual correction-v1 carry: **11 charges / 5,282,046 ms**, not the earlier ten-charge snapshot. Before creating a v2 allocation, use the latest authoritative closed journal/time receipts; the 4,846,168-ms report prefix predates the separately authorized terminal-verifier closure. Carry every surviving old file and nested directory, including the empty tool-created `tsx-501` directory under prior TMP; count recursive allocated blocks and never delete old evidence. Keep historical peak disk/RSS `unknown`.

Preserve unchanged **15 GB / 28,800,000 ms / 300 Matches**, guest **1,000 ms**, host **5,000 ms**, and Match **600,000 ms** bounds. Carry all preparation, data/source review, commit/push/load gaps, runs, terminal, and unique-reader time/writes; reserve cleanup/terminal/check intervals before entry. Original **192 cold/search opportunities remain spent; 128 future response opportunities stay fixed**. Authenticate the same seven source roles and nested provenance byte-for-byte. No cold generation, tuning, refund/recredit, extra route, formation, holdout, public/counting/production, full-LEAG, phase-completion, or release credit.

The consumed v1 result root `574e8df011f0463a41c0d5985fe6b676001b180f959b3990fc51599b1be024b9` and allocation root `7ce7ea8108a389806547d8c9a91dd64110b8cef5e73d3d6b843d7073d889223c` are immutable accounting/evidence only. Its unique refused reader must not run again.

## Verification Focus

- Every uncertainty branch remains terminally failed; reason logging is bounded and rejects malformed, oversized, nonfinite, extra-key, or raw-text data. Primary failure and cleanup behavior remain unchanged.
- Only the new fully accepted retained check can unlock baseline when old cause is unknown. Empty origin, success-shaped cell, old check/result, fixture, partial custody, or reason log without accepted audit must deny.
- V2 identities are unique; duplicate entry/reader/allocation and cross-version roots reject. Failure/refusal stops without another diagnostic.
- Tests prove exact carry and recursive nested survivors, seven fixed source roles, zero historical readers/cold builders, unchanged bounds/opportunity, and no downstream authority.
- Run focused tests/types/boundary checks and independent source review/verification before any data preparation. These checks authorize no empirical route themselves.

Research basis: approved supervisor decision; actual parent diagnosis; checked Plan16 bounded supplement; current STATE and source paths above. No specific old fault is established by these materials.
