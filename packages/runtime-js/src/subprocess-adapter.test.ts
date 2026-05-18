import type {
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncReturns,
} from "node:child_process"
import { describe, expect, it } from "vitest"
import { createSubprocessStrategyExecutionAdapter } from "./subprocess-adapter.js"
import {
  assertWithinByteCap,
  isSubprocessIpcRequest,
  isSubprocessIpcResponse,
  parseSubprocessIpcResponse,
  SubprocessSystemFailure,
} from "./subprocess-ipc.js"
import { transpileStrategySource } from "./transpile.js"

type SpawnCall = {
  command: string
  args: readonly string[]
  options: SpawnSyncOptionsWithStringEncoding
}

type FakeSpawnResult = {
  stdout?: string
  stderr?: string
  status?: number | null
  signal?: string | null
  error?: Error
}

const validStrategySource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({
        soldierId: soldier.id,
        objective: { target: soldier.id },
      })),
      strategyMemory: { adapter: "subprocess" },
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: { cycle: input.cycleIndex },
    }
  },
}
`

const loopingStrategySource = `
export default {
  selectActivations() {
    while (true) {}
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const transpileOrThrow = (source: string): string => {
  const transpiled = transpileStrategySource(source)
  if (!transpiled.ok) {
    throw new Error(transpiled.message)
  }
  return transpiled.code
}

const fakeSpawnResult = (
  overrides: FakeSpawnResult = {},
): SpawnSyncReturns<string> =>
  ({
    pid: 123,
    output: ["", overrides.stdout ?? "", overrides.stderr ?? ""],
    stdout: overrides.stdout ?? "",
    stderr: overrides.stderr ?? "",
    status: overrides.status ?? 0,
    signal: overrides.signal ?? null,
    error: overrides.error,
  }) as SpawnSyncReturns<string>

const createFakeSpawn = (result: FakeSpawnResult, calls: SpawnCall[] = []) => {
  const spawn = (
    command: string,
    args: readonly string[],
    options: SpawnSyncOptionsWithStringEncoding,
  ) => {
    calls.push({ command, args, options })
    return fakeSpawnResult(result)
  }

  return { calls, spawn }
}

const expectSubprocessFailure = (
  action: () => unknown,
  code: SubprocessSystemFailure["code"],
) => {
  expect(action).toThrow(SubprocessSystemFailure)
  try {
    action()
  } catch (error) {
    expect(error).toBeInstanceOf(SubprocessSystemFailure)
    expect((error as SubprocessSystemFailure).code).toBe(code)
  }
}

describe("subprocess IPC schema", () => {
  it("requires source, methodName, and JSON input for requests", () => {
    expect(
      isSubprocessIpcRequest({
        source: "module.exports.default = {}",
        methodName: "selectActivations",
        input: { activationCount: 1 },
      }),
    ).toBe(true)

    expect(
      isSubprocessIpcRequest({
        methodName: "selectActivations",
        input: { activationCount: 1 },
      }),
    ).toBe(false)
    expect(
      isSubprocessIpcRequest({
        source: "module.exports.default = {}",
        methodName: "selectActivations",
        input: () => undefined,
      }),
    ).toBe(false)
    expect(
      isSubprocessIpcRequest({
        source: "module.exports.default = {}",
        methodName: "selectActivations",
        input: new (class NonJsonInput {})(),
      }),
    ).toBe(false)
  })

  it("requires runtime-result-shaped JSON responses", () => {
    expect(
      isSubprocessIpcResponse({
        ok: true,
        value: { activationOrders: [], strategyMemory: {} },
      }),
    ).toBe(true)
    expect(
      isSubprocessIpcResponse({
        ok: false,
        violation: { type: "INVALID_OUTPUT", message: "bad" },
      }),
    ).toBe(true)
    expect(isSubprocessIpcResponse({ ok: true })).toBe(false)
  })

  it("rejects stdout and stderr payloads above configured byte caps", () => {
    expect(() => assertWithinByteCap("stdout", "abc", 3)).not.toThrow()
    expectSubprocessFailure(
      () => assertWithinByteCap("stderr", "abcd", 3),
      "STDIO_CAP_EXCEEDED",
    )
  })
})

describe("createSubprocessStrategyExecutionAdapter", () => {
  it("is exported from the worker subpath without changing the default adapter", async () => {
    const workerEntrypoint = await import("./worker.js")

    expect(workerEntrypoint.activeStrategyExecutionAdapter.id).toBe(
      "worker-thread",
    )
    expect(
      workerEntrypoint.createSubprocessStrategyExecutionAdapter().metadata.id,
    ).toBe("subprocess")
  })

  it("executes a valid Strategy method through a subprocess", () => {
    const adapter = createSubprocessStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpileOrThrow(validStrategySource),
      methodName: "selectActivations",
      input: {
        activationCount: 1,
        mySoldiers: [{ id: "bottom-1" }],
      },
      timeoutMs: 1_000,
    })

    expect(result).toEqual({
      ok: true,
      value: {
        activationOrders: [
          { soldierId: "bottom-1", objective: { target: "bottom-1" } },
        ],
        strategyMemory: { adapter: "subprocess" },
      },
    })
  })

  it("spawns Node with no shell, stdio pipes, and a minimal explicit env", () => {
    const calls: SpawnCall[] = []
    const { spawn } = createFakeSpawn(
      { stdout: JSON.stringify({ ok: true, value: { accepted: true } }) },
      calls,
    )
    const adapter = createSubprocessStrategyExecutionAdapter({
      harnessSource: "void 0",
      nodePath: "/usr/local/bin/node",
      spawnSync: spawn,
    })

    expect(
      adapter.execute({
        source: transpileOrThrow(validStrategySource),
        methodName: "soldierBrain",
        input: { cycleIndex: 0 },
      }),
    ).toEqual({ ok: true, value: { accepted: true } })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.command).toBe("/usr/local/bin/node")
    expect(calls[0]?.args).toEqual(["--input-type=module", "--eval", "void 0"])
    expect(calls[0]?.options.shell).toBe(false)
    expect(calls[0]?.options.stdio).toEqual(["pipe", "pipe", "pipe"])
    expect(calls[0]?.options.env).toEqual({ NODE_ENV: "production" })
  })

  it("maps subprocess timeout while executing Strategy code to TIMEOUT", () => {
    const adapter = createSubprocessStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpileOrThrow(loopingStrategySource),
      methodName: "selectActivations",
      input: {},
      timeoutMs: 10,
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("TIMEOUT")
  })

  it("rejects stdout over cap before parsing it as trusted JSON", () => {
    const { spawn } = createFakeSpawn({
      stdout: '{"ok":true,"value":"' + "x".repeat(32) + '"}',
    })
    const adapter = createSubprocessStrategyExecutionAdapter({
      spawnSync: spawn,
      stdoutBytes: 12,
    })

    expectSubprocessFailure(
      () =>
        adapter.execute({
          source: transpileOrThrow(validStrategySource),
          methodName: "soldierBrain",
          input: {},
        }),
      "STDIO_CAP_EXCEEDED",
    )
  })

  it("classifies malformed stdout JSON as malformed IPC", () => {
    const { spawn } = createFakeSpawn({ stdout: "not json" })
    const adapter = createSubprocessStrategyExecutionAdapter({
      spawnSync: spawn,
    })

    expectSubprocessFailure(
      () =>
        adapter.execute({
          source: transpileOrThrow(validStrategySource),
          methodName: "soldierBrain",
          input: {},
        }),
      "MALFORMED_IPC",
    )
  })

  it("classifies nonzero child exit as a system failure", () => {
    const { spawn } = createFakeSpawn({
      status: 42,
      stderr: "protocol failed",
    })
    const adapter = createSubprocessStrategyExecutionAdapter({
      spawnSync: spawn,
    })

    expectSubprocessFailure(
      () =>
        adapter.execute({
          source: transpileOrThrow(validStrategySource),
          methodName: "soldierBrain",
          input: {},
        }),
      "SUBPROCESS_EXIT",
    )
  })

  it("classifies signal termination as a system failure", () => {
    const { spawn } = createFakeSpawn({
      status: null,
      signal: "SIGTERM",
      stderr: "terminated",
    })
    const adapter = createSubprocessStrategyExecutionAdapter({
      spawnSync: spawn,
    })

    expectSubprocessFailure(
      () =>
        adapter.execute({
          source: transpileOrThrow(validStrategySource),
          methodName: "soldierBrain",
          input: {},
        }),
      "SUBPROCESS_SIGNAL",
    )
  })

  it("classifies spawn failure as a system failure", () => {
    const error = new Error("spawn failed") as Error & { code: string }
    error.code = "ENOENT"
    const { spawn } = createFakeSpawn({ error })
    const adapter = createSubprocessStrategyExecutionAdapter({
      spawnSync: spawn,
    })

    expectSubprocessFailure(
      () =>
        adapter.execute({
          source: transpileOrThrow(validStrategySource),
          methodName: "soldierBrain",
          input: {},
        }),
      "SPAWN_FAILED",
    )
  })

  it("classifies schema-invalid subprocess output as malformed IPC", () => {
    expectSubprocessFailure(
      () => parseSubprocessIpcResponse(JSON.stringify({ ok: true })),
      "MALFORMED_IPC",
    )
  })
})
