import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { afterEach, describe, expect, it } from "vitest"

import {
  EXPECTED_IMPLEMENTATION_COMMIT,
  EXPECTED_SOURCE_COMPLETION_COMMIT,
  REVIEW_PATHS,
  auditLifecycleSource,
  buildLifecycleSourceReview,
  checkPublishedLifecycleSourceReview,
} from "./check-v1-38-plan-262-125-lifecycle-source-review-v1.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const temporaryRoots: string[] = []

afterEach(() => {
  while (temporaryRoots.length)
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true })
})

describe("Plan 262-125 exact source custody", () => {
  it("pins the implementation and three-file completion commits", async () => {
    const review = await buildLifecycleSourceReview(repoRoot)
    expect(review.evidence.implementationCommit).toBe(
      EXPECTED_IMPLEMENTATION_COMMIT,
    )
    expect(review.carrier.sourceCommit).toBe(EXPECTED_SOURCE_COMPLETION_COMMIT)
    expect(review.carrier.sourceFiles.map((entry) => entry.path)).toEqual([
      REVIEW_PATHS.subjectSource,
      REVIEW_PATHS.subjectTests,
      REVIEW_PATHS.subjectSummary,
    ])
    expect(review.carrier.sourceFiles.every((entry) => entry.mode === "100644"))
      .toBe(true)
  })

  it("finds literal zero gaps in the exact committed subject", async () => {
    const review = await buildLifecycleSourceReview(repoRoot)
    expect(review.findings).toEqual([])
    expect(review.carrier).toMatchObject({
      findingCount: 0,
      plan126Eligible: true,
      authorizesExecution: false,
    })
  })
})

describe("Plan 262-125 hostile source mutations", () => {
  it.each([
    ["branch-neutral partition", '"branch_neutral_bookkeeping_only"', '"authority_bearing_bookkeeping"'],
    ["pass-only partition", '"provisional_foundation_status_only"', '"complete_foundation_and_phase263"'],
    ["Phase 263 holdback", "phase263PlanningEligible: false", "phase263PlanningEligible: true"],
    ["reproduction rule", "producerSucceeded !== presence.reproductionPresent", "false"],
    ["Route-12 rule", "value?.status !== \"pass\" && presence.route12Present", "false"],
    ["local-seal limitation", '"single_operator_local_seal_v1_no_hostile_same_uid"', '"independent_external_custody"'],
    ["dynamic inventory", '"ls-tree"', '"fixed-plan-count"'],
    ["review zero gate", "value.findingCount !== 0", "false"],
    ["review eligibility gate", "value.plan126Eligible !== true", "false"],
    ["review authority gate", "value.authorizesExecution !== false", "false"],
    ["readiness selector", '"--write-reviewed-readiness"', '"--write-readiness-unreviewed"'],
    ["closeout selector", '"--apply-provisional-closeout"', '"--apply-closeout-unreviewed"'],
    ["readiness target", "v1.38-plan-262-126-lifecycle-readiness-v4.json", "v1.38-plan-262-95-lifecycle-driver-readiness-v3.json"],
  ])("rejects a mutated %s", async (_name, needle, replacement) => {
    const source = readFileSync(path.join(repoRoot, REVIEW_PATHS.subjectSource), "utf8")
    expect(source).toContain(needle)
    const result = await auditLifecycleSource(repoRoot, {
      sourceText: source.replace(needle, replacement),
      skipRuntimeChecks: true,
    })
    expect(result.findings.length).toBeGreaterThan(0)
  })

  it("rejects each missing requirement and each missing inventory class", async () => {
    const source = readFileSync(path.join(repoRoot, REVIEW_PATHS.subjectSource), "utf8")
    for (const requirement of [
      "ADMIT-01", "ADMIT-02", "ADMIT-03", "ADMIT-04",
      "MEAS-01", "MEAS-02", "MEAS-03", "MEAS-04", "MEAS-05",
      "MEAS-06", "MEAS-07", "MEAS-08", "MEAS-09", "MEAS-10",
      "SEAL-01", "DECI-02",
    ]) {
      const result = await auditLifecycleSource(repoRoot, {
        sourceText: source.replace(`\"${requirement}\"`, '"REMOVED"'),
        skipRuntimeChecks: true,
      })
      expect(result.findings).toContain(`REQUIREMENT_${requirement}_MISSING`)
    }
    for (const inventoryClass of [
      "activePlans", "historicalPlans", "dormantCarriers", "summaries",
      "reviews", "validations", "verifications",
    ]) {
      const result = await auditLifecycleSource(repoRoot, {
        sourceText: source.replace(inventoryClass, `removed${inventoryClass}`),
        skipRuntimeChecks: true,
      })
      expect(result.findings).toContain(`INVENTORY_CLASS_${inventoryClass}_MISSING`)
    }
  })
})

