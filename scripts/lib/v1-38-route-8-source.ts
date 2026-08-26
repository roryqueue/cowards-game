import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  constants,
  lstatSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export type Sha256 = `sha256:${string}`
const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const stable = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") return Object.fromEntries(
      Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, normalize(child)]),
    )
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}
const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value as Readonly<T>
}
const exactObject = (value: unknown, keys: readonly string[], code: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) fail(code)
  return value as Record<string, unknown>
}
const readJson = (file: string, code: string): unknown => {
  const status = safePath(file)
  if (status !== "regular") fail(status === "missing" ? `${code}_MISSING` : "V138_ROUTE8_PATH_UNSAFE")
  try { return JSON.parse(readFileSync(file, "utf8")) } catch { return fail(code) }
}
const safePath = (file: string): "missing" | "regular" | "unsafe" => {
  try {
    const stat = lstatSync(file)
    return stat.isFile() && !stat.isSymbolicLink() ? "regular" : "unsafe"
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "missing"
    throw error
  }
}
const exclusiveWrite = (file: string, bytes: string): void => {
  if (safePath(file) !== "missing") fail("V138_ROUTE8_DESTINATION_PRESENT")
  const descriptor = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeFileSync(descriptor, bytes) } finally { closeSync(descriptor) }
}

export const V138_ROUTE_8_COMMANDS = deepFreeze([
  "--check", "--derive-authority-seal-no-publish", "--check-authority-seal",
  "--check-plan-262-72-transition", "--check-plan-262-72-disposition",
  "--derive-activation-no-publish", "--check-activation",
  "--normalize-post-validation", "--check-normalized-post-validation",
  "--bind-post-validation", "--check-post-validation-binder",
  "--run-plan-262-74-sentinel", "--check-plan-262-74-result",
] as const)

export const V138_ROUTE_8_PATHS = deepFreeze({
  review: ".planning/artifacts/v1.38-plan-262-70-route-8-source-review-v1.json",
  authorization: ".planning/artifacts/v1.38-plan-262-71-authorization-v10.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v10.json",
  obstruction: ".planning/artifacts/v1.38-plan-262-72-pre-start-obstruction-v1.json",
  routeStart: ".planning/artifacts/v1.38-plan-262-72-route-start-v1.json",
  preflight: ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v13.json",
  calibrationConsumption: ".planning/artifacts/v1.38-plan-262-72-calibration-consumption-v1.json",
  calibration: ".planning/artifacts/v1.38-current-matrix-calibration-v13.json",
  reproductionConsumption: ".planning/artifacts/v1.38-plan-262-72-reproduction-consumption-v1.json",
  reproduction: ".planning/artifacts/v1.38-current-matrix-reproduction-v14.json",
  terminal: ".planning/artifacts/v1.38-plan-262-72-terminal-v1.json",
  disposition: ".planning/artifacts/v1.38-plan-262-73-foundation-activation-disposition-v1.json",
  activation: ".planning/artifacts/v1.38-foundation-activation-root-route8.json",
  binder: ".planning/artifacts/v1.38-plan-262-74-post-validation-binder-v1.json",
} as const)
export const V138_ROUTE_8_DESTINATIONS = deepFreeze(Object.values(V138_ROUTE_8_PATHS))

export const V138_ROUTE_8_CONTRACT = deepFreeze({
  schemaVersion: "v1.38-route-8-source-v1",
  routeOrdinal: 8,
  execution: { executionContextVersion: 13, preflightVersion: 13,
    calibrationVersion: 13, reproductionVersion: 14 },
  bounds: { samplingMilliseconds: 200, minimumEffectiveAvailableBasisPoints: 2500,
    calibrationAttempts: 8, calibrationShards: 4, conditionalReproductionCells: 540 },
  semantics: { singleUse: true, noRetry: true, rulesAuthority: "MATCH_KERNEL",
    supervisedRuntimeOnly: true, strategyExecutionInWebApiGo: false,
    formationMaterialization: false, privateEvidenceOnly: true },
  terminalRule: "pre_start_obstruction_xor_consumed_route_terminal",
  activationRule: "exact_540_of_540_and_reduced_assurance_local_seal",
})

