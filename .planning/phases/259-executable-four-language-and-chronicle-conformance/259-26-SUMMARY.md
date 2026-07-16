---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "26"
subsystem: native-runtime-supervision
tags: [rust, cgroup-v2, docker, seccomp, landlock, deterministic-execution]

requires:
  - phase: 259-25
    provides: Canonical supervisor request, raw-receipt, and privacy-safe evidence contract
provides:
  - Zero-dependency pinned Rust Linux cgroup-v2 supervisor
  - Exact source, lock, toolchain, target, seccomp, and binary identity manifest
  - Hardened two-stage Docker cgroupfs-v2 certification controller
  - Executable distinct-UID, capability-drop, descendant-accounting, path-hiding, and cleanup proof
affects: [259-10, 259-11, 259-12, 259-31, four-language-conformance]

tech-stack:
  added: []
  patterns:
    - zero-dependency Rust std plus explicit Linux FFI
    - one nonce-bound cgroup-v2 subtree per invocation
    - fail-closed exact native binary and Linux environment identity
    - trusted short-lived bootstrap/finalizer around an unprivileged long-lived supervisor

key-files:
  created:
    - packages/runtime-supervisor/native/Cargo.toml
    - packages/runtime-supervisor/native/Cargo.lock
    - packages/runtime-supervisor/native/src/main.rs
    - packages/runtime-supervisor/native/seccomp/moby-v0.2.1-userns-landlock.json
    - packages/runtime-supervisor/native/runtime-supervisor-manifest.json
    - packages/runtime-supervisor/src/native-supervisor.ts
    - packages/runtime-supervisor/src/native-supervisor.test.ts
    - packages/runtime-supervisor/src/linux-certification-container.ts
    - packages/runtime-supervisor/src/linux-certification-container.test.ts
    - scripts/build-runtime-supervisor.ts
    - scripts/build-runtime-supervisor.test.ts
  modified:
    - packages/runtime-supervisor/src/index.ts

key-decisions:
  - "Counted supervision is Linux cgroup-v2 only; native non-Linux attempts fail before child launch with a stable unsupported result."
  - "The supervisor runs as host UID/GID 65532 with every capability dropped, then maps the guest into a user namespace as UID/GID 65534 and hides the delegated cgroup through a private mount namespace plus Landlock."
  - "The exact Docker 29.4.0, cgroupfs-v2, pinned kernel, pinned Alpine image, pinned Rust builder, custom digest-bound seccomp profile, controller set, UID tuple, source, lock, and binary identity are all admission requirements."
  - "No workspace wiring, build manifest, or documentation label grants counted authority; only executable conformance through the exact controller does."

patterns-established:
  - "Supervisor lifecycle: validate delegation -> normalize exact controllers -> create 0700 invocation cgroup -> place child before exec -> account aggregate counters -> kill/reap on deadline -> prove cgroup empty -> emit receipt -> remove subtree."
  - "Certification lifecycle: exact preflight -> trusted capability-limited bootstrap -> unprivileged supervisor probe -> trusted descriptor-validating finalizer, with cgroup.kill cleanup on failure."

requirements-completed: [CONF-01, CONF-03, CONF-04]

