#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export const CALIBRATION_INPUT_MANIFEST_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-calibration-inputs.json" as const
export const CALIBRATION_JSON_PATH =
  ".planning/artifacts/v1.37-runtime-abi-calibration.json" as const
export const CALIBRATION_MARKDOWN_PATH =
  ".planning/artifacts/v1.37-runtime-abi-calibration.md" as const
const OPTIONAL_CONTRACT_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-contract.json" as const
const OPTIONAL_REGISTRY_PATH = "packages/spec/src/runtime-abi-v1-17.ts" as const

export const RUNTIME_ABI_V1_17_CALIBRATION_LIMITS = Object.freeze({
  rawUtf8Bytes: 8 * 1024 * 1024,
  depth: 64,
  nodes: 262_144,
  decodedStringUtf8Bytes: 6 * 1024 * 1024,
  arrayEntries: 65_536,
  objectEntries: 65_536,
} as const)

export const RUNTIME_ABI_V1_17_FIELD_CAPS = Object.freeze({
  strategySource: { value: 64 * 1024, unit: "raw-utf8-bytes" },
  sourceArtifact: { value: 256 * 1024, unit: "raw-utf8-bytes" },
  wasmArtifact: { value: 4 * 1024 * 1024, unit: "raw-utf8-bytes" },
  strategyMemory: { value: 32 * 1024, unit: "canonical-payload-bytes" },
  soldierMemory: { value: 2 * 1024, unit: "canonical-payload-bytes" },
  objectivePayload: { value: 1024, unit: "canonical-payload-bytes" },
  invocationOutput: { value: 256 * 1024, unit: "canonical-payload-bytes" },
  stdout: { value: 256 * 1024, unit: "transport-frame-bytes" },
  stderr: { value: 64 * 1024, unit: "raw-utf8-bytes" },
  httpRequest: { value: 8 * 1024 * 1024, unit: "transport-frame-bytes" },
  goResponse: { value: 8 * 1024 * 1024, unit: "transport-frame-bytes" },
} as const)

const INPUT_CLASSIFICATIONS = [
  "current-valid-contract",
  "current-valid-fixture",
  "historical-valid-control",
  "hostile-negative-probe",
] as const
type InputClassification = (typeof INPUT_CLASSIFICATIONS)[number]

interface RawManifestEntry {
  path?: unknown
  sha256?: unknown
  byteLength?: unknown
  classification?: unknown
  inclusionReason?: unknown
  expectedLimitDomains?: unknown
}

interface RawManifest {
  schemaVersion?: unknown
  purpose?: unknown
  privacy?: unknown
  denylist?: unknown
  inputs?: unknown
}

export interface CalibrationInput {
  path: string
  sha256: string
  byteLength: number
  classification: InputClassification
  inclusionReason: string
  expectedLimitDomains: readonly string[]
}

export interface CalibrationInputManifest {
  schemaVersion: "runtime-abi-v1.17-calibration-inputs-v1"
  sha256: string
  path: typeof CALIBRATION_INPUT_MANIFEST_PATH
  privacy: "internal-build-evidence-no-private-payload-copy"
  denylist: readonly string[]
  inputs: readonly CalibrationInput[]
}

export interface JsonMetrics {
  rawUtf8Bytes: number
  canonicalPayloadBytes: number
  depth: number
  nodes: number
  decodedStringUtf8Bytes: number
  arrayEntries: number
  objectEntries: number
}

export type ProbeResult =
  | { kind: "accepted"; metrics: JsonMetrics }
  | {
      kind: "rejected"
      code:
        | "INVALID_JSON"
        | "MAX_RAW_UTF8_BYTES_EXCEEDED"
        | "MAX_DEPTH_EXCEEDED"
        | "MAX_NODES_EXCEEDED"
        | "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED"
        | "MAX_ARRAY_ENTRIES_EXCEEDED"
        | "MAX_OBJECT_ENTRIES_EXCEEDED"
      limit: number
      observed: number
    }

type LimitName = keyof typeof RUNTIME_ABI_V1_17_CALIBRATION_LIMITS

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const fail = (code: string, detail: string): never => {
  throw new Error(`${code}: ${detail}`)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/u.test(value)

const matchesDenyPattern = (relativePath: string, pattern: string): boolean => {
  if (pattern.startsWith("**/") && pattern.endsWith("/**")) {
    const segment = pattern.slice(3, -3)
    return relativePath.includes(`/${segment}/`) || relativePath.startsWith(`${segment}/`)
  }
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3)
    return relativePath === prefix || relativePath.startsWith(`${prefix}/`)
  }
  if (pattern === "**/*.log") return relativePath.endsWith(".log")
  if (pattern === ".env*") {
    return relativePath.split("/").some((part) => part.startsWith(".env"))
  }
  return relativePath === pattern
}

