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
7. **Independent review RED: Expose preflight, ABI, stderr, and built-identity gaps** — `d907419`
8. **Independent review fix: Close WASM review boundary gaps** — `0f8161c`
9. **External rereview RED: Expose remaining canonicality, provenance, and identity gaps** — `b021476`
10. **External rereview fix: Close remaining WASM authority gaps** — `8c332fa`
11. **Source-attestation RED: Expose unbound source bytes and overstated stderr metering** — `96315ea`
12. **Source-attestation fix: Bind typed source evidence and report truthful stderr posture** — `a630e72`
13. **Strict-schema RED: Expose open source-attestation records** — `6a9e0eb`
14. **Strict-schema fix: Reject unknown source-attestation fields** — `995c8f8`
15. **Semantic-identity RED: Expose impossible identities and post-attestation size gaps** — `f30d4e7`
16. **Semantic-identity fix: Enforce normalization invariants and final artifact limits** — `ebc2fe1`
17. **Final-newline RED: Expose the all-newline false-final counterexample** — `e83f50f`
18. **Final-newline fix: Enforce final-newline identity consistency** — `e1a75a5`

## Verification

- Full `@cowards/runtime-wasm-wasi` suite passed **38/38** with Rust and Zig available; candidate proof used no conditional skip.
- The evaluator passed **19/19** hostile/real-runtime probes with rustc 1.95.0, Zig 0.16.0, and Wasmtime 45.0.0, including real raw-payload success for both languages.
- `pnpm exec tsx scripts/evaluate-wasm-wasi-runtime.ts --check`, runtime package typecheck, focused ESLint, and `git diff --check` passed.
- Candidate envelope fixture SHA-256 is `ed55a9dccf2a69e55d78e80aa37160e0a55c6da42eb78867a3090c43c2f3c1ef`; exact Rust and Zig identity IDs are `sha256:1d0a3033ae126146280169d5f2827de1611b85e53879f704abde98b6699f6bbb` and `sha256:a3dd1815362814df994db620388738e64a40575671f4fd74f7bd0ca497101ebe`.
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

## Review Closure Addendum

Independent review found four release-blocking boundary gaps and closed all four before Plan 258-11 handoff:

1. Artifact-import validation, temporary-directory creation, write/execute setup, and cleanup faults now return authenticated `system_failure` outcomes; none can escape as an unauthenticated throw or become player blame.
2. Candidate compilers construct artifacts under the explicit v1.17 raw-payload ABI declaration. The adapter rejects legacy v1.14 artifacts, stale source hashes, and mismatched runtime/adapter tuples instead of relabeling or executing them.
3. Stdout and stderr ceilings are enforced independently and exactly. Only proven guest output exhaustion is a player violation; ambiguous runtime/transport stderr remains a retry-policy-aware system failure.
4. Adapter-build identity resolves sibling modules by the imported module's emitted extension. A fresh package build imported `dist/validation.js`, collected identity from three emitted `.js` files, and produced build digest `sha256:bf8f1d89936b40707365417b9b1300051b2fbf5ae20f6a0718bf2523c48e57eb`; no sibling `.ts` dependency remained.

The follow-up independent-style rereview found and fixed two assurance issues before closure: candidate ABI metadata is now selected during compilation rather than overlaid onto a legacy result, and the resolver regression creates isolated emitted-module fixtures so a clean test checkout does not depend on a pre-existing `dist/` tree. Final gates passed: **33/33** package tests, package build and typecheck, focused ESLint, evaluator **19/19** in write and `--check` modes, emitted-JavaScript identity collection, `git diff --check`, and exact preservation of all six legacy v1.22 evidence hashes. Remaining review findings: **0**.

## Second External Review Closure

External rereview reopened Plan 258-10 with three High and three Medium findings. RED commit `b021476` reproduced six expected failures, including acceptance of raw `1.0` as canonical JSON and selection of the rustup proxy digest instead of the actual rustc binary. GREEN commit `8c332fa` closed every finding:

1. Successful guest stdout must now equal the admitted canonical bytes byte-for-byte before schema validation; parseable alternate encodings, whitespace, or numeric spellings fail as authenticated invalid output.
2. Wasmtime stderr text and exit status no longer infer Strategy exceptions, fuel exhaustion, or memory exhaustion. Those cases remain system-owned unless an observation carries the matching structured host provenance.
3. Rust identity resolves `rustup which rustc`, hashes the selected compiler executable, and separately binds the rustup invocation shim. The candidate evidence now records selected rustc SHA-256 `fcf2ce6f5b55d90d29867767262ad179ed761a8b54d24b5c181c535fa05ced19`.
4. Adapter build identity incorporates exact digests for the engine source/package manifest, spec source/package manifest, and workspace lockfile. A fresh built import bound three emitted JavaScript files plus those three dependency digests and produced `sha256:5044e4938f0ef90026d5012b841f8d8d6d8d9233fa6888c122179980ca4f96d1`.
5. Candidate revisions no longer expose an unbound `sourceBytes` field. Invocation authority is the immutable revision ID, original/normalized source hashes, artifact hash, runtime tuple, and artifact source hash.
6. Per-invocation stderr is independently capped at 16,384 bytes, records missing guest-stderr provenance as an unsupported meter, and is always system-owned without independent provenance—even for status zero or simultaneous stdout overflow.

The final independent rereview also verified system-failure precedence when stdout and stderr overflow together and rejected claimed proven exception/fuel/memory attributions lacking structured host provenance. Final gates passed: **38/38** package tests, evaluator **19/19** in write and `--check` modes, package build and typecheck, focused ESLint, emitted-JavaScript/dependency-closure identity collection, `git diff --check`, and exact preservation of all six legacy v1.22 evidence hashes. Remaining external findings: **0**.

## Source Attestation and Final External Review Closure

A later source-identity review reopened Plan 258-10 and closed every finding without changing gameplay or activating either WASM lane:

1. Rust and Zig candidate compilation now derives a typed v2 identity from the actual original and LF-normalized source bytes. The identity binds domain-framed hashes, byte counts, exact line-ending counts, and final-newline state into the artifact, revision, request, and execution identity.
2. The compiler embeds that identity in the `cowards.source-identity.v1.17` WASM custom section. Runtime preflight reads exactly one canonical section and compares its fingerprint with the artifact, revision, and authenticated request, so coherent caller relabeling cannot substitute another source identity.
3. Source-attestation records are closed at both levels. Unknown top-level or `lineEndings` fields fail, and semantic validation enforces exact CRLF byte normalization, sufficient bytes for declared line endings, consistent line-ending kind, and necessary final-newline relationships.
4. Candidate compilation rechecks the final artifact after appending the attestation, and runtime preflight independently rejects decoded artifacts above the 4 MiB canonical cap before parsing or executing them.
5. The lane no longer claims an independent host stderr byte meter. Its shared post-capture buffer is safety-only; guest stderr attribution and an independent host stderr ceiling remain explicit unsupported certification requirements. Both lanes remain `uncertified`, with no production-trusted producer.

The final independent confirmation rejected the one-byte/one-LF `hasFinalNewline: false` counterexample, accepted derived valid final and non-final identities, and confirmed both compiler and runtime artifact caps. Superseding final gates passed: **44/44** package tests; evaluator **19/19** in write and `--check` modes; package build and typecheck; focused ESLint; emitted identity from three JavaScript files, three dependency digests, and typed source evidence; `git diff --check`; and exact preservation of all six legacy v1.22 hashes. The committed fixture SHA-256 is `fd9450d8c1eb685ae909e65084085824cb8628c75d6b24118a7b3b9b35dd8271`; final Rust and Zig identity IDs are `sha256:360169eb6f84128f93c454ec2fc557477eabd63f8226e6f44a12b87130f2ce5c` and `sha256:2fa0e95494f3ebf5d14b7125ca653ca44c39f5c487639e0744ed11d0de4e339a`. Final external findings: **0**.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
