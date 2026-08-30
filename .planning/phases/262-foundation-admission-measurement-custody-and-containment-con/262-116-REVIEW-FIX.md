---
phase: 262
fixed_at: 2026-08-30T14:30:04Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-CODE-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 262 Plan 116: Code Review Fix Report

**Fixed at:** 2026-08-30T14:30:04Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-CODE-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 9
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: A caller can grant Plan-109 eligibility without executing any actual mode

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`
**Commit:** `4900708f`
**Applied fix:** Eligibility now requires the exact ordered nine-mode set, nine distinct independently re-rooted passed observations, the recomputed aggregate root, a bound valid disposable closure, and exact zero-effect scalars. Fixed; requires human verification of the eligibility semantics.

### CR-02: Blocked evidence falsely states that failed upstream custody authenticated

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`
**Commit:** `9a403fe5`
**Applied fix:** Blocked evidence now records truthful subject, upstream, and supplement authentication flags plus the exact failed boundary. Fixed; requires human verification of failure-boundary classification.

### CR-03: Drift in the Plan-115 subject cannot produce the required blocked evidence

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`
**Commit:** `f6194787`
**Applied fix:** The failed subject observation is captured once and passed into blocked rendering; rendering no longer recaptures a closure already known to be invalid.

### CR-04: Process-integrity failures are published as subject findings

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`
**Commit:** `11483f96`
**Applied fix:** Process, timeout, malformed-output, command, and tool failures use a separate integrity error class and remain no-publication; only enumerated deterministic subject rejections render findings. Fixed; requires human verification of the error taxonomy.

### CR-05: Review publication can escape through symlinked parent directories

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`, `scripts/native/v1-38-plan-262-116-review-transaction-v1.c`
**Commit:** `c8461c0b`
**Applied fix:** Publication now walks pinned repository-relative parents through retained no-follow directory descriptors and verifies identity, mode, bytes, and parent stability before activation.

### CR-06: The promised atomic three-file publication is not crash-atomic

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`, `scripts/native/v1-38-plan-262-116-review-transaction-v1.c`
**Commit:** `5af4188b`
**Applied fix:** A rooted transaction marker is created first, each exact file is descriptor-relatively written and fsynced, marker removal activates the trio, and authenticated retry removes only owned exact crash-partials.

### CR-07: Runtime dependency bytes are not bound to the reviewed recursive closure

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`
**Commit:** `50c6b84b`
**Applied fix:** Current recursive/native/package manifests and bytes are authenticated and protected by no-rewrite checks; disposable worktrees execute the exact Plan-115 subject commit with deterministic environment binding.

### WR-01: The Git wrapper's allow-failure argument is ineffective

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`
**Commit:** `119ee781`
**Applied fix:** Expected-negative ancestry and object-existence queries now use explicit Git status probes.

### WR-02: The publication test silently passes when the trio is absent

**Files modified:** `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.ts`, `scripts/check-v1-38-plan-262-116-supplement-v3-adapter-v1.test.ts`
**Commit:** `72324c11`
**Applied fix:** Completed-phase authentication requires both immutable v1 history and the corrected v2 trio; absence or partial publication fails, and the test has an explicit execution timeout.

## Corrected Publication

The original v1 trio at `e1e75fc6ef177a8213d903f1ec365d86f37cf62a` remains byte-immutable and is explicitly ineligible. The corrected three-add v2 publication is `2219a36b62b41b45626ed93f13f43edb36463e61`, with payload/review/carrier roots `sha256:08a648525023db9d193bd377c1bda0ab5e9d8534d4681b8931228da4889ab264`, `sha256:622a7fc1bc37701414f152246f347d31e841d27aaeed8589d6b2b14bdbaf84af`, and `sha256:aeddda11d0632711d61face9f01e1fefe7778b12c2b3621c139225446f8c0e12`. Independent post-publication authentication passed with nine observations, zero findings, and no supplement, readiness, live, producer, or downstream effect.

---

_Fixed: 2026-08-30T14:30:04Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
