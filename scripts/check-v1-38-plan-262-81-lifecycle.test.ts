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
  evaluateV138Plan26281Verification,
  inspectV138Plan26281Topology,
  runV138Plan26281PostSummaryLifecycle,
} from "./check-v1-38-plan-262-81-lifecycle.js"
import {
  computeV138Plan26280ActivationRoot,
  computeV138Plan26280DispositionRoot,
} from "./check-v1-38-plan-262-80-bounded-retry-admission.js"

const repoRoot = process.cwd()
const archiveBytes = readFileSync(
  path.join(
    repoRoot,
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-74-HISTORICAL.md",
  ),
)
const roots: string[] = []

const createTopology = (summaryCount: 63 | 64): string => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-plan-262-81-"))
  roots.push(root)
  mkdirSync(path.join(root, "archived"), { recursive: true })
  writeFileSync(path.join(root, "archived/262-74-HISTORICAL.md"), archiveBytes)

  const planIds = [
    1,
    2,
    ...Array.from({ length: 55 }, (_, index) => index + 8),
    64,
    65,
    66,
    67,
    68,
    69,
    70,
  ].slice(0, 64)
  const requiredSuccessors = [75, 76, 77, 78, 79, 80, 81, 82, 83]
  for (const id of requiredSuccessors) {
    planIds[
      planIds.length -
        requiredSuccessors.length +
        requiredSuccessors.indexOf(id)
    ] = id
  }
  const uniqueIds = [...new Set(planIds)]
  while (uniqueIds.length < 64) {
    const candidate = uniqueIds.at(-1)! + 1
    if (candidate !== 74 && !requiredSuccessors.includes(candidate))
      uniqueIds.push(candidate)
  }
  uniqueIds.sort((left, right) => left - right)

  for (const id of uniqueIds) {
    writeFileSync(
      path.join(root, `262-${String(id).padStart(2, "0")}-PLAN.md`),
      "plan\n",
    )
  }
  const summarizedIds = uniqueIds.filter(
    (id) => summaryCount === 64 || id !== 81,
  )
  for (const id of summarizedIds) {
    writeFileSync(
      path.join(root, `262-${String(id).padStart(2, "0")}-SUMMARY.md`),
      "summary\n",
    )
  }
  return root
}

const deniedAuthority = {
  phase263Authorized: false,
  candidateSearchAuthorized: false,
  formationMaterializationAuthorized: false,
  holdoutOpeningAuthorized: false,
  publicAuthorized: false,
  productAuthorized: false,
  productionAuthorized: false,
  countedPlayAuthorized: false,
  gameplayChangeAuthorized: false,
}

const createPassDisposition = (): any => {
  const disposition: any = {
    schemaVersion: "v1.38-plan-262-80-admission-disposition-v1",
    status: "pass",
    terminalDisposition: "succeeded",
    counters: {
      freshAccepted: 540,
      requiredAccepted: 540,
      reproductionIdentitiesCharged: 540,
    },
    evidence: {
      sourceRoot: `sha256:${"1".repeat(64)}`,
      sourceReviewRoot: `sha256:${"2".repeat(64)}`,
      sealRoot: `sha256:${"3".repeat(64)}`,
      envelopeRoot: `sha256:${"4".repeat(64)}`,
      protectedHistoryRoot: `sha256:${"5".repeat(64)}`,
      localSealVerificationRoot: `sha256:${"6".repeat(64)}`,
      journalRoot: `sha256:${"7".repeat(64)}`,
      stateRoot: `sha256:${"8".repeat(64)}`,
      terminalRoot: `sha256:${"9".repeat(64)}`,
      reproductionRoot: `sha256:${"a".repeat(64)}`,
    },
    integrityPassed: true,
    privacySafe: true,
    reasonCodes: [],
    assuranceClass: "single_operator_local_seal_v1",
    independentCustodyClaimed: false,
    authority: { ...deniedAuthority, foundationActivationAuthorized: true },
  }
  disposition.dispositionRoot = computeV138Plan26280DispositionRoot(disposition)
  return disposition
}

