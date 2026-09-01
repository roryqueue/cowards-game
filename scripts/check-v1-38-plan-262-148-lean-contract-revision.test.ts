import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

import {
  AUTHORITY_KEYS,
  PLAN_148_PATHS,
  assertProspectiveRevisionPaths,
  assertLeanContract,
  assertWriterStatus,
  checkHistoricalCustody,
  checkNoFormationOrAuthority,
  renderLeanContract,
} from "./check-v1-38-plan-262-148-lean-contract-revision"

const root = process.cwd()

describe("Plan 262-148 lean admission contract revision", () => {
  it("authenticates immutable Plan 128/129 and exhausted history", () => {
    const result = checkHistoricalCustody(root)
    expect(result.historicalFullMatrix).toEqual({
      disposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      reproductionPresent: false,
      reinterpreted: false,
    })
  })

  it("freezes the exact thirteen-path contract-only revision", () => {
    expect(PLAN_148_PATHS).toHaveLength(13)
    expect(PLAN_148_PATHS.some((path) => /runner|live/iu.test(path))).toBe(false)
    expect(() => assertProspectiveRevisionPaths(PLAN_148_PATHS)).not.toThrow()
    expect(() => assertProspectiveRevisionPaths(PLAN_148_PATHS.slice(1)))
      .toThrow(/PROSPECTIVE_PATH_SET/)
    expect(() => assertProspectiveRevisionPaths([...PLAN_148_PATHS, "scripts/run-lean.ts"]))
      .toThrow(/PROSPECTIVE_PATH_SET/)
  })

  it("renders the exact lean fixture contract with no authority", () => {
    const contract = renderLeanContract(root)
    expect(contract).toMatchObject({
      schemaVersion: "v1.38-lean-admission-contract-v1",
      decision: "D-34L",
      activePrerequisite: "lean_runner_feasibility_v1",
      claimClass: "fixture_feasibility_only",
      correctiveRerunLimit: 1,
      correctiveRerunPreauthorized: false,
      fixtureContract: {
        uniqueCells: 12,
        serialPasses: 2,
        chargedMatches: 24,
        outerLimitMinutes: 15,
      },
    })
    expect(Object.keys(contract.authority).sort()).toEqual([...AUTHORITY_KEYS].sort())
    expect(Object.values(contract.authority)).toEqual(AUTHORITY_KEYS.map(() => false))
    expect(() => assertLeanContract(contract)).not.toThrow()
  })

  it.each([
    ["historical disposition", (value: any) => { value.historicalFullMatrix.disposition = "passed" }],
    ["historical accepted", (value: any) => { value.historicalFullMatrix.freshAccepted = 540 }],
    ["historical denominator", (value: any) => { value.historicalFullMatrix.requiredAccepted = 12 }],
    ["historical reproduction", (value: any) => { value.historicalFullMatrix.reproductionPresent = true }],
    ["historical reinterpretation", (value: any) => { value.historicalFullMatrix.reinterpreted = true }],
    ["claim class", (value: any) => { value.claimClass = "capacity" }],
    ["cell count", (value: any) => { value.fixtureContract.uniqueCells = 11 }],
    ["pass count", (value: any) => { value.fixtureContract.serialPasses = 1 }],
    ["match count", (value: any) => { value.fixtureContract.chargedMatches = 23 }],
    ["timebox", (value: any) => { value.fixtureContract.outerLimitMinutes = 16 }],
    ["corrective limit", (value: any) => { value.correctiveRerunLimit = 2 }],
    ["corrective preauthorization", (value: any) => { value.correctiveRerunPreauthorized = true }],
    ["protected blob", (value: any) => { value.historicalCustody.plan128.protectedBlobs[".planning/STATE.md"] = "0".repeat(40) }],
    ["authority", (value: any) => { value.authority.phase263PlanningAuthorized = true }],
  ])("rejects mutation of %s", (_name, mutate) => {
    const value = structuredClone(renderLeanContract(root))
    mutate(value)
    expect(() => assertLeanContract(value)).toThrow(/V138_PLAN_262_148/)
  })

  it("rejects unexpected authority keys", () => {
    const value: any = structuredClone(renderLeanContract(root))
    value.authority.runnerAuthorized = false
    expect(() => assertLeanContract(value)).toThrow(/AUTHORITY/)
  })

  it("allows only the two prospective source files and authenticated lock residue before writing", () => {
    expect(() => assertWriterStatus([
      "?? scripts/check-v1-38-plan-262-148-lean-contract-revision.ts",
      "?? scripts/check-v1-38-plan-262-148-lean-contract-revision.test.ts",
      `?? .v138-successor-${"a".repeat(64)}.lock`,
    ])).not.toThrow()
    expect(() => assertWriterStatus([" M .planning/STATE.md"]))
      .toThrow(/WRITER_UNEXPECTED_PATH/)
    expect(() => assertWriterStatus(["?? scripts/run-lean-live.ts"]))
      .toThrow(/WRITER_UNEXPECTED_PATH/)
  })

  it("rejects formation materialization and authority escalation in prospective bytes", () => {
    expect(() => checkNoFormationOrAuthority('{"formationMaterializationAuthorized":true}'))
      .toThrow(/TRACKING_AUTHORITY/)
    expect(() => checkNoFormationOrAuthority('{"phase263PlanningAuthorized":true}'))
      .toThrow(/TRACKING_AUTHORITY/)
  })

  it("current committed contract, when present, is exact", () => {
    const target = ".planning/artifacts/v1.38-lean-admission-contract-v1.json"
    try {
      const value = JSON.parse(readFileSync(target, "utf8"))
      expect(assertLeanContract(value)).toEqual(renderLeanContract(root))
    } catch (error) {
      if ((error as { code?: string }).code !== "ENOENT") throw error
    }
  })
})
