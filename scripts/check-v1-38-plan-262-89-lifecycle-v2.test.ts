import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import {
  computeV138Plan26289LifecycleStatusRoot,
  evaluateV138Plan26289Branch,
  inspectV138Plan26289Topology,
  runV138Plan26289PostSummaryLifecycle,
} from "./check-v1-38-plan-262-89-lifecycle-v2.js"
import {
  computeV138Plan26288ActivationRoot,
  computeV138Plan26288DispositionRoot,
  V138_PLAN_262_88_PATHS,
} from "./check-v1-38-plan-262-88-bounded-retry-admission-v2.js"

const repoRoot = process.cwd()
const archiveBytes = readFileSync(
  path.join(
    repoRoot,
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-74-HISTORICAL.md",
  ),
)
const predecessor = JSON.parse(
  readFileSync(
    path.join(
      repoRoot,
      ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v1.json",
    ),
    "utf8",
  ),
)
const roots: string[] = []

const createTopology = (summaryPresent: boolean): string => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-plan-262-89-"))
  roots.push(root)
  mkdirSync(path.join(root, "archived"), { recursive: true })
  writeFileSync(path.join(root, "archived/262-74-HISTORICAL.md"), archiveBytes)
  const ids = [
    ...Array.from({ length: 73 }, (_, index) => index + 1).filter(
      (id) =>
        id !== 3 &&
        id !== 4 &&
        id !== 5 &&
        id !== 6 &&
        id !== 7 &&
        id !== 40 &&
        id !== 43 &&
        id !== 46 &&
        id !== 47 &&
        id !== 48 &&
        id !== 50 &&
        id !== 55 &&
        id !== 56 &&
        id !== 57 &&
        id !== 58 &&
        id !== 59 &&
        id !== 62 &&
        id !== 74,
    ),
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    82,
    83,
    84,
    85,
    86,
    87,
    88,
    89,
  ]
  const unique = [...new Set(ids)].sort((a, b) => a - b).slice(-70)
  expect(unique).toHaveLength(70)
  for (const id of unique) {
    writeFileSync(
      path.join(root, `262-${String(id).padStart(2, "0")}-PLAN.md`),
      "plan\n",
    )
    if (id !== 89 || summaryPresent)
      writeFileSync(
        path.join(root, `262-${String(id).padStart(2, "0")}-SUMMARY.md`),
        "summary\n",
      )
  }
  return root
}

const deniedAuthority = {
  archiveAuthorized: false,
  candidateSearchAuthorized: false,
  countedPlayAuthorized: false,
  formationMaterializationAuthorized: false,
  foundationActivationAuthorized: false,
  gameplayChangeAuthorized: false,
  holdoutOpeningAuthorized: false,
  phase263ExecutionAuthorized: false,
  phase263PlanningAuthorized: false,
  productAuthorized: false,
  productionAuthorized: false,
  publicAuthorized: false,
  tagAuthorized: false,
}

const passDisposition = (): any => {
  const value: any = {
    schemaVersion: "v1.38-plan-262-88-admission-disposition-v2",
    status: "pass",
    terminalDisposition: "succeeded",
    counters: {
      routeStartsConsumed: 1,
      preflightObservationsConsumed: 1,
      calibrationIdentitiesCharged: 8,
      reproductionIdentitiesCharged: 540,
      freshAccepted: 540,
      requiredAccepted: 540,
    },
    evidence: {
      receiptManifestRoot: `sha256:${"0".repeat(64)}`,
      sourceRoot: `sha256:${"3".repeat(64)}`,
      sourceReviewRoot: `sha256:${"4".repeat(64)}`,
      sealRoot: `sha256:${"1".repeat(64)}`,
      envelopeRoot: `sha256:${"5".repeat(64)}`,
      protectedHistoryRoot: `sha256:${"6".repeat(64)}`,
      localSealVerificationRoot: `sha256:${"7".repeat(64)}`,
      journalRoot: `sha256:${"8".repeat(64)}`,
      stateRoot: `sha256:${"9".repeat(64)}`,
      reproductionRoot: `sha256:${"2".repeat(64)}`,
    },
    correctionRequired: false,
    correctionRoot: null,
    integrityPassed: true,
    privacySafe: true,
    assuranceStatus: "clean",
    assuranceDefects: [],
    assuranceClass: "single_operator_local_seal_v1",
    independentCustodyClaimed: false,
    authority: {
      ...deniedAuthority,
      foundationActivationAuthorized: true,
      phase263PlanningAuthorized: true,
    },
    reasonCodes: [],
  }
  value.dispositionRoot = computeV138Plan26288DispositionRoot(value)
  return value
}