coverage:
  - id: D1
    description: "The zero-dependency native supervisor owns exact cgroup-v2 limits, aggregate counters, output capture, deadline termination, empty-cgroup proof, and receipt production."
    requirement: CONF-01
    verification:
      - kind: unit
        ref: cargo test --locked --manifest-path packages/runtime-supervisor/native/Cargo.toml
        status: pass
      - kind: integration
        ref: COWARDS_RUN_CONTAINER_SANDBOX=1 pnpm exec tsx scripts/build-runtime-supervisor.ts --build-linux-container --check
        status: pass
    human_judgment: false
  - id: D2
    description: "A pinned hardened Docker controller proves distinct guest identity, zero capabilities, no-new-privileges, hidden cgroup authority, descendant accounting, empty cleanup, and exact environment identity."
    requirement: CONF-03
    verification:
      - kind: integration
        ref: packages/runtime-supervisor/src/linux-certification-container.test.ts
        status: pass
      - kind: executable-proof
        ref: scripts/build-runtime-supervisor.ts --build-linux-container --check
        status: pass
    human_judgment: false
  - id: D3
    description: "Source, Cargo.lock, seccomp profile, builder, Rust/Cargo versions, target, controller/UID settings, and binary bytes are verified before launch with no adapter fallback."
    requirement: CONF-04
    verification:
      - kind: unit
        ref: packages/runtime-supervisor/src/native-supervisor.test.ts
        status: pass
      - kind: integration
        ref: pnpm exec tsx scripts/build-runtime-supervisor.ts --build --check
        status: pass
    human_judgment: false

completed: 2026-07-16
status: complete
---

# Phase 259 Plan 26: Native Linux Supervisor and Certification Controller Summary

**Counted runtime execution now has one authenticated package-free Linux cgroup-v2 supervisor and one exact hardened Docker certification path that fail closed before launch on identity, delegation, containment, or toolchain drift.**

## Accomplishments

- Implemented a zero-dependency Rust supervisor that creates one nonce-bound invocation cgroup, installs exact CPU/memory/PID limits, moves the session leader into it before guest execution, captures bounded exact output, reads aggregate counters, terminates the process group and cgroup on deadline, and emits no receipt until every member is reaped.
- Added source/lock/seccomp/toolchain/target/settings/binary identity verification. The pinned manifest currently binds Rust 1.95.0, Cargo 1.95.0, `x86_64-unknown-linux-musl`, the official digest-addressed Rust builder, and the digest-addressed custom seccomp profile.
- Added a two-stage Docker controller: a short-lived trusted bootstrap provisions only `/cowards/<run-id>`, the supervisor runs unprivileged with a subtree-only bind and no network/capabilities, and a trusted finalizer proves the root empty and removes it.
- Executably proved guest UID 65534, supervisor host UID 65532, all guest capability sets zero, `NoNewPrivs=1`, cgroup path denial across a nested user/mount namespace, short-lived descendant inclusion (`pidsPeak >= 2`), receipt production only after empty-cgroup proof, and final delegation removal.
- Closed the final adversarial review blockers: counted launch now requires a branded observed controller context; executable bytes are hashed from an `O_NOFOLLOW` descriptor and executed through the same descriptor; authenticated environment entries reach the guest exactly; kernel, Docker, cgroup, UID, settings, and toolchain observations replace caller assertions; and every timeout/cancellation/error path owns verified descendant cleanup.
- Preserved private boundaries: no Strategy source/artifact mount enters bootstrap, no host-wide cgroup mount enters the supervisor, no raw host path or diagnostic is added to public/default output, and no production lane is activated.

## Task Commits

1. **Task 1 RED: require Linux supervisor invariants** — `8cb7b9d`
2. **Task 1 GREEN: implement Linux cgroup aggregate supervisor** — `6e55183`
3. **Task 2 RED: require pinned native supervisor identity** — `9a32ee2`
4. **Task 2 GREEN: pin native build, verifier, manifest, and seccomp identity** — `362900e`
5. **Task 3 RED: require hardened Linux certification controller** — `9413300`
6. **Task 3 GREEN: prove hardened Linux certification controller** — `acd719b`
7. **Review RED: reproduce controller, identity, environment, and cleanup blockers** — `4904423`
8. **Review GREEN: close native supervisor containment blockers** — `0bf4e27`
9. **Review hardening: preserve formatted manifest reproducibility** — `a2e3f58`

## Decisions and Deviations

### Auto-fixed execution details

