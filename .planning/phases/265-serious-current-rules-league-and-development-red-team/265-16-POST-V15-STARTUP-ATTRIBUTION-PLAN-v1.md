# Plan 265-16 post-v15 startup attribution source supplement

**Status:** Checked source-plan supplement to existing Plan 265-16; not a new numbered plan and not route authority. Research and closed evidence are in `265-16-POST-V15-STARTUP-ATTRIBUTION-RESEARCH-v1.md` and `.planning/debug/v15-4-evidence-check.md`.

## Objective and boundary

Repair the current source-level pre-GO lifecycle-observation blind spot and retain a finite, private startup-attribution record for prospective invocations. The historical v15-4 initiating startup cause remains **UNKNOWN**; this supplement neither fixes nor reinterprets that consumed event. Keep Plan 16's original league tasks, requirements, dispositions, policies, and downstream gates unchanged.

This is source/tests/contract work only. Do not run a provider, Strategy, Match, Docker, actual empirical entry, old reader, publisher, or retained-history scan. Focused test cases must each finish within 5,000 ms; every command has a hard 60-second timeout and 768 MiB memory cap. Do not adopt the research's 30,000-ms test timeout. Use inert worker mocks and trusted-prefix fixtures only. No package installation is expected; first verify the repository-pinned Node version/configuration before choosing an async lifecycle mechanism.

## Locked operating contract

- Preserve canonical rules, immutable consumed evidence, charged failures, and private-only output (D-22, D-25, D-28). No historical refund, reset, retry, recredit, or acceptance inference.
- Keep the existing absolute startup 2,500-ms, host 5,000-ms, guest 1,000-ms, cancel/termination 100-ms, and Match 600,000-ms budgets. Start applicable absolute deadlines before construction; no extension, reset, excluded setup time, timer restart, or change in nesting/accounting.
- A final, request-bound atomic READY state remains authoritative. Do not let callback, message, host object, or Strategy-controlled data manufacture readiness. The guest must not import/evaluate Strategy or call its method before GO; every request still gets a fresh worker. Preserve guest deadline, cleanup, and system-failure classification.
- Add only finite host-controlled lifecycle/milestone enums, booleans, and bounded monotonic duration buckets. No raw exception/error text, input/source, stdout/stderr, StrategyMemory, objective payload, or public/replay exposure.
- Freeze the private successor functional contract as exact origin version `startup_origin_v6` with exactly these added fields: `constructorDurationBucket`, `prefixMilestone`, `readyPublicationDurationBucket`, `finalAtomicState`, `lifecycleBeforeTermination`, and `deadlineOutcome`. Duration buckets are `0_9ms`, `10_49ms`, `50_99ms`, `100_249ms`, `250_499ms`, `500_999ms`, `1000_2499ms`, `2500_plus`, `unknown`. `prefixMilestone` is `not_entered|entered|ready_published|unknown`; `finalAtomicState` is `state_0|state_1|state_2|state_3|unavailable|unknown`; `lifecycleBeforeTermination` is `neither_seen|error_seen|exit_seen|both_seen|unknown`; `deadlineOutcome` is `ready_before_deadline|startup_deadline|late_or_boundary|construction_failure|unknown`. Bind these fields to the existing exact host request roots; do not accept caller-supplied timestamps or milestones. Any existing base fields remain as they are in the new schema's explicitly versioned contract.
- Preserve old V5 supervisor, harness, schema, policy, defaults, and public projections byte-for-byte or behavior-for-behavior. Add a separately named optional successor only. It is not selected by default and is selectable only by exact host-issued private authority for prospective ordinal 5 after all existing gates pass.
- Current custody carries 39 cumulative charges as cost-only. The four consumed canonical historical policy versions remain immutable; no old acceptance, root, or authority is reusable. Bind implementation planning to ROOT's current terminal-report roots/raws without rerunning its reader or reopening history. The selected V7 path additionally requires exact actual source-author, reviewer, ordered semantic-closure, failed-base `158012ab`, Git/source joins, and private mode-0600 custody.
- Retain the existing original anchor and full 108,000,000-ms wall cap, cumulative cap 250,530,903 ms, absolute stop `2026-10-10T02:14:32Z`, entry cutoff `2026-10-10T01:33:32Z`, source cutoff `2026-10-10T01:43:32Z`, all-wall accounting, 31-minute reserve, 3-GB aggregate RAM, 15-GB disk, 300-Match cap, and every other existing runtime/privacy bound. None is authority from this plan; ordinal 5 remains dormant until independent concrete repair review, actual ROOT metadata/request/DATA/HELPER checks, committed allocation, and fresh same-process capacity all pass. Allow at most the already separately authorized one accepted diagnostic and its conditional actual FINAL; if a gate is absent or the remaining window/reserve does not fit, stop honestly with no route.

