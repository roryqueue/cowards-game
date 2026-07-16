---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "26"
fixed_at: 2026-07-16T16:13:10Z
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 259 Plan 26: Code Review Fix Report

All five native-supervisor review blockers were fixed.

## Fixed Issues

### CR-01: Direct Linux execution lacked controller-equivalent containment

Counted launch now requires a weak-authority hardened controller context with exact Linux, cgroupfs-v2, controller, UID, kernel, Docker, image, delegation, and cleanup observations. A caller-supplied platform string cannot launch.

### CR-02: Executable identity was not enforced at exec

The wrapper passes the exact executable digest. The zero-dependency native supervisor opens with `O_NOFOLLOW`, computes SHA-256 itself, and executes the same open descriptor through `/proc/self/fd`.

### CR-03: Platform and cgroup evidence copied expected claims

Kernel and Docker hashes are derived from observed exact versions, the toolchain root is derived from exact source/lock/seccomp/builder/toolchain identity, and native receipts report actual cgroup path, UID, and read-back CPU/memory/PID settings before the shared verifier accepts them.

### CR-04: Authenticated environment was discarded

Bounded environment entries are serialized into the native protocol and applied exactly after `env_clear`. The real Docker guest proves the expected environment and cannot access the protected cancellation root.

### CR-05: Cancellation and cleanup were not fail-safe

The native process is a subreaper, polls the authenticated cancellation channel, rejects ambiguous exit races, requires process-group and cgroup kill, waits for recursive empty state, reaps adopted children, and requires cgroup removal. The trusted Docker finalizer performs independent recursive cleanup and never suppresses failure.

## Commits

- `4904423` — reproduce supervisor containment blockers
- `0bf4e27` — close native supervisor containment blockers
- `a2e3f58` — keep pinned manifest reproducible and formatted

## Verification

- Rust: 7/7 locally and 7/7 in the pinned Linux builder
- Focused review matrix: 13/13
- Supervisor package: 20/20
- Real pinned Docker controller: success, environment, timeout, live cancellation, substitution, prelaunch cancellation, and cleanup passed
- Repository typecheck: 27/27 tasks
- Repository lint: 15/15 packages
- Boundary imports: zero strict offenses
- Protected planning/specification and lock files: unchanged

No production lane was activated.
