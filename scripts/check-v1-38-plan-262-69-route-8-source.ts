#!/usr/bin/env -S pnpm exec tsx
import { createHash, randomBytes } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  chmodSync,
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  openSync,
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
  buildV138Route8Authorization,
  buildV138Route8Seal,
  checkV138Plan26272Disposition,
  checkV138Route8AuthoritySeal,
  deriveV138Route8Activation,
  type V138Route8SourceCustody,
} from "./lib/v1-38-route-8-source.js"
import { verifyV138LocalSealVersionedVerificationBytes } from "./verify-v1-38-local-seal.js"
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
const localSealPath = ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json"
const executionProvenancePath = ".planning/artifacts/v1.38-plan-262-72-execution-provenance-v1.json"
const reviewedPlan74Identity = Object.freeze({
  commit: "7634f56dcc9529cd56ed487257d4d30cce7b50a1",
  blob: "7e4e5ae4d9d9d57659b575b28fc33939099e94a3",
  protocolBlob: "8049d3a8b40b7b3585c4a4dfa3554e27fc9b342b",
})
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
  topologyManifestRoot: Sha256
  topologyAnchorCommit: string
  topologyEntries: readonly TopologyIdentity[]
  branch: "obstruction" | "terminal"
  activationRoot: string | null
  activationSha256: Sha256 | null
  dispositionRoot: Sha256
  terminalRoot: Sha256 | null
  executionProvenanceRoot: Sha256 | null
  dispositionSha256: Sha256
  localSealPath: typeof localSealPath
  localSealSha256: Sha256
  localSealVerificationRoot: Sha256
  localSealProtocolRoot: Sha256
  assuranceClass: "single_operator_local_seal_v1"
  validator: ValidatorProvenance
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
const validatorTag = "phase-262-route8-validator-provenance"
const markerLine = (value: NormalizedMarker): string => `<!-- ${normalizedTag}: ${JSON.stringify(value)} -->`
const extractMarker = (text: string): NormalizedMarker => {
  const matches = [...text.matchAll(new RegExp(`<!-- ${normalizedTag}: (\\{[^\\n]+\\}) -->`, "g"))]
  if (matches.length !== 1) fail("V138_ROUTE8_VALIDATION_MARKER_INVALID")
  try { return JSON.parse(matches[0]![1]!) as NormalizedMarker } catch { return fail("V138_ROUTE8_VALIDATION_MARKER_INVALID") }
}
interface LifecycleArgs { phaseDir: string; requirements: string; roadmap: string; state: string; validation: string; disposition: string; activationRoot: string }
const canonicalLifecycleArgs: LifecycleArgs = Object.freeze({ phaseDir: phaseBase,
  requirements: ".planning/REQUIREMENTS.md", roadmap: ".planning/ROADMAP.md",
  state: ".planning/STATE.md", validation: `${phaseBase}/262-VALIDATION.md`,
  disposition: V138_ROUTE_8_PATHS.disposition, activationRoot: "auto" })
