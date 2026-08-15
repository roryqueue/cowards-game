import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { encodeCanonicalJson } from "@cowards/spec"
import {
  V138_PLAN_262_56_AUTHORIZATION_V8_SCHEMA,
  V138_PLAN_262_56_V8_CANONICAL_PATHS,
  V138_SUCCESSOR_SOURCE_SEAL_V8_SCHEMA,
  buildV138Plan26256AuthorizationV8,
  buildV138SuccessorSourceSealV8,
  checkV138Plan26256AuthorizationV8,
  checkV138SuccessorSourceSealV8,
} from "./lib/v1-38-successor-source-seal.js"

type FindingCode =
  | "CR01_EXECUTION_TRANSCRIPT_INVALID"
  | "CR02_REACHABILITY_INVENTORY_INVALID"
  | "CR03_SOURCE_CUSTODY_INVALID"
  | "CR04_PROTECTED_HISTORY_INVALID"
  | "CR05_STATE_PRESERVATION_INVALID"
  | "CR06_PUBLICATION_CUSTODY_INVALID"
  | "CR07_IDENTITY_CLAIM_INVALID"
  | "CR08_PATH_CONFINEMENT_INVALID"
  | "WR01_SEMANTIC_ROOT_RECOMPUTED"

type Candidate = Record<string, any>

const canonical = (value: unknown): string => JSON.stringify(value,
  (_key, item) => item !== null && typeof item === "object" &&
    !Array.isArray(item) ? Object.fromEntries(Object.entries(item)
      .sort(([a], [b]) => a.localeCompare(b))) : item)
const root = (value: unknown) => `sha256:${createHash("sha256")
  .update(canonical(value)).digest("hex")}`
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const commands = [
  "--check-plan-262-57-pre-execution-readiness-v1",
  "--resolve-plan-262-57-pre-start-v1",
  "--check-plan-262-57-pre-start-obstruction-v1",
  "--write-execution-context-v11-receipt",
  "--write-plan-262-57-route-start-v1",
  "--write-headroom-preflight-v11-receipt",
  "--calibrate-parallel-v11-receipt",
  "--write-authoritative-v12-receipt",
  "--write-plan-262-57-terminal-v1",
  "--check-plan-262-57-terminal-v1",
] as const

const sourcePaths = [
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts",
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/check-v1-38-dependency-revision-boundaries.ts",
] as const

const makeCandidate = (): Candidate => {
  const body = {
    schemaVersion: "v1.38-plan-262-58-source-completeness-review-v2-candidate",
    custody: { sourceBase8: "1".repeat(40), a8: "2".repeat(40),
      parents: ["1".repeat(40)], paths: [...sourcePaths], maximal: true,
      planningDescendantsOnly: true },
    transcript: { fixtureRoot: "/private/tmp/cowards-a8-fixture.owned",
      fixtureRemoved: true, repositoryRootCanonical: true,
      records: commands.map((command, index) => ({ command, argv: [command],
        reachedHandler: `handler-${index}`, prerequisite: `pre-${index}`,
        destination: `destination-${index}`, effectClass: index % 2 ? "fixture-write" : "none",
        disposition: "success", exitStatus: 0,
        outputDigest: `sha256:${String(index).padStart(64, "0")}` })),
      eventLedger: ["lstat:before", "open:nofollow", "dispatch", "cleanup", "lstat:absent"],
      beforeRoot: `sha256:${"3".repeat(64)}`,
      afterRoot: `sha256:${"3".repeat(64)}`,
      canonicalWrites: [] },
    reachability: { commands: [...commands], exports: commands.map((_v, i) => `handler-${i}`),
      manifestCommands: [...commands], dispatchCommands: [...commands],
      routeOrdinal: 7, executionVersions: ["v11", "v11", "v11", "v12"] },
    protectedHistory: { a7: "5f39aba7833030d537c4c2767c369d24c982ed83",
      exactChargeIds: Array.from({ length: 40 }, (_, index) => `charge:${index}`),
      priorAuthorizationBytes: Array.from({ length: 6 }, (_, index) =>
        ({ path: `authorization-${index}`, sha256: `sha256:${String(index + 1).repeat(64).slice(0, 64)}` })),
      roots: { policy: `sha256:${"4".repeat(64)}`, runtime: `sha256:${"5".repeat(64)}` } },
    snapshots: { inventoryComplete: true, transientWritesObserved: true,
      beforeRoot: `sha256:${"6".repeat(64)}`, afterRoot: `sha256:${"6".repeat(64)}` },
    publication: { mode: "exclusive-create", introducingCommitCount: 1,
      changedPaths: ["review-v2.json", "262-59-REVIEW.md"], immutableBlobs: true,
      laterModificationCount: 0 },
    identity: { independentPersonClaimed: false, reviewerSeparated: false,
      externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false,
      proceduralContext: "fresh_plan_262_59_procedural_context" },
    confinement: { repositoryRootCanonical: true, canonicalRelativePathsOnly: true,
      extraCliArguments: false, symlinkAncestor: false, symlinkLeaf: false,
      hardLinkAlias: false, pathEscape: false },
  }
  return { ...body, candidateRoot: root(body) }
}