export interface V138Route8SourceCustody {
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly sourceParent: string
  readonly sourceRoot: Sha256
  readonly reviewRoot: Sha256
  readonly checkpointRoot: Sha256
}
export interface V138Route8Authorization {
  readonly schemaVersion: "v1.38-plan-262-71-authorization-v10"
  readonly routeOrdinal: 8
  readonly custody: V138Route8SourceCustody
  readonly execution: typeof V138_ROUTE_8_CONTRACT.execution
  readonly bounds: typeof V138_ROUTE_8_CONTRACT.bounds
  readonly semantics: typeof V138_ROUTE_8_CONTRACT.semantics
  readonly destinations: readonly string[]
  readonly protectedHistory: Readonly<{ retiredRoutes: readonly number[]; historicalCharges: 40 }>
  readonly requirements: readonly string[]
  readonly authority: Readonly<{
    routeEligible: true; routeStarted: false; satisfiesAdmit03: false
    phase263PlanningAuthorized: false; candidateSearchAuthorized: false
    formationMaterializationAuthorized: false; holdoutOpeningAuthorized: false
    publicAuthorized: false; productionAuthorized: false
  }>
  readonly authorizationRoot: Sha256
}
export interface V138Route8Seal {
  readonly schemaVersion: "v1.38-successor-source-seal-v10"
  readonly routeOrdinal: 8
  readonly authorizationRoot: Sha256
  readonly sourceRoot: Sha256
  readonly reviewRoot: Sha256
  readonly directChild: true
  readonly canonicalArtifactCount: 2
  readonly sealRoot: Sha256
}

const custodyValid = (value: unknown): value is V138Route8SourceCustody => {
  const item = exactObject(value, ["sourceCommit", "sourceTree", "sourceParent", "sourceRoot", "reviewRoot", "checkpointRoot"], "V138_ROUTE8_CUSTODY_INVALID")
  return [item.sourceCommit, item.sourceTree, item.sourceParent].every(x => typeof x === "string" && /^[0-9a-f]{40}$/u.test(x)) &&
    [item.sourceRoot, item.reviewRoot, item.checkpointRoot].every(x => typeof x === "string" && /^sha256:[0-9a-f]{64}$/u.test(x))
}
const authorityBody = (custody: V138Route8SourceCustody) => ({
  schemaVersion: "v1.38-plan-262-71-authorization-v10" as const,
  routeOrdinal: 8 as const,
  custody: { ...custody }, execution: { ...V138_ROUTE_8_CONTRACT.execution },
  bounds: { ...V138_ROUTE_8_CONTRACT.bounds }, semantics: { ...V138_ROUTE_8_CONTRACT.semantics },
  destinations: [V138_ROUTE_8_PATHS.obstruction, V138_ROUTE_8_PATHS.routeStart,
    V138_ROUTE_8_PATHS.preflight, V138_ROUTE_8_PATHS.calibrationConsumption,
    V138_ROUTE_8_PATHS.calibration, V138_ROUTE_8_PATHS.reproductionConsumption,
    V138_ROUTE_8_PATHS.reproduction, V138_ROUTE_8_PATHS.terminal],
  protectedHistory: { retiredRoutes: [1, 2, 3, 4, 5, 6, 7], historicalCharges: 40 as const },
  requirements: ["ADMIT-01", "ADMIT-02", "ADMIT-03", "ADMIT-04",
    ...Array.from({ length: 10 }, (_, i) => `MEAS-${String(i + 1).padStart(2, "0")}`),
    "SEAL-01", "DECI-02"],
  authority: { routeEligible: true as const, routeStarted: false as const,
    satisfiesAdmit03: false as const, phase263PlanningAuthorized: false as const,
    candidateSearchAuthorized: false as const, formationMaterializationAuthorized: false as const,
    holdoutOpeningAuthorized: false as const, publicAuthorized: false as const,
    productionAuthorized: false as const },
})
export const buildV138Route8Authorization = (custody: V138Route8SourceCustody): Readonly<V138Route8Authorization> => {
  if (!custodyValid(custody)) fail("V138_ROUTE8_CUSTODY_INVALID")
  const body = authorityBody(custody)
  return deepFreeze({ ...body, authorizationRoot: sha256(`v138-route8-authorization-v10\0${stable(body)}`) }) as Readonly<V138Route8Authorization>
}
export const checkV138Route8Authorization = (value: unknown): Readonly<V138Route8Authorization> => {
  const candidate = value as V138Route8Authorization
  try {
    if (!custodyValid(candidate?.custody)) fail("V138_ROUTE8_AUTHORIZATION_INVALID")
    const expected = buildV138Route8Authorization(candidate.custody)
    if (stable(candidate) !== stable(expected)) fail("V138_ROUTE8_AUTHORIZATION_INVALID")
    return candidate
  } catch { return fail("V138_ROUTE8_AUTHORIZATION_INVALID") }
}
export const buildV138Route8Seal = (authorizationValue: unknown): Readonly<V138Route8Seal> => {
  const authorization = checkV138Route8Authorization(authorizationValue)
  const body = { schemaVersion: "v1.38-successor-source-seal-v10" as const,
    routeOrdinal: 8 as const, authorizationRoot: authorization.authorizationRoot,
    sourceRoot: authorization.custody.sourceRoot, reviewRoot: authorization.custody.reviewRoot,
    directChild: true as const, canonicalArtifactCount: 2 as const }
  return deepFreeze({ ...body, sealRoot: sha256(`v138-route8-seal-v10\0${stable(body)}`) })
}
export const checkV138Route8AuthoritySeal = (authorizationValue: unknown, sealValue: unknown): true => {
  const authorization = checkV138Route8Authorization(authorizationValue)
  const expected = buildV138Route8Seal(authorization)
  if (stable(sealValue) !== stable(expected)) fail("V138_ROUTE8_SEAL_INVALID")
  return true
}

