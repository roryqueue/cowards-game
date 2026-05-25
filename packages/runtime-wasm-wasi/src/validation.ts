import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  COMPATIBILITY_VERSIONS,
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_SOURCE_BYTES,
  STRATEGY_WASM_ARTIFACT_BYTES,
  StrategyRevisionSchema,
  runtimeCompatibilityKey,
  type CompiledStrategyArtifact,
  type StrategyRevision,
  type StrategyRevisionMetadata,
  type StrategyRevisionValidationIssue,
  type StrategyRevisionValidationReport,
} from "@cowards/spec"
import { wasmWasiRuntimeMetadata } from "./metadata.js"

const hashBytes = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex")

const hashSource = (source: string): string =>
  createHash("sha256").update(source).digest("hex")

const issue = (
  code: StrategyRevisionValidationIssue["code"],
  message: string,
  options: Omit<
    StrategyRevisionValidationIssue,
    "code" | "severity" | "message"
  > = {},
): StrategyRevisionValidationIssue => ({
  code,
  severity: "error",
  message,
  ...options,
})

const rustForbiddenPatterns = [
  { pattern: "std::fs", regex: /\bstd::fs\b/ },
  { pattern: "std::net", regex: /\bstd::net\b/ },
  { pattern: "std::process", regex: /\bstd::process\b/ },
  { pattern: "std::time", regex: /\bstd::time\b/ },
  { pattern: "SystemTime", regex: /\bSystemTime\b/ },
  { pattern: "Instant", regex: /\bInstant\b/ },
  { pattern: "env::var", regex: /\benv::var\b/ },
  { pattern: "include_str!", regex: /\binclude_str\s*!/ },
  { pattern: "include_bytes!", regex: /\binclude_bytes\s*!/ },
  { pattern: "wasi_snapshot_preview1", regex: /\bwasi_snapshot_preview1\b/ },
  { pattern: "random_get", regex: /\brandom_get\b/ },
  { pattern: "clock_time_get", regex: /\bclock_time_get\b/ },
  { pattern: "path_", regex: /\bpath_[a-z_]+\b/ },
  { pattern: "sock_", regex: /\bsock_[a-z_]+\b/ },
  { pattern: "environ_", regex: /\benviron_[a-z_]+\b/ },
  { pattern: "args_", regex: /\bargs_[a-z_]+\b/ },
  { pattern: "extern crate", regex: /\bextern\s+crate\b/ },
  { pattern: "Cargo dependency", regex: /\bserde\b|\brand\b|\bgetrandom\b/ },
] as const

export interface WasmImportEntry {
  module: string
  name: string
  kind: number
}

const allowedWasiPreview1Imports = new Set([
  "environ_get",
  "environ_sizes_get",
  "fd_close",
  "fd_fdstat_get",
  "fd_read",
  "fd_write",
  "proc_exit",
])

const readVaruint32 = (
  bytes: Buffer,
  offset: number,
): { value: number; offset: number } => {
  let value = 0
  let shift = 0
  let cursor = offset
  while (cursor < bytes.byteLength) {
    const byte = bytes[cursor] ?? 0
    cursor += 1
    value |= (byte & 0x7f) << shift
    if ((byte & 0x80) === 0) {
      return { value, offset: cursor }
    }
    shift += 7
  }
  throw new Error("Malformed WASM varuint32")
}

const readName = (
  bytes: Buffer,
  offset: number,
): { value: string; offset: number } => {
  const length = readVaruint32(bytes, offset)
  const start = length.offset
  const end = start + length.value
  if (end > bytes.byteLength) {
    throw new Error("Malformed WASM name")
  }
  return { value: bytes.subarray(start, end).toString("utf8"), offset: end }
}

const skipLimits = (bytes: Buffer, offset: number): number => {
  const flags = readVaruint32(bytes, offset)
  const min = readVaruint32(bytes, flags.offset)
  return (flags.value & 0x01) === 0
    ? min.offset
    : readVaruint32(bytes, min.offset).offset
}

