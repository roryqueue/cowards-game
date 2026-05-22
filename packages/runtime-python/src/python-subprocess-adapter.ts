import { Buffer } from "node:buffer"
import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { clearTimeout, setTimeout } from "node:timers"
import { fileURLToPath } from "node:url"
import {
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_RUNTIME_ADAPTER_REGISTRY,
  type JsonValue,
  type StrategyRuntimeMetadata,
  type StrategyRuntimeMethodName,
  type StrategyRuntimeRequestEnvelope,
  type StrategyRuntimeResponseEnvelope,
} from "@cowards/spec"

const hostPath = fileURLToPath(
  new URL("./python_runtime_host.py", import.meta.url),
)

export const pythonExperimentalRuntimeMetadata =
  (): StrategyRuntimeMetadata => {
    const adapter = STRATEGY_RUNTIME_ADAPTER_REGISTRY.find(
      (candidate) => candidate.id === "runtime-python-subprocess-experimental",
    )
    if (!adapter) {
      throw new Error("Python experimental runtime adapter is not registered.")
    }
    return {
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      language: { id: "python", version: "3.9" },
      adapter: { id: adapter.id, version: adapter.version },
      package: { mode: "none", entrypoint: "module" },
      requiredCapabilities: [],
      limits: adapter.limits,
    }
  }

export interface PythonStrategyRequestInput {
  sourcePath?: string | undefined
  sourceText?: string | undefined
  methodName: StrategyRuntimeMethodName
  input: JsonValue
  timeoutMs?: number | undefined
}

export const runPythonStrategyMethod = async (
  request: PythonStrategyRequestInput,
): Promise<StrategyRuntimeResponseEnvelope> => {
  const runtime = pythonExperimentalRuntimeMetadata()
  const sourceText =
    request.sourceText ??
    (request.sourcePath ? readFileSync(request.sourcePath, "utf8") : "")
  const envelope: StrategyRuntimeRequestEnvelope = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: request.methodName,
    runtime,
    source: {
      text: sourceText,
      hash: "experimental-python-source",
      bytes: Buffer.byteLength(sourceText),
      entrypoint: runtime.package.entrypoint,
    },
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
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk
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
        resolve(JSON.parse(stdout) as StrategyRuntimeResponseEnvelope)
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
