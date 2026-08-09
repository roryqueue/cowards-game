---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "27"
subsystem: admission-measurement
tags: [tdd, child-process, protocol-v2, containment, offline]

requires:
  - phase: 262-26
    provides: green verifier infrastructure and immutable stopped route-4 verdict
provides:
  - canonical bounded protocol-v2 ready and terminal frames
  - parent-observed closed four-family child integrity classification
  - production child emission and parent decoding over a dedicated inherited pipe
  - standalone synthetic subprocess proof without gameplay or route authority
affects: [262-28, 262-29, 262-30, 262-31, ADMIT-03, ADMIT-04]

tech-stack:
  added: []
  patterns: [dedicated inherited control pipe, canonical exact-key frames, parent-observed reducer, import-meta-url fixture roots]

key-files:
  created:
    - scripts/fixtures/v1-38-current-matrix-child-protocol-v2-fixture.ts
    - scripts/evaluate-v1-38-current-matrix-child-protocol-v2.test.ts
  modified:
    - scripts/lib/v1-38-current-matrix-child-protocol.ts
    - scripts/lib/v1-38-current-matrix-reproduction.ts

key-decisions:
  - "Reserve CHILD_BOOTSTRAP_FAILED and CHILD_TRANSPORT_FAILED for parent-observed process state; only the child may emit RUNTIME_EXECUTION_FAILED or SHARD_COORDINATION_FAILED."
  - "Keep stdout as the unchanged ordinary shard-result envelope, stderr empty, and canonical protocol-v2 bytes on inherited descriptor 3."
  - "Keep expected typed runtime-service failures in ordinary per-attempt outcomes rather than relabeling them as integrity failures."

metrics:
  duration: 9min
  completed: 2026-08-09
  tasks: 2
  files: 5
status: complete
---

# Phase 262 Plan 27: Offline Child Protocol-v2 Summary

**Canonical child-emitted ready/terminal frames now cross a bounded dedicated pipe into a parent-observed four-family reducer, with stdout result compatibility and offline standalone subprocess proof.**

## Performance

- **Duration:** 9 minutes
- **Started:** 2026-08-09T14:15:01Z
- **Completed:** 2026-08-09T14:24:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added canonical protocol-v2 ready, success, runtime-integrity, and shard-integrity frames with exact keys, canonical bytes, fatal UTF-8 decoding, a 512-byte total bound, exact two-frame cardinality, and closed ordering.
- Added a pure parent-observed reducer that maps spawn failure to `CHILD_TRANSPORT_FAILED`, pre-ready exit or timeout to `CHILD_BOOTSTRAP_FAILED`, post-ready malformed transport to `CHILD_TRANSPORT_FAILED`, and preserves canonical child-emitted runtime/shard families.
- Replaced the production parent-local failure-message construction with a dedicated inherited fd 3; the production parent calls `decodeV138CurrentMatrixChildProtocolV2` on the actual child bytes and zeroes control, stdout, and stderr buffers.
- Split the production child handler into request/inventory, runtime invocation, and result validation/serialization boundaries. Request/inventory/result failures emit `SHARD_COORDINATION_FAILED`; unexpected runtime invocation failures emit `RUNTIME_EXECUTION_FAILED`; expected typed runtime-service failures remain in stdout outcomes.
- Added a fixed-mode standalone child and six-test suite covering exact positives, malformed topology, spawn/bootstrap/transport distinctions, expected-failure compatibility, privacy bounds, import isolation, and structural production wiring.

## TDD Cycle and Commits

### RED

- `6af070c5` — `test(262-27): specify failing child protocol v2 contract`
- The new standalone suite loaded successfully and failed on the absent protocol-v2 family inventory: expected the four closed families but received `undefined`.
- This was the intended missing behavior, not a syntax, environment, route-artifact, or test-registration failure.

### GREEN

- `a8a5fef7` — `feat(262-27): implement closed child protocol v2 state machine`
- `af12cb64` — `feat(262-27): wire child-emitted protocol into shard runner`
- The first GREEN commit made the standalone finite state machine pass; the second wired the real production child/parent topology and added structural regression proof.

### REFACTOR

- No separate refactor commit was needed. The implementation remained split between canonical framing/reduction, the synthetic fixture, and the existing production child/parent module, and the final suite remained green.

## Verification

| Check | Verdict |
|---|---|
| `pnpm exec vitest run scripts/evaluate-v1-38-current-matrix-child-protocol-v2.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=120000 --bail=1` | PASS — 1 file, 6/6 tests |
| `pnpm typecheck` | PASS — 27/27 tasks |
| `git diff --check` | PASS |
| `test -z "$(git status --short -- .planning/artifacts)"` | PASS — no artifact mutation |
| `git diff --name-only d096d7bd..af12cb64` | PASS — exactly the four implementation/test allowlist paths |
| TDD gate log scan | PASS — RED precedes both GREEN commits |

