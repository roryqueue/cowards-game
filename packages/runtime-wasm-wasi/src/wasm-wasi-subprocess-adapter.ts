import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  accessSync,
  constants,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  SoldierBrainResultSchema,
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyResultSchema,
  StrategyRuntimeResponseEnvelopeSchema,
  type JsonValue,
  type SoldierBrainResult,
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
import { validateWasmWasiImports } from "./validation.js"

export interface WasmWasiStrategyRequestInput {
  revision: StrategyRevision
  methodName: StrategyRuntimeMethodName
  input: JsonValue
  timeoutMs?: number | undefined
  stdoutBytes?: number | undefined
  stderrBytes?: number | undefined
}

const hashBytes = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex")

const resolveCommandPath = (command: string): string | null => {
  for (const directory of (process.env.PATH ?? "").split(":")) {
    if (directory.length === 0) {
      continue
    }
    const candidate = join(directory, command)
    try {
      accessSync(candidate, constants.X_OK)
      return candidate
    } catch {
      // Continue scanning PATH entries.
    }
  }
  return null
}

const artifactBytesFor = (
  revision: StrategyRevision,
): Buffer | StrategyRuntimeResponseEnvelope => {
  const artifact = revision.metadata.compiledArtifact
  if (!artifact?.bytesBase64) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "SPAWN_FAILED",
        message: "WASM/WASI artifact bytes are missing.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  if (
    bytes.byteLength !== artifact.bytes ||
    hashBytes(bytes) !== artifact.hash
  ) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "MALFORMED_IPC",
        message: "WASM/WASI artifact hash or byte count mismatch.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  if (
    artifact.validationStatus !== "valid" ||
    artifact.wasiProfile !== "preview1" ||
    artifact.targetTriple !== "wasm32-wasip1" ||
    artifact.abiEnvelope !== "stdin-stdout-json" ||
    artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION
  ) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "MALFORMED_IPC",
        message: "WASM/WASI artifact metadata is not executable.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  const importErrors = validateWasmWasiImports(bytes)
  if (importErrors.length > 0) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "runtimeViolation",
      violation: {
        code: "FORBIDDEN_CAPABILITY",
        message: "WASM/WASI artifact imports forbidden host capabilities.",
        publicMessage: "Strategy used a forbidden capability.",
        privateDiagnostics: {
          details: {
            issueCount: importErrors.length,
            patterns: importErrors.flatMap((error) =>
              error.pattern === undefined ? [] : [error.pattern],
            ),
          },
        },
      },
    }
  }
  return bytes
}

