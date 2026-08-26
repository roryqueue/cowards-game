#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  V138_ROUTE_8_COMMANDS,
  V138_ROUTE_8_CONTRACT,
  V138_ROUTE_8_DESTINATIONS,
  V138_ROUTE_8_PATHS,
  checkV138Plan26272Disposition,
  deriveV138Route8Activation,
} from "./lib/v1-38-route-8-source.js"
import { checkV138Plan26268ReplacementAuthorization } from
  "./check-v1-38-plan-262-68-replacement-authorization.js"

type Sha256 = `sha256:${string}`
const fail = (code: string): never => { throw new TypeError(code) }
const digest = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const stable = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize) :
    item !== null && typeof item === "object" ? Object.fromEntries(
      Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, normalize(child)]),
    ) : item
  return `${JSON.stringify(normalize(value))}\n`
}
const safe = (file: string): "missing" | "regular" | "unsafe" => {
  try { const s = lstatSync(file); return s.isFile() && !s.isSymbolicLink() ? "regular" : "unsafe" }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return "missing"; throw error }
}
const readText = (file: string, code: string): string => {
  if (safe(file) !== "regular") fail(code)
  return readFileSync(file, "utf8")
}
const readJson = (file: string, code: string): Record<string, unknown> => {
  try { const parsed = JSON.parse(readText(file, code)); if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) fail(code); return parsed }
  catch { return fail(code) }
}
const writeReplace = (file: string, bytes: string): void => {
  const temporary = `${file}.tmp-${process.pid}`
  if (safe(temporary) !== "missing") fail("V138_ROUTE8_TEMP_PRESENT")
  writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 })
  try { renameSync(temporary, file) } finally { if (safe(temporary) !== "missing") rmSync(temporary) }
}
const writeExclusive = (file: string, bytes: string): void => {
  if (safe(file) !== "missing") fail("V138_ROUTE8_DESTINATION_PRESENT")
  writeFileSync(file, bytes, { flag: "wx", mode: 0o600 })
}

const phaseBase = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const immutable = new Map<string, string>([
  [`${phaseBase}/archived/262-48-ROUTE-V9-HISTORICAL.md`, "d531e64db2be1d804248f390c1cda215f3d237cdc58d40498e057bf2dc5c32f0"],
  [`${phaseBase}/archived/262-48-HISTORICAL.md`, "8ac51a38c5b73d901dde595ed315bf497a42ce243513e056e3a67b22c37dd3d1"],
  [`${phaseBase}/archived/262-56-HISTORICAL.md`, "18f7cb76e397958918eca1c9ae8abb758b17a34a0b44f1201969b35e603a64cb"],
  [`${phaseBase}/archived/262-57-HISTORICAL.md`, "d17e7df7f22a2457739a123203e358d30d9b7da5631eb2dfdb2d9cf2d310fe1e"],
  [`${phaseBase}/archived/262-62-HISTORICAL.md`, "438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a"],
])
const resolveRoot = (): string => path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ensureWithin = (root: string, file: string): string => {
  if (!file || path.isAbsolute(file)) fail("V138_ROUTE8_PATH_OUTSIDE_REPOSITORY")
  const rootPath = path.resolve(root)
  if (lstatSync(rootPath).isSymbolicLink()) fail("V138_ROUTE8_PATH_UNSAFE")
  const rootReal = realpathSync(rootPath)
  const resolved = path.resolve(rootPath, file)
  const relative = path.relative(rootPath, resolved)
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    fail("V138_ROUTE8_PATH_OUTSIDE_REPOSITORY")
  }
  let cursor = rootPath
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment)
    try {
      if (lstatSync(cursor).isSymbolicLink()) fail("V138_ROUTE8_PATH_UNSAFE")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break
      throw error
    }
  }
  let parent = path.dirname(resolved)
  while (safe(parent) === "missing") parent = path.dirname(parent)
  const parentReal = realpathSync(parent)
  if (parentReal !== rootReal && !parentReal.startsWith(`${rootReal}${path.sep}`)) fail("V138_ROUTE8_PATH_OUTSIDE_REPOSITORY")
  return resolved
}

