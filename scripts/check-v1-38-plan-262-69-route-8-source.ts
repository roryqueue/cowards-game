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
  branch: "obstruction" | "terminal"
  activationRoot: string | null
  dispositionSha256: Sha256
  requirementsSha256: Sha256
  roadmapSha256: Sha256
  stateSha256: Sha256
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
const resolveActivation = (root: string, disposition: Record<string, unknown>, requested: string): string | null => {
  if (requested !== "auto") fail("V138_ROUTE8_ACTIVATION_SELECTION_INVALID")
  const active = disposition.status === "passed"
  const selected = path.resolve(root, V138_ROUTE_8_PATHS.activation)
  if (active ? safe(selected) !== "regular" : safe(selected) !== "missing") fail("V138_ROUTE8_ACTIVATION_SELECTION_INVALID")
  return active ? V138_ROUTE_8_PATHS.activation : null
}
const buildMarker = (root: string, args: LifecycleArgs): NormalizedMarker => {
  const dispositionBytes = readText(actual(root, args.disposition), "V138_ROUTE8_DISPOSITION_INVALID")
  const disposition = JSON.parse(dispositionBytes) as Record<string, unknown>
  const branch = disposition.branch === "pre_start_obstruction" ? "obstruction" : "terminal"
  if (!["passed", "blocked"].includes(String(disposition.status)) || disposition.seal01 !== "passed_reduced_assurance") fail("V138_ROUTE8_DISPOSITION_INVALID")
  const activationRoot = resolveActivation(root, disposition, args.activationRoot)
  return { schemaVersion: "v1.38-plan-262-74-normalized-validation-v1", totalPlans: 56,
    trustworthySummaries: 55, soleIncomplete: "262-74", branch, activationRoot,
    dispositionSha256: digest(dispositionBytes),
    requirementsSha256: digest(readText(actual(root, args.requirements), "V138_ROUTE8_REQUIREMENTS_INVALID")),
    roadmapSha256: digest(readText(actual(root, args.roadmap), "V138_ROUTE8_ROADMAP_INVALID")),
    stateSha256: digest(readText(actual(root, args.state), "V138_ROUTE8_STATE_INVALID")),
    admit03: disposition.admit03 === "passed" ? "passed" : "blocked",
    seal01: "passed_reduced_assurance",
    phase263PlanningAuthorized: disposition.phase263PlanningAuthorized === true,
    downstreamAuthorityDenied: true }
}
export const normalizeV138PostValidation = (root: string, args: LifecycleArgs): NormalizedMarker => {
  for (const number of [69, 70, 71, 72, 73]) if (safe(path.resolve(root, args.phaseDir, `262-${number}-SUMMARY.md`)) !== "regular") fail("V138_ROUTE8_SUMMARY_INDEX_INVALID")
  if (safe(path.resolve(root, args.phaseDir, "262-74-SUMMARY.md")) !== "missing") fail("V138_ROUTE8_SUMMARY_INDEX_INVALID")
  const marker = buildMarker(root, args)
  const validationPath = actual(root, args.validation)
  let text = readText(validationPath, "V138_ROUTE8_VALIDATION_INVALID")
  text = text.replace(/^.*phase-262-successor-status.*\n?/gmu, "")
    .replace(new RegExp(`^.*${normalizedTag}.*\\n?`, "gmu"), "")
  writeReplace(validationPath, `${text.trimEnd()}\n\n${markerLine(marker)}\n`)
  return marker
}
export const checkV138NormalizedPostValidation = (root: string, args: LifecycleArgs): NormalizedMarker => {
  const validation = readText(actual(root, args.validation), "V138_ROUTE8_VALIDATION_INVALID")
  if (validation.includes("phase-262-successor-status")) fail("V138_ROUTE8_VALIDATION_STALE")
  const current = extractMarker(validation)
  const expected = buildMarker(root, args)
  if (stable(current) !== stable(expected)) fail("V138_ROUTE8_VALIDATION_PROVENANCE_INVALID")
  for (const carrier of [args.roadmap, args.state]) {
    const text = readText(actual(root, carrier), "V138_ROUTE8_CARRIER_INVALID")
    if (!text.includes('"total_plans":56') || !text.includes('"active_successors":["262-69","262-70","262-71","262-72","262-73","262-74"]')) fail("V138_ROUTE8_CARRIER_INVALID")
  }
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

interface SentinelResultArgs { binder: string; verification: string; summary: string; blocked: string }
export const checkV138Plan26274Result = (root: string, args: SentinelResultArgs): "passed" | "gaps_found" => {
  const binder = readJson(actual(root, args.binder), "V138_ROUTE8_BINDER_INVALID")
  const verification = readText(actual(root, args.verification), "V138_ROUTE8_VERIFICATION_INVALID")
  const passed = /status:\s*passed/u.test(verification) && binder.admit03 === "passed" && binder.phase263PlanningAuthorized === true
  if (passed) {
    if (safe(actual(root, args.summary)) !== "regular" || safe(actual(root, args.blocked)) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
    return "passed"
  }
  if (!/status:\s*gaps_found/u.test(verification) || safe(actual(root, args.summary)) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  const blockedStatus = safe(actual(root, args.blocked))
  if (blockedStatus !== "missing" && blockedStatus !== "regular") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  return "gaps_found"
}

interface DriverArgs { binder: string; phaseDir: string; requirements: string; roadmap: string; state: string; validation: string; verification: string }
export const runV138Plan26274Sentinel = (root: string, args: DriverArgs): "passed" | "gaps_found" => {
  const temp = mkdtempSync(path.join(tmpdir(), "v138-route8-sentinel-"))
  chmodSync(temp, 0o700)
  try {
    const binder = readJson(actual(root, args.binder), "V138_ROUTE8_BINDER_INVALID")
    const input = { schemaVersion: "v1.38-plan-262-74-verifier-input-v1", binderRoot: binder.binderRoot,
      validationSha256: binder.validationSha256, branch: binder.branch,
      admit03: binder.admit03, seal01: binder.seal01,
      phase263PlanningAuthorized: binder.phase263PlanningAuthorized,
      downstreamAuthorityDenied: binder.downstreamAuthorityDenied }
    const inputPath = path.join(temp, "verifier-input.json")
    writeFileSync(inputPath, stable(input), { flag: "wx", mode: 0o600 })
    if (readText(inputPath, "V138_ROUTE8_VERIFIER_INPUT_INVALID") !== stable(input)) fail("V138_ROUTE8_VERIFIER_INPUT_INVALID")
    const passed = binder.admit03 === "passed" && binder.seal01 === "passed_reduced_assurance" && binder.phase263PlanningAuthorized === true && binder.downstreamAuthorityDenied === true
    const report = `---\nstatus: ${passed ? "passed" : "gaps_found"}\n---\n\n# Phase 262 Verification\n\nBinder: ${String(binder.binderRoot)}\nBranch: ${String(binder.branch)}\nADMIT-03: ${String(binder.admit03)}\nSEAL-01: ${String(binder.seal01)}\nPhase 263 planning authorized: ${String(binder.phase263PlanningAuthorized)}\n`
    const reportPath = path.join(temp, "verification.md")
    writeFileSync(reportPath, report, { flag: "wx", mode: 0o600 })
    if (readText(reportPath, "V138_ROUTE8_VERIFIER_REPORT_INVALID") !== report) fail("V138_ROUTE8_VERIFIER_REPORT_INVALID")
    writeReplace(actual(root, args.verification), report)
    if (!passed) {
      const blockedPath = path.resolve(root, args.phaseDir, "262-74-BLOCKED.md")
      if (safe(blockedPath) === "missing") writeExclusive(blockedPath,
        `# Phase 262 Plan 74 Blocked\n\nStatus: gaps_found\nBinder: ${String(binder.binderRoot)}\nBranch: ${String(binder.branch)}\nPhase 263 planning authorized: false\n`)
      if (safe(path.resolve(root, args.phaseDir, "262-74-SUMMARY.md")) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
      return "gaps_found"
    }
    const summaryPath = path.resolve(root, args.phaseDir, "262-74-SUMMARY.md")
    const summary = `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "74"\nsubsystem: verification\ntags: [route-8, provenance, sentinel]\nrequirements-completed: [ADMIT-01, ADMIT-02, ADMIT-03, ADMIT-04, MEAS-01, MEAS-02, MEAS-03, MEAS-04, MEAS-05, MEAS-06, MEAS-07, MEAS-08, MEAS-09, MEAS-10, SEAL-01, DECI-02]\nstatus: complete\n---\n\n# Phase 262 Plan 74: Verification Sentinel Summary\n\nExact refreshed validation, post-validation binder, and provenance-aware verifier passed. The reduced-assurance local seal remains explicit; only Phase 263 planning is authorized and every later/live authority remains denied.\n\n## Self-Check: PASSED\n`
    writeExclusive(summaryPath, summary)
    const gsd = path.resolve(process.env.CODEX_HOME ?? path.join(process.env.HOME ?? "", ".codex"), "gsd-core/bin/gsd-tools.cjs")
    if (safe(gsd) !== "regular") fail("V138_ROUTE8_GSD_TOOLS_MISSING")
    const query = (...values: string[]) => execFileSync(process.execPath, [gsd, "query", ...values],
      { cwd: root, encoding: "utf8", env: { ...process.env, LC_ALL: "C", LANG: "C" } })
    query("commit", "docs(262-74): complete verification sentinel plan", "--files",
      path.relative(root, summaryPath))
    query("requirements.mark-complete", "ADMIT-01", "ADMIT-02", "ADMIT-03", "ADMIT-04",
      "MEAS-01", "MEAS-02", "MEAS-03", "MEAS-04", "MEAS-05", "MEAS-06", "MEAS-07",
      "MEAS-08", "MEAS-09", "MEAS-10", "SEAL-01", "DECI-02")
    query("state.update-progress")
    query("roadmap.update-plan-progress", "262")
    query("phase.complete", "262")
    query("commit", "docs(262-74): synchronize passed phase lifecycle", "--files",
      path.relative(root, actual(root, args.requirements)), path.relative(root, actual(root, args.roadmap)),
      path.relative(root, actual(root, args.state)), path.relative(root, actual(root, args.verification)))
    return "passed"
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
  if (command === "--check-plan-262-74-result") { process.stdout.write(`${JSON.stringify({ status: checkV138Plan26274Result(root, { binder: required(args, "--binder"), verification: required(args, "--verification"), summary: required(args, "--summary"), blocked: required(args, "--blocked") }) })}\n`); return }
  fail("V138_ROUTE8_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main() } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V138_ROUTE8_CHECK_FAILED"}\n`)
    process.exitCode = 1
  }
}