const assertNoSymlink = (root: string, relativePath: string): void => {
  let cursor = root
  for (const segment of relativePath.split("/")) {
    cursor = path.join(cursor, segment)
    if (lstatSync(cursor).isSymbolicLink()) {
      fail("symlink-input", relativePath)
    }
  }
}

const assertTracked = (root: string, relativePath: string): void => {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", "--", relativePath], {
      cwd: root,
      stdio: "ignore",
    })
  } catch {
    fail("untracked-input", relativePath)
  }
}

const parseManifestEntry = (
  raw: RawManifestEntry,
  index: number,
): CalibrationInput => {
  if (typeof raw.path !== "string" || raw.path.length === 0) {
    return fail("invalid-path", `inputs[${index}]`)
  }
  if (!isSha256(raw.sha256)) return fail("invalid-sha256", raw.path)
  if (!Number.isSafeInteger(raw.byteLength) || Number(raw.byteLength) < 0) {
    return fail("invalid-byte-length", raw.path)
  }
  if (!INPUT_CLASSIFICATIONS.includes(raw.classification as InputClassification)) {
    return fail("invalid-classification", raw.path)
  }
  if (typeof raw.inclusionReason !== "string" || raw.inclusionReason.length === 0) {
    return fail("missing-inclusion-reason", raw.path)
  }
  if (
    !Array.isArray(raw.expectedLimitDomains) ||
    raw.expectedLimitDomains.length === 0 ||
    raw.expectedLimitDomains.some(
      (domain) => typeof domain !== "string" || domain.length === 0,
    )
  ) {
    return fail("invalid-limit-domains", raw.path)
  }
  return {
    path: raw.path,
    sha256: raw.sha256,
    byteLength: Number(raw.byteLength),
    classification: raw.classification as InputClassification,
    inclusionReason: raw.inclusionReason,
    expectedLimitDomains: raw.expectedLimitDomains as string[],
  }
}

export const loadCalibrationInputManifest = (
  root: string = repoRoot,
): CalibrationInputManifest => {
  const absoluteRoot = realpathSync(root)
  const manifestPath = path.join(absoluteRoot, CALIBRATION_INPUT_MANIFEST_PATH)
  if (!existsSync(manifestPath)) fail("missing-manifest", manifestPath)
  assertNoSymlink(absoluteRoot, CALIBRATION_INPUT_MANIFEST_PATH)
  assertTracked(absoluteRoot, CALIBRATION_INPUT_MANIFEST_PATH)
  const manifestBytes = readFileSync(manifestPath)
  let raw: RawManifest
  try {
    raw = JSON.parse(manifestBytes.toString("utf8")) as RawManifest
  } catch {
    return fail("invalid-manifest-json", CALIBRATION_INPUT_MANIFEST_PATH)
  }
  if (
    raw.schemaVersion !== "runtime-abi-v1.17-calibration-inputs-v1" ||
    raw.privacy !== "internal-build-evidence-no-private-payload-copy" ||
    !Array.isArray(raw.denylist) ||
    raw.denylist.some((pattern) => typeof pattern !== "string") ||
    !Array.isArray(raw.inputs)
  ) {
    return fail("invalid-manifest-shape", CALIBRATION_INPUT_MANIFEST_PATH)
  }
  const denylist = raw.denylist as string[]
  const seen = new Set<string>()
  const inputs = raw.inputs.map((candidate, index) => {
    if (!isRecord(candidate)) return fail("invalid-entry", `inputs[${index}]`)
    const entry = parseManifestEntry(candidate, index)
    const normalized = path.posix.normalize(entry.path.replaceAll("\\", "/"))
    if (
      path.isAbsolute(entry.path) ||
      normalized !== entry.path ||
      normalized === ".." ||
      normalized.startsWith("../")
    ) {
      return fail("out-of-repository-input", entry.path)
    }
    if (seen.has(entry.path)) return fail("duplicate-input", entry.path)
    seen.add(entry.path)
    if (denylist.some((pattern) => matchesDenyPattern(entry.path, pattern))) {
      return fail("denylisted-input", entry.path)
    }
    const absolutePath = path.join(absoluteRoot, entry.path)
    if (!existsSync(absolutePath)) return fail("missing-input", entry.path)
    assertNoSymlink(absoluteRoot, entry.path)
    if (!realpathSync(absolutePath).startsWith(`${absoluteRoot}${path.sep}`)) {
      return fail("out-of-repository-input", entry.path)
    }
    assertTracked(absoluteRoot, entry.path)
    const bytes = readFileSync(absolutePath)
    if (bytes.byteLength !== entry.byteLength) {
      return fail(
        "length-mismatch",
        `${entry.path}: expected ${entry.byteLength}, observed ${bytes.byteLength}`,
      )
    }
    const observedHash = sha256(bytes)
    if (observedHash !== entry.sha256) {
      return fail(
        "hash-mismatch",
        `${entry.path}: expected ${entry.sha256}, observed ${observedHash}`,
      )
    }
    return Object.freeze(entry)
  })
  return Object.freeze({
    schemaVersion: "runtime-abi-v1.17-calibration-inputs-v1",
    sha256: sha256(manifestBytes),
    path: CALIBRATION_INPUT_MANIFEST_PATH,
    privacy: "internal-build-evidence-no-private-payload-copy",
    denylist: Object.freeze(denylist),
    inputs: Object.freeze(inputs),
  })
}

