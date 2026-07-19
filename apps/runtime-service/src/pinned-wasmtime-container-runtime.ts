import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { RuntimeResult, StrategyRuntime } from "@cowards/engine"
import {
  SoldierBrainResultSchema,
  StrategyResultSchema,
  StrategyRuntimeResponseEnvelopeSchema,
  type JsonValue,
  type SoldierBrainInput,
  type SoldierBrainResult,
  type StrategyInput,
  type StrategyRevision,
  type StrategyResult,
} from "@cowards/spec"

const IMAGE = /^[A-Za-z0-9._/:-]+@sha256:[0-9a-f]{64}$/u
const SHA256 = /^sha256:[0-9a-f]{64}$/u

const normalize = <T>(
  result: unknown,
  schema: { safeParse(value: unknown): unknown },
): RuntimeResult<T> => {
  const envelope = StrategyRuntimeResponseEnvelopeSchema.safeParse(result)
  if (!envelope.success) {
    return {
      ok: false,
      violation: { type: "INVALID_OUTPUT", message: "Invalid WASM response" },
    }
  }
  if (!envelope.data.ok) {
    return envelope.data.failureKind === "systemFailure"
      ? {
          ok: false,
          violation: {
            type: "THROWN_EXCEPTION",
            message: "Runtime system failure.",
          },
          systemFailure: {
            code: envelope.data.systemFailure.code,
            retryable: true,
          },
        }
      : {
          ok: false,
          violation: {
            type: envelope.data.violation.code,
            message: envelope.data.violation.publicMessage,
          },
        }
  }
  const admitted = schema.safeParse(envelope.data.value) as
    | { success: true; data: unknown }
    | { success: false }
  return admitted.success
    ? { ok: true, value: admitted.data as T }
    : {
        ok: false,
        violation: { type: "INVALID_OUTPUT", message: "Invalid WASM output" },
      }
}

const invoke = (
  revision: StrategyRevision,
  image: string,
  wasmtimeExecutablePath: string,
  expectedWasmtimeSha256: string,
  methodName: "selectActivations" | "soldierBrain",
  input: StrategyInput | SoldierBrainInput,
  timeoutMs: number,
  stdoutBytes: number,
  stderrBytes: number,
): unknown => {
  if (!IMAGE.test(image) || image.startsWith("-")) {
    throw new TypeError("Pinned Wasmtime image identity is invalid.")
  }
  const executable = realpathSync(wasmtimeExecutablePath)
  const executableHash = `sha256:${createHash("sha256")
    .update(readFileSync(executable))
    .digest("hex")}`
  if (
    !SHA256.test(expectedWasmtimeSha256) ||
    executableHash !== expectedWasmtimeSha256
  ) {
    throw new TypeError("Pinned Wasmtime executable identity drifted.")
  }
  const artifact = revision.metadata.compiledArtifact
  if (artifact?.bytesBase64 === undefined) {
    throw new TypeError("Pinned WASM artifact is unavailable.")
  }
  const artifactBytes = Buffer.from(artifact.bytesBase64, "base64")
  const artifactHash = createHash("sha256").update(artifactBytes).digest("hex")
  if (
    artifactBytes.byteLength !== artifact.bytes ||
    artifactHash !== artifact.hash.replace(/^sha256:/u, "")
  ) {
    throw new TypeError("Pinned WASM artifact identity drifted.")
  }
  const directory = mkdtempSync(join(tmpdir(), "cowards-runtime-wasm-"))
  const artifactPath = join(directory, "strategy.wasm")
  try {
    writeFileSync(artifactPath, artifactBytes, {
      mode: 0o600,
    })
    const request = {
      abiVersion: "strategy-runtime-abi-v1.19",
      methodName,
      runtime: revision.runtime,
      source: {
        hash: revision.sourceHash,
        bytes: revision.sourceBytes,
        entrypoint: revision.runtime.package.entrypoint,
      },
      input: input as unknown as JsonValue,
    }
    const result = spawnSync(
      "docker",
      [
        "run",
        "--rm",
        "--interactive",
        "--network",
        "none",
        "--read-only",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--memory",
        "64m",
        "--cpus",
        "0.5",
        "--pids-limit",
        "16",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=16m",
        "--volume",
        `${executable}:/runtime/wasmtime:ro`,
        "--volume",
        `${artifactPath}:/runtime/strategy.wasm:ro`,
        image,
        "/runtime/wasmtime",
        "run",
        "-C",
        "compiler=winch,parallel-compilation=n,cache=n",
        "-O",
        "memory-reservation=1048576,memory-reservation-for-growth=0,memory-guard-size=0",
        "/runtime/strategy.wasm",
      ],
      {
        input: JSON.stringify(request),
        encoding: "utf8",
        env: {
          PATH: process.env.PATH ?? "",
          ...(process.env.DOCKER_CONFIG === undefined
            ? {}
            : { DOCKER_CONFIG: process.env.DOCKER_CONFIG }),
        },
        maxBuffer: Math.max(stdoutBytes, stderrBytes),
        shell: false,
        timeout: timeoutMs,
      },
    )
    if (result.error || result.status !== 0 || result.signal !== null) {
      throw new TypeError("Pinned Wasmtime contained invocation failed.")
    }
    if (
      Buffer.byteLength(result.stdout) > stdoutBytes ||
      Buffer.byteLength(result.stderr) > stderrBytes
    ) {
      throw new TypeError(
        "Pinned Wasmtime contained output exceeded its limit.",
      )
    }
    return JSON.parse(result.stdout)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

export const createPinnedWasmtimeContainerRuntime = (input: {
  revision: StrategyRevision
  image: string
  wasmtimeExecutablePath: string
  expectedWasmtimeSha256: string
  timeoutMs: number
  stdoutBytes: number
  stderrBytes: number
}): StrategyRuntime => ({
  selectActivations: (value) =>
    normalize<StrategyResult>(
      invoke(
        input.revision,
        input.image,
        input.wasmtimeExecutablePath,
        input.expectedWasmtimeSha256,
        "selectActivations",
        value,
        input.timeoutMs,
        input.stdoutBytes,
        input.stderrBytes,
      ),
      StrategyResultSchema,
    ),
  runSoldierBrain: (value) =>
    normalize<SoldierBrainResult>(
      invoke(
        input.revision,
        input.image,
        input.wasmtimeExecutablePath,
        input.expectedWasmtimeSha256,
        "soldierBrain",
        value,
        input.timeoutMs,
        input.stdoutBytes,
        input.stderrBytes,
      ),
      SoldierBrainResultSchema,
    ),
})
