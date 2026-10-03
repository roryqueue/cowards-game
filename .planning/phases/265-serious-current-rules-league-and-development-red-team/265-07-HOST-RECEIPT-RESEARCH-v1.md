# Phase 265 Plan 07 — Prospective Host Response-Receipt Allowance Research

**Researched:** 2026-10-02  
**Scope:** Exact prospective private host response wait 1,000→5,000 ms; leave the guest execution limit at 1,000 ms and approved per-Match elapsed limit at 600,000 ms. Existing Plan 265-07 supplement only; no new numbered plan or ceremony chain.  
**Confidence:** HIGH for the local source/data flow and approved scope; MEDIUM for the smallest safe versioning design until the source diff and independent review settle exact names/schema.

## User Constraints

- The human approved an exactly 5,000 ms private host response-receipt deadline separate from the unchanged 1,000 ms guest execution deadline. Keep the approved 600,000 ms private per-Match lifetime and every other setup/cleanup, overall-run, CPU, memory, invocation, Match, attempt, accounting, retention, capacity, gameplay, privacy, holdout, and formation bound unchanged. No promise that the allowance suffices; an ambiguous host timeout is not a Strategy failure. [CITED: `265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md`]
- Implement only through the existing Plan 265-07 research/checked-plan-supplement/execute/review-fix/validate/verify flow, using a distinct prospective private policy. Legacy policies, defaults, public/production paths, and consumed allocations/results/diagnostics/authorities/verifiers remain immutable. [CITED: `265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md`]
- V11 and its unique retained verifier are closed process-invalid; never resume, retry, refund, replace, reinterpret, or recredit them. The recorded evidence is one `stream_exchange/wait_timeout` at `soldierBrain` ordinal 172; the reason the broker did not return on time is unknown. [CITED: `265-v11-system-failure.md`; `265-07-HOST-RECEIPT-DECISION-v1.md`]
- Route approval does not waive independently reviewed fixed source, applicable passing source gates, a fresh immutable allocation, a checked empty private store, or fresh passing same-process capacity before charge/dispatch. Source remains fixed through terminal and one unique retained verification. No public/counted/production/holdout/formation authority follows. [CITED: `265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md`]
- Project rules: preserve deterministic game rules and current runtime boundary; do not execute Strategy source in the coordinator/API; validate untrusted runtime boundaries; distinguish Strategy failure from system failure; keep public/private payloads separated; commit planning docs. [VERIFIED: `AGENTS.md`]

## Summary

The current source has distinct guest and host-side timing layers but carries one timeout value through the persistent-stream call. The broker request's `q.timeoutMilliseconds` creates the broker-side deadline; V1.17 additionally receives separate `methodWallMilliseconds`, startup, and cancellation-grace values, and enforces the method wall clock with `Atomics.wait`. The parent stream exchange also waits using `timeoutMilliseconds`. In the current V1.17 adapter path, that broker deadline is built from startup + guest method + cancellation grace, while the outer stream wait receives the same aggregate. [VERIFIED: local source — `scripts/lib/v1-38-lean-container-match-session.ts:106-123,193-210,267-280`; `packages/runtime-js/src/container-subprocess-adapter.ts:267-278`]

The smallest semantic change is therefore not to raise the broker/guest deadline. Introduce a separately admitted 5,000 ms *outer response-receipt wait* for the explicitly authorized prospective private path, while preserving the broker request's existing lifecycle deadline, V1.17 `methodWallMilliseconds`, startup/cancellation limits, all termination receipts, frame validation, and cleanup semantics. Existing ordinary/default/legacy calls continue passing their present wait values. A missing response after 5,000 ms remains a transport/system failure; only the existing authenticated V1.17 timeout receipt may enter its existing guest-timeout classification. [VERIFIED: local source — same locations; `packages/runtime-js/src/candidate-subprocess-observation.ts`]

