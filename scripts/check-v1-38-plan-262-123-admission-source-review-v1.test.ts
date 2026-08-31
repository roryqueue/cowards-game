import { randomBytes } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_123_PATHS,
  buildV138Plan262123Review,
  inspectV138Plan26294AggregateProjection,
  reviewV138Plan26294PureGates,
  validateV138Plan262123ReviewCarrier,
} from "./check-v1-38-plan-262-123-admission-source-review-v1.js"

const subject = {
  sourceCommit: "a".repeat(40),
  sourceTree: "b".repeat(40),
  sourceFiles: [
    { path: V138_PLAN_262_123_PATHS.plan94Source, mode: "100644" as const, blob: "c".repeat(40), sha256: `sha256:${"d".repeat(64)}` as const },
    { path: V138_PLAN_262_123_PATHS.plan94Test, mode: "100644" as const, blob: "e".repeat(40), sha256: `sha256:${"f".repeat(64)}` as const },
  ],
  aggregateManifestSha256: `sha256:${"1".repeat(64)}` as const,
}

describe("Plan 262-123 exact carrier", () => {
  it("creates only the frozen literal-zero non-authorizing carrier", () => {
    const carrier = buildV138Plan262123Review(subject, [])
    expect(validateV138Plan262123ReviewCarrier(carrier)).toEqual(carrier)
    expect(carrier.findingCount).toBe(0)
    expect(carrier.plan124Eligible).toBe(true)
    expect(carrier.authorizesExecution).toBe(false)
    expect(Object.keys(carrier).sort()).toEqual([
      "aggregateManifestSha256", "authorizesExecution", "findingCount", "plan124Eligible", "reviewRoot",
      "schemaVersion", "sourceCommit", "sourceFiles", "sourceTree",
    ].sort())
  })

  it("does not mint a clean carrier when any independent finding exists", () => {
    expect(() => buildV138Plan262123Review(subject, ["SOURCE_DRIFT"])).toThrow(/REVIEW_HAS_FINDINGS/)
  })

  it("rejects false, stale, extended, or authority-bearing carriers", () => {
    const carrier = buildV138Plan262123Review(subject, []) as any
    for (const patch of [
      { findingCount: 1 }, { plan124Eligible: false }, { authorizesExecution: true },
      { sourceCommit: "9".repeat(40) }, { aggregateManifestSha256: `sha256:${"2".repeat(64)}` }, { extra: false },
    ]) expect(() => validateV138Plan262123ReviewCarrier({ ...carrier, ...patch })).toThrow(/REVIEW_INVALID/)
  })
})

describe("Plan 262-123 aggregate privacy review", () => {
  const aggregate = {
    schemaVersion: "v1.38-plan-262-historical-live-receipt-manifest-v4",
    assuranceClass: "single_operator_local_seal_v1",
    assuranceLimitation: "single_operator_local_seal_v1_no_hostile_same_uid",
    independentCustodyClaimed: false,
    generationsFungible: false,
    priorChargesReusable: false,
    counts: {
      generations: { v1: 15, v2: 15, v3: 0, v4: 15 }, routeStartsCharged: 9,
      preflightObservationsCharged: 9, calibrationIdentitiesCharged: 72,
      reproductionIdentitiesCharged: 0, freshAccepted: 0, requiredAccepted: 540,
    },
    commitments: Object.fromEntries(["historicalRoot", "privateCustodyRoot", "journalRoot", "terminalRoot", "reproductionStateRoot", "protectedHistoryRoot"]
      .map((key, index) => [key, `sha256:${String(index + 1).repeat(64)}`.slice(0, 71)])),
    authority: Object.fromEntries(["foundationActivationAuthorized", "phase263PlanningAuthorized", "phase263ExecutionAuthorized",
      "candidateSearchAuthorized", "formationMaterializationAuthorized", "holdoutOpeningAuthorized", "publicAuthorized",
      "productAuthorized", "productionAuthorized", "countedPlayAuthorized", "gameplayChangeAuthorized", "archiveAuthorized", "tagAuthorized"]
      .map(key => [key, false])),
    aggregateRoot: `sha256:${"a".repeat(64)}`,
  }

  it("accepts exactly aggregate roots/counts and the exhausted zero-of-540 projection", () => {
    expect(inspectV138Plan26294AggregateProjection(aggregate)).toMatchObject({
      freshAccepted: 0, requiredAccepted: 540, receiptUnits: 15, authorityDenied: true,
    })
  })

  it("rejects receipt identifiers, paths, payloads, hashes, lengths, order handles, and key bytes", () => {
    for (const injected of [
      { receiptIds: ["id"] }, { receiptPath: "private/receipt" }, { payload: "private" },
      { perReceiptHashes: [`sha256:${"a".repeat(64)}`] }, { byteLengths: [1] }, { ordinalMap: { 0: 1 } },
      { blindingKey: randomBytes(32).toString("hex") },
    ]) expect(() => inspectV138Plan26294AggregateProjection({ ...aggregate, ...injected })).toThrow(/AGGREGATE_INVALID/)
  })

  it("rejects changed roots, counts, authority, and assurance claims", () => {
    expect(() => inspectV138Plan26294AggregateProjection({ ...aggregate, counts: { ...aggregate.counts, freshAccepted: 1 } })).toThrow()
    expect(() => inspectV138Plan26294AggregateProjection({ ...aggregate, authority: { ...aggregate.authority, publicAuthorized: true } })).toThrow()
    expect(() => inspectV138Plan26294AggregateProjection({ ...aggregate, assuranceLimitation: "independent_custody" })).toThrow()
  })
})

describe("Plan 262-123 independent publisher-gate review", () => {
  it("proves missing, false, stale, and mismatched review fail before effects", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-plan123-tripwire-"))
    const marker = path.join(root, "effect-ran")
    reviewV138Plan26294PureGates(subject, marker)
    expect(existsSync(marker)).toBe(false)
  })

  it("proves exact exhausted and later-assurance branches retain the frozen write rules", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-plan123-tripwire-"))
    const marker = path.join(root, "effect-ran")
    const result = reviewV138Plan26294PureGates(subject, marker)
    expect(result.exhaustedWrites).toEqual([V138_PLAN_262_123_PATHS.disposition])
    expect(result.laterAssuranceWrites).toEqual([V138_PLAN_262_123_PATHS.disposition, V138_PLAN_262_123_PATHS.correction])
    expect(result.cleanPassWrites).toEqual([V138_PLAN_262_123_PATHS.disposition, V138_PLAN_262_123_PATHS.route12])
    expect(result.laterAssuranceReproductionPreserved).toBe(true)
    expect(result.nonPassRoute12Absent).toBe(true)
    expect(existsSync(marker)).toBe(false)
    writeFileSync(path.join(root, "test-only"), "closed\n")
    expect(readFileSync(path.join(root, "test-only"), "utf8")).toBe("closed\n")
  })
})
