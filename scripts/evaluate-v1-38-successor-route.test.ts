import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { Buffer } from "node:buffer"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  encodeCanonicalJson,
  hashCanonicalIdentity,
  type JsonValue,
} from "@cowards/spec"
import {
  V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH,
  V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_SCHEMA,
  V138_PLAN_262_47_AUTHORIZATION_SCHEMA,
  V138_PLAN_262_47_CANONICAL_PATHS,
  V138_PLAN_262_47_FRESH_DESTINATIONS,
  V138_SUCCESSOR_SOURCE_SEAL_V6_SCHEMA,
  buildV138Plan26247PreExecutionSourceFailureV1,
  checkV138Plan26247PreExecutionSourceFailureV1,
  checkV138Plan26247AuthorizationV6,
  inspectV138SourceIdentityA6,
  v138Plan26247AuthorizationLiteral,
  writeV138Plan26247PreExecutionSourceFailureV1,
} from "./lib/v1-38-successor-source-seal.js"
import {
  V138_PLAN_262_47_ROUTE_CONTRACT,
  checkV138Plan26247RouteContract,
  checkV138Plan26247SyntheticRoute,
} from "./lib/v1-38-current-matrix-reproduction.js"
import {
  analyzeV138PolicySourcesWithFrozenRouteAllowlist,
  checkV138ExactMachineStatus,
} from "./check-v1-38-dependency-revision-boundaries.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const sha256Zero = `sha256:${"0".repeat(64)}`
const mutableClone = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value)) as Record<string, any>
const recomputeDispositionRoot = (value: Record<string, any>): string => {
  const { dispositionRoot: _discarded, ...body } = value
  const encoded = encodeCanonicalJson(body as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("TEST_CANONICAL_INVALID")
  return `sha256:${hashCanonicalIdentity("evidenceBundle", [
    Buffer.from(body.schemaVersion as string, "utf8"),
    encoded.bytes,
  ])}`
}

describe("v1.38 Plan 262-47 fresh successor route", () => {
  it("records the sealed source-incomplete branch without inventing route history", () => {
    const artifactPath = path.resolve(repoRoot,
      V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH)
    const before = readFileSync(artifactPath)
    const disposition = buildV138Plan26247PreExecutionSourceFailureV1(repoRoot)
    expect(disposition).toMatchObject({
      schemaVersion: V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_SCHEMA,
      reason: "sealed_source_incomplete",
      sourceA6: "600c7770867e6090147914dc090780f5b63930ec",
      sourceB6: "e2166736c2a1a3f1decbb1d6b3722f87945a47ea",
      routeStarted: false,
      isRouteTerminal: false,
      chargedAttemptCount: 0,
      acceptedCellCount: 0,
      authorityExpired: true,
      noRetry: true,
      satisfiesAdmit03: false,
      candidateSearchAuthorized: false,
      phase263Authorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      activationAuthorized: false,
      productionAuthorized: false,
    })
    expect(disposition.absentDestinations)
      .toEqual(V138_PLAN_262_47_FRESH_DESTINATIONS)
    expect(disposition.historicalChargedPublicAttemptIds).toHaveLength(40)
    expect(disposition.sourceReview.establishesCliSourceCompleteness).toBe(false)
    expect(disposition.sourceReview.historicalBytesPreserved).toBe(true)
    expect(disposition.sourceCustody.sourceB6ChangedPaths).toEqual([
      V138_PLAN_262_47_CANONICAL_PATHS.authorization,
      V138_PLAN_262_47_CANONICAL_PATHS.seal,
    ])
    expect(disposition.sourceCustody.sourceB6Blobs).toHaveLength(2)
    expect(checkV138Plan26247PreExecutionSourceFailureV1(repoRoot,
      disposition)).toEqual(disposition)
    expect(readFileSync(artifactPath)).toEqual(before)
    expect(JSON.stringify(disposition)).not.toMatch(
      /StrategyMemory|SoldierMemory|objectivePayload|rawDiagnostic|stack|DATABASE_URL/u,
    )
  }, 120_000)

  it("fails closed when any disposition identity, absence, count, or authority changes", () => {
    const disposition = buildV138Plan26247PreExecutionSourceFailureV1(repoRoot)
    const mutations: unknown[] = [
      { ...disposition, reason: "route_failed" },
      { ...disposition, sourceA6: "0".repeat(40) },
      { ...disposition, sourceB6: "0".repeat(40) },
      { ...disposition, authorizationRoot: `sha256:${"0".repeat(64)}` },
      { ...disposition, sealRoot: `sha256:${"0".repeat(64)}` },
      { ...disposition, absentDestinations: disposition.absentDestinations.slice(1) },
      { ...disposition, chargedAttemptCount: 1 },
      { ...disposition, acceptedCellCount: 1 },
      { ...disposition, routeStarted: true },
      { ...disposition, isRouteTerminal: true },
      { ...disposition, authorityExpired: false },
      { ...disposition, noRetry: false },
      { ...disposition, satisfiesAdmit03: true },
      { ...disposition, candidateSearchAuthorized: true },
      { ...disposition, phase263Authorized: true },
      { ...disposition, formationMaterializationAuthorized: true },
      { ...disposition, holdoutOpeningAuthorized: true },
      { ...disposition, publicAuthorized: true },
      { ...disposition, activationAuthorized: true },
      { ...disposition, productionAuthorized: true },
    ]
    const nestedMutations: Array<(value: Record<string, any>) => void> = [
      (value) => { value.sourceCustody.sourceA6Tree = "0".repeat(40) },
      (value) => { value.sourceCustody.sourceA6Parents = [] },
      (value) => { value.sourceCustody.sourceA6Blobs[0].sha256 = sha256Zero },
      (value) => { value.sourceCustody.sourceB6Tree = "0".repeat(40) },
      (value) => { value.sourceCustody.sourceB6Parent = "0".repeat(40) },
      (value) => { value.sourceCustody.sourceB6ChangedPaths = [] },
      (value) => { value.sourceCustody.sourceB6Blobs[0].blobOid = "0".repeat(40) },
      (value) => { value.authorizationBytesSha256 = sha256Zero },
      (value) => { value.sealBytesSha256 = sha256Zero },
      (value) => { value.sourceReview.path = "forged-review.md" },
      (value) => { value.sourceReview.sha256 = sha256Zero },
      (value) => { value.sourceReview.historicalVerdict = "PASS" },
      (value) => { value.sourceReview.historicalBytesPreserved = false },
      (value) => { value.sourceReview.establishesCliSourceCompleteness = true },
      ...Object.keys(disposition.protectedRoots).map((key) =>
        (value: Record<string, any>) => { value.protectedRoots[key] = sha256Zero }),
      (value) => { value.historicalChargedPublicAttemptIds[0] = "forged" },
      (value) => { value.historicalChargedPublicAttemptIds[1] =
        value.historicalChargedPublicAttemptIds[0] },
      (value) => { value.historicalChargedPublicAttemptIds.pop() },
      (value) => { value.historicalChargedAttemptCount = 39 },
      (value) => { value.freshAttemptLedgerRoot = sha256Zero },
      (value) => { value.freshAcceptedCellLedgerRoot = sha256Zero },
      (value) => { value.requiredAcceptedCellCount = 539 },
      (value) => { value.seal01Status = "passed" },
      (value) => { value.assuranceClass = "independent_custody" },
      (value) => { value.independentCustodyClaimed = true },
      (value) => { value.dispositionRoot = sha256Zero },
      (value) => { value.unexpectedAuthority = true },
      (value) => { delete value.protectedRoots },
      (value) => {
        value.sourceReview.sha256 = sha256Zero
        value.dispositionRoot = recomputeDispositionRoot(value)
      },
    ]
    for (const mutate of nestedMutations) {
      const mutation = mutableClone(disposition)
      mutate(mutation)
      mutations.push(mutation)
    }
    for (const mutation of mutations) {
      expect(() => checkV138Plan26247PreExecutionSourceFailureV1(repoRoot,
        mutation)).toThrow("V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_INVALID")
    }
  }, 120_000)

  it("checks canonical serialized bytes through the CLI and never overwrites the artifact", () => {
    const artifactPath = path.resolve(repoRoot,
      V138_PLAN_262_47_PRE_EXECUTION_SOURCE_FAILURE_PATH)
    const before = readFileSync(artifactPath)
    const disposition = buildV138Plan26247PreExecutionSourceFailureV1(repoRoot)
    const encoded = encodeCanonicalJson(disposition as JsonValue, {
      context: "canonical-manifest",
    })
    if (!encoded.ok) throw new TypeError("TEST_CANONICAL_INVALID")
    expect(before).toEqual(Buffer.concat([Buffer.from(encoded.bytes),
      Buffer.from("\n", "utf8")]))
    const output = execFileSync("pnpm", ["exec", "tsx",
      "scripts/lib/v1-38-successor-source-seal.ts",
      "--check-plan-262-47-pre-execution-source-failure-v1"], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 120_000,
    })
    expect(JSON.parse(output)).toMatchObject({
      dispositionRoot: disposition.dispositionRoot,
      reason: "sealed_source_incomplete",
    })
    expect(() => writeV138Plan26247PreExecutionSourceFailureV1(repoRoot,
      artifactPath)).toThrow()
    expect(readFileSync(artifactPath)).toEqual(before)
  }, 120_000)

  it("rejects stale, duplicate, and contradictory structured status blocks", () => {
    const marker = "phase-262-test-status"
    const expected = { next_action: "262-54", completed_plans: 41 }
    const exact = `stale prose says 262-53 and 40\n<!-- ${marker}: ${JSON.stringify(
      expected)} -->\n`
    expect(checkV138ExactMachineStatus(exact, marker, expected)).toEqual(expected)
    expect(() => checkV138ExactMachineStatus(
      `${exact}<!-- ${marker}: ${JSON.stringify(expected)} -->\n`, marker,
      expected)).toThrow("V138_MACHINE_STATUS_MARKER_COUNT_INVALID")
    expect(() => checkV138ExactMachineStatus(
      `<!-- ${marker}: {"next_action":"262-53","next_action":"262-54","completed_plans":41} -->\n`,
      marker, expected)).toThrow("V138_MACHINE_STATUS_VALUE_INVALID")
    expect(() => checkV138ExactMachineStatus(
      `unscoped ${JSON.stringify(expected)}\n<!-- ${marker}: {"next_action":"262-53","completed_plans":40} -->\n`,
      marker, expected)).toThrow("V138_MACHINE_STATUS_VALUE_INVALID")
  })

  it("denies drift and scans future authority or live work in both route-capable modules", () => {
    for (const repoPath of [
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
      "scripts/lib/v1-38-successor-source-seal.ts",
    ]) {
      const source = readFileSync(path.resolve(repoRoot, repoPath), "utf8")
      expect(analyzeV138PolicySourcesWithFrozenRouteAllowlist({
        [repoPath]: source,
      })).toEqual([])
      const findings = analyzeV138PolicySourcesWithFrozenRouteAllowlist({
        [repoPath]: `${source}\nexport const writeFutureAuthorityRoute = () => {
          executeV138ParallelMatrix()
        }\n`,
      })
      expect(findings.map((finding) => finding.code)).toEqual(
        expect.arrayContaining([
          "ROUTE_CAPABLE_SOURCE_DRIFT",
          "AUTHORITY_WRITER",
          "LIVE_WORK_COMMAND",
        ]),
      )
    }
  })

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
      V138_PLAN_262_47_CANONICAL_PATHS.authorization))).toBe(true)
    expect(existsSync(path.resolve(repoRoot,
      V138_PLAN_262_47_CANONICAL_PATHS.seal))).toBe(true)
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
    const commit = "600c7770867e6090147914dc090780f5b63930ec"
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
    const authority = JSON.parse(readFileSync(path.resolve(repoRoot,
      V138_PLAN_262_47_CANONICAL_PATHS.authorization), "utf8"))
    expect(() => checkV138Plan26247AuthorizationV6(repoRoot, authority))
      .toThrow("V138_PLAN_262_47_REVIEWED_SOURCE_BLOB_INVALID")
    expect(() => checkV138Plan26247AuthorizationV6(repoRoot, {
      ...authority,
      schemaVersion: "v1.38-plan-262-29-authorization-v5",
    })).toThrow("V138_PLAN_262_47_AUTHORIZATION_SCHEMA_INVALID")
    expect(() => checkV138Plan26247AuthorizationV6(repoRoot, {
      ...authority,
      reviewedSourceTree: "0".repeat(40),
    })).toThrow("V138_PLAN_262_47_AUTHORIZATION_INVALID")
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