const recompute = (candidate: Candidate) => {
  const { candidateRoot: _old, ...body } = candidate
  return { ...body, candidateRoot: root(body) }
}

const loadContract = async () => {
  try {
    return await import("./check-v1-38-plan-262-58-source-completeness-review-v2.js")
  } catch {
    throw new TypeError("[RED:A8_REVIEW_V2_AUTHORIZATION_CONTRACT]")
  }
}

describe("Plan 262-58 reviewer-v2 semantic contract", () => {
  it("[RED:A8_REVIEW_V2_AUTHORIZATION_CONTRACT] closes CR-01..CR-08 and WR-01", async () => {
    const contract = await loadContract()
    const positive = makeCandidate()
    expect(contract.validateReviewV2Candidate(positive)).toEqual(positive)

    const attacks: ReadonlyArray<readonly [FindingCode, (value: Candidate) => void]> = [
      ["CR01_EXECUTION_TRANSCRIPT_INVALID", value => { value.transcript.records[0].exitStatus = -1 }],
      ["CR02_REACHABILITY_INVENTORY_INVALID", value => { value.reachability.dispatchCommands.pop() }],
      ["CR03_SOURCE_CUSTODY_INVALID", value => { value.custody.parents = ["9".repeat(40)] }],
      ["CR04_PROTECTED_HISTORY_INVALID", value => { value.protectedHistory.exactChargeIds[0] = "forged" }],
      ["CR05_STATE_PRESERVATION_INVALID", value => { value.snapshots.afterRoot = `sha256:${"7".repeat(64)}` }],
      ["CR06_PUBLICATION_CUSTODY_INVALID", value => { value.publication.mode = "refresh" }],
      ["CR07_IDENTITY_CLAIM_INVALID", value => { value.identity.reviewerSeparated = true }],
      ["CR08_PATH_CONFINEMENT_INVALID", value => { value.confinement.symlinkAncestor = true }],
      ["WR01_SEMANTIC_ROOT_RECOMPUTED", value => { value.transcript.records[0].command = "--decoy" }],
    ]
    for (const [code, mutate] of attacks) {
      const mutation = structuredClone(positive)
      mutate(mutation)
      const rerooted = recompute(mutation)
      expect(() => contract.validateReviewV2Candidate(rerooted), code).toThrow(code)
      expect(rerooted.candidateRoot).toBe(root(Object.fromEntries(
        Object.entries(rerooted).filter(([key]) => key !== "candidateRoot"))))
    }
  })

  it("derives all six lifecycle states and rejects chain/incomplete drift", async () => {
    const { evaluateV138Plan26258Lifecycle } = await import(
      "./check-v1-38-dependency-revision-boundaries.js")
    const cases = [
      ["review_v2_pending_42_of_47", 42, ["262-58", "262-59", "262-56", "262-57", "262-48"]],
      ["plan_58_complete_43_of_47", 43, ["262-59", "262-56", "262-57", "262-48"]],
      ["review_v2_complete_44_of_47", 44, ["262-56", "262-57", "262-48"]],
      ["authority_complete_45_of_47", 45, ["262-57", "262-48"]],
      ["route_complete_46_of_47", 46, ["262-48"]],
      ["phase_complete_47_of_47", 47, []],
    ] as const
    for (const [mode, completed, incomplete] of cases) {
      const input = { mode, totalPlans: 47, completedPlans: completed,
        correctiveChain: ["262-58", "262-59", "262-56", "262-57", "262-48"],
        incomplete: [...incomplete], archivedPlan55Active: false,
        reviewV1InvalidDispositionPresent: true, authorizationVersion: 8,
        sealVersion: 8, obsoleteV7Present: false, routeOrdinal: 7,
        executionVersions: [11, 11, 11, 12] }
      expect(evaluateV138Plan26258Lifecycle(input)).toMatchObject({ mode, completedPlans: completed })
      expect(() => evaluateV138Plan26258Lifecycle({ ...input,
        incomplete: [...input.incomplete, "262-55"] })).toThrow(
          "V138_PLAN_262_58_LIFECYCLE_INVALID")
    }
  })

  it("derives the immutable nine-finding non-authorizing v1 disposition", async () => {
    const { buildV138ReviewV1InvalidDisposition,
      checkV138ReviewV1InvalidDisposition } = await loadContract()
    const disposition = buildV138ReviewV1InvalidDisposition(repoRoot)
    expect(disposition).toMatchObject({ disposition:
      "review_v1_invalid_disproved_non_authorizing", findingCount: 9,
      reviewV1PassDisproved: true, sourceCompletenessPassedDisproved: true,
      eligibleAuthorizationInput: false, historicalEvidencePreserved: true,
      exactA7: "5f39aba7833030d537c4c2767c369d24c982ed83",
      authority: { admit03: "blocked", acceptedCells: 0, requiredCells: 540,
        routeStarted: false, candidateSearchAuthorized: false,
        phase263Authorized: false, productionAuthorized: false } })
    expect(disposition.findings.map((item: Candidate) => item.id)).toEqual([
      "CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "CR-06", "CR-07",
      "CR-08", "WR-01"])
    expect(checkV138ReviewV1InvalidDisposition(repoRoot, disposition))
      .toEqual(disposition)
    expect(() => checkV138ReviewV1InvalidDisposition(repoRoot, {
      ...disposition, eligibleAuthorizationInput: true,
    })).toThrow("V138_REVIEW_V1_INVALID_DISPOSITION_INVALID")
  })

  it("binds synthetic authorization-v8 and seal-v8 to detached review-v2/A8 custody", () => {
    const reviewV2Document = { schemaVersion:
      "v1.38-plan-262-59-source-completeness-review-v2",
      sourceBase8: "1".repeat(40), sourceA8: "2".repeat(40),
      findingCount: 0, sourceCompletenessPassed: true,
      independentPersonClaimed: false, reviewerSeparated: false,
      reviewRoot: `sha256:${"8".repeat(64)}` }
    const encodedReview = encodeCanonicalJson(reviewV2Document as never,
      { context: "canonical-manifest" })
    if (!encodedReview.ok) throw new TypeError("TEST_REVIEW_CANONICAL_INVALID")
    const reviewBytes = `${Buffer.from(encodedReview.bytes).toString("utf8")}\n`
    const reviewBytesSha256 = `sha256:${createHash("sha256")
      .update(reviewBytes).digest("hex")}` as const
    const reviewV2Input = { absolutePath:
      "/private/tmp/cowards-plan-262-56-review-v2-input.owned/review-v2.json",
      outsideRepository: true as const, readOnly: true as const,
      ownerMatchesEffectiveUid: true as const, regularFile: true as const,
      symlinkFree: true as const, linkCount: 1 as const,
      inputCommit: "3".repeat(40), inputBlob: "4".repeat(40),
      byteLength: Buffer.byteLength(reviewBytes), bytesSha256: reviewBytesSha256,
      reviewV2Root: reviewV2Document.reviewRoot,
      preBytesSha256: reviewBytesSha256, postBytesSha256: reviewBytesSha256,
      preNoFollowIdentity: "dev:1:ino:2", postNoFollowIdentity: "dev:1:ino:2",
      reviewV2Document }
    const authorization = buildV138Plan26256AuthorizationV8({ repoRoot,
      sourceBase8: "1".repeat(40), sourceA8: "2".repeat(40),
      sourceA8Tree: "5".repeat(40), sourceA8Parent: "1".repeat(40),
      sourceA8Paths: sourcePaths,
      sourceA8Blobs: sourcePaths.map((repoPath, index) => ({ path: repoPath,
        blobOid: String(index + 1).repeat(40).slice(0, 40),
        sha256: `sha256:${String(index + 1).repeat(64).slice(0, 64)}` as const })),
      protectedA7: "5f39aba7833030d537c4c2767c369d24c982ed83",
      protectedHistoryRoot: `sha256:${"6".repeat(64)}`,
      reviewV1InvalidDispositionSha256: `sha256:${"7".repeat(64)}`,
      reviewV2Input })
    expect(authorization).toMatchObject({ schemaVersion:
      V138_PLAN_262_56_AUTHORIZATION_V8_SCHEMA, routeOrdinal: 7,
      executionVersions: { context: 11, preflight: 11, calibration: 11,
        reproduction: 12 }, identityClaims: { independentPersonClaimed: false,
        reviewerSeparated: false, independentCustodyClaimed: false },
      futureCustodyPaths: [V138_PLAN_262_56_V8_CANONICAL_PATHS.authorization,
        V138_PLAN_262_56_V8_CANONICAL_PATHS.seal] })
    expect(checkV138Plan26256AuthorizationV8(repoRoot, authorization))
      .toEqual(authorization)
    const seal = buildV138SuccessorSourceSealV8({ repoRoot, authorization,
      sourceB8: "9".repeat(40), sourceB8Parent: authorization.sourceA8,
      sourceB8Tree: "a".repeat(40), changedPaths: authorization.futureCustodyPaths })
    expect(seal).toMatchObject({ schemaVersion: V138_SUCCESSOR_SOURCE_SEAL_V8_SCHEMA,
      routeOrdinal: 7, sourceB8Parent: authorization.sourceA8 })
    expect(checkV138SuccessorSourceSealV8({ repoRoot, authorization, seal }))
      .toEqual(seal)
    for (const mutate of [
      (value: Candidate) => { value.reviewV2Input.reviewV2Document.findingCount = 1 },
      (value: Candidate) => { value.reviewV2Input.reviewV2Root = `sha256:${"0".repeat(64)}` },
      (value: Candidate) => { value.reviewV2Input.absolutePath = "review-v2.json" },
      (value: Candidate) => { value.reviewV2Input.linkCount = 2 },
      (value: Candidate) => { value.identityClaims.reviewerSeparated = true },
      (value: Candidate) => { value.sourceA8Parent = "0".repeat(40) },
      (value: Candidate) => { value.futureCustodyPaths[0] =
        ".planning/artifacts/v1.38-plan-262-56-authorization-v7.json" },
    ]) {
      const mutation = structuredClone(authorization)
      mutate(mutation)
      const { authorizationRoot: _discarded, ...body } = mutation
      mutation.authorizationRoot = root(body)
      expect(() => checkV138Plan26256AuthorizationV8(repoRoot, mutation))
        .toThrow()
    }
  })
})
