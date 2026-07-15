import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

export const RUNTIME_ABI_ACTIVATION_ALLOWLIST_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-activation-allowlist.json"
export const RUNTIME_ABI_ACTIVATION_MANIFEST_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-activation-manifest.json"

export type AllowlistOperation = Readonly<{
  path: string
  operation: "create" | "update"
}>

export type RuntimeAbiActivationAllowlist = Readonly<{
  schemaVersion: "runtime-abi-v1.17-activation-allowlist-v1"
  activationPlan: "258-14"
  operations: readonly AllowlistOperation[]
}>

export type RuntimeAbiActivationDiffMode = "none" | "staged" | "committed"

export const RUNTIME_ABI_PREPARED_LIFECYCLE_CONSUMERS = Object.freeze([
  "scripts/check-boundary-monitors.ts",
  "scripts/generate-v1-37-event-coverage.ts",
] as const)

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8")) as unknown

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const parseRuntimeAbiActivationAllowlist = (
  value: unknown,
): RuntimeAbiActivationAllowlist => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== "runtime-abi-v1.17-activation-allowlist-v1" ||
    value.activationPlan !== "258-14" ||
    !Array.isArray(value.operations) ||
    value.operations.length === 0
  ) {
    throw new TypeError("Runtime ABI activation allowlist is malformed.")
  }
  const operations = value.operations.map((entry) => {
    if (
      !isRecord(entry) ||
      Object.keys(entry).sort().join(",") !== "operation,path" ||
      typeof entry.path !== "string" ||
      entry.path.startsWith("/") ||
      entry.path.includes("..") ||
      (entry.operation !== "create" && entry.operation !== "update")
    ) {
      throw new TypeError("Runtime ABI activation operation is malformed.")
    }
    return {
      path: entry.path,
      operation: entry.operation as AllowlistOperation["operation"],
    }
  })
  if (new Set(operations.map(({ path }) => path)).size !== operations.length) {
    throw new TypeError("Runtime ABI activation allowlist has duplicate paths.")
  }
  if (/sha256|hash/iu.test(JSON.stringify(value))) {
    throw new TypeError("Preactivation allowlist contains final-byte claims.")
  }
  return {
    schemaVersion: value.schemaVersion,
    activationPlan: value.activationPlan,
    operations,
  }
}

const parseActivationNameStatus = (
  nameStatus: string,
): ReadonlyMap<string, "A" | "M"> => {
  const entries = new Map<string, "A" | "M">()
  for (const line of nameStatus.split(/\r?\n/u).filter((entry) => entry !== "")) {
    const fields = line.split("\t")
    if (
      fields.length !== 2 ||
      (fields[0] !== "A" && fields[0] !== "M") ||
      fields[1] === undefined ||
      fields[1].length === 0 ||
      entries.has(fields[1])
    ) {
      throw new TypeError(`Activation diff contains a forbidden name-status entry: ${line}`)
    }
    entries.set(fields[1], fields[0])
  }
  return entries
}

export const verifyRuntimeAbiActivationNameStatus = (
  allowlist: RuntimeAbiActivationAllowlist,
  nameStatus: string,
): void => {
  const actual = parseActivationNameStatus(nameStatus)
  if (actual.size !== allowlist.operations.length) {
    throw new TypeError(
      `Activation diff is not exact: expected ${String(allowlist.operations.length)} paths, received ${String(actual.size)}.`,
    )
  }
  for (const { path, operation } of allowlist.operations) {
    const expected = operation === "create" ? "A" : "M"
    const received = actual.get(path)
    if (received !== expected) {
      throw new TypeError(
        `Activation diff operation mismatch: ${path} expected=${expected} received=${received ?? "missing"}.`,
      )
    }
  }
  const allowed = new Set(allowlist.operations.map(({ path }) => path))
  for (const path of actual.keys()) {
    if (!allowed.has(path)) {
      throw new TypeError(`Activation diff contains an unallowlisted path: ${path}`)
    }
  }
}

export const runtimeAbiActivationDiffArguments = (options: {
  mode: Exclude<RuntimeAbiActivationDiffMode, "none">
  activationCommit?: string | undefined
}): readonly string[] =>
  options.mode === "staged"
    ? ["diff", "--cached", "--name-status", "--no-renames"]
    : (() => {
        if (!/^[0-9a-f]{40}$/u.test(options.activationCommit ?? "")) {
          throw new TypeError(
            "Committed activation closure requires an explicit 40-character activation commit.",
          )
        }
        return [
          "diff",
          "--name-status",
          "--no-renames",
          `${options.activationCommit!}^`,
          options.activationCommit!,
        ]
      })()

const readRuntimeAbiActivationNameStatus = (options: {
  mode: Exclude<RuntimeAbiActivationDiffMode, "none">
  activationCommit?: string | undefined
}): string => {
  const args = runtimeAbiActivationDiffArguments(options)
  const result = spawnSync("git", args, { encoding: "utf8" })
  if (result.status !== 0) {
    throw new TypeError(
      `Activation diff is unavailable: ${String(result.stderr ?? "").trim()}`,
    )
  }
  return result.stdout
}

