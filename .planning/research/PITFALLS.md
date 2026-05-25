# Pitfalls Research: v1.21 WASM/WASI Multi-Language Runtime Candidate

**Project:** Coward's Game
**Milestone:** v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha
**Researched:** 2026-05-25

## Pitfalls And Prevention

| Pitfall | Prevention |
| --- | --- |
| Treating WASM/WASI as automatic production sandbox certification | Use "candidate", "alpha/beta", and "readiness evidence" language until explicit promotion evidence exists. |
| Accidentally accepting Node `node:wasi` as hostile-code isolation | Keep monitor gates forbidding `node:wasi` sandbox promotion and use Wasmtime for candidate proof. |
| Running mutable Rust source during Matches | Require immutable artifact hash/bytes/metadata for Match eligibility and prove source changes do not affect submitted Matches. |
| Designing a Rust-shaped ABI | Use language-neutral JSON envelopes and optionally prove Zig through the same ABI. |
| Hiding failures behind JS/TS or Python fallback | Add no-fallback drills for missing artifact, missing Wasmtime, unsupported adapter, stale hash, malformed output, and stopped runtime-service. |
| Over-scoping component model | Document P2/component model as future direction; do not block v1.21 on WIT/binding generation unless explicitly replanned. |
| Missing determinism hazards | Probe time, random, filesystem, network, memory growth, fuel/timeout, panic/trap, and output behavior. |
| Leaking compile/runtime internals | Redact stderr, stack, host paths, env, tokens, DB DSNs, package paths, artifact internals, source, memory, and objectives from public outputs. |
| Breaking JS/TS counted path | Include JS/TS regression tests and signed-in JS/TS-vs-Rust proof. |
| Letting Rust/Zig own backend behavior | Keep Go ownership and runtime-service-only execution monitors explicit. |
| Treating Zig availability as guaranteed | Gate Zig on real local compile/runtime evidence and record fail-loud non-promotion if it fails. |
| Running unbounded stress tests | Use bounded hostile probes and signed-in proof repeat counts. |

## Watch Points For Phase Planning

- The first phase should lock the ABI and artifact contract before implementation branches into Rust/Zig details.
- Rust compile validation must distinguish validation-time source handling from Match-time artifact execution.
- Runtime-service tests must classify Strategy failure separately from system/runtime failure.
- Browser proof must include replay board realism checks for visible Soldier and terrain positions.
- Public promotion decision must explicitly say JS/TS remains counted, Python remains non-counted exhibition beta, Rust/WASM remains non-counted exhibition alpha/beta, and Zig is stretch-only unless proven.

---
*Research written: 2026-05-25*
