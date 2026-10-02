---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplement: prospective-lifetime-v1
subsystem: private-runtime-admission
tags: [prospective-v2, elapsed-lifetime, private-league, mock-only, tdd]
requires:
  - phase: 265-07
    provides: charged current-rules private league and retained evidence path
provides:
  - separately rooted exact 600000-ms prospective-v2 policy and allocation
  - process-local charged-provider authority with independent once-only nested claims
  - main/response wiring and version-aware capacity/reservation/retained selectors
affects: [265-07-source-review, prospective-private-route]
tech-stack:
  added: []
  patterns: [private WeakMap issuance, separate versioned roots, unchanged absolute clocks]
key-files:
  created: [scripts/lib/v1-38-league-prospective-lifetime.ts]
  modified:
    - packages/strategy-lab/src/league/allocation.ts
    - packages/strategy-lab/src/league/allocation.test.ts
    - scripts/lib/v1-38-factory-supervised-runtime.ts
    - scripts/lib/v1-38-factory-supervised-runtime.test.ts
    - scripts/lib/v1-38-planner-supervised-runtime.ts
    - scripts/lib/v1-38-planner-supervised-runtime.test.ts
    - scripts/run-v1-38-serious-league.ts
    - scripts/run-v1-38-serious-league.test.ts
    - scripts/lib/v1-38-league-response-runtime.ts
    - scripts/lib/v1-38-league-response-runtime.test.ts
key-decisions:
  - Preserve legacy/v1 roots and validate the successor by exact vector comparison, not a raised generic cap.
  - Issue one process-local provider handle after the existing durable Match charge; factory and planner each claim once.
  - Source-only handoff does not satisfy empirical LEAG requirements or grant route dispatch authority.
requirements-addressed: [LEAG-01, LEAG-02, LEAG-04, LEAG-05, LEAG-09]
requirements-completed: []
coverage:
  - id: D1
    description: Exact versioned allocation and capacity admission
    verification: [{kind: unit, ref: "allocation.test.ts#prospective lifetime allocation", status: pass}]
    human_judgment: false
  - id: D2
    description: Nested charged-provider authority and elapsed clock boundaries
    verification: [{kind: unit, ref: "factory/planner-supervised-runtime.test.ts#prospective lifetime", status: pass}]
    human_judgment: false
  - id: D3
    description: Source acceptance after independent review and final-source full gates
    verification: [{kind: other, ref: "root-owned independent review and complete CI gate", status: unknown}]
    human_judgment: true
    rationale: Root-owned review/fixes and final-source full validation are pending; this is only an implementation handoff.
duration: 20min
completed: 2026-10-02
status: complete
completion-scope: source-implementation-subset-only
source-acceptance: pending-review-and-full-gate
---

# Phase 265 Plan 07: Prospective Lifetime Source Implementation Handoff

Separately rooted prospective-v2 admission selects exactly 600000 ms through both private clocks using existing retained Match charge and provider provenance; historical limits remain unchanged.

## Scope and status

The three source implementation steps are done: RED regressions, versioned admission/nested clocks, and existing private host wiring/selectors. **Independent source review/fixes and the full final-source gate are PENDING with the root.** Task 3's full acceptance criteria therefore remain pending, not passed. `status: complete` describes this bounded code-only handoff, not Plan07 empirical completion, phase completion, LEAG completion or source certification. No new numbered plan/count was added.

The executor ran no Docker, real provider/model, Strategy execution, measured host capacity, empirical allocation, empirical CLI route or retained verifier. Synthetic documents/charges and test-only temporary repositories are not canonical experimental evidence. All historical allocations/results, the empty immutable v8 result and unrelated locks/untracked entries remain untouched. Existing265-07-SUMMARY.md and shared STATE/ROADMAP/REQUIREMENTS are unchanged; the root owns their bookkeeping.

## Performance and fixed source

- Start: 2026-10-02T15:13:44Z; handoff prepared approximately15:33UTC.
- Source implementation HEAD: `2d0462fb8ba59e4b599ca110a7d89991357f7ac9`.
- Diff from `47ad36506bec2c60842baa7f596286833b25ba9c`: exactly11 declared source/test files,397 insertions/38 deletions; no file deletions.
- Current implementation root: `sha256:5efde68d449d3305bc7033a2f6c8bf535c60378aecbaab1c494447d62923b50b`.
- Current reviewed-source-bytes root: `sha256:75fbe4f1a8a877b5d0353ba5eb39e2d94d10cfa8190e4960f701b756b09d666e`.
- Roots are a read-only inventory snapshot, **not** independent review acceptance or dispatch permission. Any subsequent review fix requires new final-source roots/gates.

## Task commits

1. `502af0d6` — test(265-07): add failing prospective lifetime admission regressions.
2. `6b0e7a85` — feat(265-07): admit exact prospective v2 lifetime at both clocks.
3. `2d0462fb` — feat(265-07): wire charged private providers and v2 selectors.

All commits used ordinary Git commits without hook bypass, broad staging, stash, reset or push. This summary is committed separately before handoff narration.

## Accomplishments

