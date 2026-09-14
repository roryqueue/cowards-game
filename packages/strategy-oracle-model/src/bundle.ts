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
export interface FrozenModelProviderV2 {
  readonly providerId: string; readonly modelId: string; readonly modelVersion: null
  readonly settingsRoot: LabRoot; readonly promptRoot: LabRoot; readonly contextRoot: LabRoot
  readonly servingSnapshot: Readonly<{ availability: "unavailable" }>
}
export interface FrozenModelRequestRecord {
  readonly root: LabRoot; readonly byteLength: number; readonly encoding: "utf8"; readonly bodyUtf8: string
}
export interface FrozenModelRawResponseRecord {
  readonly root: LabRoot; readonly format: "codex-exec-json"; readonly bodyUtf8: string
}
export interface FrozenModelBundleV1 {
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
export interface FrozenModelBundleV2 extends Omit<FrozenModelBundleV1, "schemaVersion" | "provider"> {
  readonly schemaVersion: "frozen-model-bundle-v2"
  readonly provider: FrozenModelProviderV2
  /** The provider did not disclose a serving build; client metadata is never substituted for it. */
  readonly provenance: Readonly<{
    requestedModelId: string; reportedModelId: string
    client: Readonly<{ version: string; settingsRoot: LabRoot }>
    servingSnapshot: Readonly<{ availability: "unavailable" }>
    requestRecordRoot: LabRoot; responseRecordRoot: LabRoot
    requestRecord: FrozenModelRequestRecord; rawResponseRecord: FrozenModelRawResponseRecord
    actualUsage: Readonly<{ inputTokens: number; outputTokens: number; cachedInputTokens: number; totalTokens: number }>
  }>
}
export type FrozenModelBundle = FrozenModelBundleV1 | FrozenModelBundleV2

const provider = (value: unknown): FrozenModelProvider => {
  if (!exact(value, ["providerId", "modelId", "modelVersion", "settingsRoot", "promptRoot", "contextRoot"]) || !name(value.providerId) || !text(value.modelId) || !text(value.modelVersion) || ![value.settingsRoot, value.promptRoot, value.contextRoot].every(root)) fail("PROVENANCE")
  return value as unknown as FrozenModelProvider
}
const providerV2 = (value: unknown): FrozenModelProviderV2 => {
  if (!exact(value, ["providerId", "modelId", "modelVersion", "settingsRoot", "promptRoot", "contextRoot", "servingSnapshot"]) || !name(value.providerId) || !text(value.modelId) || value.modelVersion !== null || ![value.settingsRoot, value.promptRoot, value.contextRoot].every(root) || !exact(value.servingSnapshot, ["availability"]) || (value.servingSnapshot as RecordValue).availability !== "unavailable") fail("PROVENANCE")
  return value as unknown as FrozenModelProviderV2
}

export const deriveFrozenModelResponseRoot = (value: { readonly format: "explicit-typescript-source"; readonly source: string }): LabRoot =>
  labRoot("frozen-model-response-v1", { format: value.format, source: value.source })
export const deriveFrozenModelRequestRecordRoot = (value: Omit<FrozenModelRequestRecord, "root">): LabRoot =>
  labRoot("frozen-model-request-record-v2", value)
export const deriveFrozenModelRawResponseRecordRoot = (value: Omit<FrozenModelRawResponseRecord, "root">): LabRoot =>
  labRoot("frozen-model-raw-response-record-v2", value)
export const deriveFrozenModelBundleRoot = <T extends object>(value: T): LabRoot =>
  labRoot("frozen-model-bundle-v1", Object.fromEntries(Object.entries(value).filter(([key]) => key !== "root")))

const validateBundle = (value: unknown): FrozenModelBundle => {
  const isV2 = value !== null && typeof value === "object" && !Array.isArray(value) && (value as RecordValue).schemaVersion === "frozen-model-bundle-v2"
  const keys = ["schemaVersion", "privacy", "root", "provider", "request", "response", "source", "accounting", "attempt", "nativeLane", "lineage"] as const
  const record = requiredRecord(value, isV2 ? [...keys, "provenance"] : keys)
  if ((record.schemaVersion !== "frozen-model-bundle-v1" && record.schemaVersion !== "frozen-model-bundle-v2") || record.privacy !== "private_offline" || !root(record.root)) fail()
  const identity = record.schemaVersion === "frozen-model-bundle-v2" ? providerV2(record.provider) : provider(record.provider)
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
  if (record.schemaVersion === "frozen-model-bundle-v2") {
    const provenance = requiredRecord(record.provenance, ["requestedModelId", "reportedModelId", "client", "servingSnapshot", "requestRecordRoot", "responseRecordRoot", "requestRecord", "rawResponseRecord", "actualUsage"], "PROVENANCE")
    const client = requiredRecord(provenance.client, ["version", "settingsRoot"], "PROVENANCE")
    const snapshot = requiredRecord(provenance.servingSnapshot, ["availability"], "PROVENANCE")
    const requestRecord = requiredRecord(provenance.requestRecord, ["root", "byteLength", "encoding", "bodyUtf8"], "PROVENANCE")
    const rawResponseRecord = requiredRecord(provenance.rawResponseRecord, ["root", "format", "bodyUtf8"], "PROVENANCE")
    const usage = requiredRecord(provenance.actualUsage, ["inputTokens", "outputTokens", "cachedInputTokens", "totalTokens"], "PROVENANCE")
    if (!text(provenance.requestedModelId) || !text(provenance.reportedModelId) || !text(client.version) || !root(client.settingsRoot) || snapshot.availability !== "unavailable" ||
        !root(provenance.requestRecordRoot) || !root(provenance.responseRecordRoot) ||
        !root(requestRecord.root) || !integer(requestRecord.byteLength, 262144) || requestRecord.byteLength < 1 || requestRecord.encoding !== "utf8" || !text(requestRecord.bodyUtf8, 262144) ||
        requestRecord.root !== deriveFrozenModelRequestRecordRoot({ byteLength: requestRecord.byteLength, encoding: requestRecord.encoding, bodyUtf8: requestRecord.bodyUtf8 }) || requestRecord.byteLength !== sourceBytes.encode(requestRecord.bodyUtf8).byteLength || provenance.requestRecordRoot !== requestRecord.root ||
        request.root !== requestRecord.root || request.byteLength !== requestRecord.byteLength || request.encoding !== requestRecord.encoding ||
        !root(rawResponseRecord.root) || rawResponseRecord.format !== "codex-exec-json" || !text(rawResponseRecord.bodyUtf8, 262144) || rawResponseRecord.root !== deriveFrozenModelRawResponseRecordRoot({ format: rawResponseRecord.format, bodyUtf8: rawResponseRecord.bodyUtf8 }) || provenance.responseRecordRoot !== rawResponseRecord.root ||
        !integer(usage.inputTokens, 10_000_000) || !integer(usage.outputTokens, 10_000_000) || !integer(usage.cachedInputTokens, 10_000_000) || !integer(usage.totalTokens, 10_000_000) || usage.cachedInputTokens > usage.inputTokens || usage.totalTokens !== usage.inputTokens + usage.outputTokens ||
        usage.inputTokens !== accounting.inputTokens || usage.outputTokens !== accounting.outputTokens || client.settingsRoot !== identity.settingsRoot || identity.modelId !== provenance.reportedModelId ||
        (identity as FrozenModelProviderV2).servingSnapshot.availability !== "unavailable") fail("PROVENANCE")
  }
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
  readonly expected: FrozenModelProvider | FrozenModelProviderV2; readonly observed: FrozenModelProvider | FrozenModelProviderV2 | null
}

const block = (input: Omit<FrozenModelBlock, "schemaVersion" | "privacy" | "root" | "kind" | "charged">): Readonly<FrozenModelBlock> => {
  if (((input.expected as unknown) as RecordValue).modelVersion === null) providerV2(input.expected)
  else provider(input.expected)
  if (input.observed !== null && (((input.observed as unknown) as RecordValue).modelVersion === null)) providerV2(input.observed)
  else if (input.observed !== null) provider(input.observed)
  if (!exact(input.attempt, ["attemptRoot", "budgetRoot", "ordinal"]) || ![input.attempt.attemptRoot, input.attempt.budgetRoot].every(root) || !integer(input.attempt.ordinal, 1_000_000) || !["provider_unavailable", "identity_drift", "unsupported_native_lane"].includes(input.reason)) fail("BLOCK")
  const value = { schemaVersion: "frozen-model-block-v1" as const, privacy: "private_offline" as const, kind: "blocked" as const, charged: true as const, ...input }
  return freezeLabValue({ ...value, root: labRoot("frozen-model-block-v1", value) })
}

export const assessFrozenModelIdentity = (
  bundle: FrozenModelBundle | null,
  expected: FrozenModelProvider | FrozenModelProviderV2,
  unavailableAttempt?: Readonly<{ attemptRoot: LabRoot; budgetRoot: LabRoot; ordinal: number }>,
): Readonly<{ kind: "available"; bundle: Readonly<FrozenModelBundle> }> | Readonly<FrozenModelBlock> => {
  if (((expected as unknown) as RecordValue).modelVersion === null) providerV2(expected)
  else provider(expected)
  if (bundle === null) {
    const attempt = unavailableAttempt
    if (attempt) return block({ reason: "provider_unavailable", attempt, expected, observed: null })
    return fail("UNAVAILABLE_ATTEMPT")
  }
  const admitted = requireFrozenModelBundle(bundle)
  const same = Object.entries(expected).every(([key, value]) => admitted.provider[key as keyof FrozenModelProvider] === value)
  return same ? freezeLabValue({ kind: "available" as const, bundle: admitted }) : block({ reason: "identity_drift", attempt: admitted.attempt, expected, observed: admitted.provider })
}