1. Docker automatically enabled `cpuset` and `io` alongside the requested cgroup parent. The supervisor removes those extras from its delegated root and rechecks the exact `cpu memory pids` set before any guest launch.
2. Because a capability-free host process cannot safely perform a host-namespace `setuid`, the approved containment design uses a new user namespace mapping the supervisor's host UID 65532 to guest namespace UID 65534, a private mount namespace, a mode-000 overlay hiding the delegated cgroup, Landlock path restrictions, all capability sets zero, and no-new-privileges. The real probe proves those properties instead of accepting them by declaration.
3. The seccomp policy is derived from pinned Moby default profile `seccomp/v0.2.1`, retains default-deny behavior, and adds only the masked user/mount namespace setup syscalls required by the trusted pre-exec path. `seccomp=unconfined` and added supervisor capabilities are absent.
4. The pinned Docker cargo-test proof initially placed the build target on a `noexec` tmpfs, correctly preventing the test binary from starting. The harness was rerun with only that isolated target tmpfs marked executable; the container remained read-only elsewhere, networkless, capability-free, and no-new-privileges.
5. Adversarial review found that the original public native seam trusted a platform string and request-provided environment identities, did not bind the exact executable at exec, discarded the authenticated guest environment, and could suppress cleanup failures. The seam now accepts only a weak-authority hardened-controller context whose exact kernel/Docker/cgroup observations are recomputed; direct caller declarations cannot activate counted execution.
6. The native controller now uses built-in package-free SHA-256, opens the guest executable with `O_NOFOLLOW`, executes through `/proc/self/fd/<fd>`, reapplies the exact authenticated environment after `env_clear`, becomes a child subreaper, polls the authenticated cancellation channel, rejects cancellation races, requires process-group plus `cgroup.kill`, waits on the recursive populated state, reaps adopted children, reads back exact cgroup settings, and treats failed removal as a system failure.
7. The real Docker proof now covers successful execution, environment delivery, guest inability to forge cancellation, deadline/hang cleanup, live host cancellation, executable substitution, cancellation-before-launch, recursive empty-cgroup proof, and final delegation removal.

These corrections preserve the approved behavior and tighten executable evidence; they do not change gameplay, ABI semantics, or production activation.

## Verification

- Native Rust tests — 7/7 passed locally and 7/7 passed in the exact pinned Rust Linux builder.
- `cargo tree --locked --depth 1` — only `cowards-runtime-supervisor`; zero crate dependencies.
- Focused review regression tests — 13/13 passed.
- `@cowards/runtime-supervisor` package tests — 20/20 passed.
- Package build, typecheck, and lint — passed.
- Exact `--build --check` manifest reproduction — passed.
- Real `--build-linux-container --check` cgroupfs-v2 success, environment, timeout, live-cancellation, substitution, prelaunch-cancellation, and cleanup certification — passed.
- Repository typecheck — 27/27 Turbo tasks passed.
- Repository lint — 15/15 packages passed.
- Boundary imports — zero strict offenses; 19 pre-existing report-only findings.
- Prettier, Cargo formatting, `git diff --check`, protected-file diff, and production source-subpath scans — passed.

## Known Stubs

None in the Plan-26 supervisor, verifier, build identity, or certification controller. Runtime adapter consumption remains owned by Plans 259-10 through 259-12; Plan 31 only provides workspace wiring.

## Next Phase Readiness

- TypeScript, Python, Rust, and Zig conformance lanes can share the exact authenticated supervisor and quantitative receipt path.
- Counted activation remains blocked until each adapter completes executable full-state/event/memory/objective/failure-trace conformance under this controller.

## Self-Check: PASSED

- All declared native, verifier, controller, build, manifest, seccomp, and test artifacts exist.
- RED/GREEN commits exist in task order.
- Exact local and pinned-container proof suites pass.
- All five final code-review blockers are closed by executable regression and real-controller proof.
- No protected spec, global planning, workspace definition, or production activation file changed.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Plan: 26*
*Completed: 2026-07-16*
