import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  accessSync,
  constants,
  mkdtempSync,
  realpathSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { delimiter, dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import {
  COMPATIBILITY_VERSIONS,
  RUNTIME_INVOCATION_V1_17_CANDIDATE,
  STRATEGY_RUNTIME_ABI_VERSION,
  STRATEGY_SOURCE_BYTES,
  STRATEGY_WASM_ARTIFACT_BYTES,
  StrategyRevisionSchema,
  admitCanonicalJsonBytes,
  admitCanonicalJsonValue,
  hashCanonicalIdentity,
  hashCanonicalIdentityValue,
  runtimeCompatibilityKey,
  type CompiledStrategyArtifact,
  type JsonValue,
  type SourceLanguageStrategyArtifact,
  type StrategyRevision,
  type StrategyRevisionMetadata,
  type StrategyRevisionValidationIssue,
  type StrategyRevisionValidationReport,
} from "@cowards/spec"
import {
  WASM_WASI_V1_17_EXECUTION_SETTINGS,
  wasmWasiRuntimeMetadata,
} from "./metadata.js"

const hashBytes = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex")

const hashSource = (source: string): string =>
  createHash("sha256").update(source).digest("hex")

const prefixedSha256 = (bytes: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const resolveExactCommandPath = (command: string): string | null => {
  for (const directory of (process.env.PATH ?? "").split(delimiter)) {
    if (directory.length === 0) continue
    const candidate = join(directory, command)
    try {
      accessSync(candidate, constants.X_OK)
      return candidate
    } catch {
      // Keep looking for the exact executable selected by PATH.
    }
  }
  return null
}

const requireCommandOutput = (
  commandPath: string,
  args: readonly string[],
): string => {
  const result = spawnSync(commandPath, [...args], {
    encoding: "utf8",
    shell: false,
    env: { PATH: process.env.PATH ?? "" },
    timeout: 5_000,
    maxBuffer: 256 * 1024,
  })
  if (result.error !== undefined || result.status !== 0) {
    throw new Error("Exact WASM/WASI identity command was unavailable")
  }
  return (result.stdout ?? "").trim()
}

const hashDirectoryTree = (root: string): `sha256:${string}` => {
  const files: string[] = []
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name)
      const stat = statSync(path)
      if (stat.isDirectory()) visit(path)
      else if (stat.isFile()) files.push(path)
    }
  }
  visit(root)
  const hash = createHash("sha256")
  for (const path of files.sort()) {
    const name = Buffer.from(relative(root, path), "utf8")
    const bytes = readFileSync(path)
    const nameLength = Buffer.alloc(8)
    nameLength.writeBigUInt64BE(BigInt(name.byteLength))
    const byteLength = Buffer.alloc(8)
    byteLength.writeBigUInt64BE(BigInt(bytes.byteLength))
    hash.update(nameLength).update(name).update(byteLength).update(bytes)
  }
  return `sha256:${hash.digest("hex")}`
}

export interface WasmWasiCandidateIdentityV117 {
  schemaVersion: "runtime-wasm-wasi-identity-v1.17"
  runtimeAbi: "strategy-runtime-abi-v1.17"
  languageId: "rust" | "zig"
  sourceIdentity: WasmWasiSourceIdentityV117
  artifact: {
    sha256: `sha256:${string}`
    bytes: number
    targetTriple: string
    wasiProfile: "preview1"
    guestPayloadAbi: "raw-canonical-json-v1"
  }
  compiler: {
    executableSha256: `sha256:${string}`
    resolvedPathSha256: `sha256:${string}`
    invocationShim: {
      executableSha256: `sha256:${string}`
      resolvedPathSha256: `sha256:${string}`
    } | null
    reportedVersion: string
    targetTriple: string
    flags: readonly string[]
  }
  stdlibSysroot: {
    kind: "target-libdir" | "compiler-embedded-no-stdlib"
    sha256: `sha256:${string}`
  }
  runtime: {
    executableSha256: `sha256:${string}`
    resolvedPathSha256: `sha256:${string}`
    reportedVersion: string
    interface: "wasi-preview1-command"
  }
  adapter: {
    buildSha256: `sha256:${string}`
    dependencies: {
      engineSha256: `sha256:${string}`
      specSha256: `sha256:${string}`
      workspaceLockSha256: `sha256:${string}`
    }
  }
  settings: {
    sha256: `sha256:${string}`
    value: typeof WASM_WASI_V1_17_EXECUTION_SETTINGS
  }
  containment: {
    profileId: "wasm-wasi-preview1-empty-env-no-preopen-v1.17"
    sha256: `sha256:${string}`
  }
  metering: {
    supported: readonly string[]
    unsupported: readonly string[]
  }
  countedCertification: "uncertified"
  certificationReasons: readonly string[]
  productionTrustedProducers: readonly []
  identitySha256: `sha256:${string}`
}