const artifact = (repoRoot: string, key: keyof typeof V138_ROUTE_8_PATHS): string =>
  path.resolve(repoRoot, V138_ROUTE_8_PATHS[key])
const optional = (repoRoot: string, key: keyof typeof V138_ROUTE_8_PATHS): unknown | undefined => {
  const file = artifact(repoRoot, key)
  const status = safePath(file)
  if (status === "unsafe") fail("V138_ROUTE8_PATH_UNSAFE")
  return status === "missing" ? undefined : readJson(file, "V138_ROUTE8_ARTIFACT_INVALID")
}
const assertAbsent = (repoRoot: string, keys: readonly (keyof typeof V138_ROUTE_8_PATHS)[]): void => {
  for (const key of keys) if (safePath(artifact(repoRoot, key)) !== "missing") fail("V138_ROUTE8_UNEXPECTED_DESTINATION")
}
const obstructionValid = (value: unknown): true => {
  const x = exactObject(value, ["schemaVersion", "status", "routeStarted", "freshCharged", "freshAccepted", "phase263PlanningAuthorized"], "V138_ROUTE8_OBSTRUCTION_INVALID")
  if (x.schemaVersion !== "v1.38-plan-262-72-pre-start-obstruction-v1" || x.status !== "blocked" || x.routeStarted !== false || x.freshCharged !== 0 || x.freshAccepted !== 0 || x.phase263PlanningAuthorized !== false) fail("V138_ROUTE8_OBSTRUCTION_INVALID")
  return true
}
const transitionRouteValid = (repoRoot: string): "stopped_terminal" | "admitted_pending_reproduction" => {
  const route = exactObject(optional(repoRoot, "routeStart"), ["schemaVersion", "routeOrdinal", "consumed", "executionContextVersion", "preflightVersion"], "V138_ROUTE8_ROUTE_START_INVALID")
  if (route.schemaVersion !== "v1.38-plan-262-72-route-start-v1" || route.routeOrdinal !== 8 || route.consumed !== true || route.executionContextVersion !== 13 || route.preflightVersion !== 13) fail("V138_ROUTE8_ROUTE_START_INVALID")
  const preflight = exactObject(optional(repoRoot, "preflight"), ["schemaVersion", "samplingMilliseconds", "minimumEffectiveAvailableBasisPoints", "status"], "V138_ROUTE8_PREFLIGHT_INVALID")
  if (preflight.schemaVersion !== "v1.38-current-matrix-headroom-preflight-v13" || preflight.samplingMilliseconds !== 200 || preflight.minimumEffectiveAvailableBasisPoints !== 2500 || !["admitted", "stopped"].includes(String(preflight.status))) fail("V138_ROUTE8_PREFLIGHT_INVALID")
  const consumption = exactObject(optional(repoRoot, "calibrationConsumption"), ["schemaVersion", "charged", "shards", "consumed"], "V138_ROUTE8_CONSUMPTION_INVALID")
  if (consumption.schemaVersion !== "v1.38-plan-262-72-calibration-consumption-v1" || consumption.charged !== 8 || consumption.shards !== 4 || consumption.consumed !== true) fail("V138_ROUTE8_CONSUMPTION_INVALID")
  const calibration = exactObject(optional(repoRoot, "calibration"), ["schemaVersion", "status", "charged", "shards"], "V138_ROUTE8_CALIBRATION_INVALID")
  if (calibration.schemaVersion !== "v1.38-current-matrix-calibration-v13" || calibration.charged !== 8 || calibration.shards !== 4 || !["admitted", "stopped"].includes(String(calibration.status))) fail("V138_ROUTE8_CALIBRATION_INVALID")
  assertAbsent(repoRoot, ["reproductionConsumption", "reproduction"])
  const terminal = optional(repoRoot, "terminal")
  if (calibration.status === "admitted") {
    if (terminal !== undefined || preflight.status !== "admitted") fail("V138_ROUTE8_TRANSITION_BRANCH_INVALID")
    return "admitted_pending_reproduction"
  }
  const t = exactObject(terminal, ["schemaVersion", "disposition", "routeOrdinal", "freshCharged", "freshAccepted", "satisfiesAdmit03"], "V138_ROUTE8_TERMINAL_INVALID")
  if (t.schemaVersion !== "v1.38-plan-262-72-terminal-v1" || t.disposition !== "calibration_stopped" || t.routeOrdinal !== 8 || t.freshCharged !== 8 || t.freshAccepted !== 0 || t.satisfiesAdmit03 !== false) fail("V138_ROUTE8_TERMINAL_INVALID")
  return "stopped_terminal"
}
export const checkV138Plan26272Transition = (input: { readonly repoRoot: string }): "pre_start_obstruction" | "stopped_terminal" | "admitted_pending_reproduction" => {
  const obstruction = optional(input.repoRoot, "obstruction")
  const route = optional(input.repoRoot, "routeStart")
  if ((obstruction === undefined) === (route === undefined)) fail("V138_ROUTE8_TRANSITION_BRANCH_INVALID")
  if (obstruction !== undefined) {
    obstructionValid(obstruction)
    assertAbsent(input.repoRoot, ["routeStart", "preflight", "calibrationConsumption", "calibration", "reproductionConsumption", "reproduction", "terminal"])
    return "pre_start_obstruction"
  }
  return transitionRouteValid(input.repoRoot)
}
export const checkV138Plan26272Disposition = (input: { readonly repoRoot: string }): "obstruction" | "terminal" => {
  const obstruction = optional(input.repoRoot, "obstruction")
  const terminal = optional(input.repoRoot, "terminal")
  if ((obstruction === undefined) === (terminal === undefined)) fail("V138_ROUTE8_DISPOSITION_BRANCH_INVALID")
  if (obstruction !== undefined) {
    obstructionValid(obstruction)
    assertAbsent(input.repoRoot, ["routeStart", "preflight", "calibrationConsumption", "calibration", "reproductionConsumption", "reproduction", "terminal"])
    return "obstruction"
  }
  const item = terminal as Record<string, unknown>
  if (item?.schemaVersion !== "v1.38-plan-262-72-terminal-v1" || item.routeOrdinal !== 8 || typeof item.disposition !== "string" || typeof item.satisfiesAdmit03 !== "boolean") fail("V138_ROUTE8_TERMINAL_INVALID")
  if (optional(input.repoRoot, "routeStart") === undefined) fail("V138_ROUTE8_TERMINAL_INVALID")
  return "terminal"
}

