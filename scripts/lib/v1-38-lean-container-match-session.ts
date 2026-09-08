import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import type { RuntimeResult } from "@cowards/engine"
import type {
  StrategyExecutionAdapterV117,
  StrategyExecutionRequest,
} from "../../packages/runtime-js/src/adapter.js"
import {
  createRuntimeGuestExecutionV117,
  executeStrategyRuntimeAbiV117,
  observeRuntimeGuestAccountingV117,
  type RuntimeGuestObservationV117,
} from "../../packages/runtime-js/src/abi-bridge.js"
import { consumeCandidateEvidenceFixture } from "../../packages/runtime-js/src/candidate-evidence-fixture.js"
import { CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 } from "../../packages/runtime-js/src/candidate-host-envelope.js"
import { observeCandidateSubprocessV117 } from "../../packages/runtime-js/src/candidate-subprocess-observation.js"
import {
  containerSubprocessStrategyExecutionAdapterMetadata,
} from "../../packages/runtime-js/src/container-subprocess-adapter.js"
import { RUNTIME_TIMEOUT_MS } from "../../packages/runtime-js/src/guards.js"
import {
  SUBPROCESS_HARNESS_SOURCE,
  SUBPROCESS_HARNESS_V117_SOURCE,
} from "../../packages/runtime-js/src/subprocess-harness.js"
import {
  assertWithinByteCap,
  encodeSubprocessIpcRequest,
  parseSubprocessIpcResponse,
  SUBPROCESS_STDERR_BYTES,
  SUBPROCESS_STDOUT_BYTES,
  SubprocessSystemFailure,
} from "../../packages/runtime-js/src/subprocess-ipc.js"

export interface LeanContainerTransportResult {
  readonly status: number | null
  readonly signal: string | null
  readonly stdout: Buffer
  readonly stderr: Buffer
  readonly error?: Error | undefined
}

export interface LeanContainerTransportOptions {
  readonly input?: string | Uint8Array | undefined
  readonly timeoutMilliseconds: number
  readonly maxBufferBytes: number
}

export type LeanContainerMatchTransport = (
  command: string,
  args: readonly string[],
  options: LeanContainerTransportOptions,
) => LeanContainerTransportResult

export interface LeanContainerMatchSessionOptions {
  readonly matchId: string
  readonly image: string
  readonly dockerPath?: string | undefined
  readonly transport?: LeanContainerMatchTransport | undefined
  readonly cleanupTimeoutMilliseconds?: number | undefined
}

export interface LeanContainerSessionCloseResult {
  readonly cleanupComplete: boolean
  readonly orphanedChild: boolean
}

export interface LeanContainerMatchSession {
  readonly matchId: string
  readonly containerId: string
  readonly adapter: StrategyExecutionAdapterV117
  readonly state: "active" | "poisoned" | "closed"
  close(): LeanContainerSessionCloseResult
}

const INERT_CONTAINER_SOURCE = "process.stdin.resume();setInterval(()=>{},2147483647)"
const DEFAULT_CONTROL_TIMEOUT_MS = 5_000
const DEFAULT_CLEANUP_TIMEOUT_MS = 2_000

const defaultTransport: LeanContainerMatchTransport = (command, args, options) => {
  const spawned = spawnSync(command, [...args], {
    env: { PATH: process.env.PATH ?? "" },
    input: options.input === undefined ? undefined : Buffer.from(options.input),
    killSignal: "SIGKILL",
    maxBuffer: options.maxBufferBytes,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: options.timeoutMilliseconds,
    windowsHide: true,
  })
  return {
    status: spawned.status,
    signal: spawned.signal,
    stdout: Buffer.isBuffer(spawned.stdout) ? spawned.stdout : Buffer.alloc(0),
    stderr: Buffer.isBuffer(spawned.stderr) ? spawned.stderr : Buffer.alloc(0),
    ...(spawned.error === undefined ? {} : { error: spawned.error }),
  }
}

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")

const assertSafeIdentity = (label: string, value: string): void => {
  if (value.length === 0 || value.startsWith("-") || !/^[a-zA-Z0-9._:/@-]+$/u.test(value)) {
    throw new TypeError(`LEAN_CONTAINER_SESSION_${label}_INVALID`)
  }
}