export interface WasmWasiCandidateArtifactV117 extends Omit<
  CompiledStrategyArtifact,
  "abiEnvelope" | "abiVersion" | "publicEvidence" | "sourceHash"
> {
  abiEnvelope: "stdin-canonical-request-stdout-raw-canonical-payload"
  abiVersion: "strategy-runtime-abi-v1.17"
  sourceHash: `sha256:${string}`
  sourceIdentity: WasmWasiSourceIdentityV117
  publicEvidence: {
    label: string
    nonCounted: true
    sandboxClaim: "candidate-readiness-only"
  }
}

export interface WasmWasiCandidateRevisionV117 {
  id: string
  sourceIdentity: WasmWasiSourceIdentityV117
  runtime: {
    abiVersion: "strategy-runtime-abi-v1.17"
    language: {
      id: "rust" | "zig"
      version: string
    }
    adapter: {
      id: "runtime-wasm-wasi-wasmtime-preview1"
      version: "v1.17-candidate"
    }
  }
  metadata: {
    compiledArtifact: WasmWasiCandidateArtifactV117
  }
}

export interface WasmWasiSourceIdentityV117 extends Omit<
  NonNullable<SourceLanguageStrategyArtifact["sourceIdentity"]>,
  "originalSourceSha256" | "normalizedSourceSha256"
> {
  originalSourceSha256: `sha256:${string}`
  normalizedSourceSha256: `sha256:${string}`
}

const WASM_WASI_SOURCE_IDENTITY_SECTION_V117 = "cowards.source-identity.v1.17"

export const buildWasmWasiSourceIdentityV117 = (
  source: string,
): WasmWasiSourceIdentityV117 => {
  let lf = 0
  let crlf = 0
  let cr = 0
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\r") {
      if (source[index + 1] === "\n") {
        crlf += 1
        index += 1
      } else {
        cr += 1
      }
    } else if (source[index] === "\n") {
      lf += 1
    }
  }
  const present = [lf > 0, crlf > 0, cr > 0].filter(Boolean).length
  const kind: WasmWasiSourceIdentityV117["lineEndings"]["kind"] =
    present === 0
      ? "none"
      : present > 1
        ? "mixed"
        : lf > 0
          ? "lf"
          : crlf > 0
            ? "crlf"
            : "cr"
  const normalizedSource = source.replace(/\r\n?/gu, "\n")
  const originalBytes = Buffer.from(source, "utf8")
  const normalizedBytes = Buffer.from(normalizedSource, "utf8")
  return {
    identityVersion: "strategy-source-identity-v2",
    normalizationPolicy: "source-line-endings-lf-v1.17",
    originalSourceSha256: `sha256:${hashCanonicalIdentity("originalSource", [
      originalBytes,
    ])}`,
    originalSourceBytes: originalBytes.byteLength,
    normalizedSourceSha256: `sha256:${hashCanonicalIdentity(
      "normalizedSource",
      [normalizedBytes],
    )}`,
    normalizedSourceBytes: normalizedBytes.byteLength,
    lineEndings: { kind, lf, crlf, cr },
    hasFinalNewline: source.endsWith("\n") || source.endsWith("\r"),
  }
}

export const wasmWasiSourceIdentityFingerprintV117 = (
  identity: WasmWasiSourceIdentityV117,
): `sha256:${string}` => {
  if (!isWasmWasiSourceIdentityV117(identity)) {
    throw new TypeError("WASM source identity is not a closed typed record")
  }
  return `sha256:${hashCanonicalIdentityValue(
    "artifactManifest",
    identity as unknown as JsonValue,
  )}`
}

