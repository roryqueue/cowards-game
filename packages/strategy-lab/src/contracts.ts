import { createHash } from "node:crypto"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"

export type LabRoot = `sha256:${string}`
export const freezeLabValue = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeLabValue(child)
    Object.freeze(value)
  }
  return value
}
export const labRoot = (domain: string, value: unknown): LabRoot => {
  const admitted = admitCanonicalJsonValue(["cowards:strategy-lab:v1", domain, value], { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("LAB_CANONICAL_VALUE")
  return `sha256:${createHash("sha256").update(admitted.canonicalBytes).digest("hex")}`
}
// Pins are references to verified Phase262 data, never consumed execution authority.
export const LAB_ADMITTED_ROOTS = freezeLabValue({
  studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17",
  measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95",
  tupleRoot: "sha256:d12749094548821bf69206250ff537108cc2f2ca5bb264dca1b9b836eb932f42",
  runtimeLimitsRoot: "sha256:41168c80ca59ce151383ddbc8379172149a50fc4d29aa01a6baed777ecc1b116",
  sourceClosureRoot: "sha256:1f721df7ed47464f8c3dd64c56571178511649f57e79a83b60cb13a5ae952dc6",
  custodyHistoryRoot: "sha256:3f823f1476dea9d0eb70df69666dc6ae5bd8cd5e49be67a3ee938c3f35b20651",
  currentStartRoot: "sha256:47134b3e56129bc2a35262add054528cc66db6717ea3650a0f611cfa9bffff31",
  image: "node:24-alpine@sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14",
  profile: { cpus: "2", memory: "256m", cellDeadlineMilliseconds: 120000, outerDeadlineMilliseconds: 3600000 },
  fixture: { id: "advanced:vanguard-pressure", sourceCommit: "8a9d81549c2923dfbc4ab5843c8e3ad76cb5594a", moduleBlob: "ab7c0520ea9c7a7b6c021ce16b8cf290fe9a71dc" },
} as const)
export const LAB_VERSIONS = freezeLabValue({ schema: "lab-v1", algorithm: "hierarchical-planner-v1", prng: "sha256-counter-v1", runtimeAbi: "strategy-runtime-abi-v1.19" } as const)

type RecordValue = Record<string, unknown>
export const exactLabKeys = (value: unknown, keys: readonly string[]): value is RecordValue => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const actual = Object.keys(value).sort()
  return actual.length === keys.length && actual.every((key, i) => key === [...keys].sort()[i])
}
const fail = (): never => { throw new TypeError("LAB_ENVELOPE_INVALID") }
const isRoot = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[0-9a-f]{64}$/u.test(v)
const integer = (v: unknown, max: number) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max
const same = (a: unknown, b: unknown) => labRoot("comparison", a) === labRoot("comparison", b)
const artifactId = (v: unknown) => typeof v === "string" && /^lab-[a-z0-9][a-z0-9-]{0,91}$/u.test(v)
const schema = <T>(validate: (value: unknown) => T) => Object.freeze({
  parse(value: unknown): Readonly<T> {
    // Canonical admission bounds depth, strings, arrays, nodes, and hostile objects before traversal.
    const canonical = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
    if (!canonical.ok || canonical.canonicalByteLength > 262144) return fail()
    return freezeLabValue(validate(canonical.value))
  },
  safeParse(value: unknown) {
    try { return { success: true as const, data: this.parse(value) } }
    catch { return { success: false as const, error: new TypeError("LAB_ENVELOPE_INVALID") } }
  },
})

export interface LabAllocationSlot { ordinal: number; taskRoot: LabRoot; attemptRoot: LabRoot; pass: "baseline" | "variant" }
export interface LabManifest {
  schemaVersion: "lab-manifest-v1"; privacy: "private_offline";
  admitted: typeof LAB_ADMITTED_ROOTS; versions: typeof LAB_VERSIONS;
  candidateSourceRoot: LabRoot; fixtureSourceRoot: LabRoot; corpusRoot: LabRoot; harnessRoot: LabRoot;
  protocolRoot: LabRoot; budgetRoot: LabRoot; machineRoot: LabRoot; validationInventoryRoot: LabRoot;
  artifactId: string; allocation: LabAllocationSlot[];
  tracePolicy: { retain: "all"; reviewGeometryCells: 8; reviewAllFailures: true };
}
const rootFields = ["candidateSourceRoot", "fixtureSourceRoot", "corpusRoot", "harnessRoot", "protocolRoot", "budgetRoot", "machineRoot", "validationInventoryRoot"] as const
export const LabManifestSchema = schema<LabManifest>((v) => {
  if (!exactLabKeys(v, ["schemaVersion", "privacy", "admitted", "versions", ...rootFields, "artifactId", "allocation", "tracePolicy"]) ||
      v.schemaVersion !== "lab-manifest-v1" || v.privacy !== "private_offline" ||
      !same(v.admitted, LAB_ADMITTED_ROOTS) || !same(v.versions, LAB_VERSIONS) ||
      !rootFields.every((key) => isRoot(v[key])) || !artifactId(v.artifactId) ||
      !same(v.tracePolicy, { retain: "all", reviewGeometryCells: 8, reviewAllFailures: true }) ||
      !Array.isArray(v.allocation) || v.allocation.length !== 24) return fail()
  const attempts = new Set<string>()
  const tasks = new Set<string>()
  for (const [i, slot] of v.allocation.entries()) {
    if (!exactLabKeys(slot, ["ordinal", "taskRoot", "attemptRoot", "pass"]) || slot.ordinal !== i ||
      !isRoot(slot.taskRoot) || !isRoot(slot.attemptRoot) || attempts.has(slot.attemptRoot) ||
      slot.pass !== (i < 12 ? "baseline" : "variant")) return fail()
    if (i < 12) { if (tasks.has(slot.taskRoot)) return fail(); tasks.add(slot.taskRoot) }
    else if (slot.taskRoot !== (v.allocation[i - 12] as RecordValue).taskRoot) return fail()
    attempts.add(slot.attemptRoot)
  }
  return v as unknown as LabManifest
})
/** The expected manifest must be frozen by the trusted coordinator before source measurement. */
export const admitLabManifest = (bytes: Uint8Array, expected: unknown): Readonly<LabManifest> => {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > 262144) return fail()
  const parsed = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail()
  const manifest = LabManifestSchema.parse(parsed.value)
  if (!same(manifest, LabManifestSchema.parse(expected))) return fail()
  return manifest
}