export const runWasmWasiStrategyMethodSync = (
  request: WasmWasiStrategyRequestInput,
): StrategyRuntimeResponseEnvelope => {
  const artifactBytes = artifactBytesFor(request.revision)
  if (!Buffer.isBuffer(artifactBytes)) {
    return artifactBytes
  }
  const artifact = request.revision.metadata.compiledArtifact
  const wasmtimePath = resolveCommandPath("wasmtime")
  if (wasmtimePath === null) {
    return {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "SPAWN_FAILED",
        message: "Wasmtime runtime failed to start.",
        publicMessage: "Runtime system failure.",
      },
    }
  }
  const envelope: StrategyRuntimeRequestEnvelope = {
    abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
    methodName: request.methodName,
    runtime: request.revision.runtime,
    source: {
      hash: request.revision.sourceHash,
      bytes: request.revision.sourceBytes,
      entrypoint: request.revision.runtime.package.entrypoint,
    },
    input: request.input,
  }
  const dir = mkdtempSync(join(tmpdir(), "cowards-wasmtime-"))
  const artifactPath = join(dir, "strategy.wasm")
  try {
    writeFileSync(artifactPath, artifactBytes)
    const timeoutMs =
      request.timeoutMs ?? request.revision.runtime.limits.timeoutMs
    const result = spawnSync(
      wasmtimePath,
      [
        "run",
        "-W",
        "fuel=10000000",
        "-W",
        `timeout=${timeoutMs}ms`,
        "-W",
        "max-memory-size=67108864",
        "-W",
        "max-wasm-stack=1048576",
        "-W",
        "trap-on-grow-failure=y",
        artifactPath,
      ],
      {
        input: JSON.stringify(envelope),
        encoding: "utf8",
        env: {},
        shell: false,
        timeout: timeoutMs + 250,
        maxBuffer:
          (request.stdoutBytes ?? request.revision.runtime.limits.stdoutBytes) +
          (request.stderrBytes ?? request.revision.runtime.limits.stderrBytes),
      },
    )
    const stderr = result.stderr ?? ""
    const stdout = result.stdout ?? ""
    const stdoutCap =
      request.stdoutBytes ?? request.revision.runtime.limits.stdoutBytes
    const stderrCap =
      request.stderrBytes ?? request.revision.runtime.limits.stderrBytes
    if (
      Buffer.byteLength(stdout) > stdoutCap ||
      Buffer.byteLength(stderr) > stderrCap
    ) {
      return {
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: "systemFailure",
        systemFailure: {
          code: "STDIO_CAP_EXCEEDED",
          message: "WASM/WASI runtime exceeded stdio byte cap.",
          publicMessage: "Runtime system failure.",
          privateDiagnostics: {
            details: {
              stdoutBytes: Buffer.byteLength(stdout),
              stderrBytes: Buffer.byteLength(stderr),
              stdoutCap,
              stderrCap,
            },
          },
        },
      }
    }
    if (result.error) {
      const message = result.error.message
      const isTimeout =
        message.includes("ETIMEDOUT") || result.error.name === "TimeoutError"
      const isStdioCap =
        message.includes("maxBuffer") || message.includes("ENOBUFS")
      return {
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: isTimeout ? "runtimeViolation" : "systemFailure",
        ...(isTimeout
          ? {
              violation: {
                code: "TIMEOUT",
                message: "WASM/WASI Strategy exceeded its timeout.",
                publicMessage: "Strategy timed out.",
                privateDiagnostics: {
                  stderr,
                  details: { artifactHash: artifact?.hash },
                },
              },
            }
          : {
              systemFailure: {
                code: isStdioCap ? "STDIO_CAP_EXCEEDED" : "SPAWN_FAILED",
                message: isStdioCap
                  ? "WASM/WASI runtime exceeded stdio byte cap."
                  : "Wasmtime runtime failed to start.",
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
                message: "Wasmtime stopped before producing a result.",
                publicMessage: "Runtime system failure.",
                privateDiagnostics: { stderr },
              },
            }
          : {
              violation: {
                code: "THROWN_EXCEPTION",
                message: "WASM/WASI Strategy trapped, panicked, or aborted.",
                publicMessage: "Strategy threw an exception.",
                privateDiagnostics: { stderr },
              },
            }),
      } as StrategyRuntimeResponseEnvelope
    }
    try {
      return StrategyRuntimeResponseEnvelopeSchema.parse(
        JSON.parse(stdout),
      ) as StrategyRuntimeResponseEnvelope
    } catch {
      return {
        ok: false,
        abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
        failureKind: "systemFailure",
        systemFailure: {
          code: "MALFORMED_IPC",
          message: "WASM/WASI runtime produced malformed IPC.",
          publicMessage: "Runtime system failure.",
          privateDiagnostics: { stderr },
        },
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
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
            "WASM/WASI Strategy returned an invalid selectActivations result.",
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
          message:
            "WASM/WASI Strategy returned an invalid soldierBrain result.",
        },
      }
}

export const createWasmWasiRuntimeFromRevision = (
  revision: StrategyRevision,
  options: {
    timeoutMs?: number | undefined
    stdoutBytes?: number | undefined
    stderrBytes?: number | undefined
  } = {},
): StrategyRuntime => ({
  selectActivations(input) {
    return normalizeStrategyOutput(
      runWasmWasiStrategyMethodSync({
        revision,
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
      runWasmWasiStrategyMethodSync({
        revision,
        methodName: "soldierBrain",
        input: input as unknown as JsonValue,
        timeoutMs: options.timeoutMs,
        stdoutBytes: options.stdoutBytes,
        stderrBytes: options.stderrBytes,
      }),
    )
  },
})