export const isWasmWasiSourceIdentityV117 = (
  value: unknown,
): value is WasmWasiSourceIdentityV117 => {
  if (typeof value !== "object" || value === null) return false
  const identity = value as Partial<WasmWasiSourceIdentityV117>
  const exactKeys = (record: object, expected: readonly string[]) => {
    const actual = Object.keys(record).sort()
    const sortedExpected = [...expected].sort()
    return (
      actual.length === sortedExpected.length &&
      actual.every((key, index) => key === sortedExpected[index])
    )
  }
  if (
    !exactKeys(value, [
      "hasFinalNewline",
      "identityVersion",
      "lineEndings",
      "normalizationPolicy",
      "normalizedSourceBytes",
      "normalizedSourceSha256",
      "originalSourceBytes",
      "originalSourceSha256",
    ])
  ) {
    return false
  }
  const lineEndings = identity.lineEndings
  if (typeof lineEndings !== "object" || lineEndings === null) return false
  if (!exactKeys(lineEndings, ["cr", "crlf", "kind", "lf"])) return false
  const counts = [lineEndings.lf, lineEndings.crlf, lineEndings.cr]
  const countsAreValid = counts.every(
    (count) =>
      typeof count === "number" && Number.isSafeInteger(count) && count >= 0,
  )
  const originalSourceBytes = identity.originalSourceBytes
  const normalizedSourceBytes = identity.normalizedSourceBytes
  const byteCountsAreValid =
    typeof originalSourceBytes === "number" &&
    Number.isSafeInteger(originalSourceBytes) &&
    originalSourceBytes >= 0 &&
    typeof normalizedSourceBytes === "number" &&
    Number.isSafeInteger(normalizedSourceBytes) &&
    normalizedSourceBytes >= 0
  if (!countsAreValid || !byteCountsAreValid) return false
  const present = counts.filter(
    (count) => typeof count === "number" && count > 0,
  ).length
  const lineEndingCount = lineEndings.lf + lineEndings.crlf + lineEndings.cr
  const expectedKind =
    present === 0
      ? "none"
      : present > 1
        ? "mixed"
        : lineEndings.lf! > 0
          ? "lf"
          : lineEndings.crlf! > 0
            ? "crlf"
            : "cr"
  return (
    identity.identityVersion === "strategy-source-identity-v2" &&
    identity.normalizationPolicy === "source-line-endings-lf-v1.17" &&
    typeof identity.originalSourceSha256 === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(identity.originalSourceSha256) &&
    typeof identity.normalizedSourceSha256 === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(identity.normalizedSourceSha256) &&
    normalizedSourceBytes === originalSourceBytes - lineEndings.crlf &&
    lineEndingCount <= normalizedSourceBytes &&
    lineEndings.kind === expectedKind &&
    typeof identity.hasFinalNewline === "boolean" &&
    (identity.hasFinalNewline
      ? lineEndingCount > 0
      : lineEndingCount === 0 || lineEndingCount < normalizedSourceBytes)
  )
}

const encodeUnsignedLeb128 = (value: number): Buffer => {
  const bytes: number[] = []
  let remaining = value >>> 0
  do {
    let byte = remaining & 0x7f
    remaining >>>= 7
    if (remaining !== 0) byte |= 0x80
    bytes.push(byte)
  } while (remaining !== 0)
  return Buffer.from(bytes)
}

const appendSourceIdentityAttestationV117 = (
  wasmBytes: Buffer,
  identity: WasmWasiSourceIdentityV117,
): Buffer => {
  const admitted = admitCanonicalJsonValue(identity as unknown as JsonValue, {
    profile: "canonical-manifest",
  })
  if (!admitted.ok) throw new TypeError("Source identity is not canonical")
  const name = Buffer.from(WASM_WASI_SOURCE_IDENTITY_SECTION_V117, "utf8")
  const payload = Buffer.concat([
    encodeUnsignedLeb128(name.byteLength),
    name,
    Buffer.from(admitted.canonicalBytes),
  ])
  return Buffer.concat([
    wasmBytes,
    Buffer.from([0]),
    encodeUnsignedLeb128(payload.byteLength),
    payload,
  ])
}

