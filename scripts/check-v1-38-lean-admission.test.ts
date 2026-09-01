import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { LEAN_AUTHORITY_FALSE, hashLeanValue, reduceLeanExecutions, buildLeanSchedule, LEAN_CURRENT_FORMATION_ROOT, leanRequestRealismRoot } from "./lib/v1-38-lean-runner-feasibility.js"
import {
  LEAN_ARTIFACT_PATHS,
  LEAN_EXECUTABLE_CLOSURE_PATHS,
  assertLeanStatus,
  checkLeanReadiness,
  checkLeanSourceReview,
  validateLeanAdjudication,
  validateLeanEligibility,
  validateLeanInvocation,
  validateLeanInvocationLineage,
  validateLeanTerminalArtifact,
  createLeanInterruptedTerminal,
  checkLeanManifest,
  checkLeanReviewOutcome,
  parseLeanTrackingSurface,
  renderLeanManifest,
  renderLeanReadinessV2,
  renderLeanSourceReviewV2,
  renderLeanTrackingCarrier,
} from "./check-v1-38-lean-admission.js"
import * as leanAdmissionModule from "./check-v1-38-lean-admission.js"

const temporary: string[] = []
afterEach(() => temporary.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })))

describe("lean admission custody", () => {
  const passingTerminal = () => reduceLeanExecutions(buildLeanSchedule().map((cell) => ({
    ...cell,
    classification: "success" as const,
    cleanupComplete: true,
    orphanedChild: false,
    boardRealism: true,
    integrityValid: true,
    requestRealismRoot: leanRequestRealismRoot(cell),
    currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT,
    outcomeRoot: hashLeanValue({ cell: cell.baseCellId, kind: "outcome" }),
    finalStateRoot: hashLeanValue({ cell: cell.baseCellId, kind: "state" }),
    transitionEventRoot: hashLeanValue({ cell: cell.baseCellId, kind: "events" }),
    runtimeAccountingRoot: hashLeanValue({ cell: cell.baseCellId, kind: "accounting" }),
  })))
  it("permits only authenticated successor lock residue", () => {
    expect(() => assertLeanStatus(`?? .v138-successor-${"a".repeat(64)}.lock\n`)).not.toThrow()
    expect(() => assertLeanStatus(" M scripts/example.ts\n")).toThrow(/LEAN_WORKTREE_DIRTY/u)
    expect(() => assertLeanStatus("?? unexpected.txt\n")).toThrow(/LEAN_WORKTREE_DIRTY/u)
  })

  it("renders and checks exact committed source without effects", () => {
    const repoRoot = process.cwd()
    const sourceCommit = process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD"
    const manifest = renderLeanManifest(repoRoot, sourceCommit)
    expect(manifest.authority.phase263PlanningAuthorized).toBe(false)
    expect(manifest.formationMaterialized).toBe(false)
    expect(() => checkLeanManifest(repoRoot, manifest)).not.toThrow()
    expect(() => checkLeanManifest(repoRoot, { ...manifest, scheduleRoot: `sha256:${"0".repeat(64)}` })).toThrow()
    expect(() => checkLeanManifest(repoRoot, {
      ...manifest,
      source: {
        ...manifest.source,
        executableBlobs: { ...manifest.source.executableBlobs, "packages/spec/src": "0".repeat(40) },
      },
    })).toThrow(/LEAN_SOURCE_BLOB_DRIFT/u)
  }, 30_000)

  it("does not create invocation, terminal, readiness, or adjudication artifacts", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "lean-check-")); temporary.push(dir)
    expect(() => renderLeanManifest(dir, "HEAD")).toThrow()
  })

  it("uses the one canonical Plan 150-152 path map and full minimum closure", () => {
    expect(LEAN_ARTIFACT_PATHS.terminal).toBe(".planning/artifacts/v1.38-lean-runner-terminal.json")
    expect(LEAN_ARTIFACT_PATHS.readiness).toBe(".planning/artifacts/v1.38-lean-runner-readiness-v2.json")
    expect(LEAN_ARTIFACT_PATHS.adjudication).toBe(".planning/artifacts/v1.38-lean-runner-adjudication-v1.json")
    expect(LEAN_ARTIFACT_PATHS.eligibility).toBe(".planning/artifacts/v1.38-phase-262-lean-eligibility-v1.json")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("apps/runtime-service/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/engine/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/spec/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/persistence/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("pnpm-lock.yaml")
  })

  it("requires literal-zero non-authorizing review before readiness", () => {
    const manifest = renderLeanManifest(process.cwd(), process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD")
    const review = renderLeanSourceReviewV2(manifest, [])
    expect(() => checkLeanSourceReview(manifest, review)).not.toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, findingCount: 1 })).toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, extra: true })).toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, findingCount: 1, findings: [{ diagnostics: "private" }] })).toThrow(/LEAN_PRIVATE_DATA/u)
    const readiness = renderLeanReadinessV2(manifest, review)
    expect(() => checkLeanReadiness(manifest, review, readiness)).not.toThrow()
    expect(() => checkLeanReadiness(manifest, review, { ...readiness, extra: true })).toThrow()
    expect(checkLeanReviewOutcome(manifest, review, readiness)).toEqual(readiness)
    const blocked = renderLeanSourceReviewV2(manifest, [{ id: "B1", severity: "critical", status: "open", summary: "still open" }])
    expect(checkLeanReviewOutcome(manifest, blocked, undefined)).toBeUndefined()
    expect(() => checkLeanReviewOutcome(manifest, blocked, readiness)).toThrow(/LEAN_READINESS_FOR_NONZERO_REVIEW/u)
    expect(() => renderLeanSourceReviewV2(manifest, [
      { id: "", severity: "warning", status: "open", summary: "empty identifier" },
    ])).toThrow(/LEAN_SOURCE_REVIEW_INVALID/u)
    expect(() => renderLeanSourceReviewV2(manifest, [
      { id: "CR-DUPLICATE", severity: "critical", status: "open", summary: "first" },
      { id: "CR-DUPLICATE", severity: "warning", status: "open", summary: "second" },
    ])).toThrow(/LEAN_SOURCE_REVIEW_INVALID/u)
  })

  it("authenticates the immutable Plan 150 v1 review bytes", () => {
    const checkHistorical = (leanAdmissionModule as unknown as {
      checkHistoricalLeanSourceReviewBytes: (bytes: Buffer) => void
    }).checkHistoricalLeanSourceReviewBytes
    expect(() => checkHistorical(Buffer.from("mutated historical review", "utf8"))).toThrow(/LEAN_HISTORICAL_SOURCE_REVIEW_DRIFT/u)
  })

  it("selects one structural current branch and ignores historical prose", () => {
    const authority = Object.fromEntries(Object.keys(LEAN_AUTHORITY_FALSE).map((key) => [key, key === "phase263PlanningAuthorized" || key === "phase263ExecutionAuthorized"]))
    const eligibility = {
      schemaVersion: "v1.38-phase-262-lean-eligibility-v1",
      adjudicationRoot: "sha256:" + "a".repeat(64),
      admit03: "satisfied_under_revised_contract",
      phase262Complete: true,
      phase263PlanningEligible: true,
      phase263ExecutionEligible: true,
      authority,
    } as const
    const requirement = "- [x] **ADMIT-03**: satisfied_under_revised_contract; historical prose says blocked."
    expect(parseLeanTrackingSurface(".planning/REQUIREMENTS.md", requirement)).toEqual({ admit03: "satisfied_under_revised_contract" })
    expect(() => parseLeanTrackingSurface(".planning/REQUIREMENTS.md", `${requirement}\n${requirement}`)).toThrow(/LEAN_TRACKING_AMBIGUOUS/u)
    for (const trackingPath of [".planning/ROADMAP.md", ".planning/STATE.md", ".planning/v1.38-CURRENT-STATUS.md", ".planning/v1.38-v1.38-MILESTONE-AUDIT.md"] as const) {
      const carrier = renderLeanTrackingCarrier(trackingPath, eligibility)
      expect(parseLeanTrackingSurface(trackingPath, `Historical ADMIT-03 blocked.\n${carrier}`)).toEqual(expect.objectContaining({
        admit03: "satisfied_under_revised_contract", phase262Complete: true,
      }))
      expect(() => parseLeanTrackingSurface(trackingPath, `${carrier}\n${carrier}`)).toThrow(/LEAN_TRACKING_AMBIGUOUS/u)
      expect(() => parseLeanTrackingSurface(trackingPath, carrier.replace('"phase262Complete":true', '"phase262Complete":false'))).toThrow()
    }
  })

  it("strictly links invocation, terminal, adjudication, and eligibility roots", () => {
    const lineage = {
      sourceCommit: "a".repeat(40), manifestRoot: "sha256:" + "1".repeat(64),
      sourceReviewRoot: "sha256:" + "2".repeat(64), readinessRoot: "sha256:" + "3".repeat(64),
      childCapabilityRoot: "sha256:" + "4".repeat(64),
    } as const
    const invocation = validateLeanInvocation({
      schemaVersion: "v1.38-lean-runner-invocation-v1", ...lineage,
      claimClass: "fixture_feasibility_only", liveInvocationOrdinal: 1,
      authority: Object.fromEntries(Object.keys(LEAN_AUTHORITY_FALSE).map((key) => [key, false])),
    })
    const terminal = validateLeanTerminalArtifact({
      schemaVersion: "v1.38-lean-runner-terminal-v1",
      sourceCommit: lineage.sourceCommit,
      manifestRoot: lineage.manifestRoot,
      sourceReviewRoot: lineage.sourceReviewRoot,
      readinessRoot: lineage.readinessRoot,
      childCapabilityRoot: lineage.childCapabilityRoot,
      invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only",
      terminal: createLeanInterruptedTerminal(), authority: LEAN_AUTHORITY_FALSE,
    }, invocation)
    const adjudication = validateLeanAdjudication({
      schemaVersion: "v1.38-lean-runner-adjudication-v1",
      terminalRoot: hashLeanValue(terminal), reviewedResult: "invalid",
      findingCount: 0, findings: [], admitsEligibility: false,
      authority: LEAN_AUTHORITY_FALSE,
    }, terminal)
    expect(() => validateLeanEligibility({
      schemaVersion: "v1.38-phase-262-lean-eligibility-v1",
      adjudicationRoot: hashLeanValue(adjudication), admit03: "blocked",
      phase262Complete: false, phase263PlanningEligible: false,
      phase263ExecutionEligible: false, authority: LEAN_AUTHORITY_FALSE,
    }, adjudication)).not.toThrow()
  })

  it("rejects every invocation root that does not join the reviewed readiness chain", () => {
    const manifest = renderLeanManifest(process.cwd(), process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD")
    const review = checkLeanSourceReview(manifest, {
      schemaVersion: "v1.38-lean-runner-source-review-v2",
      sourceCommit: manifest.source.commit,
      manifestRoot: hashLeanValue(manifest),
      findingCount: 0,
      findings: [],
      admitsExecution: false,
      authority: LEAN_AUTHORITY_FALSE,
    })
    const readiness = checkLeanReadiness(manifest, review, {
      schemaVersion: "v1.38-lean-runner-readiness-v2",
      sourceCommit: manifest.source.commit,
      manifestRoot: hashLeanValue(manifest),
      sourceReviewRoot: hashLeanValue(review),
      findingCount: 0,
      plan151Eligible: true,
      liveInvocationLimit: 1,
      liveInvocationsConsumed: 0,
      correctiveRerunAuthorized: false,
      authority: LEAN_AUTHORITY_FALSE,
    })
    const invocation = {
      schemaVersion: "v1.38-lean-runner-invocation-v1",
      sourceCommit: readiness.sourceCommit,
      manifestRoot: readiness.manifestRoot,
      sourceReviewRoot: readiness.sourceReviewRoot,
      readinessRoot: hashLeanValue(readiness),
      childCapabilityRoot: "sha256:" + "4".repeat(64),
      claimClass: "fixture_feasibility_only",
      liveInvocationOrdinal: 1,
      authority: LEAN_AUTHORITY_FALSE,
    } as const
    expect(validateLeanInvocationLineage(readiness, invocation)).toEqual(invocation)
    for (const key of ["sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot"] as const) {
      const forged = { ...invocation, [key]: key === "sourceCommit" ? "f".repeat(40) : "sha256:" + "f".repeat(64) }
      expect(() => validateLeanInvocationLineage(readiness, forged)).toThrow(/LEAN_INVOCATION_LINEAGE_MISMATCH/u)
    }
  })

  it("does not allow a claimed pass to escalate eligibility when evidence rederives non-pass", () => {
    const lineage = {
      sourceCommit: "a".repeat(40), manifestRoot: "sha256:" + "1".repeat(64),
      sourceReviewRoot: "sha256:" + "2".repeat(64), readinessRoot: "sha256:" + "3".repeat(64),
      childCapabilityRoot: "sha256:" + "4".repeat(64),
    } as const
    const invocation = validateLeanInvocation({
      schemaVersion: "v1.38-lean-runner-invocation-v1", ...lineage,
      claimClass: "fixture_feasibility_only", liveInvocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE,
    })
    const derived = passingTerminal()
    const forged = { ...derived, result: "pass", evidence: derived.evidence.map((cell, index) => index === 0 ? {
      ...cell, classification: "system_failure", outcomeRoot: undefined, finalStateRoot: undefined,
      transitionEventRoot: undefined, runtimeAccountingRoot: undefined,
    } : cell) }
    expect(() => validateLeanTerminalArtifact({
      schemaVersion: "v1.38-lean-runner-terminal-v1", ...lineage,
      invocationRoot: hashLeanValue(invocation), privacy: "safe_aggregate_only",
      terminal: forged, authority: LEAN_AUTHORITY_FALSE,
    }, invocation)).toThrow()
  })
})
