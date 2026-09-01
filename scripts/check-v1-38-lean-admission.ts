import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { closeSync, constants, existsSync, fsyncSync, openSync, readFileSync, unlinkSync, writeSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { LEAN_AUTHORITY_FALSE, buildLeanSchedule, createLeanManifest, currentFormationIsRealistic, deriveAndValidateLeanTerminal, hashLeanValue, reduceLeanExecutions, validateLeanManifest, type LeanManifest, type LeanTerminal } from "./lib/v1-38-lean-runner-feasibility.js"

export const LEAN_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-manifest.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-source-review-v3.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-readiness-v3.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-invocation-v1.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-terminal.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-adjudication-v1.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-eligibility-v1.json",
} as const)
export const LEAN_DIAGNOSTIC_CUSTODY_PATH = ".planning/artifacts/v1.38-lean-runner-diagnostic-custody-v1.json" as const
export const LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH = ".v138-lean-corrective-child-ownership.json" as const
export const LEAN_CORRECTIVE_V1_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v1.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v1.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v1.json",
} as const)
export const LEAN_CORRECTIVE_V2_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v2.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v2.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v2.json",
} as const)
export const LEAN_CORRECTIVE_V3_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-corrective-source-manifest-v3.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-corrective-source-review-v3.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-corrective-readiness-v3.json",
} as const)
export const LEAN_CORRECTIVE_ARTIFACT_PATHS = Object.freeze({
  ...LEAN_CORRECTIVE_V3_ARTIFACT_PATHS,
  invocation: ".planning/artifacts/v1.38-lean-runner-corrective-invocation-v2.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-corrective-terminal-v2.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-corrective-adjudication-v2.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-corrective-eligibility-v2.json",
} as const)
export const LEAN_FIRST_INVOCATION_SHA256 = "40725af9f20ae945c19e1a60995e1eac2c51d00ac60453a8ffe42287368f4fa8" as const
export const LEAN_FIRST_TERMINAL_SHA256 = "87adadc50d720c3a7f68be57d26caeab2f001102113060f88d6a96f419bdb2bd" as const
export const LEAN_FIRST_INVOCATION_BLOB = "948a858103a28ad13f2b8497f1cd00d58cd6c2ba" as const
export const LEAN_FIRST_TERMINAL_BLOB = "0a776fd1ec3d967cc063d1ddb8261f4be65c98ac" as const
export const LEAN_FIRST_EVIDENCE_COMMIT = "d8e96b619cde4650a81757789757b88e1833b76e" as const
export const LEAN_HISTORICAL_SOURCE_REVIEW_PATH = ".planning/artifacts/v1.38-lean-runner-source-review-v1.json" as const
export const LEAN_HISTORICAL_SOURCE_REVIEW_SHA256 = "d8fc684745713dacf08e6d09a5c9ea451d145a36006b159bf21e97adbfa4768d" as const
export const LEAN_HISTORICAL_SOURCE_REVIEW_V2_PATH = ".planning/artifacts/v1.38-lean-runner-source-review-v2.json" as const
export const LEAN_HISTORICAL_SOURCE_REVIEW_V2_SHA256 = "1c46efb6bf504982c46304c381705a570687388fbf7bbfc717edf358bd49045b" as const
export const LEAN_HISTORICAL_READINESS_V2_PATH = ".planning/artifacts/v1.38-lean-runner-readiness-v2.json" as const

export const LEAN_MANIFEST_PATH = LEAN_ARTIFACT_PATHS.manifest
export const LEAN_INVOCATION_PATH = LEAN_ARTIFACT_PATHS.invocation
export const LEAN_TERMINAL_PATH = LEAN_ARTIFACT_PATHS.terminal
export const LEAN_READINESS_PATH = LEAN_ARTIFACT_PATHS.readiness
export const LEAN_ADJUDICATION_PATH = LEAN_ARTIFACT_PATHS.adjudication

/** Recursive Git-tree closure: every descendant under runtime/rules owners is bound. */
export const LEAN_EXECUTABLE_CLOSURE_PATHS = Object.freeze([
  "scripts/lib/v1-38-lean-runner-feasibility.ts",
  "scripts/lib/v1-38-lean-runner-feasibility.test.ts",
  "scripts/run-v1-38-lean-runner-feasibility.ts",
  "scripts/run-v1-38-lean-runner-feasibility.test.ts",
  "scripts/check-v1-38-lean-admission.ts",
  "scripts/check-v1-38-lean-admission.test.ts",
  "apps/runtime-service/src",
  "packages/engine/src",
  "packages/persistence/src",
  "packages/replay/src",
  "packages/runtime-js/src",
  "packages/runtime-python/src",
  "packages/runtime-supervisor/src",
  "packages/runtime-wasm-wasi/src",
  "packages/spec/src",
  "apps/runtime-service/package.json",
  "packages/engine/package.json",
  "packages/persistence/package.json",
  "packages/replay/package.json",
  "packages/runtime-js/package.json",
  "packages/runtime-python/package.json",
  "packages/runtime-supervisor/package.json",
  "packages/runtime-wasm-wasi/package.json",
  "packages/spec/package.json",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
] as const)
export const LEAN_SOURCE_PATHS = LEAN_EXECUTABLE_CLOSURE_PATHS

