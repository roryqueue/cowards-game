---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "16"
subsystem: fresh-language-conformance-certification
tags: [typescript, python, rust, zig, docker, cgroup-v2, wasmtime]
status: complete
completed: 2026-07-16
requirements-completed: [CONF-01, CONF-03, CONF-04, CONF-05]
---

# Phase 259 Plan 16: Fresh Four-Language Certification Summary

TypeScript, Python, Rust, and Zig now each have an independently reviewable unsigned candidate built from three fresh child processes and workspaces. Every run executes the full 16-case corpus with real pinned language/runtime binaries under the Linux cgroup-v2 supervisor; no candidate uses skipped, fallback, unsupported, or synthetic evidence.

## Delivered

- Added a fixed real-lane child that compiles or prepares the exact reviewed v2 fixture, runs it in the pinned Linux image, and exercises canonical JSON, malformed output, proven resource exhaustion, timeout, stale identity, toolchain absence, transport/authentication, deterministic repeat, differential, mutation, and normative cases.
- Added a pinned Linux language probe using the exact native supervisor, seccomp profile, delegated CPU/memory/pids controllers, 64 MiB v1.18 memory policy, read-only filesystem, no network, UID 65534, and complete cgroup cleanup.
- Bound fixture, artifact, adapter, runtime executable, toolchain, sysroot/stdlib, corpus, budget, containment, semantic tuple, behavior settings, identity manifest, and evidence graph identities into every run.
- Required exactly three distinct workspaces/processes with identical per-lane identity, result, and evidence roots before emitting an unsigned candidate.
- Added `--attempt-all`, immediate per-lane result persistence, synchronized safe Markdown indexing, and a pure `--check-reviewed-lane-results` command.
- Persisted four canonical reviewed candidates with three complete runs each and the same language-neutral full-trace result root.

## Review Corrections

- Repaired fresh-workspace TypeScript execution by resolving the `tsx` import to its exact installed URL instead of relying on the temporary working directory.
- Preserved the pinned Rust toolchain under minimal child environments through explicit Rustup/Cargo roots.
- Added Rust `--remap-path-prefix` so temporary workspace paths cannot alter WASM artifact identity.
- Selected and bound Wasmtime Winch with disabled cache/parallel compilation and bounded memory reservations after default Cranelift execution exceeded the v1.18 64 MiB lane ceiling.
- Normalized persisted resource/timeout evidence to deterministic authoritative kernel/runtime facts while retaining full ephemeral receipt validation; Linux exit-detail variation can no longer create false cross-run drift.
- Kept all failures safe by default: diagnostic detail exists only behind the explicit local `COWARDS_CERTIFICATION_DEBUG=1` switch and is never written to reviewed artifacts.

## Verification

- All-language real certification: 4 lanes × 3 fresh runs × 16 mandatory cases passed.
- Pure reviewed-result checker: 4/4 canonical lane artifacts passed.
- Fresh-process certifier unit suite: 4/4 tests passed.
- Corpus/trace promotion regression suites: 7/7 tests passed.
- Focused TypeScript compilation, ESLint, Prettier, privacy scans, and canonical-byte checks passed.
- Every candidate has one unique identity, result root, and evidence root across its three runs.
- Protected working-tree baseline and exact user-file byte/diff fingerprints remained unchanged.

## Commit

- `1494159` — certify real four-language lanes

## Next Readiness

Wave 7 can extend the existing append-only authority ledger and add the Go verifier against exact current reviewed candidate bytes. The candidates remain unsigned and non-promoting until the later managed signing, verification, and import gates complete.