export const readWasmWasiSourceIdentityAttestationV117 = (
  wasmBytes: Uint8Array,
): WasmWasiSourceIdentityV117 => {
  const module = new WebAssembly.Module(new Uint8Array(wasmBytes))
  const sections = WebAssembly.Module.customSections(
    module,
    WASM_WASI_SOURCE_IDENTITY_SECTION_V117,
  )
  if (sections.length !== 1) {
    throw new TypeError(
      "WASM source identity attestation is missing or duplicated",
    )
  }
  const admitted = admitCanonicalJsonBytes(new Uint8Array(sections[0]!), {
    profile: "canonical-manifest",
  })
  if (
    !admitted.ok ||
    typeof admitted.value !== "object" ||
    admitted.value === null
  ) {
    throw new TypeError("WASM source identity attestation is invalid")
  }
  const identity = admitted.value as unknown
  if (!isWasmWasiSourceIdentityV117(identity)) {
    throw new TypeError("WASM source identity attestation is malformed")
  }
  return identity
}

export const resolveWasmWasiAdapterBuildFilesV117 = (
  moduleUrl: string = import.meta.url,
): readonly string[] => {
  const modulePath = fileURLToPath(moduleUrl)
  const extension = extname(modulePath)
  if (extension !== ".ts" && extension !== ".js") {
    throw new Error("WASM/WASI adapter build module extension is unsupported")
  }
  const directory = dirname(modulePath)
  const files = [
    join(directory, `metadata${extension}`),
    join(directory, `validation${extension}`),
    join(directory, `wasm-wasi-subprocess-adapter${extension}`),
  ]
  for (const file of files) accessSync(file, constants.R_OK)
  return files
}

const collectAdapterDependencyDigestsV117 = (
  moduleUrl: string = import.meta.url,
) => {
  const moduleDirectory = dirname(fileURLToPath(moduleUrl))
  const runtimePackageRoot = dirname(moduleDirectory)
  const packagesRoot = dirname(runtimePackageRoot)
  const workspaceRoot = dirname(packagesRoot)
  const digestPackage = (packageName: "engine" | "spec") => {
    const packageRoot = join(packagesRoot, packageName)
    const packageManifest = join(packageRoot, "package.json")
    const sourceRoot = join(packageRoot, "src")
    accessSync(packageManifest, constants.R_OK)
    accessSync(sourceRoot, constants.R_OK)
    return `sha256:${hashCanonicalIdentity("adapterBuild", [
      readFileSync(packageManifest),
      new TextEncoder().encode(hashDirectoryTree(sourceRoot)),
    ])}` as `sha256:${string}`
  }
  const workspaceLock = join(workspaceRoot, "pnpm-lock.yaml")
  accessSync(workspaceLock, constants.R_OK)
  return {
    engineSha256: digestPackage("engine"),
    specSha256: digestPackage("spec"),
    workspaceLockSha256: prefixedSha256(readFileSync(workspaceLock)),
  }
}

