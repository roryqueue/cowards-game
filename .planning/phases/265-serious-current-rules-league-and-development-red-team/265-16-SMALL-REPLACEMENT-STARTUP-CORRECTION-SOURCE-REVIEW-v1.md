---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-10T20:25:21Z
depth: deep
source_head: 8f31b4d494d9edbbccb29f3f9c078412cefb1c30
diff_base: 98de5f65
diff_head: 8f31b4d494d9edbbccb29f3f9c078412cefb1c30
files_reviewed: 10
files_reviewed_list:
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/run-v1-38-lean-private-probe.ts
  - scripts/run-v1-38-lean-private-probe.test.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
source_disposition: NOTPASS
---

# Phase 265 Startup Correction: Source-Only Review

**Reviewed:** 2026-10-10T20:25:21Z  
**Diff:** `98de5f65..8f31b4d494d9edbbccb29f3f9c078412cefb1c30`  
**Disposition:** NOTPASS — two source blockers; one validation-coverage warning.

## Scope and method

Reviewed the exact ten changed source/test files listed in frontmatter and traced the new authority grant through factory → planner → session → broker/V8 supervisor, plus the v2 schedule, prepare, admission, debit, entry, and retained-verifier branches. The accompanying source-summary markdown was treated as context, not as source. No source was modified; no tests, prepare/entry/verify CLI, allocation/store/ledger, provider, Docker/container, Strategy, Match, or empirical reader was run. `git diff --check 98de5f65..8f31b4d4` passed.

The intended authority chain remains module-WeakMap-backed, ordered, and one-use; V8 result origin is validated against the charged binding and removed before runtime result parsing; no probe origin is forwarded to the ordinary Match startup observer. The V8 supervisor source retains separate 2500 ms startup, 1000 ms guest, and 5000 ms host deadlines. Those positive observations do not close the blockers below.

## Critical Issues

### CR-01: Probe V8 broker rejects the output limit emitted by the real v1.19 executor — BLOCKER

**File:** `scripts/lib/v1-38-lean-container-match-session.ts:374-376`; producer at `scripts/lib/v1-38-lean-container-match-session.ts:593-595`; executor setup at `scripts/lib/v1-38-planner-supervised-runtime.ts:144`

**Issue:** The probe branch requires `request` to have exactly `source`, `methodName`, and `input`, and rejects whenever `request.outputByteLimit !== undefined`. But the production planner constructs the selected V1.19 executor with `outputByteLimit: 262144`; its `execute` request is encoded with that value, and `encodeSubprocessIpcRequest` JSON-serializes the request. Therefore the actual request payload contains `outputByteLimit: 262144`, so the newly selected probe broker rejects every probe before V8 startup/guest dispatch. The mocked runner/session tests do not expose this production request shape.

**Fix:** Keep exact schema enforcement but allow and require `outputByteLimit === 262144` in the probe broker request shape, and bind that exact value through the existing output cap. Add an inert broker fixture using the actual encoded V1.19 request shape.

### CR-02: V8 probe binding hard-codes ordinal zero and breaks remaining v1 allocations — BLOCKER

**File:** `scripts/lib/v1-38-lean-container-match-session.ts:351,375,536`

**Issue:** Session construction writes `caseOrdinal: 0` for every probe, and broker validation requires both `caseOrdinal === 0` and `executionOwnerId === "probe-" + allocationRoot.slice(7,19) + "-0"`. The unchanged v1 schedule/admission still supports ordinals 0–3 and the authority issuer grants a startup capability for whichever ordered v1 case is charged. For any valid v1 ordinal 1–3, the owner is suffixed with that ordinal but the V8 broker insists on `-0`; the request is rejected. This contradicts the plan’s requirement that v1 remain a four-case allocation and its existing semantics remain intact.

**Fix:** Carry the authenticated binding’s actual ordinal into `caseOrdinal` and validate the owner ID against that same ordinal. Keep v2 constrained to ordinal zero through its one-case allocation and authenticated issuer checks. Add inert coverage for v1 ordinal 1 as well as v2 ordinal 0.

## Warnings

### WR-01: New v2 tests do not exercise the connected production authority/provider path — WARNING

**File:** `scripts/run-v1-38-lean-private-probe.test.ts:8-24,89-103,119-125`

**Issue:** The runner suite mocks the authority module, baseline source, and factory provider. The v2 schedule/result tests inject a fabricated carry, while the entry fixture returns a mocked authority and mocked provider. Thus the tests do not prove that the actual v2 prepare/admit/debit path creates the grant consumed by the changed factory → planner → session V8 branch, nor do they test the V1.19 broker payload shape. This coverage gap is material and is consistent with the production blockers above; filtered tests passing cannot establish the connected route.

**Fix:** Before any future runtime admission, add the smallest inert integration fixture exercising actual v2 preparation/schedule, carry authentication, admission/debit/ordered grant claims, actual encoded broker request, and retained verification. Do not launch a provider/container or execute Strategy code in that fixture.

## Verification context and handoff

The source summary reports (not independently rerun here): runner suite 8/8; filtered authority/factory/planner/session selection 15 passed with 249 skipped; unfiltered suites 263/264 with the existing cleanup-throws test still failing; strict TypeScript 11 diagnostics versus a 13-diagnostic baseline whose identities were not retained. Therefore no all-green, diagnostic-identity, empirical, or no-new-diagnostic claim is made. The source-only approval remains bounded and does not admit runtime work. Re-review the two blockers after correction before source-only closeout.

_Reviewer: gsd-code-reviewer (independent source-only review)_
