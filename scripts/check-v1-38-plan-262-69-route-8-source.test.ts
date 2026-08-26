import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_ROUTE_8_COMMANDS,
  V138_ROUTE_8_DESTINATIONS,
  buildV138Route8Authorization,
  buildV138Route8Seal,
  checkV138Plan26272Disposition,
  checkV138Plan26272Transition,
  checkV138Route8AuthoritySeal,
  deriveV138Route8Activation,
  type V138Route8SourceCustody,
} from "./lib/v1-38-route-8-source.js"

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const temporary = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-route8-"))
  roots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  return root
}

const digest = (digit: string) => `sha256:${digit.repeat(64)}` as const
const oid = (digit: string) => digit.repeat(40)
const custody = (): V138Route8SourceCustody => ({
  sourceCommit: oid("1"), sourceTree: oid("2"), sourceParent: oid("3"),
  sourceRoot: digest("4"), reviewRoot: digest("5"),
  checkpointRoot: "sha256:f1bc58ff9a4f107c293f1bfba9e7d44d5eda92aac78fbe93f7596889d04f404a",
})

describe("route-8 closed source", () => {
  it("accounts for every command and destination", () => {
    expect(V138_ROUTE_8_COMMANDS).toEqual([
      "--check", "--derive-authority-seal-no-publish", "--check-authority-seal",
      "--check-plan-262-72-transition", "--check-plan-262-72-disposition",
      "--derive-activation-no-publish", "--check-activation",
      "--normalize-post-validation", "--check-normalized-post-validation",
      "--bind-post-validation", "--check-post-validation-binder",
      "--run-plan-262-74-sentinel", "--check-plan-262-74-result",
    ])
    expect(new Set(V138_ROUTE_8_DESTINATIONS).size).toBe(V138_ROUTE_8_DESTINATIONS.length)
    expect(V138_ROUTE_8_DESTINATIONS).toContain(
      ".planning/artifacts/v1.38-current-matrix-reproduction-v14.json",
    )
  })

  it("builds a distinct, non-authorizing v10 and B10 pair", () => {
    const authorization = buildV138Route8Authorization(custody())
    const seal = buildV138Route8Seal(authorization)
    expect(checkV138Route8AuthoritySeal(authorization, seal)).toBe(true)
    expect(authorization.routeOrdinal).toBe(8)
    expect(authorization.execution.preflightVersion).toBe(13)
    expect(authorization.execution.reproductionVersion).toBe(14)
    expect(authorization.authority).toEqual({ routeEligible: true, routeStarted: false,
      satisfiesAdmit03: false, phase263PlanningAuthorized: false,
      candidateSearchAuthorized: false, formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false, publicAuthorized: false,
      productionAuthorized: false })
    expect(() => checkV138Route8AuthoritySeal(
      { ...authorization, routeOrdinal: 7 } as never, seal,
    )).toThrow("V138_ROUTE8_AUTHORIZATION_INVALID")
    expect(() => checkV138Route8AuthoritySeal(authorization,
      { ...seal, authorizationRoot: digest("9") } as never,
    )).toThrow("V138_ROUTE8_SEAL_INVALID")
  })

  it("accepts only obstruction, stopped, or admitted-pending transition states", () => {
    const root = temporary()
    const obstruction = path.join(root, ".planning/artifacts/v1.38-plan-262-72-pre-start-obstruction-v1.json")
    writeFileSync(obstruction, JSON.stringify({ schemaVersion: "v1.38-plan-262-72-pre-start-obstruction-v1",
      status: "blocked", routeStarted: false, freshCharged: 0, freshAccepted: 0,
      phase263PlanningAuthorized: false }) + "\n")
    expect(checkV138Plan26272Transition({ repoRoot: root })).toBe("pre_start_obstruction")
    const routeStart = path.join(root, ".planning/artifacts/v1.38-plan-262-72-route-start-v1.json")
    writeFileSync(routeStart, "{}\n")
    expect(() => checkV138Plan26272Transition({ repoRoot: root }))
      .toThrow("V138_ROUTE8_TRANSITION_BRANCH_INVALID")
    unlink(routeStart)
    unlink(obstruction)

    writeState(root, "stopped")
    expect(checkV138Plan26272Transition({ repoRoot: root })).toBe("stopped_terminal")
    expect(checkV138Plan26272Disposition({ repoRoot: root })).toBe("terminal")
    unlink(path.join(root, ".planning/artifacts/v1.38-plan-262-72-terminal-v1.json"))
    writeFileSync(artifact(root, "v1.38-current-matrix-headroom-preflight-v13.json"),
      JSON.stringify({ schemaVersion: "v1.38-current-matrix-headroom-preflight-v13",
        samplingMilliseconds: 200, minimumEffectiveAvailableBasisPoints: 2500,
        status: "admitted" }) + "\n")
    rewriteCalibration(root, "admitted")
    expect(checkV138Plan26272Transition({ repoRoot: root })).toBe("admitted_pending_reproduction")
    expect(() => checkV138Plan26272Disposition({ repoRoot: root }))
      .toThrow("V138_ROUTE8_DISPOSITION_BRANCH_INVALID")
  })

  it("rejects symlinked optional branches and reproduction before Task 2", () => {
    const root = temporary()
    const outside = path.join(root, "outside")
    writeFileSync(outside, "{}\n")
    symlinkSync(outside, path.join(root,
      ".planning/artifacts/v1.38-plan-262-72-pre-start-obstruction-v1.json"))
    expect(() => checkV138Plan26272Transition({ repoRoot: root }))
      .toThrow("V138_ROUTE8_PATH_UNSAFE")
  })

  it("grants only Phase 263 planning after exact 540/540 and local seal", () => {
    const blocked = deriveV138Route8Activation({ branch: "pre_start_obstruction",
      terminal: null, localSealPassed: true })
    expect(blocked.activation).toBeNull()
    expect(blocked.disposition.phase263PlanningAuthorized).toBe(false)
    const passed = deriveV138Route8Activation({ branch: "terminal",
      terminal: { disposition: "reproduction_passed", freshCharged: 540,
        freshAccepted: 540, satisfiesAdmit03: true }, localSealPassed: true })
    expect(passed.activation?.phase263PlanningAuthorized).toBe(true)
    expect(passed.activation?.candidateSearchAuthorized).toBe(false)
    expect(passed.activation?.formationMaterializationAuthorized).toBe(false)
    expect(deriveV138Route8Activation({ branch: "terminal",
      terminal: { disposition: "reproduction_passed", freshCharged: 540,
        freshAccepted: 539, satisfiesAdmit03: true }, localSealPassed: true }).activation)
      .toBeNull()
  })
})