export const checkV138Plan26269Route8Source = (repoRoot: string) => {
  const actualRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: repoRoot, encoding: "utf8" }).trim()
  if (path.resolve(actualRoot) !== path.resolve(repoRoot)) fail("V138_ROUTE8_REPOSITORY_ROOT_INVALID")
  if (safe(path.resolve(repoRoot, `${phaseBase}/262-48-PLAN.md`)) !== "missing") fail("V138_ROUTE8_ACTIVE_262_48_PRESENT")
  for (const [repoPath, expected] of immutable) {
    const file = path.resolve(repoRoot, repoPath)
    if (safe(file) !== "regular" || digest(readFileSync(file)).slice(7) !== expected) fail("V138_ROUTE8_HISTORY_INVALID")
  }
  for (const carrier of [".planning/ROADMAP.md", ".planning/STATE.md"]) {
    const text = readText(path.resolve(repoRoot, carrier), "V138_ROUTE8_TOPOLOGY_INVALID")
    if ((text.match(/phase-262-verification-sentinel-status/g) ?? []).length !== 1 ||
      text.includes("phase-262-successor-status") || text.includes("normal_validate_verify_phase_workflow") ||
      !text.includes('"total_plans":56') || !text.includes('"trustworthy_summaries":50') ||
      !text.includes('"active_successors":["262-69","262-70","262-71","262-72","262-73","262-74"]')) fail("V138_ROUTE8_TOPOLOGY_INVALID")
  }
  const protocol = readText(path.resolve(repoRoot, `${phaseBase}/262-ROUTE8-EXECUTION-PROTOCOL.md`), "V138_ROUTE8_PROTOCOL_INVALID")
  for (const phrase of ["Unfiltered `$gsd-execute-phase 262` is prohibited", "--normalize-post-validation", "--bind-post-validation", "--run-plan-262-74-sentinel"]) if (!protocol.includes(phrase)) fail("V138_ROUTE8_PROTOCOL_INVALID")
  checkV138Plan26268ReplacementAuthorization(repoRoot)
  if (V138_ROUTE_8_COMMANDS.length !== 13 || V138_ROUTE_8_CONTRACT.routeOrdinal !== 8 ||
      V138_ROUTE_8_CONTRACT.bounds.samplingMilliseconds !== 200 ||
      V138_ROUTE_8_CONTRACT.bounds.minimumEffectiveAvailableBasisPoints !== 2500 ||
      V138_ROUTE_8_CONTRACT.bounds.calibrationAttempts !== 8 ||
      V138_ROUTE_8_CONTRACT.bounds.calibrationShards !== 4 ||
      V138_ROUTE_8_CONTRACT.bounds.conditionalReproductionCells !== 540) fail("V138_ROUTE8_CONTRACT_INVALID")
  for (const repoPath of V138_ROUTE_8_DESTINATIONS) if (safe(path.resolve(repoRoot, repoPath)) !== "missing") fail("V138_ROUTE8_DESTINATION_PRESENT")
  const source = readText(path.resolve(repoRoot, "scripts/lib/v1-38-route-8-source.ts"), "V138_ROUTE8_SOURCE_MISSING")
  for (const prohibited of ["Math.random", "Date.now", "node:vm", "executePreparedRuntimeServiceRequestV118", "writeV138AuthoritativeMatrixV12Receipt"]) if (source.includes(prohibited)) fail("V138_ROUTE8_WRITER_REACHABLE")
  return Object.freeze({ status: "passed", sourceOnly: true, authority: false,
    routeOrdinal: 8, destinationCount: V138_ROUTE_8_DESTINATIONS.length })
}