export const collectWasmWasiCandidateIdentityV117 = (
  languageId: "rust" | "zig",
  artifact: WasmWasiCandidateArtifactV117,
): WasmWasiCandidateIdentityV117 => {
  if (
    !isWasmWasiSourceIdentityV117(artifact.sourceIdentity) ||
    artifact.toolchain.language !== languageId ||
    artifact.hash.length !== 64 ||
    artifact.wasiProfile !== "preview1" ||
    artifact.abiVersion !==
      RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion ||
    artifact.abiEnvelope !==
      "stdin-canonical-request-stdout-raw-canonical-payload"
  ) {
    throw new TypeError(
      "Candidate artifact does not match the requested WASM lane",
    )
  }
  const compilerName = languageId === "rust" ? "rustc" : "zig"
  const compilerInvocationPath = resolveExactCommandPath(compilerName)
  const wasmtimePath = resolveExactCommandPath("wasmtime")
  if (compilerInvocationPath === null || wasmtimePath === null) {
    throw new Error(
      "Exact WASM/WASI compiler or runtime executable is unavailable",
    )
  }
  const compilerInvocationResolvedPath = realpathSync(compilerInvocationPath)
  const rustupPath =
    languageId === "rust" ? resolveExactCommandPath("rustup") : null
  const rustupResolvedPath =
    rustupPath === null ? null : realpathSync(rustupPath)
  const compilerResolvedPath =
    languageId === "rust" &&
    rustupPath !== null &&
    compilerInvocationResolvedPath === rustupResolvedPath
      ? realpathSync(requireCommandOutput(rustupPath, ["which", "rustc"]))
      : compilerInvocationResolvedPath
  const compilerInvocationShim =
    compilerResolvedPath === compilerInvocationResolvedPath
      ? null
      : {
          executableSha256: prefixedSha256(
            readFileSync(compilerInvocationResolvedPath),
          ),
          resolvedPathSha256: prefixedSha256(compilerInvocationResolvedPath),
        }
  const reportedVersion =
    languageId === "rust"
      ? requireCommandOutput(compilerResolvedPath, ["--version", "--verbose"])
      : `zig ${requireCommandOutput(compilerResolvedPath, ["version"])}`
  const wasmtimeVersion = requireCommandOutput(wasmtimePath, ["--version"])
  const targetTriple = languageId === "rust" ? "wasm32-wasip1" : "wasm32-wasi"
  if (artifact.targetTriple !== targetTriple) {
    throw new TypeError(
      "Candidate artifact target does not match the exact lane",
    )
  }
  const wasmtimeResolvedPath = realpathSync(wasmtimePath)
  const compilerBytes = readFileSync(compilerResolvedPath)
  const stdlibSysroot =
    languageId === "rust"
      ? {
          kind: "target-libdir" as const,
          sha256: hashDirectoryTree(
            requireCommandOutput(compilerResolvedPath, [
              "--print",
              "target-libdir",
              "--target",
              targetTriple,
            ]),
          ),
        }
      : {
          kind: "compiler-embedded-no-stdlib" as const,
          sha256: `sha256:${hashCanonicalIdentity("sysrootStdlib", [
            new TextEncoder().encode("zig-no-stdlib-self-contained-guest"),
            compilerBytes,
          ])}` as `sha256:${string}`,
        }
  const dependencyDigests = collectAdapterDependencyDigestsV117()
  const adapterBuildSha256 = `sha256:${hashCanonicalIdentity("adapterBuild", [
    ...resolveWasmWasiAdapterBuildFilesV117().map((file) => readFileSync(file)),
    ...Object.values(dependencyDigests).map((digest) =>
      new TextEncoder().encode(digest),
    ),
  ])}` as `sha256:${string}`
  const settingsSha256 = `sha256:${hashCanonicalIdentityValue(
    "runtimeExecutable",
    WASM_WASI_V1_17_EXECUTION_SETTINGS as unknown as JsonValue,
  )}` as `sha256:${string}`
  const containmentValue = {
    environment: WASM_WASI_V1_17_EXECUTION_SETTINGS.environment,
    network: WASM_WASI_V1_17_EXECUTION_SETTINGS.network,
    preopenedDirectories:
      WASM_WASI_V1_17_EXECUTION_SETTINGS.preopenedDirectories,
    processLimit: WASM_WASI_V1_17_EXECUTION_SETTINGS.processLimit,
    runtimeInterface: WASM_WASI_V1_17_EXECUTION_SETTINGS.runtimeInterface,
  }
  const containmentSha256 = `sha256:${hashCanonicalIdentityValue(
    "containmentPolicy",
    containmentValue as unknown as JsonValue,
  )}` as `sha256:${string}`
  const base = {
    schemaVersion: "runtime-wasm-wasi-identity-v1.17" as const,
    runtimeAbi: RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion,
    languageId,
    sourceIdentity: artifact.sourceIdentity,
    artifact: {
      sha256: `sha256:${artifact.hash}` as `sha256:${string}`,
      bytes: artifact.bytes,
      targetTriple,
      wasiProfile: "preview1" as const,
      guestPayloadAbi: "raw-canonical-json-v1" as const,
    },
    compiler: {
      executableSha256: prefixedSha256(compilerBytes),
      resolvedPathSha256: prefixedSha256(compilerResolvedPath),
      invocationShim: compilerInvocationShim,
      reportedVersion,
      targetTriple,
      flags:
        languageId === "rust"
          ? ["--target", targetTriple, "-O", "<source>", "-o", "<artifact>"]
          : [
              "build-exe",
              "<source>",
              "-target",
              targetTriple,
              "-O",
              "ReleaseSmall",
              "--cache-dir",
              "<ephemeral>",
              "--global-cache-dir",
              "<ephemeral>",
              "-femit-bin=<artifact>",
            ],
    },
    stdlibSysroot,
    runtime: {
      executableSha256: prefixedSha256(readFileSync(wasmtimeResolvedPath)),
      resolvedPathSha256: prefixedSha256(wasmtimeResolvedPath),
      reportedVersion: wasmtimeVersion,
      interface: "wasi-preview1-command" as const,
    },
    adapter: {
      buildSha256: adapterBuildSha256,
      dependencies: dependencyDigests,
    },
    settings: {
      sha256: settingsSha256,
      value: WASM_WASI_V1_17_EXECUTION_SETTINGS,
    },
    containment: {
      profileId: "wasm-wasi-preview1-empty-env-no-preopen-v1.17" as const,
      sha256: containmentSha256,
    },
    metering: {
      supported: [
        "wasmtime-fuel-ceiling",
        "wasmtime-epoch-wall-ceiling",
        "wasmtime-linear-memory-ceiling",
        "wasmtime-stack-ceiling",
        "host-stdout-byte-ceiling",
        "single-process-no-preopen-empty-env",
      ],
      unsupported: WASM_WASI_V1_17_EXECUTION_SETTINGS.unsupportedMeters,
    },
    countedCertification: "uncertified" as const,
    certificationReasons: [
      "Phase 259 full-state event memory objective and failure-trace conformance is not yet complete.",
      "Portable cross-language compute and cumulative meter equivalence is unavailable.",
      "This local executable observation is not a digest-addressed production deployment pin.",
    ],
    productionTrustedProducers: [] as const,
  }
  return {
    ...base,
    identitySha256: `sha256:${hashCanonicalIdentityValue(
      "evidenceBundle",
      base as unknown as JsonValue,
    )}`,
  }
}

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

