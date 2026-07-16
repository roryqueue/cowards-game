---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "24"
subsystem: runtime-budget-and-capability-contracts
tags: [runtime-abi, cgroup-v2, budgets, four-language, fail-closed]
requires:
  - phase: 258-12
    provides: v1.17 ledgers, receipts, capability diagnostics, and exact identity pins
provides:
  - Additive v1.18 Linux cgroup-v2 aggregate quantitative budget profile
  - Strict nonce/request-bound raw supervisor receipt and failure-ownership contract
  - Identical TypeScript, Python, Rust, and Zig capability transition gate
  - Public @cowards/spec exports and normal package test enumeration
affects: [259-10, 259-11, 259-12, 259-22, 259-25, 259-26]
tech-stack:
  added: []
  patterns:
    - additive versioned runtime contract with immutable prior-byte guards
    - exact cgroup-v2 aggregate CPU, memory, pids, event, byte, and reap evidence
    - verifier-known capability snapshots before certificate promotion
key-files:
  created:
    - packages/spec/src/runtime-budget-profile-v1-18.ts
    - packages/spec/src/runtime-invocation-v1-18.ts
    - packages/spec/src/runtime-budget-capabilities-v1-18.ts
    - packages/spec/src/runtime-budget-profile-v1-18.test.ts
    - packages/spec/src/runtime-invocation-v1-18.test.ts
    - packages/spec/src/runtime-budget-capabilities-v1-18.test.ts
  modified:
    - packages/spec/src/index.ts
    - packages/spec/package.json
key-decisions:
  - "v1.18 computeFuel is aggregate Linux cgroup-v2 cpu.stat usage_usec multiplied by 1000 CPU nanoseconds under a distinct profile root; v1.17 instruction-fuel bytes remain unchanged."
  - "Only Linux cgroup v2 with cgroupfs and delegated cpu, memory, and pids controllers can create counted quantitative evidence; native macOS is proof-only."
  - "Complete common-meter evidence creates only a certificate candidate. Documentation, gate names, clones, and unverified declarations cannot promote counted eligibility."
  - "Wasmtime fuel and linear-memory observations remain defense in depth and can never substitute for the common aggregate CPU or memory meter."
requirements-completed: [CONF-01, CONF-03, CONF-04]
coverage:
  - id: D1
    description: "The v1.18 profile defines exact aggregate CPU, monotonic wall, memory, pids/events, byte, cancellation, containment, and identity semantics without changing v1.17."
    requirement: CONF-03
    verification:
      - kind: unit
        ref: packages/spec/src/runtime-budget-profile-v1-18.test.ts
        status: pass
      - kind: integration
        ref: packages/spec/src/runtime-invocation-v1-17.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "Strict raw supervisor evidence preserves success, player violation, and no-mutation system failure with exact request and identity binding."
    requirement: CONF-01
    verification:
      - kind: unit
        ref: packages/spec/src/runtime-invocation-v1-18.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: "All four lanes require the identical common supervisor meter and fail closed on any platform, controller, containment, identity, or substitution gap."
    requirement: CONF-04
    verification:
      - kind: unit
        ref: packages/spec/src/runtime-budget-capabilities-v1-18.test.ts
        status: pass
      - kind: integration
        ref: packages/spec/src/runtime-budget-capabilities-v1-17.test.ts
        status: pass
    human_judgment: false
duration: 20min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 24: Additive Quantitative Runtime Contract Summary

**A public v1.18 Linux cgroup-v2 budget, receipt, and all-four capability contract now defines one quantitative language-neutral foundation without reinterpreting v1.17.**

## Performance

- Duration: 20 min
- Tasks: 3
- Files modified: 8
- Tests: 262 spec tests plus 33 root script tests passed in the full package run

## Accomplishments

- Added a distinct, domain-framed v1.18 budget root. `computeFuel` is final-minus-baseline cgroup `cpu.stat usage_usec * 1000`, wall time is monotonic spawn-through-full-reap time rounded upward, memory is `memory.peak`, and pids/events/bytes use exact kernel or capture boundaries.
- Added strict request and raw-receipt schemas. Canonical request self-hashes, nonce, method, limits, profile, Linux/cgroup identity, controller delegation, monotonic counters, event deltas, lifecycle, containment, and exact executable/toolchain identities all fail closed on drift.
- Made exact N acceptable and N+1 a player violation only with positive Strategy attribution. Ambiguous or host-owned exhaustion, truncated capture, counter contradiction, unavailable containment, cancellation ambiguity, and process uncertainty are no-mutation system failures.
- Added one capability transition contract for TypeScript, Python, Rust, and Zig. Complete common-meter evidence can proceed to certificate review but remains uncounted until a later verified certificate installation.
- Closed the post-review false-pass paths: containment evidence is boolean-strict, cgroup path and applied-settings identities are independently derived from the exact request, nonce, limits, executable, and supervisor identity, and impossible/non-empty initial pids snapshots fail as system failures.
- Exported the additive APIs from `@cowards/spec` and added all three suites to the package's explicit normal test command.
- Rechecked the four v1.17 source guards after implementation; every SHA-256 remained exactly unchanged.

## Commits

| Commit | Description |
|---|---|
| `f62f6db` | RED tests for additive budget and receipt semantics |
| `0b8b1ee` | Common cgroup budget and raw receipt implementation |
| `2c18262` | RED tests for all-four capability transitions |
| `818b240` | Common-supervisor capability gate implementation |
| `698fa57` | Public exports and package test enumeration |
| `94b49d7` | Canonical request self-hash verification |
| `006eab1` | `BL-01` strict boolean containment evidence |
| `8154a63` | `BL-02` request-derived cgroup path/settings bindings |
| `740bd6f` | `BL-03` empty and internally ordered pids snapshots |

