import { describe, expect, it } from "vitest"
import type {
  SpawnSyncOptionsWithStringEncoding,
  SpawnSyncReturns,
} from "node:child_process"
import {
  containerSubprocessStrategyExecutionAdapterMetadata,
  createContainerSubprocessStrategyExecutionAdapter,
} from "./container-subprocess-adapter.js"
import { SubprocessSystemFailure } from "./subprocess-ipc.js"

type SpawnCall = {
  command: string
  args: readonly string[]
  options: SpawnSyncOptionsWithStringEncoding
}

const fakeSpawnResult = (
  overrides: Partial<SpawnSyncReturns<string>> = {},
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

describe("container subprocess adapter", () => {
  it("declares the v1.3 production-candidate runtime boundary", () => {
    expect(containerSubprocessStrategyExecutionAdapterMetadata).toMatchObject({
      id: "container-subprocess",
      productionReadiness: "production-candidate",
      runtimeControls: {
        network: "disabled",
        filesystem: "read-only-root",
        shell: "disabled",
      },
      diagnostics: {
        dockerRequired: true,
        fallback: false,
      },
    })
  })

  it("launches Docker with the v1.3 isolation controls", () => {
    const calls: SpawnCall[] = []
    const adapter = createContainerSubprocessStrategyExecutionAdapter({
      dockerPath: "/usr/local/bin/docker",
      image: "node:24-alpine",
      harnessSource: "void 0",
      spawnSync: (command, args, options) => {
        calls.push({ command, args, options })
        return fakeSpawnResult({
          stdout: JSON.stringify({ ok: true, value: { accepted: true } }),
        })
      },
    })

    expect(
      adapter.execute({
        source:
          "module.exports.default = { selectActivations() {}, soldierBrain() {} }",
        methodName: "selectActivations",
        input: {},
      }),
    ).toEqual({ ok: true, value: { accepted: true } })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.command).toBe("/usr/local/bin/docker")
    expect(calls[0]?.args).toEqual([
      "run",
      "--rm",
      "--network",
      "none",
      "--read-only",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=16m",
      "--memory",
      "64m",
      "--cpus",
      "0.5",
      "--pids-limit",
      "64",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--env",
      "NODE_ENV=production",
      "--workdir",
      "/tmp",
      "node:24-alpine",
      "node",
      "--input-type=module",
      "--eval",
      "void 0",
    ])
    expect(calls[0]?.options.shell).toBe(false)
    expect(calls[0]?.options.stdio).toEqual(["pipe", "pipe", "pipe"])
  })

  it("treats container launch failure as system failure", () => {
    const adapter = createContainerSubprocessStrategyExecutionAdapter({
      spawnSync: () =>
        fakeSpawnResult({
          status: null,
          error: Object.assign(new Error("docker unavailable"), {
            code: "ENOENT",
          }),
        }),
    })

    expectSubprocessFailure(
      () =>
        adapter.execute({
          source:
            "module.exports.default = { selectActivations() {}, soldierBrain() {} }",
          methodName: "selectActivations",
          input: {},
        }),
      "SPAWN_FAILED",
    )
  })

  it("maps Docker timeout to a Strategy timeout violation", () => {
    const adapter = createContainerSubprocessStrategyExecutionAdapter({
      spawnSync: () =>
        fakeSpawnResult({
          status: null,
          error: Object.assign(new Error("timed out"), {
            code: "ETIMEDOUT",
          }),
        }),
    })

    const result = adapter.execute({
      source:
        "module.exports.default = { selectActivations() {}, soldierBrain() {} }",
      methodName: "selectActivations",
      input: {},
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("TIMEOUT")
  })

  it("maps container stdio buffer overflow to a system failure", () => {
    const adapter = createContainerSubprocessStrategyExecutionAdapter({
      spawnSync: () =>
        fakeSpawnResult({
          status: null,
          error: Object.assign(new Error("maxBuffer exceeded"), {
            code: "ENOBUFS",
          }),
        }),
    })

    expectSubprocessFailure(
      () =>
        adapter.execute({
          source:
            "module.exports.default = { selectActivations() {}, soldierBrain() {} }",
          methodName: "selectActivations",
          input: {},
        }),
      "STDIO_CAP_EXCEEDED",
    )
  })

  it("rejects Docker image references that could be parsed as CLI flags", () => {
    expectSubprocessFailure(
      () =>
        createContainerSubprocessStrategyExecutionAdapter({
          image: "--network=host",
        }),
      "SPAWN_FAILED",
    )
  })

  it("rejects Docker image references with shell metacharacters", () => {
    expectSubprocessFailure(
      () =>
        createContainerSubprocessStrategyExecutionAdapter({
          image: "node:24-alpine;rm -rf /",
        }),
      "SPAWN_FAILED",
    )
  })
})
