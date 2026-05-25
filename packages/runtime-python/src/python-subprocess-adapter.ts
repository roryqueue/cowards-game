import { Buffer } from "node:buffer"
import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { clearTimeout, setTimeout } from "node:timers"
import { fileURLToPath } from "node:url"
import {
  SoldierBrainResultSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyResultSchema,
  StrategyRuntimeResponseEnvelopeSchema,
  type JsonValue,
  type SoldierBrainResult,
  type StrategyRuntimeMetadata,
  type StrategyRuntimeMethodName,
  type StrategyRuntimeRequestEnvelope,
  type StrategyRuntimeResponseEnvelope,
  type StrategyRevision,
  type StrategyResult,
} from "@cowards/spec"
import {
  success,
  type RuntimeResult,
  type StrategyRuntime,
} from "@cowards/engine"
import { pythonExperimentalRuntimeMetadata } from "./metadata.js"

const hostPath = fileURLToPath(
  new URL("./python_runtime_host.py", import.meta.url),
)

export { pythonExperimentalRuntimeMetadata }

export interface PythonStrategyRequestInput {
  sourceText?: string | undefined
  sourceHash?: string | undefined
  methodName: StrategyRuntimeMethodName
  input: JsonValue
  timeoutMs?: number | undefined
  stdoutBytes?: number | undefined
  stderrBytes?: number | undefined
}

const sourceEnvelopeFor = (
  sourceText: string,
  sourceHash: string,
  runtime: StrategyRuntimeMetadata,
) => ({
  text: sourceText,
  hash: sourceHash,
  bytes: Buffer.byteLength(sourceText),
  entrypoint: runtime.package.entrypoint,
})

const hashStrategySource = (source: string): string =>
  createHash("sha256").update(source).digest("hex")

export const runPythonStrategyMethod = async (
  request: PythonStrategyRequestInput,
): Promise<StrategyRuntimeResponseEnvelope> => {
  const runtime = pythonExperimentalRuntimeMetadata()
  const sourceText = request.sourceText ?? ""
  const envelope: StrategyRuntimeRequestEnvelope = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: request.methodName,
    runtime,
    source: sourceEnvelopeFor(
      sourceText,
      request.sourceHash ?? hashStrategySource(sourceText),
      runtime,
    ),
    input: request.input,
  }

  return new Promise((resolve) => {
    const child = spawn("python3", [hostPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {},
    })
    let stdout = ""
    let stderr = ""
    const timeout = setTimeout(() => {
      child.kill("SIGKILL")
      resolve({
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: "runtimeViolation",
        violation: {
          code: "TIMEOUT",
          message: "Python Strategy exceeded its timeout.",
          publicMessage: "Strategy timed out.",
          privateDiagnostics: { stderr },
        },
      })
    }, request.timeoutMs ?? runtime.limits.timeoutMs)

    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk) => {
      stdout += chunk
      if (
        Buffer.byteLength(stdout) >
        (request.stdoutBytes ?? runtime.limits.stdoutBytes)
      ) {
        child.kill("SIGKILL")
      }
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk
      if (
        Buffer.byteLength(stderr) >
        (request.stderrBytes ?? runtime.limits.stderrBytes)
      ) {
        child.kill("SIGKILL")
      }
    })
    child.on("error", (error) => {
      clearTimeout(timeout)
      resolve({
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: "systemFailure",
        systemFailure: {
          code: "SPAWN_FAILED",
          message: error.message,
          publicMessage: "Runtime system failure.",
          privateDiagnostics: { stderr },
        },
      })
    })
    child.on("close", (code, signal) => {
      clearTimeout(timeout)
      if (code !== 0) {
        resolve({
          ok: false,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          failureKind: "systemFailure",
          systemFailure: {
            code: signal ? "SUBPROCESS_SIGNAL" : "SUBPROCESS_EXIT",
            message: `Python runtime exited with ${signal ?? code}.`,
            publicMessage: "Runtime system failure.",
            privateDiagnostics: { stderr },
          },
        })
        return
      }
      try {
        resolve(
          StrategyRuntimeResponseEnvelopeSchema.parse(
            JSON.parse(stdout),
          ) as StrategyRuntimeResponseEnvelope,
        )
      } catch (error) {
        resolve({
          ok: false,
          abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
          failureKind: "systemFailure",
          systemFailure: {
            code: "MALFORMED_IPC",
            message: error instanceof Error ? error.message : "Malformed IPC",
            publicMessage: "Runtime system failure.",
            privateDiagnostics: { stderr, details: { stdout } },
          },
        })
      }
    })
    child.stdin.end(JSON.stringify(envelope))
  })
}

export interface PythonStrategySyncRequestInput extends PythonStrategyRequestInput {
  sourceText: string
  sourceHash: string
}