export interface V138Route8TerminalProjection { readonly disposition: string; readonly freshCharged: number; readonly freshAccepted: number; readonly satisfiesAdmit03: boolean }
export const deriveV138Route8Activation = (input: { readonly branch: "pre_start_obstruction" | "terminal"; readonly terminal: V138Route8TerminalProjection | null; readonly localSealPassed: boolean }) => {
  const empirical = input.branch === "terminal" && input.terminal?.disposition === "reproduction_passed" && input.terminal.freshCharged === 540 && input.terminal.freshAccepted === 540 && input.terminal.satisfiesAdmit03 === true
  const passed = empirical && input.localSealPassed
  const dispositionBody = { schemaVersion: "v1.38-plan-262-73-foundation-activation-disposition-v1",
    branch: input.branch, admit03: empirical ? "passed" : "blocked", seal01: input.localSealPassed ? "passed_reduced_assurance" : "blocked",
    status: passed ? "passed" : "blocked", phase263PlanningAuthorized: passed,
    candidateSearchAuthorized: false, formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false, publicAuthorized: false, productAuthorized: false,
    productionAuthorized: false, gameplayChangeAuthorized: false }
  const disposition = deepFreeze({ ...dispositionBody,
    dispositionRoot: sha256(`v138-route8-disposition\0${stable(dispositionBody)}`) })
  const activation = passed ? deepFreeze({ schemaVersion: "v1.38-foundation-activation-root-route8",
    dispositionRoot: disposition.dispositionRoot, phase263PlanningAuthorized: true as const,
    candidateSearchAuthorized: false as const, phase264PlanningAuthorized: false as const,
    formationMaterializationAuthorized: false as const, holdoutOpeningAuthorized: false as const,
    publicAuthorized: false as const, productAuthorized: false as const,
    productionAuthorized: false as const }) : null
  return deepFreeze({ disposition, activation })
}

