import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import {
  dispatchV138Route8Cli,
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
  normalizeV138PostValidation,
  V138_PLAN_262_74_TEST_ONLY,
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
const canonicalClone = (): string => {
  const parent = mkdtempSync(path.join(tmpdir(), "v138-route8-canonical-"))
  roots.push(parent)
  const root = path.join(parent, "repo")
  execFileSync("git", ["clone", "--quiet", "--no-hardlinks", sourceRoot, root], { stdio: "ignore" })
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
  phaseDir: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con",
  requirements: ".planning/REQUIREMENTS.md",
  roadmap: ".planning/ROADMAP.md",
  state: ".planning/STATE.md",
  validation: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VALIDATION.md",
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
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const stable = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize) :
    item !== null && typeof item === "object" ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)])) : item
  return `${JSON.stringify(normalize(value))}\n`
}
const sha = (value: string | Uint8Array) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const rooted = (domain: string, rootKey: string, body: Record<string, unknown>) =>
  ({ ...body, [rootKey]: sha(`${domain}\0${stable(body)}`) })
const git = (root: string, args: string[]) => execFileSync("git", args,
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
const commitAll = (root: string, message: string) => {
  git(root, ["add", "."]); git(root, ["commit", "-m", message])
}
const validationBytes = (branch: "obstruction" | "terminal", unavailable = false): string => {
  const ids = ["ADMIT-01", "ADMIT-02", "ADMIT-03", "ADMIT-04", "MEAS-01", "MEAS-02",
    "MEAS-03", "MEAS-04", "MEAS-05", "MEAS-06", "MEAS-07", "MEAS-08", "MEAS-09",
    "MEAS-10", "SEAL-01", "DECI-02"]
  const rows = ids.map(id => `| ${id} | ${id === "ADMIT-03" && branch === "obstruction" ?
    "PARTIAL / BLOCKED" : "COVERED"} | evidence | command |`).join("\n")
  return `---\nstatus: ${branch === "obstruction" ? "partial" : "passed"}\nlast_audited: 2026-08-26\n---\n\n` +
    `Local-seal v3\n\n## Requirement Coverage\n\n| Requirement | Status | Behavioral evidence | Automated command |\n` +
    `|---|---|---|---|\n${rows}\n\n${branch === "obstruction" ?
      "Coverage is 15 covered and 1 partial-blocked.\nThis result cannot authorize Phase 263 or any downstream/live capability.\n| ADMIT-03 | BLOCKER | missing route |" :
      "Coverage is 16 covered and 0 gaps.\nPhase 263 planning authorized.\nDownstream authority remains denied."}\n\n## Evidence\nExact.\n` +
    (unavailable ? "verification_carrier_unavailable: true\n" : "")
}
const writeTerminalChain = (root: string): void => {
  const authorization = buildV138Route8Authorization(custody())
  const seal = buildV138Route8Seal(authorization)
  writeFileSync(path.join(root, V138_ROUTE_8_PATHS.authorization), stable(authorization))
  writeFileSync(path.join(root, V138_ROUTE_8_PATHS.seal), stable(seal))
  const routeStart = rooted("v138-route8-route-start-v1", "routeStartRoot", {
    schemaVersion: "v1.38-plan-262-72-route-start-v1", routeOrdinal: 8, consumed: true,
    singleUse: true, noRetry: true, authorizationRoot: authorization.authorizationRoot,
    sealRoot: seal.sealRoot, executionContextRoot: sha("execution") })
  const preflight = rooted("v138-route8-preflight-v13", "receiptRoot", {
    schemaVersion: "v1.38-current-matrix-headroom-preflight-v13", samplingMilliseconds: 200,
    minimumEffectiveAvailableBasisPoints: 2500, status: "admitted",
    routeStartRoot: routeStart.routeStartRoot, effectiveAvailableBasisPoints: 3000 })
  const calibrationConsumption = rooted("v138-route8-calibration-consumption-v1", "markerRoot", {
    schemaVersion: "v1.38-plan-262-72-calibration-consumption-v1", charged: 8, shards: 4,
    consumed: true, noRetry: true, routeStartRoot: routeStart.routeStartRoot,
    preflightRoot: preflight.receiptRoot, chargedAttemptRoot: sha("calibration-attempt") })
  const calibration = rooted("v138-route8-calibration-v13", "receiptRoot", {
    schemaVersion: "v1.38-current-matrix-calibration-v13", status: "admitted", charged: 8,
    accepted: 8, shards: 4, systemFailureCount: 0, routeStartRoot: routeStart.routeStartRoot,
    preflightRoot: preflight.receiptRoot, consumptionRoot: calibrationConsumption.markerRoot })
  const reproductionConsumption = rooted("v138-route8-reproduction-consumption-v1", "markerRoot", {
    schemaVersion: "v1.38-plan-262-72-reproduction-consumption-v1", charged: 540,
    consumed: true, noRetry: true, calibrationRoot: calibration.receiptRoot,
    chargedAttemptRoot: sha("reproduction-attempt") })
  const reproduction = rooted("v138-route8-reproduction-v14", "receiptRoot", {
    schemaVersion: "v1.38-current-matrix-reproduction-v14", chargedCellCount: 540,
    acceptedCellCount: 540, systemFailureCount: 0, runtimeDefectCount: 0,
    legalInformationDefectCount: 0, privacyDefectCount: 0, identityDefectCount: 0,
    cellDefectCount: 0, noRetry: true, routeStartRoot: routeStart.routeStartRoot,
    calibrationRoot: calibration.receiptRoot, consumptionRoot: reproductionConsumption.markerRoot })
  const terminal = rooted("v138-route8-terminal-v1", "terminalRoot", {
    schemaVersion: "v1.38-plan-262-72-terminal-v1", disposition: "reproduction_passed",
    routeOrdinal: 8, freshCharged: 540, freshAccepted: 540, satisfiesAdmit03: true,
    completeCleanup: true, authorityExpired: true, noRetry: true,
    routeStartRoot: routeStart.routeStartRoot, preflightRoot: preflight.receiptRoot,
    calibrationConsumptionRoot: calibrationConsumption.markerRoot,
    calibrationRoot: calibration.receiptRoot,
    reproductionConsumptionRoot: reproductionConsumption.markerRoot,
    reproductionRoot: reproduction.receiptRoot })
  const artifacts = [
    [V138_ROUTE_8_PATHS.routeStart, routeStart], [V138_ROUTE_8_PATHS.preflight, preflight],
    [V138_ROUTE_8_PATHS.calibrationConsumption, calibrationConsumption],
    [V138_ROUTE_8_PATHS.calibration, calibration],
    [V138_ROUTE_8_PATHS.reproductionConsumption, reproductionConsumption],
    [V138_ROUTE_8_PATHS.reproduction, reproduction], [V138_ROUTE_8_PATHS.terminal, terminal],
  ] as const
  for (const [repoPath, value] of artifacts.slice(0, 4)) writeFileSync(path.join(root, repoPath), stable(value))
  commitAll(root, "fixture: producer preflight and calibration")
  for (const [repoPath, value] of artifacts.slice(4)) writeFileSync(path.join(root, repoPath), stable(value))
  const derived = deriveV138Route8Activation({ branch: "terminal",
    terminal: { disposition: "reproduction_passed", freshCharged: 540,
      freshAccepted: 540, satisfiesAdmit03: true }, localSealPassed: true })
  writeFileSync(path.join(root, V138_ROUTE_8_PATHS.disposition), stable(derived.disposition))
  writeFileSync(path.join(root, V138_ROUTE_8_PATHS.activation), stable(derived.activation))
  commitAll(root, "fixture: producer reproduction and terminal")
  const paths = artifacts.map(([repoPath]) => repoPath)
  const identities = paths.map(repoPath => { const bytes = readFileSync(path.join(root, repoPath)); return {
    path: repoPath, blob: git(root, ["rev-parse", `HEAD:${repoPath}`]),
    introducingCommit: git(root, ["log", "-1", "--format=%H", "--", repoPath]),
    sha256: sha(bytes), bytes: bytes.length } })
  const producerPath = "scripts/lib/v1-38-route-8-source.ts"
  const body = { schemaVersion: "v1.38-plan-262-72-execution-provenance-v1",
    producerPath, producerBlob: git(root, ["rev-parse", `HEAD:${producerPath}`]),
    authorizedPlan72Commit: git(root, ["log", "-1", "--format=%H", "--",
      `${lifecycleArgs().phaseDir}/262-72-PLAN.md`]), artifactIdentities: identities,
    executionRoot: sha(`v138-route8-execution-artifacts-v1\0${stable(identities)}`) }
  writeFileSync(path.join(root, ".planning/artifacts/v1.38-plan-262-72-execution-provenance-v1.json"),
    stable({ ...body, manifestRoot: sha(`v138-route8-execution-provenance-v1\0${stable(body)}`) }))
  commitAll(root, "fixture: producer execution manifest")
}
const lifecycleFixture = (branch: "obstruction" | "terminal" = "obstruction",
  unavailable = false, validatorSameCommit = false): string => {
  const root = temporary()
  const args = lifecycleArgs()
  git(root, ["init", "-q"]); git(root, ["config", "user.email", "test@example.invalid"])
  git(root, ["config", "user.name", "Route 8 Test"])
  mkdirSync(path.join(root, args.phaseDir), { recursive: true })
  for (const number of lifecycleNumbers) {
    const prefix = `262-${String(number).padStart(2, "0")}`
    writeFileSync(path.join(root, args.phaseDir, `${prefix}-PLAN.md`), `# Plan ${number}\n`)
    if (![72, 73, 74].includes(number)) writeFileSync(path.join(root, args.phaseDir, `${prefix}-SUMMARY.md`), `# Summary ${number}\n`)
  }
  writeFileSync(path.join(root, args.requirements), "- [ ] **ADMIT-03**: route proof\n")
  writeFileSync(path.join(root, args.roadmap), `- [ ] **Phase 262: Contract**\n**Plans:** 55/56 plans executed\n` +
    `| 262. Foundation Admission, Measurement, Custody, and Containment Contract | 55/56 | In Progress|  |\n` +
    `<!-- phase-262-verification-sentinel-status: ${JSON.stringify(carrier())} -->\n`)
  writeFileSync(path.join(root, args.state), `---\ncurrent_phase: 262\ncurrent_phase_name: foundation-admission-measurement-custody-and-containment-con\n` +
    `status: Plan 262-73 closed with blocked obstruction disposition\nstopped_at: Completed 262-73-PLAN.md\nprogress:\n` +
    `  completed_phases: 0\n  completed_plans: 55\n  percent: 98\n---\n` +
    `<!-- phase-262-verification-sentinel-status: ${JSON.stringify(carrier())} -->\n`)
  mkdirSync(path.join(root, "scripts/lib"), { recursive: true })
  writeFileSync(path.join(root, "scripts/lib/v1-38-route-8-source.ts"),
    readFileSync(path.join(sourceRoot, "scripts/lib/v1-38-route-8-source.ts")))
  writeFileSync(path.join(root, ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json"),
    readFileSync(path.join(sourceRoot, ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json")))
  commitAll(root, "fixture: authorized Plan 72 source")
  if (branch === "obstruction") {
    writeFileSync(path.join(root, V138_ROUTE_8_PATHS.obstruction), JSON.stringify({
      schemaVersion: "v1.38-plan-262-72-pre-start-obstruction-v1", status: "blocked",
      routeStarted: false, freshCharged: 0, freshAccepted: 0,
      phase263PlanningAuthorized: false,
    }) + "\n")
    const derived = deriveV138Route8Activation({ branch: "pre_start_obstruction",
      terminal: null, localSealPassed: true })
    writeFileSync(path.join(root, args.disposition), JSON.stringify(derived.disposition) + "\n")
    commitAll(root, "fixture: producer obstruction")
  } else writeTerminalChain(root)
  writeFileSync(path.join(root, args.phaseDir, "262-72-SUMMARY.md"), "# Summary 72\n")
  commitAll(root, "fixture: Plan 72 summary")
  writeFileSync(path.join(root, args.phaseDir, "262-73-SUMMARY.md"), "# Summary 73\n")
  if (!validatorSameCommit) commitAll(root, "fixture: topology anchor")
  writeFileSync(path.join(root, args.validation), validationBytes(branch, unavailable))
  commitAll(root, "fixture: post plan 73 validation")
  return root
}
const sentinelArgs = (args: ReturnType<typeof lifecycleArgs>, binder: string) => ({
  binder, phaseDir: args.phaseDir, requirements: args.requirements, roadmap: args.roadmap,
  state: args.state, validation: args.validation, verification: `${args.phaseDir}/262-VERIFICATION.md`,
})
const lifecycleCliOptions = (args: ReturnType<typeof lifecycleArgs>) => [
  "--phase-dir", args.phaseDir, "--requirements", args.requirements, "--roadmap", args.roadmap,
  "--state", args.state, "--validation", args.validation, "--disposition", args.disposition,
  "--activation-root", args.activationRoot,
]
const subprocessCli = (root: string, argv: string[]) => spawnSync("pnpm", ["exec", "tsx", "-e",
  `import { dispatchV138Route8Cli } from ${JSON.stringify(pathToFileURL(path.join(sourceRoot,
    "scripts/check-v1-38-plan-262-69-route-8-source.ts")).href)}; process.stdout.write(dispatchV138Route8Cli(process.env.FIXTURE_ROOT, JSON.parse(process.env.FIXTURE_ARGV)))`],
{ cwd: sourceRoot, encoding: "utf8", env: { ...process.env, FIXTURE_ROOT: root,
  FIXTURE_ARGV: JSON.stringify(argv) } })
const crashApi = (root: string, expression: string) => spawnSync("pnpm", ["exec", "tsx", "-e",
  `import { V138_PLAN_262_74_TEST_ONLY as api } from ${JSON.stringify(pathToFileURL(path.join(sourceRoot,
    "scripts/check-v1-38-plan-262-69-route-8-source.ts")).href)}; ${expression}`],
{ cwd: sourceRoot, encoding: "utf8", env: { ...process.env, FIXTURE_ROOT: root } })

describe("route-8 Plan 74 lifecycle boundaries", () => {
  const api = V138_PLAN_262_74_TEST_ONLY
  it("authenticates obstruction provenance and writes canonical verification without BLOCKED", () => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    const marker = api.normalize(root, args)
    expect(marker).toMatchObject({ totalPlans: 56, trustworthySummaries: 55,
      soleIncomplete: "262-74", branch: "obstruction", freshCharged: 0,
      freshAccepted: 0, admit03: "blocked", phase263PlanningAuthorized: false })
    expect(marker.planIdentitySha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(api.checkNormalized(root, args)).toEqual(marker)
    const binderPath = ".planning/artifacts/plan-74-binder.json"
    const binder = api.bind(root, { ...args, output: binderPath })
    expect(api.checkBinder(root, { ...args, binder: binderPath })).toEqual(binder)
    const driver = sentinelArgs(args, binderPath)
    const blocked = `${args.phaseDir}/262-74-BLOCKED.md`
    expect(api.run(root, driver)).toBe("gaps_found")
    expect(api.run(root, driver)).toBe("gaps_found")
    expect(api.checkResult(root, { ...driver,
      summary: `${args.phaseDir}/262-74-SUMMARY.md`, blocked })).toBe("gaps_found")
    expect(existsSync(path.join(root, `${args.phaseDir}/262-VERIFICATION.md`))).toBe(true)
    expect(existsSync(path.join(root, blocked))).toBe(false)
    expect(existsSync(path.join(root, args.phaseDir, "262-74-SUMMARY.md"))).toBe(false)
  })

  it("uses BLOCKED only for the explicit verification-carrier fallback", () => {
    const root = lifecycleFixture("obstruction", true)
    const args = lifecycleArgs(); api.normalize(root, args)
    const binderPath = ".planning/artifacts/plan-74-binder.json"
    api.bind(root, { ...args, output: binderPath })
    const driver = sentinelArgs(args, binderPath)
    expect(api.run(root, driver)).toBe("gaps_found")
    expect(existsSync(path.join(root, `${args.phaseDir}/262-VERIFICATION.md`))).toBe(false)
    expect(readFileSync(path.join(root, `${args.phaseDir}/262-74-BLOCKED.md`), "utf8"))
      .toContain('"reason":"ADMIT-03"')
  })

  it("rejects forged binders and tampered exact result artifacts", () => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    api.normalize(root, args)
    const binderPath = ".planning/artifacts/plan-74-binder.json"
    const binder = api.bind(root, { ...args, output: binderPath })
    writeFileSync(path.join(root, binderPath), JSON.stringify({ ...binder,
      phase263PlanningAuthorized: true }) + "\n")
    expect(() => api.run(root, sentinelArgs(args, binderPath)))
      .toThrow("V138_ROUTE8_BINDER_INVALID")
    writeFileSync(path.join(root, binderPath), `${JSON.stringify(binder)}\n`)
    const driver = sentinelArgs(args, binderPath)
    api.run(root, driver)
    writeFileSync(path.join(root, `${args.phaseDir}/262-VERIFICATION.md`), "stale\n")
    expect(() => api.checkResult(root, { ...driver,
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
    expect(() => api.normalize(root, args)).toThrow()
  })

  it("rejects contradictory, 539-of-540, activation, and denial dispositions", () => {
    const contradiction = lifecycleFixture()
    const args = lifecycleArgs()
    const dispositionPath = path.join(contradiction, args.disposition)
    const disposition = JSON.parse(readFileSync(dispositionPath, "utf8"))
    writeFileSync(dispositionPath, JSON.stringify({ ...disposition, branch: "terminal",
      status: "passed", admit03: "passed", phase263PlanningAuthorized: true }) + "\n")
    expect(() => api.normalize(contradiction, args)).toThrow("V138_ROUTE8_DISPOSITION_INVALID")

    const denied = lifecycleFixture()
    const deniedPath = path.join(denied, args.disposition)
    const deniedDisposition = JSON.parse(readFileSync(deniedPath, "utf8"))
    writeFileSync(deniedPath, JSON.stringify({ ...deniedDisposition,
      candidateSearchAuthorized: true }) + "\n")
    expect(() => api.normalize(denied, args)).toThrow("V138_ROUTE8_DISPOSITION_INVALID")

    const activation = lifecycleFixture()
    writeFileSync(path.join(activation, V138_ROUTE_8_PATHS.activation), "{}\n")
    expect(() => api.normalize(activation, args)).toThrow("V138_ROUTE8_ACTIVATION_SELECTION_INVALID")

    const short = lifecycleFixture("terminal")
    const terminalPath = path.join(short, V138_ROUTE_8_PATHS.terminal)
    const terminal = JSON.parse(readFileSync(terminalPath, "utf8"))
    writeFileSync(terminalPath, JSON.stringify({ ...terminal, freshAccepted: 539 }) + "\n")
    expect(() => api.normalize(short, args)).toThrow("V138_ROUTE8_EXECUTION_PROVENANCE_DIRTY")
  })

  it("rejects absolute and symlinked phase paths before mutation", () => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    const validationBefore = readFileSync(path.join(root, args.validation), "utf8")
    expect(() => api.normalize(root, { ...args, phaseDir: path.join(root, args.phaseDir) }))
      .toThrow("V138_ROUTE8_PATH_OUTSIDE_REPOSITORY")
    expect(readFileSync(path.join(root, args.validation), "utf8")).toBe(validationBefore)
    api.normalize(root, args)
    const normalizedBefore = readFileSync(path.join(root, args.validation), "utf8")
    const outside = mkdtempSync(path.join(tmpdir(), "v138-route8-outside-"))
    roots.push(outside)
    symlinkSync(outside, path.join(root, ".planning/escape"))
    expect(() => api.bind(root, { ...args,
      output: ".planning/escape/binder.json" })).toThrow("V138_ROUTE8_PATH_UNSAFE")
    expect(readFileSync(path.join(root, args.validation), "utf8")).toBe(normalizedBefore)
  })

  it("durably resumes normalization from its persisted journal", () => {
    const root = lifecycleFixture()
    const args = lifecycleArgs()
    expect(() => api.normalize(root, args, { faultAfterInstall: 1 }))
      .toThrow("V138_ROUTE8_TEST_INSTALL_FAILURE")
    expect(existsSync(path.join(root, ".planning/.v138-plan26274-transaction-v1/journal.json"))).toBe(true)
    api.recover(root)
    expect(api.checkNormalized(root, args).branch).toBe("obstruction")
    expect(existsSync(path.join(root, ".planning/.v138-plan26274-transaction-v1"))).toBe(false)
  })

  it.each([1, 2, 3, 4, 5])("recovers after abrupt termination at transaction setup boundary %i", step => {
    const root = lifecycleFixture(); const args = lifecycleArgs()
    const result = crashApi(root,
      `api.normalize(process.env.FIXTURE_ROOT, ${JSON.stringify(args)}, { crashAfterSetup: ${step} })`)
    expect(result.status).not.toBe(0)
    api.recover(root)
    expect(api.normalize(root, args).branch).toBe("obstruction")
  })

  it("rejects repository-authored journals without a trusted git-dir intent", () => {
    const root = lifecycleFixture(); const args = lifecycleArgs()
    const directory = path.join(root, ".planning/.v138-plan26274-transaction-v1")
    mkdirSync(directory)
    const body = { schemaVersion: "v1.38-plan-262-74-transaction-v1", purpose: "gaps",
      nonce: "a".repeat(64), testOnly: true, startHead: git(root, ["rev-parse", "HEAD"]),
      changes: [{ path: args.requirements, before: null, after: null }], commit: null }
    writeFileSync(path.join(directory, "journal.json"), stable({ ...body,
      journalRoot: sha(`v138-route8-transaction-v1\0${stable(body)}`) }))
    expect(() => api.recover(root)).toThrow("V138_ROUTE8_TRANSACTION_INVALID")
    expect(readFileSync(path.join(root, args.requirements), "utf8")).toContain("ADMIT-03")
  })

  it("completes, commits, and idempotently resumes authenticated PASS", () => {
    const root = lifecycleFixture("terminal")
    const args = lifecycleArgs()
    const trackedBlocked = `${args.phaseDir}/262-74-BLOCKED.md`
    writeFileSync(path.join(root, trackedBlocked), "tracked stale fallback\n")
    commitAll(root, "fixture: tracked blocked fallback")
    api.normalize(root, args)
    const binderPath = ".planning/artifacts/plan-74-binder.json"
    const binder = api.bind(root, { ...args, output: binderPath })
    expect(() => verifyV138Plan26274Input({ ...binder,
      schemaVersion: "v1.38-plan-262-74-verifier-input-v1" })).not.toThrow()
    const driver = sentinelArgs(args, binderPath)
    expect(api.run(root, driver)).toBe("passed")
    const head = git(root, ["rev-parse", "HEAD"])
    expect(api.run(root, driver)).toBe("passed")
    expect(git(root, ["rev-parse", "HEAD"])).toBe(head)
    expect(readFileSync(path.join(root, args.requirements), "utf8")).toContain("- [x] **ADMIT-03**:")
    expect(readFileSync(path.join(root, args.roadmap), "utf8")).toContain("56/56")
    expect(readFileSync(path.join(root, args.state), "utf8")).toContain("  completed_plans: 56")
    expect(readFileSync(path.join(root, args.state), "utf8")).toContain("  completed_phases: 1")
    expect(readFileSync(path.join(root, args.state), "utf8")).toContain("  percent: 100")
    expect(() => git(root, ["cat-file", "-e", `HEAD:${trackedBlocked}`])).toThrow()
    expect(existsSync(path.join(root, args.phaseDir, "262-74-SUMMARY.md"))).toBe(true)
    expect(existsSync(path.join(root, ".planning/artifacts/v1.38-plan-262-74-closeout-v1.json"))).toBe(true)
    expect(api.checkResult(root, { ...driver, summary: `${args.phaseDir}/262-74-SUMMARY.md`,
      blocked: `${args.phaseDir}/262-74-BLOCKED.md` })).toBe("passed")
  }, 20_000)

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])(
    "keeps completion fail-closed after PASS install boundary %i", boundary => {
      const root = lifecycleFixture("terminal"); const args = lifecycleArgs()
      api.normalize(root, args)
      const binderPath = ".planning/artifacts/plan-74-binder.json"
      api.bind(root, { ...args, output: binderPath })
      const driver = sentinelArgs(args, binderPath)
      const result = crashApi(root,
        `api.run(process.env.FIXTURE_ROOT, ${JSON.stringify(driver)}, { crashAfterInstall: ${boundary} })`)
      expect(result.status).not.toBe(0)
      expect(() => api.checkResult(root, { ...driver, summary: `${args.phaseDir}/262-74-SUMMARY.md`,
        blocked: `${args.phaseDir}/262-74-BLOCKED.md` })).toThrow("V138_ROUTE8_TRANSACTION_PENDING")
      const summaryVisible = existsSync(path.join(root, args.phaseDir, "262-74-SUMMARY.md"))
      if (!summaryVisible) {
        expect(readFileSync(path.join(root, args.requirements), "utf8")).toContain("- [ ] **ADMIT-03**:")
        expect(readFileSync(path.join(root, args.roadmap), "utf8")).toContain("55/56")
        expect(readFileSync(path.join(root, args.state), "utf8")).toContain("  completed_plans: 55")
      }
      api.recover(root)
      expect(api.checkResult(root, { ...driver, summary: `${args.phaseDir}/262-74-SUMMARY.md`,
        blocked: `${args.phaseDir}/262-74-BLOCKED.md` })).toBe("passed")
    }, 20_000,
  )

  it("rejects alternate production paths and unknown positive carrier authority", () => {
    const root = lifecycleFixture(); const args = lifecycleArgs()
    expect(() => normalizeV138PostValidation(root, { ...args, phaseDir: `${args.phaseDir}-alternate` }))
      .toThrow("V138_ROUTE8_CANONICAL_PATH_REQUIRED")
    for (const carrierFile of [args.roadmap, args.state]) {
      const text = readFileSync(path.join(root, carrierFile), "utf8")
      writeFileSync(path.join(root, carrierFile), text.replace("\"total_plans\":56",
        "\"mystery_authority\":true,\"total_plans\":56"))
    }
    expect(() => api.normalize(root, args)).toThrow("V138_ROUTE8_CARRIER_INVALID")
  })

  it("binds topology to committed bytes and validator provenance", () => {
    const root = lifecycleFixture(); const args = lifecycleArgs()
    writeFileSync(path.join(root, args.phaseDir, "262-01-PLAN.md"), "# rewritten\n")
    expect(() => api.normalize(root, args)).toThrow("V138_ROUTE8_TOPOLOGY_DIRTY")
    const stale = lifecycleFixture()
    writeFileSync(path.join(stale, args.validation), validationBytes("terminal"))
    commitAll(stale, "fixture: contradictory validator result")
    expect(() => api.normalize(stale, args)).toThrow("V138_ROUTE8_VALIDATOR_SEMANTICS_INVALID")

    const sameCommit = lifecycleFixture("obstruction", false, true)
    expect(() => api.normalize(sameCommit, args)).toThrow("V138_ROUTE8_VALIDATOR_PROVENANCE_INVALID")

    const duplicate = lifecycleFixture()
    writeFileSync(path.join(duplicate, args.validation), validationBytes("obstruction")
      .replace("| ADMIT-04 | COVERED | evidence | command |", "| ADMIT-04 | COVERED | evidence | command |\n| ADMIT-04 | BLOCKED | contradiction | command |"))
    commitAll(duplicate, "fixture: duplicate validator row")
    expect(() => api.normalize(duplicate, args)).toThrow("V138_ROUTE8_VALIDATOR_SCHEMA_INVALID")
  })

  it("rejects a locally synthesized terminal chain without a pre-Plan-72 producer anchor", () => {
    const root = lifecycleFixture("terminal")
    expect(() => api.checkProductionExecutionProvenance(root))
      .toThrow("V138_ROUTE8_EXECUTION_PRODUCER_ANCHOR_UNAVAILABLE")
  })

  it("authenticates and migrates the exact previous normalization generation", () => {
    const root = lifecycleFixture(); const args = lifecycleArgs()
    const roadmap = readFileSync(path.join(root, args.roadmap))
    const state = readFileSync(path.join(root, args.state))
    const disposition = readFileSync(path.join(root, args.disposition))
    const requirements = readFileSync(path.join(root, args.requirements))
    const legacy = { schemaVersion: "v1.38-plan-262-74-normalized-validation-v1", totalPlans: 56,
      trustworthySummaries: 55, soleIncomplete: "262-74", branch: "obstruction", activationRoot: null,
      dispositionSha256: sha(disposition), requirementsSha256: sha(requirements), roadmapSha256: sha(roadmap),
      stateSha256: sha(state), admit03: "blocked", seal01: "passed_reduced_assurance",
      phase263PlanningAuthorized: false, downstreamAuthorityDenied: true }
    const validationPath = path.join(root, args.validation)
    writeFileSync(validationPath, `${readFileSync(validationPath, "utf8").trimEnd()}\n\n` +
      `<!-- phase-262-route8-post-validation: ${JSON.stringify(legacy)} -->\n`)
    expect(api.normalize(root, args).branch).toBe("obstruction")
    expect(api.checkNormalized(root, args).validator.sourceCommit).toMatch(/^[0-9a-f]{40}$/u)
  })

  it("executes exact production CLI argument contracts in subprocesses", () => {
    const root = lifecycleFixture(); const args = lifecycleArgs()
    const binder = V138_ROUTE_8_PATHS.binder
    const verification = `${args.phaseDir}/262-VERIFICATION.md`
    const exact = [
      ["--normalize-post-validation", ...lifecycleCliOptions(args)],
      ["--check-normalized-post-validation", ...lifecycleCliOptions(args)],
      ["--bind-post-validation", ...lifecycleCliOptions(args), "--output", binder],
      ["--check-post-validation-binder", ...lifecycleCliOptions(args), "--binder", binder],
      ["--run-plan-262-74-sentinel", "--binder", binder, "--phase-dir", args.phaseDir,
        "--requirements", args.requirements, "--roadmap", args.roadmap, "--state", args.state,
        "--validation", args.validation, "--verification", verification],
      ["--check-plan-262-74-result", "--binder", binder, "--verification", verification,
        "--summary", `${args.phaseDir}/262-74-SUMMARY.md`, "--blocked", `${args.phaseDir}/262-74-BLOCKED.md`],
    ]
    for (const argv of exact) {
      const result = subprocessCli(root, argv)
      expect(result.status, `${argv[0]}: ${result.stderr}`).toBe(0)
    }
    const duplicate = subprocessCli(root, ["--check-plan-262-74-result", "--binder", binder,
      "--binder", binder, "--verification", verification, "--summary", `${args.phaseDir}/262-74-SUMMARY.md`,
      "--blocked", `${args.phaseDir}/262-74-BLOCKED.md`])
    expect(duplicate.status).not.toBe(0)
    const unknown = subprocessCli(root, ["--check-plan-262-74-result", "--binder", binder,
      "--verification", verification, "--summary", `${args.phaseDir}/262-74-SUMMARY.md`,
      "--blocked", `${args.phaseDir}/262-74-BLOCKED.md`, "--temp", "x"])
    expect(unknown.status).not.toBe(0)
  }, 30_000)

  it("runs the exact obstruction sequence against canonical committed carriers and history", () => {
    const root = canonicalClone(); const args = lifecycleArgs()
    const binder = V138_ROUTE_8_PATHS.binder
    const verification = `${args.phaseDir}/262-VERIFICATION.md`
    const exact = [
      ["--normalize-post-validation", ...lifecycleCliOptions(args)],
      ["--check-normalized-post-validation", ...lifecycleCliOptions(args)],
      ["--bind-post-validation", ...lifecycleCliOptions(args), "--output", binder],
      ["--check-post-validation-binder", ...lifecycleCliOptions(args), "--binder", binder],
      ["--run-plan-262-74-sentinel", "--binder", binder, "--phase-dir", args.phaseDir,
        "--requirements", args.requirements, "--roadmap", args.roadmap, "--state", args.state,
        "--validation", args.validation, "--verification", verification],
      ["--check-plan-262-74-result", "--binder", binder, "--verification", verification,
        "--summary", `${args.phaseDir}/262-74-SUMMARY.md`, "--blocked", `${args.phaseDir}/262-74-BLOCKED.md`],
    ]
    for (const argv of exact) {
      const result = subprocessCli(root, argv)
      expect(result.status, `${argv[0]}: ${result.stderr}`).toBe(0)
    }
    expect(readFileSync(path.join(root, args.roadmap), "utf8")).toContain('"fresh_charged":0')
    expect(readFileSync(path.join(root, args.state), "utf8")).toContain('"fresh_accepted":0')
    expect(existsSync(path.join(root, args.phaseDir, "262-74-SUMMARY.md"))).toBe(false)
  }, 30_000)

  it("rejects dirty and post-summary execution evidence", () => {
    const args = lifecycleArgs()
    const dirty = lifecycleFixture("terminal")
    writeFileSync(path.join(dirty, V138_ROUTE_8_PATHS.reproduction), "{}\n")
    expect(() => api.normalize(dirty, args)).toThrow("V138_ROUTE8_EXECUTION_PROVENANCE_DIRTY")
    const rewritten = lifecycleFixture("terminal")
    const terminalPath = path.join(rewritten, V138_ROUTE_8_PATHS.terminal)
    writeFileSync(terminalPath, `${readFileSync(terminalPath, "utf8")} `)
    commitAll(rewritten, "fixture: rewrite after Plan 72 summary")
    expect(() => api.normalize(rewritten, args)).toThrow("V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")
  })
})