- New policy/amendment/allocation exports use exact v2 discriminators, domain-separated roots and exact lifetimeApproval265-PROSPECTIVE-LIFETIME-APPROVAL-20261002. They preserve baseline decision06cdb050 and all existing history/base/final-gate pins. Only perMatchMilliseconds differs; legacy shape cap and historical prospective-v1 remain120000.
- Capacity plans/receipts/costs and producer checks re-admit the explicit prospective version. Existing formulas/floors/margins and receipt schema stay unchanged; old receipts cannot join v2 allocations by matching numeric estimates.
- Private helper binds allocation/amendment/source/implementation roots, retained charge, Match, seat, attempt/budget, actual factory authorization/packet/proposal/validation/source/executable/revision, tuple/runtime/image and container identity. Copied/forged/crossed/reused handles fail; each nested layer claims once. No serialized authority-token artifact, separate signing/custody system or repeated approval was added.
- Factory retains its clock before nested creation plus pre/post-invoke checks. Planner retains its clock before session setup and existing checking behavior. Exact boundary cleanup, setup and awaited retention are covered with clocks/mocks. Ordinary defaults remain120000, diagnostic-v4 remains240000, planner benchmark retains3600000 endpoint/prerequisites; retired grants still fail.
- Main issuance follows durable recordLeagueCellStart plus graph cell-start. Response issuance follows response-match-start; measured attemptRoot remains the red-team start and opposing attemptRoot remains chargeRoot for every arm, including equal-source self-play. The six side/purpose representatives exercise both seats and score/independence_left/independence_right; enumeration still asserts the full72-condition product.
- Existing preparation, initial-candidate, capacity, session, reservation, execution, CLI and retained branches use the admitted prospective predicate; prepare-prospective chooses the creator by exact amendment discriminator, never upgrades historical input. Retained v2 checks current implementation/source and provider joins. Conservative source inventory includes every changed production file/helper with exact byte hashes; each changed inventory entry changes implementation/source roots.

## Actual verification sessions

Focused command (all groups injected/mock-only):

```sh
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.test.ts -t 'prospective lifetime'
```

| Session | Result | Grounded observation |
|---|---|---|
| 98481 | RED,exit1,7.72s;8failed/212skipped | Old policy rejects v2 document; factory unexpectedly reaches the mocked constructor on forged options; planner ignores forged/partial options. Not missing-module-only failures. |
| 20588 | intermediate,exit1 | New claims exposed a seat-check omission and an invalid test input; both corrected within declared files. |
| 8904 | GREEN,exit0,17.97s;19passed/238skipped | Exact allocation, nested claims, setup/retention and planner-clock groups pass. |
| 53445 | intermediate,exit1,75.30s;2failed/21passed/238skipped | Repeated exact admission across all72 response fixture conditions exceeded5-second per-test timeout; narrowed provider-claim samples to six side/purpose representatives while retaining full enumeration assertion. No production limit changed. |
| 40355 | FINAL focused GREEN,exit0,26.90s;23passed/238skipped,5files | Includes main retained-charge join, response arm/self-play claims and conservative production source-inventory assertions. Imported fixture suites repeat some tests; counts are not distinct empirical cases. |

Strict touched production types:

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-league-prospective-lifetime.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/run-v1-38-serious-league.ts scripts/lib/v1-38-league-response-runtime.ts
```

Session66090 initially found one changed type-predicate narrowing error; fixed. Session86863 passed. Final session48446 passed exit0 on committed production bytes. `git diff --check` passes.

An extra direct strict check including factory/planner test files (session28163) failed: newly required matchId in pure admission and one new transport argument were corrected. It also reported existing feasibility-protocol/planner-missions JSON/undefined issues and historical factory test option omissions. Those unrelated modules were not repaired; this broader invocation is **not claimed passing**. Root's prescribed final-source commands remain authoritative.

## Deviations and deferred acceptance

- [Rule1 — Bug] Authority claim now rejects a supplied crossed seat instead of overwriting it with the issued seat; included in6b0e7a85 and verified by negatives.
- [Rule3 — Blocking] Synthetic response provider claims sample the six distinct side/purpose combinations rather than repeated admission for every arena/opponent/initiative cell. Full enumeration remains tested; no runtime/resource/coverage gate was relaxed.
- Root ownership explicitly limits this executor to focused mock tests and touched production types. Independent review, bounded review fixes, the unique complete eight-command CI gate, package-scoped engine/runtime/core/build checks, boundary scans and empirical progression are deferred to root. None is claimed passed here.
- Requirements are listed as addressed, not completed: source plumbing cannot award LEAG-01/02/04/05/09 empirical credit. No shared planning state/counters were mutated.

## Known stubs and threat surface

No new goal-blocking source stub or disconnected production data source was found. Empty/mock values occur in deliberately synthetic test fixtures or unchanged failure state, not a prospective production placeholder.

The helper adds a private process-local issuance surface at the existing allocation→charged-provider→runtime boundary, covered by T-265-LT-01 through05 in the plan. No new endpoint, auth scheme, public export, persistence schema at a new trust boundary, dependency or engine-rule surface is introduced.

## Self-Check: PASSED

All six changed production files and five test files exist; commits502af0d6/6b0e7a85/2d0462fb exist in Git history; no tracked deletion is present and diff whitespace checks pass. This summary is a new supplement artifact, not a replacement of any existing summary/evidence.

## Next action

Root: independently review the exact committed diff and source joins; apply any bounded fixes; run one unique full eight-command gate and specified scoped regressions/build on **final reviewed source**. Only afterward may root conditionally prepare a distinct immutable v2 route and fresh passing same-process capacity. No entry/verifier, consumed-history reuse, LEAG/freeze/formation/holdout/public/counted/production authority follows from this handoff.
