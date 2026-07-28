---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "11"
subsystem: python-runtime-conformance
tags: [python, cgroup-v2, native-supervisor, ed25519, source-identity]

requires:
  - phase: 259-24
    provides: Additive v1.18 quantitative budget, request, receipt, and capability contract
  - phase: 259-25
    provides: Public supervisor request and nonce/output-bound raw receipt verifier
  - phase: 259-26
    provides: Pinned native Linux cgroup-v2 supervisor and private controller authority
  - phase: 259-31
    provides: Public supervisor dependency and Python project wiring
provides:
  - Sole additive v1.18 Python counted selector using the fixed isolated real Python host under a host-injected supervisor launch
  - Fresh executable, Python version, stdlib, adapter module, Python host, source artifact, supervisor, platform, cgroup, and quantitative evidence binding
  - Canonical privacy-safe host evidence whose Ed25519 signature is verified before return
affects: [259-13, four-language-conformance-runner, language-certification]

tech-stack:
  added: []
  patterns:
    - fixed Python -I host descriptor captured immutably at adapter construction
    - fresh launch-time language identity compared to the exact invocation and expected identity
    - cryptographically verified host evidence after raw receipt and payload admission

key-files:
  created:
    - packages/runtime-python/src/python-supervised-subprocess-adapter.ts
    - packages/runtime-python/src/python-supervised-subprocess-adapter.test.ts
    - packages/runtime-python/src/revision-v1-18.test.ts
  modified:
    - packages/runtime-python/src/index.ts

key-decisions:
  - "The counted Python adapter never calls child_process or the diagnostic v1.17 path; it invokes only a host-owned supervisor launch with one immutable `python -I python_runtime_host.py` descriptor."
  - "Runtime compiler identity is a domain-separated hash of exact Python executable bytes, version, and stdlib; adapter identity separately binds the TypeScript adapter module and Python host bytes."
  - "Success or positively attributed resource exhaustion is signed only after fresh identity, raw receipt, output, payload, and Ed25519 verification; every ambiguity is no-mutation system failure with no evidence."

patterns-established:
  - "Python adapter order: expected identity -> exact isolated host descriptor -> supervisor request -> fresh host identity -> raw receipt/output verification -> payload schema admission -> capability candidate -> verified host signature."
  - "Prior Python v1.17 source, normalization, host protocol, and adapter bytes remain independently immutable and are never relabeled as v1.18."

requirements-completed: [CONF-01, CONF-03, CONF-04]

coverage:
  - id: D1
    description: "The Python v1.18 counted selector runs the fixed real isolated host only through the shared native supervisor, with no direct-spawn or diagnostic fallback."
    requirement: CONF-01
    verification:
      - kind: unit
        ref: "packages/runtime-python/src/python-supervised-subprocess-adapter.test.ts#runs the fixed isolated Python host through one verified supervisor seam"
        status: pass
      - kind: unit
        ref: "packages/runtime-python/src/revision-v1-18.test.ts#defines one additive real-host supervised selector"
        status: pass
    human_judgment: false
  - id: D2
    description: "Python uses the common exact/N+1 aggregate CPU, wall, memory, pids, descendant, byte, cancellation, containment, and failure-ownership contract."
    requirement: CONF-03
    verification:
      - kind: unit
        ref: "packages/runtime-python/src/python-supervised-subprocess-adapter.test.ts"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run packages/runtime-python/src/python-supervised-subprocess-adapter.test.ts packages/runtime-python/src/revision-v1-18.test.ts packages/runtime-supervisor/src/native-supervisor.test.ts packages/runtime-supervisor/src/supervisor-contract.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Executable, version, stdlib, adapter, host, source, supervisor, Docker, Linux, cgroup, and signing identities are exact while private material and v1.17 bytes remain protected."
    requirement: CONF-04
    verification:
      - kind: unit
        ref: "packages/runtime-python/src/python-supervised-subprocess-adapter.test.ts#rejects launch-time Python and stdlib observation drift before receipt signing"
        status: pass
      - kind: unit
        ref: "packages/runtime-python/src/revision-v1-18.test.ts#keeps prior Python v1.17 host and protocol bytes immutable"
        status: pass
    human_judgment: false

duration: 28min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 11: Supervised Python Counted Adapter Summary

**Python now executes through one fixed isolated real-host descriptor under the common native supervisor, with fresh executable/stdlib/source identity and verified privacy-safe Ed25519 evidence.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-07-16T16:56:00Z
- **Completed:** 2026-07-16T17:24:31Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- Added an additive supervised-only Python counted selector plus domain-separated Python runtime/compiler and adapter/host build identities.
- Added a fixed `python -I` host adapter that constructs the public supervisor request, accepts only a host-injected launch, verifies fresh language identity and exact raw supervisor evidence, and validates the v1.17-compatible additive result payload.
- Added a non-promoting Python capability candidate and safe signed evidence containing only hashes, meter results, identity pins, and candidate status.
- Proved exact/N+1 common metering, interpreter thread/descendant inclusion, nonce replay, cross-lane and platform substitution, cancellation/crash/malformed output safety, signer authority, private poison exclusion, public boundaries, and immutable prior bytes.

