import {
  spawnSync,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns,
} from "node:child_process"
import type { RuntimeResult } from "@cowards/engine"
import {
  type StrategyExecutionAdapter,
  type StrategyExecutionAdapterMetadata,
  type StrategyExecutionRequest,
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
}): readonly string[] => [
  "run",
  "--rm",
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
): StrategyExecutionAdapter => {
  const spawn = options.spawnSync ?? spawnSync
  const dockerPath = options.dockerPath ?? "docker"
  const image = options.image ?? "node:24-alpine"
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
  }
}
