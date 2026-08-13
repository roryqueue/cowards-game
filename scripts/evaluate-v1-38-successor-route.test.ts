import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_47_AUTHORIZATION_SCHEMA,
  V138_PLAN_262_47_CANONICAL_PATHS,
  V138_PLAN_262_47_FRESH_DESTINATIONS,
  V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA,
  buildV138Plan26247AuthorizationV6,
  checkV138Plan26247AuthorizationV6,
  inspectV138SourceIdentityA6,
  v138Plan26247AuthorizationLiteral,
} from "./lib/v1-38-successor-source-seal.js"
import {
  V138_PLAN_262_47_ROUTE_CONTRACT,
  checkV138Plan26247RouteContract,
  checkV138Plan26247SyntheticRoute,
} from "./lib/v1-38-current-matrix-reproduction.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

describe("v1.38 Plan 262-47 fresh successor route", () => {
  it("freezes isolated v6/v10/v11 schemas and exclusive destinations", () => {
    expect(V138_PLAN_262_47_AUTHORIZATION_SCHEMA)
      .toBe("v1.38-plan-262-47-authorization-v6")
    expect(V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA)
      .toBe("v1.38-successor-source-seal-v6")
    expect(V138_PLAN_262_47_ROUTE_CONTRACT).toMatchObject({
      routeOrdinal: 6,
      executionContextSchema: "v1.38-current-matrix-execution-context-v10",
      preflightSchema: "v1.38-current-matrix-headroom-preflight-v10",
      calibrationSchema: "v1.38-current-matrix-calibration-v10",
      reproductionSchema: "v1.38-current-matrix-reproduction-v11",
      resourceSampleMilliseconds: 200,
      requiredHostHeadroomBasisPoints: 2500,
      calibrationAttemptCount: 8,
      calibrationShardCount: 4,
      reproductionCellCount: 540,
      noRetry: true,
    })
    expect(new Set(V138_PLAN_262_47_FRESH_DESTINATIONS).size).toBe(8)
    expect(V138_PLAN_262_47_FRESH_DESTINATIONS.every((repoPath) =>
      !existsSync(path.resolve(repoRoot, repoPath)))).toBe(true)
    expect(existsSync(path.resolve(repoRoot,
      V138_PLAN_262_47_CANONICAL_PATHS.authorization))).toBe(false)
    expect(existsSync(path.resolve(repoRoot,
      V138_PLAN_262_47_CANONICAL_PATHS.seal))).toBe(false)
    expect(checkV138Plan26247RouteContract(
      V138_PLAN_262_47_ROUTE_CONTRACT)).toBe(V138_PLAN_262_47_ROUTE_CONTRACT)
    expect(() => checkV138Plan26247RouteContract({
      ...V138_PLAN_262_47_ROUTE_CONTRACT,
      authorizationSchema: "v1.38-plan-262-29-authorization-v5",
    })).toThrow("MATRIX_PLAN_262_47_ROUTE_CONTRACT_INVALID")
  })

  it("derives full commit, tree, and parent identity through Git", () => {
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot, encoding: "utf8",
    }).trim()
    const identity = inspectV138SourceIdentityA6(repoRoot, commit)
    expect(identity.reviewedSourceCommit).toBe(commit)
    expect(identity.reviewedSourceCommit).toMatch(/^[0-9a-f]{40}$/u)
    expect(identity.reviewedSourceTree).toMatch(/^[0-9a-f]{40}$/u)
    expect(identity.reviewedSourceParents).toHaveLength(1)
    expect(() => inspectV138SourceIdentityA6(repoRoot, commit.slice(0, 12)))
      .toThrow("V138_PLAN_262_47_SOURCE_IDENTITY_INVALID")
  })

  it("renders without persisting or invoking any route writer", () => {
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot, encoding: "utf8",
    }).trim()
    const literal = v138Plan26247AuthorizationLiteral(repoRoot, commit)
    expect(literal).toContain(`reviewed source commit ${commit}`)
    expect(literal).toContain("route ordinal 6")
    expect(literal).toContain("execution-context:v10")
    expect(literal).toContain("reproduction:v11 540-cell run")
    expect(literal).toContain("single_operator_local_seal_v1")
    expect(literal).toContain("200 ms sampling")
    expect(literal).toContain("inclusive 2,500-basis-point")
    expect(literal).toContain("eight-attempt/four-shard")
    expect(V138_PLAN_262_47_FRESH_DESTINATIONS.every((repoPath) =>
      !existsSync(path.resolve(repoRoot, repoPath)))).toBe(true)
  }, 30_000)

  it("rejects old authority and identity mutations after root recomputation", () => {
    const commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot, encoding: "utf8",
    }).trim()
    const literal = Buffer.from(v138Plan26247AuthorizationLiteral(repoRoot,
      commit), "utf8")
    const authority = buildV138Plan26247AuthorizationV6(repoRoot, commit,
      literal)
    expect(checkV138Plan26247AuthorizationV6(repoRoot, authority, literal))
      .toEqual(authority)
    expect(() => checkV138Plan26247AuthorizationV6(repoRoot, {
      ...authority,
      schemaVersion: "v1.38-plan-262-29-authorization-v5",
    }, literal)).toThrow("V138_PLAN_262_47_AUTHORIZATION_SCHEMA_INVALID")
    expect(() => checkV138Plan26247AuthorizationV6(repoRoot, {
      ...authority,
      reviewedSourceTree: "0".repeat(40),
    }, literal)).toThrow("V138_PLAN_262_47_AUTHORIZATION_INVALID")
  })

  it("accepts only admitted 8/4 calibration followed by exact clean 540 cells", () => {
    const calibration = Object.freeze({ admitted: true,
      chargedAttemptIds: Object.freeze(Array.from({ length: 8 }, (_, index) =>
        `calibration:v10:${index}`)), shardCount: 4, completeCleanup: true,
      systemFailureCount: 0 })
    const cells = Object.freeze(Array.from({ length: 540 }, (_, index) =>
      Object.freeze({ cellId: `cell:${index.toString().padStart(3, "0")}`,
        accepted: true, systemFailure: false, legalityViolation: false,
        privacyViolation: false, formationPresent: false })))
    expect(checkV138Plan26247SyntheticRoute({ calibration, cells }))
      .toMatchObject({ disposition: "reproduction_passed", acceptedCellCount: 540 })
    expect(() => checkV138Plan26247SyntheticRoute({ calibration,
      cells: cells.slice(0, 539) })).toThrow("MATRIX_PLAN_262_47_REPRODUCTION_INVALID")
    expect(() => checkV138Plan26247SyntheticRoute({ calibration: {
      ...calibration, chargedAttemptIds: calibration.chargedAttemptIds.slice(0, 7),
    }, cells })).toThrow("MATRIX_PLAN_262_47_CALIBRATION_INVALID")
    expect(() => checkV138Plan26247SyntheticRoute({ calibration, cells: [
      ...cells.slice(0, 539), { ...cells[539]!, privacyViolation: true },
    ] })).toThrow("MATRIX_PLAN_262_47_REPRODUCTION_INVALID")
  })
})
