import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"

export const RUNTIME_ABI_ACTIVATION_ALLOWLIST_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-activation-allowlist.json"
export const RUNTIME_ABI_ACTIVATION_MANIFEST_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-activation-manifest.json"

type AllowlistOperation = Readonly<{
  path: string
  operation: "create" | "update"
}>

type Allowlist = Readonly<{
  schemaVersion: "runtime-abi-v1.17-activation-allowlist-v1"
  activationPlan: "258-14"
  operations: readonly AllowlistOperation[]
}>

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8")) as unknown

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const parseRuntimeAbiActivationAllowlist = (
  value: unknown,
): Allowlist => {
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

const fileSha256 = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex")

const immutableV116 = [
  "packages/spec/src/runtime-execution-service.ts",
  "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
  "apps/go-backend/runtime_service_client.go",
  "apps/go-backend/runtime_semantic_receipt.go",
  "packages/persistence/migrations/0017_runtime_semantic_receipts.sql",
] as const

export const checkRuntimeAbiManifestClosure = (options: {
  final: boolean
}): void => {
  const allowlist = parseRuntimeAbiActivationAllowlist(
    readJson(RUNTIME_ABI_ACTIVATION_ALLOWLIST_PATH),
  )
  for (const { path, operation } of allowlist.operations) {
    if (operation === "update" && !existsSync(path)) {
      throw new TypeError(`Allowlisted update path is missing: ${path}`)
    }
  }
  for (const path of immutableV116) {
    if (!existsSync(path) || fileSha256(path).length !== 64) {
      throw new TypeError(`Immutable v1.16 path is unavailable: ${path}`)
    }
  }
  if (!options.final && existsSync(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH)) {
    throw new TypeError("Final activation manifest exists before activation.")
  }
  if (options.final && !existsSync(RUNTIME_ABI_ACTIVATION_MANIFEST_PATH)) {
    throw new TypeError("Final activation manifest is unavailable.")
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
  checkRuntimeAbiManifestClosure({ final: false })
  console.log("runtime-abi-v1.17 manifest closure: PASS")
}