export const listWasmImports = (bytes: Buffer): WasmImportEntry[] => {
  if (
    bytes.byteLength < 8 ||
    bytes[0] !== 0x00 ||
    bytes[1] !== 0x61 ||
    bytes[2] !== 0x73 ||
    bytes[3] !== 0x6d
  ) {
    throw new Error("Compiled artifact is not a WASM module")
  }
  let cursor = 8
  while (cursor < bytes.byteLength) {
    const sectionId = bytes[cursor]
    cursor += 1
    const size = readVaruint32(bytes, cursor)
    cursor = size.offset
    const sectionEnd = cursor + size.value
    if (sectionEnd > bytes.byteLength) {
      throw new Error("Malformed WASM section")
    }
    if (sectionId !== 2) {
      cursor = sectionEnd
      continue
    }
    const count = readVaruint32(bytes, cursor)
    cursor = count.offset
    const imports: WasmImportEntry[] = []
    for (let index = 0; index < count.value; index += 1) {
      const module = readName(bytes, cursor)
      cursor = module.offset
      const name = readName(bytes, cursor)
      cursor = name.offset
      const kind = bytes[cursor] ?? 0xff
      cursor += 1
      if (kind === 0) {
        cursor = readVaruint32(bytes, cursor).offset
      } else if (kind === 1) {
        cursor += 1
        cursor = skipLimits(bytes, cursor)
      } else if (kind === 2) {
        cursor = skipLimits(bytes, cursor)
      } else if (kind === 3) {
        cursor += 2
      } else {
        throw new Error("Unsupported WASM import kind")
      }
      imports.push({ module: module.value, name: name.value, kind })
    }
    return imports
  }
  return []
}

export const validateWasmWasiImports = (
  bytes: Buffer,
): StrategyRevisionValidationIssue[] => {
  const errors: StrategyRevisionValidationIssue[] = []
  let imports: WasmImportEntry[]
  try {
    imports = listWasmImports(bytes)
  } catch {
    return [
      issue(
        "TRANSPILE_FAILED",
        "Compiled artifact import table could not be parsed.",
        {
          constraint:
            "WASM artifact imports must be inspectable before execution.",
          remediation: "Compile with the Rust WASI starter path.",
          reference: "runtime/wasm-imports",
        },
      ),
    ]
  }
  for (const imported of imports) {
    if (
      imported.module !== "wasi_snapshot_preview1" ||
      imported.kind !== 0 ||
      !allowedWasiPreview1Imports.has(imported.name)
    ) {
      errors.push(
        issue(
          "FORBIDDEN_PATTERN",
          "Compiled WASM imports a forbidden WASI capability.",
          {
            pattern: `${imported.module}.${imported.name}`,
            constraint:
              "Rust WASM/WASI artifacts may import only stdin/stdout/process-exit and empty-environment Preview 1 functions.",
            remediation:
              "Remove filesystem, network, clock, random, environment, args, path, and socket imports.",
            reference: "runtime/wasm-imports",
          },
        ),
      )
    }
  }
  return errors
}

export interface WasmCompileResult {
  ok: boolean
  artifact?: CompiledStrategyArtifact | undefined
  errors: StrategyRevisionValidationIssue[]
  forbiddenPatterns: string[]
}

const rustcVersion = (): string => {
  const result = spawnSync("rustc", ["--version"], {
    encoding: "utf8",
    shell: false,
    env: { PATH: process.env.PATH ?? "" },
    timeout: 1_000,
    maxBuffer: 32 * 1024,
  })
  return result.status === 0
    ? (result.stdout ?? "").trim()
    : "rustc unavailable"
}

