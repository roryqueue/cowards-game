---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "25"
subsystem: runtime-supervision-contract
tags: [runtime-supervisor, canonical-json, cgroup-v2, failure-safety, workspace]

requires:
  - phase: 259-24
    provides: public additive v1.18 invocation, budget, raw receipt, counter conversion, and failure contracts
provides:
  - Package-free internal @cowards/runtime-supervisor workspace package
  - Canonical supervisor request binding invocation, input bytes, and cancellation channel
  - Strict host raw-receipt envelope and branded privacy-safe evidence verifier
  - Root TypeScript project registration without lockfile ownership
affects: [259-10, 259-11, 259-12, 259-26, 259-31]

tech-stack:
  added: []
  patterns:
    - public-workspace-only imports from @cowards/spec
    - canonical request and raw-receipt admission before semantic verification
    - verifier-known WeakSet branding for accepted host evidence
    - no-mutation failure for every unavailable, malformed, contradictory, or substituted receipt

key-files:
  created:
    - packages/runtime-supervisor/package.json
    - packages/runtime-supervisor/tsconfig.json
    - packages/runtime-supervisor/src/index.ts
    - packages/runtime-supervisor/src/supervisor-contract.ts
    - packages/runtime-supervisor/src/supervisor-contract.test.ts
  modified:
    - tsconfig.json

key-decisions:
  - "The private supervisor request self-hash binds the exact public v1.18 invocation, canonical input bytes, and cancellation channel; the guest never supplies host accounting fields."
  - "The raw host receipt is a separate canonical envelope binding the supervisor request, input, cancellation channel, and exact payload/stdout/stderr hashes before the public spec evaluator runs."
  - "Verified output is immutable and verifier-branded, retains only bounded hashes/counts/identity and success-or-player-violation evidence, and never carries raw output, source, artifacts, memories, objectives, diagnostics, paths, or cancellation secrets."
  - "Plan 31 remains the sole lockfile owner; Plan 25 registers only the package manifest, project reference, and public workspace dependency."

patterns-established:
  - "Supervisor boundary order: canonical raw admission -> exact request/observation binding -> public spec counter/lifecycle evaluation -> branded safe evidence."
  - "Guest stdout and payload remain separate untrusted observations and cannot be parsed as the host receipt channel."

requirements-completed: [CONF-01, CONF-03, CONF-04]

coverage:
  - id: D1
    description: "The shared supervisor accepts only a strict canonical request and raw receipt bound to the exact invocation, input, nonce, cgroup path/settings, and identities."
    requirement: CONF-01
    verification:
      - kind: unit
        ref: packages/runtime-supervisor/src/supervisor-contract.test.ts#creates and parses one canonical request bound to input and cancellation
        status: pass
      - kind: unit
        ref: packages/runtime-supervisor/src/supervisor-contract.test.ts#fails closed on nonce request path settings and envelope substitution
        status: pass
    human_judgment: false
  - id: D2
    description: "The verifier independently checks wall and CPU conversion, memory/pids/events, exact output bytes, cancellation, lifecycle, and complete group reap while every rejection remains no-mutation."
    requirement: CONF-03
    verification:
      - kind: unit
        ref: packages/runtime-supervisor/src/supervisor-contract.test.ts#independently rejects counter unit platform event and overflow contradictions
        status: pass
      - kind: unit
        ref: packages/runtime-supervisor/src/supervisor-contract.test.ts#recomputes output bytes and rejects exit cancellation and reap contradictions
        status: pass
    human_judgment: false
  - id: D3
    description: "The package is publicly workspace-resolvable, package-free beyond @cowards/spec, registered in the root project graph, and leaves final lock closure to Plan 31."
    requirement: CONF-04
    verification:
      - kind: integration
        ref: pnpm --filter @cowards/runtime-supervisor build && lint && typecheck && test
        status: pass
      - kind: integration
        ref: pnpm exec tsc -b --dry
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 25: Shared Supervisor Protocol and Verifier Summary

**A package-free shared supervisor boundary now binds canonical input and cancellation to the public v1.18 invocation, rejects contradictory host receipts, and emits only immutable privacy-safe evidence for later adapter signing.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-16T11:40:06Z
- **Completed:** 2026-07-16T11:54:00Z
- **Tasks:** 2
- **Files modified:** 6
- **Focused tests:** 8/8 supervisor tests and 34/34 joined v1.18 budget/invocation/supervisor tests passed

## Accomplishments

- Added a canonical internal request containing the public v1.18 invocation, exact canonical input bytes, one host nonce through the invocation, executable/argv/environment identities, exact limits, and a private cancellation channel.
- Added a separate strict host raw-receipt envelope that binds the supervisor request, input, cancellation channel, output hashes, public v1.18 raw receipt, platform, cgroup path/settings, counters, lifecycle, containment, and exact supervisor identities.
- Reused public `@cowards/spec` canonical JSON, request schema, counter conversions, resource classification, and three-way failure contract rather than importing source paths or creating a second quantitative policy.
- Added verifier-known immutable evidence. Guest output can be observed and hash-bound but cannot construct the host receipt, sign evidence, or carry source, artifacts, memories, objectives, diagnostics, host paths, raw stderr, or key material into the verified projection.
- Registered `@cowards/runtime-supervisor` under the existing `packages/*` workspace and root TypeScript graph while preserving Plan 31's sole ownership of the lockfile update.

