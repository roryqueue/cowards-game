import { describe, expect, it } from "vitest"
import { STRATEGY_RUNTIME_ABI_VERSION } from "@cowards/spec"
import {
  buildRustStrategyRevision,
  buildZigStrategyRevision,
  compileRustWasmArtifact,
  compileZigWasmArtifact,
} from "./validation.js"
import { createWasmWasiRuntimeFromRevision } from "./wasm-wasi-subprocess-adapter.js"
import {
  createCandidateObservationTransportRequestV119,
  executeCandidateObservationTransportV119,
} from "../../runtime-js/src/revision-v1-19.js"

const context = {
  entrantPlayerIds: ["player:bottom", "player:top"] as const,
  observingPlayerId: "player:bottom",
}

const strategyInput = {
  phaseNumber: 1,
  roundNumber: 2,
  activationCount: 1,
  board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers: [], terrainStones: [] },
  mySoldiers: [],
  enemySoldiers: [],
  strategyMemory: null,
  initialInitiativePlayerId: "player:bottom",
  hasInitialInitiative: true,
  roundInitiativePlayerId: "player:top",
  hasRoundInitiative: false,
} as const

const brainInput = {
  self: {
    id: "soldier:bottom:1",
    ownerPlayerId: "player:bottom",
    status: "ACTIVE",
    position: { x: 2, y: 2 },
    facing: "UP",
    lastSuccessfulMoveDirection: null,
  },
  awarenessGrid: { cells: [] },
  cycleIndex: 2,
  maxCycles: 12,
  soldierMemory: null,
  hasAdvancedThisActivation: true,
} as const

const rustSource = `
use std::io::{self, Read};
fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\\"methodName\\\":\\\"soldierBrain\\\"") {
        let observed = input.contains("\\\"hasAdvancedThisActivation\\\":true");
        println!(r#"{{"ok":true,"abiVersion":"${STRATEGY_RUNTIME_ABI_VERSION}","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":{{"lane":"rust","observed":{}}}}}}}"#, observed);
    } else {
        let observed = input.contains("\\\"initialInitiativePlayerId\\\":\\\"player:bottom\\\"")
            && input.contains("\\\"hasInitialInitiative\\\":true")
            && input.contains("\\\"roundInitiativePlayerId\\\":\\\"player:top\\\"")
            && input.contains("\\\"hasRoundInitiative\\\":false");
        println!(r#"{{"ok":true,"abiVersion":"${STRATEGY_RUNTIME_ABI_VERSION}","value":{{"activationOrders":[],"strategyMemory":{{"lane":"rust","observed":{}}}}}}}"#, observed);
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
    var i: usize = 0;
    while (i <= haystack.len - needle.len) : (i += 1) {
        var j: usize = 0;
        while (j < needle.len and haystack[i + j] == needle[j]) : (j += 1) {}
        if (j == needle.len) return true;
    }
    return false;
}
fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}
export fn _start() void {
    var input_buf: [32768]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    const input = input_buf[0..nread];
    if (contains(input, "\\\"methodName\\\":\\\"soldierBrain\\\"")) {
        const observed = contains(input, "\\\"hasAdvancedThisActivation\\\":true");
        if (observed) writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${STRATEGY_RUNTIME_ABI_VERSION}\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":{\\"lane\\":\\"zig\\",\\"observed\\":true}}}\\n") else writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${STRATEGY_RUNTIME_ABI_VERSION}\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":{\\"lane\\":\\"zig\\",\\"observed\\":false}}}\\n");
    } else {
        const observed = contains(input, "\\\"initialInitiativePlayerId\\\":\\\"player:bottom\\\"") and contains(input, "\\\"hasInitialInitiative\\\":true") and contains(input, "\\\"roundInitiativePlayerId\\\":\\\"player:top\\\"") and contains(input, "\\\"hasRoundInitiative\\\":false");
        if (observed) writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${STRATEGY_RUNTIME_ABI_VERSION}\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":{\\"lane\\":\\"zig\\",\\"observed\\":true}}}\\n") else writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${STRATEGY_RUNTIME_ABI_VERSION}\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":{\\"lane\\":\\"zig\\",\\"observed\\":false}}}\\n");
    }
}
`

const rustProbe = compileRustWasmArtifact(rustSource)
const zigProbe = compileZigWasmArtifact(zigSource)

describe("Rust and Zig v1.19 observation transport", () => {
  it.skipIf(!rustProbe.ok || !zigProbe.ok)(
    "consumes every candidate field through both real WASM/WASI lanes",
    () => {
      for (const [lane, revision] of [
        ["rust", buildRustStrategyRevision({ source: rustSource })],
        ["zig", buildZigStrategyRevision({ source: zigSource })],
      ] as const) {
        const runtime = createWasmWasiRuntimeFromRevision(revision)
        const selectionRequest = createCandidateObservationTransportRequestV119({
          method: "selectActivations",
          kernelRequestId: `effect:v1.19:${lane}:selection`,
          semanticTupleId: "tuple:v1.19:candidate",
          input: strategyInput,
          ...context,
        })
        const selection = executeCandidateObservationTransportV119(
          selectionRequest,
          ({ input, signedInputBytes }) => {
            expect(signedInputBytes).toEqual(selectionRequest.signedInputBytes)
            const result = runtime.selectActivations(input as never)
            if (!result.ok) throw new Error(`${lane} selection fixture failed`)
            return { kind: "success" as const, value: result.value }
          },
        )
        expect(selection).toMatchObject({
          kind: "success",
          value: { strategyMemory: { lane, observed: true } },
        })

        const brainRequest = createCandidateObservationTransportRequestV119({
          method: "soldierBrain",
          kernelRequestId: `effect:v1.19:${lane}:brain`,
          semanticTupleId: "tuple:v1.19:candidate",
          input: brainInput,
          ...context,
        })
        const brain = executeCandidateObservationTransportV119(
          brainRequest,
          ({ input, signedInputBytes }) => {
            expect(signedInputBytes).toEqual(brainRequest.signedInputBytes)
            const result = runtime.runSoldierBrain(input as never)
            if (!result.ok) throw new Error(`${lane} brain fixture failed`)
            return { kind: "success" as const, value: result.value }
          },
        )
        expect(brain).toMatchObject({
          kind: "success",
          value: { soldierMemory: { lane, observed: true } },
        })
      }
    },
    30_000,
  )
})