## Serial tasks

### Task 1 — Test-first lifecycle-aware startup control and finite producer schema

**Files owned:** `scripts/lib/v1-38-lean-startup-supervisor.mjs`, `scripts/lib/v1-38-lean-startup-supervisor.d.mts`, `scripts/lib/v1-38-lean-container-match-session.ts`, `scripts/lib/v1-38-lean-container-match-session.test.ts`.

**Action:** Before implementation, establish the actual pinned production Node version from repository/runtime configuration and write failing inert regressions. Implement a separately named optional successor supervisor/origin `startup_origin_v6` only. Prefer asynchronous lifecycle-aware waiting only if the pinned runtime supports a mechanism that keeps the atomic predicate and the original absolute deadlines authoritative; otherwise use another trusted host-only wake/control primitive only when it cannot be forged by guest code. On pre-GO worker `error`/`exit`, fail closed promptly, cancel/terminate/clean up, and report a system failure. Preserve the READY atomic state as the only readiness proof and re-read it at classification boundaries. Emit exactly the six added fields and enums/buckets in the contract above; use host monotonic elapsed durations, not wall-clock timestamps. Missing or ambiguous observations are explicit `unknown`/`unavailable`; never infer the physical v15-4 cause. Do not precompute the harness URL unless its identity is unchanged, its cost stays inside all applicable wall/clock accounting, and an inert identity test proves it; omit it if that widens scope.

**Tests:** RED then GREEN cases for construction refusal, prefix not entered/entered/ready published, error and exit before READY, READY/error ordering, host deadline and exact boundary, GO, guest timeout, cancellation/termination/cleanup, final-state consistency, and malformed/extra/wrong-binding/unknown origin. Assert no guest evaluation before GO, no readiness from callbacks, same fresh-worker isolation, and unchanged budget accounting. Every focused case is ≤5,000 ms.

**Verify:** Focused Vitest selector for `scripts/lib/v1-38-lean-container-match-session.test.ts` under the 60-second/768-MiB command cap, plus the repository-pinned runtime check. No provider/Strategy/Match/Docker/reader invocation.

### Task 2 — Strict private joins, retention projection, and physical inventory

**Files owned:** `scripts/run-v1-38-lean-experiment.ts`, `scripts/run-v1-38-lean-experiment.test.ts`, `scripts/run-v1-38-lean-correction.ts`, `scripts/run-v1-38-lean-correction.test.ts`, `scripts/lib/v1-38-lean-baseline.ts`, `scripts/lib/v1-38-lean-baseline-retained.ts`, `scripts/lib/v1-38-lean-baseline-retained.test.ts`, `scripts/lib/v1-38-lean-correction-retained.ts`, `scripts/lib/v1-38-lean-correction-retained.test.ts`, and only the exact additional strict-origin/diagnostic consumer and test files ROOT names in the initial inventory before edits.

**Action:** Add a distinct finite successor origin schema and exact request-bound joins across producer, host evidence, diagnostic/correction/baseline consumers, and retained private projection. Validate exact keys, types, enums, duration ranges, size limits, version, request binding, and source/executable roots at every consumer; missing, unknown, malformed, stale, or mismatched data fails closed. Keep startup failure charged and classified as system failure/incomplete evidence, never Strategy failure or success. Add a compact private projection only; assert no new field reaches public replay/result outputs. Preserve all historical V5 schemas/defaults, old V2/V3/V4 policies, and the existing V4/V6/V10 plus boundary 2/6/8 inventories byte-identically. Never modify consumed v15-4 result/origin/policy bytes.

