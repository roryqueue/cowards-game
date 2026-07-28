import {
  spawnSync,
  type SpawnSyncOptionsWithBufferEncoding,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns,
} from "node:child_process"
import type { Buffer } from "node:buffer"
import type { RuntimeResult } from "@cowards/engine"
import type {
  StrategyExecutionAdapterV117,
  StrategyExecutionAdapterMetadata,
  StrategyExecutionRequest,
} from "./adapter.js"
import {
  createRuntimeGuestExecutionV117,
  executeStrategyRuntimeAbiV117,
  observeRuntimeGuestAccountingV117,
  type RuntimeGuestObservationV117,
} from "./abi-bridge.js"
import { consumeCandidateEvidenceFixture } from "./candidate-evidence-fixture.js"
import { CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 } from "./candidate-host-envelope.js"
import { runCandidateProcessSync } from "./candidate-process-runner.js"
import { observeCandidateSubprocessV117 } from "./candidate-subprocess-observation.js"
import { RUNTIME_TIMEOUT_MS } from "./guards.js"
import {
  SUBPROCESS_HARNESS_SOURCE,
  SUBPROCESS_HARNESS_V117_SOURCE,
} from "./subprocess-harness.js"
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

type SpawnSyncBufferLike = (
  command: string,
  args: readonly string[],
  options: SpawnSyncOptionsWithBufferEncoding,
) => SpawnSyncReturns<Buffer>

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
    productionReadiness: "prototype",
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
      timeoutMs: RUNTIME_TIMEOUT_MS,
      outputByteLimit: true,
      stdoutBytes: SUBPROCESS_STDOUT_BYTES,
      stderrBytes: SUBPROCESS_STDERR_BYTES,
      environment: "minimal",
      execArgv: "empty",
      resourceLimits: [],
      filesystem: "host",
      network: "inherited",
      shell: "disabled",
    },
    diagnostics: {
      fallback: false,
      dockerRequired: false,
      preflight:
        "Host subprocess prototype is useful for IPC and failure taxonomy, but not the selected production hostile-code boundary.",
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
): StrategyExecutionAdapterV117 => {
  const spawn = options.spawnSync ?? spawnSync
  const spawnCandidate = spawn as unknown as SpawnSyncBufferLike
  const nodePath = options.nodePath ?? process.execPath
  const env = { ...(options.env ?? defaultEnv) }
  const harnessSource = options.harnessSource ?? SUBPROCESS_HARNESS_SOURCE
  const stderrBytes = options.stderrBytes ?? SUBPROCESS_STDERR_BYTES

  return {
    metadata: subprocessStrategyExecutionAdapterMetadata,
    execute(request: StrategyExecutionRequest): RuntimeResult<unknown> {
      const stdoutBytes =
        request.outputByteLimit ??
        options.stdoutBytes ??
        SUBPROCESS_STDOUT_BYTES
      const input = encodeSubprocessIpcRequest({
        source: request.source,
        methodName: request.methodName,
        input: request.input,
        outputByteLimit: request.outputByteLimit,
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
    executeV117(request) {
      return executeStrategyRuntimeAbiV117({
        requestBytes: request.requestBytes,
        executableSource: request.executableSource,
        signingIdentity: request.signingIdentity,
        invokeGuest(guest) {
          const observed = (
            observation: RuntimeGuestObservationV117,
          ) =>
            createRuntimeGuestExecutionV117(
              observation,
              consumeCandidateEvidenceFixture(
                request,
                observeRuntimeGuestAccountingV117(
                  observation,
                  guest.outputByteLimit,
                ),
              ),
            )
          const input = JSON.stringify({
            source: guest.executableSource,
            methodName: guest.methodName,
            input: guest.input,
            outputByteLimit: guest.outputByteLimit,
            methodWallMilliseconds: guest.timeoutMs,
          })
          const launchStartedNanoseconds = process.hrtime.bigint()
          const timeoutMilliseconds =
            guest.startupTimeoutMs +
            guest.timeoutMs +
            guest.cancellationGraceMilliseconds
          const stderrByteLimit = Math.min(
            guest.stderrByteLimit,
            stderrBytes,
          )
          const result =
            options.spawnSync !== undefined && process.env.NODE_ENV === "test"
              ? spawnCandidate(
                  nodePath,
                  harnessArgs(SUBPROCESS_HARNESS_V117_SOURCE),
                  {
                    env,
                    input,
                    killSignal: "SIGKILL",
                    // Test-only injected transports are still held to the
                    // smaller physical stream ceiling.
                    maxBuffer: Math.min(
                      guest.stdoutByteLimit + 1,
                      stderrByteLimit + 1,
                    ),
                    shell: false,
                    stdio: ["pipe", "pipe", "pipe"],
                    timeout: timeoutMilliseconds,
                    windowsHide: true,
                  },
                )
              : runCandidateProcessSync({
                  command: nodePath,
                  args: harnessArgs(SUBPROCESS_HARNESS_V117_SOURCE),
                  env,
                  input,
                  killSignal: "SIGKILL",
                  launchStartedNanoseconds,
                  timeoutMilliseconds,
                  stdoutByteLimit:
                    CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 +
                    guest.stdoutByteLimit,
                  stderrByteLimit,
                })
          const receivedAtNanoseconds = process.hrtime.bigint()
          return observed(
            observeCandidateSubprocessV117({
              result,
              launchStartedNanoseconds,
              receivedAtNanoseconds,
              startupTimeoutMilliseconds: guest.startupTimeoutMs,
              methodWallMilliseconds: guest.timeoutMs,
              cancellationGraceMilliseconds:
                guest.cancellationGraceMilliseconds,
              outputByteLimit: guest.outputByteLimit,
              stdoutByteLimit: guest.stdoutByteLimit,
              stderrByteLimit,
            }),
          )
        },
      })
    },
  }
}