const createArgs = (image: string): readonly string[] => [
  "create",
  "--interactive",
  "--network", "none",
  "--read-only",
  "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
  "--memory", "64m",
  "--cpus", "0.5",
  "--pids-limit", "64",
  "--cap-drop", "ALL",
  "--security-opt", "no-new-privileges",
  "--env", "NODE_ENV=production",
  "--workdir", "/tmp",
  image,
  "node", "--input-type=module", "--eval", INERT_CONTAINER_SOURCE,
]

const errorCode = (error: Error): string | undefined =>
  "code" in error && typeof error.code === "string" ? error.code : undefined

const assertCleanControlResult = (result: LeanContainerTransportResult, code: string): void => {
  if (
    result.error !== undefined || result.signal !== null || result.status !== 0 ||
    result.stderr.byteLength !== 0
  ) throw new TypeError(code)
}

const strictJsonResponse = (stdout: Buffer, byteLimit: number): RuntimeResult<unknown> => {
  const text = stdout.toString("utf8")
  assertWithinByteCap("stdout", text, byteLimit)
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new SubprocessSystemFailure("MALFORMED_IPC", "Container session response was not one JSON frame") }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new SubprocessSystemFailure("MALFORMED_IPC", "Container session response frame is invalid")
  const record = parsed as Record<string, unknown>
  if (!exactKeys(record, record.ok === true ? ["ok", "value"] : ["ok", "violation"])) throw new SubprocessSystemFailure("MALFORMED_IPC", "Container session response frame has surplus fields")
  return parseSubprocessIpcResponse(text, byteLimit)
}