interface NormalizedMarker {
  schemaVersion: "v1.38-plan-262-74-normalized-validation-v1"
  totalPlans: 56
  trustworthySummaries: 55
  soleIncomplete: "262-74"
  planIdentitySha256: Sha256
  summaryIdentitySha256: Sha256
  branch: "obstruction" | "terminal"
  activationRoot: string | null
  activationSha256: Sha256 | null
  dispositionRoot: Sha256
  dispositionSha256: Sha256
  requirementsSha256: Sha256
  roadmapSha256: Sha256
  stateSha256: Sha256
  freshCharged: 0 | 540
  freshAccepted: 0 | 540
  admit03: "passed" | "blocked"
  seal01: "passed_reduced_assurance"
  phase263PlanningAuthorized: boolean
  downstreamAuthorityDenied: true
}
const normalizedTag = "phase-262-route8-post-validation"
const markerLine = (value: NormalizedMarker): string => `<!-- ${normalizedTag}: ${JSON.stringify(value)} -->`
const extractMarker = (text: string): NormalizedMarker => {
  const matches = [...text.matchAll(new RegExp(`<!-- ${normalizedTag}: (\\{[^\\n]+\\}) -->`, "g"))]
  if (matches.length !== 1) fail("V138_ROUTE8_VALIDATION_MARKER_INVALID")
  try { return JSON.parse(matches[0]![1]!) as NormalizedMarker } catch { return fail("V138_ROUTE8_VALIDATION_MARKER_INVALID") }
}
interface LifecycleArgs { phaseDir: string; requirements: string; roadmap: string; state: string; validation: string; disposition: string; activationRoot: string }
const actual = (root: string, value: string): string => ensureWithin(root, value)
const phaseFile = (root: string, phaseDir: string, name: string): string =>
  actual(root, path.join(phaseDir, name))
const exactRecord = (value: unknown, keys: readonly string[], code: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      stable(Object.keys(value as Record<string, unknown>).sort()) !== stable([...keys].sort())) fail(code)
  return value as Record<string, unknown>
}
const canonicalPlanNumbers = Object.freeze([
  1, 2, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 42, 44, 45, 49,
  51, 52, 53, 54, 60, 61, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74,
])
const identityName = (number: number, kind: "PLAN" | "SUMMARY"): string =>
  `262-${String(number).padStart(2, "0")}-${kind}.md`
