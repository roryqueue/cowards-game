import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { LEAN_AUTHORITY_FALSE, hashLeanValue, reduceLeanExecutions, buildLeanSchedule, LEAN_CURRENT_FORMATION_ROOT, leanRequestRealismRoot } from "./lib/v1-38-lean-runner-feasibility.js"
import {
  LEAN_CORRECTIVE_ARTIFACT_PATHS,
  LEAN_CORRECTIVE_V2_ARTIFACT_PATHS,
  LEAN_CORRECTIVE_V3_ARTIFACT_PATHS,
  LEAN_CORRECTIVE_V4_ARTIFACT_PATHS,
  LEAN_ARTIFACT_PATHS,
  LEAN_EXECUTABLE_CLOSURE_PATHS,
  assertLeanStatus,
  assertLeanCorrectiveAdmissionStatus,
  assertLeanCorrectiveFreshEffectsAbsent,
  createLeanCorrectiveChildOwnership,
  validateLeanCorrectiveChildOwnership,
  recoverLeanCorrectiveOrphanInjected,
  LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH,
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
  renderLeanReadinessV3,
  renderLeanSourceReviewV3,
  renderLeanTrackingCarrier,
  checkLeanCorrectiveRecoveryOnlyStructure,
  checkLeanCorrectiveManifestV2,
  checkLeanCorrectiveSourceReviewV2,
  checkLeanCorrectiveReviewOutcomeV2,
  renderLeanCorrectiveManifestV3,
  renderLeanCorrectiveSourceReviewV3,
  renderLeanCorrectiveReadinessV3,
  checkLeanCorrectiveReadinessV3,
  checkLeanCorrectiveReadinessV4,
  deriveLeanCorrectiveFreshEffects,
  renderLeanCorrectiveManifestV4,
  renderLeanCorrectiveReadinessV4,
  renderLeanCorrectiveSourceReviewV4,
  createLeanCorrectiveInterruptionTombstone,
  validateLeanCorrectiveInterruptionTombstone,
  validateLeanDiagnosticCustody,
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

  it("fails corrective admission on tracked drift and permits only stage-exact operational residue", () => {
    const lock = `.v138-successor-${"a".repeat(64)}.lock`
    expect(() => assertLeanCorrectiveAdmissionStatus(`?? ${lock}\n`, [])).not.toThrow()
    expect(() => assertLeanCorrectiveAdmissionStatus(
      `?? ${lock}\n?? .planning/artifacts/v1.38-lean-runner-corrective-invocation-v2.json\n`,
      [".planning/artifacts/v1.38-lean-runner-corrective-invocation-v2.json"],
    )).not.toThrow()
    expect(() => assertLeanCorrectiveAdmissionStatus(" M scripts/run-v1-38-lean-runner-feasibility.ts\n", [])).toThrow(/LEAN_WORKTREE_DIRTY/u)
    expect(() => assertLeanCorrectiveAdmissionStatus("?? .planning/artifacts/v1.38-lean-runner-corrective-terminal-v2.json\n", [])).toThrow(/LEAN_WORKTREE_DIRTY/u)
  })

  it("rejects either pre-existing fresh corrective effect before launch", () => {
    expect(() => assertLeanCorrectiveFreshEffectsAbsent(false, false)).not.toThrow()
    expect(() => assertLeanCorrectiveFreshEffectsAbsent(true, false)).toThrow(/LEAN_CORRECTIVE_INVOCATION_EXISTS/u)
    expect(() => assertLeanCorrectiveFreshEffectsAbsent(false, true)).toThrow(/LEAN_CORRECTIVE_TERMINAL_EXISTS/u)
    expect(() => assertLeanCorrectiveFreshEffectsAbsent(true, true)).toThrow()
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
    expect(LEAN_ARTIFACT_PATHS.sourceReview).toBe(".planning/artifacts/v1.38-lean-runner-source-review-v3.json")
    expect(LEAN_ARTIFACT_PATHS.readiness).toBe(".planning/artifacts/v1.38-lean-runner-readiness-v3.json")
    expect(LEAN_ARTIFACT_PATHS.adjudication).toBe(".planning/artifacts/v1.38-lean-runner-adjudication-v1.json")
    expect(LEAN_ARTIFACT_PATHS.eligibility).toBe(".planning/artifacts/v1.38-phase-262-lean-eligibility-v1.json")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("apps/runtime-service/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/engine/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/spec/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("packages/persistence/src")
    expect(LEAN_EXECUTABLE_CLOSURE_PATHS).toContain("pnpm-lock.yaml")
  })

  it("binds corrective destinations without reviving first-attempt paths", () => {
    expect(LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation).toBe(".planning/artifacts/v1.38-lean-runner-corrective-invocation-v2.json")
    expect(LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal).toBe(".planning/artifacts/v1.38-lean-runner-corrective-terminal-v2.json")
    expect(Object.values(LEAN_CORRECTIVE_ARTIFACT_PATHS)).not.toContain(LEAN_ARTIFACT_PATHS.invocation)
    expect(Object.values(LEAN_CORRECTIVE_ARTIFACT_PATHS)).not.toContain(LEAN_ARTIFACT_PATHS.terminal)
  })

  it("keeps failed v1/v2/v3 trust paths historical and admits only fresh v4", () => {
    expect(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest).toMatch(/manifest-v2\.json$/u)
    expect(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.readiness).toMatch(/readiness-v2\.json$/u)
    expect(LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest).toMatch(/manifest-v3\.json$/u)
    expect(LEAN_CORRECTIVE_ARTIFACT_PATHS.manifest).toBe(LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.manifest)
    const manifestV2 = checkLeanCorrectiveManifestV2(process.cwd(), JSON.parse(readFileSync(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest, "utf8")))
    const reviewV2 = JSON.parse(readFileSync(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.sourceReview, "utf8"))
    expect(checkLeanCorrectiveSourceReviewV2(manifestV2, reviewV2).findingCount).toBe(2)
    expect(checkLeanCorrectiveReviewOutcomeV2(manifestV2, reviewV2, undefined)).toBeUndefined()
    expect(() => checkLeanCorrectiveReviewOutcomeV2(manifestV2, reviewV2, { schemaVersion: "v1.38-lean-runner-corrective-readiness-v2" })).toThrow(/NONZERO_REVIEW/u)

    const manifestV3 = renderLeanCorrectiveManifestV3(process.cwd(), "HEAD")
    const reviewV3 = renderLeanCorrectiveSourceReviewV3(manifestV3, [])
    const readinessV3 = renderLeanCorrectiveReadinessV3(manifestV3, reviewV3)
    expect(checkLeanCorrectiveReadinessV3(manifestV3, reviewV3, readinessV3)).toEqual(readinessV3)
    expect(() => checkLeanCorrectiveReadinessV3(manifestV3, reviewV2, readinessV3)).toThrow()
    expect(() => checkLeanCorrectiveReadinessV3(manifestV3, { ...reviewV3, findingCount: 1 }, readinessV3)).toThrow()
  }, 30_000)

  it("rejects mutation of every v2 predecessor contract leaf", () => {
    const original = JSON.parse(readFileSync(LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest, "utf8")) as Record<string, unknown>
    const leaves: Array<readonly (string | number)[]> = []
    const collect = (value: unknown, trail: readonly (string | number)[]): void => {
      if (value !== null && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) collect(child, [...trail, Array.isArray(value) ? Number(key) : key])
      } else leaves.push(trail)
    }
    collect(original, [])
    expect(leaves.length).toBeGreaterThan(50)
    for (const trail of leaves) {
      const mutated = structuredClone(original) as Record<string, unknown>
      let owner: Record<string | number, unknown> = mutated
      for (const key of trail.slice(0, -1)) owner = owner[key] as Record<string | number, unknown>
      const key = trail.at(-1)!
      const current = owner[key]
      owner[key] = typeof current === "boolean" ? !current : typeof current === "number" ? current + 1 : `${String(current)}-mutated`
      expect(() => checkLeanCorrectiveManifestV2(process.cwd(), mutated), trail.join(".")).toThrow()
    }
  }, 60_000)

  it("binds Plan 165 summary and derives v4 effect presence from disk", () => {
    const manifest = renderLeanCorrectiveManifestV4(process.cwd(), "HEAD")
    expect(manifest.plan165Summary).toEqual({
      commit: "18251a883e77b3a7b0845074faae4d8365ab84d5",
      blob: "96fecf67546c3c5b9eaa0a72901fbe3f6978b3c4",
      contentRoot: "sha256:4407a2284cfd1086bb67b7de497424156983a6dedec9684f288069e1ea8788c4",
    })
    expect(Object.values(manifest.freshCorrectiveEffects)).toEqual([false, false, false, false, false, false])
    const review = renderLeanCorrectiveSourceReviewV4(manifest, [])
    const readiness = renderLeanCorrectiveReadinessV4(manifest, review)
    expect(checkLeanCorrectiveReadinessV4(manifest, review, readiness)).toEqual(readiness)
    expect(LEAN_CORRECTIVE_V4_ARTIFACT_PATHS.readiness).toMatch(/readiness-v4\.json$/u)

    const dir = mkdtempSync(path.join(tmpdir(), "lean-effects-")); temporary.push(dir)
    expect(deriveLeanCorrectiveFreshEffects(dir)).toEqual({
      readinessV4Present: false, invocationV2Present: false, terminalV2Present: false,
      adjudicationV2Present: false, eligibilityV2Present: false, childOwnershipPresent: false,
    })
    const target = path.resolve(dir, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)
    const parent = path.dirname(target)
    mkdirSync(parent, { recursive: true })
    writeFileSync(target, "{}\n")
    expect(deriveLeanCorrectiveFreshEffects(dir).invocationV2Present).toBe(true)
  }, 30_000)

  it("accepts only epistemically limited diagnostic custody", () => {
    const custody = JSON.parse(readFileSync(".planning/artifacts/v1.38-lean-runner-diagnostic-custody-v1.json", "utf8"))
    expect(validateLeanDiagnosticCustody(custody)).toEqual(custody)
    for (const mutation of [
      { rawEvidencePresent: true }, { independentlyVerifiable: true }, { persisted: true },
      { liveInvocation: true }, { charged: true }, { evidenceAdmissible: true },
      { outcomes: [] },
    ]) expect(() => validateLeanDiagnosticCustody({ ...custody, ...mutation })).toThrow(/LEAN_DIAGNOSTIC_CUSTODY/u)
  })

  it("proves recovery-only source has no launch capability", () => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8")
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker)).not.toThrow()
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(
      source.replace(
        "cleanup: async () => { await checker.recoverLeanCorrectiveOrphan(repoRoot) }",
        "cleanup: async () => { fork(); await checker.recoverLeanCorrectiveOrphan(repoRoot) }",
      ),
      checker,
    )).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { buildLeanSchedule();",
    ))).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
    const transitiveChecker = checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      "const unsafeRecoveryHop = (): void => { buildLeanSchedule() }\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { unsafeRecoveryHop();",
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, transitiveChecker)).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
    const computedCallback = source.replace(
      "cleanup: async () => { await checker.recoverLeanCorrectiveOrphan(repoRoot) }",
      "cleanup: async () => { const recover = checker.recoverLeanCorrectiveOrphan; await recover(repoRoot) }",
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(computedCallback, checker)).toThrow(/LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL/u)

    const importedChecker = checker.replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      "import { firstHop as importedFirstHop } from './recovery-hop.js'\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { importedFirstHop();",
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, importedChecker, {
      "./recovery-hop.js": "export { secondHop as firstHop } from './recovery-second.js'",
      "./recovery-second.js": "import * as lean from './lib/v1-38-lean-runner-feasibility.js'; export const secondHop = () => { const callback = () => lean.buildLeanSchedule(); callback() }",
      "./lib/v1-38-lean-runner-feasibility.js": readFileSync("scripts/lib/v1-38-lean-runner-feasibility.ts", "utf8"),
    })).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, importedChecker, {})).toThrow(/LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL/u)
  })

  it("rejects the exact CR-168-01 function-declaration recovery bypass", () => {
    const source = readFileSync("scripts/run-v1-38-lean-runner-feasibility.ts", "utf8")
    const checker = readFileSync("scripts/check-v1-38-lean-admission.ts", "utf8").replace(
      "export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {",
      "function unsafeRecoveryHop(): void { buildLeanSchedule() }\nexport const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => { unsafeRecoveryHop();",
    )
    expect(() => checkLeanCorrectiveRecoveryOnlyStructure(source, checker)).toThrow(/LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY/u)
  })

  it("uses a schedule-free exact interruption tombstone", () => {
    const invocation = {
      schemaVersion: "v1.38-lean-runner-corrective-invocation-v2", sourceCommit: "a".repeat(40),
      manifestRoot: "sha256:" + "1".repeat(64), sourceReviewRoot: "sha256:" + "2".repeat(64),
      readinessRoot: "sha256:" + "3".repeat(64), firstInvocationRoot: "sha256:" + "4".repeat(64),
      firstTerminalRoot: "sha256:" + "5".repeat(64), diagnosticCustodyRoot: "sha256:" + "6".repeat(64),
      childCapabilityRoot: "sha256:" + "7".repeat(64), claimClass: "fixture_feasibility_only",
      correctiveInvocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE,
    } as const
    const tombstone = createLeanCorrectiveInterruptionTombstone(invocation)
    expect(validateLeanCorrectiveInterruptionTombstone(tombstone, invocation)).toEqual(tombstone)
    expect(JSON.stringify(tombstone)).not.toMatch(/cellId|schedule|evidence/u)
    expect(() => validateLeanCorrectiveInterruptionTombstone({ ...tombstone, chargedMatches: 1 }, invocation)).toThrow()
  })

  it("strictly binds corrective child ownership to invocation, process group, selector, and token", () => {
    const ownership = createLeanCorrectiveChildOwnership(
      "sha256:" + "1".repeat(64),
      4312,
      4312,
      "b".repeat(64),
    )
    expect(LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH).toBe(".v138-lean-corrective-child-ownership.json")
    expect(validateLeanCorrectiveChildOwnership(ownership)).toEqual(ownership)
    for (const mutation of [
      { childPid: 0 },
      { processGroupId: 4313 },
      { selector: "--run-reviewed-corrective-gate" },
      { token: "short" },
      { commandArguments: ["--execute-reviewed-cell"] },
    ]) expect(() => validateLeanCorrectiveChildOwnership({ ...ownership, ...mutation })).toThrow(/LEAN_CORRECTIVE_CHILD_OWNERSHIP/u)
  })

  it("terminates only an authenticated active orphan and proves exit", async () => {
    const ownership = createLeanCorrectiveChildOwnership(
      "sha256:" + "1".repeat(64), 4312, 4312, "b".repeat(64),
    )
    const signals: string[] = []
    let alive = true
    await recoverLeanCorrectiveOrphanInjected(ownership, {
      expectedInvocationRoot: ownership.invocationRoot,
      commandForPid: () => `node scripts/run-v1-38-lean-runner-feasibility.ts --execute-reviewed-cell ${ownership.token}`,
      processGroupForPid: () => ownership.processGroupId,
      signalProcessGroup: (_group, signal) => { signals.push(signal); alive = false },
      processIsAlive: () => alive,
      wait: async () => undefined,
    })
    expect(signals).toEqual(["SIGTERM"])

    await expect(recoverLeanCorrectiveOrphanInjected(ownership, {
      expectedInvocationRoot: "sha256:" + "2".repeat(64),
      commandForPid: () => `node scripts/run-v1-38-lean-runner-feasibility.ts --execute-reviewed-cell ${ownership.token}`,
      processGroupForPid: () => ownership.processGroupId,
      signalProcessGroup: (_group, signal) => { signals.push(signal) },
      processIsAlive: () => true,
      wait: async () => undefined,
    })).rejects.toThrow(/LEAN_CORRECTIVE_CHILD_IDENTITY/u)
    expect(signals).toEqual(["SIGTERM"])

    for (const command of ["", `node other.ts --execute-reviewed-cell ${ownership.token}`, "node scripts/run-v1-38-lean-runner-feasibility.ts --execute-reviewed-cell wrong"]) {
      const rejectedSignals: string[] = []
      await expect(recoverLeanCorrectiveOrphanInjected(ownership, {
        expectedInvocationRoot: ownership.invocationRoot,
        commandForPid: () => command,
        processGroupForPid: () => ownership.processGroupId,
        signalProcessGroup: (_group, signal) => { rejectedSignals.push(signal) },
        processIsAlive: () => true,
        wait: async () => undefined,
      })).rejects.toThrow(/LEAN_CORRECTIVE_CHILD_(?:STALE|IDENTITY)/u)
      expect(rejectedSignals).toEqual([])
    }

    const groupSignals: string[] = []
    await expect(recoverLeanCorrectiveOrphanInjected(ownership, {
      expectedInvocationRoot: ownership.invocationRoot,
      commandForPid: () => `node scripts/run-v1-38-lean-runner-feasibility.ts --execute-reviewed-cell ${ownership.token}`,
      processGroupForPid: () => ownership.processGroupId + 1,
      signalProcessGroup: (_group, signal) => { groupSignals.push(signal) },
      processIsAlive: () => true,
      wait: async () => undefined,
    })).rejects.toThrow(/LEAN_CORRECTIVE_CHILD_IDENTITY/u)
    expect(groupSignals).toEqual([])
  })

  it("requires literal-zero non-authorizing review before readiness", () => {
    const manifest = renderLeanManifest(process.cwd(), process.env.LEAN_TEST_SOURCE_COMMIT ?? "HEAD")
    const review = renderLeanSourceReviewV3(manifest, [])
    expect(() => checkLeanSourceReview(manifest, review)).not.toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, findingCount: 1 })).toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, extra: true })).toThrow()
    expect(() => checkLeanSourceReview(manifest, { ...review, findingCount: 1, findings: [{ diagnostics: "private" }] })).toThrow(/LEAN_PRIVATE_DATA/u)
    const readiness = renderLeanReadinessV3(manifest, review)
    expect(() => checkLeanReadiness(manifest, review, readiness)).not.toThrow()
    expect(() => checkLeanReadiness(manifest, review, { ...readiness, extra: true })).toThrow()
    expect(checkLeanReviewOutcome(manifest, review, readiness)).toEqual(readiness)
    const blocked = renderLeanSourceReviewV3(manifest, [{ id: "B1", severity: "critical", status: "open", summary: "still open" }])
    expect(checkLeanReviewOutcome(manifest, blocked, undefined)).toBeUndefined()
    expect(() => checkLeanReviewOutcome(manifest, blocked, readiness)).toThrow(/LEAN_READINESS_FOR_NONZERO_REVIEW/u)
    expect(() => renderLeanSourceReviewV3(manifest, [
      { id: "", severity: "warning", status: "open", summary: "empty identifier" },
    ])).toThrow(/LEAN_SOURCE_REVIEW_INVALID/u)
    expect(() => renderLeanSourceReviewV3(manifest, [
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

  it("authenticates immutable Plan 154 v2 review bytes", () => {
    const checkHistoricalV2 = (leanAdmissionModule as unknown as {
      checkHistoricalLeanSourceReviewV2Bytes: (bytes: Buffer) => void
    }).checkHistoricalLeanSourceReviewV2Bytes
    expect(() => checkHistoricalV2(Buffer.from("mutated v2 review", "utf8"))).toThrow(/LEAN_HISTORICAL_SOURCE_REVIEW_V2_DRIFT/u)
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
      schemaVersion: "v1.38-lean-runner-source-review-v3",
      sourceCommit: manifest.source.commit,
      manifestRoot: hashLeanValue(manifest),
      findingCount: 0,
      findings: [],
      admitsExecution: false,
      authority: LEAN_AUTHORITY_FALSE,
    })
    const readiness = checkLeanReadiness(manifest, review, {
      schemaVersion: "v1.38-lean-runner-readiness-v3",
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
