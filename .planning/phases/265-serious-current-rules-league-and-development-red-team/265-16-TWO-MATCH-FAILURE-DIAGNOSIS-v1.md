---
phase: 265
plan: 16-two-match-source
status: investigation_inconclusive
scope: bounded_source_and_finite_retained_metadata_only
goal: find_root_cause_only
initiating_cause: unknown
source_fix: none
---

# Two-Match failure diagnosis v1

The initiating runtime/session failure is **unknown**. The retained finite accounting does establish the downstream failure mechanism; the generic compact code is not its root cause. No runtime reproduction or source fix occurred.

## Evidence and bounded causal trace

Read the exact retained-verification v1, source reviews v1/v2, source-verification v1 and their connected composer, authority, producer, runtime bridge and native accounting implementations. No TWO-MATCH-HANDOFF-v1 was present in the bounded phase inventory. Existing planning frontier metadata was consulted; old artifacts remain unchanged.

One new data-only read selected only terminal classification/code/cleanup/count and accounting method/ordinal/classification/charged/completed. It did not invoke the empirical reader or emit private payloads. Terminal raw SHA-256 before and after was identical: `9e596dcce5abc6a48421d154b447db2810a36f5c4ff2422c3a19773113fedb4f`, matching the retained-verification v1 digest.

- The normal terminal has 165 accounting rows. There are 8 successful completed `selectActivations` and 156 successful completed `soldierBrain` rows; all are charged. The remaining final row is `soldierBrain`, provider-local ordinal 82, charged true, completed false, classification system_failure.
- `scripts/lib/v1-38-planner-supervised-runtime.ts:166` creates an initially incomplete charged row before dispatch. Invocation fills the result, derives completion from session activity and closes on system failure; its catch also produces a finite system-failure result and closes. Retained classification/completion alone cannot discriminate these initiating branches.
- `packages/strategy-lab/src/runtime-bridge.ts:110` pushes returned evidence before its verification condition; `!e.completed` rejects the observed final row. The catch at line 134 returns `LAB_SUPERVISOR_FAILURE`, preserving accounting but replacing transitions with an empty failure execution. This explains why 165 invocations can coexist with zero retained board transitions. Empty replay does not establish that gameplay never advanced.
- `scripts/run-v1-38-lean-experiment.ts:174` collapses execution failure and runtime system-failure accounting to compact `system_failure/SUPERVISOR_FAILURE`. The 20,513 ms observation and cleanup true are retained observations, not proof of a guest timeout, host deadline, resource failure, or cleanup failure.
- `scripts/lib/v1-38-lean-experiment-authority.ts:656` requires success, cleanup true, board evidence and outcome to reopen the debit. This terminal fails the success/board/outcome predicates. The caller at `scripts/run-v1-38-lean-private-matches.ts:335` records `CLEANUP_STOP` whenever close returns false. Thus the wrapper stop code does not contradict actual cleanup true and does not identify an initiating cleanup fault.

## Why the initiating discriminator is absent

The composer has a private finite diagnostic accessor and constructs a diagnostic after failure, but the private producer at `scripts/run-v1-38-lean-private-matches.ts:137` persists only compact accounting rows and commitments, not the native finite failure code or that diagnostic. Its exact terminal evidence contract likewise lacks the diagnostic. The private composer does not enable legacy correction-origin observer or legacy host-phase binding. The terminal's accounting commitment authenticates the projection, not an omitted branch/stage/code.

The available source permits more than one cause for the same final incomplete system-failure row, including a caught native/transport refusal or a system-failure result with an already-poisoned session. Neither possibility is proven. There is no retained finite initiating code/stage that can select between them, and digest roots cannot recover omitted metadata. No speculative source defect is diagnosed.

## Eliminated interpretations and remaining boundary

- No missing-terminal CR-01 recurrence: the retained normal terminal/result and unique reader exist; the failure occurred before successful completion, not because the route omitted its charged failure terminal.
- Not evidence of actual cleanup failure: retained cleanup is true; `CLEANUP_STOP` is the debit-success gate's wrapper classification.
- Not proof of no gameplay: canonical failure deliberately discards transition retention while preserving accounting.
- Not proven guest timeout, host deadline, container crash, malformed frame, memory exhaustion or lifetime exhaustion. Those initiating claims require an authenticated discriminator absent here.

Smallest missing finite capture: the actual failed invocation's allowlisted runtime failure code plus authenticated native stage/reason, joined to its existing invocation commitment and method/provider-local ordinal, with explicit unknown/unavailable when no issued diagnostic exists. This is a description of missing evidence, **not permission to capture it by rerunning, mutate retained bytes, change source or issue another Match**. A host-phase discriminator is additionally needed only if failure precedes/escapes returned native evidence; that is not selected by this retained row.

## Closure

All source/data read commands are closed. Diagnosis ownership and source hold are released to ROOT. No tests, CLI metadata/admission/preparation/probe/entry, provider/container/Strategy execution, new Match, retry, repeated empirical reader, source fix, commit or push occurred. One charged attempt remains spent, ordinal 1 unused and closed to reuse; cumulative charge remains 41. No additional execution permission follows. LEAG, baseline, full Chronicle, freeze, formation, holdout, public/counting/production and phase/milestone credit remain unestablished.
