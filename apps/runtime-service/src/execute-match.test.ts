import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RuntimeExecutionServiceRequestSchema,
  type RuntimeExecutionServiceRequest,
  type StrategyRevision,
} from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { buildPythonStrategyRevision } from "@cowards/runtime-python"
import {
  buildRustStrategyRevision,
  buildZigStrategyRevision,
  compileRustWasmArtifact,
  compileZigWasmArtifact,
} from "@cowards/runtime-wasm-wasi"
import { executeRuntimeServiceRequest } from "./execute-match.js"
import {
  createRuntimeServiceConfig,
  RuntimeServiceConfigError,
} from "./runtime-config.js"

const runtimeConfig = createRuntimeServiceConfig({
  strategyExecutionAdapter: "worker-thread",
})

const arenaVariant = {
  id: "runtime-service-test-arena",
  name: "Runtime Service Test Arena",
  initialBounds: INITIAL_BOUNDS,
  terrainStones: [],
}

const passiveSource = `
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {},
    }
  },
}
`

const invalidOutputSource = `
export default {
  selectActivations() {
    return { activationOrders: "not-an-array", strategyMemory: {} }
  },
  soldierBrain() {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: {},
    }
  },
}
`

const pythonTacticalSource = `
def select_activations(input):
    active = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    return {
        "activationOrders": [
            {"soldierId": soldier["id"], "objective": {"stance": "hold"}}
            for soldier in active[: input["activationCount"]]
        ],
        "strategyMemory": input["strategyMemory"],
    }


def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": input["soldierMemory"],
    }
`

const rustWasiSource = `
use std::io::{self, Read};

fn first_active_soldier_id(input: &str) -> Option<&str> {
    let soldiers_start = input.find("\\"mySoldiers\\":[")?;
    let soldiers = &input[soldiers_start..];
    let id_start = soldiers.find("\\"id\\":\\"")? + "\\"id\\":\\"".len();
    let after_id = &soldiers[id_start..];
    let id_end = after_id.find('"')?;
    Some(&after_id[..id_end])
}

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else if let Some(soldier_id) = first_active_soldier_id(&input) {
        println!(
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"stance":"stone"}}}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`

