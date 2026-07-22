---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "12"
subsystem: supervised-wasm-wasi
tags: [rust, zig, wasmtime, supervisor, conformance]
status: complete
completed: 2026-07-16
requirements-completed: [CONF-01, CONF-03, CONF-04]
---

# Phase 259 Plan 12: Supervised Rust and Zig Lane Summary

Rust and Zig now have distinct additive v1.18 counted-candidate adapters that run Wasmtime only through the shared native Linux cgroup-v2 supervisor. Wasmtime-local fuel and memory observations remain separate defense-in-depth evidence and never substitute for the common host meter.

## Delivered

- Added immutable supervised selectors for separate Rust and Zig lanes with no direct or container-only counted fallback.
- Added exact compiler, target, flags, sysroot, Wasmtime, adapter, source, artifact, and lane-manifest identity derivation.
- Added a host-owned injected supervisor launch boundary; the package exports no controller-authority mint or direct subprocess path.
- Required exact Wasmtime executable identity, argument vector, local defense settings, empty environment, invocation binding, supervisor receipt, cgroup containment, and Ed25519 evidence signature.
- Preserved the common signed CPU, wall, memory, PID, byte, cancellation, and empty-cgroup evidence while labeling Wasmtime fuel and linear memory with their own non-equivalent units.
- Rejected cross-lane, stale source/compiler/sysroot/artifact/manifest, alternate supervisor, malformed receipt, cancellation ambiguity, unresolved trap, meter substitution, private diagnostic extension, invalid payload, and forged signer cases as no-mutation system failures.
- Kept every existing v1.17 WASI source and behavior byte-immutable.

## Review Corrections

- Bound the frozen execution descriptor back to the invocation's executable, argv, and environment identity before launch.
- Required the local-defense object and nested fuel/memory records to have exact closed keys so host diagnostics cannot enter signed evidence.
- Cloned local-defense evidence before freezing it, avoiding mutation of caller-owned host observations.
- Verified canonical Ed25519 signatures against the pinned public key and key ID.

## Verification

- Focused v1.18 suites: 2 files, 12 tests passed.
- Complete WASI package suite: 4 files, 68 tests passed, including available real Rust and Zig compile/Wasmtime execution coverage.
- Package typecheck and lint passed.
- Focused Prettier and `git diff --check` passed.
- Public exports contain only safe selector, identity, adapter, and evidence contracts.
- Protected planning/specification files and the lockfile were not modified.

## Commits

- `34a974c` — require supervised Wasmtime lane evidence
- `cb357c7` — add supervised Rust and Zig lanes

## Next Readiness

Plan 259-13 can now execute the full immutable corpus through the TypeScript, Python, Rust, and Zig supervised adapters and compare all four lanes to the committed trace oracle.