## Task Commits

1. **Task 1 RED: Require supervised Python counted execution** — `93fc99b`
2. **Task 1 GREEN: Add the supervised Python counted adapter** — `fa285d7`
3. **Review fix: Bind launch-time Python identity** — `63d829d`
4. **Review fix: Verify host evidence signatures** — `a0aa10c`
5. **Review cleanup: Remove stale signing-test import** — `6f11de8`

## Files Created/Modified

- `packages/runtime-python/src/python-supervised-subprocess-adapter.ts` — Fixed Python host execution, exact identity, common supervisor verification, payload admission, capability, and signature verification.
- `packages/runtime-python/src/python-supervised-subprocess-adapter.test.ts` — Full identity, meter, replay, cancellation, privacy, signing, and failure matrix.
- `packages/runtime-python/src/revision-v1-18.test.ts` — Additive selector, compiler/stdlib/adapter identities, and immutable-v1.17 guards.
- `packages/runtime-python/src/index.ts` — Public additive supervised APIs only.

## Decisions Made

- Kept the existing `python_runtime_host.py` and v1.17 protocol bytes unchanged. The counted v1.18 path is a sibling quantitative execution seam, not a protocol relabel.
- Required an empty execution environment and Python isolated mode (`-I`) for the counted descriptor. Any alternative command, environment, or host path must have a different identity and cannot satisfy this adapter.
- Bound Python executable/version/stdlib independently from adapter-module/Python-host build identity so a runtime or stdlib substitution cannot hide inside a generic lane label.
- Required the exact expected Ed25519 key ID and public key to verify the signer callback result; signature shape or caller declaration alone is non-promoting.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Required fresh launch-time Python identity**

- **Found during:** Cross-lane self-review
- **Issue:** Constructor and request equality alone could not prove that the launch-time Python executable, version, stdlib, adapter module, host script, and source artifact were still the selected bytes.
- **Fix:** Added a fresh host language-identity observation to the launch result, compared every field with the frozen expected tuple, and re-derived the invocation adapter/compiler identities before receipt verification.
- **Files modified:** `packages/runtime-python/src/python-supervised-subprocess-adapter.ts`, `packages/runtime-python/src/python-supervised-subprocess-adapter.test.ts`
- **Verification:** Prelaunch and launch-time executable/version/stdlib/adapter/host/artifact substitutions all reject before signing.
- **Committed in:** `63d829d`

**2. [Rule 2 - Missing Critical] Verified the host signer cryptographically**

- **Found during:** Final trust-boundary review
- **Issue:** Canonical Base64 and an Ed25519 label did not prove the signature covered the exact evidence bytes or came from the trusted key.
- **Fix:** Added pinned Ed25519 public-key parsing, exact key-ID matching, and signature verification over the canonical evidence bytes. Wrong-message and malformed signatures fail with `EVIDENCE_SIGNING_FAILED`.
- **Files modified:** `packages/runtime-python/src/python-supervised-subprocess-adapter.ts`, `packages/runtime-python/src/python-supervised-subprocess-adapter.test.ts`
- **Verification:** Generated-key positive signature, signer exception, malformed signature, and valid-wrong-message signature tests passed.
- **Committed in:** `a0aa10c`

---

**Total deviations:** 2 auto-fixed missing critical trust-boundary validations.
**Impact on plan:** Strengthened executable and signing authority with no gameplay, dependency, public-output, package, or prior-version change.

## Issues Encountered

- The isolated worktree dependency graph was materialized offline from the committed lock with zero downloads and no lockfile change.
- The broad legacy `@cowards/runtime-python test` command remains red on pre-existing v1.17 validation/host timing assumptions under the current additive repository state. None of the failing tests imports the new adapter, and the exact Plan-11 suites, immutable-byte guards, builds, typechecks, lint, supervisor regressions, and boundaries pass.

## User Setup Required

None - no external service configuration required.

## Verification

- Final joined adapter/supervisor suite: 6 files / 64 tests passed, including all Plan-11 focused tests.
- `pnpm --filter @cowards/runtime-python build`, `typecheck`, and `lint` passed.
- `@cowards/runtime-supervisor` package suite: 3 files / 25 tests passed.
- Boundary imports: zero strict offenses; 19 pre-existing report-only findings.
- Focused Prettier, source-subpath scan, lockfile/protected-file diff, and `git diff --check` passed.

## Next Phase Readiness

- Plan 259-13 can inject the real Python host launch and trusted signer, execute every Python corpus case, parse private payload bytes, and retain only the signed quantitative roots.
- Counted promotion remains blocked until complete three-run corpus proof and managed certificate authority pass.

## Self-Check: PASSED

- All four declared Plan-11 files exist and the RED commit precedes GREEN.
- Focused tests, supervisor regressions, build, typecheck, lint, formatting, privacy, public-boundary, and immutable-prior guards pass.
- No direct spawn, supervisor authority mint, lockfile, protected file, global planning ledger, or production activation file changed.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Plan: 11*
*Completed: 2026-07-16*