export const verifyRuntimeAbiActivationDiff = (
  allowlist: RuntimeAbiActivationAllowlist,
  options: {
    mode: Exclude<RuntimeAbiActivationDiffMode, "none">
    activationCommit?: string | undefined
  },
): void => {
  verifyRuntimeAbiActivationNameStatus(
    allowlist,
    readRuntimeAbiActivationNameStatus(options),
  )
}

const verifyPreparedLifecycleConsumers = (
  allowlist: RuntimeAbiActivationAllowlist,
): void => {
  for (const path of RUNTIME_ABI_PREPARED_LIFECYCLE_CONSUMERS) {
    if (!existsSync(path)) {
      throw new TypeError(`Prepared lifecycle consumer is missing: ${path}`)
    }
  }
  const boundarySource = readFileSync(
    "scripts/check-boundary-monitors.ts",
    "utf8",
  )
  if (
    !boundarySource.includes("CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD") ||
    /STRATEGY_RUNTIME_ABI_VERSION\s*!==\s*["']strategy-runtime-abi-v1\.14["']/u.test(
      boundarySource,
    )
  ) {
    throw new TypeError(
      "Boundary monitor is not bound to the spec-owned current lifecycle alias.",
    )
  }
  const eventArtifact =
    "packages/spec/artifacts/v1.37-current-event-coverage.json"
  const operation = allowlist.operations.find(({ path }) => path === eventArtifact)
  if (operation?.operation !== "update") {
    throw new TypeError(
      "Current-event evidence is missing from the exact activation allowlist.",
    )
  }
}

export const IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS = Object.freeze({
  "packages/spec/src/runtime-execution-service.ts":
    "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
  "packages/spec/artifacts/runtime-execution-service-request.v1.16.json":
    "5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5",
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
    "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
  "apps/go-backend/runtime_service_client.go":
    "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
  "apps/go-backend/runtime_semantic_receipt.go":
    "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
  "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
    "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
} as const)

export const verifyImmutableRuntimeServiceV116Digests = (
  readBytes: (path: string) => Uint8Array = (path) => readFileSync(path),
): void => {
  for (const [path, expected] of Object.entries(
    IMMUTABLE_RUNTIME_SERVICE_V116_DIGESTS,
  )) {
    let bytes: Uint8Array
    try {
      bytes = readBytes(path)
    } catch {
      throw new TypeError(`Immutable v1.16 path is unavailable: ${path}`)
    }
    const actual = createHash("sha256").update(bytes).digest("hex")
    if (actual !== expected) {
      throw new TypeError(
        `Immutable v1.16 digest changed: ${path} expected=${expected} actual=${actual}`,
      )
    }
  }
}

export const checkRuntimeAbiManifestClosure = (options: {
  final: boolean
  diffMode?: RuntimeAbiActivationDiffMode | undefined
  activationCommit?: string | undefined
}): void => {
  const allowlist = parseRuntimeAbiActivationAllowlist(
    readJson(RUNTIME_ABI_ACTIVATION_ALLOWLIST_PATH),
  )
  for (const { path, operation } of allowlist.operations) {
    if (operation === "update" && !existsSync(path)) {
      throw new TypeError(`Allowlisted update path is missing: ${path}`)
    }
  }
  verifyPreparedLifecycleConsumers(allowlist)
  verifyImmutableRuntimeServiceV116Digests()
  if (!options.final && existsSync(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH)) {
    throw new TypeError("Final activation manifest exists before activation.")
  }
  if (options.final && !existsSync(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH)) {
    throw new TypeError("Final activation manifest is unavailable.")
  }
  const diffMode = options.final ? "committed" : (options.diffMode ?? "none")
  if (diffMode !== "none") {
    verifyRuntimeAbiActivationDiff(allowlist, {
      mode: diffMode,
      activationCommit: options.activationCommit,
    })
  }
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href

if (isMain) {
  const writeFinal = process.argv.includes("--write-final")
  if (writeFinal) {
    throw new TypeError(
      "Final manifest generation is available only after the activation commit.",
    )
  }
  const staged = process.argv.includes("--check-staged-activation")
  const committed = process.argv.includes("--check-committed-activation")
  if (staged && committed) {
    throw new TypeError("Activation closure accepts exactly one diff mode.")
  }
  const activationCommitArgument = process.argv.find((argument) =>
    argument.startsWith("--activation-commit="),
  )
  const activationCommit = activationCommitArgument?.slice(
    "--activation-commit=".length,
  )
  checkRuntimeAbiManifestClosure({
    final: false,
    diffMode: staged ? "staged" : committed ? "committed" : "none",
    activationCommit,
  })
  console.log("runtime-abi-v1.17 manifest closure: PASS")
}