const topology = (root: string, phaseDir: string) => {
  const directory = actual(root, phaseDir)
  if (safe(directory) !== "unsafe" || !lstatSync(directory).isDirectory()) fail("V138_ROUTE8_SUMMARY_INDEX_INVALID")
  const entries = readdirSync(directory, { withFileTypes: true })
  const plans = entries.filter(entry => /^262-\d+-PLAN\.md$/u.test(entry.name))
  const summaries = entries.filter(entry => /^262-\d+-SUMMARY\.md$/u.test(entry.name))
  if ([...plans, ...summaries].some(entry => !entry.isFile() || entry.isSymbolicLink())) fail("V138_ROUTE8_SUMMARY_INDEX_INVALID")
  const planNames = plans.map(entry => entry.name).sort()
  const summaryNames = summaries.map(entry => entry.name).sort()
  const expectedPlans = canonicalPlanNumbers.map(number => identityName(number, "PLAN")).sort()
  const expectedSummaries = canonicalPlanNumbers.filter(number => number !== 74)
    .map(number => identityName(number, "SUMMARY")).sort()
  if (stable(planNames) !== stable(expectedPlans) || stable(summaryNames) !== stable(expectedSummaries)) {
    fail("V138_ROUTE8_SUMMARY_INDEX_INVALID")
  }
  return Object.freeze({
    planIdentitySha256: digest(`v138-route8-plan-identities\0${stable(planNames)}`),
    summaryIdentitySha256: digest(`v138-route8-summary-identities\0${stable(summaryNames)}`),
  })
}
const checkedDisposition = (root: string, args: LifecycleArgs) => {
  if (args.activationRoot !== "auto" || actual(root, args.disposition) !== actual(root, V138_ROUTE_8_PATHS.disposition)) {
    fail("V138_ROUTE8_ACTIVATION_SELECTION_INVALID")
  }
  const checkedBranch = checkV138Plan26272Disposition({ repoRoot: root })
  const dispositionBytes = readText(actual(root, args.disposition), "V138_ROUTE8_DISPOSITION_INVALID")
  let disposition: Record<string, unknown>
  try { disposition = JSON.parse(dispositionBytes) as Record<string, unknown> } catch { return fail("V138_ROUTE8_DISPOSITION_INVALID") }
  let terminal: { disposition: string; freshCharged: number; freshAccepted: number; satisfiesAdmit03: boolean } | null = null
  if (checkedBranch === "terminal") {
    const value = exactRecord(readJson(actual(root, V138_ROUTE_8_PATHS.terminal), "V138_ROUTE8_TERMINAL_INVALID"),
      ["schemaVersion", "disposition", "routeOrdinal", "freshCharged", "freshAccepted", "satisfiesAdmit03"], "V138_ROUTE8_TERMINAL_INVALID")
    if (value.schemaVersion !== "v1.38-plan-262-72-terminal-v1" || value.routeOrdinal !== 8 ||
        value.disposition !== "reproduction_passed" || value.freshCharged !== 540 ||
        value.freshAccepted !== 540 || value.satisfiesAdmit03 !== true) fail("V138_ROUTE8_TERMINAL_INVALID")
    terminal = { disposition: "reproduction_passed", freshCharged: 540,
      freshAccepted: 540, satisfiesAdmit03: true }
  }
  const derived = deriveV138Route8Activation({
    branch: checkedBranch === "obstruction" ? "pre_start_obstruction" : "terminal",
    terminal, localSealPassed: true,
  })
  if (stable(disposition) !== stable(derived.disposition)) fail("V138_ROUTE8_DISPOSITION_INVALID")
  const activationPath = actual(root, V138_ROUTE_8_PATHS.activation)
  if (derived.activation === null) {
    if (safe(activationPath) !== "missing") fail("V138_ROUTE8_ACTIVATION_SELECTION_INVALID")
  } else {
    const activation = readJson(activationPath, "V138_ROUTE8_ACTIVATION_SELECTION_INVALID")
    if (stable(activation) !== stable(derived.activation)) fail("V138_ROUTE8_ACTIVATION_SELECTION_INVALID")
  }
  return Object.freeze({ branch: checkedBranch, disposition, dispositionBytes,
    activationRoot: derived.activation === null ? null : V138_ROUTE_8_PATHS.activation,
    activationSha256: derived.activation === null ? null : digest(readText(activationPath, "V138_ROUTE8_ACTIVATION_SELECTION_INVALID")),
    freshCharged: (terminal?.freshCharged ?? 0) as 0 | 540,
    freshAccepted: (terminal?.freshAccepted ?? 0) as 0 | 540 })
}
const sentinelTag = "phase-262-verification-sentinel-status"
const carrierPattern = new RegExp(`<!-- ${sentinelTag}: (\\{[^\\n]+\\}) -->`, "g")
const renderCarrier = (text: string, disposition: ReturnType<typeof checkedDisposition>): string => {
  const matches = [...text.matchAll(carrierPattern)]
  if (matches.length !== 1 || text.includes("phase-262-successor-status")) fail("V138_ROUTE8_CARRIER_INVALID")
  let current: Record<string, unknown>
  try { current = JSON.parse(matches[0]![1]!) as Record<string, unknown> } catch { return fail("V138_ROUTE8_CARRIER_INVALID") }
  const six = ["262-69", "262-70", "262-71", "262-72", "262-73", "262-74"]
  const active = stable(current.active_successors) === stable(six) || stable(current.active_successors) === stable(["262-74"])
  if (current.total_plans !== 56 || ![50, 55].includes(Number(current.trustworthy_summaries)) || !active ||
      current.bulk_execute_phase_prohibited !== true || current.sentinel_plan !== "262-74" ||
      current.sentinel_summary_policy !== "pass_only_after_verification" ||
      current.candidate_search_authorized !== false || current.formation_materialization_authorized !== false ||
      current.holdout_opening_authorized !== false || current.public_authorized !== false ||
      current.production_authorized !== false) fail("V138_ROUTE8_CARRIER_INVALID")
  const obstruction = disposition.branch === "obstruction"
  const normalized = { ...current, proof_status: "route_8_post_validation_normalized",
    admit_03: obstruction ? "blocked" : "passed", seal_01: "passed_reduced_assurance",
    route_started: !obstruction, fresh_charged: disposition.freshCharged,
    fresh_accepted: disposition.freshAccepted, candidate_search_authorized: false,
    phase263_authorized: !obstruction, formation_materialization_authorized: false,
    holdout_opening_authorized: false, public_authorized: false,
    foundation_activation_root_present: !obstruction, production_authorized: false,
    next_action: "run-post-validation-binder", trustworthy_summaries: 55,
    active_successors: ["262-74"], incomplete: ["262-74"],
    plan_72_disposition: obstruction ? "pre_start_obstruction" : "terminal",
    plan_73_disposition: obstruction ? "blocked" : "passed" }
  return text.replace(carrierPattern, `<!-- ${sentinelTag}: ${JSON.stringify(normalized)} -->`)
}
interface Replacement { file: string; bytes: string }
interface InstallOptions { faultAfterInstall?: number }
const installTransaction = (changes: readonly Replacement[], options: InstallOptions = {}): void => {
  const seen = new Set(changes.map(change => change.file))
  if (seen.size !== changes.length) fail("V138_ROUTE8_TRANSACTION_INVALID")
  const originals = changes.map(change => ({ file: change.file,
    bytes: safe(change.file) === "regular" ? readFileSync(change.file, "utf8") : null }))
  const temporaries = changes.map((change, index) => `${change.file}.tmp-${process.pid}-${index}`)
  try {
    for (let index = 0; index < changes.length; index += 1) {
      if (safe(temporaries[index]!) !== "missing") fail("V138_ROUTE8_TEMP_PRESENT")
      writeFileSync(temporaries[index]!, changes[index]!.bytes, { flag: "wx", mode: 0o600 })
    }
    let installed = 0
    for (let index = 0; index < changes.length; index += 1) {
      renameSync(temporaries[index]!, changes[index]!.file)
      installed += 1
      if (options.faultAfterInstall === installed) fail("V138_ROUTE8_TEST_INSTALL_FAILURE")
    }
  } catch (error) {
    for (const original of originals) {
      if (original.bytes === null) {
        if (safe(original.file) === "regular") rmSync(original.file)
      } else if (safe(original.file) === "regular" && readFileSync(original.file, "utf8") !== original.bytes) {
        writeReplace(original.file, original.bytes)
      }
    }
    throw error
  } finally {
    for (const temporary of temporaries) if (safe(temporary) !== "missing") rmSync(temporary)
  }
}
const snapshot = (root: string, args: LifecycleArgs) => {
  const identities = topology(root, args.phaseDir)
  const disposition = checkedDisposition(root, args)
  const requirementsBytes = readText(actual(root, args.requirements), "V138_ROUTE8_REQUIREMENTS_INVALID")
  const roadmapPath = actual(root, args.roadmap)
  const statePath = actual(root, args.state)
  const roadmapBytes = renderCarrier(readText(roadmapPath, "V138_ROUTE8_ROADMAP_INVALID"), disposition)
  const stateBytes = renderCarrier(readText(statePath, "V138_ROUTE8_STATE_INVALID"), disposition)
  const marker: NormalizedMarker = { schemaVersion: "v1.38-plan-262-74-normalized-validation-v1",
    totalPlans: 56, trustworthySummaries: 55, soleIncomplete: "262-74", ...identities,
    branch: disposition.branch, activationRoot: disposition.activationRoot,
    activationSha256: disposition.activationSha256,
    dispositionRoot: disposition.disposition.dispositionRoot as Sha256,
    dispositionSha256: digest(disposition.dispositionBytes), requirementsSha256: digest(requirementsBytes),
    roadmapSha256: digest(roadmapBytes), stateSha256: digest(stateBytes),
    freshCharged: disposition.freshCharged, freshAccepted: disposition.freshAccepted,
    admit03: disposition.branch === "obstruction" ? "blocked" : "passed",
    seal01: "passed_reduced_assurance", phase263PlanningAuthorized: disposition.branch === "terminal",
    downstreamAuthorityDenied: true }
  return { marker, roadmapPath, roadmapBytes, statePath, stateBytes }
}
export const normalizeV138PostValidation = (root: string, args: LifecycleArgs,
  options: InstallOptions = {}): NormalizedMarker => {
  const prepared = snapshot(root, args)
  const validationPath = actual(root, args.validation)
  const validation = readText(validationPath, "V138_ROUTE8_VALIDATION_INVALID")
  const normalizedValidation = `${validation.replace(/^.*phase-262-successor-status.*\n?/gmu, "")
    .replace(new RegExp(`^.*${normalizedTag}.*\\n?`, "gmu"), "").trimEnd()}\n\n${markerLine(prepared.marker)}\n`
  installTransaction([
    { file: prepared.roadmapPath, bytes: prepared.roadmapBytes },
    { file: prepared.statePath, bytes: prepared.stateBytes },
    { file: validationPath, bytes: normalizedValidation },
  ], options)
  return prepared.marker
}
export const checkV138NormalizedPostValidation = (root: string, args: LifecycleArgs): NormalizedMarker => {
  const prepared = snapshot(root, args)
  if (readText(prepared.roadmapPath, "V138_ROUTE8_CARRIER_INVALID") !== prepared.roadmapBytes ||
      readText(prepared.statePath, "V138_ROUTE8_CARRIER_INVALID") !== prepared.stateBytes) fail("V138_ROUTE8_CARRIER_INVALID")
  const validation = readText(actual(root, args.validation), "V138_ROUTE8_VALIDATION_INVALID")
  if (validation.includes("phase-262-successor-status")) fail("V138_ROUTE8_VALIDATION_STALE")
  const current = extractMarker(validation)
  if (stable(current) !== stable(prepared.marker)) fail("V138_ROUTE8_VALIDATION_PROVENANCE_INVALID")
  return current
}

