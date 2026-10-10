# Plan 265-16 Supplement — Single Failed-Case Startup Correction

**Status:** `blocked_window_closed`; planning handoff only. ROOT has closed new runtime admission as infeasible; there is no extension. Do not use the remaining time for implementation, allocation, entry, or runtime dispatch without the prospective source-time decision below.

**Authority:** `265-16-SMALL-REPLACEMENT-HOUR-APPROVAL-v1.md`, anchored 2026-10-10T13:58:19Z.

**Diagnosis:** `.planning/debug/private-probe-v1-failure.md`.

**Source frontier:** 2026-10-10T14:27:19Z. **Hard stop:** 2026-10-10T14:58:19Z; preserve terminal/verification reserve.
**Working basis:** runtime admission has been closed prospectively because the repair and required gates cannot fit before the source frontier. This does not mean the clock has already reached either deadline. Further implementation requires an explicit prospective source-work time allocation (a reserve reallocation or a new bounded window), then the existing fixed-source and execution gates; never reset accumulated time, resource use, or charges. No repeat exact route literal is required within the already-approved one-case correction scope.

## Objective and scope

The diagnosed repair and all required gates are not feasible before the existing source frontier. The source diagnosis confirms private-probe dispatch selected the legacy broker: it bound a 1000 ms lifecycle timeout and did not separately enforce the allocated 2500 ms startup limit. This is a source-contract defect, **not** proof it caused the consumed `system_failure` or `cleanupComplete=false`; preserve both actual causes as unknown. No runtime correction attempt is admitted in this window.

Keep the consumed v1 allocation, entry, result, refusal, old store, and failed probe bytes immutable. Do not resume that store, reuse its capability, retry through legacy dispatch, or attempt ordinals 1–3. Once a prospective time allocation is approved, recheck this existing plan before implementation; the only candidate correction remains one invocation matching the original failed ordinal-0 descriptor under a fresh v2 allocation, fresh unique root/store, and newly committed fixed source HEAD. Carry forward the immutable v1 allocation/result roots, its one already-charged ordinal-0 attempt, and the measured allocated bytes of its retained files into v2 capacity/cost accounting; missing byte measurements fail closed, never imply zero. Preserve 1000 ms guest, 2500 ms startup, 5000 ms host, 3 GB RAM, 15 GB total disk and all other approved caps/carry. Zero Match calls. This cannot establish runtime feasibility beyond this case, explain the old physical cause, satisfy LEAG, or claim a baseline/freeze.

## Ownership and bounded change set

These are the only permitted existing source/test paths (10); no engine, runtime package, container image/provider, authority consumer outside these paths, or broad/focused test suite mutation:

- `scripts/lib/v1-38-lean-experiment-authority.ts` and `.test.ts`
- `scripts/lib/v1-38-factory-supervised-runtime.ts` and `.test.ts`
- `scripts/lib/v1-38-planner-supervised-runtime.ts` and `.test.ts`
- `scripts/lib/v1-38-lean-container-match-session.ts` and `.test.ts`
- `scripts/run-v1-38-lean-private-probe.ts` and `.test.ts`

If a future window is approved, permitted new durable outputs remain only the already-authorized `.planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json`, the already-enumerated existing six v1 result/review/validation/summary notes, and a fresh private store. No new helper, framework, runner, permanent report family, or plan number. This plan adds no report or allocation now.

## Tasks and gates

### Task 1 — Add a probe-only startup grant and select the existing V8 path

**Files:** authority + authority tests; factory + factory tests; planner + planner tests; session + session tests (eight paths above).