**Primary recommendation:** Add a rooted successor to the already-existing prospective-lifetime V2 policy/allocation (a prospective V3 is the clearest option) that differs only by the explicit `hostResponseReceiptMilliseconds: 5000` policy field. Issue an opaque, single-use receipt-wait authority only from that admitted allocation and exact durable cell/response Match start; require it at both main and response provider construction. Keep the 600,000 ms Match authority and 1,000 ms guest timeout independent. Never widen a general scalar/default or mutate V1/V2.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Prospective wait-policy admission | API / Backend (private coordinator boundary) | Database / Storage (rooted retained records) | `allocation.ts` owns exact schema/vector admission; immutable roots and retained start evidence authorize dispatch. |
| Broker guest execution/cancellation | API / Backend (supervision coordinator) | Browser / Client — | Strategy stays in the isolated worker/container boundary; planner selects the 1,000 ms guest timeout. |
| Host receipt wait | API / Backend (private runtime supervisor) | Database / Storage (diagnostic/terminal retention) | The parent persistent-stream `Atomics.wait` is the outer wait; only this deadline gets the new allowance. |
| Failure classification and retained verification | API / Backend | Database / Storage | Authenticated guest timeout receipts, ambiguous transport failure, charged invocation evidence, and reopened roots must remain distinct. |

## Existing Source Path

| Concern | Current behavior | Planning consequence |
|---|---|---|
| Allocation versioning | `allocation.ts` has legacy V1, prospective measurement V1, and current lifetime-successor V2. V2 binds the 600,000 ms per-Match policy while checking all other V1 values by exact projection/equality (`allocation.ts:109-112,174-209`). | Add an explicit successor bound for the new receipt allowance. Do not edit the V1 or existing V2 constants/admission meanings. Include the new 5,000 ms field in the rooted exact policy/vector and retain all other fields byte-for-byte in value. |
| Authority model | `v1-38-league-prospective-lifetime.ts` issues a non-serializable WeakMap-backed handle after the charged start, binds allocation/amendment/runtime/provider identity, and requires factory then planner claims (`:16-55`). | Extend with a distinct host-receipt authorization/schema or a carefully versioned successor authority. Bind policy/allocation root, amendment root, source/implementation, exact charge/start, seat, Match/container/owner, provider runtime identity, and one-use claim. Do not treat a numeric 5000 option or structurally forged object as authority. |
| Outer stream wait | `LeanContainerPersistentStream.exchange` takes a single `timeoutMilliseconds` (`lean-container-match-session.ts:20-24`). `transact` passes it to `Atomics.wait`; timeout creates trusted local `stream_exchange/wait_timeout` origin (`:193-202`). | Separate the exchange-wait argument from the broker's `q.timeoutMilliseconds`. Apply 5,000 only when host-receipt authority has been claimed; avoid changing `close()`'s cleanup timeout or default stream behavior. |
| Broker deadline and guest ceiling | Broker `runLegacy`/`runV117` set a deadline from `q.timeoutMilliseconds` (`:106-123`). V1.17 uses its own method wait, terminates on expiry, and emits its existing host envelope; adapter request uses `methodWallMilliseconds: guest.timeoutMs` and computes aggregate broker timeout from startup + guest + cancellation (`container-subprocess-adapter.ts:267-278`). | Keep `q.timeoutMilliseconds`, `guest.timeoutMs`, startup and cancellation values unchanged. The new 5,000 ms must not be written into the request frame or passed as guest method/lifecycle deadline. |
| Failure classification | Selected legacy planner configures runtime `timeoutMs: 1000`. A thrown exchange error is caught in the V1.17 lane and mapped to `system_failure/TRANSPORT_CRASH`; a valid authenticated guest envelope continues through `observeCandidateSubprocessV117`. Planner preserves trusted diagnostic origin, charges before dispatch, and closes on system failure. | Preserve existing classifications: authenticated V1.17 D is `system_failure/TIMEOUT`, not a newly inferred Strategy failure. Do not convert `ETIMEDOUT`, `wait_timeout`, absent envelope, malformed frame, uncertain termination, or unproven late receipt into guest timeout; ambiguous receipt accounting remains ambiguous. |
| Main provider | `LeagueConnectedSession.execute` writes the durable cell start before issuing prospective authority, then constructs/wraps the provider (`run-v1-38-serious-league.ts:446-484`). | Add authority only for the new admitted allocation version and after the existing durable charge. Keep invocation retention-before-return and current closure checks. |
| Response providers | `produceLeagueResponse` appends `response-match-start`, creates separate measured/opponent identities, and issues prospective authority before factory construction (`v1-38-league-response-runtime.ts:191-222`). | Cover score and both independence arms, both seats/self-play, and their existing measured-attempt vs Match-charge roots. Do not alias provider authority or overwrite attempt roots. |
| Retention/reopen | Existing code binds invocation records and retained starts to exact roots; the approved Plan 07 supplement keeps bounded retained reads read-only. | Teach all selectors and retained checks the new discriminator; reject stale, wrong-version, wrong-duration, crossed-start/seat/provider, source-drift, or missing authority. V1/V2 evidence must retain old meanings and cannot validate as the successor. |