interface Binder extends Omit<NormalizedMarker, "schemaVersion"> {
  schemaVersion: "v1.38-plan-262-74-post-validation-binder-v1"
  validationSha256: Sha256
  binderRoot: Sha256
}
const buildBinder = (root: string, args: LifecycleArgs): Binder => {
  const marker = checkV138NormalizedPostValidation(root, args)
  const body = { ...marker, schemaVersion: "v1.38-plan-262-74-post-validation-binder-v1" as const,
    validationSha256: digest(readText(actual(root, args.validation), "V138_ROUTE8_VALIDATION_INVALID")) }
  return { ...body, binderRoot: digest(`v138-route8-post-validation-binder\0${stable(body)}`) }
}
export const bindV138PostValidation = (root: string, args: LifecycleArgs & { output: string }): Binder => {
  const binder = buildBinder(root, args)
  writeExclusive(actual(root, args.output), stable(binder))
  return binder
}
export const checkV138PostValidationBinder = (root: string, args: LifecycleArgs & { binder: string }): Binder => {
  const current = readJson(actual(root, args.binder), "V138_ROUTE8_BINDER_INVALID")
  const expected = buildBinder(root, args)
  if (stable(current) !== stable(expected)) fail("V138_ROUTE8_BINDER_INVALID")
  return expected
}

