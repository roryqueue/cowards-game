import { createHash } from "node:crypto"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../../strategy-lab/src/contracts.js"

type RecordValue = Record<string, unknown>
const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-z0-9-]{0,95}$/u
const sourceBytes = new TextEncoder()
const issuedBundles = new WeakSet<object>()
const fail = (code = "BUNDLE"): never => { throw new TypeError(`MODEL_${code}`) }
const exact = (value: unknown, keys: readonly string[]): value is RecordValue => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const actual = Object.keys(value).sort(), expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
const requiredRecord = (value: unknown, keys: readonly string[], code = "BUNDLE"): RecordValue =>
  exact(value, keys) ? value : fail(code)
const requiredResponse = (value: RecordValue): Readonly<{ root: LabRoot; format: "explicit-typescript-source"; source: string }> => {
  if (root(value.root) && value.format === "explicit-typescript-source" && text(value.source, 65536)) {
    return { root: value.root, format: value.format, source: value.source }
  }
  return fail("RESPONSE")
}
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const name = (value: unknown): value is string => typeof value === "string" && NAME.test(value)
const text = (value: unknown, limit = 128): value is string => typeof value === "string" && value.length > 0 && value.length <= limit
const integer = (value: unknown, maximum: number): value is number => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= maximum
const rawSourceRoot = (source: string): LabRoot => `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}` as LabRoot

export interface FrozenModelProvider {
  readonly providerId: string; readonly modelId: string; readonly modelVersion: string
  readonly settingsRoot: LabRoot; readonly promptRoot: LabRoot; readonly contextRoot: LabRoot
}
export interface FrozenModelBundle {
  readonly schemaVersion: "frozen-model-bundle-v1"; readonly privacy: "private_offline"; readonly root: LabRoot
  readonly provider: FrozenModelProvider
  readonly request: Readonly<{ root: LabRoot; byteLength: number; encoding: "utf8" }>
  readonly response: Readonly<{ root: LabRoot; format: "explicit-typescript-source"; source: string }>
  readonly source: Readonly<{ root: LabRoot; sha256: LabRoot; byteLength: number; encoding: "utf8" }>
  readonly accounting: Readonly<{ inputTokens: number; outputTokens: number; tokenLimit: number; elapsedMilliseconds: number; resourceRoot: LabRoot }>
  readonly attempt: Readonly<{ attemptRoot: LabRoot; budgetRoot: LabRoot; ordinal: number }>
  readonly nativeLane: Readonly<{ language: "typescript"; providerId: string; runtimeAbi: "strategy-runtime-abi-v1.19"; runtimeProfileRoot: LabRoot; translation: "none" }>
  readonly lineage: Readonly<{ predecessorRoot: LabRoot; correctionRoot: LabRoot | null; retryParentRoot: LabRoot | null }>
}

const provider = (value: unknown): FrozenModelProvider => {
  if (!exact(value, ["providerId", "modelId", "modelVersion", "settingsRoot", "promptRoot", "contextRoot"]) || !name(value.providerId) || !text(value.modelId) || !text(value.modelVersion) || ![value.settingsRoot, value.promptRoot, value.contextRoot].every(root)) fail("PROVENANCE")
  return value as unknown as FrozenModelProvider
}

export const deriveFrozenModelResponseRoot = (value: { readonly format: "explicit-typescript-source"; readonly source: string }): LabRoot =>
  labRoot("frozen-model-response-v1", { format: value.format, source: value.source })
export const deriveFrozenModelBundleRoot = <T extends object>(value: T): LabRoot =>
  labRoot("frozen-model-bundle-v1", Object.fromEntries(Object.entries(value).filter(([key]) => key !== "root")))

