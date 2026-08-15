import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"

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
    !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort()) : item)
const root = (value: unknown) => `sha256:${createHash("sha256")
  .update(canonical(value)).digest("hex")}`

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
})
