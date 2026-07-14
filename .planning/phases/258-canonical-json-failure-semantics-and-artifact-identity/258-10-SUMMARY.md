---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "10"
subsystem: wasm-wasi-successor-runtime
tags: [rust, zig, wasmtime, runtime-abi, canonical-json, toolchain-identity]
requires:
  - phase: 258-06
    provides: Authenticated exclusive v1.17 invocation envelope
  - phase: 258-07
    provides: Engine-only penalties and no-mutation system failure
provides:
  - Host-owned authenticated v1.17 outer responses for raw Rust/Zig guest payloads
  - Exact observed compiler, artifact, sysroot, Wasmtime, adapter, settings, and containment identity
  - Proven-versus-ambiguous WASM failure attribution with exclusive three-way outcomes
  - Schema-identical Rust/Zig candidate envelope fixture with explicit uncertified posture
affects: [258-11, 258-12, 258-13, 258-14, 259]
tech-stack:
  added: []
  patterns:
    - Guest stdout is raw canonical Strategy payload; only the adapter signs the outer envelope
    - Expected exact execution identity is compared with a fresh host observation before guest startup
    - Unsupported or incomparable meters remain explicit and block counted certification
key-files:
  created:
    - packages/spec/artifacts/runtime-abi-v1.17-wasm-language-envelopes.json
  modified:
    - packages/runtime-wasm-wasi/src/metadata.ts
    - packages/runtime-wasm-wasi/src/validation.ts
    - packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts
    - packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.test.ts
    - scripts/evaluate-wasm-wasi-runtime.ts
key-decisions:
  - "Rust and Zig emit only method-specific raw canonical payload bytes; a guest-authored transport envelope is invalid Strategy output and never gains signing authority."
  - "Only host-proven Strategy traps or fuel, memory, and output exhaustion are player-owned; ambiguous traps, unavailable accounting, host faults, and transport faults are system-owned."
  - "The candidate binds expected and freshly observed compiler, artifact, target, flags, sysroot, Wasmtime, adapter-build, settings, and containment identity before execution, while retaining an explicitly uncertified and producer-empty posture."
  - "Legacy v1.14 execution and all six v1.22 evidence artifacts remain byte-identical; v1.17 is additive and inactive."
requirements-completed: [RABI-01, RABI-02, RABI-03, RABI-05, RABI-06, RABI-07, RABI-08]
coverage:
  - id: D1
    description: "Canonical raw Rust/Zig payloads produce a host-authenticated success; guest outer envelopes, duplicate keys, noncanonical order, invalid UTF-8, and schema drift produce one authenticated player violation."
    requirement: RABI-01
    verification:
      - kind: unit
        ref: packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "Proven Strategy exception/fuel/memory/output observations are player-owned, while ambiguous attribution, unavailable accounting, host crash, and transport crash are system-owned without a mixed shape."
    requirement: RABI-03
    verification:
      - kind: unit
        ref: packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: "Real Rust 1.95, Zig 0.16, and Wasmtime 45 probes bind exact identity and settings, reject stale artifact/toolchain identity before execution, and remain machine-readably uncertified with no trusted producer."
    requirement: RABI-07
    verification:
      - kind: integration
        ref: scripts/evaluate-wasm-wasi-runtime.ts
        status: pass
    human_judgment: false
duration: 22min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 10: Rust/Zig/WASM Host Authority Summary

**Rust and Zig now share one inactive v1.17 WASI payload ABI: guests emit bounded raw canonical payload bytes, the host alone classifies and authenticates the response, and execution fails closed unless exact artifact/toolchain/runtime/settings identity matches.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-07-14T11:16:48-04:00
- **Completed:** 2026-07-14T11:38:49-04:00
- **Tasks:** 2 TDD tasks plus one adversarial review fix
- **Files created:** 1
- **Files modified:** 5

## Accomplishments

- Added a v1.17 WASM/WASI adapter that sends a canonical three-field guest request and treats stdout only as method-specific Strategy payload. Duplicate keys, invalid UTF-8, noncanonical order, guest-authored envelopes, extra fields, and schema-invalid values cannot cross the raw boundary.
- Constructed and HMAC-authenticated every outer response on the host using the frozen v1.17 request, trace, payload binding, and registered three-way result vocabulary. No guest receives signing material or supplies failure ownership.
- Classified proven Strategy exceptions and fuel, memory, or output exhaustion as player violations; ambiguous traps, unavailable accounting, host faults, and transport faults remain retry-policy-aware system failures.
- Bound immutable artifact bytes and metadata to a fresh exact observation of compiler executable/version/target/flags, Rust target libdir or Zig no-stdlib input, Wasmtime executable/version, adapter build, CLI settings, containment profile, and unsupported meters before guest startup.
- Generated real Rust/Zig candidate probes and a schema-identical committed fixture. Both lanes remain `uncertified`, the v1.17 contract remains inactive, and `productionTrustedProducers` remains empty.
- Preserved the six legacy v1.22 evidence artifacts byte-for-byte while extending their evaluator additively.