Before implementation, ROOT must enumerate the exact changed paths, source/review inputs, generated outputs, and physical byte-debit inventory, including symlink/alias handling and every retained output. Use explicit paths only: no globs, implicit version selector, exemptions, or new path outside that list. Carry the 39-charge cost-only ledger and all existing file/resource debits; obtain roots/raw identifiers only from the current terminal report and do not rerun a reader/history audit.

**Tests:** RED then GREEN for accepted exact joins and rejection of extra/missing keys, malformed buckets, wrong version/request/source/root, stale records, private/public projection separation, charged incomplete system failure, and byte/behavior compatibility of old policy/default/inventory fixtures. Tests use inert mocks/trusted-prefix fixtures only; each ≤5,000 ms.

**Verify:** Exact focused consumer Vitest selectors declared in ROOT's initial finite inventory, each within the 60-second/768-MiB command cap; explicit old-policy/schema/default and inventory equality checks. No provider, Match, Docker, old reader, publisher, or retained-history scan.

### Task 3 — Dormant ordinal-5 authorization and complete source closure

**Files owned:** The exact successor authority/request/archive contract and strict tests named by ROOT in Task 2's frozen finite inventory; no other paths.

**Action:** Add the separately named successor policy/archive/request/source/retained/auth plumbing for prospective ordinal 5 only. Make it impossible for legacy policy, default configuration, caller data, path discovery, or a generic “latest” selector to opt in. Activation requires the actual host-issued private ordinal-5 authority plus exact actual source-author/reviewer/ordered-semantic-closure joins, failed-base `158012ab` lineage, Git/source identities, private mode-0600 custody, current ROOT metadata/request/DATA/HELPER checks, committed allocation, and fresh same-process capacity. This source plan/research cannot issue or imply any of those gates. Keep old V2/V3/V4 policies and V4/V6/V10/boundary 2/6/8 inventories immutable. Do not change any old round requirements, old publisher behavior, refunds, or history. If authority/plumbing cannot be added inside the predeclared path/byte inventory and remaining limits, stop with an explicit gap; do not broaden the inventory.

**Tests:** RED then GREEN for default/legacy non-selection, host-issued exact ordinal-5 acceptance only when every join matches, and fail-closed refusal for absent/forged/wrong-ordinal/stale/mismatched authority or any missing gate. Prove old policy/inventory bytes and private permissions remain unchanged. Inert fixtures only; every focused case ≤5,000 ms.

**Verify:** All named focused selectors plus the existing configured typecheck/build, exact source-diff and boundary/privacy gates, each under a hard 60-second/768-MiB cap. No empirical execution, provider/Strategy/Match/Docker, retained reader, publisher, or historical scan. Any source-only validation gap is recorded; it does not authorize route work.

## Dependencies and stop conditions

Tasks run strictly serially: Task 2 consumes Task 1's versioned origin contract; Task 3 consumes both that contract and Task 2's finite consumer/inventory closure. No parallel execution. After source implementation, require independent source review, bounded fix/re-review if needed, ROOT validation, and distinct source verification before ROOT may consider any new route data. The existing Plan 16 empirical task remains separately gated and is not authorized by these tasks.

If the supported runtime has no safe lifecycle-aware async mechanism, do not assume `Atomics.waitAsync` or add a dependency: retain the finite attribution fields, preserve blocking behavior, and explicitly report control repair unjustified. If any gate, test, strict join, source identity, byte inventory, time reserve, or custody condition fails, stop with an honest source gap/`feasibility_not_established`; do not claim v15-4's cause is repaired or known. No phase, LEAG, baseline, freeze, formation, holdout, public, counted-play, production, archive-success, or tag credit follows.

## Source coverage audit

| Source | Item | Coverage |
|---|---|---|
| Existing Plan 16 goal/requirements | Current-rules league tasks and their requirements/dispositions | Preserved unchanged; this supplement grants no league or phase completion. |
| Closed evidence/research | Source-level pre-GO lifecycle blind spot; finite attribution; historical cause unknown | Tasks 1–3; no diagnosis rerun or empirical claim. |
| Locked D-22/D-25/D-28 | Carry all cost/history; compact private schema; unchanged canonical/runtime/privacy limits | Binding contract and Tasks 1–3. |
| User authorization boundary | Dormant prospective ordinal 5 only after independent real gates | Task 3; no authority is created by this plan. |