type AttemptBase = { schemaVersion: "lab-attempt-v1"; attemptRoot: LabRoot; taskRoot: LabRoot; ordinal: number; invocationCount: number }
export type LabAttempt = AttemptBase & (
  | { classification: "success" | "player_violation"; semanticRoot: LabRoot }
  | { classification: "system_failure"; reason: "supervisor_failure" | "timeout" | "cancelled" | "invalid_record" }
  | { classification: "unused"; reason: "not_started" | "budget_exhausted" | "stopped" }
)
export const LabAttemptSchema = schema<LabAttempt>((v) => {
  if (v === null || typeof v !== "object") return fail()
  const r = v as RecordValue
  const semantic = r.classification === "success" || r.classification === "player_violation"
  if (!exactLabKeys(r, ["schemaVersion", "attemptRoot", "taskRoot", "ordinal", "invocationCount", "classification", semantic ? "semanticRoot" : "reason"]) ||
    r.schemaVersion !== "lab-attempt-v1" || !isRoot(r.attemptRoot) || !isRoot(r.taskRoot) || !integer(r.ordinal, 23) || !integer(r.invocationCount, 24800)) return fail()
  if (semantic ? !isRoot(r.semanticRoot) : r.classification === "unused"
      ? r.invocationCount !== 0 || !["not_started", "budget_exhausted", "stopped"].includes(String(r.reason))
      : r.classification !== "system_failure" || !["supervisor_failure", "timeout", "cancelled", "invalid_record"].includes(String(r.reason))) return fail()
  return r as unknown as LabAttempt
})
export interface LabSemanticRecord { schemaVersion: "lab-semantic-record-v1"; taskRoot: LabRoot; classification: "success" | "player_violation"; outcome: "bottom" | "top" | "DRAW"; finalStateRoot: LabRoot; transitionRoot: LabRoot; runtimeAccountingRoot: LabRoot }
export const LabSemanticRecordSchema = schema<LabSemanticRecord>((v) => {
  if (!exactLabKeys(v, ["schemaVersion", "taskRoot", "classification", "outcome", "finalStateRoot", "transitionRoot", "runtimeAccountingRoot"]) ||
    v.schemaVersion !== "lab-semantic-record-v1" || !["success", "player_violation"].includes(String(v.classification)) ||
    !["bottom", "top", "DRAW"].includes(String(v.outcome)) || ![v.taskRoot, v.finalStateRoot, v.transitionRoot, v.runtimeAccountingRoot].every(isRoot)) return fail()
  return v as unknown as LabSemanticRecord
})
export interface LabOperationalRecord { schemaVersion: "lab-operational-record-v1"; attemptRoot: LabRoot; machineRoot: LabRoot; worker: number; shard: number; elapsedMs: number; cleanup: "complete" | "incomplete" }
export const LabOperationalRecordSchema = schema<LabOperationalRecord>((v) => {
  if (!exactLabKeys(v, ["schemaVersion", "attemptRoot", "machineRoot", "worker", "shard", "elapsedMs", "cleanup"]) ||
    v.schemaVersion !== "lab-operational-record-v1" || !isRoot(v.attemptRoot) || !isRoot(v.machineRoot) ||
    !integer(v.worker, 1) || !integer(v.shard, 23) || typeof v.elapsedMs !== "number" || !Number.isFinite(v.elapsedMs) || v.elapsedMs < 0 || v.elapsedMs > 3600000 ||
    !["complete", "incomplete"].includes(String(v.cleanup))) return fail()
  return v as unknown as LabOperationalRecord
})
