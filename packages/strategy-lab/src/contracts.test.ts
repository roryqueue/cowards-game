import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { encodeCanonicalJson } from "@cowards/spec"
import {
  LAB_ADMITTED_ROOTS, LabManifestSchema, LabAttemptSchema, LabSemanticRecordSchema,
  LabOperationalRecordSchema, admitLabManifest, labRoot, LAB_VERSIONS,
} from "./contracts.js"

const hash = `sha256:${"a".repeat(64)}`
const bytes = (v: unknown) => {
  const e = encodeCanonicalJson(v as never, { context: "canonical-manifest" })
  if (!e.ok) throw new Error("fixture encoding")
  return e.bytes
}
export const manifestFixture = () => ({
  schemaVersion: "lab-manifest-v1", privacy: "private_offline", admitted: LAB_ADMITTED_ROOTS,
  versions: LAB_VERSIONS,
  candidateSourceRoot: hash, fixtureSourceRoot: hash, corpusRoot: hash, harnessRoot: hash,
  protocolRoot: hash, budgetRoot: hash, machineRoot: hash, validationInventoryRoot: hash,
  artifactId: "lab-263-test", allocation: Array.from({ length: 24 }, (_, ordinal) => ({
    ordinal, taskRoot: labRoot("fixture-task", [ordinal % 12]),
    attemptRoot: labRoot("fixture-attempt", [ordinal]), pass: ordinal < 12 ? "baseline" : "variant",
  })), tracePolicy: { retain: "all", reviewGeometryCells: 8, reviewAllFailures: true },
})

describe("private lab contracts", () => {
  it("round trips canonical bounded manifests and binds every execution identity", () => {
    const m = manifestFixture()
    const expected = LabManifestSchema.parse(m)
    expect(admitLabManifest(bytes(m), expected)).toEqual(expected)
    for (const key of ["candidateSourceRoot", "fixtureSourceRoot", "corpusRoot", "machineRoot", "budgetRoot"] as const) {
      expect(() => admitLabManifest(bytes({ ...m, [key]: `sha256:${"b".repeat(64)}` }), expected)).toThrow()
    }
    expect(Object.isFrozen(expected.allocation[0])).toBe(true)
  })
  it("pins actual study, measurement, tuple and runtime limits without consumed-marker authority", () => {
    for (const [file, key] of [["v1.38-pre-search-study-policy.json", "studyPolicyRoot"], ["v1.38-pre-search-measurement-policy.json", "measurementPolicyRoot"]] as const) {
      const policy = JSON.parse(readFileSync(new URL(`../../../.planning/artifacts/${file}`, import.meta.url), "utf8"))
      expect(LAB_ADMITTED_ROOTS[key]).toBe(policy.policyRoot)
    }
    expect(() => LabManifestSchema.parse({ ...manifestFixture(), admitted: { ...LAB_ADMITTED_ROOTS, tupleRoot: hash } })).toThrow()
  })
  it("rejects unknown keys, raw caps, noncanonical bytes, malformed enums and unsafe artifact IDs", () => {
    const m = manifestFixture()
    expect(() => admitLabManifest(new Uint8Array(262145), m)).toThrow()
    expect(() => admitLabManifest(new TextEncoder().encode(JSON.stringify(m)), m)).toThrow()
    expect(() => LabManifestSchema.parse({ ...m, secret: "raw" })).toThrow()
    for (const artifactId of ["/tmp/lab", "../lab", "lab/../x", "C:\\lab", "lab%2fsecret", "a".repeat(97)]) {
      expect(() => LabManifestSchema.parse({ ...m, artifactId })).toThrow()
    }
    expect(() => LabManifestSchema.parse({ ...m, privacy: "public" })).toThrow()
    expect(() => LabManifestSchema.parse({ ...m, allocation: [...m.allocation, m.allocation[0]] })).toThrow()
  })
  it("separates attempt classifications and disallows semantic roots on system failures or unused slots", () => {
    const base = { schemaVersion: "lab-attempt-v1", attemptRoot: hash, taskRoot: hash, ordinal: 0, invocationCount: 0 }
    for (const classification of ["success", "player_violation", "system_failure", "unused"] as const) {
      const extra = classification === "success" || classification === "player_violation" ? { semanticRoot: hash } : { reason: classification === "unused" ? "not_started" : "supervisor_failure" }
      expect(LabAttemptSchema.safeParse({ ...base, classification, ...extra }).success).toBe(true)
    }
    expect(LabAttemptSchema.safeParse({ ...base, classification: "system_failure", reason: "supervisor_failure", semanticRoot: hash }).success).toBe(false)
    expect(LabAttemptSchema.safeParse({ ...base, classification: "unused", reason: "not_started", invocationCount: 1 }).success).toBe(false)
  })
  it("strictly separates semantic and operational records, with recomputed roots", () => {
    const semantic = { schemaVersion: "lab-semantic-record-v1", taskRoot: hash, classification: "success", outcome: "DRAW", finalStateRoot: hash, transitionRoot: hash, runtimeAccountingRoot: hash }
    expect(LabSemanticRecordSchema.safeParse(semantic).success).toBe(true)
    expect(LabSemanticRecordSchema.safeParse({ ...semantic, elapsedMs: 1 }).success).toBe(false)
    const operational = { schemaVersion: "lab-operational-record-v1", attemptRoot: hash, machineRoot: hash, worker: 0, shard: 0, elapsedMs: 0, cleanup: "complete" }
    expect(LabOperationalRecordSchema.safeParse(operational).success).toBe(true)
    expect(LabOperationalRecordSchema.safeParse({ ...operational, source: "secret" }).success).toBe(false)
    expect(labRoot("semantic", semantic)).not.toBe(labRoot("operational", semantic))
  })
})