export const createLeanContainerMatchSession = (
  options: LeanContainerMatchSessionOptions,
): LeanContainerMatchSession => {
  assertSafeIdentity("MATCH_ID", options.matchId)
  assertSafeIdentity("IMAGE", options.image)
  const dockerPath = options.dockerPath ?? "docker"
  const transport = options.transport ?? defaultTransport
  const cleanupTimeout = options.cleanupTimeoutMilliseconds ?? DEFAULT_CLEANUP_TIMEOUT_MS
  let state: LeanContainerMatchSession["state"] = "active"
  let cleanupResult: LeanContainerSessionCloseResult | undefined

  const created = transport(dockerPath, createArgs(options.image), {
    timeoutMilliseconds: DEFAULT_CONTROL_TIMEOUT_MS,
    maxBufferBytes: 4_096,
  })
  assertCleanControlResult(created, "LEAN_CONTAINER_SESSION_CREATE_FAILED")
  const containerId = created.stdout.toString("utf8").trim()
  assertSafeIdentity("CONTAINER_ID", containerId)

  const remove = (): LeanContainerSessionCloseResult => {
    if (cleanupResult !== undefined) return cleanupResult
    const removed = transport(dockerPath, ["rm", "--force", containerId], {
      timeoutMilliseconds: cleanupTimeout,
      maxBufferBytes: 4_096,
    })
    cleanupResult = removed.error === undefined && removed.signal === null && removed.status === 0 && removed.stderr.byteLength === 0
      ? { cleanupComplete: true, orphanedChild: false }
      : { cleanupComplete: false, orphanedChild: true }
    return cleanupResult
  }

  const poison = (): void => {
    state = "poisoned"
    remove()
  }

  try {
    const started = transport(dockerPath, ["start", containerId], {
      timeoutMilliseconds: DEFAULT_CONTROL_TIMEOUT_MS,
      maxBufferBytes: 4_096,
    })
    assertCleanControlResult(started, "LEAN_CONTAINER_SESSION_START_FAILED")
  } catch {
    poison()
    throw new TypeError("LEAN_CONTAINER_SESSION_START_FAILED")
  }

  const assertActive = (): void => {
    if (state === "poisoned") throw new TypeError("LEAN_CONTAINER_SESSION_POISONED")
    if (state === "closed") throw new TypeError("LEAN_CONTAINER_SESSION_CLOSED")
  }

  const runMethod = (
    request: StrategyExecutionRequest,
    harnessSource: string,
    binary: boolean,
    timeoutMilliseconds: number,
    stdoutLimit: number,
    stderrLimit: number,
    input: string | Uint8Array,
  ): LeanContainerTransportResult => {
    assertActive()
    const method = transport(dockerPath, [
      "exec", "-i", containerId,
      "node", "--input-type=module", "--eval", harnessSource,
    ], {
      input,
      timeoutMilliseconds,
      maxBufferBytes: Math.max(stdoutLimit, stderrLimit),
    })
    try {
      if (method.error !== undefined) {
        throw new SubprocessSystemFailure(errorCode(method.error) === "ENOBUFS" ? "STDIO_CAP_EXCEEDED" : "SPAWN_FAILED", "Container session method failed")
      }
      if (method.signal !== null) throw new SubprocessSystemFailure("SUBPROCESS_SIGNAL", "Container session method was signalled")
      if (method.status !== 0) throw new SubprocessSystemFailure("SUBPROCESS_EXIT", "Container session method exited nonzero")
      if (method.stderr.byteLength !== 0 || method.stderr.byteLength > stderrLimit) throw new SubprocessSystemFailure("STDIO_CAP_EXCEEDED", "Container session emitted stderr")
      if (method.stdout.byteLength > stdoutLimit) throw new SubprocessSystemFailure("STDIO_CAP_EXCEEDED", "Container session stdout exceeded its cap")
      return method
    } catch (error) {
      poison()
      throw error
    } finally {
      void request
      void binary
    }
  }

  const adapter: StrategyExecutionAdapterV117 = {
    metadata: containerSubprocessStrategyExecutionAdapterMetadata,
    execute(request) {
      const stdoutLimit = request.outputByteLimit ?? SUBPROCESS_STDOUT_BYTES
      const encoded = encodeSubprocessIpcRequest({
        source: request.source,
        methodName: request.methodName,
        input: request.input,
        outputByteLimit: request.outputByteLimit,
      })
      try {
        const method = runMethod(request, SUBPROCESS_HARNESS_SOURCE, false, request.timeoutMs ?? RUNTIME_TIMEOUT_MS, stdoutLimit, SUBPROCESS_STDERR_BYTES, encoded)
        return strictJsonResponse(method.stdout, stdoutLimit)
      } catch (error) {
        if (state === "active") poison()
        throw error
      }
    },
    executeV117(request) {
      return executeStrategyRuntimeAbiV117({
        requestBytes: request.requestBytes,
        executableSource: request.executableSource,
        signingIdentity: request.signingIdentity,
        invokeGuest(guest) {
          const observed = (observation: RuntimeGuestObservationV117) => createRuntimeGuestExecutionV117(
            observation,
            consumeCandidateEvidenceFixture(request, observeRuntimeGuestAccountingV117(observation, guest.outputByteLimit)),
          )
          const input = JSON.stringify({
            source: guest.executableSource,
            methodName: guest.methodName,
            input: guest.input,
            outputByteLimit: guest.outputByteLimit,
            methodWallMilliseconds: guest.timeoutMs,
          })
          const launchStartedNanoseconds = process.hrtime.bigint()
          const timeoutMilliseconds = guest.startupTimeoutMs + guest.timeoutMs + guest.cancellationGraceMilliseconds
          const stdoutLimit = CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 + guest.stdoutByteLimit + 1
          let method: LeanContainerTransportResult
          try {
            method = runMethod(
              { source: guest.executableSource, methodName: guest.methodName, input: guest.input },
              SUBPROCESS_HARNESS_V117_SOURCE,
              true,
              timeoutMilliseconds,
              stdoutLimit,
              guest.stderrByteLimit,
              input,
            )
          } catch {
            return observed({ kind: "system_failure", code: "TRANSPORT_CRASH", retryable: false })
          }
          const receivedAtNanoseconds = process.hrtime.bigint()
          const observation = observeCandidateSubprocessV117({
            result: {
              ...method,
              terminationReceiptPresent: true,
              stdoutEof: true,
              stderrEof: true,
              containerCleanupRequired: false,
            },
            launchStartedNanoseconds,
            receivedAtNanoseconds,
            startupTimeoutMilliseconds: guest.startupTimeoutMs,
            methodWallMilliseconds: guest.timeoutMs,
            cancellationGraceMilliseconds: guest.cancellationGraceMilliseconds,
            outputByteLimit: guest.outputByteLimit,
            stdoutByteLimit: guest.stdoutByteLimit,
            stderrByteLimit: guest.stderrByteLimit,
          })
          if (observation.kind === "system_failure" || (observation.kind === "raw_frame" && String.fromCharCode(observation.bytes[0] ?? 0) === "D")) poison()
          return observed(observation)
        },
      })
    },
  }

  return {
    matchId: options.matchId,
    containerId,
    adapter,
    get state() { return state },
    close() {
      if (state !== "poisoned") state = "closed"
      return remove()
    },
  }
}
