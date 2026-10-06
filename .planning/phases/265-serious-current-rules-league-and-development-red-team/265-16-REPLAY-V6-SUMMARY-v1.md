---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: replay-v6-source-first
subsystem: private-lab-control
tags: [replay, admission, startup, custody, source-only, tdd]
status: source_only_implemented
execution_authorized: source_only
empirical_credit: false
phase_complete: false
requirements-completed: []
requires:
  - phase: 265-16-replay-validation-source-only
    provides: validation-only full-frame replay parsing and preserved historical decoder
provides:
  - Exact additive v6 admission, request, startup, publication, retained-check and clock joins
affects: [265-16-source-review, 265-16-validation, 265-16-source-verification]
tech-stack:
  added: []
  patterns: [strict allocation reconstruction, finite predecessor custody, identity-bound publication]
key-files:
  created:
    - scripts/run-v1-38-lean-replay-validation-v6.test.ts
    - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-REPLAY-V6-POLICY-v1.json
  modified:
    - packages/strategy-lab/src/league/lean-experiment.ts
    - scripts/run-v1-38-lean-correction.ts
    - scripts/run-v1-38-lean-correction.sh
    - scripts/lib/v1-38-lean-container-match-session.ts
    - scripts/lib/v1-38-lean-experiment-authority.ts
    - scripts/lib/v1-38-lean-baseline-match.ts
    - scripts/lib/v1-38-lean-baseline-source.ts
    - scripts/lib/v1-38-lean-correction-retained.ts
key-decisions:
  - Reuse sealed v5 startup control and harness; v6 broker changes only exact wire identity labels.
  - Preserve snapshot bytes and bind each v6 publication separately to allocation, route, source, HEAD and snapshot roots.
  - Do not infer a stop record from the historical v5 empty ledger.
duration: 12min
completed: 2026-10-06
---

# Phase 265 Plan 16: replay-v6 source supplement

Exact v6 admission and identity-bound startup/publication/retained joins now consume the full-frame replay validator without changing legacy decoder, caps, defaults, policy or startup control.

## Authority and remaining gates

All four source implementation tasks are implemented. The independent source review and bounded fixes → validation of fixed source → independent source verification remain PENDING, owned by MAIN. Task 4's independent-gate done criterion is therefore not yet satisfied. This is not plan-wide verification or Phase 265 completion, and no LEAG requirement is credited. MAIN must not prepare new empirical artifacts or enter either route until those gates pass.

No helper, subprocess, worker, provider, Strategy execution, Match execution, allocation preparation, MAIN entry, empirical reader, historical replay payload or real historical gzip was invoked. Only trusted tiny synthetic replay fixtures, static source builders, mock resource samples, publication fixtures and capability-layer claims were used. Source inventory computation imports inert code only.

## Source closure

Implementation HEAD: `5466a9d0` (before this summary-only metadata commit).

- v6 source manifest: `sha256:b0aed8f88f1a2e81e3f9e54ee80461127fe157682b1f7b169a6e4bbd33b5cba9`, 892 entries.
- Approval raw root: `sha256:4372b0337c16545738937f4a92f5a21cf25973ae0b6b650e5c26d7e14e8f8932`.
- Supplement raw root: `sha256:4b2f7426e91d842b64ea41af63381fdc60f9a3e843ce651745757ee58b97bc21`.
- Inherited policy: `sha256:6fb977996ee40e7b3ce239c75b3d27dedb4c3e63b95c57a4c40a0e3d6b4ce1d2`.
- Unchanged v5 harness: `sha256:ce33dc1d4eaba6eed31362f533a4dcc2e2b6091f16b5c34efae085af1e7188f2`.
- v5 broker: `sha256:a1683867437aba61cb36b9e423e9bd9239239ce5eb80149b4f50525266e0eed0`.
- v6 broker: `sha256:f0bae8c20258bea3c3a85ac43581d3ef586657d315cec37ecb48c6a51d8d60f3`.

The v6 closure pins the plan, 20261006 approval, policy artifact, new fixture, unchanged v5 compatibility fixture and all consumed runtime builders. The v5 manifest definition remains unchanged; its current computed root necessarily reflects edits to shared source and is not a rewrite of previously consumed manifest/artifact bytes. No old reservations, locks or historical stores were staged.