const preflightDepth = (
  text: string,
  limit: number,
): Exclude<ProbeResult, { kind: "accepted" }> | undefined => {
  let depth = 0
  let inString = false
  let escaped = false
  for (const character of text) {
    if (inString) {
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') inString = true
    else if (character === "[" || character === "{") {
      depth += 1
      if (depth > limit) {
        return {
          kind: "rejected",
          code: "MAX_DEPTH_EXCEEDED",
          limit,
          observed: depth,
        }
      }
    } else if (character === "]" || character === "}") depth -= 1
  }
  return undefined
}

const rejection = (
  code: Exclude<ProbeResult, { kind: "accepted" }>["code"],
  limit: number,
  observed: number,
): Exclude<ProbeResult, { kind: "accepted" }> => ({
  kind: "rejected",
  code,
  limit,
  observed,
})

export const probeJsonText = (
  text: string,
  limits: typeof RUNTIME_ABI_V1_17_CALIBRATION_LIMITS =
    RUNTIME_ABI_V1_17_CALIBRATION_LIMITS,
): ProbeResult => {
  const rawUtf8Bytes = Buffer.byteLength(text)
  if (rawUtf8Bytes > limits.rawUtf8Bytes) {
    return rejection(
      "MAX_RAW_UTF8_BYTES_EXCEEDED",
      limits.rawUtf8Bytes,
      rawUtf8Bytes,
    )
  }
  const depthFailure = preflightDepth(text, limits.depth)
  if (depthFailure) return depthFailure
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    return rejection("INVALID_JSON", rawUtf8Bytes, rawUtf8Bytes)
  }

  let depth = 0
  let nodes = 0
  let decodedStringUtf8Bytes = 0
  let arrayEntries = 0
  let objectEntries = 0
  const stack: Array<{ value: unknown; depth: number }> = [
    { value: root, depth: 0 },
  ]
  while (stack.length > 0) {
    const current = stack.pop()!
    nodes += 1
    if (nodes > limits.nodes) {
      return rejection("MAX_NODES_EXCEEDED", limits.nodes, nodes)
    }
    if (typeof current.value === "string") {
      const bytes = Buffer.byteLength(current.value)
      decodedStringUtf8Bytes = Math.max(decodedStringUtf8Bytes, bytes)
      if (bytes > limits.decodedStringUtf8Bytes) {
        return rejection(
          "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED",
          limits.decodedStringUtf8Bytes,
          bytes,
        )
      }
      continue
    }
    if (current.value === null || typeof current.value !== "object") continue
    const containerDepth = current.depth + 1
    depth = Math.max(depth, containerDepth)
    if (Array.isArray(current.value)) {
      arrayEntries = Math.max(arrayEntries, current.value.length)
      if (current.value.length > limits.arrayEntries) {
        return rejection(
          "MAX_ARRAY_ENTRIES_EXCEEDED",
          limits.arrayEntries,
          current.value.length,
        )
      }
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        stack.push({ value: current.value[index], depth: containerDepth })
      }
    } else {
      const entries = Object.entries(current.value as Record<string, unknown>)
      objectEntries = Math.max(objectEntries, entries.length)
      if (entries.length > limits.objectEntries) {
        return rejection(
          "MAX_OBJECT_ENTRIES_EXCEEDED",
          limits.objectEntries,
          entries.length,
        )
      }
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [key, value] = entries[index]!
        const keyBytes = Buffer.byteLength(key)
        decodedStringUtf8Bytes = Math.max(decodedStringUtf8Bytes, keyBytes)
        if (keyBytes > limits.decodedStringUtf8Bytes) {
          return rejection(
            "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED",
            limits.decodedStringUtf8Bytes,
            keyBytes,
          )
        }
        stack.push({ value, depth: containerDepth })
      }
    }
  }
  return {
    kind: "accepted",
    metrics: {
      rawUtf8Bytes,
      canonicalPayloadBytes: Buffer.byteLength(JSON.stringify(root)),
      depth,
      nodes,
      decodedStringUtf8Bytes,
      arrayEntries,
      objectEntries,
    },
  }
}

