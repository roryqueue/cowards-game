import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import {
  AUTHORITY_KEYS,
  PLAN_106_COMMIT,
  PLAN_106_PATHS,
  PLAN_128_PATHS,
  REQUIREMENT_IDS,
  assertAggregateProjection,
  assertCommittedAuditCarrier,
  assertDispositionProjection,
  assertFinalReviewGate,
  assertStructuredProofCoverage,
  assertTrackingUnchanged,
  auditFinalConvergence,
  classifyRequirements,
  classifyPhase262Paths,
  deriveHistoricalInventory,
  publishReviewSet,
  projectFinalAuthority,
} from "./check-v1-38-plan-262-127-final-convergence-v1"

const root = process.cwd()

describe("Plan 262-127 final convergence", () => {
  it("freezes all 16 requirements exactly once", () => {
    expect(REQUIREMENT_IDS).toHaveLength(16)
    expect(new Set(REQUIREMENT_IDS).size).toBe(16)
  })

  it("derives the complete current topology and sole Plan 106 summary delta", async () => {
    const result = await auditFinalConvergence(root)
    expect(result.findings).toEqual([])
    expect(result.inventory.counts.summaries).toBe(121)
    expect(result.inventory.counts.total).toBe(435)
    expect(result.historicalInventory.counts.summaries).toBe(120)
    expect(result.historicalInventory.counts.total).toBe(434)
    expect(result.inventoryDelta).toEqual([
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-106-SUMMARY.md",
    ])
  }, 180_000)

  it("classifies every active and historical plan once", async () => {
    const result = await auditFinalConvergence(root)
    expect(result.inventory.counts.activePlans).toBe(128)
    expect(result.inventory.counts.historicalPlans).toBe(18)
    expect(result.dag.nodeCount).toBe(146)
    expect(result.dag.duplicateIds).toEqual([])
    expect(result.dag.missingDependencies).toEqual([])
    expect(result.dag.cycles).toEqual([])
  }, 180_000)

  it("authenticates historical source review, readiness and exact Plan 106 commit", async () => {
    const result = await auditFinalConvergence(root)
    expect(result.custody.sourceCommit).toBe(
      "69ef5511d6f64f302073dccb71aebda70adc465e",
    )
    expect(result.custody.reviewRoot).toBe(
      "sha256:d1a79571d662ac63f4ffcb97765e15d074a9f0c89a6a5fe25f1139464565fe6d",
    )
    expect(result.custody.readinessRoot).toBe(
      "sha256:64eeba53ce869e2fd421872e642fbdda7e8996a6d5827c4e32649581ccca8350",
    )
    expect(result.custody.plan106Commit).toBe(PLAN_106_COMMIT)
    expect(result.custody.plan106Paths).toEqual([...PLAN_106_PATHS].sort())
  }, 180_000)

  it("proves aggregate-only privacy and completed owner-local retirement", async () => {
    const result = await auditFinalConvergence(root)
    expect(result.aggregate.rawEvidenceRetired).toBe(true)
    expect(result.aggregate.forbiddenProjectionKeys).toEqual([])
    expect(result.aggregate.independentCustodyClaimed).toBe(false)
    expect(result.aggregate.assuranceLimitation).toBe(
      "single_operator_local_seal_v1_no_hostile_same_uid",
    )
    expect(result.cleanup.rootSuccessorLocks).toBe(36)
  }, 180_000)

  it("keeps the exhausted 0/540 branch non-authorizing and Route-12 absent", async () => {
    const result = await auditFinalConvergence(root)
    expect(result.branch).toMatchObject({
      name: "gaps",
      producerDisposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      route12Present: false,
      reproductionPresent: false,
    })
    expect(Object.values(result.authority)).toEqual(
      AUTHORITY_KEYS.map(() => false),
    )
  }, 180_000)

  it("authenticates Plan 121 metadata correction and full proof coverage", async () => {
    const result = await auditFinalConvergence(root)
    expect(result.metadataCorrection.valid).toBe(true)
    expect(result.proofCoverage.requirements).toBe(16)
    expect(result.proofCoverage.inventoryPaths).toBe(435)
  }, 180_000)

  it("rejects inventory deltas other than the sole Plan 106 summary", () => {
    const current = classifyPhase262Paths([
      "x/262-01-PLAN.md",
      "x/262-106-SUMMARY.md",
      "x/262-107-SUMMARY.md",
      "x/262-VALIDATION.md",
      "x/262-VERIFICATION.md",
      "x/dormant/carrier.md",
      "x/archived/262-03-HISTORICAL.md",
      "x/262-01-REVIEW.md",
    ], "x")
    expect(() => deriveHistoricalInventory(current, "x/262-106-SUMMARY.md"))
      .not.toThrow()
    expect(() => deriveHistoricalInventory(current, "x/missing.md"))
      .toThrow(/SOLE_106_SUMMARY_DELTA/)
  })

  it("rejects receipt identities and paths in aggregate projections", () => {
    expect(() => assertAggregateProjection({ receiptPath: "/private/a" }))
      .toThrow(/AGGREGATE_PRIVACY/)
    expect(() => assertAggregateProjection({ nested: { receiptIdentity: "x" } }))
      .toThrow(/AGGREGATE_PRIVACY/)
    expect(() => assertAggregateProjection({ rawEvidence: "receipt-owner@example.com" }))
      .toThrow(/AGGREGATE_SCHEMA/)
    const actual = JSON.parse(readFileSync(
      ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v4.json",
      "utf8",
    ))
    expect(assertAggregateProjection(actual).aggregateRoot).toMatch(/^sha256:/)
  })

  it("rejects contradictory requirement checklist and trace classifications", () => {
    const actual = readFileSync(".planning/REQUIREMENTS.md", "utf8")
    expect(Object.keys(classifyRequirements(actual))).toHaveLength(16)
    expect(() => classifyRequirements(actual.replace(
      "| ADMIT-01 | Phase 262 | Complete |",
      "| ADMIT-01 | Phase 262 | Blocked |",
    ))).toThrow(/REQUIREMENT_ADMIT-01_STATUS/)
    expect(() => classifyRequirements(actual.replace(
      "- [ ] **ADMIT-03**:",
      "- [x] **ADMIT-03**:",
    ))).toThrow(/REQUIREMENT_ADMIT-03_STATUS/)
  })

  it("prospective later-head gates reject proof, tracking and disposition drift", async () => {
    const result = await auditFinalConvergence(root)
    const validation = readFileSync(
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VALIDATION.md",
      "utf8",
    )
    const verification = readFileSync(
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VERIFICATION.md",
      "utf8",
    )
    expect(() => assertStructuredProofCoverage(
      validation.replace(
        "| ADMIT-01 | COVERED | SATISFIED |",
        "| ADMIT-01 | COVERED | BLOCKED |",
      ),
      verification,
      result.historicalInventory,
    )).toThrow(/PROOF_REQUIREMENT_ADMIT-01/)
    expect(() => assertTrackingUnchanged(
      { requirements: "phase263PlanningAuthorized:true" },
      { requirements: "phase263PlanningAuthorized:false" },
    )).toThrow(/LATER_HEAD_TRACKING_DRIFT/)
    const aggregate = JSON.parse(readFileSync(
      ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v4.json",
      "utf8",
    ))
    const disposition = JSON.parse(readFileSync(
      ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v4.json",
      "utf8",
    ))
    expect(assertDispositionProjection(disposition, aggregate).dispositionRoot)
      .toMatch(/^sha256:/)
    expect(() => assertDispositionProjection({
      ...disposition,
      assuranceFindings: ["raw-receipt-owner@example.com"],
    }, aggregate)).toThrow(/DISPOSITION_BRANCH/)
    expect(() => assertDispositionProjection({
      ...disposition,
      counts: { ...disposition.counts, freshAccepted: 1 },
    }, aggregate)).toThrow(/DISPOSITION_BRANCH/)
  })

  it("allows Phase 263 planning only for exact clean pass", () => {
    expect(projectFinalAuthority("gaps").phase263PlanningAuthorized).toBe(false)
    const pass = projectFinalAuthority("pass")
    expect(pass.phase263PlanningAuthorized).toBe(true)
    expect(pass.phase263ExecutionAuthorized).toBe(false)
    for (const key of AUTHORITY_KEYS)
      if (key !== "phase263PlanningAuthorized") expect(pass[key]).toBe(false)
  })

  it("closes missing, stale, mismatched and authorizing review gates", () => {
    const valid = {
      schemaVersion: "v1.38-plan-262-127-final-convergence-review-v1",
      findingCount: 0,
      plan128Eligible: true,
      authorizesExecution: false,
      sourceCommit: "a".repeat(40),
      reviewRoot: `sha256:${"b".repeat(64)}`,
    }
    expect(() => assertFinalReviewGate(undefined, valid.sourceCommit))
      .toThrow(/REVIEW_MISSING/)
    expect(() => assertFinalReviewGate({ ...valid, findingCount: 1 }, valid.sourceCommit))
      .toThrow(/REVIEW_NOT_LITERAL_ZERO/)
    expect(() => assertFinalReviewGate({ ...valid, plan128Eligible: false }, valid.sourceCommit))
      .toThrow(/REVIEW_NOT_LITERAL_ZERO/)
    expect(() => assertFinalReviewGate({ ...valid, authorizesExecution: true }, valid.sourceCommit))
      .toThrow(/REVIEW_AUTHORITY/)
    expect(() => assertFinalReviewGate(valid, "c".repeat(40)))
      .toThrow(/REVIEW_STALE/)
  })

  it("rejects a rooted carrier redirected to an older ancestor", () => {
    const carrier = JSON.parse(readFileSync(
      ".planning/artifacts/v1.38-plan-262-127-final-convergence-review-v1.json",
      "utf8",
    ))
    const redirected = { ...carrier, sourceCommit: PLAN_106_COMMIT }
    delete redirected.reviewRoot
    const normalize = (value: any): any => Array.isArray(value)
      ? value.map(normalize)
      : value !== null && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).sort(([left], [right]) =>
          left.localeCompare(right)).map(([key, child]) => [key, normalize(child)]))
        : value
    const canonical = `${JSON.stringify(normalize(redirected))}\n`
    redirected.reviewRoot = `sha256:${createHash("sha256").update(
      `v1.38:plan-262:127:final-convergence-review:v1\0${canonical}`,
    ).digest("hex")}`
    expect(() => assertCommittedAuditCarrier(root, redirected))
      .toThrow(/DEFAULT_AUDIT_SOURCE/)
  })

  it("preflights all review destinations before a third-file drift can write", () => {
    const fixture = mkdtempSync(path.join(tmpdir(), "plan127-publication-"))
    const entries = [
      [".planning/artifacts/v1.38-plan-262-127-final-convergence-review-v1.json", "old carrier\n"],
      [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-127-REVIEW.md", "old review\n"],
      [".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-127-SUMMARY.md", "old summary\n"],
    ] as const
    try {
      execFileSync("git", ["init", "-q"], { cwd: fixture })
      execFileSync("git", ["config", "user.email", "plan127@example.invalid"], { cwd: fixture })
      execFileSync("git", ["config", "user.name", "Plan 127 Test"], { cwd: fixture })
      for (const [repoPath, contents] of entries) {
        const target = path.join(fixture, repoPath)
        mkdirSync(path.dirname(target), { recursive: true })
        writeFileSync(target, contents)
      }
      execFileSync("git", ["add", ...entries.map(([repoPath]) => repoPath)], { cwd: fixture })
      execFileSync("git", ["commit", "-q", "-m", "fixture"], { cwd: fixture })
      const third = path.join(fixture, entries[2][0])
      writeFileSync(third, "dirty summary\n")
      const before = entries.map(([repoPath]) => readFileSync(path.join(fixture, repoPath)))
      expect(() => publishReviewSet(fixture, entries.map(([repoPath]) => ({
        repoPath,
        contents: `new ${repoPath}\n`,
      })))).toThrow(/REVIEW_REPLACEMENT_DRIFT/)
      expect(entries.map(([repoPath]) => readFileSync(path.join(fixture, repoPath))))
        .toEqual(before)
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  it("freezes the exact atomic Plan 128 path set", () => {
    expect(PLAN_128_PATHS).toEqual([
      ".planning/REQUIREMENTS.md",
      ".planning/ROADMAP.md",
      ".planning/STATE.md",
      ".planning/artifacts/v1.38-phase-262-final-eligibility-v1.json",
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-128-SUMMARY.md",
    ])
  })
})
