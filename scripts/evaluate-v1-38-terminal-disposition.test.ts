import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import {
  buildV138TerminalDisposition,
  checkV138TerminalDisposition,
  generateV138TerminalDisposition,
  renderV138TerminalDisposition,
  validateV138TerminalDisposition,
  writeV138TerminalDisposition,
} from "./evaluate-v1-38-terminal-disposition.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const temporaryRoots: string[] = []
const clone = <T>(value: T): T => globalThis.structuredClone(value)

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe("Phase 262 terminal defer disposition", () => {
  it("freezes the exact operator fact, stopped branch, and non-authorizing terminal state", () => {
    const result = generateV138TerminalDisposition(repoRoot)

    expect(result).toMatchObject({
      schemaVersion: "v1.38-phase-262-terminal-deferment-v1",
      dispositionKind: "phase_262_terminal_deferment",
      identityDomain: "cowards-game:v1.38:phase-262-terminal-deferment:v1",
      operatorFact: {
        fact: "no_external_custody_system",
        externalCustodySystem: "absent_confirmed",
      },
      custody: {
        status: "unavailable",
        seal01: "unmet",
        satisfiesSeal01: false,
        publicCustodyReferencePresent: false,
      },
      admission: {
        routeTerminal: "calibration_stopped",
        admit03: "blocked",
        authorityExpired: true,
        noRetry: true,
        freshCharged: 0,
        freshAccepted: 0,
        requiredAccepted: 540,
        reproductionV10Present: false,
      },
      policy: {
        status: "ready",
        authorizing: false,
        preSearchPolicyRoot: "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382",
      },
      lifecycle: {
        phaseStatus: "deferred_incomplete",
        verificationStatus: "gaps_found",
        milestoneStatus: "paused_deferred",
        totalPlans: 36,
        completedSummariesBeforeCloseout: 34,
        incompleteBeforeCloseout: ["262-42", "262-43"],
        incompleteAfterCloseout: ["262-43"],
      },
      resumption: {
        requiresBothPrerequisites: true,
        externalCustodySystemRequired: true,
        separatelyPlannedLiteralAdmit03PassRouteRequired: true,
        action: "fresh_gsd_plan_phase_262",
        archivedPlan26240MayResume: false,
        dormantPlan26241MayExecute: false,
        pendingPlan26243MayBecomeAuthority: false,
      },
      denials: {
        satisfiesAdmit03: false,
        satisfiesSeal01: false,
        candidateSearchAuthorized: false,
        phase263Authorized: false,
        formationMaterializationAuthorized: false,
        productionAuthorized: false,
      },
      toolingDependency: "frozen_replay_commit_unreachable",
    })
    expect(Object.keys(result.denials)).toHaveLength(6)
    expect(result.dispositionRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("binds archived Plan 262-40, dormant Plan 262-41, and pending Plan 262-43 exactly", () => {
    const result = generateV138TerminalDisposition(repoRoot)
    expect(result.protectedLineage).toEqual({
      archivedPlan26240: {
        path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-40-HISTORICAL.md",
        sha256: "sha256:e745ba878fcd0090a968762f314c787dae86896d27f2bc8a72498d684ed39231",
        resumable: false,
      },
      dormantPlan26241: {
        path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/dormant/262-41-ACTIVATION-CONTRACT.md",
        sha256: "sha256:5d42af52835c2bbd8eaba1868d50bde1384d143f7f8822b6a9e725bac1075641",
        executable: false,
      },
      pendingPlan26243: {
        path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-43-PLAN.md",
        summaryPresent: false,
        requirementCredit: false,
        authoritySource: false,
      },
    })
  })

  it("rejects missing, extra, renamed, widened, or flipped terminal fields", () => {
    const exact = generateV138TerminalDisposition(repoRoot)
    const mutations: unknown[] = []
    for (const key of Object.keys(exact)) {
      const missing = clone(exact) as unknown as Record<string, unknown>
      delete missing[key]
      mutations.push(missing)
    }
    mutations.push({ ...clone(exact), waiver: false })
    mutations.push({ ...clone(exact), schemaVersion: "v1.38-phase-262-terminal-deferment-v2" })
    mutations.push({ ...clone(exact), operatorFact: { ...exact.operatorFact, fact: "custody_unavailable" } })
    mutations.push({ ...clone(exact), custody: { ...exact.custody, satisfiesSeal01: true } })
    mutations.push({ ...clone(exact), admission: { ...exact.admission, freshAccepted: 540 } })
    mutations.push({ ...clone(exact), policy: { ...exact.policy, authorizing: true } })
    mutations.push({ ...clone(exact), lifecycle: { ...exact.lifecycle, phaseStatus: "complete" } })
    mutations.push({ ...clone(exact), resumption: { ...exact.resumption, action: "resume_262_43" } })
    mutations.push({ ...clone(exact), denials: { ...exact.denials, phase263Authorized: true } })
    mutations.push({ ...clone(exact), absences: { ...exact.absences, activationRootPresent: true } })

    for (const mutation of mutations) {
      expect(() => validateV138TerminalDisposition(mutation)).toThrow()
    }
  })

  it("is deterministic, source-bound, privacy-safe, and changes identity on valid source binding mutation", () => {
    const exact = generateV138TerminalDisposition(repoRoot)
    expect(renderV138TerminalDisposition(exact)).toBe(
      renderV138TerminalDisposition(generateV138TerminalDisposition(repoRoot)),
    )
    const changed = buildV138TerminalDisposition({
      sourceBindings: {
        ...exact.sourceBindings,
        preSearchPolicyArtifactSha256: `sha256:${"0".repeat(64)}`,
      },
    })
    expect(changed.dispositionRoot).not.toBe(exact.dispositionRoot)
    expect(JSON.stringify(exact)).not.toMatch(
      /StrategyMemory|SoldierMemory|objective payload|credential|token|DATABASE_URL|\/Users\/|private path|holdout preimage|evaluator state|raw diagnostic/iu,
    )
  })

  it("writes exclusively and check mode rejects committed-byte drift", () => {
    const fixtureRoot = mkdtempSync(path.join(tmpdir(), "v138-terminal-disposition-"))
    temporaryRoots.push(fixtureRoot)
    const target = path.join(fixtureRoot, ".planning/artifacts/v1.38-phase-262-terminal-deferment.json")
    const result = writeV138TerminalDisposition(repoRoot, target)
    expect(readFileSync(target, "utf8")).toBe(renderV138TerminalDisposition(result))
    expect(checkV138TerminalDisposition(repoRoot, target).dispositionRoot).toBe(result.dispositionRoot)
    expect(() => writeV138TerminalDisposition(repoRoot, target)).toThrow("V138_TERMINAL_DISPOSITION_ARTIFACT_EXISTS")
  })
})
