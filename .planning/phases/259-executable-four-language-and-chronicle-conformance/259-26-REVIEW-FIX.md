---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "26"
fixed_at: 2026-07-16T16:48:00Z
iteration: 2
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

## Final Independent Review Remediation

### CR-01: Public controller authority minting

The package root now exports only safe public contracts and execution/probe entry points. Controller branding and declaration-shaped context factories remain package-internal; public consumers cannot mint counted authority.

### CR-02: Supervisor binary hash/exec race

Native launch opens the supervisor with `O_NOFOLLOW`, hashes that descriptor, inherits it as child fd 3, and executes `/proc/self/fd/3`. The Docker path stages verified bytes into an exclusive private file and revalidates them after use.

### CR-03: Binding mismatch cleanup bypass

Every post-launch failure now routes through one mandatory trusted cleanup function. A receipt binding mismatch cannot return before empty-and-removed cleanup succeeds.

### CR-04: False distinct-UID claim and process introspection

The legacy nested-user-namespace launcher is explicitly not counted. Docker launches the guest separately as host UID/GID 65534 while the capability-free monitor remains host UID/GID 65532. The guest receives a private PID/proc view, no cgroup/control mount, no network, no capabilities, and no-new-privileges.

### CR-05: Declared rather than measured target

The build pins `--platform linux/amd64`, verifies `uname -m`, exact Rust and Cargo versions, uses the explicit `x86_64-unknown-linux-musl` target, and rejects any non-x86-64 or dynamically linked ELF before manifest issuance.

## Final Commits

- `de44ca0` — reproduce final supervisor authority blockers
- `cd3996f` — close final supervisor authority gaps
- `b7c62fb` — finalize controller-owned cgroup cleanup

## Final Verification

- Focused regression matrix: 19/19
- Runtime-supervisor package: 25/25
- Rust: 9/9 local, 12/12 pinned Linux/amd64, zero dependencies
- Exact build manifest reproduction: passed
- Real Docker bootstrap, distinct-UID guest, private proc view, aggregate receipt, empty proof, and final removal: passed
- Package build, typecheck, lint, formatting, and protected-file checks: passed