const probeText = (limit: LimitName, size: number): string => {
  switch (limit) {
    case "rawUtf8Bytes":
      return `"${"x".repeat(Math.max(0, size - 2))}"`
    case "depth":
      return `${"[".repeat(size)}null${"]".repeat(size)}`
    case "nodes":
      return `[${Array(Math.max(0, size - 1)).fill("null").join(",")}]`
    case "decodedStringUtf8Bytes":
      return `"${"x".repeat(size)}"`
    case "arrayEntries":
      return `[${Array(size).fill("null").join(",")}]`
    case "objectEntries":
      return `{${Array.from({ length: size }, (_, index) => `"k${index}":null`).join(",")}}`
  }
}

const probeLimitsFor = (
  limit: LimitName,
): typeof RUNTIME_ABI_V1_17_CALIBRATION_LIMITS => {
  const wide = {
    rawUtf8Bytes: 32 * 1024 * 1024,
    depth: 262_144,
    nodes: 1_000_000,
    decodedStringUtf8Bytes: 16 * 1024 * 1024,
    arrayEntries: 1_000_000,
    objectEntries: 1_000_000,
  }
  return { ...wide, [limit]: RUNTIME_ABI_V1_17_CALIBRATION_LIMITS[limit] }
}

const typedProbe = (limit: LimitName, size: number): ProbeResult =>
  probeJsonText(probeText(limit, size), probeLimitsFor(limit))

const limitUnits = Object.freeze({
  rawUtf8Bytes: "raw-utf8-bytes",
  depth: "container-levels",
  nodes: "parsed-json-nodes",
  decodedStringUtf8Bytes: "decoded-string-utf8-bytes",
  arrayEntries: "entries-per-array",
  objectEntries: "entries-per-object",
} as const)

const emptyMetrics = (): JsonMetrics => ({
  rawUtf8Bytes: 0,
  canonicalPayloadBytes: 0,
  depth: 0,
  nodes: 0,
  decodedStringUtf8Bytes: 0,
  arrayEntries: 0,
  objectEntries: 0,
})