## Task Commits

1. **Task 1 RED: strict supervisor protocol invariants** - `516f036` (test)
2. **Task 1 GREEN: shared supervisor verifier** - `bb5f775` (feat)
3. **Task 2: package and root project registration** - `bdcc6a1` (chore)
4. **Task 1/2 refactor: repository formatting** - `d3d0beb` (style)

## Files Created/Modified

- `packages/runtime-supervisor/src/supervisor-contract.ts` - Canonical request/receipt protocol, strict parsers, output binding, public-spec evaluation, and verifier branding.
- `packages/runtime-supervisor/src/supervisor-contract.test.ts` - Forgery, substitution, overflow, lifecycle, containment, privacy, and strict-shape mutation matrix.
- `packages/runtime-supervisor/src/index.ts` - Sole public package barrel.
- `packages/runtime-supervisor/package.json` - Package scripts and only direct dependency, public `@cowards/spec`.
- `packages/runtime-supervisor/tsconfig.json` - Composite project reference to spec.
- `tsconfig.json` - Root project reference.

## Decisions Made

- Used a wrapper request rather than altering the public Plan-24 invocation. This binds exact private input and cancellation material without changing the additive v1.18 spec bytes or broadening the public ABI.
- Kept the raw host receipt on a separate canonical channel from guest stdout/payload. The verifier receives raw guest observations only to recompute hashes and byte counts.
- Delegated all gameplay-neutral resource and lifecycle classification to the public spec evaluator. The supervisor package does not apply gameplay consequences or sign adapter evidence.
- Required verifier authority for request serialization and accepted evidence. Cloned certificate-shaped objects do not cross the trusted boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected test mutation typing during package build**

- **Found during:** Task 2 package build
- **Issue:** A negative test intentionally mutated a cloned readonly input binding, and TypeScript correctly rejected the direct assignment.
- **Fix:** Narrowed the test-only clone to an explicitly mutable structural type before the hostile mutation.
- **Files modified:** `packages/runtime-supervisor/src/supervisor-contract.test.ts`
- **Verification:** Package build, lint, typecheck, and all 8 tests pass.
- **Committed in:** `bdcc6a1`

---

**Total deviations:** 1 auto-fixed blocking test issue.  
**Impact on plan:** Test-only type correction; no protocol, API, dependency, or scope expansion.

## Issues Encountered

- The worktree initially had no `node_modules`. A repository command materialized the existing frozen dependency graph entirely from local cache (`downloaded 0`); the new package was then linked locally for RED execution. `pnpm-lock.yaml` remained byte-identical and uncommitted.
- Before Task 2 registered the package, the RED test required an ignored local `node_modules/@cowards/spec` workspace symlink so failure reached the intended missing implementation rather than a missing dependency.
- The existing boundary-import checker reported 19 known report-only offenses and zero strict offenses; the new supervisor package introduced none.

## Verification

- `pnpm exec vitest run packages/runtime-supervisor/src/supervisor-contract.test.ts --maxWorkers=1` — 8/8 passed.
- `pnpm --filter @cowards/runtime-supervisor build` — passed.
- `pnpm --filter @cowards/runtime-supervisor lint` — passed.
- `pnpm --filter @cowards/runtime-supervisor typecheck` — passed.
- `pnpm --filter @cowards/runtime-supervisor test` — 8/8 passed.
- `pnpm exec tsc -b --dry` — root project graph includes and resolves the supervisor.
- `pnpm typecheck` — 26/26 Turbo tasks passed across 15 packages.
- `pnpm lint` — 15/15 packages passed.
- `pnpm boundary:imports` — zero strict offenses.
- `pnpm exec vitest run packages/spec/src/runtime-budget-profile-v1-18.test.ts packages/spec/src/runtime-invocation-v1-18.test.ts packages/runtime-supervisor/src/supervisor-contract.test.ts --maxWorkers=1` — 34/34 passed.
- Prettier check for every created/modified source, manifest, and tsconfig — passed.
- Source-import scan, lockfile diff, forbidden-file diff, and `git diff --check` — passed.

## Known Stubs

None. This plan intentionally defines only the pure protocol/verifier. Plan 26 owns native Linux cgroup-v2 execution; Plans 10-12 own adapter consumers; Plan 31 owns final consumer manifests and lockfile closure.

## Next Phase Readiness

- Plan 26 can implement the native supervisor and emit this exact raw host receipt without changing the verifier contract.
- Plans 10-12 can consume only `@cowards/runtime-supervisor` public exports and inject adapter-owned signing after verified evidence.
- Plan 31 can add explicit consumer dependencies and perform the single final frozen lockfile update.

## Self-Check: PASSED

- All five declared package files and the root project reference exist.
- RED, GREEN, workspace-registration, and formatting commits exist in order.
- Exact package verification, root typecheck/lint, joined v1.18 tests, formatting, source-import, and boundary checks pass.
- No ROADMAP, STATE, REQUIREMENTS, protected file, workspace definition, or lockfile changed.

---

*Phase: 259-executable-four-language-and-chronicle-conformance*
*Plan: 25*
*Completed: 2026-07-16*
