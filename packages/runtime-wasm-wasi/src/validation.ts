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
  StrategyRuntimeResponseEnvelopeSchema,
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

const zigVersion = (): string => {
  const result = spawnSync("zig", ["version"], {
    encoding: "utf8",
    shell: false,
    env: { PATH: process.env.PATH ?? "" },
    timeout: 1_000,
    maxBuffer: 32 * 1024,
  })
  return result.status === 0
    ? `zig ${(result.stdout ?? "").trim()}`
    : "zig unavailable"
}

const zigForbiddenPatterns = [
  { pattern: '@import("std")', regex: /@import\s*\(\s*"std"\s*\)/ },
  { pattern: "std.fs.cwd", regex: /\bstd\.fs\.cwd\b/ },
  { pattern: "std.fs.open", regex: /\bstd\.fs\.[A-Za-z0-9_]*open\b/ },
  { pattern: "std.net", regex: /\bstd\.net\b/ },
  { pattern: "std.time", regex: /\bstd\.time\b/ },
  { pattern: "std.crypto.random", regex: /\bstd\.crypto\.random\b/ },
  { pattern: "std.process.args", regex: /\bstd\.process\.args\b/ },
  { pattern: "std.process.getEnv", regex: /\bstd\.process\.getEnv\b/ },
  { pattern: "@embedFile", regex: /@embedFile\s*\(/ },
] as const

const zigSourceGate = (
  source: string,
): {
  errors: StrategyRevisionValidationIssue[]
  forbiddenPatterns: string[]
  sourceHash: string
  sourceBytes: number
} => {
  const sourceHash = hashSource(source)
  const sourceBytes = Buffer.byteLength(source)
  const errors: StrategyRevisionValidationIssue[] = []
  const forbiddenPatterns: string[] = []
  if (sourceBytes > STRATEGY_SOURCE_BYTES) {
    errors.push(
      issue(
        "SOURCE_TOO_LARGE",
        `Zig Strategy source exceeds ${STRATEGY_SOURCE_BYTES} bytes`,
        {
          constraint: `Zig Strategy source must be ${STRATEGY_SOURCE_BYTES} bytes or less.`,
          remediation: "Remove unused helper code or comments.",
          reference: "runtime/limits",
        },
      ),
    )
  }
  if (
    !/\bpub\s+fn\s+main\s*\(/.test(source) &&
    !/\bexport\s+fn\s+_start\s*\(/.test(source)
  ) {
    errors.push(
      issue(
        "MISSING_SELECT_ACTIVATIONS",
        "Zig WASI Strategy must provide export fn _start() or pub fn main() for stdin/stdout JSON envelope.",
        {
          constraint:
            "Zig WASI Preview 1 executable Strategies must read stdin and write one JSON runtime envelope to stdout.",
          remediation: "Use the Zig WASI starter sample as the baseline.",
          reference: "examples/zig-wasi-strategy",
        },
      ),
    )
  }
  for (const forbidden of zigForbiddenPatterns) {
    if (forbidden.regex.test(source)) {
      forbiddenPatterns.push(forbidden.pattern)
      errors.push(
        issue(
          "FORBIDDEN_PATTERN",
          `Zig Strategy source contains forbidden capability: ${forbidden.pattern}`,
          {
            pattern: forbidden.pattern,
            constraint:
              "Zig WASI Strategies must be self-contained and cannot use host filesystem, network, time, randomness, process, or embed-file capabilities.",
            remediation: `Remove ${forbidden.pattern} and use only Strategy input data.`,
            reference: "runtime/capabilities",
          },
        ),
      )
    }
  }
  return { errors, forbiddenPatterns, sourceHash, sourceBytes }
}

export const compileZigWasmArtifact = (source: string): WasmCompileResult => {
  const gate = zigSourceGate(source)
  if (gate.errors.length > 0) {
    return {
      ok: false,
      errors: gate.errors,
      forbiddenPatterns: gate.forbiddenPatterns,
    }
  }
  const dir = mkdtempSync(join(tmpdir(), "cowards-zig-wasi-"))
  const sourcePath = join(dir, "strategy.zig")
  const artifactPath = join(dir, "strategy.wasm")
  const localCachePath = join(dir, "zig-cache")
  const globalCachePath = join(dir, "zig-global-cache")
  try {
    writeFileSync(sourcePath, source, "utf8")
    const result = spawnSync(
      "zig",
      [
        "build-exe",
        sourcePath,
        "-target",
        "wasm32-wasi",
        "-O",
        "ReleaseSmall",
        "--cache-dir",
        localCachePath,
        "--global-cache-dir",
        globalCachePath,
        `-femit-bin=${artifactPath}`,
      ],
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
        forbiddenPatterns: gate.forbiddenPatterns,
        errors: [
          issue("TRANSPILE_FAILED", "Zig WASI compile failed closed.", {
            constraint:
              "Zig source must compile to wasm32-wasi with the local Zig toolchain.",
            remediation:
              "Fix the Zig syntax or use the Zig WASI starter sample.",
            reference: "examples/zig-wasi-strategy",
          }),
        ],
      }
    }
    const artifactBytes = readFileSync(artifactPath)
    const importErrors = validateWasmWasiImports(artifactBytes)
    if (importErrors.length > 0) {
      return {
        ok: false,
        forbiddenPatterns: gate.forbiddenPatterns,
        errors: importErrors,
      }
    }
    if (artifactBytes.byteLength > STRATEGY_WASM_ARTIFACT_BYTES) {
      return {
        ok: false,
        forbiddenPatterns: gate.forbiddenPatterns,
        errors: [
          issue(
            "SOURCE_TOO_LARGE",
            "Compiled Zig WASM artifact exceeds the artifact byte cap.",
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
      sourceHash: gate.sourceHash,
      wasiProfile: "preview1",
      targetTriple: "wasm32-wasi",
      abiEnvelope: "stdin-stdout-json",
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      validationStatus: "valid",
      createdAt: new Date(0).toISOString(),
      toolchain: {
        language: "zig",
        compiler: "zig",
        compilerVersion: zigVersion(),
        targetTriple: "wasm32-wasi",
        commandSummary:
          "zig build-exe strategy.zig -target wasm32-wasi -O ReleaseSmall --cache-dir <temp> --global-cache-dir <temp> -femit-bin=strategy.wasm",
      },
      publicEvidence: {
        label: "Zig WASM/WASI counted provider artifact",
        nonCounted: false,
        sandboxClaim: "candidate-readiness-only",
      },
    }
    return { ok: true, artifact, errors: [], forbiddenPatterns: [] }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
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
          reference: "examples/rust-wasi-exhibition-beta",
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
            reference: "examples/rust-wasi-exhibition-beta",
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
            "Compiled Rust WASM artifact exceeds the artifact byte cap.",
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
        label: "Rust WASM/WASI counted provider artifact",
        nonCounted: false,
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
    warnings: [],
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
  const { providerValidation: _providerValidation, ...metadata } =
    input.metadata ?? {}
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
      ...metadata,
      tags: [...new Set([...(metadata.tags ?? []), "rust", "wasm-wasi"])],
      compiledArtifact: compiled.artifact,
    },
  })
}

const zigValidationFromCompile = (
  source: string,
  compiled: WasmCompileResult,
): StrategyRevisionValidationReport => {
  const gate = zigSourceGate(source)
  return {
    valid: compiled.ok,
    errors: compiled.errors,
    warnings: [],
    sourceBytes: gate.sourceBytes,
    forbiddenPatterns: compiled.forbiddenPatterns,
    sourceHash: gate.sourceHash,
    runtimeVersion: wasmWasiRuntimeMetadata("zig").adapter.version,
    engineCompatibility: {
      spec: COMPATIBILITY_VERSIONS.spec,
      engine: COMPATIBILITY_VERSIONS.engine,
    },
  }
}

export const validateZigStrategySource = (
  source: string,
): StrategyRevisionValidationReport =>
  zigValidationFromCompile(source, compileZigWasmArtifact(source))

export const buildZigStrategyRevision = (input: {
  source: string
  strategyId?: string | undefined
  metadata?: StrategyRevisionMetadata | undefined
}): StrategyRevision => {
  const runtime = wasmWasiRuntimeMetadata("zig")
  const compiled = compileZigWasmArtifact(input.source)
  const validation = zigValidationFromCompile(input.source, compiled)
  if (!compiled.ok || !compiled.artifact) {
    throw new Error(
      "Cannot build Zig WASM Strategy Revision from invalid source",
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
  const { providerValidation: _providerValidation, ...metadata } =
    input.metadata ?? {}
  return StrategyRevisionSchema.parse({
    id: `strategy-revision:zig-wasi:${validation.sourceHash}:${compatibilityHash.slice(0, 16)}`,
    ...(input.strategyId === undefined ? {} : { strategyId: input.strategyId }),
    source: input.source,
    sourceHash: validation.sourceHash,
    sourceBytes: validation.sourceBytes,
    runtime,
    engineCompatibility: validation.engineCompatibility,
    validation,
    metadata: {
      ...metadata,
      tags: [...new Set([...(metadata.tags ?? []), "zig", "wasm-wasi"])],
      compiledArtifact: compiled.artifact,
    },
  })
}

export interface ZigReadinessEvidence {
  ok: boolean
  zigVersion: string | null
  target: "wasm32-wasi"
  compileProof: boolean
  runtimeProof: boolean
  artifactHash: string | null
  resolvedPath: string | null
  message: string
}

export const zigReadinessEvidence = (): ZigReadinessEvidence => {
  const pathResult = spawnSync("sh", ["-lc", "command -v zig"], {
    encoding: "utf8",
    shell: false,
    env: { PATH: process.env.PATH ?? "" },
    timeout: 1_000,
    maxBuffer: 32 * 1024,
  })
  const result = spawnSync("zig", ["version"], {
    encoding: "utf8",
    shell: false,
    env: { PATH: process.env.PATH ?? "" },
    timeout: 1_000,
    maxBuffer: 32 * 1024,
  })
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      zigVersion: null,
      target: "wasm32-wasi",
      compileProof: false,
      runtimeProof: false,
      artifactHash: null,
      resolvedPath: null,
      message:
        "Zig toolchain unavailable; counted Zig provider validation fails closed.",
    }
  }
  const source = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn contains(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return true;
    if (haystack.len < needle.len) return false;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }
    return false;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    if (contains(input_buf[0..nread], "\\"methodName\\":\\"soldierBrain\\"")) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`
  const compiled = compileZigWasmArtifact(source)
  const runtimeProof = (() => {
    if (!compiled.ok || compiled.artifact?.bytesBase64 === undefined) {
      return false
    }
    const wasmtimePathResult = spawnSync("sh", ["-lc", "command -v wasmtime"], {
      encoding: "utf8",
      shell: false,
      env: { PATH: process.env.PATH ?? "" },
      timeout: 1_000,
      maxBuffer: 32 * 1024,
    })
    const wasmtimePath =
      wasmtimePathResult.status === 0
        ? (wasmtimePathResult.stdout ?? "").trim()
        : ""
    if (wasmtimePath.length === 0) {
      return false
    }
    const dir = mkdtempSync(join(tmpdir(), "cowards-zig-wasi-proof-"))
    const artifactPath = join(dir, "strategy.wasm")
    try {
      writeFileSync(
        artifactPath,
        Buffer.from(compiled.artifact.bytesBase64, "base64"),
      )
      const result = spawnSync(
        wasmtimePath,
        [
          "run",
          "-W",
          "fuel=10000000",
          "-W",
          "timeout=1000ms",
          "-W",
          "max-memory-size=67108864",
          "-W",
          "max-wasm-stack=1048576",
          "-W",
          "trap-on-grow-failure=y",
          artifactPath,
        ],
        {
          input: JSON.stringify({
            abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
            methodName: "soldierBrain",
            runtime: wasmWasiRuntimeMetadata("zig"),
            source: {
              hash: compiled.artifact.sourceHash,
              bytes: Buffer.byteLength(source),
              entrypoint: "_start",
            },
            input: {},
          }),
          encoding: "utf8",
          env: {},
          shell: false,
          timeout: 1_250,
          maxBuffer: 64 * 1024,
        },
      )
      if (result.error || result.status !== 0) {
        return false
      }
      const parsed = StrategyRuntimeResponseEnvelopeSchema.safeParse(
        JSON.parse(result.stdout ?? ""),
      )
      return parsed.success && parsed.data.ok === true
    } catch {
      return false
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })()
  return {
    ok: compiled.ok && runtimeProof,
    zigVersion: (result.stdout ?? "").trim(),
    target: "wasm32-wasi",
    compileProof: compiled.ok,
    runtimeProof,
    artifactHash: compiled.artifact?.hash ?? null,
    resolvedPath:
      pathResult.status === 0 ? (pathResult.stdout ?? "").trim() : null,
    message:
      compiled.ok && runtimeProof
        ? "Zig toolchain, target, compile artifact, and WASI Preview 1 ABI proof passed; Zig provider validation may issue counted artifact provenance."
        : "Zig toolchain detected but compile/runtime proof failed; counted Zig provider validation fails closed.",
  }
}
