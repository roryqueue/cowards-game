import { describe, expect, it } from "vitest"
import {
  buildZigStrategyRevision,
  compileZigWasmArtifact,
  buildRustStrategyRevision,
  compileRustWasmArtifact,
  validateRustStrategySource,
  validateZigStrategySource,
  zigReadinessEvidence,
} from "./validation.js"
import { createWasmWasiRuntimeFromRevision } from "./wasm-wasi-subprocess-adapter.js"

const rustSource = `
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`

const zigSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn contains(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return true;
    if (haystack.len < needle.len) return false;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }
    return false;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    if (contains(input_buf[0..nread], "\\"methodName\\":\\"soldierBrain\\"")) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`

const rustCompileProbe = compileRustWasmArtifact(rustSource)
const zigCompileProbe = compileZigWasmArtifact(zigSource)

describe("WASM/WASI runtime alpha", () => {
  it.skipIf(!rustCompileProbe.ok)(
    "compiles Rust source to immutable WASM artifact metadata",
    () => {
      const compiled = compileRustWasmArtifact(rustSource)

      expect(compiled.ok).toBe(true)
      expect(compiled.artifact?.format).toBe("wasm")
      expect(compiled.artifact?.wasiProfile).toBe("preview1")
      expect(compiled.artifact?.abiEnvelope).toBe("stdin-stdout-json")
      expect(compiled.artifact?.bytesBase64).toBeTruthy()
    },
  )

  it.skipIf(!rustCompileProbe.ok)(
    "runs selectActivations and soldierBrain through Wasmtime",
    () => {
      const revision = buildRustStrategyRevision({ source: rustSource })
      const runtime = createWasmWasiRuntimeFromRevision(revision)

      expect(
        runtime.selectActivations({
          phaseNumber: 1,
          roundNumber: 1,
          activationCount: 1,
          board: {
            bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
            soldiers: [],
            terrainStones: [],
          },
          mySoldiers: [],
          enemySoldiers: [],
          strategyMemory: null,
        }),
      ).toEqual({
        ok: true,
        value: { activationOrders: [], strategyMemory: null },
      })
      expect(
        runtime.runSoldierBrain({
          self: {
            id: "soldier:1",
            ownerPlayerId: "player:1",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
          awarenessGrid: { cells: [] },
          cycleIndex: 0,
          maxCycles: 12,
          soldierMemory: null,
        }),
      ).toEqual({
        ok: true,
        value: { action: { type: "TURN_TO_STONE" }, soldierMemory: null },
      })
    },
  )

  it.skipIf(!zigCompileProbe.ok)(
    "compiles and runs Zig through the same WASI JSON artifact contract",
    () => {
      const compiled = compileZigWasmArtifact(zigSource)
      expect(compiled.ok).toBe(true)
      expect(compiled.artifact?.format).toBe("wasm")
      expect(compiled.artifact?.targetTriple).toBe("wasm32-wasi")
      expect(compiled.artifact?.toolchain.language).toBe("zig")

      const revision = buildZigStrategyRevision({ source: zigSource })
      const runtime = createWasmWasiRuntimeFromRevision(revision)

      expect(
        runtime.runSoldierBrain({
          self: {
            id: "soldier:1",
            ownerPlayerId: "player:1",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
          awarenessGrid: { cells: [] },
          cycleIndex: 0,
          maxCycles: 12,
          soldierMemory: null,
        }),
      ).toEqual({
        ok: true,
        value: { action: { type: "TURN_TO_STONE" }, soldierMemory: null },
      })
    },
    20_000,
  )

  it("fails validation for forbidden Rust host capabilities", () => {
    const validation = validateRustStrategySource(
      `${rustSource}\nfn bad() { let _ = std::fs::read_to_string("/etc/passwd"); }`,
    )

    expect(validation.valid).toBe(false)
    expect(validation.forbiddenPatterns).toContain("std::fs")
  })

  it("records Zig readiness without promoting Zig execution", () => {
    const evidence = zigReadinessEvidence()

    expect(evidence.target).toBe("wasm32-wasi")
    expect(evidence.message).toContain("Zig")
    expect(evidence.compileProof).toBe(evidence.ok)
    expect(evidence.runtimeProof).toBe(evidence.ok)
  }, 20_000)

  it("fails Zig validation for std-backed host capabilities", () => {
    const validation = validateZigStrategySource(
      `${zigSource}\nconst std = @import("std");`,
    )

    expect(validation.valid).toBe(false)
    expect(validation.forbiddenPatterns).toContain('@import("std")')
  })
})
