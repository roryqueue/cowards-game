import { describe, expect, it } from "vitest"
import {
  buildRustStrategyRevision,
  compileRustWasmArtifact,
  validateRustStrategySource,
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

describe("WASM/WASI runtime alpha", () => {
  it("compiles Rust source to immutable WASM artifact metadata", () => {
    const compiled = compileRustWasmArtifact(rustSource)

    expect(compiled.ok).toBe(true)
    expect(compiled.artifact?.format).toBe("wasm")
    expect(compiled.artifact?.wasiProfile).toBe("preview1")
    expect(compiled.artifact?.abiEnvelope).toBe("stdin-stdout-json")
    expect(compiled.artifact?.bytesBase64).toBeTruthy()
  })

  it("runs selectActivations and soldierBrain through Wasmtime", () => {
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
  })

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
  })
})