// This allowlist is the production gate for WASM/WASI Strategy artifacts.
// Candidate compilers, including TinyGo, are rejected until their artifacts
// avoid host time, randomness, argv, filesystem, network, path, and socket
// imports or move to a separately approved deterministic ABI.

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

interface WasmArtifactAbiDeclaration {
  abiEnvelope:
    | CompiledStrategyArtifact["abiEnvelope"]
    | WasmWasiCandidateArtifactV117["abiEnvelope"]
  abiVersion: string
  publicEvidence: CompiledStrategyArtifact["publicEvidence"]
}

type DeclaredWasmArtifact<D extends WasmArtifactAbiDeclaration> = Omit<
  CompiledStrategyArtifact,
  "abiEnvelope" | "abiVersion" | "publicEvidence"
> &
  D

interface DeclaredWasmCompileResult<D extends WasmArtifactAbiDeclaration> {
  ok: boolean
  artifact?: DeclaredWasmArtifact<D> | undefined
  errors: StrategyRevisionValidationIssue[]
  forbiddenPatterns: string[]
}

const LEGACY_WASM_ARTIFACT_ABI = {
  abiEnvelope: "stdin-stdout-json",
  abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  publicEvidence: {
    label: "WASM/WASI counted provider artifact",
    nonCounted: false,
    sandboxClaim: "candidate-readiness-only",
  },
} as const satisfies WasmArtifactAbiDeclaration

const CANDIDATE_WASM_ARTIFACT_ABI_V117 = {
  abiEnvelope: "stdin-canonical-request-stdout-raw-canonical-payload",
  abiVersion: RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion,
  publicEvidence: {
    label: "WASM/WASI v1.17 raw-payload candidate artifact",
    nonCounted: true,
    sandboxClaim: "candidate-readiness-only",
  },
} as const satisfies WasmArtifactAbiDeclaration

// Toolchain discovery is outside every signed Strategy method budget. Keep it
// bounded, but allow the same host-load tolerance as the exact identity probes
// so a busy compiler is not misclassified as an absent runtime lane.
const TOOLCHAIN_IDENTITY_PROBE_TIMEOUT_MS = 5_000