const writePostSummaryFixture = (status: "pass" | "non_pass") => {
  const phaseDir = createTopology(64)
  const disposition =
    status === "pass"
      ? createPassDisposition()
      : JSON.parse(
          readFileSync(
            path.join(
              repoRoot,
              ".planning/artifacts/v1.38-plan-262-80-admission-disposition-v1.json",
            ),
            "utf8",
          ),
        )
  const files = {
    phaseDir,
    summaryPath: path.join(phaseDir, "262-81-SUMMARY.md"),
    dispositionPath: path.join(phaseDir, "disposition.json"),
    activationPath: path.join(phaseDir, "activation.json"),
    validationPath: path.join(phaseDir, "validation.md"),
    verificationPath: path.join(phaseDir, "verification.md"),
    requirementsPath: path.join(phaseDir, "requirements.md"),
    roadmapPath: path.join(phaseDir, "roadmap.md"),
    statePath: path.join(phaseDir, "state.md"),
  }
  writeFileSync(files.dispositionPath, `${JSON.stringify(disposition)}\n`)
  if (status === "pass")
    writeFileSync(
      files.activationPath,
      `${JSON.stringify(computeV138Plan26280ActivationRoot(disposition))}\n`,
    )
  writeFileSync(files.validationPath, "validation\n")
  writeFileSync(
    files.verificationPath,
    `---\nstatus: ${status === "pass" ? "passed" : "gaps_found"}\n---\n`,
  )
  writeFileSync(
    files.requirementsPath,
    [
      "ADMIT-01",
      "ADMIT-02",
      "ADMIT-03",
      "ADMIT-04",
      ...Array.from(
        { length: 10 },
        (_, index) => `MEAS-${String(index + 1).padStart(2, "0")}`,
      ),
      "SEAL-01",
      "DECI-02",
    ]
      .map((id) => `- [${id === "ADMIT-03" ? " " : "x"}] **${id}**: fixture`)
      .join("\n"),
  )
  writeFileSync(files.roadmapPath, "phase 262 incomplete; phase 263 denied\n")
  writeFileSync(files.statePath, "phase 262 incomplete; phase 263 denied\n")
  return files
}

afterEach(() => {
  while (roots.length > 0)
    rmSync(roots.pop()!, { recursive: true, force: true })
})

describe("Plan 262-81 lifecycle topology", () => {
  it("accepts exact 63/64 before summary and exact 64/64 afterward", () => {
    const pre = inspectV138Plan26281Topology(createTopology(63), "pre_summary")
    const post = inspectV138Plan26281Topology(
      createTopology(64),
      "post_summary",
    )

    expect(pre).toMatchObject({
      activePlanCount: 64,
      summaryCount: 63,
      missingSummaryIds: [81],
    })
    expect(post).toMatchObject({
      activePlanCount: 64,
      summaryCount: 64,
      missingSummaryIds: [],
    })
  })

  it("rejects Plan 74 as active or summarized even when counts coincide", () => {
    const root = createTopology(64)
    writeFileSync(path.join(root, "262-74-SUMMARY.md"), "forbidden\n")
    rmSync(path.join(root, "262-01-SUMMARY.md"))

    expect(() => inspectV138Plan26281Topology(root, "post_summary")).toThrow(
      "V138_PLAN_262_81_PLAN_74_SUMMARY_FORBIDDEN",
    )
  })

  it("requires corrective Plans 82 and 83 even when active counts coincide", () => {
    const root = createTopology(64)
    rmSync(path.join(root, "262-82-PLAN.md"))
    rmSync(path.join(root, "262-82-SUMMARY.md"))
    writeFileSync(path.join(root, "262-84-PLAN.md"), "replacement\n")
    writeFileSync(path.join(root, "262-84-SUMMARY.md"), "replacement\n")
    expect(() => inspectV138Plan26281Topology(root, "post_summary")).toThrow(
      "V138_PLAN_262_81_SUCCESSOR_TOPOLOGY_INVALID",
    )
  })
})

