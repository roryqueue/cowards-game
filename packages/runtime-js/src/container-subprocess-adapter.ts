import {
  spawnSync,
  type SpawnSyncOptionsWithBufferEncoding,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns,
} from "node:child_process"
import type { Buffer } from "node:buffer"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { RuntimeResult } from "@cowards/engine"
import {
  type StrategyExecutionAdapterV117,
  type StrategyExecutionAdapterMetadata,
  type StrategyExecutionRequest,
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

export interface ContainerSubprocessStrategyExecutionAdapterOptions {
  dockerPath?: string | undefined
  image?: string | undefined
  spawnSync?: SpawnSyncLike | undefined
  stdoutBytes?: number | undefined
  stderrBytes?: number | undefined
  harnessSource?: string | undefined
  memory?: string | undefined
  cpus?: string | undefined
  pidsLimit?: number | undefined
}

export const DEFAULT_CONTAINER_SUBPROCESS_IMAGE = "node:24-alpine" as const

export const containerSubprocessStrategyExecutionAdapterMetadata: StrategyExecutionAdapterMetadata =
  {
    id: "container-subprocess",
    label: "Containerized Node subprocess",
    default: false,
    productionReadiness: "production-candidate",
    isolationBoundary:
      "Production-candidate Strategy execution boundary using a short-lived container plus strict JSON IPC.",
    notes: [
      "Runs the existing subprocess harness inside Docker with no network and shell disabled.",
      "Uses read-only root filesystem, tmpfs scratch, dropped capabilities, pids, memory, and CPU limits where Docker supports them.",
      "Docker or container launch failures are system failures, not player losses.",
    ],
    runtimeControls: {
      timeout: true,
      timeoutMs: RUNTIME_TIMEOUT_MS,
      outputByteLimit: true,
      stdoutBytes: SUBPROCESS_STDOUT_BYTES,
      stderrBytes: SUBPROCESS_STDERR_BYTES,
      environment: "minimal",
      execArgv: "empty",
      resourceLimits: [
        "docker --network none",
        "docker --read-only",
        "docker --tmpfs /tmp:rw,noexec,nosuid,size=16m",
        "docker --memory 64m",
        "docker --cpus 0.5",
        "docker --pids-limit 64",
        "docker --cap-drop ALL",
      ],
      filesystem: "read-only-root",
      network: "disabled",
      shell: "disabled",
    },
    diagnostics: {
      fallback: false,
      dockerRequired: true,
      preflight:
        "Requires Docker and a node image capable of running the Strategy subprocess harness.",
    },
  }

const dockerArgs = (input: {
  image: string
  harnessSource: string
  memory: string
  cpus: string
  pidsLimit: number
  cidFilePath?: string | undefined
}): readonly string[] => [
  "run",
  ...(input.cidFilePath === undefined
    ? ["--rm"]
    : ["--cidfile", input.cidFilePath]),
  "-i",
  "--network",
  "none",
  "--read-only",
  "--tmpfs",
  "/tmp:rw,noexec,nosuid,size=16m",
  "--memory",
  input.memory,
  "--cpus",
  input.cpus,
  "--pids-limit",
  String(input.pidsLimit),
  "--cap-drop",
  "ALL",
  "--security-opt",
  "no-new-privileges",
  "--env",
  "NODE_ENV=production",
  "--workdir",
  "/tmp",
  input.image,
  "node",
  "--input-type=module",
  "--eval",
  input.harnessSource,
]

const errorCode = (error: Error): string | undefined =>
  "code" in error && typeof error.code === "string" ? error.code : undefined

const asString = (value: string | null | undefined): string =>
  typeof value === "string" ? value : ""

const timeoutViolation = (): RuntimeResult<unknown> => ({
  ok: false,
  violation: { type: "TIMEOUT", message: "Strategy execution timed out" },
})

const assertSafeDockerImage = (image: string): void => {
  if (image.startsWith("-") || !/^[a-zA-Z0-9._/:@-]+$/.test(image)) {
    throw new SubprocessSystemFailure(
      "SPAWN_FAILED",
      "Container image reference is not allowed",
      { image },
    )
  }
}

export const createContainerSubprocessStrategyExecutionAdapter = (
  options: ContainerSubprocessStrategyExecutionAdapterOptions = {},
): StrategyExecutionAdapterV117 => {
  const spawn = options.spawnSync ?? spawnSync
  const spawnCandidate = spawn as unknown as SpawnSyncBufferLike
  const dockerPath = options.dockerPath ?? "docker"
  const image = options.image ?? DEFAULT_CONTAINER_SUBPROCESS_IMAGE
  assertSafeDockerImage(image)
  const harnessSource = options.harnessSource ?? SUBPROCESS_HARNESS_SOURCE
  const stderrBytes = options.stderrBytes ?? SUBPROCESS_STDERR_BYTES
  const memory = options.memory ?? "64m"
  const cpus = options.cpus ?? "0.5"
  const pidsLimit = options.pidsLimit ?? 64

  return {
    metadata: containerSubprocessStrategyExecutionAdapterMetadata,
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
      const result = spawn(
        dockerPath,
        dockerArgs({ image, harnessSource, memory, cpus, pidsLimit }),
        {
          encoding: "utf8",
          env: { PATH: process.env.PATH ?? "" },
          input,
          killSignal: "SIGKILL",
          maxBuffer: Math.max(stdoutBytes, stderrBytes),
          shell: false,
          stdio: ["pipe", "pipe", "pipe"],
          timeout: request.timeoutMs ?? RUNTIME_TIMEOUT_MS,
          windowsHide: true,
        },
      )
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
            "Container subprocess stdio exceeded configured buffer",
            { cause: result.error.message },
          )
        }
        throw new SubprocessSystemFailure(
          "SPAWN_FAILED",
          "Container Strategy subprocess failed before a classified Strategy result",
          { cause: result.error.message },
        )
      }
      if (result.signal) {
        throw new SubprocessSystemFailure(
          "SUBPROCESS_SIGNAL",
          `Container subprocess terminated by signal ${result.signal}`,
          { signal: result.signal, stderr },
        )
      }
      if (typeof result.status === "number" && result.status !== 0) {
        throw new SubprocessSystemFailure(
          "SUBPROCESS_EXIT",
          `Container subprocess exited with status ${result.status}`,
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
          const candidateEnv = { PATH: process.env.PATH ?? "" }
          const result =
            options.spawnSync !== undefined && process.env.NODE_ENV === "test"
              ? spawnCandidate(dockerPath, dockerArgs({
                  image,
                  harnessSource: SUBPROCESS_HARNESS_V117_SOURCE,
                  memory,
                  cpus,
                  pidsLimit,
                }), {
                  env: candidateEnv,
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
                })
              : (() => {
                  const cleanupDirectory = mkdtempSync(
                    join(tmpdir(), "cowards-runtime-container-"),
                  )
                  const cidFilePath = join(cleanupDirectory, "container.cid")
                  try {
                    return runCandidateProcessSync({
                      command: dockerPath,
                      args: dockerArgs({
                        image,
                        harnessSource: SUBPROCESS_HARNESS_V117_SOURCE,
                        memory,
                        cpus,
                        pidsLimit,
                        cidFilePath,
                      }),
                      env: candidateEnv,
                      input,
                      killSignal: "SIGKILL",
                      launchStartedNanoseconds,
                      timeoutMilliseconds,
                      stdoutByteLimit:
                        CANDIDATE_HOST_ENVELOPE_OVERHEAD_V117 +
                        guest.stdoutByteLimit,
                      stderrByteLimit,
                      containerCleanup: {
                        runtimeCommand: dockerPath,
                        cidFilePath,
                        cleanupDirectory,
                      },
                    })
                  } catch (error) {
                    rmSync(cleanupDirectory, { force: true, recursive: true })
                    throw error
                  }
                })()
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