**Action (future-window implementation only):** In `v1-38-lean-experiment-authority.ts`, keep `LeanPrivateProbeRuntimeAuthority` and its WeakMap state disjoint from `LeanRuntimeAuthority`; add opaque `LeanPrivateProbeStartupGrantV1` plus a grant WeakMap minted only by `recordAndIssueLeanPrivateProbeRuntimeAuthorityV1` after v2 allocation/debit authentication. Define `LeanPrivateProbeStartupBindingV1` with exact fields `schemaVersion`, `allocationRoot`, `allocationDigest`, `debitDigest`, `debitOffset`, `executionOwnerId`, `ordinal: 0`, `requestRoot`, `method`, `inputRoot`, `sourceRoot`, `executableRoot`, `image`, `tupleId`, `tupleRoot`, `runtimeLimitsRoot`, `policyRoot`, `harnessRoot`; it has **no** `seat`, `chargeRoot`, Match ID, or scalar timeout. Set policy/harness roots from the existing V8 policy and `buildLeanStartupWorkerHarnessV8()` bytes, not caller input. Replace the probe claim's bare-binding return with exact operational API `claimLeanPrivateProbeRuntimeAuthorityV1(authority, binding, layer): { binding: LeanPrivateProbeBindingV1; startup?: LeanPrivateProbeStartupGrantV1 }`; at each `factory`, `planner`, and `session` layer it checks the same canonical probe binding, consumes exactly that layer in order, and returns the same opaque V8 grant only for the v2 correction authority. The grant descriptor is obtainable only through `describeLeanPrivateProbeStartupGrantV1(grant)` and is immutable/non-serializable; its WeakMap identity binds the exact startup binding and fixed limits 2500/1000/5000. No API accepts caller-supplied startup milliseconds, policy/harness roots, or a legacy `LeanRuntimeAuthority`.

In factory, pass the returned opaque grant explicitly to planner's private option `privateProbeStartupGrant`; reject any caller-originated grant unless its WeakMap identity matches the factory claim. Planner performs the `planner` claim and propagates that same grant to the session. Session performs the `session` claim, constructs `LeanPrivateProbeStartupBindingV1` from the authenticated probe binding plus fixed policy/harness constants, and compares every descriptor field. Any startup protocol binding must retain exactly the non-Match fields listed above—never synthesize Match `seat`/`chargeRoot` or call `claimLeanStartupAuthorityV8`. Use existing `buildLeanStartupWorkerHarnessV8`, startup supervisor, and bounded exchange with 2500 ms startup, 1000 ms guest, and absolute 5000 ms host deadline. The V8 origin is transiently validated against the exact probe binding and discarded; persisted probe output remains the current schema (`guestStartup: "unknown"`) with aggregate cleanup only. Do not add lifecycle/cleanup receipt fields. **Implementation blocker:** before source edits, demonstrate by static contract tracing that the existing V8 worker/broker can be bound to this non-Match envelope without synthesizing Match fields or adding a second executor. If it cannot, stop and report infeasible; do not invent a compatibility binding, widen ownership, or proceed to allocation/entry. Keep the legacy branch untouched and reject absent/mixed/replayed grants before provider construction. This specifies issuer, all three claim APIs/hand-offs, and session contract while explicitly blocking on unresolved V8 wire compatibility.

**Behavior tests (only if the implementation blocker is first resolved inside the 10 paths):** valid v2 grant traverses exact factory → planner → session claims and reaches existing isolated V8 dispatch with the exact non-Match startup binding; legacy/default and Match branches remain unchanged; authority cannot be reused/substituted; each ceiling is independently enforced; missing, mixed, out-of-order, serializable/caller-fabricated grant, binding mismatch, or caller startup scalar rejects before provider construction. Existing persisted result remains unchanged. Tests are inert: no Docker, provider, strategy, or Match launch.

**Verify (only after new window authorization):** `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts`.

### Task 2 — Make v2 exactly one fresh corrected case, preserving current uncertainty semantics

**Files:** runner + runner tests, plus the four files in Task 1 only if its tests expose a necessary boundary seam.

**Action (future-window implementation only):** Preserve v1 parser/schedule/store/result semantics for forensic verification. Add an exact-key v2 allocation schema/path with exactly one descriptor copied from immutable v1 ordinal 0 (same method and source/request/input roots); use a new source HEAD and root. Preparation, admission, entry, ledger, and read-only verifier enforce v2 cardinality one and canonical root/store identity, and join v1 allocation/result roots plus the measured retained v1 allocation bytes to the v2 carried-cost snapshot/capacity check. A v2 run, if later admitted, charges once durably before invocation, issues the probe-only V8 grant above, dispatches once, closes once, and terminalizes; no later ordinal loop, fallback legacy call, retry, Match, or second allocation. **Do not add lifecycle or cleanup subcheck receipt fields/framework.** Retain current finite result schema and trusted aggregates: `guestStartup: "unknown"` remains unknown, `cleanupComplete` remains the existing aggregate result of stream-close success, clean removal, exact owned-container absence, and no startup-cleanup uncertainty. Do not infer which predicate failed, upgrade false from a later absence check, or attribute the old consumed failure. No raw errors, stderr/stdout, source, request/input/output, memory, or objective payload.

