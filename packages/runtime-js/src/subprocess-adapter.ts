import {
  spawnSync,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns,
} from "node:child_process"
import type { RuntimeResult } from "@cowards/engine"
import type {
  StrategyExecutionAdapter,
  StrategyExecutionAdapterMetadata,
  StrategyExecutionRequest,
} from "./adapter.js"
import { RUNTIME_TIMEOUT_MS } from "./guards.js"
import { SUBPROCESS_HARNESS_SOURCE } from "./subprocess-harness.js"
import {
  assertWithinByteCap,
  encodeSubprocessIpcRequest,
  parseSubprocessIpcResponse,
  SUBPROCESS_STDERR_BYTES,
  SUBPROCESS_STDOUT_BYTES,
  SubprocessSystemFailure,
} from "./subprocess-ipc.js"

type SpawnSyncLike = (
  command: string,
  args: readonly string[],
  options: SpawnSyncOptionsWithStringEncoding,
) => SpawnSyncReturns<string>

export interface SubprocessStrategyExecutionAdapterOptions {
  nodePath?: string | undefined
  env?: Readonly<Record<string, string>> | undefined
  spawnSync?: SpawnSyncLike | undefined
  stdoutBytes?: number | undefined
  stderrBytes?: number | undefined
  harnessSource?: string | undefined
}

export const subprocessStrategyExecutionAdapterMetadata: StrategyExecutionAdapterMetadata =
  {
    id: "subprocess",
    label: "Node subprocess",
    default: false,
    isolationBoundary:
      "Opt-in process boundary for Strategy execution with one-shot JSON IPC.",
    notes: [
      "Spawns Node with shell disabled and stdio pipes.",
      "Passes a minimal explicit environment instead of inheriting process.env.",
      "Caps stdout and stderr before trusting subprocess output.",
      "Subprocess infrastructure failures throw SubprocessSystemFailure and do not become gameplay RuntimeViolation values.",
    ],
    runtimeControls: {
      timeout: true,
      outputByteLimit: true,
      environment: "minimal",
      execArgv: "empty",
      resourceLimits: [],
    },
  }

const defaultEnv = Object.freeze({ NODE_ENV: "production" })

const harnessArgs = (harnessSource: string): readonly string[] => [
  "--input-type=module",
  "--eval",
  harnessSource,
]

const timeoutViolation = (): RuntimeResult<unknown> => ({
  ok: false,
  violation: { type: "TIMEOUT", message: "Strategy execution timed out" },
})

const errorCode = (error: Error): string | undefined =>
  "code" in error && typeof error.code === "string" ? error.code : undefined

const asString = (value: string | null | undefined): string => {
  if (typeof value === "string") {
    return value
  }
  return ""
}

export const createSubprocessStrategyExecutionAdapter = (
  options: SubprocessStrategyExecutionAdapterOptions = {},
): StrategyExecutionAdapter => {
  const spawn = options.spawnSync ?? spawnSync
  const nodePath = options.nodePath ?? process.execPath
  const env = { ...(options.env ?? defaultEnv) }
  const harnessSource = options.harnessSource ?? SUBPROCESS_HARNESS_SOURCE
  const stderrBytes = options.stderrBytes ?? SUBPROCESS_STDERR_BYTES

  return {
    metadata: subprocessStrategyExecutionAdapterMetadata,
    execute(request: StrategyExecutionRequest): RuntimeResult<unknown> {
      const stdoutBytes =
        request.outputByteLimit ?? options.stdoutBytes ?? SUBPROCESS_STDOUT_BYTES
      const input = encodeSubprocessIpcRequest({
        source: request.source,
        methodName: request.methodName,
        input: request.input,
      })

      const result = spawn(nodePath, harnessArgs(harnessSource), {
        encoding: "utf8",
        env,
        input,
        killSignal: "SIGKILL",
        maxBuffer: Math.max(stdoutBytes, stderrBytes),
        shell: false,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: request.timeoutMs ?? RUNTIME_TIMEOUT_MS,
        windowsHide: true,
      })

      const stdout = asString(result.stdout)
      const stderr = asString(result.stderr)

      assertWithinByteCap("stdout", stdout, stdoutBytes)
      assertWithinByteCap("stderr", stderr, stderrBytes)

      if (result.error) {
        if (errorCode(result.error) === "ETIMEDOUT") {
          return timeoutViolation()
        }

        if (errorCode(result.error) === "ENOBUFS") {
          throw new SubprocessSystemFailure(
            "STDIO_CAP_EXCEEDED",
            "Subprocess stdio exceeded configured buffer",
            { cause: result.error.message },
          )
        }

        throw new SubprocessSystemFailure(
          "SPAWN_FAILED",
          "Subprocess failed to spawn",
          { cause: result.error.message },
        )
      }

      if (result.signal) {
        throw new SubprocessSystemFailure(
          "SUBPROCESS_SIGNAL",
          `Subprocess terminated by signal ${result.signal}`,
          { signal: result.signal, stderr },
        )
      }

      if (typeof result.status === "number" && result.status !== 0) {
        throw new SubprocessSystemFailure(
          "SUBPROCESS_EXIT",
          `Subprocess exited with status ${result.status}`,
          { status: result.status, stderr },
        )
      }

      return parseSubprocessIpcResponse(stdout, stdoutBytes)
    },
  }
}