interface VerifierInput extends Omit<Binder, "schemaVersion"> {
  schemaVersion: "v1.38-plan-262-74-verifier-input-v1"
}
interface VerifierReport {
  schemaVersion: "v1.38-plan-262-74-verifier-report-v1"
  status: "passed" | "gaps_found"
  binderRoot: Sha256
  branch: "obstruction" | "terminal"
  gaps: readonly string[]
  humanItems: readonly []
  reportRoot: Sha256
}
const verifierInput = (binder: Binder): VerifierInput => ({ ...binder,
  schemaVersion: "v1.38-plan-262-74-verifier-input-v1" })
export const verifyV138Plan26274Input = (value: unknown): VerifierReport => {
  const input = exactRecord(value, ["schemaVersion", "totalPlans", "trustworthySummaries",
    "soleIncomplete", "planIdentitySha256", "summaryIdentitySha256", "branch", "activationRoot",
    "activationSha256", "dispositionRoot", "dispositionSha256", "requirementsSha256",
    "roadmapSha256", "stateSha256", "freshCharged", "freshAccepted", "admit03", "seal01",
    "phase263PlanningAuthorized", "downstreamAuthorityDenied", "validationSha256", "binderRoot"],
  "V138_ROUTE8_VERIFIER_INPUT_INVALID") as unknown as VerifierInput
  const terminal = input.branch === "terminal"
  const correlation = terminal ? input.activationRoot === V138_ROUTE_8_PATHS.activation &&
    typeof input.activationSha256 === "string" && input.freshCharged === 540 && input.freshAccepted === 540 &&
    input.admit03 === "passed" && input.phase263PlanningAuthorized === true :
    input.activationRoot === null && input.activationSha256 === null && input.freshCharged === 0 &&
    input.freshAccepted === 0 && input.admit03 === "blocked" && input.phase263PlanningAuthorized === false
  if (input.schemaVersion !== "v1.38-plan-262-74-verifier-input-v1" || input.totalPlans !== 56 ||
      input.trustworthySummaries !== 55 || input.soleIncomplete !== "262-74" || !correlation ||
      input.seal01 !== "passed_reduced_assurance" || input.downstreamAuthorityDenied !== true) {
    fail("V138_ROUTE8_VERIFIER_INPUT_INVALID")
  }
  const body = { schemaVersion: "v1.38-plan-262-74-verifier-report-v1" as const,
    status: terminal ? "passed" as const : "gaps_found" as const, binderRoot: input.binderRoot,
    branch: input.branch, gaps: terminal ? [] : ["ADMIT-03"], humanItems: [] as const }
  return { ...body, reportRoot: digest(`v138-route8-verifier-report\0${stable(body)}`) }
}
const renderReport = (report: VerifierReport): string => `---\nstatus: ${report.status}\n` +
  `schema: ${report.schemaVersion}\nreport_root: ${report.reportRoot}\n---\n\n# Phase 262 Verification\n\n` +
  `Binder: ${report.binderRoot}\nBranch: ${report.branch}\nGaps: ${report.gaps.join(",") || "none"}\n` +
  `Human items: ${report.humanItems.length}\n`
