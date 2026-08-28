---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-28T04:25:19Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md
iteration: 9
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 262: Code Review Fix Report

**Fixed at:** 2026-08-28T04:25:19Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-REVIEW.md`
**Iteration:** 9

**Summary:**

- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Darwin pathname execution remains owner-replaceable

**Files modified:** `scripts/bootstrap-v1-38-bounded-retry-successor-v2.sh`, `scripts/lib/v1-38-bounded-retry-successor-controller-v6.ts`, `scripts/lib/v1-38-bounded-retry-successor-native-helper-v6.c`, and focused tests
**Commit:** bfd50db2
**Applied fix:** Encoded the truthful `single_operator_local_seal_v1` assurance boundary, explicitly excluding hostile same-UID concurrency and pathname-replacement resistance while retaining pre/post identity and content authentication. Darwin does not expose an acceptable descriptor-execution primitive for this protocol, so the correction removes the overclaim instead of simulating stronger custody.

### CR-02: Retained leaf reads do not authenticate the exact generation returned

**Files modified:** `scripts/lib/v1-38-workspace-reader-v6.ts` and focused tests
**Commit:** a6ce38f4
**Applied fix:** Buffered exactly the pre-read size, rejected early EOF and trailing growth, hashed before output, and revalidated full post-read identity and metadata plus parent and absence witnesses before emitting any bytes.

### CR-03: Historical dependency evidence omits the installed transitive runner closure

**Files modified:** historical checkout derivation/checker/test sources and `.planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v4.json`
**Commits:** f270a52e, 05470f4a
**Applied fix:** Performed twin integrity-verified offline installs, traversed the complete installed runtime, optional, native, and installed-peer closure from Vitest, manifested exact package bytes, and bound pre/post runner-entry and closure roots. A mutation test now proves installed runner drift is rejected before execution.

### CR-04: Git checkout derivation remains exposed to ambient configuration

**Files modified:** historical checkout derivation/checker/test sources
**Commit:** a86e1869
**Applied fix:** Isolated system/global Git configuration, disabled replacement objects, hooks, and fsmonitor, rejected relevant local config and replacement refs, and verified raw commit/tree identities plus a clean checkout before dependency installation. Malicious caller config, hooks, and replace refs are covered by regression tests.

### CR-05: Pathname lock ownership can be replaced while held

**Files modified:** `scripts/lib/v1-38-bounded-retry-successor-native-helper-v6.c`, controller v6 sources, and focused tests
**Commit:** 3136c631
**Applied fix:** Added a retained-root BSD `flock` held for the complete child lifetime and revalidated every pathname lock against its retained descriptor after acquisition. Tests cover root rename and lock-name unlink/recreate races.

### WR-01: Reader test barriers collide with evidence-root absence checks

**Files modified:** workspace reader v6 tests
**Commit:** 6e641c73
**Applied fix:** Moved test barrier controls to a private bootstrap directory outside the evidence root and added an explicit successful control case.

### WR-02: Manifest authentication is split across sequential reader invocations

**Files modified:** workspace reader v6 API and consumers
**Commit:** cee69b35
**Applied fix:** Authenticated every manifest entry in one retained-reader batch so a manifest no longer spans independent root observations.

## Correction Chain

Commit `3fadfb32` records additive correction-v9 evidence without mutating protected v2-v8 or Plan 88/89 evidence. The correction preserves all authority bits as false, all forbidden destinations as absent, admission at 0/540, and reproduction-v16 as absent.

## Verification

- Successor controller v6: 10/10 tests passed in 358.55 seconds.
- Bootstrap v2, workspace reader v6, and historical v4 aggregate: 21/21 tests passed in 43.07 seconds.
- Correction-v9: 43/43 tests passed in 45.76 seconds.
- Canonical historical-v4 and correction-v9 package checkers passed.
- Native reader/helper v6 sources passed Clang with `-Wall -Wextra -Werror`.
- `package.json` parsed successfully.

---

_Fixed: 2026-08-28T04:25:19Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 9_