export const evaluateCalibration = (root: string = repoRoot) => {
  const manifest = loadCalibrationInputManifest(root)
  const observations = manifest.inputs.map((input) => {
    const result = probeJsonText(readFileSync(path.join(root, input.path), "utf8"))
    if (result.kind !== "accepted") {
      fail("classified-input-rejected", `${input.path}:${result.code}`)
    }
    return { ...input, metrics: result.metrics }
  })
  const current = observations.filter(
    ({ classification }) =>
      classification === "current-valid-contract" ||
      classification === "current-valid-fixture",
  )
  const maxima = emptyMetrics()
  for (const observation of current) {
    for (const metric of Object.keys(maxima) as (keyof JsonMetrics)[]) {
      maxima[metric] = Math.max(maxima[metric], observation.metrics[metric])
    }
  }
  const probes = Object.fromEntries(
    (Object.keys(RUNTIME_ABI_V1_17_CALIBRATION_LIMITS) as LimitName[]).map(
      (limit) => {
        const value = RUNTIME_ABI_V1_17_CALIBRATION_LIMITS[limit]
        return [
          limit,
          [-1, 0, 1].map((offset) => ({
            offset,
            candidate: value + offset,
            result: typedProbe(limit, value + offset),
          })),
        ]
      },
    ),
  ) as Record<LimitName, Array<{ offset: number; candidate: number; result: ProbeResult }>>
  const depth3000 = probeJsonText(
    `${"[".repeat(3_000)}null${"]".repeat(3_000)}`,
  )
  return Object.freeze({
    schemaVersion: "runtime-abi-v1.17-calibration-v1" as const,
    generatedBy: "scripts/calibrate-v1-37-runtime-abi.ts" as const,
    generatedAt: "2026-07-13" as const,
    candidateOnly: true as const,
    activation: "not-active" as const,
    inputManifest: manifest,
    limits: Object.fromEntries(
      (Object.keys(RUNTIME_ABI_V1_17_CALIBRATION_LIMITS) as LimitName[]).map(
        (name) => [
          name,
          {
            value: RUNTIME_ABI_V1_17_CALIBRATION_LIMITS[name],
            unit: limitUnits[name],
            observedCurrentMaximum:
              name === "decodedStringUtf8Bytes"
                ? maxima.decodedStringUtf8Bytes
                : maxima[name as keyof JsonMetrics],
          },
        ],
      ),
    ),
    fieldCaps: RUNTIME_ABI_V1_17_FIELD_CAPS,
    observations,
    maximaSources: current.map(({ path: inputPath, classification, metrics }) => ({
      path: inputPath,
      classification,
      metrics,
    })),
    historicalControls: observations.filter(
      ({ classification }) => classification === "historical-valid-control",
    ),
    probes,
    hostileProbes: [
      {
        id: "depth-3000",
        classification: "hostile-negative-probe" as const,
        result: depth3000,
        expected: "MAX_DEPTH_EXCEEDED",
        processException: false,
      },
      ...Object.entries(probes).map(([limit, rows]) => ({
        id: `${limit}-n-plus-one`,
        classification: "hostile-negative-probe" as const,
        result: rows[2]!.result,
        expected: "typed-rejection",
        processException: false,
      })),
    ],
    privacy: {
      rawInputPayloadsCopied: false,
      privateRuntimeLogsRead: false,
      denylistWinsOverAllowlist: true,
    },
    notes: [
      "Only current-valid-contract and current-valid-fixture rows establish observed maxima.",
      "Historical controls are immutable compatibility stops; hostile probes are rejection evidence only.",
      "Observed local tool versions are deliberately excluded from counted executable identity pins.",
    ],
  })
}

export const renderCalibrationJson = (
  receipt: ReturnType<typeof evaluateCalibration>,
): string => `${JSON.stringify(receipt, null, 2)}\n`

export const renderCalibrationMarkdown = (
  receipt: ReturnType<typeof evaluateCalibration>,
): string => {
  const limitRows = Object.entries(receipt.limits)
    .map(
      ([name, limit]) =>
        `| ${name} | ${limit.value} | ${limit.unit} | ${limit.observedCurrentMaximum} |`,
    )
    .join("\n")
  const fieldRows = Object.entries(receipt.fieldCaps)
    .map(([name, cap]) => `| ${name} | ${cap.value} | ${cap.unit} |`)
    .join("\n")
  const inputRows = receipt.observations
    .map(
      (input) =>
        `| \`${input.path}\` | ${input.classification} | ${input.byteLength} | \`${input.sha256}\` |`,
    )
    .join("\n")
  return `# Runtime ABI v1.17 Calibration\n\n` +
    `**Status:** candidate-only; not active\n\n` +
    `**Input manifest:** \`${receipt.inputManifest.path}\`  \n` +
    `**Manifest SHA-256:** \`${receipt.inputManifest.sha256}\`\n\n` +
    `## Frozen parser ceilings\n\n` +
    `| Limit | Frozen value | Unit | Observed current maximum |\n|---|---:|---|---:|\n${limitRows}\n\n` +
    `## Lower field caps\n\n` +
    `| Field | Value | Unit |\n|---|---:|---|\n${fieldRows}\n\n` +
    `The byte domains are distinct: raw-utf8-bytes, canonical-payload-bytes, decoded-string-utf8-bytes, and transport-frame-bytes are never substituted for one another.\n\n` +
    `## Closed input inventory\n\n` +
    `| Path | Classification | Bytes | SHA-256 |\n|---|---|---:|---|\n${inputRows}\n\n` +
    `Only current-valid-contract and current-valid-fixture rows establish maxima. Historical-valid-control rows stop compatibility regressions; hostile-negative-probe rows establish typed rejection only. The literal denylist wins over every allowlist entry.\n\n` +
    `## Boundary evidence\n\n` +
    `Every parser ceiling has N-1, N, and N+1 observations. The depth-3000 hostile probe returns \`MAX_DEPTH_EXCEEDED\` at observed depth 65 without a process exception or \`RangeError\`.\n\n` +
    `## Budget and identity boundary\n\n` +
    `This receipt calibrates numerical ceilings only. Counted certification still requires the complete v1.17 budget/equivalent-meter and executable identity contract. Missing meters or identity pins remain uncertified; observed local tool versions are not deployment pins.\n`
}