const renderBlocked = (report: VerifierReport): string => stable({
  schemaVersion: "v1.38-plan-262-74-blocked-v1", status: "gaps_found",
  binderRoot: report.binderRoot, reportRoot: report.reportRoot, branch: report.branch,
  reason: "ADMIT-03", phase263PlanningAuthorized: false,
})
const renderSummary = (report: VerifierReport): string =>
  `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "74"\n` +
  `subsystem: verification\ntags: [route-8, provenance, sentinel]\nstatus: complete\n---\n\n` +
  `# Phase 262 Plan 74: Verification Sentinel Summary\n\nBinder ${report.binderRoot} and verifier ` +
  `report ${report.reportRoot} passed.\n\n## Self-Check: PASSED\n`
interface DriverArgs { binder: string; phaseDir: string; requirements: string; roadmap: string; state: string; validation: string; verification: string }
interface SentinelResultArgs extends DriverArgs { summary: string; blocked: string }
const lifecycleFromDriver = (args: DriverArgs): LifecycleArgs => ({ phaseDir: args.phaseDir,
  requirements: args.requirements, roadmap: args.roadmap, state: args.state,
  validation: args.validation, disposition: V138_ROUTE_8_PATHS.disposition, activationRoot: "auto" })
export const checkV138Plan26274Result = (root: string, args: SentinelResultArgs): "passed" | "gaps_found" => {
  const binder = checkV138PostValidationBinder(root, { ...lifecycleFromDriver(args), binder: args.binder })
  const report = verifyV138Plan26274Input(verifierInput(binder))
  if (readText(actual(root, args.verification), "V138_ROUTE8_VERIFICATION_INVALID") !== renderReport(report)) {
    fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  }
  if (report.status === "passed") {
    if (readText(actual(root, args.summary), "V138_ROUTE8_SENTINEL_RESULT_INVALID") !== renderSummary(report) ||
        safe(actual(root, args.blocked)) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
    return "passed"
  }
  if (safe(actual(root, args.summary)) !== "missing" ||
      readText(actual(root, args.blocked), "V138_ROUTE8_SENTINEL_RESULT_INVALID") !== renderBlocked(report)) {
    fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  }
  return "gaps_found"
}

export const runV138Plan26274Sentinel = (root: string, args: DriverArgs,
  options: InstallOptions = {}): "passed" | "gaps_found" => {
  const temp = mkdtempSync(path.join(tmpdir(), "v138-route8-sentinel-"))
  chmodSync(temp, 0o700)
  try {
    const binder = checkV138PostValidationBinder(root, { ...lifecycleFromDriver(args), binder: args.binder })
    const input = verifierInput(binder)
    const inputPath = path.join(temp, "verifier-input.json")
    writeFileSync(inputPath, stable(input), { flag: "wx", mode: 0o600 })
    if (readText(inputPath, "V138_ROUTE8_VERIFIER_INPUT_INVALID") !== stable(input)) fail("V138_ROUTE8_VERIFIER_INPUT_INVALID")
    const report = verifyV138Plan26274Input(JSON.parse(readText(inputPath, "V138_ROUTE8_VERIFIER_INPUT_INVALID")))
    const reportBytes = renderReport(report)
    const reportPath = path.join(temp, "verification.md")
    writeFileSync(reportPath, reportBytes, { flag: "wx", mode: 0o600 })
    if (readText(reportPath, "V138_ROUTE8_VERIFIER_REPORT_INVALID") !== reportBytes) fail("V138_ROUTE8_VERIFIER_REPORT_INVALID")
    const summaryPath = phaseFile(root, args.phaseDir, "262-74-SUMMARY.md")
    if (safe(summaryPath) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
    if (report.status === "passed") fail("V138_ROUTE8_PASS_CLOSEOUT_REQUIRES_ORCHESTRATOR")
    const blockedPath = phaseFile(root, args.phaseDir, "262-74-BLOCKED.md")
    installTransaction([{ file: actual(root, args.verification), bytes: reportBytes },
      { file: blockedPath, bytes: renderBlocked(report) }], options)
    return "gaps_found"
  } finally { rmSync(temp, { recursive: true, force: true }) }
  return fail("V138_ROUTE8_SENTINEL_UNREACHABLE")
}

const parse = (values: readonly string[]): Map<string, string> => {
  const map = new Map<string, string>()
  for (let i = 0; i < values.length; i += 2) {
    if (!values[i]?.startsWith("--") || values[i + 1] === undefined || values[i + 1]?.startsWith("--")) fail("V138_ROUTE8_ARGUMENTS_INVALID")
    map.set(values[i]!, values[i + 1]!)
  }
  return map
}
const required = (args: Map<string, string>, key: string): string => args.get(key) ?? fail("V138_ROUTE8_ARGUMENTS_INVALID")
const lifecycleArgs = (args: Map<string, string>): LifecycleArgs => ({
  phaseDir: required(args, "--phase-dir"), requirements: required(args, "--requirements"),
  roadmap: required(args, "--roadmap"), state: required(args, "--state"),
  validation: required(args, "--validation"), disposition: required(args, "--disposition"),
  activationRoot: required(args, "--activation-root"),
})
const help = (): string => `Usage: check-v1-38-plan-262-69-route-8-source.ts COMMAND [options]\n\nCommands:\n${V138_ROUTE_8_COMMANDS.map(command => `  ${command}`).join("\n")}\n`
const main = (): void => {
  const root = resolveRoot()
  const argv = process.argv.slice(2)
  if (argv.length === 1 && argv[0] === "--help") { process.stdout.write(help()); return }
  if (argv.length === 1 && argv[0] === "--check") { process.stdout.write(`${JSON.stringify(checkV138Plan26269Route8Source(root))}\n`); return }
  const command = argv[0]
  const args = parse(argv.slice(1))
  if (command === "--normalize-post-validation") { process.stdout.write(`${JSON.stringify(normalizeV138PostValidation(root, lifecycleArgs(args)))}\n`); return }
  if (command === "--check-normalized-post-validation") { process.stdout.write(`${JSON.stringify(checkV138NormalizedPostValidation(root, lifecycleArgs(args)))}\n`); return }
  if (command === "--bind-post-validation") { process.stdout.write(`${JSON.stringify(bindV138PostValidation(root, { ...lifecycleArgs(args), output: required(args, "--output") }))}\n`); return }
  if (command === "--check-post-validation-binder") { process.stdout.write(`${JSON.stringify(checkV138PostValidationBinder(root, { ...lifecycleArgs(args), binder: required(args, "--binder") }))}\n`); return }
  if (command === "--run-plan-262-74-sentinel") { process.stdout.write(`${JSON.stringify({ status: runV138Plan26274Sentinel(root, { binder: required(args, "--binder"), phaseDir: required(args, "--phase-dir"), requirements: required(args, "--requirements"), roadmap: required(args, "--roadmap"), state: required(args, "--state"), validation: required(args, "--validation"), verification: required(args, "--verification") }) })}\n`); return }
  if (command === "--check-plan-262-74-result") { process.stdout.write(`${JSON.stringify({ status: checkV138Plan26274Result(root, { binder: required(args, "--binder"), phaseDir: required(args, "--phase-dir"), requirements: required(args, "--requirements"), roadmap: required(args, "--roadmap"), state: required(args, "--state"), validation: required(args, "--validation"), verification: required(args, "--verification"), summary: required(args, "--summary"), blocked: required(args, "--blocked") }) })}\n`); return }
  fail("V138_ROUTE8_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main() } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V138_ROUTE8_CHECK_FAILED"}\n`)
    process.exitCode = 1
  }
}
