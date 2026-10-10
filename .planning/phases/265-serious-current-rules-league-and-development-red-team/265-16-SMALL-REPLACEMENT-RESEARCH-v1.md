# Phase 265 Plan16 — Small Replacement Research

**Researched:** 2026-10-10  
**Scope:** private diagnostic-first replacement, not the current-rules league baseline  
**Confidence:** MEDIUM (source architecture is inspectable; feasibility of a new isolated entry is not yet proven)

## Recommendation

Replace the oversized training/matrix plan with one narrowly scoped private diagnostic path: exercise a frozen, finite set of already-admitted runtime invocations outside a Match, retain only compact trusted stage/code/counter/resource outcomes, and stop on the first failed probe unless one independently reviewed correction cycle is used. Only after all selected non-Match probes pass may the operator-owned entry dispatch up to two separately charged current-rules Matches. Use the existing supervised runtime and schema/admission boundaries; do not add a host-side executor, new sandbox, provider, or gameplay rule. [CITED: `265-16-SMALL-REPLACEMENT-APPROVAL-20261010.md`; `AGENTS.md`; `scripts/lib/v1-38-lean-baseline-match.ts`]

This is feasible as a diagnostic experiment within the approved small envelope if the planner treats the new runner, finite evidence schema, and accounting as a deliberately small new private route. It is not feasible by simply relabeling or resuming the old four-pair/36-cell route: that family is closed and failed, and its 40 charges, historical cost, and surviving files remain carried. The smallest useful result is runner/runtime feasibility and bounded failure attribution—not strategy quality, LEAG completion, a baseline, or a freeze. [CITED: `265-16-SMALL-REPLACEMENT-APPROVAL-20261010.md`; `265-16-POST-V14-RESOURCE-WINDOW-diagnostic-v15-5-TERMINAL-VERIFICATION-v1.md`]

## Controlling Constraints

- The approved total window is 7,200,000 ms from 2026-10-10 11:58:52 UTC through 13:58:52 UTC. Charge research, planning, implementation, reviews, tests, execution, verification, waiting, and cleanup. Preserve the 31-minute terminal reserve; source work ends by 13:27:52 UTC and no 600,000-ms Match starts after 13:17:52 UTC. [CITED: `265-16-SMALL-REPLACEMENT-APPROVAL-20261010.md`]
- Hard caps: at most 32 explicitly counted isolated non-Match probes, at most two separately charged Matches, one correction cycle, and no extensions/retries. Count failed attempts and all work; stop on success, inconclusive failure, cap, or deadline. [CITED: same approval]
- Carry all 40 old charges, FULL108M and continuous wall-time costs since 1791455941097, survivors and future writes; no reset/refund. Historical peak disk is unknown. Keep 3,000,000,000 B RAM, 2,000,000,000 B scratch, 12,000,000,000 B retained, 15,000,000,000 B total, cumulative 300-Match ceiling, guest 1,000 ms, host 5,000 ms, startup 2,500 ms, and Match 600,000 ms. [CITED: same approval]
- No alteration or reinterpretation of consumed routes, allocations, ledgers, results, refusals, holds, readers, or authority. The v15-5 attempt is ended/non-authorizing; do not infer its physical cause from empty telemetry. The prior source trace says v15-4 hostFailureV15 is intentionally mode-specific, while v15-5 uses a separate V8 startup-origin path; no concrete mode5 wrong-field defect or physical initiating cause was established. [CITED: `v15-5-missing-attribution.md`; `265-16-POST-V14-RESOURCE-WINDOW-diagnostic-v15-5-TERMINAL-VERIFICATION-v1.md`]
- Keep canonical rules, information boundaries, privacy, and source/runtime bounds unchanged. Strategy code remains hostile; never run it in the host, web/API/Go process, or Node `vm`. Validate every runtime boundary with existing schemas. No public, counted, production, holdout, formation, league, baseline-freeze, or phase-completion authority. [CITED: `AGENTS.md`; same approval]

## Smallest Recommended Architecture

```text
ROOT-owned frozen source + reviewed finite probe manifest
  -> fresh named private request/allocation/store and immutable cost ledger
  -> unique entry: authenticate roots/HEAD, observe same-process capacity
  -> at most 32 isolated calls through existing supervised runtime
       -> exact admitted request schema -> existing IPC/container boundary
       -> trusted compact stage/code + duration/counter/resource receipt
  -> all probes pass? -- no: terminal diagnostic, no Match
       yes -> preselected 0-2 separately charged current-rules Matches
  -> close child/ledger, bind result to source/allocation/entry/HEAD
  -> one independent ordinary result verification; terminal report
```

