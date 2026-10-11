---
status: diagnosed
trigger: "Verified private one-Match V2 terminal reports SUBPROCESS_EXIT; physical cause unknown"
created: 2026-10-11T17:29:36Z
updated: 2026-10-11T17:33:05Z
mode: diagnosis_only
---

# One-Match V2 subprocess exit

## Current focus

hypothesis: Demonstrated attribution gap, not a demonstrated physical failure cause. Private V2 omits the startup-origin observer while the finite exit code conflates unsuccessful supervisor frames and host-deadline exhaustion.
test: Bounded source trace completed; no runtime experiments or artifact mutation.
expecting: Physical initiating branch remains UNKNOWN; authenticated executor/unknown is not an authenticated detailed startup receipt.
next_action: Return diagnosis to manager and stop. No user decision or fix gate is needed. No new execution authority.

## Symptoms

- Expected: one private canonical current-rules Match reaches a verified terminal outcome within existing bounds.
- Actual: unique ROOT entry36488 closed exit0 with a published system-failure result after27696ms, cleanupComplete=true, no outcome/board and zero compact replay rows. One charged ordinal0; cumulative42.
- Authenticated finite code SUBPROCESS_EXIT, method soldierBrain, provider-local ordinal81, stage executor, reason unknown; diagnostic1917bytes,164 accounting rows.
- Allocationcommit30d61b7df02f594f4fda226bffcaeb101cae64dc, sourceHead165cead9cd236452bc49b6cc45ca19fcd7b8da99, allocationroot8ddf0092116ac00397e500ddf897ee14f2038256e7e064f97053859c7cb47f6a.
- Actual resultroot sha256:b7a87f9a24a6b3918b45e5c424ce345fba4fafea15f502e73b81331258d67ac8; terminalroot sha256:2be5fc99bd89aadabcd1060d7feb3616bc688b71d6af83ffd8ef88f695c4a8e3.
- Unique independent actual reader73167 closed exit0; verified integrity, feasibilityEstablished=false; all evidence bytes and HEAD unchanged. Its report is 265-16-ONE-MATCH-DIAGNOSTIC-RETAINED-VERIFICATION-v2.md.

## Boundaries

Source-only diagnosis; no fixes, tests, native executor/container/provider/Strategy/probe/Match, reader rerun, allocation or historical heavy scan. Never print private Strategy source, objectives, memory, input/output, stdio or raw errors. Inspect source code and safe finite whitelisted metadata only. All consumed artifacts immutable. No OOM/timeout/Strategy-fault inference without evidence; cleanuptrue is not negated by CLEANUP_STOP. Record absence is not proof of no transient gameplay. All work continues cumulative accounting under unchanged limits.

## Evidence

- Retained verification accepted integrity, not game feasibility or Phase265 completion.
- Diagnostic capture now preserves authenticated finite subprocess code; original physical cause remains unknown.
- Source: scripts/lib/v1-38-lean-container-match-session.ts:345 converts every unsuccessful startup-supervisor result to synthetic frame status70, signalnull, empty streams, with startupOrigin; status is not a native-process exit receipt.
- Source: same file:591-596 validates startupOrigin and sends unsuccessful finite metadata only to optional startupOriginObserver; line616 emits SUBPROCESS_EXIT from nonzero frame status. Host-deadline exhaustion also uses this code (577,592,603,630).
- Source: scripts/lib/v1-38-planner-supervised-runtime.ts:176-179 preserves a genuine SubprocessSystemFailure finite code but falls back to executor/unknown when the session WeakMap lacks origin. This matches retained diagnostic without proving a physical initiating cause.
- Source: scripts/lib/v1-38-lean-experiment-authority.ts:836 routes private V2 into issuePrivateMatchSeat; lines659-677 mint a V8 startup grant. Session lines511-512 consume that grant; line570 creates the startup request binding.
- Source: scripts/lib/v1-38-lean-baseline-match.ts:124-126 makes private V2 distinct from legacy, and line162 supplies a startupOriginObserver only when legacy?.correction?.observe exists. Consequently private V2 has no such observer. This is a directly demonstrated missing retention handoff, not proof of the failure branch on ordinal81.
- Source: scripts/lib/v1-38-lean-startup-supervisor-v8.mjs:6,23-51,58-61 can return unsuccessful finite branches construction_failure, inconsistent_state, startup_expired, lifecycle_failure, go_refused, guest_expired, host_expired. All share the broker's synthetic nonzero frame status. Detailed receipt includes stage/branch, ready/go/wait/termination/unknown, duration buckets, prefix milestone, final atomic state, pre-termination lifecycle and deadline outcome. No retained V2 schema field preserves these.
- Source: scripts/lib/v1-38-lean-baseline-match.ts:236 derives originAvailability from an issued planner private diagnostic, including generic executor/unknown. scripts/run-v1-38-lean-private-matches.ts:393-409 accepts only the finite diagnostic keys and validates that generic pair. Thus retained originAvailability=available does not assert startupOrigin retention.
- Source: packages/runtime-js/src/abi-bridge.ts:99 dispatches adapter.execute without catching its thrown error. packages/runtime-js/src/worker-harness.ts:225-240 ordinarily converts caught guest exceptions into a RuntimeViolation and publishes completion. SUBPROCESS_EXIT alone does not classify a guest exception; failures outside that catch remain possible but unproven.

## Eliminated

- hypothesis: SUBPROCESS_EXIT proves an actual native process exit or observed exit status.
  evidence: The broker synthesizes frame status70 for unsuccessful supervisor results, and the host also uses the same code for exhausted host deadlines. No native exit-status receipt is retained.
- hypothesis: originAvailability=available means the detailed startup branch is retained.
  evidence: The V2 projection reflects the generic planner diagnostic; its schema has no startup receipt, and the private V2 observer is absent.

## Resolution

root_cause: Physical initiating cause UNKNOWN. Confirmed source-level attribution gap: private V2's startup supervisor metadata is validated at the host but not handed to a retention observer, and the finite SUBPROCESS_EXIT code conflates synthetic unsuccessful control frames and host deadlines.
fix: None. Diagnosis-only; no source changes or new execution.
verification: Source trace plus previously accepted immutable retained-integrity report only. No tests, probes, providers, containers, Strategy execution, Matches or reader rerun. No OOM/timeout/exit-status attribution; cleanupComplete=true preserved; consumed one attempt/cumulative42 unchanged.
files_changed: [.planning/debug/one-match-v2-subprocess-exit.md]
recommendation: If future source-only diagnostic work is authorized, retain an authenticated bounded V8 startup-origin receipt with existing invocation/source/input/method/ordinal joins and a versioned private schema, rather than changing budgets or treating this generic code as a physical cause. No retry, allocation or second game is implied. Existing consumed evidence cannot be upgraded or rewritten. The retained record cannot determine whether this failing call reached a parsed startup receipt or hit one of the host-deadline checks; the missing observer is demonstrated independently of that uncertainty.
