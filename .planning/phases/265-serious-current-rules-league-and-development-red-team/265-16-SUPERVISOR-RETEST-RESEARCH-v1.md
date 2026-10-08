# Phase 265 Plan 16 Supervisor Repair/Retest Supplement — Research

**Researched:** 2026-10-08
**Scope:** One additive, unnumbered supplement to checked Plan 16 under the approved supervisor repair/retest envelope.
**Confidence:** HIGH for current source/test behavior and explicit approval bounds; LOW for historical v11-2 failure cause, which remains unknown.

## User Constraints

### Locked Decisions

- Approval file `265-16-SUPERVISOR-REPAIR-RETEST-APPROVAL-20261008.md` is prospective only; empirical admission is false.
- Debit old 108,000,000 ms in full and add exactly 28,800,000 ms; cumulative cap 136,800,000 ms from task start 1791455941097 (2026-10-08T10:39:01.097Z), deadline 2026-10-08T18:39:01.097Z. All elapsed work counts; no restart, idle exclusion, refund, reset, recredit, or extension.
- Carry 34 charged Matches, every surviving file and prior costs; retain the 15,000,000,000-byte/300-Match limits, 1,860,000 ms reserve, 2,000,000,000-byte scratch cap, 512,000,000-byte external plus 335,544,320-byte guard, 768 MiB Node old-space, and every gameplay/runtime/privacy/accounting bound.
- Diagnose with bounded synthetic source tests before another Match. Fix only a confirmed source defect under unchanged fail-closed semantics; otherwise add narrowly scoped private finite stage attribution. Do not claim historical native causation or that instrumentation cures it.
- At most one distinct fresh private one-cell diagnostic, then only after full accepted check and actual FINAL closure at most one distinct fresh 36-cell baseline. No second attempt; refusal/failure/insufficient time ends the pair; 36-cell fit is not promised.
- Require actual MAIN author and distinct independent reviewer; fixed reviewed source, completed source review/fix/validation/verification before fresh request/helper/allocation. Each route requires fresh reviewed data/helper, immutable NEW allocation committed before its unique MAIN entry, fresh empty owned mode-0700 store, and fresh SAME-PROCESS capacity before each charge/provider dispatch. Hold source and HEAD fixed through actual terminal and exactly one appropriate independent verification.
- v11-2 failed-result carry `2cb8f651` is historical custody/accounting only, never acceptance or execution authority. Keep consumed and failed artifacts immutable; do not reuse old readers, routes, results, allocations, or authority.
- No Strategy/runtime raw data or errors; no public/counting/production authority or milestone completion claim.

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free; no system clock, filesystem, network, database, or `Math.random` in engine logic.
- Do not put game rules in React, execute Strategy code in web/API, or use Node `vm` as an untrusted-code security boundary. Treat Strategy code as hostile and schema-validate runtime boundaries.
- Preserve canonical game terminology and immutable submitted Strategy Revisions; public replay must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default.
- This supplement is supervisor/tooling-only; it must not alter canonical rules or runtime behavior beyond the approved private finite attribution contract.
- Testing gates for this work are the approved focused synthetic host tests and source/runtime/privacy checks; do not represent these as empirical Match evidence.

### Deferred / Explicitly Out of Scope

- Any empirical launch before all source and admission gates.
- Repeating an unchanged failure route, interpreting v11-2 as accepted, or altering legacy version behavior.
- Rule, resource, privacy, gameplay, or memory relaxations; alternate routes; numbered-plan proliferation.

## Findings

1. The approved diagnosis shows a current synthetic mechanism, not the historical v11-2 cause: the interval's broad catch covers child RSS, parent RSS, accounting/time-budget and threshold-kill failures; synchronous sampling can precede queued exit-event delivery, with sticky uncertainty yielding `child_failed` even when exit code is zero. The historical initiating cause remains UNKNOWN. [VERIFIED: local approval/debug/source/test]
2. The owned regression `scripts/run-v1-38-lean-supervisor-exit-repro.test.ts` calls actual `runLeanBoundedParent` and actual budget logic under mocked host surfaces. Its seven control cases pass, while the deliberate provenance assertion is RED: `resourceSamplingOperation` is absent. It exercises no real child, store, provider, Strategy, Match, or retained custody verifier. [VERIFIED: local source/test/debug]
3. Current finite reason envelope is v1 (`lean-parent-supervisor-reasons-v1`); reason codes include a single `resource_sampling_exception`, and observations currently say only `resourceSampling: exception`, with `initiatingCause: unknown` and `terminalization: unobserved`. Do not mutate this schema or legacy consumers in place. [VERIFIED: local source]
4. The narrow repair direction is an additive versioned private envelope that identifies only a finite operation stage, sequence/relative ordering, and whether exit was observed at sample time. Candidate stages grounded in actual catch operations: `child_rss`, `parent_rss`, `time_budget`, `threshold_kill`. Preserve exception opacity, sticky uncertainty, threshold/timeout kill behavior, and terminal refusal. Unknown/unclassified throws stay failed and unaccepted. [VERIFIED: local source/test; proposed contract]
5. Reuse existing v11-1 harness mechanics only as inert fixture patterns, not old authority: actual source consumer with mock host IO, synthetic inputs, no old reader or artifact mutation. New schema, source root, data/helper review roots, allocation, store, and entry identities must be fresh and distinct; custody carry may reference `2cb8f651` only as historical accounting lineage. [VERIFIED: approval/local fixtures]