const zigWasiSource = `
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

const rustWasiCompileProbe = compileRustWasmArtifact(rustWasiSource)
const zigWasiCompileProbe = compileZigWasmArtifact(zigWasiSource)

const requestFor = (
  input: {
    bottom?: StrategyRevision | undefined
    top?: StrategyRevision | undefined
  } = {},
): RuntimeExecutionServiceRequest => {
  const bottom =
    input.bottom ??
    buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:bottom",
    })
  const top =
    input.top ??
    buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:top",
    })
  return {
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
    kind: "executeMatch",
    requestId: "runtime-request:test",
    match: {
      matchId: "match:runtime-service-test",
      seed: "seed:runtime-service-test",
      arenaVariant,
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      bottomStrategyRevisionId: bottom.id,
      topStrategyRevisionId: top.id,
      maxPhases: 1,
    },
    strategies: { bottom, top },
    limits: {
      ...DEFAULT_RUNTIME_LIMITS,
      timeoutMs: DEFAULT_RUNTIME_LIMITS.timeoutMs,
      stdoutBytes: 32 * 1024,
    },
  }
}

const stringify = (value: unknown): string => JSON.stringify(value)

describe("runtime execution service", () => {
  it("requires an explicit adapter unless local fallback is enabled", () => {
    expect(() => createRuntimeServiceConfig()).toThrow(
      RuntimeServiceConfigError,
    )
    expect(
      createRuntimeServiceConfig({ allowLocalWorkerThreadFallback: true })
        .metadata.id,
    ).toBe("worker-thread")
  })

  it("validates and executes a complete request as a schema-valid success", () => {
    const response = executeRuntimeServiceRequest(requestFor(), runtimeConfig)

    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.systemFailure.message)
    }
    expect(response.contractVersion).toBe(RUNTIME_EXECUTION_SERVICE_VERSION)
    expect(response.result.chronicle.reproducibility.matchId).toBe(
      "match:runtime-service-test",
    )
    expect(response.result.finalState.matchId).toBe(
      "match:runtime-service-test",
    )
    expect(response.result.runtimeViolationEventCount).toBe(0)
    expect(response.result.privacy).toBe("internal_runtime_result")
  })

  it("parses the shared v1.15 golden request fixture", () => {
    const fixture = JSON.parse(
      readFileSync(
        join(
          new URL("../../..", import.meta.url).pathname,
          "packages/spec/artifacts/runtime-execution-service-request.v1.15.json",
        ),
        "utf8",
      ),
    ) as unknown

    expect(RuntimeExecutionServiceRequestSchema.parse(fixture)).toEqual(fixture)
  })

  it("accepts self-play where both sides use the same immutable Strategy Revision", () => {
    const revision = buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:self-play",
    })
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: revision, top: revision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(true)
  })

  it("returns runtime violations as successful Match execution outcomes", () => {
    const badRevision = buildStrategyRevision({ source: invalidOutputSource })
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: badRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.systemFailure.message)
    }
    expect(response.result.runtimeViolationEventCount).toBeGreaterThan(0)
    expect(
      response.result.chronicle.events.some(
        (event) => event.type === "RUNTIME_VIOLATION",
      ),
    ).toBe(true)
  })

  it("executes a Python Strategy through broker selection without JS fallback", () => {
    const pythonRevision = buildPythonStrategyRevision({
      source: pythonTacticalSource,
      strategyId: "strategy:python",
    })
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: pythonRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(true)
    if (!response.ok) {
      throw new Error(response.systemFailure.message)
    }
    expect(response.result.finalState.matchId).toBe(
      "match:runtime-service-test",
    )
    expect(response.result.runtimeViolationEventCount).toBe(0)
  }, 10_000)

  it.skipIf(!rustWasiCompileProbe.ok)(
    "executes Rust WASM artifacts through Wasmtime without source fallback",
    () => {
      const rustRevision = buildRustStrategyRevision({
        source: rustWasiSource,
        strategyId: "strategy:rust-wasi",
      })
      const response = executeRuntimeServiceRequest(
        requestFor({ bottom: rustRevision, top: rustRevision }),
        runtimeConfig,
      )

      expect(response.ok).toBe(true)
      if (!response.ok) {
        throw new Error(response.systemFailure.message)
      }
      expect(response.result.finalState.matchId).toBe(
        "match:runtime-service-test",
      )
      expect(response.result.runtimeViolationEventCount).toBe(0)
    },
  )

  it.skipIf(!zigWasiCompileProbe.ok)(
    "executes Zig WASM artifacts through Wasmtime after compile+run proof",
    () => {
      const zigRevision = buildZigStrategyRevision({
        source: zigWasiSource,
        strategyId: "strategy:zig-wasi",
      })
      const response = executeRuntimeServiceRequest(
        requestFor({ bottom: zigRevision, top: zigRevision }),
        runtimeConfig,
      )

      expect(response.ok).toBe(true)
      if (!response.ok) {
        throw new Error(response.systemFailure.message)
      }
      expect(response.result.finalState.matchId).toBe(
        "match:runtime-service-test",
      )
      expect(response.result.runtimeViolationEventCount).toBe(0)
    },
    20_000,
  )

  it.skipIf(!rustWasiCompileProbe.ok)(
    "fails closed when a Rust WASM artifact is missing",
    () => {
      const rustRevision = buildRustStrategyRevision({
        source: rustWasiSource,
        strategyId: "strategy:rust-wasi",
      })
      const brokenRevision: StrategyRevision = {
        ...rustRevision,
        metadata: {
          ...rustRevision.metadata,
          compiledArtifact: undefined,
        },
      }
      const response = executeRuntimeServiceRequest(
        requestFor({ bottom: brokenRevision }),
        runtimeConfig,
      )

      expect(response.ok).toBe(false)
      if (response.ok) {
        throw new Error("expected missing artifact to fail")
      }
      expect(response.systemFailure.code).toBe("MALFORMED_REQUEST")
      expect(stringify(response)).not.toContain(rustWasiSource.trim())
    },
  )

  it("fails closed when broker registry metadata drifts", () => {
    const pythonRevision = buildPythonStrategyRevision({
      source: pythonTacticalSource,
      strategyId: "strategy:python",
    })
    const driftedRevision: StrategyRevision = {
      ...pythonRevision,
      runtime: {
        ...pythonRevision.runtime,
        adapter: {
          ...pythonRevision.runtime.adapter,
          version: "0.0.0-drifted",
        },
      },
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: driftedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected registry drift to fail")
    }
    expect(response.systemFailure.code).toBe("UNSUPPORTED_RUNTIME_ADAPTER")
    expect(stringify(response)).not.toContain("def select_activations")
  })

  it("fails closed when provider and runtime adapter disagree", () => {
    const revision = buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:provider-mismatch",
    })
    const mismatchedRevision: StrategyRevision = {
      ...revision,
      runtime: {
        ...revision.runtime,
        adapter: {
          id: "runtime-python-subprocess-experimental",
          version: "0.1.0-experimental",
        },
      },
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: mismatchedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected provider mismatch to fail")
    }
    expect(response.systemFailure.code).toBe("UNSUPPORTED_RUNTIME_ADAPTER")
    expect(stringify(response)).not.toContain(passiveSource.trim())
  })

  it("fails closed when JS runtime metadata declares a different service adapter", () => {
    const revision = buildStrategyRevision({
      source: passiveSource,
      strategyId: "strategy:js-adapter-drift",
    })
    const mismatchedRevision: StrategyRevision = {
      ...revision,
      runtime: {
        ...revision.runtime,
        adapter: {
          id: "runtime-js-subprocess",
          version: revision.runtime.adapter.version,
        },
      },
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: mismatchedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected JS adapter drift to fail")
    }
    expect(response.systemFailure.code).toBe("UNSUPPORTED_RUNTIME_ADAPTER")
    expect(stringify(response)).not.toContain(passiveSource.trim())
  })

  it("returns a redacted systemFailure for malformed requests", () => {
    const response = executeRuntimeServiceRequest(
      {
        contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
        kind: "executeMatch",
        requestId: "runtime-request:bad",
      },
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected malformed request to fail")
    }
    expect(response.systemFailure.code).toBe("MALFORMED_REQUEST")
    expect(stringify(response)).not.toContain("export default")
    expect(stringify(response)).not.toContain("strategyMemory")
  })

  it("fails closed when declared Strategy source hash does not match source", () => {
    const revision = buildStrategyRevision({ source: passiveSource })
    const mismatchedRevision: StrategyRevision = {
      ...revision,
      sourceHash: "not-the-real-source-hash",
      validation: {
        ...revision.validation,
        sourceHash: "not-the-real-source-hash",
      },
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: mismatchedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected source hash mismatch to fail")
    }
    expect(response.systemFailure.code).toBe("SOURCE_HASH_MISMATCH")
    expect(response.systemFailure.retryable).toBe(false)
    expect(stringify(response)).not.toContain(passiveSource.trim())
  })

  it("fails closed when declared Strategy source byte count does not match source", () => {
    const revision = buildStrategyRevision({ source: passiveSource })
    const mismatchedRevision: StrategyRevision = {
      ...revision,
      source: `${revision.source}\n`,
    }
    const response = executeRuntimeServiceRequest(
      requestFor({ bottom: mismatchedRevision }),
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected source byte mismatch to fail")
    }
    expect(["SOURCE_BYTES_MISMATCH", "MALFORMED_REQUEST"]).toContain(
      response.systemFailure.code,
    )
    expect(response.systemFailure.retryable).toBe(false)
    expect(stringify(response)).not.toContain(passiveSource.trim())
  })

  it("rejects request-controlled limits above the service maximum", () => {
    const request = requestFor()
    const response = executeRuntimeServiceRequest(
      {
        ...request,
        limits: {
          ...request.limits,
          timeoutMs: request.limits.timeoutMs + 1_000_000,
        },
      },
      runtimeConfig,
    )

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected oversized limits to fail")
    }
    expect(response.systemFailure.code).toBe("MALFORMED_REQUEST")
  })

  it("redacts system failure diagnostics from execution exceptions", () => {
    const response = executeRuntimeServiceRequest(requestFor(), runtimeConfig, {
      buildChronicleFromMatch() {
        throw new Error(
          `boom export default ${passiveSource} token=secret /Users/local/app.ts`,
        )
      },
    })

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected injected execution exception to fail")
    }
    const text = stringify(response)
    expect(response.systemFailure.code).toBe("EXECUTION_EXCEPTION")
    expect(text).not.toContain(passiveSource.trim())
    expect(text).not.toContain("token=secret")
    expect(text).not.toContain("/Users/local")
    expect(text).not.toContain("stack")
    expect(text).not.toContain("stderr")
  })

  it("fails closed with schema-valid failure when the internal response shape drifts", () => {
    const response = executeRuntimeServiceRequest(requestFor(), runtimeConfig, {
      buildChronicleFromMatch() {
        return {
          chronicle: {
            schemaVersion: "chronicle-v1.4",
            reproducibility: {
              matchId: "match:runtime-service-test",
              seed: "seed:runtime-service-test",
              arenaVariantId: arenaVariant.id,
              arenaVariantVersion: "arena-v1",
              strategyRevisionIds: ["strategy:bottom", "strategy:top"],
              versions: {},
            },
            events: [],
            snapshots: [],
          },
          finalState: {
            matchId: "match:runtime-service-test",
            seed: "seed:runtime-service-test",
          },
        } as never
      },
    })

    expect(response.ok).toBe(false)
    if (response.ok) {
      throw new Error("expected invalid response schema to fail")
    }
    expect(response.systemFailure.code).toBe("RESPONSE_SCHEMA_INVALID")
    expect(response.systemFailure.retryable).toBe(true)
    expect(stringify(response)).not.toContain("StrategyMemory")
  })

  it("keeps runtime-service imports and dependencies DB-free", () => {
    const appRoot = new URL("..", import.meta.url).pathname
    const srcRoot = join(appRoot, "src")
    const sourceFiles = readdirSync(srcRoot)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
      .map((file) => join(srcRoot, file))
    const importLines = sourceFiles.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => line.trimStart().startsWith("import ")),
    )
    const packageJson = JSON.parse(
      readFileSync(join(appRoot, "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> }
    const dependencyNames = Object.keys(packageJson.dependencies ?? {})

    const productionText = sourceFiles
      .map((file) => readFileSync(file, "utf8"))
      .join("\n")
    for (const forbiddenImportOrDependency of [
      "@cowards/persistence",
      "@cowards/service",
      "pg",
      "claimNextMatchJob",
      "completeMatch",
      "recordAttemptFailure",
      "createPostgresChronicleStore",
      "matchset-status",
      "governance",
      "session",
    ]) {
      expect(importLines.join("\n")).not.toContain(forbiddenImportOrDependency)
      expect(dependencyNames).not.toContain(forbiddenImportOrDependency)
    }
    for (const forbiddenAuthority of [
      "claimNextMatchJob",
      "completeMatch",
      "recordAttemptFailure",
      "createPostgresChronicleStore",
      "matchset-status",
      "MatchSet scoring",
      "public evidence",
      "retired TypeScript backend",
    ]) {
      expect(productionText).not.toContain(forbiddenAuthority)
    }
    expect(importLines.join("\n")).not.toMatch(/\bscoring\b/)
  })
})