export interface LeanSourceReview {
  readonly schemaVersion: "v1.38-lean-runner-source-review-v3"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly unknown[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanReviewFinding {
  readonly id: string
  readonly severity: "critical" | "warning"
  readonly status: "open"
  readonly summary: string
}
export interface LeanReadiness {
  readonly schemaVersion: "v1.38-lean-runner-readiness-v3"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly sourceReviewRoot: `sha256:${string}`
  readonly findingCount: 0
  readonly plan151Eligible: true
  readonly liveInvocationLimit: 1
  readonly liveInvocationsConsumed: 0
  readonly correctiveRerunAuthorized: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanInvocation {
  readonly schemaVersion: "v1.38-lean-runner-invocation-v1"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly sourceReviewRoot: `sha256:${string}`
  readonly readinessRoot: `sha256:${string}`
  readonly childCapabilityRoot: `sha256:${string}`
  readonly claimClass: "fixture_feasibility_only"
  readonly liveInvocationOrdinal: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanTerminalArtifact extends Omit<LeanInvocation, "schemaVersion" | "liveInvocationOrdinal" | "claimClass"> {
  readonly schemaVersion: "v1.38-lean-runner-terminal-v1"
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly terminal: LeanTerminal
}
export interface LeanAdjudication {
  readonly schemaVersion: "v1.38-lean-runner-adjudication-v1"
  readonly terminalRoot: `sha256:${string}`
  readonly reviewedResult: LeanTerminal["result"]
  readonly findingCount: 0
  readonly findings: readonly []
  readonly admitsEligibility: boolean
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanEligibility {
  readonly schemaVersion: "v1.38-phase-262-lean-eligibility-v1"
  readonly adjudicationRoot: `sha256:${string}`
  readonly admit03: "satisfied_under_revised_contract" | "blocked"
  readonly phase262Complete: boolean
  readonly phase263PlanningEligible: boolean
  readonly phase263ExecutionEligible: boolean
  readonly authority: Readonly<Record<keyof typeof LEAN_AUTHORITY_FALSE, boolean>>
}
export interface LeanDiagnosticCustody {
  readonly schemaVersion: "v1.38-lean-runner-diagnostic-custody-v1"
  readonly claimClass: "diagnostic_inadmissibility_only"
  readonly diagnosticExecutions: 6
  readonly observationBasis: "operator_session_observation"
  readonly rawEvidencePresent: false
  readonly independentlyVerifiable: false
  readonly persisted: false
  readonly liveInvocation: false
  readonly charged: false
  readonly evidenceAdmissible: false
  readonly formationMaterialized: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveSourceReview {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-review-v1"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly LeanReviewFinding[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveReadiness {
  readonly schemaVersion: "v1.38-lean-runner-corrective-readiness-v3"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly sourceReviewRoot: `sha256:${string}`
  readonly findingCount: 0
  readonly plan158Eligible: true
  readonly correctiveInvocationLimit: 1
  readonly correctiveInvocationsConsumed: 0
  readonly recoveryOnlyLimit: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveManifestV3 extends Omit<LeanManifest, "schemaVersion"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v3"
  readonly predecessorRoots: {
    readonly failedManifestV1Root: `sha256:${string}`
    readonly failedReviewV1Root: `sha256:${string}`
    readonly failedManifestV2Root: `sha256:${string}`
    readonly failedReviewV2Root: `sha256:${string}`
    readonly firstInvocationRoot: `sha256:${string}`
    readonly firstTerminalRoot: `sha256:${string}`
    readonly diagnosticCustodyRoot: `sha256:${string}`
  }
  readonly successorLockCount: 36
  readonly freshCorrectiveEffects: {
    readonly readinessV3Present: false
    readonly invocationV2Present: false
    readonly terminalV2Present: false
    readonly adjudicationV2Present: false
    readonly eligibilityV2Present: false
    readonly childOwnershipPresent: false
  }
}
export interface LeanCorrectiveSourceReviewV3 {
  readonly schemaVersion: "v1.38-lean-runner-corrective-source-review-v3"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly LeanReviewFinding[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveInterruptionTombstone extends Omit<LeanCorrectiveInvocation, "schemaVersion" | "correctiveInvocationOrdinal" | "claimClass"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-interruption-tombstone-v1"
  readonly invocationRoot: `sha256:${string}`
  readonly result: "invalid"
  readonly recoveryTerminalized: true
  readonly chargedMatches: 0
  readonly successfulMatches: 0
  readonly completeCleanup: true
  readonly formationMaterialized: false
  readonly privacy: "safe_aggregate_only"
}
export interface LeanCorrectiveInvocation {
  readonly schemaVersion: "v1.38-lean-runner-corrective-invocation-v2"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly sourceReviewRoot: `sha256:${string}`
  readonly readinessRoot: `sha256:${string}`
  readonly firstInvocationRoot: `sha256:${string}`
  readonly firstTerminalRoot: `sha256:${string}`
  readonly diagnosticCustodyRoot: `sha256:${string}`
  readonly childCapabilityRoot: `sha256:${string}`
  readonly claimClass: "fixture_feasibility_only"
  readonly correctiveInvocationOrdinal: 1
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanCorrectiveTerminalArtifact extends Omit<LeanCorrectiveInvocation, "schemaVersion" | "correctiveInvocationOrdinal" | "claimClass"> {
  readonly schemaVersion: "v1.38-lean-runner-corrective-terminal-v2"
  readonly invocationRoot: `sha256:${string}`
  readonly privacy: "safe_aggregate_only"
  readonly recoveryTerminalized: boolean
  readonly terminal: LeanTerminal
}
export interface LeanCorrectiveChildOwnership {
  readonly schemaVersion: "v1.38-lean-corrective-child-ownership-v1"
  readonly invocationRoot: `sha256:${string}`
  readonly childPid: number
  readonly processGroupId: number
  readonly selector: "--execute-reviewed-cell"
  readonly token: string
  readonly commandArguments: readonly ["--execute-reviewed-cell", string]
}
export interface LeanCorrectiveOrphanRecoveryDependencies {
  readonly expectedInvocationRoot: `sha256:${string}`
  readonly commandForPid: (pid: number) => string | undefined
  readonly processGroupForPid: (pid: number) => number | undefined
  readonly signalProcessGroup: (processGroupId: number, signal: "SIGTERM" | "SIGKILL") => void
  readonly processIsAlive: (pid: number) => boolean
  readonly wait: (milliseconds: number) => Promise<void>
}

const git = (repoRoot: string, args: readonly string[]): string => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value)
const isSha = (value: unknown): value is `sha256:${string}` => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const isOid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const exactFalseAuthority = (value: unknown): boolean => isObject(value) && Object.keys(value).sort().join("\0") === Object.keys(LEAN_AUTHORITY_FALSE).sort().join("\0") && Object.values(value).every((flag) => flag === false)
const exactEligibilityAuthority = (value: unknown, passed: boolean): boolean => isObject(value) && Object.keys(value).sort().join("\0") === Object.keys(LEAN_AUTHORITY_FALSE).sort().join("\0") && Object.entries(value).every(([key, flag]) => flag === (passed && (key === "phase263PlanningAuthorized" || key === "phase263ExecutionAuthorized")))
const assertPrivacySafe = (value: unknown): void => {
  const serialized = JSON.stringify(value)
  if (/strategy(?:Source|Memory)|soldierMemory|objectivePayload|diagnostics|stderr|privateKey|\/Users\/|\/private\/tmp\/|[A-Za-z]:\\/iu.test(serialized)) throw new TypeError("LEAN_PRIVATE_DATA_FORBIDDEN")
}
const readJson = (repoRoot: string, artifactPath: string): unknown => JSON.parse(readFileSync(path.resolve(repoRoot, artifactPath), "utf8"))

export const validateLeanDiagnosticCustody = (value: unknown): LeanDiagnosticCustody => {
  const keys = ["schemaVersion", "claimClass", "diagnosticExecutions", "observationBasis", "rawEvidencePresent", "independentlyVerifiable", "persisted", "liveInvocation", "charged", "evidenceAdmissible", "formationMaterialized", "authority"]
  if (
    !isObject(value) || !exactKeys(value, keys) ||
    value.schemaVersion !== "v1.38-lean-runner-diagnostic-custody-v1" ||
    value.claimClass !== "diagnostic_inadmissibility_only" || value.diagnosticExecutions !== 6 ||
    value.observationBasis !== "operator_session_observation" || value.rawEvidencePresent !== false ||
    value.independentlyVerifiable !== false || value.persisted !== false || value.liveInvocation !== false ||
    value.charged !== false || value.evidenceAdmissible !== false || value.formationMaterialized !== false ||
    !exactFalseAuthority(value.authority)
  ) throw new TypeError("LEAN_DIAGNOSTIC_CUSTODY_INVALID")
  assertPrivacySafe(value)
  return globalThis.structuredClone(value) as unknown as LeanDiagnosticCustody
}

const sha256File = (target: string): string => createHash("sha256").update(readFileSync(target)).digest("hex")
export const checkLeanFirstEvidenceCustody = (repoRoot: string): void => {
  for (const [artifactPath, sha, blob] of [
    [LEAN_ARTIFACT_PATHS.invocation, LEAN_FIRST_INVOCATION_SHA256, LEAN_FIRST_INVOCATION_BLOB],
    [LEAN_ARTIFACT_PATHS.terminal, LEAN_FIRST_TERMINAL_SHA256, LEAN_FIRST_TERMINAL_BLOB],
  ] as const) {
    const target = path.resolve(repoRoot, artifactPath)
    if (sha256File(target) !== sha || git(repoRoot, ["hash-object", artifactPath]) !== blob || git(repoRoot, ["rev-parse", `${LEAN_FIRST_EVIDENCE_COMMIT}:${artifactPath}`]) !== blob) throw new TypeError("LEAN_FIRST_EVIDENCE_DRIFT")
  }
}

const assertCorrectiveFreshDestinationsAbsent = (repoRoot: string, allowed: readonly string[] = []): void => {
  for (const artifactPath of Object.values(LEAN_CORRECTIVE_ARTIFACT_PATHS)) {
    if (!allowed.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_CORRECTIVE_DESTINATION_EXISTS:${artifactPath}`)
  }
}
export const assertLeanCorrectiveFreshEffectsAbsent = (invocationPresent: boolean, terminalPresent: boolean): void => {
  if (invocationPresent) throw new TypeError("LEAN_CORRECTIVE_INVOCATION_EXISTS")
  if (terminalPresent) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
}
const assertSuccessorLockInventory = (repoRoot: string): void => {
  const lines = git(repoRoot, ["status", "--short", "--untracked-files=all"]).split("\n").filter((line) => /^\?\? \.v138-successor-[0-9a-f]{64}\.lock$/u.test(line))
  if (lines.length !== 36 || new Set(lines).size !== 36) throw new TypeError("LEAN_SUCCESSOR_LOCK_INVENTORY_DRIFT")
}

export const checkLeanCorrectiveRecoveryOnlyStructure = (runnerSource: string, checkerSource?: string): void => {
  const extractBlock = (source: string, marker: string): string => {
    const start = source.indexOf(marker)
    const brace = source.indexOf("{", start)
    if (start < 0 || brace < 0) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_STRUCTURE_MISSING")
    let depth = 0
    for (let index = brace; index < source.length; index += 1) {
      if (source[index] === "{") depth += 1
      else if (source[index] === "}") {
        depth -= 1
        if (depth === 0) return source.slice(start, index + 1)
      }
    }
    throw new TypeError("LEAN_CORRECTIVE_RECOVERY_STRUCTURE_MISSING")
  }
  const checker = checkerSource ?? readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "check-v1-38-lean-admission.ts"), "utf8")
  const selector = extractBlock(runnerSource, "if (selector === LEAN_CORRECTIVE_RECOVERY_ONLY_SELECTOR)")
  const helper = extractBlock(runnerSource, "export const runLeanCorrectiveRecoveryOnlyInjected")
  if (!selector.includes("runLeanCorrectiveRecoveryOnlyInjected") || !selector.includes("recoverLeanCorrectiveOrphan")) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_STRUCTURE_MISSING")
  const modules = [runnerSource, checker]
  const roots = [selector, helper]
  for (const exported of ["recoverLeanCorrectiveOrphan", "terminalizeLeanCorrectiveInterruption", "checkLeanCorrectiveTerminal"]) roots.push(extractBlock(checker, `export const ${exported}`))
  const definitions = new Map<string, string>()
  for (const source of modules) {
    for (const match of source.matchAll(/(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)(?::[^=]+)?\s*=>\s*\{/gu)) {
      try { definitions.set(match[1]!, extractBlock(source, match[0]!)) } catch { /* non-reachable parser edge; roots still fail closed */ }
    }
  }
  const pending = [...roots]
  const inspected = new Set<string>()
  while (pending.length > 0) {
    const body = pending.pop()!
    if (inspected.has(body)) continue
    inspected.add(body)
    if (/(?:\bfork\s*\(|\bspawn\w*\s*\(|createExclusiveLeanInvocationMarker|buildLeanSchedule\s*\(|executePrepared|runLeanFeasibility|createSupervisedLeanExecutionDependencies|prepareLeanCorrectiveInvocation|child\.send|kind\s*:\s*["']execute["'])/u.test(body)) throw new TypeError("LEAN_CORRECTIVE_RECOVERY_LAUNCH_CAPABILITY")
    for (const call of body.matchAll(/(?<![.\w])([A-Za-z_$][\w$]*)\s*\(/gu)) {
      const callee = definitions.get(call[1]!)
      if (callee !== undefined && !inspected.has(callee)) pending.push(callee)
    }
    for (const call of body.matchAll(/checker\.([A-Za-z_$][\w$]*)\s*\(/gu)) {
      const callee = definitions.get(call[1]!)
      if (callee === undefined) throw new TypeError(`LEAN_CORRECTIVE_RECOVERY_UNRESOLVED_CALL:${call[1]}`)
      if (!inspected.has(callee)) pending.push(callee)
    }
  }
}

export const checkLeanCorrectiveSourceOnly = (repoRoot: string): void => {
  checkLeanFirstEvidenceCustody(repoRoot)
  validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  assertCorrectiveFreshDestinationsAbsent(repoRoot)
  assertSuccessorLockInventory(repoRoot)
  const schedule = buildLeanSchedule()
  if (schedule.length !== 24 || new Set(schedule.map(({ chargedIdentity }) => chargedIdentity)).size !== 24 || new Set(schedule.map(({ baseCellId }) => baseCellId)).size !== 12) throw new TypeError("LEAN_CORRECTIVE_SCHEDULE_DRIFT")
  for (const cell of schedule) {
    if (cell.arenaId === "arena:open-field:v1" && cell.executionArenaId !== "arena:smoke:v1") throw new TypeError("LEAN_CORRECTIVE_ALIAS_DRIFT")
    if (cell.semanticGeometryHash !== cell.executionSemanticGeometryHash) throw new TypeError("LEAN_CORRECTIVE_GEOMETRY_DRIFT")
  }
}

export const checkHistoricalLeanSourceReviewBytes = (bytes: Uint8Array): void => {
  if (createHash("sha256").update(bytes).digest("hex") !== LEAN_HISTORICAL_SOURCE_REVIEW_SHA256) throw new TypeError("LEAN_HISTORICAL_SOURCE_REVIEW_DRIFT")
}
export const checkHistoricalLeanSourceReviewV2Bytes = (bytes: Uint8Array): void => {
  if (createHash("sha256").update(bytes).digest("hex") !== LEAN_HISTORICAL_SOURCE_REVIEW_V2_SHA256) throw new TypeError("LEAN_HISTORICAL_SOURCE_REVIEW_V2_DRIFT")
}
const checkHistoricalLeanReviewHistory = (repoRoot: string): void => {
  checkHistoricalLeanSourceReviewBytes(readFileSync(path.resolve(repoRoot, LEAN_HISTORICAL_SOURCE_REVIEW_PATH)))
  checkHistoricalLeanSourceReviewV2Bytes(readFileSync(path.resolve(repoRoot, LEAN_HISTORICAL_SOURCE_REVIEW_V2_PATH)))
  if (existsSync(path.resolve(repoRoot, LEAN_HISTORICAL_READINESS_V2_PATH))) throw new TypeError("LEAN_HISTORICAL_READINESS_V2_MUST_REMAIN_ABSENT")
}

export const assertLeanStatus = (status: string, allowedUntracked: readonly string[] = []): void => {
  const invalid = status.split("\n").filter(Boolean).filter((line) => !(line.startsWith("?? ") && (/^\.v138-successor-[0-9a-f]{64}\.lock$/u.test(line.slice(3)) || allowedUntracked.includes(line.slice(3)))))
  if (invalid.length > 0) throw new TypeError(`LEAN_WORKTREE_DIRTY:${invalid.join(",")}`)
}
export const assertLeanCorrectiveAdmissionStatus = (status: string, allowedOperationalPaths: readonly string[]): void => {
  assertLeanStatus(status, allowedOperationalPaths)
}
const assertLeanCorrectiveTrackedBytes = (repoRoot: string, sourceCommit: string): void => {
  try {
    execFileSync("git", ["diff", "--quiet", sourceCommit, "--", ...LEAN_EXECUTABLE_CLOSURE_PATHS], {
      cwd: repoRoot,
      stdio: "ignore",
    })
  } catch {
    throw new TypeError("LEAN_CORRECTIVE_TRACKED_BYTES_DRIFT")
  }
}
const resolveCommit = (repoRoot: string, ref: string): string => {
  const commit = git(repoRoot, ["rev-parse", `${ref}^{commit}`])
  if (!isOid(commit)) throw new TypeError("LEAN_SOURCE_COMMIT_INVALID")
  return commit
}
export const renderLeanManifest = (repoRoot: string, sourceRef: string): LeanManifest => {
  const commit = resolveCommit(repoRoot, sourceRef)
  const tree = git(repoRoot, ["show", "-s", "--format=%T", commit])
  const executableBlobs = Object.fromEntries(LEAN_EXECUTABLE_CLOSURE_PATHS.map((sourcePath) => [sourcePath, git(repoRoot, ["rev-parse", `${commit}:${sourcePath}`])]))
  return createLeanManifest({ commit, tree, executableBlobs })
}
export const checkLeanManifest = (repoRoot: string, rawManifest: unknown): LeanManifest => {
  const manifest = validateLeanManifest(rawManifest)
  checkHistoricalLeanReviewHistory(repoRoot)
  execFileSync("git", ["merge-base", "--is-ancestor", manifest.source.commit, "HEAD"], { cwd: repoRoot, stdio: "ignore" })
  const paths = Object.keys(manifest.source.executableBlobs)
  if (paths.length !== LEAN_EXECUTABLE_CLOSURE_PATHS.length || paths.some((entry) => !LEAN_EXECUTABLE_CLOSURE_PATHS.includes(entry as never))) throw new TypeError("LEAN_EXECUTABLE_CLOSURE_DRIFT")
  for (const sourcePath of LEAN_EXECUTABLE_CLOSURE_PATHS) {
    const expectedOid = manifest.source.executableBlobs[sourcePath]
    if (git(repoRoot, ["rev-parse", `${manifest.source.commit}:${sourcePath}`]) !== expectedOid || git(repoRoot, ["rev-parse", `HEAD:${sourcePath}`]) !== expectedOid) throw new TypeError(`LEAN_SOURCE_BLOB_DRIFT:${sourcePath}`)
  }
  if (JSON.stringify(renderLeanManifest(repoRoot, manifest.source.commit)) !== JSON.stringify(manifest)) throw new TypeError("LEAN_MANIFEST_DRIFT")
  return manifest
}

export const checkLeanSourceReview = (manifest: LeanManifest, value: unknown): LeanSourceReview => {
  assertPrivacySafe(value)
  const findingValid = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.trim().length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  const findingIds = isObject(value) && Array.isArray(value.findings) ? value.findings.map((finding) => isObject(finding) ? finding.id : undefined) : []
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-source-review-v3" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(findingValid) || new Set(findingIds).size !== findingIds.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_SOURCE_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanSourceReview
}
export const renderLeanSourceReviewV3 = (
  manifest: LeanManifest,
  findings: readonly LeanReviewFinding[],
): LeanSourceReview => checkLeanSourceReview(manifest, {
  schemaVersion: "v1.38-lean-runner-source-review-v3",
  sourceCommit: manifest.source.commit,
  manifestRoot: hashLeanValue(manifest),
  findingCount: findings.length,
  findings,
  admitsExecution: false,
  authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanReadiness = (manifest: LeanManifest, reviewValue: unknown, value: unknown): LeanReadiness => {
  assertPrivacySafe(value)
  const review = checkLeanSourceReview(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan151Eligible", "liveInvocationLimit", "liveInvocationsConsumed", "correctiveRerunAuthorized", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-readiness-v3" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan151Eligible !== true || value.liveInvocationLimit !== 1 || value.liveInvocationsConsumed !== 0 || value.correctiveRerunAuthorized !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_READINESS_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanReadiness
}
export const renderLeanReadinessV3 = (manifest: LeanManifest, reviewValue: unknown): LeanReadiness => {
  const review = checkLeanSourceReview(manifest, reviewValue)
  return checkLeanReadiness(manifest, review, {
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
}
export const checkLeanReviewOutcome = (
  manifest: LeanManifest,
  reviewValue: unknown,
  readinessValue: unknown | undefined,
): LeanReadiness | undefined => {
  const review = checkLeanSourceReview(manifest, reviewValue)
  if (review.findingCount !== 0) {
    if (readinessValue !== undefined) throw new TypeError("LEAN_READINESS_FOR_NONZERO_REVIEW")
    return undefined
  }
  if (readinessValue === undefined) throw new TypeError("LEAN_LITERAL_ZERO_READINESS_MISSING")
  return checkLeanReadiness(manifest, review, readinessValue)
}

export const renderLeanCorrectiveManifest = renderLeanManifest
export const checkLeanCorrectiveManifest = checkLeanManifest
export const checkLeanCorrectiveSourceReview = (manifest: LeanManifest, value: unknown): LeanCorrectiveSourceReview => {
  assertPrivacySafe(value)
  const findingValid = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.trim().length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  const ids = isObject(value) && Array.isArray(value.findings) ? value.findings.map((finding) => isObject(finding) ? finding.id : undefined) : []
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v1" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(findingValid) || new Set(ids).size !== ids.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReview
}
export const renderLeanCorrectiveSourceReview = (manifest: LeanManifest, findings: readonly LeanReviewFinding[]): LeanCorrectiveSourceReview => checkLeanCorrectiveSourceReview(manifest, {
  schemaVersion: "v1.38-lean-runner-corrective-source-review-v1",
  sourceCommit: manifest.source.commit,
  manifestRoot: hashLeanValue(manifest),
  findingCount: findings.length,
  findings,
  admitsExecution: false,
  authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanCorrectiveReadiness = (manifest: LeanManifest, reviewValue: unknown, value: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReview(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan158Eligible", "correctiveInvocationLimit", "correctiveInvocationsConsumed", "recoveryOnlyLimit", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-readiness-v1" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan158Eligible !== true || value.correctiveInvocationLimit !== 1 || value.correctiveInvocationsConsumed !== 0 || value.recoveryOnlyLimit !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_READINESS_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveReadiness
}
export const renderLeanCorrectiveReadiness = (manifest: LeanManifest, reviewValue: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReview(manifest, reviewValue)
  return checkLeanCorrectiveReadiness(manifest, review, {
    schemaVersion: "v1.38-lean-runner-corrective-readiness-v1",
    sourceCommit: manifest.source.commit,
    manifestRoot: hashLeanValue(manifest),
    sourceReviewRoot: hashLeanValue(review),
    findingCount: 0,
    plan158Eligible: true,
    correctiveInvocationLimit: 1,
    correctiveInvocationsConsumed: 0,
    recoveryOnlyLimit: 1,
    authority: LEAN_AUTHORITY_FALSE,
  })
}

type LeanCorrectiveManifestV2 = Record<string, unknown> & { source: { commit: string, tree: string, executableBlobs: Record<string, string> } }
export const checkLeanCorrectiveManifestV2 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV2 => {
  assertPrivacySafe(value)
  const topKeys = ["schemaVersion", "claimClass", "source", "reviewClosure", "immutableRoots", "selectedTuple", "fixtures", "arenas", "formation", "scheduleRoot", "runtimeLimitsRoot", "normalization", "deadlineMilliseconds", "historicalFullMatrix", "freshCorrectiveEffects", "successorLockCount", "formationMaterialized", "authority"]
  if (!isObject(value) || !exactKeys(value, topKeys) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v2" || value.claimClass !== "fixture_feasibility_only" || !isObject(value.source) || !exactKeys(value.source, ["commit", "tree", "executableBlobs"]) || !isOid(value.source.commit) || !isOid(value.source.tree) || !isObject(value.source.executableBlobs)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_INVALID")
  const blobs = value.source.executableBlobs
  if (!exactKeys(blobs, LEAN_EXECUTABLE_CLOSURE_PATHS) || git(repoRoot, ["show", "-s", "--format=%T", value.source.commit]) !== value.source.tree) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_SOURCE_DRIFT")
  for (const sourcePath of LEAN_EXECUTABLE_CLOSURE_PATHS) if (git(repoRoot, ["rev-parse", `${value.source.commit}:${sourcePath}`]) !== blobs[sourcePath]) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_SOURCE_DRIFT")
  if (!isObject(value.reviewClosure) || !exactKeys(value.reviewClosure, ["plan163SummaryCommit", "plan163SummaryBlob", "plan157ReviewBlob", "failedManifestV1Root", "failedReviewV1Root", "closedFindingIds"]) || value.reviewClosure.failedManifestV1Root !== hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.manifest)) || value.reviewClosure.failedReviewV1Root !== hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.sourceReview))) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_REVIEW_DRIFT")
  if (!isObject(value.immutableRoots) || !exactKeys(value.immutableRoots, ["d34lContractRoot", "firstInvocationRoot", "firstTerminalRoot", "diagnosticCustodyRoot"]) || value.immutableRoots.firstInvocationRoot !== hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)) || value.immutableRoots.firstTerminalRoot !== hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)) || value.immutableRoots.diagnosticCustodyRoot !== hashLeanValue(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_ROOT_DRIFT")
  if (!isObject(value.freshCorrectiveEffects) || !exactKeys(value.freshCorrectiveEffects, ["readinessV2Present", "invocationV2Present", "terminalV2Present", "adjudicationV2Present", "eligibilityV2Present", "childOwnershipPresent"]) || Object.values(value.freshCorrectiveEffects).some((present) => present !== false) || value.successorLockCount !== 36 || value.formationMaterialized !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V2_EFFECT_DRIFT")
  assertSuccessorLockInventory(repoRoot)
  return globalThis.structuredClone(value) as LeanCorrectiveManifestV2
}
export const checkLeanCorrectiveSourceReviewV2 = (manifest: LeanCorrectiveManifestV2, value: unknown): LeanCorrectiveSourceReviewV3 => {
  assertPrivacySafe(value)
  const findingValid = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "manifestRoot", "findingCount", "findings", "plan157FindingDisposition", "verification", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v2" || value.sourceCommit !== manifest.source.commit || value.sourceTree !== manifest.source.tree || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) <= 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(findingValid) || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_V2_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReviewV3
}
export const checkLeanCorrectiveReviewOutcomeV2 = (manifest: LeanCorrectiveManifestV2, reviewValue: unknown, readinessValue: unknown | undefined): undefined => {
  const review = checkLeanCorrectiveSourceReviewV2(manifest, reviewValue)
  if (review.findingCount === 0) throw new TypeError("LEAN_CORRECTIVE_V2_HISTORY_MUST_FAIL")
  if (readinessValue !== undefined) throw new TypeError("LEAN_CORRECTIVE_READINESS_FOR_NONZERO_REVIEW")
  return undefined
}

export const renderLeanCorrectiveManifestV3 = (repoRoot: string, sourceRef: string): LeanCorrectiveManifestV3 => {
  const base = renderLeanManifest(repoRoot, sourceRef)
  const manifest = {
    ...base,
    schemaVersion: "v1.38-lean-runner-corrective-source-manifest-v3",
    predecessorRoots: {
      failedManifestV1Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.manifest)),
      failedReviewV1Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V1_ARTIFACT_PATHS.sourceReview)),
      failedManifestV2Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest)),
      failedReviewV2Root: hashLeanValue(readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.sourceReview)),
      firstInvocationRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)),
      firstTerminalRoot: hashLeanValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)),
      diagnosticCustodyRoot: hashLeanValue(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH)),
    },
    successorLockCount: 36,
    freshCorrectiveEffects: {
      readinessV3Present: false, invocationV2Present: false, terminalV2Present: false,
      adjudicationV2Present: false, eligibilityV2Present: false, childOwnershipPresent: false,
    },
  } as LeanCorrectiveManifestV3
  return manifest
}
export const checkLeanCorrectiveManifestV3 = (repoRoot: string, value: unknown): LeanCorrectiveManifestV3 => {
  assertPrivacySafe(value)
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-manifest-v3" || !isObject(value.source) || !isOid(value.source.commit)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V3_INVALID")
  const expected = renderLeanCorrectiveManifestV3(repoRoot, value.source.commit)
  if (JSON.stringify(value) !== JSON.stringify(expected)) throw new TypeError("LEAN_CORRECTIVE_MANIFEST_V3_DRIFT")
  assertSuccessorLockInventory(repoRoot)
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveManifestV3
}
export const renderLeanCorrectiveSourceReviewV3 = (manifest: LeanCorrectiveManifestV3, findings: readonly LeanReviewFinding[]): LeanCorrectiveSourceReviewV3 => checkLeanCorrectiveSourceReviewV3(manifest, {
  schemaVersion: "v1.38-lean-runner-corrective-source-review-v3", sourceCommit: manifest.source.commit,
  sourceTree: manifest.source.tree, manifestRoot: hashLeanValue(manifest), findingCount: findings.length,
  findings, admitsExecution: false, authority: LEAN_AUTHORITY_FALSE,
})
export const checkLeanCorrectiveSourceReviewV3 = (manifest: LeanCorrectiveManifestV3, value: unknown): LeanCorrectiveSourceReviewV3 => {
  assertPrivacySafe(value)
  const validFinding = (finding: unknown): boolean => isObject(finding) && exactKeys(finding, ["id", "severity", "status", "summary"]) && typeof finding.id === "string" && finding.id.length > 0 && ["critical", "warning"].includes(String(finding.severity)) && finding.status === "open" && typeof finding.summary === "string" && finding.summary.length > 0
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-source-review-v3" || value.sourceCommit !== manifest.source.commit || value.sourceTree !== manifest.source.tree || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || !value.findings.every(validFinding) || new Set(value.findings.map((finding) => (finding as Record<string, unknown>).id)).size !== value.findings.length || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_SOURCE_REVIEW_V3_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveSourceReviewV3
}
export const checkLeanCorrectiveReadinessV3 = (manifest: LeanCorrectiveManifestV3, reviewValue: unknown, value: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV3(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan158Eligible", "correctiveInvocationLimit", "correctiveInvocationsConsumed", "recoveryOnlyLimit", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-corrective-readiness-v3" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan158Eligible !== true || value.correctiveInvocationLimit !== 1 || value.correctiveInvocationsConsumed !== 0 || value.recoveryOnlyLimit !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_READINESS_V3_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveReadiness
}
export const renderLeanCorrectiveReadinessV3 = (manifest: LeanCorrectiveManifestV3, reviewValue: unknown): LeanCorrectiveReadiness => {
  const review = checkLeanCorrectiveSourceReviewV3(manifest, reviewValue)
  return checkLeanCorrectiveReadinessV3(manifest, review, { schemaVersion: "v1.38-lean-runner-corrective-readiness-v3", sourceCommit: manifest.source.commit, manifestRoot: hashLeanValue(manifest), sourceReviewRoot: hashLeanValue(review), findingCount: 0, plan158Eligible: true, correctiveInvocationLimit: 1, correctiveInvocationsConsumed: 0, recoveryOnlyLimit: 1, authority: LEAN_AUTHORITY_FALSE })
}
export const loadAndCheckLeanCorrectiveReady = (
  repoRoot: string,
  allowedOperationalPaths: readonly string[] = [],
): LeanCorrectiveReadiness => {
  assertLeanCorrectiveAdmissionStatus(
    git(repoRoot, ["status", "--short", "--untracked-files=all"]),
    allowedOperationalPaths,
  )
  checkLeanFirstEvidenceCustody(repoRoot)
  validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  assertSuccessorLockInventory(repoRoot)
  const manifest = checkLeanCorrectiveManifestV3(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest))
  const readiness = checkLeanCorrectiveReadinessV3(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.sourceReview), readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.readiness))
  assertLeanCorrectiveTrackedBytes(repoRoot, readiness.sourceCommit)
  return readiness
}

export const createLeanCorrectiveInvocation = (readiness: LeanCorrectiveReadiness, childCapabilityRoot: `sha256:${string}`, diagnosticCustody: LeanDiagnosticCustody, firstInvocation: unknown, firstTerminal: unknown): LeanCorrectiveInvocation => validateLeanCorrectiveInvocation({
  schemaVersion: "v1.38-lean-runner-corrective-invocation-v2",
  sourceCommit: readiness.sourceCommit,
  manifestRoot: readiness.manifestRoot,
  sourceReviewRoot: readiness.sourceReviewRoot,
  readinessRoot: hashLeanValue(readiness),
  firstInvocationRoot: hashLeanValue(firstInvocation),
  firstTerminalRoot: hashLeanValue(firstTerminal),
  diagnosticCustodyRoot: hashLeanValue(diagnosticCustody),
  childCapabilityRoot,
  claimClass: "fixture_feasibility_only",
  correctiveInvocationOrdinal: 1,
  authority: LEAN_AUTHORITY_FALSE,
})
export const prepareLeanCorrectiveInvocation = (repoRoot: string, childCapabilityRoot: `sha256:${string}`): LeanCorrectiveInvocation => {
  assertLeanCorrectiveFreshEffectsAbsent(
    existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)),
    existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)),
  )
  return createLeanCorrectiveInvocation(
    loadAndCheckLeanCorrectiveReady(repoRoot),
    childCapabilityRoot,
    validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH)),
    readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation),
    readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal),
  )
}
export const checkLeanCorrectiveLaunchAdmission = (repoRoot: string): LeanCorrectiveReadiness => {
  const marker = LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation
  const terminal = LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal
  if (!existsSync(path.resolve(repoRoot, marker))) throw new TypeError("LEAN_CORRECTIVE_MARKER_REQUIRED")
  if (existsSync(path.resolve(repoRoot, terminal))) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
  return loadAndCheckLeanCorrectiveReady(repoRoot, [marker])
}
export const validateLeanCorrectiveInvocation = (value: unknown): LeanCorrectiveInvocation => {
  const keys = ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "firstInvocationRoot", "firstTerminalRoot", "diagnosticCustodyRoot", "childCapabilityRoot", "claimClass", "correctiveInvocationOrdinal", "authority"]
  if (!isObject(value) || !exactKeys(value, keys) || value.schemaVersion !== "v1.38-lean-runner-corrective-invocation-v2" || !isOid(value.sourceCommit) || ![value.manifestRoot, value.sourceReviewRoot, value.readinessRoot, value.firstInvocationRoot, value.firstTerminalRoot, value.diagnosticCustodyRoot, value.childCapabilityRoot].every(isSha) || value.claimClass !== "fixture_feasibility_only" || value.correctiveInvocationOrdinal !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_INVOCATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveInvocation
}
export const validateLeanCorrectiveInvocationLineage = (repoRoot: string, readiness: LeanCorrectiveReadiness, value: unknown): LeanCorrectiveInvocation => {
  const invocation = validateLeanCorrectiveInvocation(value)
  const custody = validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
  const firstInvocation = readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation)
  const firstTerminal = readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal)
  if (invocation.sourceCommit !== readiness.sourceCommit || invocation.manifestRoot !== readiness.manifestRoot || invocation.sourceReviewRoot !== readiness.sourceReviewRoot || invocation.readinessRoot !== hashLeanValue(readiness) || invocation.firstInvocationRoot !== hashLeanValue(firstInvocation) || invocation.firstTerminalRoot !== hashLeanValue(firstTerminal) || invocation.diagnosticCustodyRoot !== hashLeanValue(custody)) throw new TypeError("LEAN_CORRECTIVE_INVOCATION_LINEAGE_MISMATCH")
  return invocation
}

const assertForbiddenScopeAbsent = (repoRoot: string, allowed: readonly string[]): void => {
  for (const artifactPath of Object.values(LEAN_ARTIFACT_PATHS)) if (!allowed.includes(artifactPath) && existsSync(path.resolve(repoRoot, artifactPath))) throw new TypeError(`LEAN_FORBIDDEN_ARTIFACT:${artifactPath}`)
  const forbidden = git(repoRoot, ["ls-files"]).split("\n").filter((file) => /v1\.38-(?:full-inward|edge-anchored-bracket|formation-profile|sealed-holdout|candidate-search)/u.test(file))
  if (forbidden.length > 0) throw new TypeError(`LEAN_FORBIDDEN_SCOPE:${forbidden.join(",")}`)
}
export const checkLeanSourcePreconditions = (repoRoot: string): void => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]))
  assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest])
}
export const loadAndCheckLeanReviewedReady = (
  repoRoot: string,
  allowedUntracked: readonly string[] = [],
  allowedArtifacts: readonly string[] = [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness],
): LeanReadiness => {
  assertLeanStatus(git(repoRoot, ["status", "--short", "--untracked-files=all"]), allowedUntracked)
  assertForbiddenScopeAbsent(repoRoot, allowedArtifacts)
  const manifest = checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest))
  return checkLeanReadiness(manifest, readJson(repoRoot, LEAN_ARTIFACT_PATHS.sourceReview), readJson(repoRoot, LEAN_ARTIFACT_PATHS.readiness))
}

const checkTerminalValue = (value: unknown): LeanTerminal => deriveAndValidateLeanTerminal(value)

export const createLeanInterruptedTerminal = (): LeanTerminal => reduceLeanExecutions(
  buildLeanSchedule().map((cell, ordinal) => ({
    ...cell,
    classification: "unlaunched" as const,
    cleanupComplete: true,
    orphanedChild: false,
    boardRealism: currentFormationIsRealistic(cell),
    integrityValid: ordinal !== 0,
  })),
)

export const createLeanInvocation = (readiness: LeanReadiness, childCapabilityRoot: `sha256:${string}`): LeanInvocation => validateLeanInvocation({
  schemaVersion: "v1.38-lean-runner-invocation-v1",
  sourceCommit: readiness.sourceCommit,
  manifestRoot: readiness.manifestRoot,
  sourceReviewRoot: readiness.sourceReviewRoot,
  readinessRoot: hashLeanValue(readiness),
  childCapabilityRoot,
  claimClass: "fixture_feasibility_only",
  liveInvocationOrdinal: 1,
  authority: LEAN_AUTHORITY_FALSE,
})

export const validateLeanInvocation = (value: unknown): LeanInvocation => {
  assertPrivacySafe(value)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "childCapabilityRoot", "claimClass", "liveInvocationOrdinal", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-invocation-v1" || !isOid(value.sourceCommit) || !isSha(value.manifestRoot) || !isSha(value.sourceReviewRoot) || !isSha(value.readinessRoot) || !isSha(value.childCapabilityRoot) || value.claimClass !== "fixture_feasibility_only" || value.liveInvocationOrdinal !== 1 || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_INVOCATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanInvocation
}

export const validateLeanInvocationLineage = (readiness: LeanReadiness, value: unknown): LeanInvocation => {
  const invocation = validateLeanInvocation(value)
  if (
    invocation.sourceCommit !== readiness.sourceCommit ||
    invocation.manifestRoot !== readiness.manifestRoot ||
    invocation.sourceReviewRoot !== readiness.sourceReviewRoot ||
    invocation.readinessRoot !== hashLeanValue(readiness)
  ) throw new TypeError("LEAN_INVOCATION_LINEAGE_MISMATCH")
  return invocation
}

export const loadAndCheckLeanChildInvocation = (repoRoot: string, capability: string, ownershipToken?: string): LeanInvocation | LeanCorrectiveInvocation => {
  if (existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))) {
    if (existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal))) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
    const readiness = loadAndCheckLeanCorrectiveReady(repoRoot, [LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH])
    const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))
    if (invocation.childCapabilityRoot !== hashLeanValue(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
    const ownership = validateLeanCorrectiveChildOwnership(readJson(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH))
    if (
      ownershipToken === undefined || ownership.token !== ownershipToken ||
      ownership.invocationRoot !== hashLeanValue(invocation) || ownership.childPid !== process.pid ||
      process.argv[2] !== ownership.selector || process.argv[3] !== ownership.token
    ) throw new TypeError("LEAN_CORRECTIVE_CHILD_IDENTITY_MISMATCH")
    return invocation
  }
  const readiness = loadAndCheckLeanReviewedReady(
    repoRoot,
    [LEAN_ARTIFACT_PATHS.invocation],
    [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation],
  )
  const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
  if (invocation.childCapabilityRoot !== hashLeanValue(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
  return invocation
}

export const createLeanTerminalArtifact = (invocation: LeanInvocation, terminal: LeanTerminal): LeanTerminalArtifact => validateLeanTerminalArtifact({
  schemaVersion: "v1.38-lean-runner-terminal-v1",
  sourceCommit: invocation.sourceCommit,
  manifestRoot: invocation.manifestRoot,
  sourceReviewRoot: invocation.sourceReviewRoot,
  readinessRoot: invocation.readinessRoot,
  childCapabilityRoot: invocation.childCapabilityRoot,
  invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only",
  terminal,
  authority: LEAN_AUTHORITY_FALSE,
}, invocation)

export const validateLeanTerminalArtifact = (value: unknown, invocationValue: unknown): LeanTerminalArtifact => {
  assertPrivacySafe(value)
  const invocation = validateLeanInvocation(invocationValue)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "childCapabilityRoot", "invocationRoot", "privacy", "terminal", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-terminal-v1" || value.sourceCommit !== invocation.sourceCommit || value.manifestRoot !== invocation.manifestRoot || value.sourceReviewRoot !== invocation.sourceReviewRoot || value.readinessRoot !== invocation.readinessRoot || value.childCapabilityRoot !== invocation.childCapabilityRoot || value.invocationRoot !== hashLeanValue(invocation) || value.privacy !== "safe_aggregate_only" || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_TERMINAL_ARTIFACT_INVALID")
  return { ...(globalThis.structuredClone(value) as Omit<LeanTerminalArtifact, "terminal">), terminal: checkTerminalValue(value.terminal) }
}

export const createLeanCorrectiveTerminalArtifact = (invocation: LeanCorrectiveInvocation, terminal: LeanTerminal, recoveryTerminalized = false): LeanCorrectiveTerminalArtifact => validateLeanCorrectiveTerminalArtifact({
  schemaVersion: "v1.38-lean-runner-corrective-terminal-v2",
  sourceCommit: invocation.sourceCommit,
  manifestRoot: invocation.manifestRoot,
  sourceReviewRoot: invocation.sourceReviewRoot,
  readinessRoot: invocation.readinessRoot,
  firstInvocationRoot: invocation.firstInvocationRoot,
  firstTerminalRoot: invocation.firstTerminalRoot,
  diagnosticCustodyRoot: invocation.diagnosticCustodyRoot,
  childCapabilityRoot: invocation.childCapabilityRoot,
  invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only",
  recoveryTerminalized,
  terminal,
  authority: LEAN_AUTHORITY_FALSE,
}, invocation)
export const validateLeanCorrectiveTerminalArtifact = (value: unknown, invocationValue: unknown): LeanCorrectiveTerminalArtifact => {
  const invocation = validateLeanCorrectiveInvocation(invocationValue)
  const keys = ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "firstInvocationRoot", "firstTerminalRoot", "diagnosticCustodyRoot", "childCapabilityRoot", "invocationRoot", "privacy", "recoveryTerminalized", "terminal", "authority"]
  if (!isObject(value) || !exactKeys(value, keys) || value.schemaVersion !== "v1.38-lean-runner-corrective-terminal-v2" || value.sourceCommit !== invocation.sourceCommit || value.manifestRoot !== invocation.manifestRoot || value.sourceReviewRoot !== invocation.sourceReviewRoot || value.readinessRoot !== invocation.readinessRoot || value.firstInvocationRoot !== invocation.firstInvocationRoot || value.firstTerminalRoot !== invocation.firstTerminalRoot || value.diagnosticCustodyRoot !== invocation.diagnosticCustodyRoot || value.childCapabilityRoot !== invocation.childCapabilityRoot || value.invocationRoot !== hashLeanValue(invocation) || value.privacy !== "safe_aggregate_only" || typeof value.recoveryTerminalized !== "boolean" || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_INVALID")
  const terminal = checkTerminalValue(value.terminal)
  if (value.recoveryTerminalized && terminal.result !== "invalid") throw new TypeError("LEAN_CORRECTIVE_RECOVERY_TERMINAL_INVALID")
  return { ...(globalThis.structuredClone(value) as Omit<LeanCorrectiveTerminalArtifact, "terminal">), terminal }
}

export const createLeanCorrectiveInterruptionTombstone = (invocation: LeanCorrectiveInvocation): LeanCorrectiveInterruptionTombstone => validateLeanCorrectiveInterruptionTombstone({
  schemaVersion: "v1.38-lean-runner-corrective-interruption-tombstone-v1",
  sourceCommit: invocation.sourceCommit,
  manifestRoot: invocation.manifestRoot,
  sourceReviewRoot: invocation.sourceReviewRoot,
  readinessRoot: invocation.readinessRoot,
  firstInvocationRoot: invocation.firstInvocationRoot,
  firstTerminalRoot: invocation.firstTerminalRoot,
  diagnosticCustodyRoot: invocation.diagnosticCustodyRoot,
  childCapabilityRoot: invocation.childCapabilityRoot,
  invocationRoot: hashLeanValue(invocation),
  result: "invalid",
  recoveryTerminalized: true,
  chargedMatches: 0,
  successfulMatches: 0,
  completeCleanup: true,
  formationMaterialized: false,
  privacy: "safe_aggregate_only",
  authority: LEAN_AUTHORITY_FALSE,
}, invocation)
export const validateLeanCorrectiveInterruptionTombstone = (value: unknown, invocationValue: unknown): LeanCorrectiveInterruptionTombstone => {
  assertPrivacySafe(value)
  const invocation = validateLeanCorrectiveInvocation(invocationValue)
  const keys = ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "firstInvocationRoot", "firstTerminalRoot", "diagnosticCustodyRoot", "childCapabilityRoot", "invocationRoot", "result", "recoveryTerminalized", "chargedMatches", "successfulMatches", "completeCleanup", "formationMaterialized", "privacy", "authority"]
  if (!isObject(value) || !exactKeys(value, keys) || value.schemaVersion !== "v1.38-lean-runner-corrective-interruption-tombstone-v1" || value.sourceCommit !== invocation.sourceCommit || value.manifestRoot !== invocation.manifestRoot || value.sourceReviewRoot !== invocation.sourceReviewRoot || value.readinessRoot !== invocation.readinessRoot || value.firstInvocationRoot !== invocation.firstInvocationRoot || value.firstTerminalRoot !== invocation.firstTerminalRoot || value.diagnosticCustodyRoot !== invocation.diagnosticCustodyRoot || value.childCapabilityRoot !== invocation.childCapabilityRoot || value.invocationRoot !== hashLeanValue(invocation) || value.result !== "invalid" || value.recoveryTerminalized !== true || value.chargedMatches !== 0 || value.successfulMatches !== 0 || value.completeCleanup !== true || value.formationMaterialized !== false || value.privacy !== "safe_aggregate_only" || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_CORRECTIVE_INTERRUPTION_TOMBSTONE_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveInterruptionTombstone
}

export const validateLeanAdjudication = (value: unknown, terminalValue: unknown): LeanAdjudication => {
  assertPrivacySafe(value)
  if (!isObject(terminalValue)) throw new TypeError("LEAN_ADJUDICATION_INVALID")
  const terminal = terminalValue as unknown as LeanTerminalArtifact
  const rederived = checkTerminalValue(terminal.terminal)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "terminalRoot", "reviewedResult", "findingCount", "findings", "admitsEligibility", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-adjudication-v1" || value.terminalRoot !== hashLeanValue(terminal) || value.reviewedResult !== rederived.result || value.findingCount !== 0 || !Array.isArray(value.findings) || value.findings.length !== 0 || value.admitsEligibility !== (rederived.result === "pass") || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_ADJUDICATION_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanAdjudication
}

export const validateLeanEligibility = (value: unknown, adjudicationValue: unknown): LeanEligibility => {
  assertPrivacySafe(value)
  if (!isObject(adjudicationValue)) throw new TypeError("LEAN_ELIGIBILITY_INVALID")
  const adjudication = adjudicationValue as unknown as LeanAdjudication
  const passed = adjudication.reviewedResult === "pass" && adjudication.admitsEligibility
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "adjudicationRoot", "admit03", "phase262Complete", "phase263PlanningEligible", "phase263ExecutionEligible", "authority"]) || value.schemaVersion !== "v1.38-phase-262-lean-eligibility-v1" || value.adjudicationRoot !== hashLeanValue(adjudication) || value.admit03 !== (passed ? "satisfied_under_revised_contract" : "blocked") || value.phase262Complete !== passed || value.phase263PlanningEligible !== passed || value.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(value.authority, passed)) throw new TypeError("LEAN_ELIGIBILITY_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanEligibility
}

const TRACKING_MARKERS = Object.freeze({
  ".planning/ROADMAP.md": { marker: "phase-262-lean-roadmap-tracking", surface: "roadmap" },
  ".planning/STATE.md": { marker: "phase-262-lean-state-tracking", surface: "state" },
  ".planning/v1.38-CURRENT-STATUS.md": { marker: "phase-262-lean-current-status-tracking", surface: "current_status" },
  ".planning/v1.38-v1.38-MILESTONE-AUDIT.md": { marker: "phase-262-lean-milestone-audit-tracking", surface: "milestone_audit" },
} as const)
type StructuredTrackingPath = keyof typeof TRACKING_MARKERS
type TrackingPath = StructuredTrackingPath | ".planning/REQUIREMENTS.md"
interface LeanTrackingCarrier {
  readonly schemaVersion: "v1.38-phase-262-lean-final-tracking-v1"
  readonly surface: (typeof TRACKING_MARKERS)[StructuredTrackingPath]["surface"]
  readonly admit03: LeanEligibility["admit03"]
  readonly phase262Complete: boolean
  readonly phase263PlanningEligible: boolean
  readonly phase263ExecutionEligible: boolean
  readonly authority: LeanEligibility["authority"]
}
export const parseLeanTrackingSurface = (
  trackingPath: TrackingPath,
  body: string,
): Pick<LeanEligibility, "admit03"> | LeanTrackingCarrier => {
  if (trackingPath === ".planning/REQUIREMENTS.md") {
    const rows = body.split("\n").filter((line) => /^- \[[ x]\] \*\*ADMIT-03\*\*:/u.test(line))
    if (rows.length !== 1) throw new TypeError("LEAN_TRACKING_AMBIGUOUS:requirements")
    return { admit03: rows[0]!.startsWith("- [x]") ? "satisfied_under_revised_contract" : "blocked" }
  }
  const descriptor = TRACKING_MARKERS[trackingPath]
  const escaped = descriptor.marker.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  const matches = [...body.matchAll(new RegExp(`<!-- ${escaped}: (\\{[^\\n]*\\}) -->`, "gu"))]
  if (matches.length !== 1) throw new TypeError(`LEAN_TRACKING_AMBIGUOUS:${descriptor.surface}`)
  let value: unknown
  try { value = JSON.parse(matches[0]![1]!) } catch { throw new TypeError(`LEAN_TRACKING_MALFORMED:${descriptor.surface}`) }
  const keys = ["schemaVersion", "surface", "admit03", "phase262Complete", "phase263PlanningEligible", "phase263ExecutionEligible", "authority"]
  if (!isObject(value) || !exactKeys(value, keys) || value.schemaVersion !== "v1.38-phase-262-lean-final-tracking-v1" || value.surface !== descriptor.surface || !["satisfied_under_revised_contract", "blocked"].includes(String(value.admit03))) throw new TypeError(`LEAN_TRACKING_INVALID:${descriptor.surface}`)
  const passed = value.admit03 === "satisfied_under_revised_contract"
  if (value.phase262Complete !== passed || value.phase263PlanningEligible !== passed || value.phase263ExecutionEligible !== passed || !exactEligibilityAuthority(value.authority, passed)) throw new TypeError(`LEAN_TRACKING_INVALID:${descriptor.surface}`)
  return globalThis.structuredClone(value) as unknown as LeanTrackingCarrier
}
export const renderLeanTrackingCarrier = (
  trackingPath: StructuredTrackingPath,
  eligibility: LeanEligibility,
): string => {
  const descriptor = TRACKING_MARKERS[trackingPath]
  const carrier: LeanTrackingCarrier = {
    schemaVersion: "v1.38-phase-262-lean-final-tracking-v1",
    surface: descriptor.surface,
    admit03: eligibility.admit03,
    phase262Complete: eligibility.phase262Complete,
    phase263PlanningEligible: eligibility.phase263PlanningEligible,
    phase263ExecutionEligible: eligibility.phase263ExecutionEligible,
    authority: eligibility.authority,
  }
  parseLeanTrackingSurface(trackingPath, `<!-- ${descriptor.marker}: ${JSON.stringify(carrier)} -->`)
  return `<!-- ${descriptor.marker}: ${JSON.stringify(carrier)} -->`
}
const writeExclusiveDurable = (target: string, value: unknown): void => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
    const bytes = Buffer.from(`${JSON.stringify(value)}\n`, "utf8")
    let offset = 0
    while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset)
    fsyncSync(descriptor); closeSync(descriptor); descriptor = undefined
    const parent = openSync(path.dirname(target), constants.O_RDONLY)
    try { fsyncSync(parent) } finally { closeSync(parent) }
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
}
export const createLeanCorrectiveChildOwnership = (
  invocationRoot: string,
  childPid: number,
  processGroupId: number,
  token: string,
): LeanCorrectiveChildOwnership => validateLeanCorrectiveChildOwnership({
  schemaVersion: "v1.38-lean-corrective-child-ownership-v1",
  invocationRoot,
  childPid,
  processGroupId,
  selector: "--execute-reviewed-cell",
  token,
  commandArguments: ["--execute-reviewed-cell", token],
})
export const validateLeanCorrectiveChildOwnership = (value: unknown): LeanCorrectiveChildOwnership => {
  const keys = ["schemaVersion", "invocationRoot", "childPid", "processGroupId", "selector", "token", "commandArguments"]
  if (
    !isObject(value) || !exactKeys(value, keys) ||
    value.schemaVersion !== "v1.38-lean-corrective-child-ownership-v1" || !isSha(value.invocationRoot) ||
    !Number.isSafeInteger(value.childPid) || (value.childPid as number) <= 1 ||
    !Number.isSafeInteger(value.processGroupId) || value.processGroupId !== value.childPid ||
    value.selector !== "--execute-reviewed-cell" || typeof value.token !== "string" || !/^[0-9a-f]{64}$/u.test(value.token) ||
    !Array.isArray(value.commandArguments) || value.commandArguments.length !== 2 ||
    value.commandArguments[0] !== value.selector || value.commandArguments[1] !== value.token
  ) throw new TypeError("LEAN_CORRECTIVE_CHILD_OWNERSHIP_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanCorrectiveChildOwnership
}
export const persistLeanCorrectiveChildOwnership = (
  repoRoot: string,
  invocation: LeanCorrectiveInvocation,
  childPid: number,
  processGroupId: number,
  token: string,
): void => {
  const ownership = createLeanCorrectiveChildOwnership(hashLeanValue(invocation), childPid, processGroupId, token)
  writeExclusiveDurable(path.resolve(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH), ownership)
}
export const clearLeanCorrectiveChildOwnership = (repoRoot: string, token: string): void => {
  const target = path.resolve(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH)
  const ownership = validateLeanCorrectiveChildOwnership(readJson(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH))
  if (ownership.token !== token) throw new TypeError("LEAN_CORRECTIVE_CHILD_IDENTITY_MISMATCH")
  unlinkSync(target)
  const parent = openSync(path.dirname(target), constants.O_RDONLY)
  try { fsyncSync(parent) } finally { closeSync(parent) }
}
const commandMatchesLeanCorrectiveOwnership = (command: string, ownership: LeanCorrectiveChildOwnership): boolean => {
  const words = command.trim().split(/\s+/u)
  const selectorIndex = words.indexOf(ownership.selector)
  return /(?:^|\/)run-v1-38-lean-runner-feasibility\.ts(?:\s|$)/u.test(command) &&
    selectorIndex >= 0 && words[selectorIndex + 1] === ownership.token &&
    words.filter((word) => word === ownership.selector).length === 1 &&
    words.filter((word) => word === ownership.token).length === 1
}
export const recoverLeanCorrectiveOrphanInjected = async (
  ownershipValue: unknown,
  dependencies: LeanCorrectiveOrphanRecoveryDependencies,
): Promise<void> => {
  const ownership = validateLeanCorrectiveChildOwnership(ownershipValue)
  if (ownership.invocationRoot !== dependencies.expectedInvocationRoot) throw new TypeError("LEAN_CORRECTIVE_CHILD_IDENTITY_MISMATCH")
  const command = dependencies.commandForPid(ownership.childPid)
  if (command === undefined || command.trim().length === 0 || !dependencies.processIsAlive(ownership.childPid)) throw new TypeError("LEAN_CORRECTIVE_CHILD_STALE")
  if (dependencies.processGroupForPid(ownership.childPid) !== ownership.processGroupId || !commandMatchesLeanCorrectiveOwnership(command, ownership)) throw new TypeError("LEAN_CORRECTIVE_CHILD_IDENTITY_MISMATCH")
  dependencies.signalProcessGroup(ownership.processGroupId, "SIGTERM")
  for (let attempt = 0; attempt < 20 && dependencies.processIsAlive(ownership.childPid); attempt += 1) await dependencies.wait(50)
  if (dependencies.processIsAlive(ownership.childPid)) {
    dependencies.signalProcessGroup(ownership.processGroupId, "SIGKILL")
    for (let attempt = 0; attempt < 20 && dependencies.processIsAlive(ownership.childPid); attempt += 1) await dependencies.wait(50)
  }
  if (dependencies.processIsAlive(ownership.childPid)) throw new TypeError("LEAN_CORRECTIVE_CHILD_EXIT_UNPROVED")
}
const processIsAlive = (pid: number): boolean => {
  try { process.kill(pid, 0); return true } catch (error) { return (error as NodeJS.ErrnoException).code === "EPERM" }
}
export const recoverLeanCorrectiveOrphan = async (repoRoot: string): Promise<void> => {
  const markerPath = LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation
  const terminalPath = LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal
  if (!existsSync(path.resolve(repoRoot, markerPath))) throw new TypeError("LEAN_CORRECTIVE_MARKER_REQUIRED")
  if (existsSync(path.resolve(repoRoot, terminalPath))) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
  const readiness = loadAndCheckLeanCorrectiveReady(repoRoot, [markerPath, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH])
  const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, markerPath))
  const ownership = validateLeanCorrectiveChildOwnership(readJson(repoRoot, LEAN_CORRECTIVE_CHILD_OWNERSHIP_PATH))
  await recoverLeanCorrectiveOrphanInjected(ownership, {
    expectedInvocationRoot: hashLeanValue(invocation),
    commandForPid: (pid) => {
      try { return execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" }).trim() || undefined } catch { return undefined }
    },
    processGroupForPid: (pid) => {
      try {
        const value = Number(execFileSync("ps", ["-p", String(pid), "-o", "pgid="], { encoding: "utf8" }).trim())
        return Number.isSafeInteger(value) && value > 1 ? value : undefined
      } catch { return undefined }
    },
    signalProcessGroup: (processGroupId, signal) => { process.kill(-processGroupId, signal) },
    processIsAlive,
    wait: async (milliseconds) => { await new Promise<void>((resolve) => setTimeout(resolve, milliseconds)) },
  })
  clearLeanCorrectiveChildOwnership(repoRoot, ownership.token)
}
export const assertNoLeanChildProcess = (): void => {
  const commands = execFileSync("ps", ["-axo", "command="], { encoding: "utf8" })
  if (commands.split("\n").some((command) => command.includes("run-v1-38-lean-runner-feasibility") && command.includes("--execute-reviewed-cell"))) throw new TypeError("LEAN_CHILD_STILL_ACTIVE")
}
export const createExclusiveLeanTerminal = (repoRoot: string, terminal: LeanTerminalArtifact): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.terminal), terminal)
export const createExclusiveLeanCorrectiveTerminal = (repoRoot: string, terminal: LeanCorrectiveTerminalArtifact | LeanCorrectiveInterruptionTombstone): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal), terminal)
export const terminalizeLeanCorrectiveInterruption = (repoRoot: string): void => {
  const markerPath = path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)
  const terminalPath = path.resolve(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)
  if (!existsSync(markerPath)) throw new TypeError("LEAN_CORRECTIVE_MARKER_REQUIRED")
  if (existsSync(terminalPath)) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
  assertNoLeanChildProcess()
  const readiness = loadAndCheckLeanCorrectiveReady(repoRoot, [LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation])
  const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))
  createExclusiveLeanCorrectiveTerminal(repoRoot, createLeanCorrectiveInterruptionTombstone(invocation))
}
export const checkLeanCorrectiveTerminal = (repoRoot: string): LeanCorrectiveTerminalArtifact | LeanCorrectiveInterruptionTombstone => {
  checkLeanFirstEvidenceCustody(repoRoot)
  assertSuccessorLockInventory(repoRoot)
  const readiness = loadAndCheckLeanCorrectiveReady(repoRoot, [LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal])
  const invocation = validateLeanCorrectiveInvocationLineage(repoRoot, readiness, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation))
  const rawTerminal = readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)
  const terminal = isObject(rawTerminal) && rawTerminal.schemaVersion === "v1.38-lean-runner-corrective-interruption-tombstone-v1"
    ? validateLeanCorrectiveInterruptionTombstone(rawTerminal, invocation)
    : validateLeanCorrectiveTerminalArtifact(rawTerminal, invocation)
  assertNoLeanChildProcess()
  if (!("terminal" in terminal ? terminal.terminal.completeCleanup : terminal.completeCleanup)) throw new TypeError("LEAN_CORRECTIVE_CLEANUP_INCOMPLETE")
  return terminal
}

const main = (): void => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const selector = process.argv[2]
  if (selector === "--render-manifest") { process.stdout.write(`${JSON.stringify(renderLeanManifest(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`); return }
  if (selector === "--check-manifest") { checkLeanSourcePreconditions(repoRoot); checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest)) }
  else if (selector === "--check-source-review") {
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview])
    const manifest = checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest)); checkLeanSourceReview(manifest, readJson(repoRoot, LEAN_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-review-outcome") {
    const readinessPresent = existsSync(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.readiness))
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, ...(readinessPresent ? [LEAN_ARTIFACT_PATHS.readiness] : [])])
    const manifest = checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest))
    checkLeanReviewOutcome(
      manifest,
      readJson(repoRoot, LEAN_ARTIFACT_PATHS.sourceReview),
      readinessPresent ? readJson(repoRoot, LEAN_ARTIFACT_PATHS.readiness) : undefined,
    )
  } else if (selector === "--check-reviewed-ready") { loadAndCheckLeanReviewedReady(repoRoot) }
  else if (selector === "--terminalize-interruption") {
    const readiness = loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation],
      [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation],
    )
    if (existsSync(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.terminal))) throw new TypeError("LEAN_TERMINAL_ALREADY_EXISTS")
    assertNoLeanChildProcess()
    const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    createExclusiveLeanTerminal(repoRoot, createLeanTerminalArtifact(invocation, createLeanInterruptedTerminal()))
  }
  else if (selector === "--check-terminal" || selector === "--check-post-run") {
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal])
    const readiness = loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal],
      [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal],
    )
    const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    if (selector === "--check-post-run") {
      assertNoLeanChildProcess()
      if (!terminal.terminal.completeCleanup) throw new TypeError("LEAN_CLEANUP_INCOMPLETE")
    }
  } else if (selector === "--check-adjudication" || selector === "--check-eligibility") {
    assertForbiddenScopeAbsent(repoRoot, Object.values(LEAN_ARTIFACT_PATHS))
    const readiness = loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal, LEAN_ARTIFACT_PATHS.adjudication, LEAN_ARTIFACT_PATHS.eligibility],
      Object.values(LEAN_ARTIFACT_PATHS),
    )
    const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    const adjudication = readJson(repoRoot, LEAN_ARTIFACT_PATHS.adjudication)
    const checked = validateLeanAdjudication(adjudication, terminal)
    validateLeanEligibility(readJson(repoRoot, LEAN_ARTIFACT_PATHS.eligibility), checked)
  } else if (selector === "--check-final-tracking") {
    const readiness = loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal, LEAN_ARTIFACT_PATHS.adjudication, LEAN_ARTIFACT_PATHS.eligibility],
      Object.values(LEAN_ARTIFACT_PATHS),
    )
    const invocation = validateLeanInvocationLineage(readiness, readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    const adjudication = validateLeanAdjudication(readJson(repoRoot, LEAN_ARTIFACT_PATHS.adjudication), terminal)
    const eligibility = validateLeanEligibility(readJson(repoRoot, LEAN_ARTIFACT_PATHS.eligibility), adjudication)
    for (const trackingPath of [".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/STATE.md", ".planning/v1.38-CURRENT-STATUS.md", ".planning/v1.38-v1.38-MILESTONE-AUDIT.md"]) {
      const body = readFileSync(path.resolve(repoRoot, trackingPath), "utf8")
      const tracking = parseLeanTrackingSurface(trackingPath as TrackingPath, body)
      if (tracking.admit03 !== eligibility.admit03) throw new TypeError(`LEAN_FINAL_TRACKING_DRIFT:${trackingPath}`)
      if (trackingPath !== ".planning/REQUIREMENTS.md" && hashLeanValue(tracking) !== hashLeanValue({
        schemaVersion: "v1.38-phase-262-lean-final-tracking-v1",
        surface: (TRACKING_MARKERS[trackingPath as StructuredTrackingPath]).surface,
        admit03: eligibility.admit03,
        phase262Complete: eligibility.phase262Complete,
        phase263PlanningEligible: eligibility.phase263PlanningEligible,
        phase263ExecutionEligible: eligibility.phase263ExecutionEligible,
        authority: eligibility.authority,
      })) throw new TypeError(`LEAN_FINAL_TRACKING_DRIFT:${trackingPath}`)
    }
  } else if (selector === "--render-corrective-manifest") {
    process.stdout.write(`${JSON.stringify(renderLeanCorrectiveManifest(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  } else if (selector === "--check-corrective-source-only") {
    checkLeanCorrectiveSourceOnly(repoRoot)
  } else if (selector === "--check-corrective-recovery-only-structure") {
    checkLeanCorrectiveRecoveryOnlyStructure(
      readFileSync(path.resolve(repoRoot, "scripts/run-v1-38-lean-runner-feasibility.ts"), "utf8"),
      readFileSync(path.resolve(repoRoot, "scripts/check-v1-38-lean-admission.ts"), "utf8"),
    )
  } else if (selector === "--check-corrective-source-review-v2") {
    const manifest = checkLeanCorrectiveManifestV2(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveReviewOutcomeV2(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.sourceReview), existsSync(path.resolve(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.readiness)) ? readJson(repoRoot, LEAN_CORRECTIVE_V2_ARTIFACT_PATHS.readiness) : undefined)
  } else if (selector === "--render-corrective-manifest-v3") {
    process.stdout.write(`${JSON.stringify(renderLeanCorrectiveManifestV3(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`)
    return
  } else if (selector === "--check-corrective-manifest-v3") {
    checkLeanCorrectiveManifestV3(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest))
  } else if (selector === "--check-corrective-source-review-v3") {
    const manifest = checkLeanCorrectiveManifestV3(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveSourceReviewV3(manifest, readJson(repoRoot, LEAN_CORRECTIVE_V3_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-corrective-reviewed-ready-v3") {
    loadAndCheckLeanCorrectiveReady(repoRoot)
  } else if (selector === "--check-corrective-source-review") {
    checkLeanFirstEvidenceCustody(repoRoot)
    validateLeanDiagnosticCustody(readJson(repoRoot, LEAN_DIAGNOSTIC_CUSTODY_PATH))
    const manifest = checkLeanCorrectiveManifest(repoRoot, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.manifest))
    checkLeanCorrectiveSourceReview(manifest, readJson(repoRoot, LEAN_CORRECTIVE_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-corrective-readiness") {
    loadAndCheckLeanCorrectiveReady(repoRoot)
    assertCorrectiveFreshDestinationsAbsent(repoRoot, [LEAN_CORRECTIVE_ARTIFACT_PATHS.manifest, LEAN_CORRECTIVE_ARTIFACT_PATHS.sourceReview, LEAN_CORRECTIVE_ARTIFACT_PATHS.readiness])
  } else if (selector === "--check-corrective-terminal-or-terminalized-invalid") {
    checkLeanCorrectiveTerminal(repoRoot)
  } else throw new TypeError("LEAN_CHECK_SELECTOR_INVALID")
  process.stdout.write(`${JSON.stringify({ ok: true, selector, liveInvocationCount: 0, authority: LEAN_AUTHORITY_FALSE })}\n`)
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "LEAN_CHECK_FAILED"}\n`); process.exitCode = 1 }
}