V11 status boundary: the entry root is `17028`; its unique retained verifier `72861` closed `issued=false`, `requirementsComplete=false`. Only finite wait-timeout metadata was observed at soldierBrain ordinal 172. This is not evidence of a guest timeout, nor proof that any particular source subsystem caused lateness. Preserve the closed process-invalid result without reopening its raw/private payloads. [CITED: `.planning/debug/265-v11-system-failure.md`; `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-DECISION-v1.md`]

## Minimal Prospective Implementation Path

1. In `packages/strategy-lab/src/league/allocation.ts`, add a new exact amendment/allocation discriminator and immutable policy successor on top of the current 600,000 ms lifetime policy. Bind exactly `hostResponseReceiptMilliseconds: 5000`; require every other allocation, resource, gameplay, retention, capacity, privacy, attempt and run field to match the current approved values. Keep `LEAGUE_APPROVED_PROSPECTIVE_POLICY`, its V2 successor, and all existing admission functions unchanged in semantics. Update shared union admission intentionally; unknown and ambiguous discriminators fail closed.
2. In `scripts/lib/v1-38-league-prospective-lifetime.ts` or a narrowly separate companion authority module, add opaque single-use host-receipt authority for the successor. Issue it only after the retained charge/start in the existing two constructors. Bind allocation/amendment/implementation/source roots, charge/start root and exact body, seat, Match/container/owner, runtime/factory identity, and exact 5,000 value. Claim at the trusted runtime layer; reject stale, forged, serialized, copied, reused, cross-allocated, crossed-seat/provider, or altered authority before dispatch. Keep the 600,000 lifetime grant distinct from receipt-wait authority.
3. In `scripts/lib/v1-38-lean-container-match-session.ts`, split the broker/lifecycle timeout from the parent stream's response-wait timeout. The broker request retains its current `q.timeoutMilliseconds`; only `stream.exchange(...timeoutMilliseconds)` may receive 5,000, and only after trusted admitted authority. Historical callers, legacy requests, injected non-authoritative caller options, stream startup, close, cleanup, frame-size and cancellation grace behavior remain unchanged. Preserve the origin map as constructor-issued diagnostic provenance; injected stream objects cannot mint a trusted timeout origin.
4. Thread this exact value/authority through `PlannerSupervisedRuntimeOptions` and the two existing providers: `LeagueConnectedSession.execute` and `produceLeagueResponse`. The default planner remains guest 1,000 / unchanged host wait; no public or production constructor receives a configurable 5,000 scalar. Preserve charge-before-dispatch, invocation-before-return durability, settlement, cleanup, and failure classification.
5. Update allocation selectors, producer/admission checks, run/prepare/preflight/capacity paths, main/response provider factories, and retained verifier so the successor cannot inherit authority through structural compatibility. Add immutable-root joins for policy, allocation, current implementation/source closure, capacity/reservation, start records and charged provider identities. Do not modify/recompute V11 or any consumed result/authority/verifier.

Expected implementation complexity is **medium-high**: the timer split is localized, but safe version routing crosses allocation unions, capability issuance/claims, two provider creation paths, producer assertions, retained verification, and Phase 265 source-closure roots. Avoid solving the latter by broadening current V2 checks or by adding a generic public timeout knob.

## Focused Regression Matrix

Add tests in the existing files, without running Matches or real providers as part of this research:

| Test location | Required cases |
|---|---|
| `packages/strategy-lab/src/league/allocation.test.ts` | Current legacy/V1/V2 behavior is unchanged; new exact prospective successor accepts 5,000 and rejects 4,999/5,001, missing/extra/partial fields, changed guest/per-Match/other frozen bounds, stale implementation/source roots, wrong approval/discriminator, and forged roots. |
| `scripts/lib/v1-38-lean-container-match-session.test.ts` | Injected stream receives host wait 5,000 only when trusted successor capability is present; request frame and broker guest/lifecycle deadline remain their prior values. Model a broker that returns an authenticated guest-timeout receipt after 1,000 but before 5,000 and require normal existing classification; exact 5,000 outer expiry remains `stream_exchange/wait_timeout` + system failure; malformed/no/crossed receipt remains system failure; legacy/default remain unchanged. Use fake clocks/Atomics seams, not actual waits. |
| `scripts/lib/v1-38-planner-supervised-runtime.test.ts` | Selected legacy executor keeps 1,000 ms; alternative V1.17 keeps its actual signed 50 ms method/100 ms cancellation vector and existing aggregate. The 5,000 outer wait requires exact issued allocation/start authority; missing, scalar-only, forged, stale, wrong version, crossed start/seat/runtime, or reused grant fails closed before dispatch. Transport timeout charges an incomplete system-failure invocation and requires cleanup; authenticated receipts retain existing trust and classification. |
| `scripts/lib/v1-38-factory-supervised-runtime.test.ts` | No bypass through numeric factory lifetime, benchmark, diagnostic-v4, fixture/injected transport or stream overrides. Keep 600,000 Match lifetime and per-provider invocation cap unchanged; guest ceiling independent. |
| `scripts/run-v1-38-serious-league.test.ts` and `scripts/lib/v1-38-league-response-runtime.test.ts` | New authority comes only after durable main/response start; both response seats and score/independence purposes are separately bound; crossed measured attempt and charge roots/self-play are rejected; historical allocation variants retain their old wiring; durable invocation/failure-prefix retention, charge/accounting, cancellation, cleanup and source/privacy checks remain intact. |

Exact focused command after implementation:

```bash
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.test.ts
```

Then run the full existing Phase 265 private league source gate verbatim from `.github/workflows/ci.yml` (“Phase 265 private league source gate (no allocation or experimental run)”): the named Phase 265 Vitest suite, tactical corpus suite, strategy-lab TypeScript build, touched-script `tsc --ignoreConfig ...`, serious-league/lab/factory boundary monitors, and `pnpm exec tsx scripts/check-service-boundary-imports.ts`. This is a source-only gate, not allocation/capacity/Match dispatch. Extend that existing CI gate with the new runtime and planner tests if those files are not included in its exact suite. Obtain independent review of the fixed source and run the existing source-closure/gate process before any fresh allocation. The gate is slow (workflow allows 45 minutes); run once per fixed source root and never duplicate a live/completed identical-source gate. [VERIFIED: `.github/workflows/ci.yml:34-45`; current Plan 265-07 Task 1 validation block]

## Failure, Security, and Boundaries

- A 5,000 ms host wait is a response-delivery allowance, not five seconds of Strategy execution. Keep the executor's explicit 1,000 ms guest timeout and broker-side method wall clock unchanged. [VERIFIED: `scripts/lib/v1-38-planner-supervised-runtime.ts:115`; `scripts/lib/v1-38-lean-container-match-session.ts:114-123`; `packages/runtime-js/src/container-subprocess-adapter.ts:267-278`]
- A receipt arriving after 1,000 but before 5,000 is accepted only if the already-existing worker completion/termination and protocol identity checks validate it. Do not treat elapsed time alone as proof of guest timeout.
- If the 5,000 ms outer exchange expires, retain `stream_exchange/wait_timeout` and `TRANSPORT_CRASH`/system-failure disposition; do not fabricate `D` (guest timeout), refund its charged invocation, retry, or allow another request on the poisoned stream. Continue existing cleanup/absence checks and fail closed if cleanup is incomplete.
- Keep request/response exact keys, request ID correlation, frame and output caps, source/memory/resource limits, no-network container posture, source hashes, Match/cell accounting, all invocation/failure-prefix retention, and redacted diagnostics unchanged. Do not log raw Strategy output, source, memory, objectives, or payloads.
- Neither the approved duration nor opaque authority may be accepted from arbitrary callers, serialized records alone, stale roots, inherited/prototype properties, an injected transport, or a public/default path. Validate every boundary before construction and claim once for the bound provider.