const canonicalVerification = `${phaseBase}/262-VERIFICATION.md`
const canonicalSummary = `${phaseBase}/262-74-SUMMARY.md`
const canonicalBlocked = `${phaseBase}/262-74-BLOCKED.md`
const canonicalCloseout = ".planning/artifacts/v1.38-plan-262-74-closeout-v1.json"
const TEST_ONLY = Symbol("V138_PLAN_262_74_TEST_ONLY")
interface TestMode { testOnlyToken?: symbol }
const requireCanonical = (args: LifecycleArgs, mode: TestMode = {}): void => {
  const lifecycle = { phaseDir: args.phaseDir, requirements: args.requirements, roadmap: args.roadmap,
    state: args.state, validation: args.validation, disposition: args.disposition, activationRoot: args.activationRoot }
  if (mode.testOnlyToken !== TEST_ONLY && stable(lifecycle) !== stable(canonicalLifecycleArgs)) {
    fail("V138_ROUTE8_CANONICAL_PATH_REQUIRED")
  }
}
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
interface TopologyIdentity { path: string; kind: "plan" | "summary"; blob: string; commit: string; sha256: Sha256; bytes: number }
interface ValidatorProvenance {
  schemaVersion: "v1.38-plan-262-post-plan73-validator-v1"
  sourceCommit: string
  sourceBlob: string
  sourceSha256: Sha256
  plan73Commit: string
  status: "passed" | "gaps_found"
  coveredRequirements: number
  gapCodes: readonly string[]
  admit03: "passed" | "blocked"
  seal01: "passed_reduced_assurance"
  phase263PlanningAuthorized: boolean
  downstreamAuthorityDenied: true
  verificationCarrierAvailable: boolean
  validatorRoot: Sha256
}
const gitText = (root: string, values: readonly string[]): string =>
  execFileSync("git", values, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
const gitBytes = (root: string, values: readonly string[]): Buffer =>
  execFileSync("git", values, { cwd: root, stdio: ["ignore", "pipe", "pipe"] })
const topology = (root: string, phaseDir: string, mode: TestMode = {}) => {
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
  const plan73Path = path.join(phaseDir, "262-73-SUMMARY.md")
  const plan74Path = path.join(phaseDir, "262-74-PLAN.md")
  const protocolPath = path.join(phaseDir, "262-ROUTE8-EXECUTION-PROTOCOL.md")
  const anchor = gitText(root, ["log", "-1", "--format=%H", "--", plan73Path])
  if (!/^[0-9a-f]{40}$/u.test(anchor)) fail("V138_ROUTE8_TOPOLOGY_GIT_INVALID")
  const requested = [...expectedPlans, ...expectedSummaries].map(name => path.join(phaseDir, name))
  if (gitText(root, ["status", "--porcelain=v1", "--", ...requested]) !== "") fail("V138_ROUTE8_TOPOLOGY_DIRTY")
  const blobs = new Map(gitText(root, ["ls-tree", "HEAD", "--", ...requested]).split("\n")
    .filter(Boolean).map(line => {
      const match = /^\d+ blob ([0-9a-f]{40})\t(.+)$/u.exec(line) ?? fail("V138_ROUTE8_TOPOLOGY_GIT_INVALID")
      return [match[2]!, match[1]!] as const
    }))
  const commits = new Map<string, string>()
  let currentCommit = ""
  for (const line of gitText(root, ["log", "--format=commit:%H", "--name-only", "--", ...requested]).split("\n")) {
    if (line.startsWith("commit:")) currentCommit = line.slice(7)
    else if (line !== "" && !commits.has(line)) commits.set(line, currentCommit)
  }
  const ancestors = new Set(gitText(root, ["rev-list", anchor]).split("\n"))
  const plan74Commit = gitText(root, ["log", "-1", "--format=%H", "--", plan74Path])
  if (mode.testOnlyToken !== TEST_ONLY && (plan74Commit !== reviewedPlan74Identity.commit ||
      gitText(root, ["rev-parse", `HEAD:${plan74Path}`]) !== reviewedPlan74Identity.blob ||
      gitText(root, ["rev-parse", `HEAD:${protocolPath}`]) !== reviewedPlan74Identity.protocolBlob)) {
    fail("V138_ROUTE8_POST_FIX_TOPOLOGY_INVALID")
  }
  const identities = requested.map(repoPath => {
    const blob = blobs.get(repoPath) ?? fail("V138_ROUTE8_TOPOLOGY_GIT_INVALID")
    const commit = commits.get(repoPath) ?? fail("V138_ROUTE8_TOPOLOGY_GIT_INVALID")
    if (!ancestors.has(commit) && !(mode.testOnlyToken !== TEST_ONLY && repoPath === plan74Path &&
        commit === reviewedPlan74Identity.commit)) {
      fail("V138_ROUTE8_TOPOLOGY_REWRITTEN")
    }
    const bytes = readFileSync(actual(root, repoPath))
    return Object.freeze({ path: repoPath,
      kind: repoPath.endsWith("-PLAN.md") ? "plan" as const : "summary" as const,
      blob, commit, sha256: digest(bytes), bytes: bytes.length })
  }).sort((a, b) => a.path.localeCompare(b.path))
  return Object.freeze({
    planIdentitySha256: digest(`v138-route8-plan-identities\0${stable(identities.filter(x => x.kind === "plan"))}`),
    summaryIdentitySha256: digest(`v138-route8-summary-identities\0${stable(identities.filter(x => x.kind === "summary"))}`),
    topologyManifestRoot: digest(`v138-route8-topology-manifest-v1\0${stable(identities)}`),
    topologyAnchorCommit: anchor,
    topologyEntries: identities,
  })
}
const checkedValidator = (root: string, args: LifecycleArgs,
  branch: "obstruction" | "terminal", plan73Commit: string) => {
  const validationPath = actual(root, args.validation)
  const relative = path.relative(path.resolve(root), validationPath)
  const sourceCommit = gitText(root, ["log", "-1", "--format=%H", "--", relative])
  const sourceBlob = gitText(root, ["rev-parse", `HEAD:${relative}`])
  if (!/^[0-9a-f]{40}$/u.test(sourceCommit) || !/^[0-9a-f]{40}$/u.test(sourceBlob)) {
    fail("V138_ROUTE8_VALIDATOR_PROVENANCE_INVALID")
  }
  strictAncestor(root, plan73Commit, sourceCommit, "V138_ROUTE8_VALIDATOR_PROVENANCE_INVALID")
  const sourceBytes = gitBytes(root, ["show", `HEAD:${relative}`]).toString("utf8")
  const section = /^## Requirement Coverage\n\n((?:\|[^\n]*\n){18})\n/mu.exec(sourceBytes)?.[1] ?? ""
  const lines = section.trimEnd().split("\n")
  if (lines[0] !== "| Requirement | Status | Behavioral evidence | Automated command |" ||
      lines[1] !== "|---|---|---|---|") fail("V138_ROUTE8_VALIDATOR_SCHEMA_INVALID")
  const tableLines = lines.slice(2).filter(line => line.startsWith("|"))
  const rows = tableLines.map(line => /^\| (ADMIT-0[1-4]|MEAS-(?:0[1-9]|10)|SEAL-01|DECI-02) \| ([^|]+) \| [^|]+ \| [^|]+ \|$/u.exec(line))
  if (rows.some(row => row === null)) fail("V138_ROUTE8_VALIDATOR_SCHEMA_INVALID")
  const parsedRows = rows as RegExpExecArray[]
  const statuses = new Map(parsedRows.map(match => [match[1]!, match[2]!.trim()]))
  if (parsedRows.length !== 16 || statuses.size !== 16 ||
      [...sourceBytes.matchAll(/^status:\s*(partial|passed)$/gmu)].length !== 1 ||
      !sourceBytes.includes("last_audited: 2026-08-26") ||
      !sourceBytes.includes("Local-seal v3")) fail("V138_ROUTE8_VALIDATOR_SCHEMA_INVALID")
  const obstruction = branch === "obstruction"
  const admit = statuses.get("ADMIT-03") ?? ""
  const otherCovered = [...statuses].filter(([key]) => key !== "ADMIT-03")
    .every(([, status]) => status.startsWith("COVERED"))
  const semantic = obstruction ? /^status:\s*partial$/mu.test(sourceBytes) &&
    admit.includes("PARTIAL") && admit.includes("BLOCKED") && otherCovered &&
    /^Coverage is 15 covered and 1 partial-blocked\./mu.test(sourceBytes) &&
    /^.*cannot authorize Phase 263 or any downstream\/live capability\.$/mu.test(sourceBytes) &&
    sourceBytes.includes("| ADMIT-03 | BLOCKER |") : /^status:\s*passed$/mu.test(sourceBytes) &&
    admit.startsWith("COVERED") && otherCovered && /^Coverage is 16 covered and 0 gaps\.$/mu.test(sourceBytes) &&
    /^Phase 263 planning authorized\.$/mu.test(sourceBytes) && /^Downstream authority remains denied\.$/mu.test(sourceBytes) &&
    !/(?:cannot|not) authorize Phase 263|Phase 263 (?:is )?denied/iu.test(sourceBytes)
  if (!semantic) fail("V138_ROUTE8_VALIDATOR_SEMANTICS_INVALID")
  const body = { schemaVersion: "v1.38-plan-262-post-plan73-validator-v1" as const,
    sourceCommit, sourceBlob, sourceSha256: digest(sourceBytes), plan73Commit,
    status: obstruction ? "gaps_found" as const : "passed" as const,
    coveredRequirements: obstruction ? 15 : 16,
    gapCodes: obstruction ? ["ADMIT-03"] : [], admit03: obstruction ? "blocked" as const : "passed" as const,
    seal01: "passed_reduced_assurance" as const, phase263PlanningAuthorized: !obstruction,
    downstreamAuthorityDenied: true as const,
    verificationCarrierAvailable: !sourceBytes.includes("verification_carrier_unavailable: true") }
  const provenance: ValidatorProvenance = { ...body,
    validatorRoot: digest(`v138-route8-post-plan73-validator-v1\0${stable(body)}`) }
  return Object.freeze({ provenance, sourceBytes })
}
const rootedArtifact = (root: string, repoPath: string, keys: readonly string[],
  rootKey: string, domain: string, code: string): Record<string, unknown> => {
  const value = exactRecord(readJson(actual(root, repoPath), code), keys, code)
  const { [rootKey]: claimed, ...body } = value
  if (claimed !== digest(`${domain}\0${stable(body)}`)) fail(code)
  return value
}
const checkedLocalSeal = (root: string) => {
  const file = actual(root, localSealPath)
  const bytes = readFileSync(file)
  const result = verifyV138LocalSealVersionedVerificationBytes({ version: "v3", bytes })
  let artifactValue: Record<string, unknown>
  try { artifactValue = JSON.parse(bytes.toString("utf8")) as Record<string, unknown> }
  catch { return fail("V138_ROUTE8_LOCAL_SEAL_INVALID") }
  if (result.status !== "passed" || result.satisfiesRevisedSeal01 !== true ||
      artifactValue.satisfiesRevisedSeal01 !== true || artifactValue.findingCount !== 0 ||
      artifactValue.assuranceClass !== "single_operator_local_seal_v1" ||
      artifactValue.independentCustodyClaimed !== false ||
      artifactValue.verificationRoot !== result.verificationRoot ||
      typeof artifactValue.localSealProtocolRoot !== "string") fail("V138_ROUTE8_LOCAL_SEAL_INVALID")
  return Object.freeze({ localSealSha256: digest(bytes),
    localSealVerificationRoot: result.verificationRoot,
    localSealProtocolRoot: artifactValue.localSealProtocolRoot as Sha256,
    assuranceClass: "single_operator_local_seal_v1" as const })
}
interface ExecutionIdentity { path: string; blob: string; introducingCommit: string; sha256: Sha256; bytes: number }
const strictAncestor = (root: string, ancestor: string, descendant: string, code: string): void => {
  if (ancestor === descendant) fail(code)
  try { execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd: root, stdio: "ignore" }) }
  catch { fail(code) }
}
const checkedExecutionProvenance = (root: string, mode: TestMode = {}) => {
  // Route 8 expired at the canonical 0/540 obstruction. No immutable producer
  // authorization predating Plan 72 exists, so production must never promote a
  // locally self-authored full chain. The bypass exists only for transaction
  // crash/order tests and is unreachable from CLI dispatch.
  if (mode.testOnlyToken !== TEST_ONLY) fail("V138_ROUTE8_EXECUTION_PRODUCER_ANCHOR_UNAVAILABLE")
  const artifactPaths = [V138_ROUTE_8_PATHS.routeStart, V138_ROUTE_8_PATHS.preflight,
    V138_ROUTE_8_PATHS.calibrationConsumption, V138_ROUTE_8_PATHS.calibration,
    V138_ROUTE_8_PATHS.reproductionConsumption, V138_ROUTE_8_PATHS.reproduction,
    V138_ROUTE_8_PATHS.terminal]
  if (gitText(root, ["status", "--porcelain=v1", "--", ...artifactPaths, executionProvenancePath]) !== "") {
    fail("V138_ROUTE8_EXECUTION_PROVENANCE_DIRTY")
  }
  const plan72Plan = `${phaseBase}/262-72-PLAN.md`
  const plan72Summary = `${phaseBase}/262-72-SUMMARY.md`
  const authorizedPlan72Commit = gitText(root, ["log", "-1", "--format=%H", "--", plan72Plan])
  const summaryCommit = gitText(root, ["log", "-1", "--format=%H", "--", plan72Summary])
  const manifestCommit = gitText(root, ["log", "-1", "--format=%H", "--", executionProvenancePath])
  strictAncestor(root, authorizedPlan72Commit, manifestCommit, "V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")
  strictAncestor(root, manifestCommit, summaryCommit, "V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")
  const identities: ExecutionIdentity[] = artifactPaths.map(repoPath => {
    const introducingCommit = gitText(root, ["log", "-1", "--format=%H", "--", repoPath])
    strictAncestor(root, authorizedPlan72Commit, introducingCommit, "V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")
    if (introducingCommit !== manifestCommit) {
      try { execFileSync("git", ["merge-base", "--is-ancestor", introducingCommit, manifestCommit],
        { cwd: root, stdio: "ignore" }) } catch { fail("V138_ROUTE8_EXECUTION_PROVENANCE_INVALID") }
    } else fail("V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")
    const bytes = readFileSync(actual(root, repoPath))
    return { path: repoPath, blob: gitText(root, ["rev-parse", `HEAD:${repoPath}`]), introducingCommit,
      sha256: digest(bytes), bytes: bytes.length }
  })
  if (new Set(identities.map(identity => identity.introducingCommit)).size < 2) {
    fail("V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")
  }
  const producerPath = "scripts/lib/v1-38-route-8-source.ts"
  const body = { schemaVersion: "v1.38-plan-262-72-execution-provenance-v1" as const,
    producerPath, producerBlob: gitText(root, ["rev-parse", `${manifestCommit}:${producerPath}`]),
    authorizedPlan72Commit, artifactIdentities: identities,
    executionRoot: digest(`v138-route8-execution-artifacts-v1\0${stable(identities)}`) }
  const expected = { ...body,
    manifestRoot: digest(`v138-route8-execution-provenance-v1\0${stable(body)}`) }
  if (stable(readJson(actual(root, executionProvenancePath), "V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")) !==
      stable(expected)) fail("V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")
  return Object.freeze({ executionProvenanceRoot: expected.manifestRoot })
}
const checkedTerminalChain = (root: string, mode: TestMode = {}) => {
  const provenance = checkedExecutionProvenance(root, mode)
  const authorization = readJson(actual(root, V138_ROUTE_8_PATHS.authorization), "V138_ROUTE8_AUTHORIZATION_INVALID")
  const seal = readJson(actual(root, V138_ROUTE_8_PATHS.seal), "V138_ROUTE8_SEAL_INVALID")
  checkV138Route8AuthoritySeal(authorization, seal)
  const auth = authorization as Record<string, unknown>
  const checkedSeal = seal as Record<string, unknown>
  const routeStart = rootedArtifact(root, V138_ROUTE_8_PATHS.routeStart,
    ["schemaVersion", "routeOrdinal", "consumed", "singleUse", "noRetry", "authorizationRoot",
      "sealRoot", "executionContextRoot", "routeStartRoot"], "routeStartRoot",
    "v138-route8-route-start-v1", "V138_ROUTE8_ROUTE_START_INVALID")
  if (routeStart.schemaVersion !== "v1.38-plan-262-72-route-start-v1" || routeStart.routeOrdinal !== 8 ||
      routeStart.consumed !== true || routeStart.singleUse !== true || routeStart.noRetry !== true ||
      routeStart.authorizationRoot !== auth.authorizationRoot || routeStart.sealRoot !== checkedSeal.sealRoot ||
      typeof routeStart.executionContextRoot !== "string") fail("V138_ROUTE8_ROUTE_START_INVALID")
  const preflight = rootedArtifact(root, V138_ROUTE_8_PATHS.preflight,
    ["schemaVersion", "samplingMilliseconds", "minimumEffectiveAvailableBasisPoints", "status",
      "routeStartRoot", "effectiveAvailableBasisPoints", "receiptRoot"], "receiptRoot",
    "v138-route8-preflight-v13", "V138_ROUTE8_PREFLIGHT_INVALID")
  if (preflight.schemaVersion !== "v1.38-current-matrix-headroom-preflight-v13" ||
      preflight.samplingMilliseconds !== 200 || preflight.minimumEffectiveAvailableBasisPoints !== 2500 ||
      preflight.status !== "admitted" || preflight.routeStartRoot !== routeStart.routeStartRoot ||
      typeof preflight.effectiveAvailableBasisPoints !== "number" || preflight.effectiveAvailableBasisPoints < 2500) {
    fail("V138_ROUTE8_PREFLIGHT_INVALID")
  }
  const calibrationConsumption = rootedArtifact(root, V138_ROUTE_8_PATHS.calibrationConsumption,
    ["schemaVersion", "charged", "shards", "consumed", "noRetry", "routeStartRoot", "preflightRoot",
      "chargedAttemptRoot", "markerRoot"], "markerRoot", "v138-route8-calibration-consumption-v1",
    "V138_ROUTE8_CONSUMPTION_INVALID")
  if (calibrationConsumption.schemaVersion !== "v1.38-plan-262-72-calibration-consumption-v1" ||
      calibrationConsumption.charged !== 8 || calibrationConsumption.shards !== 4 ||
      calibrationConsumption.consumed !== true || calibrationConsumption.noRetry !== true ||
      calibrationConsumption.routeStartRoot !== routeStart.routeStartRoot ||
      calibrationConsumption.preflightRoot !== preflight.receiptRoot ||
      typeof calibrationConsumption.chargedAttemptRoot !== "string") fail("V138_ROUTE8_CONSUMPTION_INVALID")
  const calibration = rootedArtifact(root, V138_ROUTE_8_PATHS.calibration,
    ["schemaVersion", "status", "charged", "accepted", "shards", "systemFailureCount",
      "routeStartRoot", "preflightRoot", "consumptionRoot", "receiptRoot"], "receiptRoot",
    "v138-route8-calibration-v13", "V138_ROUTE8_CALIBRATION_INVALID")
  if (calibration.schemaVersion !== "v1.38-current-matrix-calibration-v13" ||
      calibration.status !== "admitted" || calibration.charged !== 8 || calibration.accepted !== 8 ||
      calibration.shards !== 4 || calibration.systemFailureCount !== 0 ||
      calibration.routeStartRoot !== routeStart.routeStartRoot ||
      calibration.preflightRoot !== preflight.receiptRoot ||
      calibration.consumptionRoot !== calibrationConsumption.markerRoot) fail("V138_ROUTE8_CALIBRATION_INVALID")
  const reproductionConsumption = rootedArtifact(root, V138_ROUTE_8_PATHS.reproductionConsumption,
    ["schemaVersion", "charged", "consumed", "noRetry", "calibrationRoot", "chargedAttemptRoot",
      "markerRoot"], "markerRoot", "v138-route8-reproduction-consumption-v1",
    "V138_ROUTE8_REPRODUCTION_CONSUMPTION_INVALID")
  if (reproductionConsumption.schemaVersion !== "v1.38-plan-262-72-reproduction-consumption-v1" ||
      reproductionConsumption.charged !== 540 || reproductionConsumption.consumed !== true ||
      reproductionConsumption.noRetry !== true || reproductionConsumption.calibrationRoot !== calibration.receiptRoot ||
      typeof reproductionConsumption.chargedAttemptRoot !== "string") fail("V138_ROUTE8_REPRODUCTION_CONSUMPTION_INVALID")
  const reproduction = rootedArtifact(root, V138_ROUTE_8_PATHS.reproduction,
    ["schemaVersion", "chargedCellCount", "acceptedCellCount", "systemFailureCount",
      "runtimeDefectCount", "legalInformationDefectCount", "privacyDefectCount", "identityDefectCount",
      "cellDefectCount", "noRetry", "routeStartRoot", "calibrationRoot", "consumptionRoot", "receiptRoot"],
    "receiptRoot", "v138-route8-reproduction-v14", "V138_ROUTE8_REPRODUCTION_INVALID")
  const zeroDefects = ["systemFailureCount", "runtimeDefectCount", "legalInformationDefectCount",
    "privacyDefectCount", "identityDefectCount", "cellDefectCount"].every(key => reproduction[key] === 0)
  if (reproduction.schemaVersion !== "v1.38-current-matrix-reproduction-v14" ||
      reproduction.chargedCellCount !== 540 || reproduction.acceptedCellCount !== 540 || !zeroDefects ||
      reproduction.noRetry !== true || reproduction.routeStartRoot !== routeStart.routeStartRoot ||
      reproduction.calibrationRoot !== calibration.receiptRoot ||
      reproduction.consumptionRoot !== reproductionConsumption.markerRoot) fail("V138_ROUTE8_REPRODUCTION_INVALID")
  const terminal = rootedArtifact(root, V138_ROUTE_8_PATHS.terminal,
    ["schemaVersion", "disposition", "routeOrdinal", "freshCharged", "freshAccepted",
      "satisfiesAdmit03", "completeCleanup", "authorityExpired", "noRetry", "routeStartRoot",
      "preflightRoot", "calibrationConsumptionRoot", "calibrationRoot", "reproductionConsumptionRoot",
      "reproductionRoot", "terminalRoot"], "terminalRoot", "v138-route8-terminal-v1",
    "V138_ROUTE8_TERMINAL_INVALID")
  if (terminal.schemaVersion !== "v1.38-plan-262-72-terminal-v1" ||
      terminal.disposition !== "reproduction_passed" || terminal.routeOrdinal !== 8 ||
      terminal.freshCharged !== 540 || terminal.freshAccepted !== 540 || terminal.satisfiesAdmit03 !== true ||
      terminal.completeCleanup !== true || terminal.authorityExpired !== true || terminal.noRetry !== true ||
      terminal.routeStartRoot !== routeStart.routeStartRoot || terminal.preflightRoot !== preflight.receiptRoot ||
      terminal.calibrationConsumptionRoot !== calibrationConsumption.markerRoot ||
      terminal.calibrationRoot !== calibration.receiptRoot ||
      terminal.reproductionConsumptionRoot !== reproductionConsumption.markerRoot ||
      terminal.reproductionRoot !== reproduction.receiptRoot) fail("V138_ROUTE8_TERMINAL_INVALID")
  return Object.freeze({ terminal: { disposition: "reproduction_passed", freshCharged: 540,
    freshAccepted: 540, satisfiesAdmit03: true }, terminalRoot: terminal.terminalRoot as Sha256,
    executionProvenanceRoot: provenance.executionProvenanceRoot })
}
const checkedDisposition = (root: string, args: LifecycleArgs, mode: TestMode = {}) => {
  if (args.activationRoot !== "auto" || actual(root, args.disposition) !== actual(root, V138_ROUTE_8_PATHS.disposition)) {
    fail("V138_ROUTE8_ACTIVATION_SELECTION_INVALID")
  }
  const checkedBranch = checkV138Plan26272Disposition({ repoRoot: root })
  if (checkedBranch === "obstruction" && safe(actual(root, executionProvenancePath)) !== "missing") {
    fail("V138_ROUTE8_EXECUTION_PROVENANCE_INVALID")
  }
  const localSeal = checkedLocalSeal(root)
  const dispositionBytes = readText(actual(root, args.disposition), "V138_ROUTE8_DISPOSITION_INVALID")
  let disposition: Record<string, unknown>
  try { disposition = JSON.parse(dispositionBytes) as Record<string, unknown> } catch { return fail("V138_ROUTE8_DISPOSITION_INVALID") }
  let terminal: { disposition: string; freshCharged: number; freshAccepted: number; satisfiesAdmit03: boolean } | null = null
  let terminalRoot: Sha256 | null = null
  let executionProvenanceRoot: Sha256 | null = null
  if (checkedBranch === "terminal") {
    const chain = checkedTerminalChain(root, mode)
    terminal = chain.terminal
    terminalRoot = chain.terminalRoot
    executionProvenanceRoot = chain.executionProvenanceRoot
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
    ...localSeal,
    activationRoot: derived.activation === null ? null : V138_ROUTE_8_PATHS.activation,
    activationSha256: derived.activation === null ? null : digest(readText(activationPath, "V138_ROUTE8_ACTIVATION_SELECTION_INVALID")),
    terminalRoot, executionProvenanceRoot,
    freshCharged: (terminal?.freshCharged ?? 0) as 0 | 540,
    freshAccepted: (terminal?.freshAccepted ?? 0) as 0 | 540 })
}
const sentinelTag = "phase-262-verification-sentinel-status"
const carrierPattern = new RegExp(`<!-- ${sentinelTag}: (\\{[^\\n]+\\}) -->`, "g")
const legacyCarrierKeys = new Set(["proof_status", "admit_03", "seal_01", "assurance_class",
  "route_started", "fresh_charged", "fresh_accepted", "required_accepted", "candidate_search_authorized",
  "phase263_authorized", "formation_materialization_authorized", "holdout_opening_authorized",
  "public_authorized", "foundation_activation_root_present", "production_authorized", "next_action",
  "execution_protocol", "bulk_execute_phase_prohibited", "post_plan_73_sequence", "total_plans",
  "trustworthy_summaries", "active_successors", "incomplete", "plan_72_disposition",
  "plan_73_disposition", "sentinel_plan", "sentinel_summary_policy", "archived_plan_48_route_v9",
  "archived_plan_48_route_v9_sha256", "archived_plan_48_original", "archived_plan_48_original_sha256"])
