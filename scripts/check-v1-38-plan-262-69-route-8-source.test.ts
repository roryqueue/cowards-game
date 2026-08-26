import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_ROUTE_8_COMMANDS,
  V138_ROUTE_8_DESTINATIONS,
  V138_ROUTE_8_PATHS,
  buildV138Route8Authorization,
  buildV138Route8Seal,
  checkV138Plan26272Disposition,
  checkV138Plan26272Transition,
  checkV138Route8AuthoritySeal,
  deriveV138Route8Activation,
  type V138Route8SourceCustody,
} from "./lib/v1-38-route-8-source.js"
import {
  bindV138PostValidation,
  checkV138NormalizedPostValidation,
  checkV138Plan26274Result,
  checkV138PostValidationBinder,
  normalizeV138PostValidation,
  runV138Plan26274Sentinel,
  verifyV138Plan26274Input,
} from "./check-v1-38-plan-262-69-route-8-source.js"

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const temporary = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-route8-"))
  roots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  return root
}

const digest = (digit: string) => `sha256:${digit.repeat(64)}` as const
const oid = (digit: string) => digit.repeat(40)
const custody = (): V138Route8SourceCustody => ({
  sourceCommit: oid("1"), sourceTree: oid("2"), sourceParent: oid("3"),
  sourceRoot: digest("4"), reviewRoot: digest("5"),
  checkpointRoot: "sha256:f1bc58ff9a4f107c293f1bfba9e7d44d5eda92aac78fbe93f7596889d04f404a",
})

describe("route-8 closed source", () => {
  it("accounts for every command and destination", () => {
    expect(V138_ROUTE_8_COMMANDS).toEqual([
      "--check", "--derive-authority-seal-no-publish", "--check-authority-seal",
      "--check-plan-262-72-transition", "--check-plan-262-72-disposition",
      "--derive-activation-no-publish", "--check-activation",
      "--normalize-post-validation", "--check-normalized-post-validation",
      "--bind-post-validation", "--check-post-validation-binder",
      "--run-plan-262-74-sentinel", "--check-plan-262-74-result",
    ])
    expect(new Set(V138_ROUTE_8_DESTINATIONS).size).toBe(V138_ROUTE_8_DESTINATIONS.length)
    expect(V138_ROUTE_8_DESTINATIONS).toContain(
      ".planning/artifacts/v1.38-current-matrix-reproduction-v14.json",
    )
  })

  it("builds a distinct, non-authorizing v10 and B10 pair", () => {
    const authorization = buildV138Route8Authorization(custody())
    const seal = buildV138Route8Seal(authorization)
    expect(checkV138Route8AuthoritySeal(authorization, seal)).toBe(true)
    expect(authorization.routeOrdinal).toBe(8)
    expect(authorization.execution.preflightVersion).toBe(13)
    expect(authorization.execution.reproductionVersion).toBe(14)
    expect(authorization.authority).toEqual({ routeEligible: true, routeStarted: false,
      satisfiesAdmit03: false, phase263PlanningAuthorized: false,
      candidateSearchAuthorized: false, formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false, publicAuthorized: false,
      productionAuthorized: false })
    expect(() => checkV138Route8AuthoritySeal(
      { ...authorization, routeOrdinal: 7 } as never, seal,
    )).toThrow("V138_ROUTE8_AUTHORIZATION_INVALID")
    expect(() => checkV138Route8AuthoritySeal(authorization,
      { ...seal, authorizationRoot: digest("9") } as never,
    )).toThrow("V138_ROUTE8_SEAL_INVALID")
  })

  it("accepts only obstruction, stopped, or admitted-pending transition states", () => {
    const root = temporary()
    const obstruction = path.join(root, ".planning/artifacts/v1.38-plan-262-72-pre-start-obstruction-v1.json")
    writeFileSync(obstruction, JSON.stringify({ schemaVersion: "v1.38-plan-262-72-pre-start-obstruction-v1",
      status: "blocked", routeStarted: false, freshCharged: 0, freshAccepted: 0,
      phase263PlanningAuthorized: false }) + "\n")
    expect(checkV138Plan26272Transition({ repoRoot: root })).toBe("pre_start_obstruction")
    const routeStart = path.join(root, ".planning/artifacts/v1.38-plan-262-72-route-start-v1.json")
    writeFileSync(routeStart, "{}\n")
    expect(() => checkV138Plan26272Transition({ repoRoot: root }))
      .toThrow("V138_ROUTE8_TRANSITION_BRANCH_INVALID")
    unlink(routeStart)
    unlink(obstruction)

    writeState(root, "stopped")
    expect(checkV138Plan26272Transition({ repoRoot: root })).toBe("stopped_terminal")
    expect(checkV138Plan26272Disposition({ repoRoot: root })).toBe("terminal")
    unlink(path.join(root, ".planning/artifacts/v1.38-plan-262-72-terminal-v1.json"))
    writeFileSync(artifact(root, "v1.38-current-matrix-headroom-preflight-v13.json"),
      JSON.stringify({ schemaVersion: "v1.38-current-matrix-headroom-preflight-v13",
        samplingMilliseconds: 200, minimumEffectiveAvailableBasisPoints: 2500,
        status: "admitted" }) + "\n")
    rewriteCalibration(root, "admitted")
    expect(checkV138Plan26272Transition({ repoRoot: root })).toBe("admitted_pending_reproduction")
    expect(() => checkV138Plan26272Disposition({ repoRoot: root }))
      .toThrow("V138_ROUTE8_DISPOSITION_BRANCH_INVALID")
  })

  it("rejects symlinked optional branches and reproduction before Task 2", () => {
    const root = temporary()
    const outside = path.join(root, "outside")
    writeFileSync(outside, "{}\n")
    symlinkSync(outside, path.join(root,
      ".planning/artifacts/v1.38-plan-262-72-pre-start-obstruction-v1.json"))
    expect(() => checkV138Plan26272Transition({ repoRoot: root }))
      .toThrow("V138_ROUTE8_PATH_UNSAFE")
  })

  it("grants only Phase 263 planning after exact 540/540 and local seal", () => {
    const blocked = deriveV138Route8Activation({ branch: "pre_start_obstruction",
      terminal: null, localSealPassed: true })
    expect(blocked.activation).toBeNull()
    expect(blocked.disposition.phase263PlanningAuthorized).toBe(false)
    const passed = deriveV138Route8Activation({ branch: "terminal",
      terminal: { disposition: "reproduction_passed", freshCharged: 540,
        freshAccepted: 540, satisfiesAdmit03: true }, localSealPassed: true })
    expect(passed.activation?.phase263PlanningAuthorized).toBe(true)
    expect(passed.activation?.candidateSearchAuthorized).toBe(false)
    expect(passed.activation?.formationMaterializationAuthorized).toBe(false)
    expect(deriveV138Route8Activation({ branch: "terminal",
      terminal: { disposition: "reproduction_passed", freshCharged: 540,
        freshAccepted: 539, satisfiesAdmit03: true }, localSealPassed: true }).activation)
      .toBeNull()
  })
})