## Decisions Made

- Kept v1.18 additive rather than changing the current v1.17 profile, unit names, roots, ledgers, or evidence bytes.
- Used one closed Linux cgroup-v2/cgroupfs platform profile for every entrant language; no native-platform or per-process quantitative fallback is representable as counted evidence.
- Left counted promotion deliberately unavailable from this plan. A verifier-known common-meter snapshot is only a certificate candidate, preserving Plan 22's managed-certificate ownership.
- Required Rust and Zig Wasmtime fuel/linear-memory observations as separate defense-in-depth evidence while explicitly rejecting them as common-meter substitutes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Bound request self-hashes semantically**

- **Found during:** Post-task adversarial review
- **Issue:** The initial strict request schema validated the SHA-256 spelling but did not independently recompute it over the canonical request body.
- **Fix:** Added schema-level self-hash recomputation and rejection in serialization and receipt evaluation.
- **Files modified:** `packages/spec/src/runtime-invocation-v1-18.ts`, `packages/spec/src/runtime-invocation-v1-18.test.ts`
- **Verification:** Body and digest substitution tests pass; package typecheck and lint pass.
- **Commit:** `94b49d7`

**2. [Rule 1 - Bug] Used the repository's lint-safe global clone form**

- **Found during:** Task 3 package lint
- **Issue:** Bare `structuredClone` was valid at runtime but rejected by the repository ESLint environment.
- **Fix:** Used `globalThis.structuredClone` and removed one unused test binding.
- **Files modified:** v1.18 profile and test files
- **Verification:** `pnpm --filter @cowards/spec lint` passes.
- **Commit:** `698fa57`

**3. [Post-plan code review] Closed three runtime evidence false-pass paths**

- **Found during:** Independent review of Plans 259-24 and 259-29
- **Issue:** Truthy string containment values could reach certificate-candidate state, cgroup path/settings receipt values were not independently request-derived, and contradictory pids snapshots could under-report the observed peak.
- **Fix:** Added closed boolean validation, canonical domain-separated request bindings for path identity and exact cgroup settings, and fresh-empty plus peak-order pids invariants.
- **Files modified:** `packages/spec/src/runtime-budget-capabilities-v1-18.ts`, `packages/spec/src/runtime-budget-capabilities-v1-18.test.ts`, `packages/spec/src/runtime-invocation-v1-18.ts`, `packages/spec/src/runtime-invocation-v1-18.test.ts`
- **Verification:** Focused v1.18 capability and invocation suites pass 41/41; all four focused budget/baseline files pass 56/56; full lint, build, and typecheck pass.
- **Commits:** `006eab1`, `8154a63`, `740bd6f`

**Total deviations:** 5 auto-fixed/review-fixed issues (2 original, 3 review blockers). **Impact:** Stronger request and evidence integrity with no gameplay, failure-ownership, public-boundary, or prior-version change.

## Verification

- `pnpm exec vitest run packages/spec/src/runtime-budget-profile-v1-18.test.ts packages/spec/src/runtime-invocation-v1-18.test.ts packages/spec/src/runtime-invocation-v1-17.test.ts` — 62/62 passed before the self-hash hardening; the final invocation suite passed 18/18 afterward.
- `pnpm exec vitest run packages/spec/src/runtime-budget-capabilities-v1-18.test.ts packages/spec/src/runtime-budget-capabilities-v1-17.test.ts` — 34/34 passed.
- `pnpm --filter @cowards/spec test` — 15 package files / 269 tests passed; the three root supplemental files passed 33/33 when rerun without concurrent build pressure.
- `pnpm exec vitest run packages/spec/src/runtime-budget-profile-v1-18.test.ts packages/spec/src/runtime-invocation-v1-18.test.ts packages/spec/src/runtime-budget-capabilities-v1-18.test.ts scripts/capture-v1-37-protected-baseline.test.ts --maxWorkers=1` — 56/56 passed after review remediation.
- `pnpm --filter @cowards/spec build` — passed.
- `pnpm --filter @cowards/spec lint` — passed.
- `pnpm --filter @cowards/spec typecheck` — passed.
- Root `pnpm build`, `pnpm lint`, and `pnpm typecheck` — all 14 build/lint packages and all 25 typecheck tasks passed.
- Immutable v1.17 SHA-256 guards remained:
  - runtime ABI: `d09db74dc613b6fa67daf7d17e778782684ab2ebe2c954ec63bb0e979aeafbe7`
  - invocation: `305b974a2c8aa0eabb7fd31f9d40e4a2788ab8ebd2720324c21d274248b94f2e`
  - budget profile: `eb66c9e9b0937cadeee54c4ea117840693380bdfe361507128295f82f6995fec`
  - capability matrix: `9bd362f4356970e826013162d4e1341d478e9edeb393cebe597ecc7fb7059f44`

## Issues Encountered

- Root `pnpm format:check` remains red on 99 pre-existing repository files, including the already-unformatted Plan-24 source files. The fix pass did not bulk-reformat unrelated code; `git diff --check`, lint, build, and typecheck are clean.

## Next Phase Readiness

- Plan 25 can consume the public request/profile/raw-receipt schemas without importing spec source paths.
- Plans 10-12 can build thin supervised adapters against the same exact units and identity pins.
- Plan 22 retains sole ownership of managed certificate installation and counted promotion.

## Self-Check: PASSED

- All declared implementation and test files exist.
- All six task commits and all three atomic review-fix commits exist.
- Full package tests, build, lint, and typecheck pass.
- No v1.17 or protected user-owned file changed.