const normalizedCarrierKeys = new Set(["schema_version", "proof_status", "branch", "admit_03",
  "seal_01", "assurance_class", "route_started", "fresh_charged", "fresh_accepted",
  "required_accepted", "phase263_authorized", "candidate_search_authorized", "phase264_authorized",
  "formation_materialization_authorized", "holdout_opening_authorized", "public_authorized",
  "product_authorized", "activation_authorized", "production_authorized", "gameplay_change_authorized",
  "foundation_activation_root_present", "next_action", "bulk_execute_phase_prohibited", "total_plans",
  "trustworthy_summaries", "active_successors", "incomplete", "plan_72_disposition",
  "plan_73_disposition", "sentinel_plan", "sentinel_summary_policy", "topology_manifest_root",
  "disposition_root", "local_seal_verification_root", "validator_root", "downstream_authority_denied"])
const renderCarrier = (text: string, disposition: ReturnType<typeof checkedDisposition>,
  identities: ReturnType<typeof topology>, validator: ValidatorProvenance): string => {
  const matches = [...text.matchAll(carrierPattern)]
  if (matches.length !== 1 || text.includes("phase-262-successor-status")) fail("V138_ROUTE8_CARRIER_INVALID")
  let current: Record<string, unknown>
  try { current = JSON.parse(matches[0]![1]!) as Record<string, unknown> } catch { return fail("V138_ROUTE8_CARRIER_INVALID") }
  if (current.schema_version === "v1.38-plan-262-74-lifecycle-carrier-v1") {
    if (Object.keys(current).some(key => !normalizedCarrierKeys.has(key))) fail("V138_ROUTE8_CARRIER_INVALID")
  } else {
    if (Object.keys(current).some(key => !legacyCarrierKeys.has(key)) ||
        Object.entries(current).some(([key, value]) => /authori[sz]|authority|activation|gameplay/iu.test(key) && value === true)) {
      fail("V138_ROUTE8_CARRIER_INVALID")
    }
  }
  const six = ["262-69", "262-70", "262-71", "262-72", "262-73", "262-74"]
  const active = stable(current.active_successors) === stable(six) || stable(current.active_successors) === stable(["262-74"])
  if (current.total_plans !== 56 || ![50, 55].includes(Number(current.trustworthy_summaries)) || !active ||
      current.bulk_execute_phase_prohibited !== true || current.sentinel_plan !== "262-74" ||
      current.sentinel_summary_policy !== "pass_only_after_verification" ||
      current.candidate_search_authorized !== false || current.formation_materialization_authorized !== false ||
      current.holdout_opening_authorized !== false || current.public_authorized !== false ||
      current.production_authorized !== false) fail("V138_ROUTE8_CARRIER_INVALID")
  const obstruction = disposition.branch === "obstruction"
  const denials = { candidate_search_authorized: false, phase264_authorized: false,
    formation_materialization_authorized: false, holdout_opening_authorized: false,
    public_authorized: false, product_authorized: false, activation_authorized: false,
    production_authorized: false, gameplay_change_authorized: false }
  const downstreamAuthorityDenied = Object.values(denials).every(value => value === false)
  const normalized = { schema_version: "v1.38-plan-262-74-lifecycle-carrier-v1",
    proof_status: "route_8_post_validation_normalized",
    branch: disposition.branch, admit_03: obstruction ? "blocked" : "passed",
    seal_01: "passed_reduced_assurance", assurance_class: disposition.assuranceClass,
    route_started: !obstruction, fresh_charged: disposition.freshCharged,
    fresh_accepted: disposition.freshAccepted, required_accepted: 540,
    phase263_authorized: !obstruction, ...denials,
    foundation_activation_root_present: !obstruction,
    next_action: "run-post-validation-binder", bulk_execute_phase_prohibited: true,
    total_plans: 56, trustworthy_summaries: 55, active_successors: ["262-74"],
    incomplete: ["262-74"], plan_72_disposition: obstruction ? "pre_start_obstruction" : "terminal",
    plan_73_disposition: obstruction ? "blocked" : "passed", sentinel_plan: "262-74",
    sentinel_summary_policy: "pass_only_after_verification",
    topology_manifest_root: identities.topologyManifestRoot,
    disposition_root: disposition.disposition.dispositionRoot,
    local_seal_verification_root: disposition.localSealVerificationRoot,
    validator_root: validator.validatorRoot, downstream_authority_denied: downstreamAuthorityDenied }
  if (!downstreamAuthorityDenied) fail("V138_ROUTE8_CARRIER_INVALID")
  return text.replace(carrierPattern, `<!-- ${sentinelTag}: ${JSON.stringify(normalized)} -->`)
}
interface Replacement { file: string; bytes: string | null }
interface InstallOptions extends TestMode { faultAfterInstall?: number; crashAfterInstall?: number;
  crashBeforeCommit?: boolean; crashAfterCommit?: boolean; crashAfterSetup?: number }