const realNonPass = (): any =>
  JSON.parse(
    readFileSync(
      path.join(repoRoot, V138_PLAN_262_88_PATHS.disposition),
      "utf8",
    ),
  )

const fixture = (
  disposition: any,
  options: { correction?: any; activation?: any } = {},
) => {
  const phaseDir = createTopology(true)
  const files = {
    phaseDir,
    summaryPath: path.join(phaseDir, "262-89-SUMMARY.md"),
    dispositionPath: path.join(phaseDir, "disposition.json"),
    correctionPath: path.join(phaseDir, "correction.json"),
    activationPath: path.join(phaseDir, "activation.json"),
    reproductionPath: path.join(phaseDir, "reproduction.json"),
    predecessorPath: path.join(phaseDir, "predecessor.json"),
    validationPath: path.join(phaseDir, "validation.md"),
    verificationPath: path.join(phaseDir, "verification.md"),
    requirementsPath: path.join(phaseDir, "requirements.md"),
    roadmapPath: path.join(phaseDir, "roadmap.md"),
    statePath: path.join(phaseDir, "state.md"),
    lifecyclePath: path.join(phaseDir, "lifecycle-v2.json"),
  }
  writeFileSync(files.dispositionPath, `${JSON.stringify(disposition)}\n`)
  writeFileSync(files.predecessorPath, `${JSON.stringify(predecessor)}\n`)
  writeFileSync(files.summaryPath, "summary\n")
  writeFileSync(files.validationPath, "validation\n")
  writeFileSync(
    files.verificationPath,
    `---\nstatus: ${disposition.status === "pass" && options.activation ? "passed" : "gaps_found"}\n---\n`,
  )
  writeFileSync(files.requirementsPath, "- [ ] **ADMIT-03**: blocked\n")
  writeFileSync(files.roadmapPath, "phase 262 incomplete; phase 263 denied\n")
  writeFileSync(files.statePath, "phase 262 incomplete; phase 263 denied\n")
  if (disposition.status === "pass")
    writeFileSync(files.reproductionPath, "{}\n")
  if (options.correction)
    writeFileSync(
      files.correctionPath,
      `${JSON.stringify(options.correction)}\n`,
    )
  if (options.activation)
    writeFileSync(
      files.activationPath,
      `${JSON.stringify(options.activation)}\n`,
    )
  return files
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

describe("Plan 262-89 topology and branch selection", () => {
  it("requires exactly 70 plans and the Plan-89-only pre-summary latch", () => {
    expect(
      inspectV138Plan26289Topology(createTopology(false), "pre_summary"),
    ).toMatchObject({
      activePlanCount: 70,
      summaryCount: 69,
      missingSummaryIds: [89],
    })
    expect(
      inspectV138Plan26289Topology(createTopology(true), "post_summary"),
    ).toMatchObject({
      activePlanCount: 70,
      summaryCount: 70,
      missingSummaryIds: [],
    })
  })

  it("passes only clean 540/540 with seal, reproduction, predecessor, and Route-10", () => {
    const disposition = passDisposition()
    const activation = computeV138Plan26288ActivationRoot(disposition)
    expect(
      evaluateV138Plan26289Branch({
        disposition,
        correction: null,
        correctionStatus: "absent",
        activation,
        activationStatus: "regular",
        reproductionStatus: "regular",
        sealAuthenticated: true,
        predecessorAuthenticated: true,
      }),
    ).toMatchObject({ status: "passed", mutationCapable: true, gaps: [] })
  })

  it.each([
    ["exhaustion", { disposition: realNonPass() }],
    [
      "integrity",
      { disposition: { ...realNonPass(), integrityPassed: false } },
    ],
    [
      "contamination",
      {
        disposition: {
          ...realNonPass(),
          terminalDisposition: "terminal_failure",
          reasonCodes: ["CONTAMINATION"],
        },
      },
    ],
    [
      "reproducibility",
      { disposition: passDisposition(), reproductionStatus: "absent" },
    ],
    [
      "missing activation",
      { disposition: passDisposition(), activationStatus: "absent" },
    ],
  ])(
    "keeps %s gaps_found and non-mutation-capable",
    (_name, overrides: any) => {
      const result = evaluateV138Plan26289Branch({
        disposition: overrides.disposition,
        correction: null,
        correctionStatus: "absent",
        activation: null,
        activationStatus: overrides.activationStatus ?? "absent",
        reproductionStatus: overrides.reproductionStatus ?? "absent",
        sealAuthenticated: true,
        predecessorAuthenticated: true,
      })
      expect(result.status).toBe("gaps_found")
      expect(result.mutationCapable).toBe(false)
    },
  )

  it("treats an authenticated correction as additive non-pass history", () => {
    const result = evaluateV138Plan26289Branch({
      disposition: passDisposition(),
      correction: { correctionRoot: `sha256:${"c".repeat(64)}` },
      correctionStatus: "regular",
      activation: null,
      activationStatus: "absent",
      reproductionStatus: "regular",
      sealAuthenticated: true,
      predecessorAuthenticated: true,
    })
    expect(result.status).toBe("gaps_found")
    expect(result.gaps).toContain("CORRECTION_V3_PRESENT")
  })

  it("rejects activation on any non-pass branch", () => {
    expect(() =>
      evaluateV138Plan26289Branch({
        disposition: realNonPass(),
        correction: null,
        correctionStatus: "absent",
        activation: {},
        activationStatus: "regular",
        reproductionStatus: "absent",
        sealAuthenticated: true,
        predecessorAuthenticated: true,
      }),
    ).toThrow("V138_PLAN_262_89_NONPASS_ACTIVATION_PRESENT")
  })
})

describe("Plan 262-89 root-only post-summary driver", () => {
  it("orders pass-only lifecycle commands and publishes an additive predecessor-bound status", () => {
    const disposition = passDisposition()
    const activation = computeV138Plan26288ActivationRoot(disposition)
    const files = fixture(disposition, { activation })
    const calls: string[] = []
    const result = runV138Plan26289PostSummaryLifecycle(files, {
      requireCommittedSummary: false,
      runCommand: (command) => calls.push(command.step),
      authenticateEvidence: () => ({
        disposition,
        correction: null,
        correctionStatus: "absent",
        activation,
        activationStatus: "regular",
        reproductionStatus: "regular",
        sealAuthenticated: true,
        predecessor,
        predecessorAuthenticated: true,
      }),
    })
    expect(calls).toEqual([
      "requirements",
      "roadmap",
      "state",
      "phase_complete",
    ])
    expect(result).toMatchObject({ status: "passed", completionMutated: true })
    const lifecycle = JSON.parse(readFileSync(files.lifecyclePath, "utf8"))
    expect(lifecycle.previousStatusRoot).toBe(predecessor.statusRoot)
    expect(lifecycle.statusRoot).toBe(
      computeV138Plan26289LifecycleStatusRoot(lifecycle),
    )
  })

  it("publishes truthful gaps_found with zero completion or Phase-263 mutation", () => {
    const disposition = realNonPass()
    const files = fixture(disposition)
    const before = [
      files.requirementsPath,
      files.roadmapPath,
      files.statePath,
    ].map((file) => readFileSync(file, "utf8"))
    const calls: string[] = []
    const result = runV138Plan26289PostSummaryLifecycle(files, {
      requireCommittedSummary: false,
      runCommand: (command) => calls.push(command.step),
      authenticateEvidence: () => ({
        disposition,
        correction: null,
        correctionStatus: "absent",
        activation: null,
        activationStatus: "absent",
        reproductionStatus: "absent",
        sealAuthenticated: true,
        predecessor,
        predecessorAuthenticated: true,
      }),
    })
    const after = [
      files.requirementsPath,
      files.roadmapPath,
      files.statePath,
    ].map((file) => readFileSync(file, "utf8"))
    expect(result).toMatchObject({
      status: "gaps_found",
      completionMutated: false,
    })
    expect(calls).toEqual([])
    expect(after).toEqual(before)
  })
})
