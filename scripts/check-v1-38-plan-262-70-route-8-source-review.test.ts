import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const loadReviewer = async () => {
  try {
    return await import("./check-v1-38-plan-262-70-route-8-source-review.js")
  } catch {
    throw new Error("[RED:INDEPENDENT_ROUTE8_SOURCE_REVIEW]")
  }
}

const cloneValue = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const git = (root: string, args: string[]) => execFileSync("git", args,
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
const custodyFixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-plan26270-custody-")); roots.push(root)
  git(root, ["init", "-q"]); git(root, ["config", "user.email", "test@example.invalid"])
  git(root, ["config", "user.name", "Route 8 Review Test"])
  writeFileSync(path.join(root, "README.md"), "base\n"); git(root, ["add", "README.md"])
  git(root, ["commit", "-q", "-m", "fixture: base"])
  const branch = git(root, ["branch", "--show-current"])
  const sourcePaths = [
    "scripts/check-v1-38-plan-262-69-route-8-source.test.ts",
    "scripts/check-v1-38-plan-262-69-route-8-source.ts",
    "scripts/lib/v1-38-route-8-source.ts",
  ]
  const sourceCommits: string[] = []
  for (const [index, repoPath] of sourcePaths.entries()) {
    mkdirSync(path.dirname(path.join(root, repoPath)), { recursive: true })
    writeFileSync(path.join(root, repoPath), `source ${index}\n`)
    git(root, ["add", repoPath]); git(root, ["commit", "-q", "-m", `fixture: source ${index}`])
    sourceCommits.push(git(root, ["rev-parse", "HEAD"]))
    if (index < sourcePaths.length - 1) {
      writeFileSync(path.join(root, `unrelated-${index}.md`), `unrelated ${index}\n`)
      git(root, ["add", `unrelated-${index}.md`])
      git(root, ["commit", "-q", "-m", `fixture: unrelated ${index}`])
    }
  }
  return { root, branch, sourcePaths, sourceCommits }
}