export const writeCalibrationArtifacts = (root: string = repoRoot): void => {
  const receipt = evaluateCalibration(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  writeFileSync(path.join(root, CALIBRATION_JSON_PATH), renderCalibrationJson(receipt))
  writeFileSync(
    path.join(root, CALIBRATION_MARKDOWN_PATH),
    renderCalibrationMarkdown(receipt),
  )
}

export const checkCalibrationArtifacts = (root: string = repoRoot): string[] => {
  const receipt = evaluateCalibration(root)
  const expected = {
    [CALIBRATION_JSON_PATH]: renderCalibrationJson(receipt),
    [CALIBRATION_MARKDOWN_PATH]: renderCalibrationMarkdown(receipt),
  }
  return Object.entries(expected)
    .filter(
      ([relativePath, contents]) =>
        !existsSync(path.join(root, relativePath)) ||
        readFileSync(path.join(root, relativePath), "utf8") !== contents,
    )
    .map(([relativePath]) => `${relativePath} is stale`)
}

const optionalRegistry = async () => {
  const absolutePath = path.join(repoRoot, OPTIONAL_REGISTRY_PATH)
  if (!existsSync(absolutePath)) return undefined
  return import(pathToFileURL(absolutePath).href) as Promise<{
    renderRuntimeAbiV117ContractJson: () => string
    RUNTIME_ABI_V1_17: {
      calibration: { inputManifestSha256: string }
      canonicalJson: {
        ceilings: Record<string, number>
      }
      fieldCaps: Record<string, { value: number; unit: string }>
    }
  }>
}

const checkRegistryCalibrationParity = (
  registry: NonNullable<Awaited<ReturnType<typeof optionalRegistry>>>,
  receipt: ReturnType<typeof evaluateCalibration>,
): string[] => {
  const errors: string[] = []
  const expectedCeilings = RUNTIME_ABI_V1_17_CALIBRATION_LIMITS
  if (
    JSON.stringify(registry.RUNTIME_ABI_V1_17.canonicalJson.ceilings) !==
    JSON.stringify(expectedCeilings)
  ) {
    errors.push("RUNTIME_ABI_V1_17 canonical JSON ceilings differ from calibration")
  }
  if (
    JSON.stringify(registry.RUNTIME_ABI_V1_17.fieldCaps) !==
    JSON.stringify(RUNTIME_ABI_V1_17_FIELD_CAPS)
  ) {
    errors.push("RUNTIME_ABI_V1_17 field caps differ from calibration")
  }
  if (
    registry.RUNTIME_ABI_V1_17.calibration.inputManifestSha256 !==
    receipt.inputManifest.sha256
  ) {
    errors.push("RUNTIME_ABI_V1_17 input manifest hash differs from calibration")
  }
  return errors
}

const main = async (): Promise<void> => {
  const args = new Set(process.argv.slice(2))
  const registry = await optionalRegistry()
  const receipt = evaluateCalibration()
  const parityErrors = registry
    ? checkRegistryCalibrationParity(registry, receipt)
    : []
  if (parityErrors.length > 0) {
    console.error(parityErrors.join("\n"))
    process.exitCode = 1
    return
  }
  if (args.has("--write")) {
    writeCalibrationArtifacts()
    if (registry) {
      writeFileSync(
        path.join(repoRoot, OPTIONAL_CONTRACT_PATH),
        registry.renderRuntimeAbiV117ContractJson(),
      )
    }
  }
  if (args.has("--check")) {
    const errors = [...checkCalibrationArtifacts(), ...parityErrors]
    if (registry) {
      const expected = registry.renderRuntimeAbiV117ContractJson()
      if (
        !existsSync(path.join(repoRoot, OPTIONAL_CONTRACT_PATH)) ||
        readFileSync(path.join(repoRoot, OPTIONAL_CONTRACT_PATH), "utf8") !== expected
      ) {
        errors.push(`${OPTIONAL_CONTRACT_PATH} is stale`)
      }
    }
    if (errors.length > 0) {
      console.error(errors.join("\n"))
      process.exitCode = 1
      return
    }
    console.log("runtime ABI v1.17 calibration artifacts are current")
    return
  }
  if (!args.has("--write")) {
    console.log(renderCalibrationMarkdown(evaluateCalibration()))
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main()
}