## Minimal Implementation-Ready Supplement

### Files and responsibilities

| File | Required change |
|---|---|
| `scripts/run-v1-38-lean-baseline.ts` | Add a new finite, versioned supervisor-stage attribution contract/path for the approved supervisor mode only. Split the broad sampling catch into operation-scoped handling sufficient to record the finite stage. Keep `uncertain = true`, kill attempt and failure status on every caught error; do not include thrown message/stack or change legacy envelope/readers. Preserve exit event observation separately from sampling-stage identity. |
| `scripts/run-v1-38-lean-supervisor-exit-repro.test.ts` | Turn the intentional RED into focused assertions that each injected operation maps to its exact finite stage; retain current failure, kill-order, privacy, and clean-control assertions. Add unknown-stage/schema rejection and no-success-exemption checks. Keep all external child/filesystem/accounting surfaces mocked. |
| `scripts/run-v1-38-lean-baseline.test.ts` (only if shared validator/contract is placed there) | Assert exact new-version schema and strict finite enum/required fields, rejecting extra/raw error fields and malformed/legacy aliasing. |
| `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SUPERVISOR-REPAIR-RETEST-PLAN-CHECK-v1.md` | Independent check of this unnumbered supplement before source edits. |
| `.../265-16-SUPERVISOR-REPAIR-RETEST-SOURCE-REVIEW-v1.md`, `...-REVIEW-FIX-v1.md` if findings, `...-SOURCE-SUMMARY-v1.md`, `...-VALIDATION-v1.md`, `...-SOURCE-VERIFICATION-v1.md` | Required ordered source gates before any new request/helper/allocation; no gate artifact is admission authority by itself. |
| New route-specific request/data/helper/allocation/preparation/result/terminal artifacts | Create only after source verification and fresh independent review. Bind each by exact fresh roots and paths; never overwrite previous v11 or failed artifacts. |

### Required tests and gates

- Run targeted Vitest on the synthetic repro and relevant baseline tests with the approved 768 MiB Node old-space setting; run repository-configured type/lint and relevant privacy/fixed-source checks. Log exact commands/results; do not treat synthetic green as empirical proof.
- Exercise each of four operation stages, queued-exit ordering, clean control, threshold-kill throw, timeout, malformed/new schema, legacy envelope untouched, and source/HEAD identity holds. Assert terminal remains failed/refused after any uncertain sample, even with exit code 0.
- Independently review the exact repaired bytes, fix/re-review findings, validate, then independently verify source closure and no old artifact/source authority was modified. Only after this sequence may MAIN author fresh request/helper data for route-specific independent review.
- Diagnostic: one fresh independently reviewed request/helper and one immutable committed allocation; verify same-process capacity immediately before each charge/provider dispatch. Use a fresh empty owned 0700 store. Hold source and HEAD fixed through terminal and one appropriate independent verifier. Any refusal, failure, nonaccepted check, missing actual FINAL closure, or insufficient budget stops; do not prepare baseline.
- Baseline is strictly conditional: only after diagnostic's full accepted check and actual FINAL closure; it gets its own fresh data/helper review, immutable allocation, fresh empty store, capacity checks and unique MAIN entry. Cap at one 36-cell baseline.

## Do Not Hand-Roll / Pitfalls

- Do not serialize exception text, stack, raw IPC, Strategy, memory, or runtime IO into retained diagnostics; finite stage enums are sufficient.
- Do not convert clean exit into success when sampling or cleanup was uncertain. Do not weaken kill, timeout, reserve, disk, RSS, accounting, or independent-reader gates.
- Do not “fix” the historical v11-2 incident by inference from synthetic scheduling. Instrumentation improves attribution only.
- Do not reuse old v11 allocation/request/authority, retained reader, successful-looking child result, or data/helper review. The carry fingerprint is custody-only.
- Do not allocate/prepare while source gates are pending. Source research, plan check, implementation, independent review/fix, validation, and verification precede any new helper/data work.

## Resource/Authority Boundary

The envelope is capped at 136,800,000 ms cumulative from 1791455941097 and ends at 2026-10-08T18:39:01.097Z; as of research, all elapsed time is chargeable. Keep the 34 prior charges and all prior costs. No current successful test or source repair increases those limits or authorizes entry. There is exactly one diagnostic opportunity and one conditional baseline opportunity; all terminal/reader outcomes are non-accepting unless the independent current-source checks actually establish acceptance.

## Sources

- `265-16-SUPERVISOR-REPAIR-RETEST-APPROVAL-20261008.md` — direct prospective approval and immutable envelope.
- `.planning/debug/supervisor-sampling-repair.md` — current synthetic findings and explicit historical uncertainty.
- `scripts/run-v1-38-lean-supervisor-exit-repro.test.ts` — controlled regression and intentional RED assertion.
- `scripts/run-v1-38-lean-baseline.ts` — actual parent lifecycle, finite reason envelope, budget and fail-closed terminal logic.

## Confidence

- Current source/test behavior: HIGH, directly inspected.
- Approved caps and route count: HIGH, copied from current approval.
- Historical native v11-2 cause: LOW/UNKNOWN; no inference permitted.
- Proposed additive stage contract: MEDIUM; implementation must be checked against exact source and reviewed schema consumers.