The existing current-baseline entry already has useful patterns for canonical roots, committed allocation binding, one-use child entry, same-process capacity observations before charge/provider creation, fixed HEAD/source checks, cleanup, ledger accounting, compact safe results, and independent retained verification. Reuse those mechanics by extraction or narrow callback seams rather than building a parallel accounting stack. Important feasibility gap: the inspected issuer binds current-baseline runtime authority to a charged pair, candidate source, Match ID, and seat; it does not expose a generic non-Match invocation grant. Therefore the plan must either identify an already-supported safe non-Match seam or design and independently review a narrowly scoped probe-only authority joining fresh allocation/charge, admitted immutable source, exact probe input, runtime limits/image, and one-use ordinal. It must not borrow a Match identity, use a legacy route, or loosen any existing grant. If this new grant cannot be implemented and reviewed within the source frontier, stop before runtime dispatch and report infeasible. The existing Match producer joins source/input/invocation identity, dispatches the canonical Match kernel, and only then projects compact evidence; a non-Match diagnostic must not bypass its authority checks. [CITED: `scripts/run-v1-38-lean-baseline.ts`; `scripts/lib/v1-38-lean-baseline-match.ts`; `scripts/lib/v1-38-lean-experiment-authority.ts`]

The V8 startup-origin observer is not sufficient evidence by itself for a pre-response failure: it requires a valid startup response frame before emitting an origin. Keep its current semantics. Add a separate, finite, host-owned lifecycle receipt around stages the trusted runner can actually observe (for example: request validation, child creation/ready publication, IPC exchange, response validation, timeout/termination, cleanup). Record only enumerated stage and reason codes, bounded counters/durations, and joins to allocation/charge/request/source; do not retain raw errors, stdio, source, runtime inputs/outputs, or Strategy/objective/memory content. Empty/unknown observations remain `unknown`, not “no work.” [CITED: `v15-5-missing-attribution.md`; `scripts/lib/v1-38-lean-startup-supervisor-v8.mjs`; `scripts/lib/v1-38-lean-baseline-match.ts`]

## Recommended Minimal Files and Responsibilities

Use only a new, explicitly named private route; exact path names are planning choices for the checker to confirm. Avoid another `v15-6` envelope or a chain of correction-plan versions.

| Suggested new file | Minimal responsibility |
|---|---|
| `scripts/run-v1-38-lean-private-probe.ts` | One standalone private runner module containing its finite schema/schedule, compact ledger, minimal typed one-use probe boundary if needed, lifecycle execution, and terminal projection. Reuse current isolated runtime plumbing; account every attempt; fail closed at 32; no Match credits. |
| `scripts/run-v1-38-lean-private-probe.test.ts` | One focused test file for deterministic frozen selectors, exact accounting, schema/identity rejection, cap/stop rules, privacy, and inert lifecycle failures. Do not launch Docker, providers, Matches, or Strategy code from unit tests. |
| Fresh route request/allocation/store/result | Minimum new named private artifacts required by approval: exact new paths, committed allocation before entry, isolated store, compact result and one ordinary independent verification. Do not add a parallel versioned receipt/check/carry/hold/pair chain unless an existing required gate cannot function without it. Keep physical evidence private and projections redacted. |

Prefer existing finite schemas and root helpers (`leanBytesRoot`, `labRoot`, canonical bytes), `runLeanBoundedParent`, capacity accounting and result verification where they can be called without expanding old route semantics. Keep implementation to one standalone runner module plus one test file where practical; use a minimal typed probe boundary inside that module if necessary, not a new authorization/proof-carrier version family. Do not edit consumed artifacts or rewrite legacy defaults. If no safe design fits, stop and report the exact authority barrier rather than weakening allocation, charge, container, source-review, or privacy checks. [CITED: `scripts/run-v1-38-lean-baseline.ts`; `scripts/lib/v1-38-lean-baseline.ts`; `scripts/lib/v1-38-lean-baseline-match.ts`; `scripts/lib/v1-38-lean-experiment-authority.ts`]

## Frozen Probe Design and Gates

Before implementation output, freeze a small schedule (recommend 8–12 planned probes, well below the 32 hard cap) with explicit selector, exact request schema/version, trusted fixture/source root, expected protocol boundary, and deterministic ordinal. Suggested boundaries: successful admitted invocation; invalid/missing request rejection; malformed/oversized response rejection; guest timeout; host/transport termination; startup response/ready boundary; cleanup/child-exit observation; compact evidence join and privacy projection. These are diagnostic protocol cases—not independent training/evaluation Matches. Every attempted fixture call consumes one probe, including setup/runtime failure. The planner should only include cases that the current supervised entry can execute safely without violating capability or admission requirements; do not use arbitrary fault injection against production authority.

Gates:

1. Before runtime: source/HEAD and probe manifest frozen; independently reviewed route, data, and helper boundaries; exact private paths; fresh store; immutable allocation and cumulative cost reference; same-process RAM/disk/time capacity check. Historical peak disk stays marked unknown. [CITED: approval]
2. Before each probe: source/HEAD unchanged; host/child connected; fresh capacity; immutable count/time/write debit; no charge-free attempt. Probe cap is 32 total including corrections. [CITED: approval; `scripts/run-v1-38-lean-baseline.ts`]
3. Probe acceptance: exact request/response schemas, joins, cleanup and bounded compact attribution are valid; all expected success/failure classifications match the frozen schedule; no private payload leaks. A failed or ambiguous probe blocks Match dispatch. At most one concrete, reviewed/fixed correction cycle; no broader redo. [CITED: approval; `AGENTS.md`]
4. Match stage, only after all probes pass: preselect zero, one, or two distinct current-rules diagnostic Matches before seeing outputs; each requires its own ordinary immutable charge and existing supervised canonical Match path. Keep each under 600,000 ms and all cumulative bounds. A non-Match probe cannot turn into a counted Match after outcome. [CITED: approval; `scripts/lib/v1-38-lean-baseline-match.ts`]
5. Terminal: close resources, verify ledger/result roots and unchanged HEAD/source, and have one independent ordinary result verifier. Freeze source through that run and one independent result verification. No fallback reader/retry after refusal or failure. [CITED: approval; `scripts/run-v1-38-lean-baseline.ts`]

## Validation Architecture

No package installation is indicated. Use existing Vitest conventions and focused files for pure schedule/schema/receipt tests and inert runner lifecycle tests; inspect current test scripts/config during planning rather than assume new tooling. Test that all attempts count; ordinals never reset; no Match dispatch follows any failed/unknown probe; source/error/stdout/runtime-input payloads are absent; exact schema joins reject mismatches; capacity is checked before each dispatch; and every terminal closes cleanly or says cleanup is incomplete. Do not execute runtime tests that launch external containers during the unit-test wave. Actual supervised runtime dispatch is separately gated by source review and the approved private entry.

Static architecture review is not evidence the actual probe runner or runtime is feasible. One successful fixture request does not demonstrate that the failed physical cause was repaired; the old v15-5 cause remains unknown. A failed small experiment is an honest `inconclusive`/`gaps_found`, not a rationale for extending the envelope.

## Requirements and Downstream Boundary

The existing Plan16 mapped LEAG-01–05/07 and explicitly deferred LEAG-06/08, with LEAG-09 superseded by a single automated round. This replacement cannot satisfy LEAG-01–09: two Matches cannot complete even the reduced 36-cell current baseline, and the diagnostic path is expressly not a baseline/freeze. Preserve every LEAG requirement as pending and state the diagnostic’s result only as a runner-feasibility/failure-attribution finding. The next dependency remains a separately researched, checked, authorized current-rules baseline plan after this diagnostic; no formation materialization before a valid independently verified current-rules freeze. [CITED: `265-16-PLAN.md`; `REQUIREMENTS.md`; `ROADMAP.md`; `265-16-SMALL-REPLACEMENT-APPROVAL-20261010.md`]

## Project Constraints (from AGENTS.md)

- Keep engine pure, deterministic, serializable, side-effect free; keep game rules out of React.
- Never execute user Strategy code in the web/API process or Node `vm`; treat source as hostile and schema-validate all runtime boundaries.
- No `Math.random`, wall clock, filesystem, network, or database access inside engine logic.
- Preserve canonical terminology and immutable submitted Strategy Revisions.
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default.
- No game-rule, information-boundary, privacy, runtime, or resource change is authorized by this replacement.

## Sources and Confidence

- HIGH for approved caps, elapsed-time frontiers, carry rules, unchanged bounds, and explicit non-authority: `265-16-SMALL-REPLACEMENT-APPROVAL-20261010.md`.
- HIGH for failure classification and limits of inference: `265-16-POST-V14-RESOURCE-WINDOW-diagnostic-v15-5-TERMINAL-VERIFICATION-v1.md`; `v15-5-missing-attribution.md`.
- MEDIUM for reuse opportunities and architectural fit: static inspection of `scripts/run-v1-38-lean-baseline.ts`, `scripts/lib/v1-38-lean-baseline.ts`, `scripts/lib/v1-38-lean-baseline-match.ts`, and `scripts/lib/v1-38-lean-startup-supervisor-v8.mjs`. No runtime or tests were run.
- Main uncertainty: whether a compact, non-Match probe can be admitted through existing supervised runtime authorities without introducing a second executor or weakening existing authority joins. The implementation review must answer this before any probe dispatch; otherwise stop without a Match.