## Synthetic results

- Focused v6 + unchanged v5 replay suites: **148/148 passed**, no skips; v6 78 and v5 70.
- Real production allocation admission, diagnostic/baseline selection, all-frame malformed-late-frame rejection, cap/root/extra-field refusal and legacy decoder compatibility.
- Exact disjoint CLI paths, v6 intent roots, setup witness and every current-turn millisecond carry.
- Finite exact predecessor roots/24 carried charges/33,812,347-ms close at 1791242322180; empty new-charge ledger accepted without a stopped predicate.
- v6 startup origin binding and broker identity round-trip to exact v5 bytes; generic factory/planner startup scalar refusal.
- Actual authority issuer and sequential factory → planner → session claims with v6 descriptor, single-use/order rejection; **no runtime provider construction or invocation**.
- Both new-source baseline and reused-source diagnostic publication/readback consumers; source bytes preserved, foreign HEAD/proof rejection.
- Conservative rounded effective reader-close/gap admission.
- Strategy-lab package noEmit passed. An in-memory Node-typed script TypeScript diagnostic pass found no diagnostics in changed source/fixture files; it is not a claim that inherited standalone-script diagnostics elsewhere are clean.
- Diff whitespace check passed; no tracked files deleted; no stub markers found in inspected source.

## Task commits

1. Allocation/caps/selector/carry: RED `bf9433b4`, GREEN `87b58274`.
2. Request/CLI/source-manifest/finite custody: RED `0fca1f87`, GREEN `6adcfc14`.
3. Startup authority/publication identity: RED `977afa65`, GREEN `cd346998`.
4. Retained effective clock/publication joins: RED `dc7079e5`, GREEN `ca5f2e61`.

Additional focused closure: `dac44d8c` publication readback/setup carry plus authority publication admission, `7c400bd0` real capability-layer regression, `5466a9d0` inherited policy raw-root pin.

## Inspected unchanged seams

`run-v1-38-lean-baseline.ts` already selects fully admitted allocation caps and carries allocation/source/HEAD through its parent.
`v1-38-factory-supervised-runtime.ts` and `v1-38-planner-supervised-runtime.ts` already claim the exact unforgeable authority in order and pass it to the session. Their scalar-refusal regression plus direct v6 capability-layer claims cover the unchanged seam; neither implementation was edited.
`v1-38-lean-startup-supervisor.mjs` stays byte-identical. The v6 broker builder reuses the original builder and changes only origin schema/request-prefix labels; the inert round-trip regression proves the rest of its generated bytes identical.
`v1-38-lean-baseline-pipeline.ts` already routes every source through injected freezeSource/publication callbacks and admitted allocation identity. It remains untouched; both callback targets now have direct positive/negative publication/readback regression coverage. No generic pipeline fallback was added.

## Deviations and limitations

- Parent explicitly assigns independent gates and shared STATE/ROADMAP/requirements management to MAIN. No independent review/validation/verification or planning advancement is claimed by this executor.
- The source-only summary stays `source_only_implemented`, not complete, because Task 4's independent gates remain pending.
- Full buffered inflation, 4× guard, complete audits, guest 1,000/host 5,000/startup 2,500/cancellation≤100/Match 600,000-ms bounds remain unchanged. Synthetic checks prove neither RSS feasibility nor that 36 Matches fit.
- Fixed 43,200,000-ms/15,000,000,000-byte/300-Match cumulative caps carry 36,151,532 ms at 1791247033529 and 24 prior charges; every later cost counts. No reset/refund/recredit.
- Only the approved one fresh v6 diagnostic may be considered after ordered gates/new data review/immutable committed allocation/fresh same-process capacity. At most one new 36-Match baseline follows full acceptance of that new diagnostic and fresh capacity. Failure/refusal ends the envelope.
- No freeze, formation, holdout, public, counted, production or Phase 265 credit.

## Self-Check: PASSED

All listed created files and source commits exist; focused suites pass; no material implementation stubs or tracked deletions. Independent source gates remain pending, not passed.