**Behavior tests:** unchanged v1 remains four cases and validates the old immutable result; v2 accepts exactly one matching failed case and rejects zero/multiple/reordered/changed descriptors, reused root/store, wrong allocation path, missing/mismatched debit, v1 cost omission, or extra records; failed/unknown/cleanup-incomplete case stops with one attempt and no Match; existing aggregate `cleanupComplete`/`guestStartup: "unknown"` semantics remain intact; verifier is read-only and validates exact v2 store inventory.

**Verify (only after new window authorization):** `./node_modules/.bin/vitest run scripts/run-v1-38-lean-private-probe.test.ts`, then run Task 1's direct Vitest command. Capture inherited strict-TypeScript diagnostics before editing and compare only these 10 owned files afterward; any new diagnostic blocks admission. Run each command separately and report its status; inherited failures remain explicitly disclosed, not treated as green.

## Execution order / authorization boundary

1. **Closed to new runtime admission:** keep source frontier 14:27:19Z and hard stop 14:58:19Z unchanged; neither deadline is retrospectively moved or falsely described as already elapsed. Do not implement Tasks 1–2, edit source/tests, prepare/commit v2 allocation, run an entry/reader/provider/container/Strategy, or dispatch a probe from this unchecked handoff.
2. Further source work first requires an explicit bounded source-time allocation. After that decision, re-evaluate current source/HEAD, all original and v1 probe/file retained costs, capacity, and available terminal reserve; this document is not admission or runtime approval.
3. Only under that new authorization could independent scoped source review, focused tests, source verification, fixed-HEAD confirmation, committed one-case v2 allocation validation, same-process capacity, and unique-entry/current-container-absence checks precede a separate ROOT decision. If any gate fails or is inconclusive, stop before entry. No extension is inferred.
4. If separately authorized and all gates pass, the sole candidate is one fresh v2 ordinal-0 non-Match attempt through existing isolated V8 supervision, with immutable v1 evidence/costs carried and no correction retry. Any ambiguity is terminal unknown; no ordinals 1–3 and zero Matches.

## Goal-backward acceptance

- The old consumed v1 case/result and all prior cost/survivor evidence are byte-immutable; the only permitted new allocation is committed v2 with exactly one corrected descriptor.
- If a correction is admitted, the exact ordinal-0 invocation has one fresh durable debit and can use only the existing isolated V8 supervisor with independent guest/startup/host ceilings; no old Match capability or synthesized Match identity grants it authority.
- Existing receipt semantics remain: `guestStartup` stays `unknown`; `cleanupComplete` is aggregate and does not identify a subcheck. A distinct read-only verifier checks allocation/debit/case joins, cleanup boolean, bounds, carried v1 bytes/costs, and exact inventory.
- At most one corrected non-Match attempt, zero Matches, no ordinals 1–3, no old-store writes, no reset/refund, and no LEAG/baseline/freeze/phase-completion credit.
- If gates or time do not permit safe admission, the correct result is an honest non-success without runtime entry.

## Threat model

| Boundary / threat | Severity | Disposition and mitigation |
|---|---:|---|
| v2 allocation/debit → probe authority forgery or replay | high | Mitigate: exact committed bytes, fresh root, durable one-use debit, request/source/image/limits binding, ordered claims. |
| probe authority → legacy dispatch or Match capability escalation | high | Mitigate: probe-only V8 grant; reject absent/mixed grant; prove zero Match state and preserve default/Match branches. |
| runtime lifecycle → misleading diagnosis or payload disclosure | high | Mitigate: preserve existing finite aggregate receipt; startup attribution remains unknown and aggregate cleanup false stays unattributed; raw content excluded. |
| cleanup/resource exhaustion or elapsed frontier | high | Mitigate: one serial case, existing limits, current capacity and unique-entry checks, hard source/hard-stop cutoffs, no fallback or retry. |
| package supply chain | low | Accept: no dependency/package changes. |

**Final gate:** New runtime admission is infeasible before the unchanged source frontier; no extension exists. This document refines the correction design under existing Phase 265 Plan 16 only and has not passed a new independent check. It is not implementation authorization, allocation approval, source verification, or runtime admission. Handoff is blocked pending a prospective source-time allocation and resolution of the explicit V8 compatibility gap; until then do no source/test/runtime/provider/preparation/entry/reader work. Human approval is needed for time allocation, not for another exact route literal.
