# Phase 265 Plan 16 — Additive retry-envelope research

**Scope:** Source-only design note for the approved prospective continuation. This is not authority to prepare, run, validate against native/Docker/private payloads, or alter any consumed evidence.

## Recommendation

Prefer one additive v8 *envelope/allocation identity* carrying `attemptOrdinal: 1 | 2 | 3`, while retaining the corrected v7 runtime startup wire, guest policy, bounds, and host behavior. Do not call this a v8 wire or guest-policy change. Each diagnostic ordinal must resolve to unique immutable request, allocation, store, temp, check, and retained-check identities; ordinal is part of every authorization/root join. Keep attempt 1/2/3 on the same diagnostic route implementation rather than copying all legacy logic into three versions. The sole baseline route is separately allocated and cryptographically joins the actual accepted diagnostic check/root, not a caller-selected ordinal or a synthetic success. This recommendation is contingent on proving all lookup/dispatch/verification joins include the ordinal; if not, three explicit route identities over shared implementation are safer than an ordinal that is merely metadata. [CITED: current source inventory below; approval `NEW265-16-POST-HANDSHAKE-APPROVAL-20261006.md`]

## Existing implementation seams (verified by source inspection)

| Concern | Existing seam | Planning implication |
|---|---|---|
| Route identities and paths | `packages/strategy-lab/src/league/lean-experiment.ts`: `LEAN_REPLAY_V7_ROUTES`, `leanCorrectionRoutePaths`, `leanWritablePaths`, allocation type/factory/admission, `leanSupervisorAllocationMode`, caps | Add v8 envelope identity plus ordinal validation; preserve v7 historical constants and identities byte-for-byte. Give every ordinal physically distinct output paths and strict `0700` fresh store rules. |
| CLI parsing and modes | `scripts/run-v1-38-lean-correction.ts`: `parseLeanCorrectionCommand`, supervisor mode parsing, command dispatch near `main`, `supervisorDocuments`, request/auth readers | Enumerate all prepare/run/verify modes and command suffix dispatch. Prefer a single explicit v8 mode with ordinal bound in canonical request/allocation, not a user-controlled path argument. Reject omitted/out-of-range ordinal and wrong route. |
| Request/setup and allocation | `readLeanSupervisorCorrectionRequest`, `deriveLeanSupervisorCorrectionRequestRoots`, `prepareLeanPilot`, supervisor setup/custody authentication | Bind ordinal into request bytes/root, setup authorization, data-review root, allocation root, and source manifest. Each attempt requires fresh author + independent data/helper review and a NEW committed allocation before unique entry/admission. |
| Admission/charge/entry | `beginLeanCorrectionAdmission`, `createLeanLedger`, `chargeLeanSlot`, `readLeanChildEntry`, `assertLeanEntryBinding`, `runLeanPilot` | Spend ordinal prospectively at unique admission/entry, before any provider charge/dispatch. Never refund, recredit, retry in place, resume, replace, or permit siblings concurrently. Attempt N>1 requires terminal custody AND unique-check closure for N-1. |
| Terminal/diagnostic checks | `scripts/lib/v1-38-lean-correction-retained.ts`; `authenticateLeanSupervisorDiagnosticCheck` and `verifyLeanCorrectionRetained` | Preserve actual failed result, explicit non-success/stop, cleanup false, closed-time and reader-close facts. Failed diagnostic gets exactly one appropriate unique finite terminal check; ordinary acceptance reader must reject it. No old ordinary reader, recredit, or fabricated reader input. |
| Shell/temp dispatch | `scripts/run-v1-38-lean-correction.sh` | Add exact mode-to-temp mapping and reject aliases; ensure ordinal temp directories do not collide. Keep restrictive umask, limits, env cleanup, and current no-network/private-boundary behavior. |
| Regression coverage | `scripts/run-v1-38-lean-correction.test.ts`, `scripts/run-v1-38-lean-correction-bytes.test.ts`, `scripts/lib/v1-38-lean-correction-retained.test.ts`, `scripts/run-v1-38-lean-host-stage-v7.test.ts`, plus admission/setup/allocation fixtures listed below | Extend adversarial exact-key/identity tests across dispatch, capacity, custody, retained joins, tampered ordinal, path aliasing, duplicate admission, sibling overlap, failed-check closure, and conditional baseline linkage. Source-only tests only. |

Additional allocation consumers that require inventory before coding: `leanSupervisorVersion`, `leanCapsForAllocation`, `admitLeanAllocation`, `leanWritablePaths`, `createLeanLedger`/`readLeanLedger`, `readLeanTimeAccounting`, `readLeanChildEntry`/`readLeanChildTerminal`, `verifyLeanEvidence`, all `supervisorDocuments` branches, `leanCorrectionCliFailure`, `parseLeanCorrectionCommand`, fresh-history/predecessor validators, source manifests, and every route-specific fixture/test. Do not rely on broad text replacement; exhaustive call-site and exact-key-schema review is a gate. [CITED: `packages/strategy-lab/src/league/lean-experiment.ts`; `scripts/run-v1-38-lean-correction.ts`]