const unlink = (file: string) => rmSync(file)
const artifact = (root: string, name: string) => path.join(root, ".planning/artifacts", name)
const writeState = (root: string, calibrationStatus: "stopped" | "admitted") => {
  writeFileSync(artifact(root, "v1.38-plan-262-72-route-start-v1.json"),
    JSON.stringify({ schemaVersion: "v1.38-plan-262-72-route-start-v1", routeOrdinal: 8,
      consumed: true, executionContextVersion: 13, preflightVersion: 13 }) + "\n")
  writeFileSync(artifact(root, "v1.38-current-matrix-headroom-preflight-v13.json"),
    JSON.stringify({ schemaVersion: "v1.38-current-matrix-headroom-preflight-v13",
      samplingMilliseconds: 200, minimumEffectiveAvailableBasisPoints: 2500,
      status: calibrationStatus === "stopped" ? "stopped" : "admitted" }) + "\n")
  writeFileSync(artifact(root, "v1.38-plan-262-72-calibration-consumption-v1.json"),
    JSON.stringify({ schemaVersion: "v1.38-plan-262-72-calibration-consumption-v1",
      charged: 8, shards: 4, consumed: true }) + "\n")
  rewriteCalibration(root, calibrationStatus)
  if (calibrationStatus === "stopped") writeFileSync(
    artifact(root, "v1.38-plan-262-72-terminal-v1.json"),
    JSON.stringify({ schemaVersion: "v1.38-plan-262-72-terminal-v1",
      disposition: "calibration_stopped", routeOrdinal: 8, freshCharged: 8,
      freshAccepted: 0, satisfiesAdmit03: false }) + "\n")
}
const rewriteCalibration = (root: string, status: "stopped" | "admitted") =>
  writeFileSync(artifact(root, "v1.38-current-matrix-calibration-v13.json"),
    JSON.stringify({ schemaVersion: "v1.38-current-matrix-calibration-v13",
      status, charged: 8, shards: 4 }) + "\n")