export const deriveV138Route8SourceCustody = (repoRoot: string): V138Route8SourceCustody => {
  const git = (args: string[]) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim()
  const sourcePath = "scripts/lib/v1-38-route-8-source.ts"
  const sourceCommit = git(["rev-list", "-1", "HEAD", "--", sourcePath])
  if (!/^[0-9a-f]{40}$/u.test(sourceCommit)) fail("V138_ROUTE8_SOURCE_NOT_COMMITTED")
  const [tree, parents] = git(["show", "-s", "--format=%T%n%P", sourceCommit]).split("\n")
  const sourceParent = parents?.split(" ")[0]
  if (!tree || !sourceParent) fail("V138_ROUTE8_SOURCE_CUSTODY_INVALID")
  const bytes = execFileSync("git", ["show", `${sourceCommit}:${sourcePath}`], { cwd: repoRoot })
  const review = readJson(path.resolve(repoRoot, V138_ROUTE_8_PATHS.review), "V138_ROUTE8_REVIEW_INVALID") as Record<string, unknown>
  const reviewRoot = review.reviewRoot
  if (typeof reviewRoot !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(reviewRoot)) fail("V138_ROUTE8_REVIEW_INVALID")
  return { sourceCommit, sourceTree: tree, sourceParent, sourceRoot: sha256(bytes),
    reviewRoot: reviewRoot as Sha256,
    checkpointRoot: "sha256:f1bc58ff9a4f107c293f1bfba9e7d44d5eda92aac78fbe93f7596889d04f404a" }
}