## Production Call-Path Evidence

The real shard launcher declares `stdio: ["ignore", "pipe", "pipe", "pipe"]`, collects `child.stdio[3]` under the protocol-v2 byte cap, and invokes `decodeV138CurrentMatrixChildProtocolV2(concatenatedControl)`. The child entry writes `encodeV138CurrentMatrixChildProtocolV2Ready()` before request decoding and writes exactly one terminal from its explicit stage boundary. The former parent-side `classifyV138CurrentMatrixChildFailure({ schemaVersion, failureCode })` construction and the former whole-handler `catch { process.exitCode = 1 }` seam are absent from this path.

## Scope, Privacy, and Immutability Proof

- The standalone fixture imports only Node primitives and the protocol module. Its test imports no Strategy, Match, provider, runtime-service, live-observation, RSS/host-pressure, database, or route-seal module and derives the repository root from `import.meta.url`.
- Protocol frames contain only schema, frame, outcome, and the finite runtime/shard family where applicable. Tests scan control bytes against detail, status, signal, stderr, source, memory, objective, path, environment, host, process, attempt, token, database, Strategy, Match, and observation fields.
- No writer CLI, provider, live observation, `ps`, memory-pressure command, Strategy, Match, preflight, calibration, reproduction, authority, seal, or evidence-producing command ran.
- `.planning/artifacts` remained unchanged. Plan 262-25 and all earlier evidence remain byte-identical; no prior route was retried, repaired, resumed, or partially reused.
- The 200 ms RSS observation contract, inclusive 2,500-basis-point gate, 8-attempt/4-shard calibration, conditional 540 cells, runtime/kernel/historical predicate, gameplay, public/default coarse projection, privacy, and formation absence were not changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected protocol-frame newline validation**

- **Found during:** Task 1 GREEN
- **Issue:** The first implementation passed a regular expression to `String.prototype.includes`, causing the focused suite to fail before frame validation.
- **Fix:** Replaced it with the intended regular-expression `.test()` call and reran the full standalone suite.
- **Files modified:** `scripts/lib/v1-38-current-matrix-child-protocol.ts`
- **Verification:** Focused suite PASS, 6/6 final.
- **Commit:** `a8a5fef7`

**2. [Rule 1 - Bug] Removed a self-matching static isolation literal**

- **Found during:** Task 1 GREEN
- **Issue:** The test source contained the exact forbidden artifact path only inside its own negative assertion, so the static scan correctly matched itself.
- **Fix:** Constructed the checked path from two inert literals, retaining the same negative assertion without embedding the forbidden path.
- **Files modified:** `scripts/evaluate-v1-38-current-matrix-child-protocol-v2.test.ts`
- **Verification:** Standalone static isolation test PASS.
- **Commit:** `a8a5fef7`

**Total deviations:** 2 auto-fixed bugs. **Impact:** Test/validator correctness only; no scope, protocol, runtime, policy, evidence, or authority expansion.

## Known Stubs

None. The created and modified Plan 262-27 surfaces are wired and covered; empty arrays and nullable values found by the scan are existing bounded runtime state, not UI or protocol placeholders.

## Threat Review

The dedicated child-process control surface is the exact trust boundary declared in the plan threat model. Exact canonical frames, strict order/cardinality, fatal decoding, parent-observed bootstrap/transport ownership, child-only runtime/shard terminals, private-field exclusion, bounded buffering, and buffer zeroing implement T-262-149 through T-262-154. No unplanned endpoint, auth path, file boundary, database boundary, or schema trust surface was introduced.

## Decisions Made

- Parent-only families are derived from observed spawn/readiness/transport state and cannot be emitted or asserted by a caller.
- Child-emitted integrity frames are limited to the two unexpected execution boundaries; ordinary typed runtime-service results remain unchanged on stdout.
- The old v1 public-safe failure schema remains available for frozen historical identities, while the new production topology consumes protocol-v2 control bytes.

## Next Phase Readiness

Plan 262-28 can now perform the separately owned offline scheduler, cancellation, charging, cleanup, compatibility, privacy, constant-identity, zero-finding review, and frozen proof work. This plan creates no A5/B5 authority and does not unblock ADMIT-03; route ordinal 5 remains unavailable until the later exact full-byte checkpoint and direct-child seal.

## Self-Check: PASSED

- All four implementation/test files exist.
- RED `6af070c5` and GREEN `a8a5fef7`, `af12cb64` exist in Git history in order.
- Final focused tests, typecheck, diff checks, changed-file allowlist, and artifact immutability checks pass.
