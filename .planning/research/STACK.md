# Stack Research: v1.21 WASM/WASI Multi-Language Runtime Candidate

**Project:** Coward's Game
**Milestone:** v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha
**Researched:** 2026-05-25

## Stack Additions

- Preserve the normal product topology: Next.js web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s).
- Add a `runtime-wasm-wasi` broker/runtime target or equivalent registry entry that remains runtime-only and non-counted.
- Use WASI Preview 1 as the first executable ABI lane: compiled module reads a schema-validated JSON request from stdin and writes a schema-validated JSON response to stdout.
- Use Wasmtime as the local runtime candidate because it is installed locally (`wasmtime 45.0.0`) and supports WASI execution, fuel, timeout, memory/resource options, and deterministic execution controls.
- Use Rust `wasm32-wasip1` as the first net-new language target. Local tooling is available: `rustc 1.95.0`, `cargo 1.95.0`, `rustup`, and installed target `wasm32-wasip1`.
- Use `wasm-tools 1.250.0` for artifact inspection/hash/readiness checks where useful.
- Treat Zig as a gated stretch target. Local `zig 0.16.0` is available and official Zig docs show `wasm32-wasi` build support, but v1.21 should require compile/runtime evidence before claiming Zig support.

## Stack Non-Additions

- No Rust, Zig, or WASM backend service.
- No Go/web/API Strategy execution.
- No Node `node:wasi` sandbox promotion.
- No production sandbox certification from local Wasmtime evidence alone.
- No arbitrary Cargo/Zig package installation as a product feature.
- No direct-export or component-model Strategy ABI promotion unless explicitly proven and replanned.
- No ranked, ladder, counted, gauntlet, or broad production multi-language support for Rust/Zig/WASM.

## Evidence Sources

- Rust `wasm32-wasip1` docs: https://doc.rust-lang.org/stable/rustc/platform-support/wasm32-wasip1.html
- WASI interfaces overview: https://wasi.dev/interfaces
- Wasmtime interruption/fuel docs: https://docs.wasmtime.dev/examples-interrupting-wasm.html
- Wasmtime WASI context docs: https://docs.wasmtime.dev/api/wasmtime_wasi/struct.WasiCtxBuilder.html
- Zig WASI docs: https://ziglang.org/documentation/master/#WASI
- Node WASI warning: https://nodejs.org/api/wasi.html

## Recommended Stack Direction

Use a conservative, executable lane first: WASI Preview 1 stdin/stdout JSON through Wasmtime. That path is less elegant than direct exports or WIT/component model, but it minimizes ABI complexity, works with Rust today, gives Zig a realistic stretch path, and lets hostile/determinism probes target concrete behavior.

---
*Research written: 2026-05-25*
