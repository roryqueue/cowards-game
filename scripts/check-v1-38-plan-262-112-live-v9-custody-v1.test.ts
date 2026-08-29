import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  PLAN_112_REVIEWED_SOURCE_COMMIT,
  observeV138Plan112LiveV9Custody,
  checkV138Plan112ReviewValuesForTest,
} from "./check-v1-38-plan-262-112-live-v9-custody-v1.js"

const repoRoot = path.resolve(import.meta.dirname, "..")

describe("Plan 262-112 independent live-v9 custody review", () => {
  it("pins the exact final Plan-111 source and derives literal-zero evidence", () => {
    expect(PLAN_112_REVIEWED_SOURCE_COMMIT).toBe(
      "a301a06df0e4a3c038cf630f3485f8fb3a879c42",
    )
    const observed = observeV138Plan112LiveV9Custody(repoRoot)
    expect(observed.payload).toMatchObject({
      reviewedSourceCommit: PLAN_112_REVIEWED_SOURCE_COMMIT,
      fullExecutionClosureRoot:
        "sha256:14ff01fb063083db596828b769cf7ccb5d25492994e78d9625b362c58e4ecf4b",
      correctedPublicationCommit: "2639ff3b42e2a238919a3104c9fa8c785c69b93d",
      findingCount: 0,
      findingCodes: [],
      reviewStatus: "zero_findings",
      actualModesPassed: 6,
      producerIncapableObservations: 1,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      plan109Eligible: true,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(observed.supplement).toMatchObject({
      schemaVersion:
        "v1.38-successor-source-seal-v13-executable-custody-supplement-v2",
      authorizesEnvelope: false,
      authorizesCapacity: false,
      authorizesCounterReset: false,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
  }, 180_000)

  it("rejects semantic, closure, counter, and authority substitutions", () => {
    const observed = observeV138Plan112LiveV9Custody(repoRoot)
    for (const [key, value] of Object.entries({
      reviewedSourceCommit: "a".repeat(40),
      recursiveDependencyRoot: `sha256:${"1".repeat(64)}`,
      fullExecutionClosureRoot: `sha256:${"2".repeat(64)}`,
      findingCount: 1,
      actualModesPassed: 5,
      producerIncapableObservations: 0,
      freshCharged: 1,
      freshAccepted: 1,
      plan109Eligible: false,
      authorizesExecution: true,
      downstreamAuthority: "granted",
    })) {
      expect(() =>
        checkV138Plan112ReviewValuesForTest(observed, {
          ...observed.payload,
          [key]: value,
        }), key).toThrow()
    }
  }, 180_000)

  it("does not import subject acceptance or production functions", () => {
    const source = readFileSync(
      path.join(import.meta.dirname, "check-v1-38-plan-262-112-live-v9-custody-v1.ts"),
      "utf8",
    )
    expect(source).not.toContain('from "./run-v1-38-bounded-retry-envelope-v3-live-v9')
    expect(source).not.toContain("runV138ReviewedBoundedLiveEnvelopeV9")
    expect(source).not.toContain("runV138V3ProductionLive")
  })
})