const unlink = (file: string) => rmSync(file)
const artifact = (root: string, name: string) => path.join(root, ".planning/artifacts", name)
const writeState = (root: string, calibrationStatus: "stopped" | "admitted") => {
  writeFileSync(artifact(root, "v1.38-plan-262-72-route-start-v1.json"),
    JSON.stringify({ schemaVersion: "v1.38-plan-262-72-route-start-v1", routeOrdinal: 8,
      consumed: true, executionContextVersion: 13, preflightVersion: 13 }) + "\n")
  writeFileSync(artifact(root, "v1.38-current-matrix-headroom-preflight-v13.json"),
    JSON.stringify({ schemaVersion: "v1.38-current-matrix-headroom-preflight-v13",
      samplingMilliseconds: 200, minimumEffectiveAvailableBasisPoints: 2500,
      status: calibrationStatus === "stopped" ? "stopped" : "admitted" }) + "\n")
  writeFileSync(artifact(root, "v1.38-plan-262-72-calibration-consumption-v1.json"),
    JSON.stringify({ schemaVersion: "v1.38-plan-262-72-calibration-consumption-v1",
      charged: 8, shards: 4, consumed: true }) + "\n")
  rewriteCalibration(root, calibrationStatus)
  if (calibrationStatus === "stopped") writeFileSync(
    artifact(root, "v1.38-plan-262-72-terminal-v1.json"),
    JSON.stringify({ schemaVersion: "v1.38-plan-262-72-terminal-v1",
      disposition: "calibration_stopped", routeOrdinal: 8, freshCharged: 8,
      freshAccepted: 0, satisfiesAdmit03: false }) + "\n")
}
const rewriteCalibration = (root: string, status: "stopped" | "admitted") =>
  writeFileSync(artifact(root, "v1.38-current-matrix-calibration-v13.json"),
    JSON.stringify({ schemaVersion: "v1.38-current-matrix-calibration-v13",
      status, charged: 8, shards: 4 }) + "\n")