export const compileRustWasmArtifact = (source: string): WasmCompileResult => {
  const sourceHash = hashSource(source)
  const sourceBytes = Buffer.byteLength(source)
  const errors: StrategyRevisionValidationIssue[] = []
  const forbiddenPatterns: string[] = []

  if (sourceBytes > STRATEGY_SOURCE_BYTES) {
    errors.push(
      issue(
        "SOURCE_TOO_LARGE",
        `Rust Strategy source exceeds ${STRATEGY_SOURCE_BYTES} bytes`,
        {
          constraint: `Rust Strategy source must be ${STRATEGY_SOURCE_BYTES} bytes or less.`,
          remediation: "Remove unused helper code or comments.",
          reference: "runtime/limits",
        },
      ),
    )
  }
  if (!/\bfn\s+main\s*\(/.test(source)) {
    errors.push(
      issue(
        "MISSING_SELECT_ACTIVATIONS",
        "Rust WASI Strategy must provide fn main() for stdin/stdout JSON envelope.",
        {
          constraint:
            "Rust WASI Preview 1 executable Strategies must read stdin and write one JSON runtime envelope to stdout.",
          remediation: "Use the Rust WASI starter sample as the baseline.",
          reference: "examples/rust-wasi-exhibition-alpha",
        },
      ),
    )
  }
  for (const forbidden of rustForbiddenPatterns) {
    if (forbidden.regex.test(source)) {
      forbiddenPatterns.push(forbidden.pattern)
      errors.push(
        issue(
          "FORBIDDEN_PATTERN",
          `Rust Strategy source contains forbidden capability: ${forbidden.pattern}`,
          {
            pattern: forbidden.pattern,
            constraint:
              "Rust WASI Strategies must be self-contained and cannot use host filesystem, network, time, randomness, process, or package capabilities.",
            remediation: `Remove ${forbidden.pattern} and use only Strategy input data.`,
            reference: "runtime/capabilities",
          },
        ),
      )
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors, forbiddenPatterns }
  }

  const dir = mkdtempSync(join(tmpdir(), "cowards-rust-wasi-"))
  const sourcePath = join(dir, "strategy.rs")
  const artifactPath = join(dir, "strategy.wasm")
  try {
    writeFileSync(sourcePath, source, "utf8")
    const result = spawnSync(
      "rustc",
      ["--target", "wasm32-wasip1", "-O", sourcePath, "-o", artifactPath],
      {
        encoding: "utf8",
        shell: false,
        env: { PATH: process.env.PATH ?? "" },
        timeout: 10_000,
        maxBuffer: 256 * 1024,
      },
    )
    if (result.error || result.status !== 0) {
      return {
        ok: false,
        forbiddenPatterns,
        errors: [
          issue("TRANSPILE_FAILED", "Rust WASI compile failed closed.", {
            constraint:
              "Rust source must compile to wasm32-wasip1 with the local rustc toolchain.",
            remediation:
              "Fix the Rust syntax or use the Rust WASI starter sample.",
            reference: "examples/rust-wasi-exhibition-alpha",
          }),
        ],
      }
    }
    const artifactBytes = readFileSync(artifactPath)
    const importErrors = validateWasmWasiImports(artifactBytes)
    if (importErrors.length > 0) {
      return {
        ok: false,
        forbiddenPatterns,
        errors: importErrors,
      }
    }
    if (artifactBytes.byteLength > STRATEGY_WASM_ARTIFACT_BYTES) {
      return {
        ok: false,
        forbiddenPatterns,
        errors: [
          issue(
            "SOURCE_TOO_LARGE",
            "Compiled Rust WASM artifact exceeds the v1.21 artifact byte cap.",
            {
              constraint: `Compiled WASM artifacts must be ${STRATEGY_WASM_ARTIFACT_BYTES} bytes or less.`,
              remediation: "Reduce the Strategy or compile helper footprint.",
              reference: "runtime/limits",
            },
          ),
        ],
      }
    }
    const artifact: CompiledStrategyArtifact = {
      format: "wasm",
      hash: hashBytes(artifactBytes),
      bytes: artifactBytes.byteLength,
      bytesBase64: artifactBytes.toString("base64"),
      sourceHash,
      wasiProfile: "preview1",
      targetTriple: "wasm32-wasip1",
      abiEnvelope: "stdin-stdout-json",
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      validationStatus: "valid",
      createdAt: new Date(0).toISOString(),
      toolchain: {
        language: "rust",
        compiler: "rustc",
        compilerVersion: rustcVersion(),
        targetTriple: "wasm32-wasip1",
        commandSummary:
          "rustc --target wasm32-wasip1 -O strategy.rs -o strategy.wasm",
      },
      publicEvidence: {
        label: "Rust WASM/WASI non-counted exhibition alpha",
        nonCounted: true,
        sandboxClaim: "candidate-readiness-only",
      },
    }
    return { ok: true, artifact, errors: [], forbiddenPatterns }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export const validateRustStrategySource = (
  source: string,
): StrategyRevisionValidationReport => {
  const compiled = compileRustWasmArtifact(source)
  return {
    valid: compiled.ok,
    errors: compiled.errors,
    warnings: [
      {
        code: "NON_COUNTED_RUNTIME",
        severity: "warning",
        message:
          "Rust WASM/WASI is a non-counted exhibition alpha runtime and not ranked/counted eligible.",
        constraint:
          "Rust may run only in non-counted exhibition alpha proof paths.",
        remediation: "Use JS/TS for counted play.",
        reference: "runtime/counting",
      },
    ],
    sourceBytes: Buffer.byteLength(source),
    forbiddenPatterns: compiled.forbiddenPatterns,
    sourceHash: hashSource(source),
    runtimeVersion: wasmWasiRuntimeMetadata("rust").adapter.version,
    engineCompatibility: {
      spec: COMPATIBILITY_VERSIONS.spec,
      engine: COMPATIBILITY_VERSIONS.engine,
    },
  }
}

export const buildRustStrategyRevision = (input: {
  source: string
  strategyId?: string | undefined
  metadata?: StrategyRevisionMetadata | undefined
}): StrategyRevision => {
  const runtime = wasmWasiRuntimeMetadata("rust")
  const compiled = compileRustWasmArtifact(input.source)
  const validation = validateRustStrategySource(input.source)
  if (!compiled.ok || !compiled.artifact) {
    throw new Error(
      "Cannot build Rust WASM Strategy Revision from invalid source",
    )
  }
  const compatibility = runtimeCompatibilityKey({
    runtime,
    sourceHash: validation.sourceHash,
    artifactHash: compiled.artifact.hash,
    artifactTargetTriple: compiled.artifact.targetTriple,
    artifactWasiProfile: compiled.artifact.wasiProfile,
    specVersion: COMPATIBILITY_VERSIONS.spec,
    engineVersion: COMPATIBILITY_VERSIONS.engine,
  })
  const compatibilityHash = createHash("sha256")
    .update(JSON.stringify(compatibility))
    .digest("hex")
  return StrategyRevisionSchema.parse({
    id: `strategy-revision:rust-wasi:${validation.sourceHash}:${compatibilityHash.slice(0, 16)}`,
    ...(input.strategyId === undefined ? {} : { strategyId: input.strategyId }),
    source: input.source,
    sourceHash: validation.sourceHash,
    sourceBytes: validation.sourceBytes,
    runtime,
    engineCompatibility: validation.engineCompatibility,
    validation,
    metadata: {
      ...(input.metadata ?? {}),
      tags: [
        ...new Set([
          ...(input.metadata?.tags ?? []),
          "rust",
          "wasm-wasi",
          "non-counted",
        ]),
      ],
      compiledArtifact: compiled.artifact,
    },
  })
}

export interface ZigReadinessEvidence {
  ok: boolean
  zigVersion: string | null
  target: "wasm32-wasi"
  message: string
}

export const zigReadinessEvidence = (): ZigReadinessEvidence => {
  const result = spawnSync("zig", ["version"], {
    encoding: "utf8",
    shell: false,
    env: {},
    timeout: 1_000,
    maxBuffer: 32 * 1024,
  })
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      zigVersion: null,
      target: "wasm32-wasi",
      message: "Zig toolchain unavailable; Zig remains fail-loud non-promoted.",
    }
  }
  return {
    ok: true,
    zigVersion: (result.stdout ?? "").trim(),
    target: "wasm32-wasi",
    message:
      "Zig toolchain detected. v1.21 still requires shared ABI compile/runtime proof before exposing Zig as working.",
  }
}