export const writeV138Route8AuthoritySeal = (repoRoot: string): readonly [V138Route8Authorization, V138Route8Seal] => {
  const authorization = buildV138Route8Authorization(deriveV138Route8SourceCustody(repoRoot))
  const seal = buildV138Route8Seal(authorization)
  exclusiveWrite(artifact(repoRoot, "authorization"), stable(authorization))
  try { exclusiveWrite(artifact(repoRoot, "seal"), stable(seal)) } catch (error) { fail(`V138_ROUTE8_PARTIAL_PUBLICATION:${error instanceof Error ? error.message : "unknown"}`) }
  return [authorization, seal]
}

const parseArgs = (argv: readonly string[]): Map<string, string> => {
  const result = new Map<string, string>()
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]
    const value = argv[i + 1]
    if (!key?.startsWith("--") || value === undefined || value.startsWith("--")) fail("V138_ROUTE8_ARGUMENTS_INVALID")
    result.set(key, value)
  }
  return result
}
const cli = (): void => {
  const argv = process.argv.slice(2)
  const command = argv[0]
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
  if (command === "--derive-authority-seal-no-publish" && argv.length === 1) {
    const authorization = buildV138Route8Authorization(deriveV138Route8SourceCustody(repoRoot))
    process.stdout.write(`${JSON.stringify({ authorizationRoot: authorization.authorizationRoot,
      sealRoot: buildV138Route8Seal(authorization).sealRoot, authority: "route_eligible_not_started" })}\n`); return
  }
  const args = parseArgs(argv.slice(1))
  if (command === "--check-authority-seal") {
    checkV138Route8AuthoritySeal(readJson(path.resolve(repoRoot, args.get("--authorization") ?? ""), "V138_ROUTE8_AUTHORIZATION_INVALID"), readJson(path.resolve(repoRoot, args.get("--seal") ?? ""), "V138_ROUTE8_SEAL_INVALID"))
    process.stdout.write('{"status":"passed","routeStarted":false}\n'); return
  }
  if (command === "--check-plan-262-72-transition") {
    process.stdout.write(`${JSON.stringify({ status: checkV138Plan26272Transition({ repoRoot }) })}\n`); return
  }
  if (command === "--check-plan-262-72-disposition") {
    process.stdout.write(`${JSON.stringify({ status: checkV138Plan26272Disposition({ repoRoot }) })}\n`); return
  }
  if (command === "--derive-activation-no-publish") {
    const branch = checkV138Plan26272Disposition({ repoRoot })
    const terminal = branch === "terminal" ? optional(repoRoot, "terminal") as V138Route8TerminalProjection : null
    const seal = readJson(path.resolve(repoRoot, args.get("--local-seal") ?? ""), "V138_ROUTE8_LOCAL_SEAL_INVALID") as Record<string, unknown>
    const localSealPassed = seal.satisfiesRevisedSeal01 === true && seal.independentCustodyClaimed === false
    process.stdout.write(`${stable(deriveV138Route8Activation({ branch: branch === "obstruction" ? "pre_start_obstruction" : "terminal", terminal, localSealPassed }))}`); return
  }
  if (command === "--check-activation") {
    const disposition = readJson(path.resolve(repoRoot, args.get("--disposition") ?? ""), "V138_ROUTE8_DISPOSITION_INVALID") as Record<string, unknown>
    const activationPath = path.resolve(repoRoot, args.get("--activation") ?? "")
    const activationStatus = safePath(activationPath)
    if (disposition.status === "passed" ? activationStatus !== "regular" : activationStatus !== "missing") fail("V138_ROUTE8_ACTIVATION_INVALID")
    process.stdout.write(`${JSON.stringify({ status: disposition.status })}\n`); return
  }
  fail("V138_ROUTE8_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli() } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V138_ROUTE8_FAILED"}\n`)
    process.exitCode = 1
  }
}