const lifecycleNumbers = [
  1, 2, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 42, 44, 45, 49,
  51, 52, 53, 54, 60, 61, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74,
]
const lifecycleArgs = () => ({
  phaseDir: ".planning/phases/262-test",
  requirements: ".planning/REQUIREMENTS.md",
  roadmap: ".planning/ROADMAP.md",
  state: ".planning/STATE.md",
  validation: ".planning/phases/262-test/262-VALIDATION.md",
  disposition: V138_ROUTE_8_PATHS.disposition,
  activationRoot: "auto",
})
const carrier = () => ({ proof_status: "route_8_obstruction_activation_blocked",
  admit_03: "blocked", seal_01: "passed_reduced_assurance", route_started: false,
  fresh_charged: 0, fresh_accepted: 0, candidate_search_authorized: false,
  phase263_authorized: false, formation_materialization_authorized: false,
  holdout_opening_authorized: false, public_authorized: false,
  foundation_activation_root_present: false, production_authorized: false,
  next_action: "top-level-gsd-validate-phase-262", bulk_execute_phase_prohibited: true,
  total_plans: 56, trustworthy_summaries: 55, active_successors: ["262-74"],
  incomplete: ["262-74"], sentinel_plan: "262-74",
  sentinel_summary_policy: "pass_only_after_verification" })
const lifecycleFixture = (branch: "obstruction" | "terminal" = "obstruction"): string => {
  const root = temporary()
  const args = lifecycleArgs()
  mkdirSync(path.join(root, args.phaseDir), { recursive: true })
  for (const number of lifecycleNumbers) {
    const prefix = `262-${String(number).padStart(2, "0")}`
    writeFileSync(path.join(root, args.phaseDir, `${prefix}-PLAN.md`), `# Plan ${number}\n`)
    if (number !== 74) writeFileSync(path.join(root, args.phaseDir, `${prefix}-SUMMARY.md`), `# Summary ${number}\n`)
  }
  writeFileSync(path.join(root, args.requirements), "- [ ] **ADMIT-03**: blocked\n")
  for (const file of [args.roadmap, args.state]) writeFileSync(path.join(root, file),
    `<!-- phase-262-verification-sentinel-status: ${JSON.stringify(carrier())} -->\n`)
  writeFileSync(path.join(root, args.validation),
    "---\nstatus: partial\n---\n<!-- phase-262-successor-status: {} -->\n")
  if (branch === "obstruction") {
    writeFileSync(path.join(root, V138_ROUTE_8_PATHS.obstruction), JSON.stringify({
      schemaVersion: "v1.38-plan-262-72-pre-start-obstruction-v1", status: "blocked",
      routeStarted: false, freshCharged: 0, freshAccepted: 0,
      phase263PlanningAuthorized: false,
    }) + "\n")
    const derived = deriveV138Route8Activation({ branch: "pre_start_obstruction",
      terminal: null, localSealPassed: true })
    writeFileSync(path.join(root, args.disposition), JSON.stringify(derived.disposition) + "\n")
  } else {
    const terminal = { disposition: "reproduction_passed", freshCharged: 540,
      freshAccepted: 540, satisfiesAdmit03: true }
    writeFileSync(path.join(root, V138_ROUTE_8_PATHS.routeStart), "{}\n")
    writeFileSync(path.join(root, V138_ROUTE_8_PATHS.terminal), JSON.stringify({
      schemaVersion: "v1.38-plan-262-72-terminal-v1", routeOrdinal: 8, ...terminal,
    }) + "\n")
    const derived = deriveV138Route8Activation({ branch: "terminal", terminal,
      localSealPassed: true })
    writeFileSync(path.join(root, args.disposition), JSON.stringify(derived.disposition) + "\n")
    writeFileSync(path.join(root, V138_ROUTE_8_PATHS.activation), JSON.stringify(derived.activation) + "\n")
  }
  return root
}
const sentinelArgs = (args: ReturnType<typeof lifecycleArgs>, binder: string) => ({
  binder, phaseDir: args.phaseDir, requirements: args.requirements, roadmap: args.roadmap,
  state: args.state, validation: args.validation, verification: `${args.phaseDir}/262-VERIFICATION.md`,
})