describe("Plan 262-70 independent Route-8 source review", () => {
  it("derives exact Git custody and a zero-finding no-publish disposition", async () => {
    const reviewer = await loadReviewer()
    const before = reviewer.snapshotV138Plan26270CanonicalDestinations(process.cwd())
    const review = await reviewer.deriveV138Plan26270NoPublish(process.cwd())
    const after = reviewer.snapshotV138Plan26270CanonicalDestinations(process.cwd())

    expect(review.schemaVersion).toBe("v1.38-plan-262-70-route-8-source-review-v1")
    expect(review.reviewedSource.paths).toEqual(reviewer.V138_PLAN_262_70_SOURCE_PATHS)
    expect(review.reviewedSource.commit).toMatch(/^[0-9a-f]{40}$/u)
    expect(review.reviewedSource.tree).toMatch(/^[0-9a-f]{40}$/u)
    expect(review.reviewedSource.parent).toMatch(/^[0-9a-f]{40}$/u)
    expect(review.reviewedSource.blobs).toHaveLength(3)
    expect(review.observations.every((entry: { passed: boolean }) => entry.passed)).toBe(true)
    expect(review.findings).toEqual([])
    expect(review.findingCount).toBe(0)
    expect(review.sourceReviewPassed).toBe(true)
    expect(review.identityClaims).toEqual({ independentPersonClaimed: false,
      reviewerSeparated: false, externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false, independentCustodyClaimed: false })
    expect(review.authority).toEqual({ plan26271Eligible: true, authorizationCreated: false,
      sealCreated: false, routeStarted: false, admit03Status: "blocked", freshAccepted: 0,
      requiredAccepted: 540, phase263Authorized: false, candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false, holdoutOpeningAuthorized: false,
      publicAuthorized: false, productionAuthorized: false, liveAuthorized: false })
    expect(after).toEqual(before)
  }, 180_000)

  it("authenticates the ordered source-touching subsequence across unrelated commits", async () => {
    const reviewer = await loadReviewer()
    const fixture = custodyFixture()
    const custody = reviewer.inspectV138Plan26270SourceCustody(fixture.root)
    expect(custody.commits).toEqual(fixture.sourceCommits)
    expect(custody.paths).toEqual(fixture.sourcePaths)
    expect(git(fixture.root, ["rev-list", "--count", `${custody.base}..${custody.commit}`]))
      .toBe("5")
  })

  it("rejects ambiguous source lineage", async () => {
    const reviewer = await loadReviewer()
    const ambiguous = custodyFixture()
    git(ambiguous.root, ["checkout", "-q", "-b", "side", ambiguous.sourceCommits[1]!])
    writeFileSync(path.join(ambiguous.root, ambiguous.sourcePaths[0]!), "side rewrite\n")
    git(ambiguous.root, ["add", ambiguous.sourcePaths[0]!])
    git(ambiguous.root, ["commit", "-q", "-m", "fixture: side source"])
    git(ambiguous.root, ["checkout", "-q", ambiguous.branch])
    writeFileSync(path.join(ambiguous.root, "main-only.md"), "main\n")
    git(ambiguous.root, ["add", "main-only.md"]); git(ambiguous.root, ["commit", "-q", "-m", "fixture: main"])
    expect(() => git(ambiguous.root, ["merge", "--no-ff", "-m", "fixture: ambiguous merge", "side"]))
      .not.toThrow()
    expect(() => reviewer.inspectV138Plan26270SourceCustody(ambiguous.root))
      .toThrow("V138_PLAN_262_70_SOURCE_RUN_INVALID")

  })

  it("detects every frozen contract and authority mutation after roots are recomputed", async () => {
    const reviewer = await loadReviewer()
    const review = await reviewer.deriveV138Plan26270NoPublish(process.cwd())
    const mutations: Array<[string, (value: any) => void]> = [
      ["route ordinal", value => { value.contract.routeOrdinal = 7 }],
      ["sampling", value => { value.contract.bounds.samplingMilliseconds = 201 }],
      ["headroom", value => { value.contract.bounds.minimumEffectiveAvailableBasisPoints = 2499 }],
      ["attempts", value => { value.contract.bounds.calibrationAttempts = 7 }],
      ["shards", value => { value.contract.bounds.calibrationShards = 3 }],
      ["cells", value => { value.contract.bounds.conditionalReproductionCells = 539 }],
      ["runtime", value => { value.contract.semantics.supervisedRuntimeOnly = false }],
      ["rules", value => { value.contract.semantics.rulesAuthority = "COPIED_RULES" }],
      ["privacy", value => { value.contract.semantics.privateEvidenceOnly = false }],
      ["formation", value => { value.contract.semantics.formationMaterialization = true }],
      ["charge history", value => { value.protectedHistory.historicalCharges = 39 }],
      ["archive", value => { value.protectedHistory.archives[0].sha256 = `sha256:${"0".repeat(64)}` }],
      ["requirement", value => { value.requirementRoots[0].root = `sha256:${"1".repeat(64)}` }],
      ["decision", value => { value.decisionRoots[0].root = `sha256:${"2".repeat(64)}` }],
      ["authority", value => { value.authority.phase263Authorized = true }],
      ["source commit omission", value => { value.reviewedSource.commits.splice(1, 1) }],
      ["source commit reorder", value => { value.reviewedSource.commits.reverse() }],
      ["extra source commit", value => { value.reviewedSource.commits.push("0".repeat(40)) }],
      ["source path rewrite", value => { value.reviewedSource.paths[0] = "scripts/rewritten.ts" }],
    ]
    for (const [name, mutate] of mutations) {
      const candidate: any = cloneValue(review)
      mutate(candidate)
      candidate.reviewRoot = reviewer.computeV138Plan26270ReviewRoot(candidate)
      expect(() => reviewer.validateV138Plan26270Review(candidate, review), name)
        .toThrow("V138_PLAN_262_70_REVIEW_MISMATCH")
    }
  }, 180_000)

  it("records the closed handler, terminal, lifecycle, and malformed-input inventory", async () => {
    const reviewer = await loadReviewer()
    const review = await reviewer.deriveV138Plan26270NoPublish(process.cwd())
    const ids = review.observations.map((entry: { id: string }) => entry.id)
    for (const id of ["static-capability-inventory", "authority-seal-topology",
      "pre-start-obstruction", "route-start-exclusive", "calibration-charge-before-child",
      "reproduction-charge-before-child", "post-start-terminal-no-resume",
      "authoritative-56-plan-topology", "validation-normalization",
      "post-validation-binder", "automatic-root-selection", "single-sentinel-driver",
      "verifier-report-authentication", "temporary-cleanup", "pass-only-summary",
      "obstruction-gaps-phase263-denial", "malformed-input-denial",
      "canonical-kernel-runtime-delegation"])
      expect(ids).toContain(id)
    expect(new Set(ids).size).toBe(ids.length)
  }, 180_000)

  it("renders and validates only the exact canonical zero-finding pair", async () => {
    const reviewer = await loadReviewer()
    const review = await reviewer.deriveV138Plan26270NoPublish(process.cwd())
    const report = reviewer.renderV138Plan26270ReviewReport(review)
    expect(report).toContain("PASS — exact zero findings")
    expect(report).toContain("non-authorizing")
    expect(reviewer.validateV138Plan26270ReviewPair(review, report, review)).toBe(true)
    const bad: any = cloneValue(review)
    bad.findings = [{ code: "INJECTED", detail: "synthetic" }]
    bad.findingCount = 1
    bad.sourceReviewPassed = false
    bad.reviewRoot = reviewer.computeV138Plan26270ReviewRoot(bad)
    expect(() => reviewer.validateV138Plan26270ReviewPair(bad,
      reviewer.renderV138Plan26270ReviewReport(bad), review))
      .toThrow("V138_PLAN_262_70_REVIEW_FINDINGS")
  }, 180_000)

  it("rejects changed source bytes and leaves no disposable clone", async () => {
    const reviewer = await loadReviewer()
    const root = mkdtempSync(path.join(tmpdir(), "v138-plan26270-source-"))
    roots.push(root)
    const source = path.join(root, "route.ts")
    writeFileSync(source, readFileSync("scripts/lib/v1-38-route-8-source.ts", "utf8") +
      "\nexport const formationMaterializationAuthorized = true\n")
    expect(() => reviewer.inspectV138Plan26270SourceBytes(readFileSync(source, "utf8")))
      .toThrow("V138_PLAN_262_70_SOURCE_BOUNDARY_INVALID")
    const review = await reviewer.deriveV138Plan26270NoPublish(process.cwd())
    expect(existsSync(review.detachedExecution.cleanupPath)).toBe(false)
    expect(review.detachedExecution.cleanupComplete).toBe(true)
  }, 180_000)
})