const rustcVersion = (): string => {
  const result = spawnSync("rustc", ["--version"], {
    encoding: "utf8",
    shell: false,
    env: { PATH: process.env.PATH ?? "" },
    timeout: TOOLCHAIN_IDENTITY_PROBE_TIMEOUT_MS,
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
    timeout: TOOLCHAIN_IDENTITY_PROBE_TIMEOUT_MS,
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

const compileZigWasmArtifactWithAbi = <D extends WasmArtifactAbiDeclaration>(
  source: string,
  abi: D,
): DeclaredWasmCompileResult<D> => {
  const gate = zigSourceGate(source)
  if (gate.errors.length > 0) {
    return {
      ok: false,
      errors: gate.errors,
      forbiddenPatterns: gate.forbiddenPatterns,
    }
  }
  if (zigVersion() === "zig unavailable") {
    return {
      ok: false,
      forbiddenPatterns: gate.forbiddenPatterns,
      errors: [
        issue("TRANSPILE_FAILED", "Zig WASI toolchain unavailable.", {
          constraint:
            "Zig source validation requires the local Zig WASI toolchain.",
          remediation:
            "Install or configure Zig with wasm32-wasi support, then retry validation.",
          reference: "runtime/languages#zig",
        }),
      ],
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
        timeout: 30_000,
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
    const artifact: DeclaredWasmArtifact<D> = {
      format: "wasm",
      hash: hashBytes(artifactBytes),
      bytes: artifactBytes.byteLength,
      bytesBase64: artifactBytes.toString("base64"),
      sourceHash: gate.sourceHash,
      wasiProfile: "preview1",
      targetTriple: "wasm32-wasi",
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
      ...abi,
    }
    return { ok: true, artifact, errors: [], forbiddenPatterns: [] }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export const compileZigWasmArtifact = (source: string): WasmCompileResult =>
  compileZigWasmArtifactWithAbi(source, {
    ...LEGACY_WASM_ARTIFACT_ABI,
    publicEvidence: {
      ...LEGACY_WASM_ARTIFACT_ABI.publicEvidence,
      label: "Zig WASM/WASI counted provider artifact",
    },
  })

const compileRustWasmArtifactWithAbi = <D extends WasmArtifactAbiDeclaration>(
  source: string,
  abi: D,
): DeclaredWasmCompileResult<D> => {
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
  if (rustcVersion() === "rustc unavailable") {
    return {
      ok: false,
      forbiddenPatterns,
      errors: [
        issue("TRANSPILE_FAILED", "Rust WASI toolchain unavailable.", {
          constraint:
            "Rust source validation requires rustc with the wasm32-wasip1 target.",
          remediation:
            "Install or configure rustc and the wasm32-wasip1 target, then retry validation.",
          reference: "runtime/languages#rust",
        }),
      ],
    }
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
    const artifact: DeclaredWasmArtifact<D> = {
      format: "wasm",
      hash: hashBytes(artifactBytes),
      bytes: artifactBytes.byteLength,
      bytesBase64: artifactBytes.toString("base64"),
      sourceHash,
      wasiProfile: "preview1",
      targetTriple: "wasm32-wasip1",
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
      ...abi,
    }
    return { ok: true, artifact, errors: [], forbiddenPatterns }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export const compileRustWasmArtifact = (source: string): WasmCompileResult =>
  compileRustWasmArtifactWithAbi(source, {
    ...LEGACY_WASM_ARTIFACT_ABI,
    publicEvidence: {
      ...LEGACY_WASM_ARTIFACT_ABI.publicEvidence,
      label: "Rust WASM/WASI counted provider artifact",
    },
  })

export interface WasmWasiCandidateCompileResultV117 {
  ok: boolean
  artifact?: WasmWasiCandidateArtifactV117 | undefined
  errors: StrategyRevisionValidationIssue[]
  forbiddenPatterns: string[]
}

const attestCandidateArtifactV117 = (
  artifact: DeclaredWasmArtifact<typeof CANDIDATE_WASM_ARTIFACT_ABI_V117>,
  source: string,
): WasmWasiCandidateArtifactV117 => {
  if (artifact.bytesBase64 === undefined) {
    throw new TypeError("Candidate artifact bytes are unavailable")
  }
  const sourceIdentity = buildWasmWasiSourceIdentityV117(source)
  const bytes = appendSourceIdentityAttestationV117(
    Buffer.from(artifact.bytesBase64, "base64"),
    sourceIdentity,
  )
  return {
    ...artifact,
    hash: hashBytes(bytes),
    bytes: bytes.byteLength,
    bytesBase64: bytes.toString("base64"),
    sourceHash: sourceIdentity.normalizedSourceSha256,
    sourceIdentity,
  }
}

const finalizeCandidateCompileResultV117 = (
  compiled: DeclaredWasmCompileResult<typeof CANDIDATE_WASM_ARTIFACT_ABI_V117>,
  source: string,
  language: "Rust" | "Zig",
): WasmWasiCandidateCompileResultV117 => {
  if (!compiled.ok || compiled.artifact === undefined) {
    return {
      ok: false,
      errors: compiled.errors,
      forbiddenPatterns: compiled.forbiddenPatterns,
    }
  }
  const artifact = attestCandidateArtifactV117(compiled.artifact, source)
  if (artifact.bytes > STRATEGY_WASM_ARTIFACT_BYTES) {
    return {
      ok: false,
      forbiddenPatterns: compiled.forbiddenPatterns,
      errors: [
        issue(
          "SOURCE_TOO_LARGE",
          `Attested ${language} WASM artifact exceeds the artifact byte cap.`,
          {
            constraint: `Attested WASM artifacts must be ${STRATEGY_WASM_ARTIFACT_BYTES} bytes or less.`,
            remediation: "Reduce the Strategy or compile helper footprint.",
            reference: "runtime/limits",
          },
        ),
      ],
    }
  }
  return { ...compiled, artifact }
}

export const compileRustWasmArtifactV117 = (
  source: string,
): WasmWasiCandidateCompileResultV117 => {
  const compiled = compileRustWasmArtifactWithAbi(
    source,
    CANDIDATE_WASM_ARTIFACT_ABI_V117,
  )
  return finalizeCandidateCompileResultV117(compiled, source, "Rust")
}

export const compileZigWasmArtifactV117 = (
  source: string,
): WasmWasiCandidateCompileResultV117 => {
  const compiled = compileZigWasmArtifactWithAbi(
    source,
    CANDIDATE_WASM_ARTIFACT_ABI_V117,
  )
  return finalizeCandidateCompileResultV117(compiled, source, "Zig")
}

const buildWasmWasiCandidateRevisionV117 = (
  languageId: "rust" | "zig",
  source: string,
): WasmWasiCandidateRevisionV117 => {
  const compiled =
    languageId === "rust"
      ? compileRustWasmArtifactV117(source)
      : compileZigWasmArtifactV117(source)
  if (!compiled.ok || compiled.artifact === undefined) {
    throw new Error(
      `Cannot build ${languageId} WASM/WASI v1.17 candidate from invalid source`,
    )
  }
  const sourceIdentity = compiled.artifact.sourceIdentity
  return {
    id: `strategy-revision:${languageId}-wasi-v1.17:${sourceIdentity.normalizedSourceSha256.slice(-16)}:${compiled.artifact.hash.slice(0, 16)}`,
    sourceIdentity,
    runtime: {
      abiVersion: RUNTIME_INVOCATION_V1_17_CANDIDATE.runtimeAbiVersion,
      language: {
        id: languageId,
        version:
          languageId === "rust" ? "1.95.0-wasm32-wasip1" : "0.16.0-wasm32-wasi",
      },
      adapter: {
        id: "runtime-wasm-wasi-wasmtime-preview1",
        version: "v1.17-candidate",
      },
    },
    metadata: { compiledArtifact: compiled.artifact },
  }
}

export const buildRustWasmCandidateRevisionV117 = (source: string) =>
  buildWasmWasiCandidateRevisionV117("rust", source)

export const buildZigWasmCandidateRevisionV117 = (source: string) =>
  buildWasmWasiCandidateRevisionV117("zig", source)

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

export const zigReadinessEvidenceForRuntimeAbi = (
  runtimeAbiVersion: string,
): ZigReadinessEvidence => {
  const pathResult = spawnSync("sh", ["-lc", "command -v zig"], {
    encoding: "utf8",
    shell: false,
    env: { PATH: process.env.PATH ?? "" },
    timeout: TOOLCHAIN_IDENTITY_PROBE_TIMEOUT_MS,
    maxBuffer: 32 * 1024,
  })
  const result = spawnSync("zig", ["version"], {
    encoding: "utf8",
    shell: false,
    env: { PATH: process.env.PATH ?? "" },
    timeout: TOOLCHAIN_IDENTITY_PROBE_TIMEOUT_MS,
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
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${runtimeAbiVersion}\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"${runtimeAbiVersion}\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
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
      timeout: TOOLCHAIN_IDENTITY_PROBE_TIMEOUT_MS,
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
            abiVersion: runtimeAbiVersion,
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
      const parsed = JSON.parse(result.stdout ?? "") as unknown
      return (
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        (parsed as Record<string, unknown>).ok === true &&
        (parsed as Record<string, unknown>).abiVersion === runtimeAbiVersion
      )
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

export const zigReadinessEvidence = (): ZigReadinessEvidence =>
  zigReadinessEvidenceForRuntimeAbi(STRATEGY_RUNTIME_ABI_VERSION)