describe("route-8 Plan 74 lifecycle boundaries", () => {
  it("authenticates the full obstruction lifecycle and replaces stale blocked bytes", () => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    const marker = normalizeV138PostValidation(root, args)
    expect(marker).toMatchObject({ totalPlans: 56, trustworthySummaries: 55,
      soleIncomplete: "262-74", branch: "obstruction", freshCharged: 0,
      freshAccepted: 0, admit03: "blocked", phase263PlanningAuthorized: false })
    expect(marker.planIdentitySha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(checkV138NormalizedPostValidation(root, args)).toEqual(marker)
    const binderPath = ".planning/artifacts/plan-74-binder.json"
    const binder = bindV138PostValidation(root, { ...args, output: binderPath })
    expect(checkV138PostValidationBinder(root, { ...args, binder: binderPath })).toEqual(binder)
    const driver = sentinelArgs(args, binderPath)
    const blocked = `${args.phaseDir}/262-74-BLOCKED.md`
    writeFileSync(path.join(root, blocked), "stale\n")
    const beforeTemp = new Set(readdirSync(tmpdir()).filter(name => name.startsWith("v138-route8-sentinel-")))
    expect(runV138Plan26274Sentinel(root, driver)).toBe("gaps_found")
    expect(runV138Plan26274Sentinel(root, driver)).toBe("gaps_found")
    expect(checkV138Plan26274Result(root, { ...driver,
      summary: `${args.phaseDir}/262-74-SUMMARY.md`, blocked })).toBe("gaps_found")
    expect(readFileSync(path.join(root, blocked), "utf8")).not.toContain("stale")
    expect(existsSync(path.join(root, args.phaseDir, "262-74-SUMMARY.md"))).toBe(false)
    expect(new Set(readdirSync(tmpdir()).filter(name => name.startsWith("v138-route8-sentinel-"))))
      .toEqual(beforeTemp)
  })

  it("rejects forged binders and tampered exact result artifacts", () => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    normalizeV138PostValidation(root, args)
    const binderPath = ".planning/artifacts/plan-74-binder.json"
    const binder = bindV138PostValidation(root, { ...args, output: binderPath })
    writeFileSync(path.join(root, binderPath), JSON.stringify({ ...binder,
      phase263PlanningAuthorized: true }) + "\n")
    expect(() => runV138Plan26274Sentinel(root, sentinelArgs(args, binderPath)))
      .toThrow("V138_ROUTE8_BINDER_INVALID")
    writeFileSync(path.join(root, binderPath), `${JSON.stringify(binder)}\n`)
    const driver = sentinelArgs(args, binderPath)
    runV138Plan26274Sentinel(root, driver)
    writeFileSync(path.join(root, `${args.phaseDir}/262-74-BLOCKED.md`), "stale\n")
    expect(() => checkV138Plan26274Result(root, { ...driver,
      summary: `${args.phaseDir}/262-74-SUMMARY.md`, blocked: `${args.phaseDir}/262-74-BLOCKED.md` }))
      .toThrow("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  })

  it.each([
    ["missing summary", (root: string, args: ReturnType<typeof lifecycleArgs>) =>
      rmSync(path.join(root, args.phaseDir, "262-01-SUMMARY.md"))],
    ["extra plan", (root: string, args: ReturnType<typeof lifecycleArgs>) =>
      writeFileSync(path.join(root, args.phaseDir, "262-75-PLAN.md"), "# extra\n")],
    ["symlink summary", (root: string, args: ReturnType<typeof lifecycleArgs>) => {
      const file = path.join(root, args.phaseDir, "262-02-SUMMARY.md")
      rmSync(file); symlinkSync(path.join(root, args.phaseDir, "262-01-SUMMARY.md"), file)
    }],
  ])("rejects a non-canonical topology: %s", (_name, mutate) => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    mutate(root, args)
    expect(() => normalizeV138PostValidation(root, args)).toThrow("V138_ROUTE8_SUMMARY_INDEX_INVALID")
  })

  it("rejects contradictory, 539-of-540, activation, and denial dispositions", () => {
    const contradiction = lifecycleFixture()
    const args = lifecycleArgs()
    const dispositionPath = path.join(contradiction, args.disposition)
    const disposition = JSON.parse(readFileSync(dispositionPath, "utf8"))
    writeFileSync(dispositionPath, JSON.stringify({ ...disposition, branch: "terminal",
      status: "passed", admit03: "passed", phase263PlanningAuthorized: true }) + "\n")
    expect(() => normalizeV138PostValidation(contradiction, args)).toThrow("V138_ROUTE8_DISPOSITION_INVALID")

    const denied = lifecycleFixture()
    const deniedPath = path.join(denied, args.disposition)
    const deniedDisposition = JSON.parse(readFileSync(deniedPath, "utf8"))
    writeFileSync(deniedPath, JSON.stringify({ ...deniedDisposition,
      candidateSearchAuthorized: true }) + "\n")
    expect(() => normalizeV138PostValidation(denied, args)).toThrow("V138_ROUTE8_DISPOSITION_INVALID")

    const activation = lifecycleFixture()
    writeFileSync(path.join(activation, V138_ROUTE_8_PATHS.activation), "{}\n")
    expect(() => normalizeV138PostValidation(activation, args)).toThrow("V138_ROUTE8_ACTIVATION_SELECTION_INVALID")

    const short = lifecycleFixture("terminal")
    const terminalPath = path.join(short, V138_ROUTE_8_PATHS.terminal)
    const terminal = JSON.parse(readFileSync(terminalPath, "utf8"))
    writeFileSync(terminalPath, JSON.stringify({ ...terminal, freshAccepted: 539 }) + "\n")
    expect(() => normalizeV138PostValidation(short, args)).toThrow("V138_ROUTE8_TERMINAL_INVALID")
  })

  it("rejects absolute and symlinked phase paths before mutation", () => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    const validationBefore = readFileSync(path.join(root, args.validation), "utf8")
    expect(() => normalizeV138PostValidation(root, { ...args, phaseDir: path.join(root, args.phaseDir) }))
      .toThrow("V138_ROUTE8_PATH_OUTSIDE_REPOSITORY")
    expect(readFileSync(path.join(root, args.validation), "utf8")).toBe(validationBefore)
    normalizeV138PostValidation(root, args)
    const normalizedBefore = readFileSync(path.join(root, args.validation), "utf8")
    const outside = mkdtempSync(path.join(tmpdir(), "v138-route8-outside-"))
    roots.push(outside)
    symlinkSync(outside, path.join(root, ".planning/escape"))
    expect(() => bindV138PostValidation(root, { ...args,
      output: ".planning/escape/binder.json" })).toThrow("V138_ROUTE8_PATH_UNSAFE")
    expect(readFileSync(path.join(root, args.validation), "utf8")).toBe(normalizedBefore)
  })

  it("rolls back every lifecycle carrier and temporary after an install fault", () => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    const files = [args.roadmap, args.state, args.validation]
    const before = files.map(file => readFileSync(path.join(root, file), "utf8"))
    expect(() => normalizeV138PostValidation(root, args, { faultAfterInstall: 1 }))
      .toThrow("V138_ROUTE8_TEST_INSTALL_FAILURE")
    expect(files.map(file => readFileSync(path.join(root, file), "utf8"))).toEqual(before)
    for (const file of files) expect(readdirSync(path.dirname(path.join(root, file)))
      .some(name => name.includes(".tmp-"))).toBe(false)
  })

  it("fails closed on authenticated PASS before report, summary, or lifecycle writes", () => {
    const root = lifecycleFixture("terminal")
    const args = lifecycleArgs()
    normalizeV138PostValidation(root, args)
    const binderPath = ".planning/artifacts/plan-74-binder.json"
    const binder = bindV138PostValidation(root, { ...args, output: binderPath })
    expect(() => verifyV138Plan26274Input({ ...binder,
      schemaVersion: "v1.38-plan-262-74-verifier-input-v1" })).not.toThrow()
    const driver = sentinelArgs(args, binderPath)
    const before = [args.requirements, args.roadmap, args.state, args.validation]
      .map(file => readFileSync(path.join(root, file), "utf8"))
    expect(() => runV138Plan26274Sentinel(root, driver))
      .toThrow("V138_ROUTE8_PASS_CLOSEOUT_REQUIRES_ORCHESTRATOR")
    expect([args.requirements, args.roadmap, args.state, args.validation]
      .map(file => readFileSync(path.join(root, file), "utf8"))).toEqual(before)
    for (const name of ["262-VERIFICATION.md", "262-74-BLOCKED.md", "262-74-SUMMARY.md"]) {
      expect(existsSync(path.join(root, args.phaseDir, name))).toBe(false)
    }
  })
})