## Finite envelope state machine

```text
remaining budget + immutable current source/HEAD
  -> review + fresh source-bound request/setup for ordinal n
  -> immutable allocation committed -> fresh empty 0700 store
  -> same-process capacity passes -> unique admission/entry (ordinal spent)
  -> one diagnostic dispatch -> terminal custody
  -> exactly one unique retained terminal check / actual reader-close custody
       failure or refusal: stop this route; next ordinal only after repaired/useful finite diagnosis + fresh authorization/review
       accepted diagnostic: next reserve/capacity check -> exactly one fresh 36-cell baseline
  -> stop on baseline failure/refusal, 3 spent diagnostics, budget/cap exhaustion,
     or genuinely new rule/resource/product decision
```

No sibling concurrency. Preserve capacity checks before charge/provider dispatch, fixed source and HEAD through terminal/check, and serialized-credential denial. Baseline cumulative Match total is 30, 31, or 32 according to how many diagnostics actually charged; use actual ledger evidence, not a hard-coded count. Baseline may start only after the selected diagnostic is fully accepted and its actual final reader-close time is carried.

## Immutable predecessor and resource carry

Treat consumed v7 as immutable failed evidence, not as attempt 1 of the new ordinal envelope and not as a reusable reader/check. Carry its actual failed diagnostic result, explicit stop/non-success, cleanup false, closed time `47,361,631 ms`, final reader close `1,791,295,466,715 ms`, 29 spent Matches, all processing and surviving files; do not rewrite the historical cleanup/result semantics. Separately carry prior-task repair accounting `49,150,573 ms` and start clock `1,791,299,252,280 ms`; current elapsed is `49,150,573 + now - 1,791,299,252,280`. Shared prospective ceilings remain 57,600,000 ms, 15 GB retained-future-writes, 300 Matches, including existing reserves/guards; the old historical peak disk/RSS remains unknown and disclosed. No re-credit for completed task work or old failed run. [CITED: approved continuation decision; consumed v7 close journal SHA-256 `63aceedab50124d68978631e567e78fecee558accc7f27067cb8f56f2ae05223`]

Fixed startup handshake repair is separate and already source-verified: commit `5077e3ac`, 4/4 host-stage checks, full source root `eaa793b2608a5a586a94f319b4cff7efe6575abba4dff80080817cf9ba92ba1c`. Do not fold new runtime semantics into the retry envelope. [CITED: approved continuation decision]

## Non-negotiable gates and pitfalls

- Preserve v7 request/allocation/reader identities as closed historical records. Do not relabel, patch, or select an old request, allocation, check, result, or authorization.
- Do not let `attemptOrdinal` alone imply progress. Verify uniqueness and causal prior-attempt terminal/check closure at each admission boundary; reject skipped ordinals, duplicate ordinals, branch forks, concurrent children, stale source/HEAD, and route/path aliases.
- A failed diagnostic ends that immutable attempt. Only a concrete resolved defect or materially useful finite diagnosis can justify another distinct, newly authorized attempt; unchanged known-failing launch is forbidden.
- Fresh MAIN author, independent data/helper review, immutable request and allocation commit, empty real `0700` store, and passing same-process capacity are required anew per attempt. No preparation authority implies empirical authority.
- Preserve exact failure custody and redaction; never stringify attacker/runtime errors into public diagnostics or expose private strategy/source/memory/objective data.
- Keep per-attempt and total time/disk/Match accounting conservative, with pre-dispatch capacity and the existing 1,860,000 ms next-Match reserve. Full 36-cell completion is not promised.
- Parent workflow remains responsible for plan/check/execute/review-fix/validate/source-verify gates. This note authorizes no implementation or empirical execution.

## User-approved boundaries (verbatim summary)

At most three distinct fresh private diagnostics, then one fresh 36-cell baseline only after a fresh diagnostic fully passes its unique retained check. A failed diagnostic ends that immutable route, not remaining explicit attempts. Never repeat an unchanged known-failing launch. No cap increase or candidate regeneration/tuning; current-rules serious league/evaluation/freeze precedes formation; holdout unopened; no public/counting/production/rules-shipping authority. Existing runtime/resource/privacy limits, cleanup, source custody, and prospective accounting remain unchanged.

**Confidence:** High for current source seams and locked boundaries (direct source/artifact inspection); medium for the ordinal-in-one-envelope design until exact identity propagation and adversarial tests demonstrate there is no bypass. No external package or runtime dependency is recommended.
