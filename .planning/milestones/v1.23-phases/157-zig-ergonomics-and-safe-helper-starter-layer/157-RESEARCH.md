# Phase 157 Research

The v1.22 Zig starter is safe but raw: it directly wires `fd_read`, `fd_write`, substring checks, and JSON envelope output. The import auditor in `packages/runtime-wasm-wasi/src/validation.ts` can prove helper capability boundaries by parsing compiled WASM imports.

The low-risk path is a no-std helper-style starter that hides repeated stdin/stdout envelope details while keeping the same Preview 1 imports. Zig std remains forbidden because it can pull in broader host capability surfaces.
