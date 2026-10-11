---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
diagnosed: 2026-10-11T17:33:05Z
status: attribution_gap_demonstrated
mode: diagnosis_only
physical_cause: UNKNOWN
attempted: 1
cumulative_charged: 42
requirements_completed: []
---

# One-Match V2 Failure Diagnosis

Physical initiating cause remains **UNKNOWN**. Source demonstrates a diagnostic-retention gap, not a physical-cause fix. Authenticated `SUBPROCESS_EXIT` does not establish an actual operating-system process exit, status70, timeout, OOM or Strategy fault.

## Accepted evidence and identity

The unique actual reader73167 and ROOT entry36488 are CLOSED. The retained verification report, `265-16-ONE-MATCH-DIAGNOSTIC-RETAINED-VERIFICATION-v2.md`, authenticates system_failure, soldierBrain/provider-local ordinal81, executor/unknown,164 accounting rows,27696ms, cleanupComplete=true, no outcome/board and zero compact replay rows. Integrity passed; feasibility was not established. Record absence does not prove no transient gameplay.

Allocationcommit30d61b7df02f594f4fda226bffcaeb101cae64dc/sourceHead165cead9cd236452bc49b6cc45ca19fcd7b8da99; resultroot sha256:b7a87f9a24a6b3918b45e5c424ce345fba4fafea15f502e73b81331258d67ac8; terminalroot sha256:2be5fc99bd89aadabcd1060d7feb3616bc688b71d6af83ffd8ef88f695c4a8e3. ROOT subsequently committed reporting/STATE atf3508ead with investigated source unchanged. No retained artifact was reread through an actual reader or changed by this diagnosis.

## Demonstrated source path

1. `scripts/lib/v1-38-lean-experiment-authority.ts:836` routes private V2 through `issuePrivateMatchSeat`; lines659-677 issue the V8 startup grant. `scripts/lib/v1-38-lean-container-match-session.ts:511-512,570` consumes the grant and creates the bound request.
2. `scripts/lib/v1-38-lean-baseline-match.ts:124-126,162` distinguishes private V2 from legacy and installs `startupOriginObserver` only for legacy correction. The private V2 observer is absent.
3. `scripts/lib/v1-38-lean-container-match-session.ts:345` converts unsuccessful supervisor results into synthetic nonzero status70 control frames, with finite startupOrigin. This is not a native-process exit-status receipt.
4. The host at lines591-596 validates startup metadata, passes it to an optional observer, then deletes it. Line616 maps nonzero status to `SUBPROCESS_EXIT`; host-deadline checks at577,592,603,630 also emit that code.
5. `scripts/lib/v1-38-planner-supervised-runtime.ts:176-179` preserves the finite code but supplies fallback executor/unknown when no origin was retained. `scripts/lib/v1-38-lean-baseline-match.ts:236` and `scripts/run-v1-38-lean-private-matches.ts:393-409` retain that generic diagnostic. Therefore originAvailability=available does not mean a detailed startup receipt survived.

`scripts/lib/v1-38-lean-startup-supervisor-v8.mjs:6,23-51,58-61` can produce construction_failure, inconsistent_state, startup_expired, lifecycle_failure, go_refused, guest_expired or host_expired. The retained evidence cannot choose among these, nor demonstrate that ordinal81 reached parsed startup metadata rather than a host-deadline check. Synthetic status70 is a source possibility, NOT an observed retained status.

Guest exceptions are ordinarily converted to RuntimeViolation/completion in `packages/runtime-js/src/worker-harness.ts:225-240`; adapter.execute dispatch at `packages/runtime-js/src/abi-bridge.ts:99` does not catch a thrown error. This does not identify a guest fault in the actual attempt. Other paths remain unproven.

## Narrow recommendation; no implementation

If separately authorized, make a versioned diagnostic-only supplement to retain an authenticated bounded startup receipt for private V2. Relevant files: `scripts/lib/v1-38-lean-baseline-match.ts` (private observer handoff), `scripts/lib/v1-38-lean-container-match-session.ts` (validated observer boundary), and `scripts/run-v1-38-lean-private-matches.ts` plus its versioned private schemas/producer/verifier (retention and independent authentication). Keep generic failure paths representable when no detailed receipt exists. Do not substitute caller-invented metadata for a receipt actually observed at the host.

Own-version source tests would need to demonstrate invocation/source/request/input/method/ordinal joins, diagnostic identity provenance, tamper and mismatch rejection, absent-receipt handling and distinction between generic executor/unknown and observed startup origin. Whitelist only finite stages/branches, bounded counters/state and duration buckets permitted by the selected schema. Reject raw errors/stacks, stdio, private Strategy source, memory, objectives/payloads and raw IO. Preserve current schemas and immutable consumed artifacts rather than retroactively upgrading them.

This recommendation repairs attribution, not the initiating physical failure. It grants no new execution, allocation, retry or second game. No budget/time-limit relaxation is supported. Whether receipt retention would select the actual failure branch remains unknown until evidence from an independently authorized future attempt exists.

## Closure

One investigation cycle, zero fix cycles; TDD=false, specialist review=none. Only the owned debug session and this report changed. No fixes, tests, native executor/container/provider/Strategy/probe/Match, allocation, reader rerun, heavy historical scan, commit or push occurred. All consumed evidence stays immutable; one attempted game/cumulative42 unchanged. CLEANUP_STOP does not negate cleanupComplete=true. No game feasibility, fullChronicle, LEAG, Phase265 or milestone credit. Diagnosis closed before17:45UTC; enclosing18:13:01UTC hardstop remains unchanged.