## Environment Availability

This research-only pass performed source inspection. It did not run tests, a Match, a model/provider, Docker/container commands, a capacity measurement, or a retained verifier. No new package or external service is required by the proposed change. [VERIFIED: scope of this research pass]

## Known Unknowns / Open Questions

1. The 5,000 ms ceiling is an operator-approved bound, not an empirical guarantee that all broker responses arrive within it. Establish adequacy only through a later separately authorized, reviewed fresh route; do not promise completion.
2. Source proves equal nominal timeout values for the old outer exchange and broker lifecycle deadline, not equal start instants. Selected legacy uses 1,000 ms; the alternative V1.17 signed method vector is 50 ms with 100 ms cancellation grace (`packages/spec/src/runtime-abi-v1-17.ts:19,64`). It does not establish why V11's broker response was late or whether guest/container/host behavior was responsible. The retained record only proves finite `wait_timeout` at ordinal 172. Source execution corrected the earlier cross-ABI wording without changing either guest budget or any existing timeout classification (`packages/runtime-js/src/abi-bridge.ts:484`).
3. The exact successor discriminator and whether the authority is a v3 lifetime-authority schema or a companion receipt-wait capability remain implementation naming choices. The invariant is mandatory: separate rooted private policy; old V1/V2/default/public meanings unchanged; exact start/provider-bound one-use authority; guest deadline unchanged.

## Sources

### Primary local source

- `packages/strategy-lab/src/league/allocation.ts:105-123,142-223` — frozen policy vector, V1/V2 successor, exact admission selectors.
- `scripts/lib/v1-38-league-prospective-lifetime.ts:6-55` — runtime binding, durable-start issue, opaque one-use factory/planner claim.
- `scripts/lib/v1-38-lean-container-match-session.ts:20-31,86-139,193-210,267-310` — stream interface, broker deadlines, host `Atomics.wait`, request parsing, V1.17 mapping, failure origin and poisoning.
- `scripts/lib/v1-38-planner-supervised-runtime.ts:38-75,104-148` — authorized lifetime admission, fixed 1,000 ms executor configuration, charge-before-dispatch and system-failure classification.
- `packages/runtime-js/src/container-subprocess-adapter.ts:267-278` — guest method/startup/cancellation fields and aggregate existing timeout.
- `scripts/run-v1-38-serious-league.ts:446-484` and `scripts/lib/v1-38-league-response-runtime.ts:191-230` — main and response start/authority/provider paths.
- `packages/runtime-js/src/candidate-subprocess-observation.ts` — trusted V1.17 observation classifier.
- `scripts/lib/v1-38-lean-container-match-session.test.ts`, `scripts/lib/v1-38-planner-supervised-runtime.test.ts` — existing injected native timeout, diagnostic-origin, failure-charge, and cleanup tests.
- `.github/workflows/ci.yml:34-45` — exact existing Phase 265 private source gate.

### Approval and history

- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md` — exact approved scope and immutable-history/fresh-route constraints.
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-DECISION-v1.md` — source diagnosis and prior proposal; later approval supersedes its proposal status only.
- `.planning/debug/265-v11-system-failure.md` — closed entry/verifier identifiers, observed finite diagnostic, unknown deeper cause.
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PLAN.md` — existing Plan 07 source gate, retained route, and no-dispatch boundaries.
- `AGENTS.md` — project and runtime/testing constraints.

## Metadata

**Confidence breakdown:**
- Source timing and failure path: HIGH — traced locally through the stream, broker, runtime adapter, and planner.
- Versioned policy/authority proposal: MEDIUM — approval is clear; exact schema/module name should be independently reviewed with the fixed source diff.
- Empirical sufficiency of 5,000 ms: LOW/unknown — not measured or promised.

**Research date:** 2026-10-02  
**Valid until:** 2026-11-01 for stable source paths; recheck exact source roots before implementation or dispatch.