interface TransactionJournal {
  schemaVersion: "v1.38-plan-262-74-transaction-v1"
  purpose: "normalization" | "gaps" | "pass-closeout"
  nonce: string
  testOnly: boolean
  startHead: string
  changes: readonly { path: string; before: string | null; after: string | null }[]
  commit: { message: string; files: readonly string[] } | null
  journalRoot: Sha256
}
const transactionDirPath = (root: string): string => actual(root, ".planning/.v138-plan26274-transaction-v1")
const transactionPreparePath = (root: string, nonce: string): string =>
  actual(root, `.planning/.v138-plan26274-transaction-prepare-${nonce}`)
const transactionIntentPath = (root: string): string => path.resolve(root,
  gitText(root, ["rev-parse", "--git-path", "v138-plan26274-transaction-intent-v1.json"]))
const fsyncDirectory = (directory: string): void => {
  const descriptor = openSync(directory, constants.O_RDONLY)
  try { fsyncSync(descriptor) } finally { closeSync(descriptor) }
}
const durableReplace = (file: string, bytes: string): void => {
  const temporary = `${file}.durable-${process.pid}`
  if (safe(temporary) !== "missing") fail("V138_ROUTE8_TEMP_PRESENT")
  const descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
  try { writeFileSync(descriptor, bytes); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  renameSync(temporary, file)
  fsyncDirectory(path.dirname(file))
}
const parseJournal = (bytes: string): TransactionJournal => {
  let parsed: unknown
  try { parsed = JSON.parse(bytes) } catch { return fail("V138_ROUTE8_TRANSACTION_INVALID") }
  const value = exactRecord(parsed, ["schemaVersion", "purpose", "nonce", "testOnly", "startHead", "changes", "commit", "journalRoot"],
    "V138_ROUTE8_TRANSACTION_INVALID") as unknown as TransactionJournal
  const { journalRoot, ...body } = value
  if (value.schemaVersion !== "v1.38-plan-262-74-transaction-v1" ||
      !["normalization", "gaps", "pass-closeout"].includes(value.purpose) ||
      !/^[0-9a-f]{64}$/u.test(value.nonce) || typeof value.testOnly !== "boolean" ||
      !/^[0-9a-f]{40}$/u.test(value.startHead) || !Array.isArray(value.changes) ||
      journalRoot !== digest(`v138-route8-transaction-v1\0${stable(body)}`)) fail("V138_ROUTE8_TRANSACTION_INVALID")
  const paths = new Set<string>()
  for (const change of value.changes) {
    exactRecord(change, ["path", "before", "after"], "V138_ROUTE8_TRANSACTION_INVALID")
    if (typeof change.path !== "string" || paths.has(change.path) ||
        ![change.before, change.after].every(item => item === null || typeof item === "string")) {
      fail("V138_ROUTE8_TRANSACTION_INVALID")
    }
    paths.add(change.path)
  }
  if (value.commit !== null) exactRecord(value.commit, ["message", "files"], "V138_ROUTE8_TRANSACTION_INVALID")
  return value
}
const validateJournalInventory = (journal: TransactionJournal): void => {
  const paths = journal.changes.map(change => change.path).sort()
  if (journal.testOnly) {
    if (journal.commit !== null && (journal.commit.message !== "docs(262-74): complete authenticated verification sentinel" ||
        stable([...journal.commit.files].sort()) !== stable(paths))) fail("V138_ROUTE8_TRANSACTION_INVALID")
    return
  }
  const expected = journal.purpose === "normalization" ?
    [canonicalLifecycleArgs.roadmap, canonicalLifecycleArgs.state, canonicalLifecycleArgs.validation] :
    journal.purpose === "gaps" ? [canonicalVerification, canonicalBlocked] :
    [canonicalLifecycleArgs.requirements, canonicalLifecycleArgs.roadmap, canonicalLifecycleArgs.state,
      canonicalLifecycleArgs.validation, canonicalVerification, canonicalSummary, canonicalBlocked,
      V138_ROUTE_8_PATHS.binder, canonicalCloseout]
  if (stable(paths) !== stable([...expected].sort())) fail("V138_ROUTE8_TRANSACTION_INVALID")
  if (journal.purpose === "pass-closeout") {
    if (journal.commit === null || journal.commit.message !== "docs(262-74): complete authenticated verification sentinel" ||
        stable([...journal.commit.files].sort()) !== stable([...expected].sort())) fail("V138_ROUTE8_TRANSACTION_INVALID")
  } else if (journal.commit !== null) fail("V138_ROUTE8_TRANSACTION_INVALID")
}
const recoverTransaction = (root: string, options: InstallOptions = {}): void => {
  const directory = transactionDirPath(root)
  const intentPath = transactionIntentPath(root)
  const readIntent = () => {
    const intent = exactRecord(readJson(intentPath, "V138_ROUTE8_TRANSACTION_INVALID"),
      ["schemaVersion", "nonce", "journalRoot", "beforeState", "intentRoot"], "V138_ROUTE8_TRANSACTION_INVALID")
    const { intentRoot, ...intentBody } = intent
    if (intent.schemaVersion !== "v1.38-plan-262-74-transaction-intent-v1" ||
        typeof intent.nonce !== "string" || !/^[0-9a-f]{64}$/u.test(intent.nonce) ||
        !Array.isArray(intent.beforeState) ||
        intentRoot !== digest(`v138-route8-transaction-intent-v1\0${stable(intentBody)}`)) {
      fail("V138_ROUTE8_TRANSACTION_INVALID")
    }
    for (const item of intent.beforeState) {
      const before = exactRecord(item, ["path", "before"], "V138_ROUTE8_TRANSACTION_INVALID")
      if (typeof before.path !== "string" || !(before.before === null || typeof before.before === "string")) {
        fail("V138_ROUTE8_TRANSACTION_INVALID")
      }
    }
    return intent
  }
  if (safe(directory) === "missing") {
    if (safe(intentPath) === "regular") {
      const intent = readIntent()
      for (const item of intent.beforeState as { path: string; before: string | null }[]) {
        const file = actual(root, item.path)
        const current = safe(file) === "regular" ? Buffer.from(readFileSync(file)).toString("base64") : null
        if (current !== item.before) fail("V138_ROUTE8_TRANSACTION_CONFLICT")
      }
      const prepare = transactionPreparePath(root, intent.nonce as string)
      if (safe(prepare) !== "missing") {
        if (!lstatSync(prepare).isDirectory() || lstatSync(prepare).isSymbolicLink()) fail("V138_ROUTE8_TRANSACTION_INVALID")
        rmSync(prepare, { recursive: true }); fsyncDirectory(path.dirname(prepare))
      }
      rmSync(intentPath); fsyncDirectory(path.dirname(intentPath))
    }
    return
  }
  if (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink()) fail("V138_ROUTE8_TRANSACTION_INVALID")
  const intent = readIntent()
  if (safe(path.join(directory, "journal.json")) === "missing") {
    for (const item of intent.beforeState as { path: string; before: string | null }[]) {
      const file = actual(root, item.path)
      const current = safe(file) === "regular" ? Buffer.from(readFileSync(file)).toString("base64") : null
      if (current !== item.before) fail("V138_ROUTE8_TRANSACTION_CONFLICT")
    }
    rmSync(directory, { recursive: true }); fsyncDirectory(path.dirname(directory))
    rmSync(intentPath); fsyncDirectory(path.dirname(intentPath)); return
  }
  const journal = parseJournal(readText(path.join(directory, "journal.json"), "V138_ROUTE8_TRANSACTION_INVALID"))
  if (intent.nonce !== journal.nonce || intent.journalRoot !== journal.journalRoot) fail("V138_ROUTE8_TRANSACTION_INVALID")
  validateJournalInventory(journal)
  if (journal.testOnly !== (options.testOnlyToken === TEST_ONLY)) fail("V138_ROUTE8_TRANSACTION_INVALID")
  const currentHead = gitText(root, ["rev-parse", "HEAD"])
  if (currentHead !== journal.startHead) {
    if (journal.commit === null || gitText(root, ["rev-parse", "HEAD^"]) !== journal.startHead ||
        gitText(root, ["show", "-s", "--format=%s", "HEAD"]) !== journal.commit.message) {
      fail("V138_ROUTE8_TRANSACTION_CONFLICT")
    }
  }
  let installed = 0
  for (const change of journal.changes) {
    const file = actual(root, change.path)
    const current = safe(file) === "regular" ? readFileSync(file, "utf8") : null
    const before = change.before === null ? null : Buffer.from(change.before, "base64").toString("utf8")
    const after = change.after === null ? null : Buffer.from(change.after, "base64").toString("utf8")
    if (current !== after) {
      if (current !== before) fail("V138_ROUTE8_TRANSACTION_CONFLICT")
      if (after === null) {
        if (current !== null) { rmSync(file); fsyncDirectory(path.dirname(file)) }
      } else if (current === null) {
        const descriptor = openSync(file, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
        try { writeFileSync(descriptor, after); fsyncSync(descriptor) } finally { closeSync(descriptor) }
        fsyncDirectory(path.dirname(file))
      } else durableReplace(file, after)
      installed += 1
      if (options.crashAfterInstall === installed) process.exit(137)
      if (options.faultAfterInstall === installed) fail("V138_ROUTE8_TEST_INSTALL_FAILURE")
    }
  }
  if (journal.commit !== null) {
    if (options.crashBeforeCommit) process.kill(process.pid, "SIGKILL")
    const dirty = gitText(root, ["status", "--porcelain=v1", "--", ...journal.commit.files])
    if (dirty !== "") {
      const stageable = journal.commit.files.filter(file => {
        if (safe(actual(root, file)) === "regular") return true
        try { execFileSync("git", ["ls-files", "--error-unmatch", "--", file], { cwd: root, stdio: "ignore" }); return true }
        catch { return false }
      })
      if (options.testOnlyToken === TEST_ONLY) {
        execFileSync("git", ["add", "--", ...stageable], { cwd: root, stdio: "ignore" })
        execFileSync("git", ["commit", "-m", journal.commit.message], { cwd: root, stdio: "ignore" })
      } else {
        const candidates = [path.join(root, ".codex/gsd-core/bin/gsd-tools.cjs"),
          "/Users/roryquinlan/.codex/gsd-core/bin/gsd-tools.cjs"]
        const tool = candidates.find(candidate => safe(candidate) === "regular") ?? fail("V138_ROUTE8_GSD_TOOLS_MISSING")
        execFileSync(process.execPath, [tool, "query", "commit", journal.commit.message, "--files",
          ...stageable], { cwd: root, stdio: "ignore" })
      }
    }
    for (const change of journal.changes) {
      if (change.after === null) {
        try { execFileSync("git", ["cat-file", "-e", `HEAD:${change.path}`], { cwd: root, stdio: "ignore" }) }
        catch { continue }
        fail("V138_ROUTE8_CLOSEOUT_COMMIT_INVALID")
      }
      const committed = gitBytes(root, ["show", `HEAD:${change.path}`])
      if (!committed.equals(Buffer.from(change.after, "base64"))) fail("V138_ROUTE8_CLOSEOUT_COMMIT_INVALID")
    }
    if (options.crashAfterCommit) process.kill(process.pid, "SIGKILL")
  }
  rmSync(directory, { recursive: true })
  fsyncDirectory(path.dirname(directory))
  rmSync(intentPath)
  fsyncDirectory(path.dirname(intentPath))
}
const installTransaction = (root: string, purpose: TransactionJournal["purpose"],
  changes: readonly Replacement[], options: InstallOptions = {},
  commit: TransactionJournal["commit"] = null): void => {
  recoverTransaction(root, options)
  const seen = new Set(changes.map(change => change.file))
  if (seen.size !== changes.length) fail("V138_ROUTE8_TRANSACTION_INVALID")
  const nonce = randomBytes(32).toString("hex")
  const body = { schemaVersion: "v1.38-plan-262-74-transaction-v1" as const, purpose, nonce,
    testOnly: options.testOnlyToken === TEST_ONLY,
    startHead: gitText(root, ["rev-parse", "HEAD"]),
    changes: changes.map(change => ({ path: path.relative(path.resolve(root), change.file),
      before: safe(change.file) === "regular" ? Buffer.from(readFileSync(change.file)).toString("base64") : null,
      after: change.bytes === null ? null : Buffer.from(change.bytes).toString("base64") })), commit }
  const journal: TransactionJournal = { ...body,
    journalRoot: digest(`v138-route8-transaction-v1\0${stable(body)}`) }
  validateJournalInventory(journal)
  const intentBody = { schemaVersion: "v1.38-plan-262-74-transaction-intent-v1", nonce,
    journalRoot: journal.journalRoot, beforeState: body.changes.map(change => ({ path: change.path, before: change.before })) }
  const intentPath = transactionIntentPath(root)
  writeFileSync(intentPath, stable({ ...intentBody,
    intentRoot: digest(`v138-route8-transaction-intent-v1\0${stable(intentBody)}`) }), { flag: "wx", mode: 0o600 })
  fsyncDirectory(path.dirname(intentPath))
  if (options.crashAfterSetup === 1) process.exit(137)
  const directory = transactionDirPath(root)
  const prepare = transactionPreparePath(root, nonce)
  mkdirSync(prepare, { mode: 0o700 })
  fsyncDirectory(path.dirname(prepare))
  if (options.crashAfterSetup === 2) process.exit(137)
  const journalPath = path.join(prepare, "journal.json")
  const descriptor = openSync(journalPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
  try { writeFileSync(descriptor, stable(journal)); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  if (options.crashAfterSetup === 3) process.exit(137)
  fsyncDirectory(prepare)
  if (options.crashAfterSetup === 4) process.exit(137)
  renameSync(prepare, directory)
  fsyncDirectory(path.dirname(directory))
  if (options.crashAfterSetup === 5) process.exit(137)
  recoverTransaction(root, options)
}
const snapshot = (root: string, args: LifecycleArgs, mode: TestMode = {}) => {
  const identities = topology(root, args.phaseDir, mode)
  const disposition = checkedDisposition(root, args, mode)
  const validator = checkedValidator(root, args, disposition.branch, identities.topologyAnchorCommit)
  const requirementsBytes = readText(actual(root, args.requirements), "V138_ROUTE8_REQUIREMENTS_INVALID")
  const roadmapPath = actual(root, args.roadmap)
  const statePath = actual(root, args.state)
  const roadmapBytes = renderCarrier(readText(roadmapPath, "V138_ROUTE8_ROADMAP_INVALID"), disposition,
    identities, validator.provenance)
  const stateBytes = renderCarrier(readText(statePath, "V138_ROUTE8_STATE_INVALID"), disposition,
    identities, validator.provenance)
  const marker: NormalizedMarker = { schemaVersion: "v1.38-plan-262-74-normalized-validation-v1",
    totalPlans: 56, trustworthySummaries: 55, soleIncomplete: "262-74", ...identities,
    branch: disposition.branch, activationRoot: disposition.activationRoot,
    activationSha256: disposition.activationSha256,
    dispositionRoot: disposition.disposition.dispositionRoot as Sha256,
    terminalRoot: disposition.terminalRoot, executionProvenanceRoot: disposition.executionProvenanceRoot,
    dispositionSha256: digest(disposition.dispositionBytes), requirementsSha256: digest(requirementsBytes),
    localSealPath, localSealSha256: disposition.localSealSha256,
    localSealVerificationRoot: disposition.localSealVerificationRoot,
    localSealProtocolRoot: disposition.localSealProtocolRoot,
    assuranceClass: disposition.assuranceClass,
    validator: validator.provenance,
    roadmapSha256: digest(roadmapBytes), stateSha256: digest(stateBytes),
    freshCharged: disposition.freshCharged, freshAccepted: disposition.freshAccepted,
    admit03: disposition.branch === "obstruction" ? "blocked" : "passed",
    seal01: "passed_reduced_assurance", phase263PlanningAuthorized: disposition.branch === "terminal",
    downstreamAuthorityDenied: true }
  return { marker, roadmapPath, roadmapBytes, statePath, stateBytes, validator }
}
const authenticatedLegacyNormalization = (root: string, args: LifecycleArgs,
  prepared: ReturnType<typeof snapshot>, validation: string): boolean => {
  const matches = [...validation.matchAll(new RegExp(`<!-- ${normalizedTag}: (\\{[^\\n]+\\}) -->`, "g"))]
  if (matches.length !== 1 || validation.includes(validatorTag)) return false
  let marker: Record<string, unknown>
  try { marker = exactRecord(JSON.parse(matches[0]![1]!), ["schemaVersion", "totalPlans",
    "trustworthySummaries", "soleIncomplete", "branch", "activationRoot", "dispositionSha256",
    "requirementsSha256", "roadmapSha256", "stateSha256", "admit03", "seal01",
    "phase263PlanningAuthorized", "downstreamAuthorityDenied"], "V138_ROUTE8_LEGACY_NORMALIZATION_INVALID") }
  catch { return false }
  const base = (text: string): string => text.replace(/^.*phase-262-successor-status.*\n?/gmu, "")
    .replace(new RegExp(`^.*${normalizedTag}.*\\n?`, "gmu"), "").trimEnd()
  const correlated = marker.schemaVersion === "v1.38-plan-262-74-normalized-validation-v1" &&
    marker.totalPlans === 56 && marker.trustworthySummaries === 55 && marker.soleIncomplete === "262-74" &&
    marker.branch === prepared.marker.branch && marker.activationRoot === prepared.marker.activationRoot &&
    marker.dispositionSha256 === prepared.marker.dispositionSha256 &&
    marker.requirementsSha256 === prepared.marker.requirementsSha256 &&
    marker.roadmapSha256 === digest(readText(actual(root, args.roadmap), "V138_ROUTE8_LEGACY_NORMALIZATION_INVALID")) &&
    marker.stateSha256 === digest(readText(actual(root, args.state), "V138_ROUTE8_LEGACY_NORMALIZATION_INVALID")) &&
    marker.admit03 === prepared.marker.admit03 && marker.seal01 === "passed_reduced_assurance" &&
    marker.phase263PlanningAuthorized === prepared.marker.phase263PlanningAuthorized &&
    marker.downstreamAuthorityDenied === true && base(validation) === base(prepared.validator.sourceBytes)
  return correlated
}
export const normalizeV138PostValidation = (root: string, args: LifecycleArgs,
  options: InstallOptions = {}): NormalizedMarker => {
  requireCanonical(args, options)
  const prepared = snapshot(root, args, options)
  const validationPath = actual(root, args.validation)
  const validation = readText(validationPath, "V138_ROUTE8_VALIDATION_INVALID")
  const validatorLine = `<!-- ${validatorTag}: ${JSON.stringify(prepared.validator.provenance)} -->`
  const normalizedValidation = `${prepared.validator.sourceBytes.replace(/^.*phase-262-successor-status.*\n?/gmu, "")
    .replace(new RegExp(`^.*(?:${normalizedTag}|${validatorTag}).*\\n?`, "gmu"), "").trimEnd()}\n\n` +
    `${validatorLine}\n${markerLine(prepared.marker)}\n`
  if (validation !== prepared.validator.sourceBytes && validation !== normalizedValidation &&
      !authenticatedLegacyNormalization(root, args, prepared, validation)) {
    fail("V138_ROUTE8_VALIDATOR_PROVENANCE_INVALID")
  }
  installTransaction(root, "normalization", [
    { file: prepared.roadmapPath, bytes: prepared.roadmapBytes },
    { file: prepared.statePath, bytes: prepared.stateBytes },
    { file: validationPath, bytes: normalizedValidation },
  ], options)
  return prepared.marker
}
export const checkV138NormalizedPostValidation = (root: string, args: LifecycleArgs,
  mode: TestMode = {}): NormalizedMarker => {
  requireCanonical(args, mode)
  const prepared = snapshot(root, args, mode)
  if (readText(prepared.roadmapPath, "V138_ROUTE8_CARRIER_INVALID") !== prepared.roadmapBytes ||
      readText(prepared.statePath, "V138_ROUTE8_CARRIER_INVALID") !== prepared.stateBytes) fail("V138_ROUTE8_CARRIER_INVALID")
  const validation = readText(actual(root, args.validation), "V138_ROUTE8_VALIDATION_INVALID")
  if (validation.includes("phase-262-successor-status")) fail("V138_ROUTE8_VALIDATION_STALE")
  const current = extractMarker(validation)
  if (stable(current) !== stable(prepared.marker)) fail("V138_ROUTE8_VALIDATION_PROVENANCE_INVALID")
  const validatorMatches = [...validation.matchAll(new RegExp(`<!-- ${validatorTag}: (\\{[^\\n]+\\}) -->`, "g"))]
  if (validatorMatches.length !== 1 || stable(JSON.parse(validatorMatches[0]![1]!)) !== stable(prepared.validator.provenance)) {
    fail("V138_ROUTE8_VALIDATOR_PROVENANCE_INVALID")
  }
  return current
}

interface Binder extends Omit<NormalizedMarker, "schemaVersion"> {
  schemaVersion: "v1.38-plan-262-74-post-validation-binder-v1"
  validationSha256: Sha256
  binderRoot: Sha256
}
const buildBinder = (root: string, args: LifecycleArgs, mode: TestMode = {}): Binder => {
  const marker = checkV138NormalizedPostValidation(root, args, mode)
  const body = { ...marker, schemaVersion: "v1.38-plan-262-74-post-validation-binder-v1" as const,
    validationSha256: digest(readText(actual(root, args.validation), "V138_ROUTE8_VALIDATION_INVALID")) }
  return { ...body, binderRoot: digest(`v138-route8-post-validation-binder\0${stable(body)}`) }
}
export const bindV138PostValidation = (root: string, args: LifecycleArgs & { output: string },
  mode: TestMode = {}): Binder => {
  requireCanonical(args, mode)
  if (mode.testOnlyToken !== TEST_ONLY && args.output !== V138_ROUTE_8_PATHS.binder) fail("V138_ROUTE8_CANONICAL_PATH_REQUIRED")
  const binder = buildBinder(root, args, mode)
  writeExclusive(actual(root, args.output), stable(binder))
  return binder
}
export const checkV138PostValidationBinder = (root: string, args: LifecycleArgs & { binder: string },
  mode: TestMode = {}): Binder => {
  requireCanonical(args, mode)
  if (mode.testOnlyToken !== TEST_ONLY && args.binder !== V138_ROUTE_8_PATHS.binder) fail("V138_ROUTE8_CANONICAL_PATH_REQUIRED")
  const current = readJson(actual(root, args.binder), "V138_ROUTE8_BINDER_INVALID")
  const expected = buildBinder(root, args, mode)
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
  verificationCarrierAvailable: boolean
  reportRoot: Sha256
}
const verifierInput = (binder: Binder): VerifierInput => ({ ...binder,
  schemaVersion: "v1.38-plan-262-74-verifier-input-v1" })
export const verifyV138Plan26274Input = (value: unknown): VerifierReport => {
  const input = exactRecord(value, ["schemaVersion", "totalPlans", "trustworthySummaries",
    "soleIncomplete", "planIdentitySha256", "summaryIdentitySha256", "topologyManifestRoot",
    "topologyAnchorCommit", "topologyEntries", "branch", "activationRoot",
    "activationSha256", "dispositionRoot", "terminalRoot", "executionProvenanceRoot", "dispositionSha256", "localSealPath",
    "localSealSha256", "localSealVerificationRoot", "localSealProtocolRoot", "assuranceClass", "validator", "requirementsSha256",
    "roadmapSha256", "stateSha256", "freshCharged", "freshAccepted", "admit03", "seal01",
    "phase263PlanningAuthorized", "downstreamAuthorityDenied", "validationSha256", "binderRoot"],
  "V138_ROUTE8_VERIFIER_INPUT_INVALID") as unknown as VerifierInput
  const terminal = input.branch === "terminal"
  const validator = input.validator
  if (validator === null || typeof validator !== "object" || Array.isArray(validator)) fail("V138_ROUTE8_VERIFIER_INPUT_INVALID")
  const { validatorRoot, ...validatorBody } = validator as ValidatorProvenance
  if (validatorRoot !== digest(`v138-route8-post-plan73-validator-v1\0${stable(validatorBody)}`)) {
    fail("V138_ROUTE8_VERIFIER_INPUT_INVALID")
  }
  const correlation = terminal ? input.activationRoot === V138_ROUTE_8_PATHS.activation &&
    typeof input.activationSha256 === "string" && input.freshCharged === 540 && input.freshAccepted === 540 &&
    typeof input.executionProvenanceRoot === "string" && input.admit03 === "passed" && input.phase263PlanningAuthorized === true :
    input.activationRoot === null && input.activationSha256 === null && input.freshCharged === 0 &&
    input.freshAccepted === 0 && input.executionProvenanceRoot === null && input.admit03 === "blocked" &&
    input.phase263PlanningAuthorized === false
  if (input.schemaVersion !== "v1.38-plan-262-74-verifier-input-v1" || input.totalPlans !== 56 ||
      input.trustworthySummaries !== 55 || input.soleIncomplete !== "262-74" || !correlation ||
      input.seal01 !== "passed_reduced_assurance" || input.assuranceClass !== "single_operator_local_seal_v1" ||
      input.localSealPath !== localSealPath || input.downstreamAuthorityDenied !== true ||
      validator.status !== (terminal ? "passed" : "gaps_found") ||
      validator.admit03 !== (terminal ? "passed" : "blocked") || validator.downstreamAuthorityDenied !== true) {
    fail("V138_ROUTE8_VERIFIER_INPUT_INVALID")
  }
  const body = { schemaVersion: "v1.38-plan-262-74-verifier-report-v1" as const,
    status: terminal ? "passed" as const : "gaps_found" as const, binderRoot: input.binderRoot,
    branch: input.branch, gaps: terminal ? [] : ["ADMIT-03"], humanItems: [] as const,
    verificationCarrierAvailable: validator.verificationCarrierAvailable }
  return { ...body, reportRoot: digest(`v138-route8-verifier-report\0${stable(body)}`) }
}
const renderReport = (report: VerifierReport): string => `---\nstatus: ${report.status}\n` +
  `schema: ${report.schemaVersion}\nreport_root: ${report.reportRoot}\n---\n\n# Phase 262 Verification\n\n` +
  `Binder: ${report.binderRoot}\nBranch: ${report.branch}\nGaps: ${report.gaps.join(",") || "none"}\n` +
  `Human items: ${report.humanItems.length}\nVerification carrier available: ${report.verificationCarrierAvailable}\n`
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
const completeCarrier = (text: string, report: VerifierReport): string => {
  const matches = [...text.matchAll(carrierPattern)]
  if (matches.length !== 1) fail("V138_ROUTE8_CARRIER_INVALID")
  const value = JSON.parse(matches[0]![1]!) as Record<string, unknown>
  if (value.schema_version !== "v1.38-plan-262-74-lifecycle-carrier-v1" || value.branch !== "terminal" ||
      value.downstream_authority_denied !== true) fail("V138_ROUTE8_CARRIER_INVALID")
  const completed = { ...value, proof_status: "route_8_phase_262_complete",
    trustworthy_summaries: 56, active_successors: [], incomplete: [],
    next_action: "plan-phase-263", phase263_authorized: true,
    plan_74_report_root: report.reportRoot }
  return text.replace(carrierPattern, `<!-- ${sentinelTag}: ${JSON.stringify(completed)} -->`)
}
const replaceExactlyOnce = (text: string, pattern: RegExp, replacement: string, code: string): string => {
  const matches = text.match(pattern) ?? []
  if (matches.length !== 1) fail(code)
  return text.replace(pattern, replacement)
}
const preparePassCloseout = (root: string, args: DriverArgs, binder: Binder,
  report: VerifierReport): { changes: Replacement[]; commit: NonNullable<TransactionJournal["commit"]> } => {
  const requirementsPath = actual(root, args.requirements)
  const roadmapPath = actual(root, args.roadmap)
  const statePath = actual(root, args.state)
  const validationPath = actual(root, args.validation)
  const verificationPath = actual(root, args.verification)
  const summaryPath = phaseFile(root, args.phaseDir, "262-74-SUMMARY.md")
  const blockedPath = phaseFile(root, args.phaseDir, "262-74-BLOCKED.md")
  const requirements = replaceExactlyOnce(readText(requirementsPath, "V138_ROUTE8_REQUIREMENTS_INVALID"),
    /^- \[ \] \*\*ADMIT-03\*\*:/gmu, "- [x] **ADMIT-03**:", "V138_ROUTE8_CLOSEOUT_PRECONDITION_INVALID")
  let roadmap = completeCarrier(readText(roadmapPath, "V138_ROUTE8_ROADMAP_INVALID"), report)
  roadmap = replaceExactlyOnce(roadmap, /^- \[ \] \*\*Phase 262:/gmu,
    "- [x] **Phase 262:", "V138_ROUTE8_CLOSEOUT_PRECONDITION_INVALID")
  roadmap = replaceExactlyOnce(roadmap, /^\*\*Plans:\*\* 55\/56 plans executed$/gmu,
    "**Plans:** 56/56 plans executed", "V138_ROUTE8_CLOSEOUT_PRECONDITION_INVALID")
  roadmap = replaceExactlyOnce(roadmap,
    /^\| 262\. Foundation Admission, Measurement, Custody, and Containment Contract \| 55\/56 \| In Progress\|  \|$/gmu,
    "| 262. Foundation Admission, Measurement, Custody, and Containment Contract | 56/56 | Complete|  |",
    "V138_ROUTE8_CLOSEOUT_PRECONDITION_INVALID")
  let state = completeCarrier(readText(statePath, "V138_ROUTE8_STATE_INVALID"), report)
  for (const [pattern, replacement] of [
    [/^current_phase: 262$/gmu, "current_phase: 263"],
    [/^current_phase_name: foundation-admission-measurement-custody-and-containment-con$/gmu,
      "current_phase_name: legal-planner-and-deterministic-runner-feasibility"],
    [/^status: .*$/gmu, "status: Phase 262 complete; ready to plan Phase 263"],
    [/^stopped_at: Completed 262-73-PLAN\.md$/gmu, "stopped_at: Completed 262-74-PLAN.md"],
    [/^  completed_phases: 0$/gmu, "  completed_phases: 1"],
    [/^  completed_plans: 55$/gmu, "  completed_plans: 56"],
    [/^  percent: 98$/gmu, "  percent: 100"],
  ] as const) state = replaceExactlyOnce(state, pattern, replacement, "V138_ROUTE8_CLOSEOUT_PRECONDITION_INVALID")
  const summary = renderSummary(report)
  const baseChanges: Replacement[] = [
    { file: blockedPath, bytes: null },
    { file: verificationPath, bytes: renderReport(report) },
    { file: summaryPath, bytes: summary },
    { file: validationPath, bytes: readText(validationPath, "V138_ROUTE8_VALIDATION_INVALID") },
    { file: actual(root, args.binder), bytes: stable(binder) },
  ]
  const receiptBody = { schemaVersion: "v1.38-plan-262-74-closeout-v1", binderRoot: binder.binderRoot,
    reportRoot: report.reportRoot, summarySha256: digest(summary), requirementsSha256: digest(requirements),
    roadmapSha256: digest(roadmap), stateSha256: digest(state),
    validationSha256: digest(readText(validationPath, "V138_ROUTE8_VALIDATION_INVALID")),
    verificationSha256: digest(renderReport(report)), phase263PlanningAuthorized: true,
    downstreamAuthorityDenied: true }
  const receipt = stable({ ...receiptBody,
    closeoutRoot: digest(`v138-route8-plan26274-closeout-v1\0${stable(receiptBody)}`) })
  baseChanges.push({ file: actual(root, canonicalCloseout), bytes: receipt },
    { file: requirementsPath, bytes: requirements }, { file: roadmapPath, bytes: roadmap },
    { file: statePath, bytes: state })
  const files = baseChanges.map(change => path.relative(path.resolve(root), change.file))
  return { changes: baseChanges,
    commit: { message: "docs(262-74): complete authenticated verification sentinel", files } }
}
interface DriverArgs { binder: string; phaseDir: string; requirements: string; roadmap: string; state: string; validation: string; verification: string }
interface SentinelResultArgs extends DriverArgs { summary: string; blocked: string }
const lifecycleFromDriver = (args: DriverArgs): LifecycleArgs => ({ phaseDir: args.phaseDir,
  requirements: args.requirements, roadmap: args.roadmap, state: args.state,
  validation: args.validation, disposition: V138_ROUTE_8_PATHS.disposition, activationRoot: "auto" })
const checkCommittedCloseout = (root: string, args: DriverArgs): "passed" | null => {
  const closeoutPath = actual(root, canonicalCloseout)
  const summaryPath = phaseFile(root, args.phaseDir, "262-74-SUMMARY.md")
  if (safe(closeoutPath) === "missing" && safe(summaryPath) === "missing") return null
  const binder = readJson(actual(root, args.binder), "V138_ROUTE8_BINDER_INVALID")
  const { binderRoot, ...binderBody } = binder
  if (binderRoot !== digest(`v138-route8-post-validation-binder\0${stable(binderBody)}`)) fail("V138_ROUTE8_BINDER_INVALID")
  const receipt = readJson(closeoutPath, "V138_ROUTE8_CLOSEOUT_INVALID")
  const { closeoutRoot, ...receiptBody } = receipt
  if (closeoutRoot !== digest(`v138-route8-plan26274-closeout-v1\0${stable(receiptBody)}`) ||
      receipt.binderRoot !== binderRoot || receipt.summarySha256 !== digest(readText(summaryPath, "V138_ROUTE8_CLOSEOUT_INVALID")) ||
      receipt.requirementsSha256 !== digest(readText(actual(root, args.requirements), "V138_ROUTE8_CLOSEOUT_INVALID")) ||
      receipt.roadmapSha256 !== digest(readText(actual(root, args.roadmap), "V138_ROUTE8_CLOSEOUT_INVALID")) ||
      receipt.stateSha256 !== digest(readText(actual(root, args.state), "V138_ROUTE8_CLOSEOUT_INVALID")) ||
      receipt.validationSha256 !== digest(readText(actual(root, args.validation), "V138_ROUTE8_CLOSEOUT_INVALID")) ||
      receipt.verificationSha256 !== digest(readText(actual(root, args.verification), "V138_ROUTE8_CLOSEOUT_INVALID")) ||
      receipt.phase263PlanningAuthorized !== true || receipt.downstreamAuthorityDenied !== true) {
    fail("V138_ROUTE8_CLOSEOUT_INVALID")
  }
  const files = [args.binder, args.requirements, args.roadmap, args.state, args.validation,
    args.verification, path.relative(path.resolve(root), summaryPath), canonicalBlocked, canonicalCloseout]
  if (safe(actual(root, canonicalBlocked)) !== "missing" ||
      gitText(root, ["status", "--porcelain=v1", "--", ...files]) !== "") fail("V138_ROUTE8_CLOSEOUT_INVALID")
  return "passed"
}
export const checkV138Plan26274Result = (root: string, args: SentinelResultArgs,
  mode: TestMode = {}): "passed" | "gaps_found" => {
  requireCanonical(lifecycleFromDriver(args), mode)
  if (safe(transactionDirPath(root)) !== "missing" || safe(transactionIntentPath(root)) !== "missing") {
    fail("V138_ROUTE8_TRANSACTION_PENDING")
  }
  if (mode.testOnlyToken !== TEST_ONLY && (args.binder !== V138_ROUTE_8_PATHS.binder ||
      args.verification !== canonicalVerification || args.summary !== canonicalSummary ||
      args.blocked !== canonicalBlocked)) fail("V138_ROUTE8_CANONICAL_PATH_REQUIRED")
  if (checkCommittedCloseout(root, args) === "passed") return "passed"
  const binder = checkV138PostValidationBinder(root, { ...lifecycleFromDriver(args), binder: args.binder }, mode)
  const report = verifyV138Plan26274Input(verifierInput(binder))
  if (report.verificationCarrierAvailable &&
      readText(actual(root, args.verification), "V138_ROUTE8_VERIFICATION_INVALID") !== renderReport(report)) {
    fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  }
  if (report.status === "passed") {
    if (readText(actual(root, args.summary), "V138_ROUTE8_SENTINEL_RESULT_INVALID") !== renderSummary(report) ||
        safe(actual(root, args.blocked)) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
    return "passed"
  }
  if (safe(actual(root, args.summary)) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  if (report.verificationCarrierAvailable) {
    if (safe(actual(root, args.blocked)) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  } else if (safe(actual(root, args.verification)) !== "missing" ||
      readText(actual(root, args.blocked), "V138_ROUTE8_SENTINEL_RESULT_INVALID") !== renderBlocked(report)) {
    fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
  }
  return "gaps_found"
}

export const runV138Plan26274Sentinel = (root: string, args: DriverArgs,
  options: InstallOptions = {}): "passed" | "gaps_found" => {
  requireCanonical(lifecycleFromDriver(args), options)
  if (options.testOnlyToken !== TEST_ONLY && (args.binder !== V138_ROUTE_8_PATHS.binder ||
      args.verification !== canonicalVerification)) fail("V138_ROUTE8_CANONICAL_PATH_REQUIRED")
  recoverTransaction(root, options)
  if (checkCommittedCloseout(root, args) === "passed") return "passed"
  const temp = mkdtempSync(path.join(tmpdir(), "v138-route8-sentinel-"))
  chmodSync(temp, 0o700)
  try {
    const binder = checkV138PostValidationBinder(root, { ...lifecycleFromDriver(args), binder: args.binder }, options)
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
    if (report.status === "passed") {
      const prepared = preparePassCloseout(root, args, binder, report)
      installTransaction(root, "pass-closeout", prepared.changes, options, prepared.commit)
      return "passed"
    }
    if (safe(summaryPath) !== "missing") fail("V138_ROUTE8_SENTINEL_RESULT_INVALID")
    const blockedPath = phaseFile(root, args.phaseDir, "262-74-BLOCKED.md")
    installTransaction(root, "gaps", report.verificationCarrierAvailable ?
      [{ file: actual(root, args.verification), bytes: reportBytes }, { file: blockedPath, bytes: null }] :
      [{ file: actual(root, args.verification), bytes: null }, { file: blockedPath, bytes: renderBlocked(report) }], options)
    return "gaps_found"
  } finally { rmSync(temp, { recursive: true, force: true }) }
  return fail("V138_ROUTE8_SENTINEL_UNREACHABLE")
}

/** Test-only dependency boundary. Production CLI never dispatches through this object. */
export const V138_PLAN_262_74_TEST_ONLY = Object.freeze({
  checkProductionExecutionProvenance: (root: string) => checkedExecutionProvenance(root),
  normalize: (root: string, args: LifecycleArgs, options: Omit<InstallOptions, "testOnlyToken"> = {}) =>
    normalizeV138PostValidation(root, args, { ...options, testOnlyToken: TEST_ONLY }),
  checkNormalized: (root: string, args: LifecycleArgs) =>
    checkV138NormalizedPostValidation(root, args, { testOnlyToken: TEST_ONLY }),
  bind: (root: string, args: LifecycleArgs & { output: string }) =>
    bindV138PostValidation(root, args, { testOnlyToken: TEST_ONLY }),
  checkBinder: (root: string, args: LifecycleArgs & { binder: string }) =>
    checkV138PostValidationBinder(root, args, { testOnlyToken: TEST_ONLY }),
  run: (root: string, args: DriverArgs, options: Omit<InstallOptions, "testOnlyToken"> = {}) =>
    runV138Plan26274Sentinel(root, args, { ...options, testOnlyToken: TEST_ONLY }),
  checkResult: (root: string, args: SentinelResultArgs) =>
    checkV138Plan26274Result(root, args, { testOnlyToken: TEST_ONLY }),
  recover: (root: string, options: Omit<InstallOptions, "testOnlyToken"> = {}) =>
    recoverTransaction(root, { ...options, testOnlyToken: TEST_ONLY }),
})

const parse = (values: readonly string[], allowed: readonly string[]): Map<string, string> => {
  const map = new Map<string, string>()
  for (let i = 0; i < values.length; i += 2) {
    if (!values[i]?.startsWith("--") || values[i + 1] === undefined || values[i + 1]?.startsWith("--") ||
        !allowed.includes(values[i]!) || map.has(values[i]!)) fail("V138_ROUTE8_ARGUMENTS_INVALID")
    map.set(values[i]!, values[i + 1]!)
  }
  if (map.size !== allowed.length) fail("V138_ROUTE8_ARGUMENTS_INVALID")
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
const lifecycleOptions = ["--phase-dir", "--requirements", "--roadmap", "--state", "--validation",
  "--disposition", "--activation-root"]
export const dispatchV138Route8Cli = (root: string, argv: readonly string[]): string => {
  if (argv.length === 1 && argv[0] === "--help") return help()
  if (argv.length === 1 && argv[0] === "--check") return `${JSON.stringify(checkV138Plan26269Route8Source(root))}\n`
  const command = argv[0]
  if (command === "--normalize-post-validation" || command === "--check-normalized-post-validation") {
    const args = parse(argv.slice(1), lifecycleOptions)
    const result = command === "--normalize-post-validation" ? normalizeV138PostValidation(root, lifecycleArgs(args)) :
      checkV138NormalizedPostValidation(root, lifecycleArgs(args))
    return `${JSON.stringify(result)}\n`
  }
  if (command === "--bind-post-validation" || command === "--check-post-validation-binder") {
    const extra = command === "--bind-post-validation" ? "--output" : "--binder"
    const args = parse(argv.slice(1), [...lifecycleOptions, extra])
    const result = command === "--bind-post-validation" ? bindV138PostValidation(root,
      { ...lifecycleArgs(args), output: required(args, extra) }) : checkV138PostValidationBinder(root,
      { ...lifecycleArgs(args), binder: required(args, extra) })
    return `${JSON.stringify(result)}\n`
  }
  if (command === "--run-plan-262-74-sentinel") {
    const allowed = ["--binder", "--phase-dir", "--requirements", "--roadmap", "--state", "--validation", "--verification"]
    const args = parse(argv.slice(1), allowed)
    return `${JSON.stringify({ status: runV138Plan26274Sentinel(root, { binder: required(args, "--binder"),
      phaseDir: required(args, "--phase-dir"), requirements: required(args, "--requirements"),
      roadmap: required(args, "--roadmap"), state: required(args, "--state"),
      validation: required(args, "--validation"), verification: required(args, "--verification") }) })}\n`
  }
  if (command === "--check-plan-262-74-result") {
    const args = parse(argv.slice(1), ["--binder", "--verification", "--summary", "--blocked"])
    return `${JSON.stringify({ status: checkV138Plan26274Result(root, { binder: required(args, "--binder"),
      ...canonicalLifecycleArgs, verification: required(args, "--verification"),
      summary: required(args, "--summary"), blocked: required(args, "--blocked") }) })}\n`
  }
  return fail("V138_ROUTE8_ARGUMENTS_INVALID")
}
const main = (): void => {
  process.stdout.write(dispatchV138Route8Cli(resolveRoot(), process.argv.slice(2)))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main() } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V138_ROUTE8_CHECK_FAILED"}\n`)
    process.exitCode = 1
  }
}
