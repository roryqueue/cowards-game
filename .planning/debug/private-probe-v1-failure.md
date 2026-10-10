---
status: diagnosed
trigger: "Bounded SOURCE-ONLY diagnosis of NEWprivateprobe actualfirstcase failure; preserve old bytes and do not rerun."
created: 2026-10-10T14:14:30Z
updated: 2026-10-10T14:14:30Z
goal: find_root_cause_only
---

## Current Focus

hypothesis: The private-probe source path omits the separate startup supervisor, so the allocated 2500 ms startup ceiling is not enforced; this is a confirmed source defect but not a proven cause of the consumed system_failure or cleanup=false.
test: Trace private-probe authority claims through factory, planner, and session selection, then compare the selected broker and its timeout semantics with the existing V8 startup path.
expecting: If private probe never receives a startup grant and selects the legacy broker, the source mismatch is confirmed; without finite retained failure-stage evidence, actual initiating cause remains unknown.
next_action: Keep actual entry/result/refusal immutable; if the sole allowed correction is used, first implement and independently check a narrow probe-specific V8 authority/dispatch repair and safe finite failure attribution under the existing bounds, then consume only the already-authorized correction.

## Symptoms

- expected: Four bounded non-Match public-ABI probes execute under distinct 1000 ms guest, 2500 ms startup, and 5000 ms host ceilings, with evidence and complete cleanup.
- actual: Actual entry 61471 exited 0; one charged ordinal-0 non-Match probe returned system_failure with evidenceVerified=true, cleanupComplete=false, factoryConstructionMs=1119, elapsedMs=2997; remaining three were not attempted. Unique verifier closed refused.
- errors: No retained finite initiating-failure or cleanup-subcheck cause supplied. Targeted read-only Docker check for exact probe container returned empty/exit 0; this does not identify the prior cleanup subcheck.
- started: First actual case in the only entry; no new run.
- reproduction: Prohibited for consumed entry. Static source trace only.

## Eliminated

- hypothesis: The consumed record proves worker startup exceeded 2500 ms.
  evidence: The record exposes aggregate factoryConstructionMs 1119 and elapsedMs 2997, but no guest-startup duration or V8 origin; these are not direct observations of startup-budget expiry.
  timestamp: 2026-10-10

## Evidence

- timestamp: 2026-10-10
  checked: `scripts/lib/v1-38-lean-container-match-session.ts` private-probe authority admission and broker selection
  found: Private-probe branch claims the probe authority and sets `hostResponseReceiptMilliseconds = 5000`, but leaves local `startup` undefined. Broker selection uses V8/V7/V6/V5 only when `startup` exists; otherwise it selects `LEAN_CONTAINER_BROKER_SOURCE`.
  implication: The 2500 ms startup ceiling is not selected as an independent control for private-probe requests.
- timestamp: 2026-10-10
  checked: `scripts/lib/v1-38-planner-supervised-runtime.ts` and `scripts/lib/v1-38-factory-supervised-runtime.ts`
  found: Private-probe authority is claimed at factory/planner layers and receives a 5000 ms lifetime/receipt allowance, but planner startup harness selection is tied to `leanExperimentAuthority`; privateProbeAuthority alone selects the default harness. The executor is created with timeoutMs 1000.
  implication: Source consistently routes this private-probe mode through the legacy broker/harness, not the existing startup-v8 path.
- timestamp: 2026-10-10
  checked: `LEAN_CONTAINER_BROKER_SOURCE` legacy `runLegacy` and existing V8 broker path
  found: Legacy deadline is `now() + q.timeoutMilliseconds` and its whole worker lifecycle is bounded by that single timeout; v8 path separates startup timeout, GO, guest method wall, and host deadline.
  implication: With legacy timeout 1000 ms, startup consumes the same budget as guest execution; this conflicts with the allocation's distinct startupMs=2500 and guestMs=1000 semantics. It is a prospective mechanism, not proof it caused the actual failure.
- timestamp: 2026-10-10
  checked: source cleanup in `createLeanContainerMatchSession` and stream close implementation
  found: cleanupComplete requires stream close success, clean docker rm, exact owned-container absence, and no startup-cleanup uncertainty. Any one failed predicate makes cleanup incomplete; the consumed record has no per-predicate receipt.
  implication: Actual cleanup failure subcause is unknown. Later empty `docker ps` cannot distinguish a stream-close failure from earlier cleanup predicates.

## Resolution

root_cause: Confirmed source-contract mismatch: private-probe mode advertises 2500 ms startup and 1000 ms guest ceilings but routes through legacy broker supervision with a single 1000 ms worker-lifecycle timeout; it does not select the existing V8 startup broker. The actual first-case initiating failure remains unknown, and this source defect is not proven to be its cause. Cleanup=false is likewise not attributable to a specific subcheck from retained evidence.
fix: Not applied. Small repair direction: add a probe-specific, allocation/request-bound startup grant with explicit factory/planner/session claims, select the checked V8 path only for that grant, and add bounded privacy-safe attribution for startup/guest/host and each cleanup subcheck. Preserve all current limits and historical bytes; require exact-source review and inert tests before the sole already-authorized correction. Do not infer physical cause or rerun outside that correction.
verification: Read-only source call-chain/control-flow inspection. No runtime, provider, Strategy, Match, container, reader, or test execution. Historical failure remains unverified/unresolved.
files_changed: [.planning/debug/private-probe-v1-failure.md]