describe("Plan 262-125 runtime and effect tripwires", () => {
  it("independently observes exhausted 0/540 and all authority false", async () => {
    const audit = await auditLifecycleSource(repoRoot)
    expect(audit.observations.actualBranch).toMatchObject({
      branch: "gaps",
      producerDisposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      phase263PlanningEligible: false,
      phase263ExecutionEligible: false,
    })
    expect(Object.values(audit.observations.actualBranch.authority)).toEqual(
      expect.arrayContaining([false]),
    )
    expect(Object.values(audit.observations.actualBranch.authority).every((value) => value === false)).toBe(true)
  })

  it("covers all dynamic classes and all sixteen requirements", async () => {
    const audit = await auditLifecycleSource(repoRoot)
    expect(audit.observations.requirementIds).toHaveLength(16)
    expect(audit.observations.inventoryCounts).toMatchObject({
      activePlans: expect.any(Number),
      historicalPlans: expect.any(Number),
      dormantCarriers: expect.any(Number),
      summaries: expect.any(Number),
      reviews: expect.any(Number),
      validations: 1,
      verifications: 1,
    })
    expect(Object.values(audit.observations.inventoryCounts).every((count) => count > 0)).toBe(true)
  })

  it("proves source and prospective selectors do not write watched paths", async () => {
    const audit = await auditLifecycleSource(repoRoot)
    expect(audit.observations.noWriteSelectors).toEqual({
      sourceOnly: true,
      prospective: true,
    })
    expect(audit.observations.writerPaths).toEqual({
      plan126: [REVIEW_PATHS.readiness126],
      plan106: [
        REVIEW_PATHS.lifecycle106,
        REVIEW_PATHS.requirements,
        REVIEW_PATHS.roadmap,
        REVIEW_PATHS.state,
        REVIEW_PATHS.summary106,
      ],
    })
  })

  it("rejects every false Plan125/126 gate before a writer effect", async () => {
    const audit = await auditLifecycleSource(repoRoot)
    expect(audit.observations.closedGateMutations).toBeGreaterThanOrEqual(16)
    expect(audit.observations.writerCalls).toBe(0)
  })
})

describe("Plan 262-125 publication", () => {
  it("checks a literal-zero carrier from a strict later HEAD", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-plan-125-published-"))
    temporaryRoots.push(root)
    execFileSync("git", ["clone", "-q", repoRoot, root])
    execFileSync("git", ["config", "user.email", "fixture@example.invalid"], { cwd: root })
    execFileSync("git", ["config", "user.name", "fixture"], { cwd: root })
    const review = await buildLifecycleSourceReview(root)
    const { mkdirSync, writeFileSync } = await import("node:fs")
    for (const target of [REVIEW_PATHS.carrier, REVIEW_PATHS.review, REVIEW_PATHS.summary125])
      mkdirSync(path.dirname(path.join(root, target)), { recursive: true })
    writeFileSync(path.join(root, REVIEW_PATHS.carrier), `${JSON.stringify(review.carrier)}\n`)
    writeFileSync(path.join(root, REVIEW_PATHS.review), review.reviewMarkdown)
    writeFileSync(path.join(root, REVIEW_PATHS.summary125), review.summaryMarkdown)
    execFileSync("git", ["add", REVIEW_PATHS.carrier, REVIEW_PATHS.review, REVIEW_PATHS.summary125], { cwd: root })
    execFileSync("git", ["commit", "-qm", "review fixture"], { cwd: root })
    const checked = await checkPublishedLifecycleSourceReview(root)
    expect(checked.carrier.findingCount).toBe(0)
    expect(checked.carrier.plan126Eligible).toBe(true)
    expect(checked.carrier.authorizesExecution).toBe(false)
  })
})