describe("Plan 262-81 branch verification", () => {
  const exactPassDisposition = {
    schemaVersion: "v1.38-plan-262-80-admission-disposition-v1",
    status: "pass",
    terminalDisposition: "succeeded",
    counters: { freshAccepted: 540, requiredAccepted: 540 },
    integrityPassed: true,
    privacySafe: true,
    assuranceClass: "single_operator_local_seal_v1",
    authority: {
      foundationActivationAuthorized: true,
      phase263Authorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      productionAuthorized: false,
      countedPlayAuthorized: false,
      gameplayChangeAuthorized: false,
    },
  }

  it("passes only the exact disposition, activation, requirement, privacy, and prohibition conjunction", () => {
    expect(
      evaluateV138Plan26281Verification({
        disposition: exactPassDisposition,
        activationRoot: {
          schemaVersion: "v1.38-foundation-activation-root-route9-v1",
        },
        requirementsComplete: true,
      }).status,
    ).toBe("passed")
  })

  it("keeps count coincidence non-compensating for missing pass evidence", () => {
    const result = evaluateV138Plan26281Verification({
      disposition: { ...exactPassDisposition, status: "non_pass" },
      activationRoot: null,
      requirementsComplete: true,
    })
    expect(result.status).toBe("gaps_found")
    expect(result.gaps).toContain("ADMIT-03")
  })
})

describe("Plan 262-81 separately invokable post-summary driver", () => {
  it("runs PASS lifecycle mutations only in requirement, roadmap, state, phase.complete order", () => {
    const files = writePostSummaryFixture("pass")
    const calls: string[] = []
    const result = runV138Plan26281PostSummaryLifecycle(files, {
      requireCommittedSummary: false,
      runCommand: (command) => calls.push(command.step),
      authenticateAdmission: () => ({
        disposition: JSON.parse(readFileSync(files.dispositionPath, "utf8")),
        activationRoot: JSON.parse(readFileSync(files.activationPath, "utf8")),
      }),
    })

    expect(result).toMatchObject({ status: "passed", mutated: true })
    expect(calls).toEqual([
      "requirements",
      "roadmap",
      "state",
      "phase_complete",
    ])
  })

  it("rejects a self-rehashed forged PASS before any lifecycle command", () => {
    const files = writePostSummaryFixture("pass")
    const forged = JSON.parse(readFileSync(files.dispositionPath, "utf8"))
    const trusted = { ...forged, status: "non_pass" }
    trusted.authority = {
      ...trusted.authority,
      foundationActivationAuthorized: false,
    }
    trusted.dispositionRoot = computeV138Plan26280DispositionRoot(trusted)
    const calls: string[] = []

    expect(() =>
      runV138Plan26281PostSummaryLifecycle(files, {
        requireCommittedSummary: false,
        runCommand: (command) => calls.push(command.step),
        authenticateAdmission: () => ({
          disposition: trusted,
          activationRoot: null,
        }),
      }),
    ).toThrow("V138_PLAN_262_80_DISPOSITION_INVALID")
    expect(calls).toEqual([])
  })

  it("performs zero completion mutation for NON-PASS", () => {
    const files = writePostSummaryFixture("non_pass")
    const before = [
      files.requirementsPath,
      files.roadmapPath,
      files.statePath,
    ].map((file) => readFileSync(file, "utf8"))
    const calls: string[] = []
    const result = runV138Plan26281PostSummaryLifecycle(files, {
      requireCommittedSummary: false,
      runCommand: (command) => calls.push(command.step),
      authenticateAdmission: () => ({
        disposition: JSON.parse(readFileSync(files.dispositionPath, "utf8")),
        activationRoot: null,
      }),
    })
    const after = [
      files.requirementsPath,
      files.roadmapPath,
      files.statePath,
    ].map((file) => readFileSync(file, "utf8"))

    expect(result).toMatchObject({ status: "gaps_found", mutated: false })
    expect(calls).toEqual([])
    expect(after).toEqual(before)
  })
})