const validateBundle = (value: unknown): FrozenModelBundle => {
  const keys = ["schemaVersion", "privacy", "root", "provider", "request", "response", "source", "accounting", "attempt", "nativeLane", "lineage"] as const
  const record = requiredRecord(value, keys)
  if (record.schemaVersion !== "frozen-model-bundle-v1" || record.privacy !== "private_offline" || !root(record.root)) fail()
  const identity = provider(record.provider)
  const request = requiredRecord(record.request, ["root", "byteLength", "encoding"], "REQUEST")
  if (!root(request.root) || !integer(request.byteLength, 262144) || request.byteLength < 1 || request.encoding !== "utf8") fail("REQUEST")
  const response = requiredRecord(record.response, ["root", "format", "source"], "RESPONSE")
  const responseData = requiredResponse(response)
  if (responseData.root !== deriveFrozenModelResponseRoot(responseData)) fail("RESPONSE")
  const source = requiredRecord(record.source, ["root", "sha256", "byteLength", "encoding"], "SOURCE")
  if (!root(source.root) || source.root !== source.sha256 || source.root !== rawSourceRoot(responseData.source) || source.byteLength !== sourceBytes.encode(responseData.source).byteLength || source.byteLength < 1 || source.byteLength > 65536 || source.encoding !== "utf8") fail("SOURCE")
  const accounting = requiredRecord(record.accounting, ["inputTokens", "outputTokens", "tokenLimit", "elapsedMilliseconds", "resourceRoot"], "ACCOUNTING")
  if (!integer(accounting.inputTokens, 10_000_000) || !integer(accounting.outputTokens, 10_000_000) || !integer(accounting.tokenLimit, 10_000_000) || accounting.tokenLimit < 1 || accounting.inputTokens + accounting.outputTokens > accounting.tokenLimit || !integer(accounting.elapsedMilliseconds, 3_600_000) || !root(accounting.resourceRoot)) fail("ACCOUNTING")
  const attempt = requiredRecord(record.attempt, ["attemptRoot", "budgetRoot", "ordinal"], "ATTEMPT")
  if (![attempt.attemptRoot, attempt.budgetRoot].every(root) || !integer(attempt.ordinal, 1_000_000)) fail("ATTEMPT")
  const nativeLane = requiredRecord(record.nativeLane, ["language", "providerId", "runtimeAbi", "runtimeProfileRoot", "translation"], "NATIVE_LANE")
  if (nativeLane.language !== "typescript" || nativeLane.providerId !== identity.providerId || nativeLane.runtimeAbi !== "strategy-runtime-abi-v1.19" || !root(nativeLane.runtimeProfileRoot) || nativeLane.translation !== "none") fail("NATIVE_LANE")
  const lineage = requiredRecord(record.lineage, ["predecessorRoot", "correctionRoot", "retryParentRoot"], "LINEAGE")
  if (!root(lineage.predecessorRoot) || ![lineage.correctionRoot, lineage.retryParentRoot].every((entry) => entry === null || root(entry))) fail("LINEAGE")
  if (record.root !== deriveFrozenModelBundleRoot(record)) fail("ROOT")
  return record as unknown as FrozenModelBundle
}

/** Canonically admits immutable external data; this has no provider, network, or execution dependency. */
export const admitFrozenModelBundle = (value: unknown): Readonly<FrozenModelBundle> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (admitted.ok) {
    if (admitted.canonicalByteLength > 262144) fail()
    const bundle = freezeLabValue(validateBundle(admitted.value))
    issuedBundles.add(bundle)
    return bundle
  }
  return fail()
}

/** Reject structural clones: packet conversion accepts only a runtime-admitted frozen bundle. */
export const requireFrozenModelBundle = (bundle: FrozenModelBundle): Readonly<FrozenModelBundle> => {
  if (!issuedBundles.has(bundle)) fail("UNADMITTED_BUNDLE")
  return bundle
}

export interface FrozenModelBlock {
  readonly schemaVersion: "frozen-model-block-v1"; readonly privacy: "private_offline"; readonly root: LabRoot
  readonly kind: "blocked"; readonly charged: true; readonly reason: "provider_unavailable" | "identity_drift" | "unsupported_native_lane"
  readonly attempt: Readonly<{ attemptRoot: LabRoot; budgetRoot: LabRoot; ordinal: number }>
  readonly expected: FrozenModelProvider; readonly observed: FrozenModelProvider | null
}

const block = (input: Omit<FrozenModelBlock, "schemaVersion" | "privacy" | "root" | "kind" | "charged">): Readonly<FrozenModelBlock> => {
  provider(input.expected)
  if (input.observed !== null) provider(input.observed)
  if (!exact(input.attempt, ["attemptRoot", "budgetRoot", "ordinal"]) || ![input.attempt.attemptRoot, input.attempt.budgetRoot].every(root) || !integer(input.attempt.ordinal, 1_000_000) || !["provider_unavailable", "identity_drift", "unsupported_native_lane"].includes(input.reason)) fail("BLOCK")
  const value = { schemaVersion: "frozen-model-block-v1" as const, privacy: "private_offline" as const, kind: "blocked" as const, charged: true as const, ...input }
  return freezeLabValue({ ...value, root: labRoot("frozen-model-block-v1", value) })
}

export const assessFrozenModelIdentity = (
  bundle: FrozenModelBundle | null,
  expected: FrozenModelProvider,
  unavailableAttempt?: Readonly<{ attemptRoot: LabRoot; budgetRoot: LabRoot; ordinal: number }>,
): Readonly<{ kind: "available"; bundle: Readonly<FrozenModelBundle> }> | Readonly<FrozenModelBlock> => {
  provider(expected)
  if (bundle === null) {
    const attempt = unavailableAttempt
    if (attempt) return block({ reason: "provider_unavailable", attempt, expected, observed: null })
    return fail("UNAVAILABLE_ATTEMPT")
  }
  const admitted = requireFrozenModelBundle(bundle)
  const same = Object.entries(expected).every(([key, value]) => admitted.provider[key as keyof FrozenModelProvider] === value)
  return same ? freezeLabValue({ kind: "available" as const, bundle: admitted }) : block({ reason: "identity_drift", attempt: admitted.attempt, expected, observed: admitted.provider })
}
