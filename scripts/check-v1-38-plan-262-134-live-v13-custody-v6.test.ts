import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  authenticateV138Plan134ProspectiveV6ForReview,
  buildV138Plan134ProspectiveV6ForReview,
  checkV138Plan134SourceOnlyForReview,
  rootV138Plan134CarrierForReview,
  rootV138Plan134PayloadForReview,
} from "./check-v1-38-plan-262-134-live-v13-custody-v6.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const clone = <T>(value: T): T => structuredClone(value)

const repairPayload = (evidence: any): void => {
  evidence.payload.payloadRoot = rootV138Plan134PayloadForReview(evidence.payload)
  evidence.carrier.payloadRoot = evidence.payload.payloadRoot
  evidence.carrier.payloadSha256 = evidence.payloadSha256()
  evidence.carrier.carrierRoot = rootV138Plan134CarrierForReview(evidence.carrier)
}
const repairCarrier = (evidence: any): void => {
  evidence.carrier.carrierRoot = rootV138Plan134CarrierForReview(evidence.carrier)
}

describe("Plan 262-134 source-only custody correction v6", () => {
  it("authenticates immutable v5 custody and returns stored prospective v6 values", () => {
    const result = checkV138Plan134SourceOnlyForReview(ROOT)
    expect(result).toMatchObject({
      sourceOnly: true,
      v5Disposition: "process_invalid_authority_carrier_validation",
      supersededV5Plan110Eligible: false,
      plan135Eligible: true,
      plan110Eligible: false,
      authorizesExecution: false,
      createsCapacity: false,
      resetsCounters: false,
      authorizationLiteralCreated: false,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      requiredAccepted: 540,
      downstreamAuthority: "denied",
    })
  }, 180_000)

  it("rejects every missing or extra payload and carrier key", () => {
    const base = buildV138Plan134ProspectiveV6ForReview(ROOT)
    for (const section of ["payload", "carrier"] as const) {
      for (const key of Object.keys(base[section])) {
        const evidence = clone(base) as any
        delete evidence[section][key]
        expect(() => authenticateV138Plan134ProspectiveV6ForReview(evidence))
          .toThrow(/V138_PLAN134_/u)
      }
      const evidence = clone(base) as any
      evidence[section].unexpected = false
      expect(() => authenticateV138Plan134ProspectiveV6ForReview(evidence))
        .toThrow(/V138_PLAN134_/u)
    }
  }, 180_000)

  it("rejects every nested counter, observation, and reduced-value schema mutation", () => {
    const base = buildV138Plan134ProspectiveV6ForReview(ROOT)
    const cases: Array<(value: any) => void> = []
    for (const key of Object.keys(base.payload.counters)) {
      cases.push((value) => { delete value.payload.counters[key] })
      cases.push((value) => { value.payload.counters[key] = "0" })
    }
    for (let index = 0; index < base.payload.observations.length; index += 1) {
      for (const key of Object.keys(base.payload.observations[index]!))
        cases.push((value) => { delete value.payload.observations[index][key] })
      for (const key of Object.keys(base.payload.observations[index]!.reducedValue))
        cases.push((value) => { delete value.payload.observations[index].reducedValue[key] })
    }
    for (const mutate of cases) {
      const evidence = clone(base) as any
      mutate(evidence); repairPayload(evidence)
      expect(() => authenticateV138Plan134ProspectiveV6ForReview(evidence))
        .toThrow(/V138_PLAN134_/u)
    }
  }, 180_000)

  it("rejects wrong primitive types, stale roots, and individually repaired roots", () => {
    const base = buildV138Plan134ProspectiveV6ForReview(ROOT)
    const payloadScalars = Object.entries(base.payload)
      .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
      .map(([key]) => key)
    const carrierScalars = Object.entries(base.carrier)
      .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
      .map(([key]) => key)
    for (const key of payloadScalars) {
      const stale = clone(base) as any
      stale.payload[key] = typeof stale.payload[key] === "string" ? 1 : "wrong"
      expect(() => authenticateV138Plan134ProspectiveV6ForReview(stale)).toThrow(/V138_PLAN134_/u)
      const repaired = clone(stale) as any; repairPayload(repaired)
      expect(() => authenticateV138Plan134ProspectiveV6ForReview(repaired)).toThrow(/V138_PLAN134_/u)
    }
    for (const key of carrierScalars) {
      const stale = clone(base) as any
      stale.carrier[key] = typeof stale.carrier[key] === "string" ? 1 : "wrong"
      expect(() => authenticateV138Plan134ProspectiveV6ForReview(stale)).toThrow(/V138_PLAN134_/u)
      const repaired = clone(stale) as any; repairCarrier(repaired)
      expect(() => authenticateV138Plan134ProspectiveV6ForReview(repaired)).toThrow(/V138_PLAN134_/u)
    }
  }, 180_000)

  it("rejects self-consistently rerooted authority, counter, mode, and link contradictions", () => {
    const base = buildV138Plan134ProspectiveV6ForReview(ROOT)
    const mutations: Array<(value: any) => void> = [
      (value) => { value.payload.authorizesExecution = true },
      (value) => { value.payload.phase263PlanningAuthorized = true },
      (value) => { value.payload.counters.routeStartsConsumed = 1 },
      (value) => { value.payload.freshAccepted = 540 },
      (value) => { value.payload.requiredAccepted = 539 },
      (value) => { value.payload.actualModesPassed = 5 },
      (value) => { value.payload.findingCount = 1 },
      (value) => { value.payload.supersededV5Plan110Eligible = true },
      (value) => { value.payload.observations[0].mode = "--check-live" },
      (value) => { value.payload.subjectCommit = "0".repeat(40) },
      (value) => { value.payload.v5PublicationCommit = "0".repeat(40) },
      (value) => { value.payload.v5SummaryCommit = "0".repeat(40) },
      (value) => { value.payload.v5ReviewCommit = "0".repeat(40) },
      (value) => { value.payload.v5PayloadRoot = `sha256:${"0".repeat(64)}` },
      (value) => { value.payload.v5CarrierRoot = `sha256:${"0".repeat(64)}` },
      (value) => { value.carrier.authorizesExecution = true },
      (value) => { value.carrier.plan110Eligible = true },
      (value) => { value.carrier.payloadMode = "100755" },
      (value) => { value.carrier.reviewSha256 = `sha256:${"0".repeat(64)}` },
    ]
    for (const mutate of mutations) {
      const evidence = clone(base) as any
      mutate(evidence); repairPayload(evidence); repairCarrier(evidence)
      expect(() => authenticateV138Plan134ProspectiveV6ForReview(evidence))
        .toThrow(/V138_PLAN134_/u)
    }
  }, 180_000)

  it("does not return a sanitized projection for contradictory stored bytes", () => {
    const base = buildV138Plan134ProspectiveV6ForReview(ROOT) as any
    base.carrier.authorizesExecution = true
    repairCarrier(base)
    expect(() => authenticateV138Plan134ProspectiveV6ForReview(base))
      .toThrow("V138_PLAN134_CARRIER_SEMANTICS_INVALID")
  }, 180_000)
})