## Task Commits

1. **Task 1 RED: Expose WASM host-authority and ownership gaps** — `bec7285`
2. **Task 1 GREEN: Authenticate host-owned WASM payloads** — `699283e`
3. **Task 2 RED: Expose exact identity and fixture gaps** — `9c04747`
4. **Task 2 GREEN: Bind exact WASM execution identity** — `a4dc64a`
5. **Review RED: Expose stale artifact compiler metadata** — `b38d7b8`
6. **Review fix: Reject stale artifact toolchains** — `bfbc2dc`

## Verification

- Full `@cowards/runtime-wasm-wasi` suite passed **27/27** with Rust and Zig available; candidate proof used no conditional skip.
- The evaluator passed **19/19** hostile/real-runtime probes with rustc 1.95.0, Zig 0.16.0, and Wasmtime 45.0.0, including real raw-payload success for both languages.
- `pnpm exec tsx scripts/evaluate-wasm-wasi-runtime.ts --check`, runtime package typecheck, focused ESLint, and `git diff --check` passed.
- Candidate envelope fixture SHA-256 is `cd32fedca2b87cde2e579eb92e9c44de7c545acb22bec7963000a6114b1e2e8b`; exact Rust and Zig identity IDs are `sha256:98f1165894b1408137d69f5b095c3accdc7bfa88a1d289d4f61b01dc5562676d` and `sha256:fc558635e0d1f5a4622072b4f3dd643cc78300a4d628caa61b395d0174baa44f`.
- Legacy v1.22 artifact hashes remained exact: hardening JSON `bf445e88...dd54a`, hardening Markdown `ea0576e0...dd04`, Zig JSON `5c854ad2...fd2c`, Zig Markdown `2813c039...68a`, ABI decision `9776218d...5467`, and promotion decision `3e72ee9e...b8b7`.

## Decisions Made

- Keep the compiler-neutral WASI Preview 1 command transport, but separate the canonical guest request/raw payload ABI from the authenticated host envelope. This avoids making guest code a transport or failure-classification authority.
- Treat wall-time termination and generic traps as ambiguous unless Wasmtime evidence proves the Strategy-owned cause. A timeout label or terminated process is not enough to penalize a player.
- Record enforced ceilings and observed identities exactly without claiming cross-language meter equivalence. Missing cumulative/peak/equivalent meters are explicit certification blockers, not documentation debt that a gate name can waive.
- Preserve legacy artifact evidence fields as historical carrier metadata; candidate counted status comes only from the v1.17 identity/evidence chain and remains uncertified.

## Deviations from Plan

### Auto-fixed Issues

1. **[Critical — identity enforcement] Exact toolchain and settings identity was initially recorded but not checked at invocation.**
   - **Issue:** A caller could present a stale expected toolchain/settings identity while the adapter executed the currently resolved Wasmtime binary.
   - **Fix:** Require the expected identity, independently collect the current exact identity, compare canonical identity bytes and IDs, and fail as `OUTER_FRAME_WRONG_BINDING` before guest startup.
   - **Committed in:** `a4dc64a`

2. **[Critical — artifact provenance] Artifact metadata could name a stale compiler while artifact bytes and current runtime identity still matched.**
   - **Issue:** The first exact check bound current compiler/runtime identity but did not compare the compiled artifact's compiler version and command metadata to that observation.
   - **Fix:** Added a failing stale-toolchain regression and exact compiler/version/target/command comparison before execution.
   - **Committed in:** RED `b38d7b8`, GREEN `bfbc2dc`

3. **[High — trap attribution] Generic Wasmtime trap text was initially broad enough to imply a proven Strategy exception.**
   - **Issue:** A generic runtime trap could incorrectly become player blame.
   - **Fix:** Limited positive attribution to specific Strategy-caused traps and left all other traps system-owned as ambiguous.
   - **Committed in:** `a4dc64a`

**Total deviations:** 3 auto-fixed correctness and attribution issues. **Impact:** Stronger fail-closed identity and player-blame rules; no current-runtime or gameplay activation.

## Issues Encountered

`rustc` resolves through the `rustup` invocation shim. Calling the realpath binary directly changes command semantics, so identity records the real executable bytes/path while version and target queries deliberately use the selected `rustc` invocation path. Zig and Wasmtime symlinks are similarly reduced to exact real executable digests without exposing host paths.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-11 can consume the Rust/Zig candidate fixture and exact failure vocabulary in Go parity/retry proof. Plans 258-12 and 258-13 can carry the explicit unsupported-meter posture and exact identity nodes into capability publication and the closed evidence DAG. Activation remains owned by Plan 258-14.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