export const runPythonStrategyMethodSync = (
  request: PythonStrategySyncRequestInput,
): StrategyRuntimeResponseEnvelope => {
  const runtime = pythonExperimentalRuntimeMetadata()
  const envelope: StrategyRuntimeRequestEnvelope = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: request.methodName,
    runtime,
    source: sourceEnvelopeFor(request.sourceText, request.sourceHash, runtime),
    input: request.input,
  }
  const result = spawnSync("python3", [hostPath], {
    input: JSON.stringify(envelope),
    encoding: "utf8",
    env: {},
    timeout: request.timeoutMs ?? runtime.limits.timeoutMs,
    maxBuffer:
      (request.stdoutBytes ?? runtime.limits.stdoutBytes) +
      (request.stderrBytes ?? runtime.limits.stderrBytes),
  })
  const stderr = result.stderr ?? ""
  if (result.error) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind:
        result.error.message.includes("ETIMEDOUT") ||
        result.error.name === "TimeoutError"
          ? "runtimeViolation"
          : "systemFailure",
      ...(result.error.message.includes("ETIMEDOUT")
        ? {
            violation: {
              code: "TIMEOUT",
              message: "Python Strategy exceeded its timeout.",
              publicMessage: "Strategy timed out.",
              privateDiagnostics: { stderr },
            },
          }
        : {
            systemFailure: {
              code: "SPAWN_FAILED",
              message: "Python runtime failed to start.",
              publicMessage: "Runtime system failure.",
              privateDiagnostics: { stderr },
            },
          }),
    } as StrategyRuntimeResponseEnvelope
  }
  if (result.status !== 0) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: result.signal ? "systemFailure" : "runtimeViolation",
      ...(result.signal
        ? {
            systemFailure: {
              code: "SUBPROCESS_SIGNAL",
              message: "Python runtime stopped before producing a result.",
              publicMessage: "Runtime system failure.",
              privateDiagnostics: { stderr },
            },
          }
        : {
            violation: {
              code: "THROWN_EXCEPTION",
              message: "Python Strategy failed during execution.",
              publicMessage: "Strategy threw an exception.",
              privateDiagnostics: { stderr },
            },
          }),
    } as StrategyRuntimeResponseEnvelope
  }
  try {
    return StrategyRuntimeResponseEnvelopeSchema.parse(
      JSON.parse(result.stdout ?? ""),
    ) as StrategyRuntimeResponseEnvelope
  } catch {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "MALFORMED_IPC",
        message: "Python runtime produced malformed IPC.",
        publicMessage: "Runtime system failure.",
        privateDiagnostics: { stderr },
      },
    }
  }
}

const normalizeStrategyOutput = (
  envelope: StrategyRuntimeResponseEnvelope,
): RuntimeResult<StrategyResult> => {
  if (!envelope.ok) {
    return {
      ok: false,
      violation: {
        type:
          envelope.failureKind === "runtimeViolation"
            ? envelope.violation.code
            : "THROWN_EXCEPTION",
        message:
          envelope.failureKind === "runtimeViolation"
            ? envelope.violation.publicMessage
            : envelope.systemFailure.publicMessage,
      },
    }
  }
  const parsed = StrategyResultSchema.safeParse(envelope.value)
  return parsed.success
    ? success(parsed.data as StrategyResult)
    : {
        ok: false,
        violation: {
          type: "INVALID_OUTPUT",
          message:
            "Python Strategy returned an invalid select_activations result.",
        },
      }
}

const normalizeSoldierBrainOutput = (
  envelope: StrategyRuntimeResponseEnvelope,
): RuntimeResult<SoldierBrainResult> => {
  if (!envelope.ok) {
    return {
      ok: false,
      violation: {
        type:
          envelope.failureKind === "runtimeViolation"
            ? envelope.violation.code
            : "THROWN_EXCEPTION",
        message:
          envelope.failureKind === "runtimeViolation"
            ? envelope.violation.publicMessage
            : envelope.systemFailure.publicMessage,
      },
    }
  }
  const parsed = SoldierBrainResultSchema.safeParse(envelope.value)
  return parsed.success
    ? success(parsed.data)
    : {
        ok: false,
        violation: {
          type: "INVALID_OUTPUT",
          message: "Python Strategy returned an invalid soldier_brain result.",
        },
      }
}

export const createPythonRuntimeFromRevision = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  } = {},
): StrategyRuntime => ({
  selectActivations(input) {
    return normalizeStrategyOutput(
      runPythonStrategyMethodSync({
        sourceText: revision.source,
        sourceHash: revision.sourceHash,
        methodName: "selectActivations",
        input: input as unknown as JsonValue,
        timeoutMs: options.timeoutMs,
        stdoutBytes: options.stdoutBytes,
        stderrBytes: options.stderrBytes,
      }),
    )
  },
  runSoldierBrain(input) {
    return normalizeSoldierBrainOutput(
      runPythonStrategyMethodSync({
        sourceText: revision.source,
        sourceHash: revision.sourceHash,
        methodName: "soldierBrain",
        input: input as unknown as JsonValue,
        timeoutMs: options.timeoutMs,
        stdoutBytes: options.stdoutBytes,
        stderrBytes: options.stderrBytes,
      }),
    )
  },
})
