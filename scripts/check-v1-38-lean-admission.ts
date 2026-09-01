import { execFileSync } from "node:child_process"
import { closeSync, constants, existsSync, fsyncSync, openSync, readFileSync, writeSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { LEAN_AUTHORITY_FALSE, buildLeanSchedule, createLeanManifest, currentFormationIsRealistic, hashLeanValue, reduceLeanExecutions, validateLeanManifest, type LeanManifest, type LeanTerminal } from "./lib/v1-38-lean-runner-feasibility.js"

export const LEAN_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-manifest.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-source-review-v1.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-readiness-v1.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-invocation-v1.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-terminal.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-adjudication-v1.json",
  eligibility: ".planning/artifacts/v1.38-phase-262-lean-eligibility-v1.json",
} as const)

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
  readonly schemaVersion: "v1.38-lean-runner-source-review-v1"
  readonly sourceCommit: string
  readonly manifestRoot: `sha256:${string}`
  readonly findingCount: number
  readonly findings: readonly unknown[]
  readonly admitsExecution: false
  readonly authority: typeof LEAN_AUTHORITY_FALSE
}
export interface LeanReadiness {
  readonly schemaVersion: "v1.38-lean-runner-readiness-v1"
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
export interface LeanTerminalArtifact extends Omit<LeanInvocation, "schemaVersion" | "liveInvocationOrdinal" | "claimClass" | "childCapabilityRoot"> {
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

export const assertLeanStatus = (status: string, allowedUntracked: readonly string[] = []): void => {
  const invalid = status.split("\n").filter(Boolean).filter((line) => !(line.startsWith("?? ") && (/^\.v138-successor-[0-9a-f]{64}\.lock$/u.test(line.slice(3)) || allowedUntracked.includes(line.slice(3)))))
  if (invalid.length > 0) throw new TypeError(`LEAN_WORKTREE_DIRTY:${invalid.join(",")}`)
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
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "findingCount", "findings", "admitsExecution", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-source-review-v1" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_SOURCE_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanSourceReview
}
export const checkLeanReadiness = (manifest: LeanManifest, reviewValue: unknown, value: unknown): LeanReadiness => {
  assertPrivacySafe(value)
  const review = checkLeanSourceReview(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "findingCount", "plan151Eligible", "liveInvocationLimit", "liveInvocationsConsumed", "correctiveRerunAuthorized", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-readiness-v1" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan151Eligible !== true || value.liveInvocationLimit !== 1 || value.liveInvocationsConsumed !== 0 || value.correctiveRerunAuthorized !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_READINESS_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanReadiness
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

const checkTerminalValue = (value: unknown): LeanTerminal => {
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "claimClass", "historicalFullMatrix", "schedule", "result", "counts", "determinism", "completeCleanup", "formationMaterialized", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-feasibility-v1" || value.claimClass !== "fixture_feasibility_only" || !["pass", "non_pass", "invalid"].includes(String(value.result)) || typeof value.completeCleanup !== "boolean" || value.formationMaterialized !== false || !exactFalseAuthority(value.authority) || !isObject(value.schedule) || !exactKeys(value.schedule, ["uniqueCells", "passes", "chargedExecutions"]) || value.schedule.uniqueCells !== 12 || value.schedule.passes !== 2 || value.schedule.chargedExecutions !== 24 || !isObject(value.counts) || !exactKeys(value.counts, ["success", "playerViolation", "systemFailure", "timeout", "cancelled", "unlaunched"]) || !Object.values(value.counts).every((count) => Number.isSafeInteger(count) && (count as number) >= 0) || Object.values(value.counts).reduce((sum, count) => sum + Number(count), 0) !== 24 || !isObject(value.determinism) || !exactKeys(value.determinism, ["comparedCells", "mismatchCount"]) || !Number.isSafeInteger(value.determinism.comparedCells) || !Number.isSafeInteger(value.determinism.mismatchCount) || !isObject(value.historicalFullMatrix) || !exactKeys(value.historicalFullMatrix, ["disposition", "freshAccepted", "requiredAccepted", "reinterpreted"]) || value.historicalFullMatrix.disposition !== "exhausted" || value.historicalFullMatrix.freshAccepted !== 0 || value.historicalFullMatrix.requiredAccepted !== 540 || value.historicalFullMatrix.reinterpreted !== false) throw new TypeError("LEAN_TERMINAL_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanTerminal
}

export const createLeanInterruptedTerminal = (): LeanTerminal => reduceLeanExecutions(
  buildLeanSchedule().map((cell) => ({
    ...cell,
    classification: "unlaunched" as const,
    cleanupComplete: true,
    orphanedChild: false,
    boardRealism: currentFormationIsRealistic(cell),
  })),
  true,
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

export const loadAndCheckLeanChildInvocation = (repoRoot: string, capability: string): LeanInvocation => {
  const readiness = loadAndCheckLeanReviewedReady(
    repoRoot,
    [LEAN_ARTIFACT_PATHS.invocation],
    [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation],
  )
  const invocation = validateLeanInvocation(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
  if (invocation.readinessRoot !== hashLeanValue(readiness) || invocation.childCapabilityRoot !== hashLeanValue(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
  return invocation
}

export const createLeanTerminalArtifact = (invocation: LeanInvocation, terminal: LeanTerminal): LeanTerminalArtifact => validateLeanTerminalArtifact({
  schemaVersion: "v1.38-lean-runner-terminal-v1",
  sourceCommit: invocation.sourceCommit,
  manifestRoot: invocation.manifestRoot,
  sourceReviewRoot: invocation.sourceReviewRoot,
  readinessRoot: invocation.readinessRoot,
  invocationRoot: hashLeanValue(invocation),
  privacy: "safe_aggregate_only",
  terminal,
  authority: LEAN_AUTHORITY_FALSE,
}, invocation)

export const validateLeanTerminalArtifact = (value: unknown, invocationValue: unknown): LeanTerminalArtifact => {
  assertPrivacySafe(value)
  const invocation = validateLeanInvocation(invocationValue)
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "sourceCommit", "manifestRoot", "sourceReviewRoot", "readinessRoot", "invocationRoot", "privacy", "terminal", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-terminal-v1" || value.sourceCommit !== invocation.sourceCommit || value.manifestRoot !== invocation.manifestRoot || value.sourceReviewRoot !== invocation.sourceReviewRoot || value.readinessRoot !== invocation.readinessRoot || value.invocationRoot !== hashLeanValue(invocation) || value.privacy !== "safe_aggregate_only" || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_TERMINAL_ARTIFACT_INVALID")
  return { ...(globalThis.structuredClone(value) as Omit<LeanTerminalArtifact, "terminal">), terminal: checkTerminalValue(value.terminal) }
}

export const validateLeanAdjudication = (value: unknown, terminalValue: unknown): LeanAdjudication => {
  assertPrivacySafe(value)
  if (!isObject(terminalValue)) throw new TypeError("LEAN_ADJUDICATION_INVALID")
  const terminal = terminalValue as unknown as LeanTerminalArtifact
  if (!isObject(value) || !exactKeys(value, ["schemaVersion", "terminalRoot", "reviewedResult", "findingCount", "findings", "admitsEligibility", "authority"]) || value.schemaVersion !== "v1.38-lean-runner-adjudication-v1" || value.terminalRoot !== hashLeanValue(terminal) || value.reviewedResult !== terminal.terminal.result || value.findingCount !== 0 || !Array.isArray(value.findings) || value.findings.length !== 0 || value.admitsEligibility !== (terminal.terminal.result === "pass") || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_ADJUDICATION_INVALID")
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
const assertNoLeanChildProcess = (): void => {
  const commands = execFileSync("ps", ["-axo", "command="], { encoding: "utf8" })
  if (commands.split("\n").some((command) => command.includes("run-v1-38-lean-runner-feasibility") && command.includes("--execute-reviewed-cell"))) throw new TypeError("LEAN_CHILD_STILL_ACTIVE")
}
export const createExclusiveLeanTerminal = (repoRoot: string, terminal: LeanTerminalArtifact): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.terminal), terminal)

const main = (): void => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const selector = process.argv[2]
  if (selector === "--render-manifest") { process.stdout.write(`${JSON.stringify(renderLeanManifest(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`); return }
  if (selector === "--check-manifest") { checkLeanSourcePreconditions(repoRoot); checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest)) }
  else if (selector === "--check-source-review") {
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview])
    const manifest = checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest)); checkLeanSourceReview(manifest, readJson(repoRoot, LEAN_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-reviewed-ready") { loadAndCheckLeanReviewedReady(repoRoot) }
  else if (selector === "--terminalize-interruption") {
    loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation],
      [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation],
    )
    if (existsSync(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.terminal))) throw new TypeError("LEAN_TERMINAL_ALREADY_EXISTS")
    assertNoLeanChildProcess()
    const invocation = validateLeanInvocation(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    createExclusiveLeanTerminal(repoRoot, createLeanTerminalArtifact(invocation, createLeanInterruptedTerminal()))
  }
  else if (selector === "--check-terminal" || selector === "--check-post-run") {
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal])
    loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal],
      [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal],
    )
    const invocation = validateLeanInvocation(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    if (selector === "--check-post-run" && !terminal.terminal.completeCleanup) throw new TypeError("LEAN_CLEANUP_INCOMPLETE")
  } else if (selector === "--check-adjudication" || selector === "--check-eligibility") {
    assertForbiddenScopeAbsent(repoRoot, Object.values(LEAN_ARTIFACT_PATHS))
    const invocation = validateLeanInvocation(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    const adjudication = readJson(repoRoot, LEAN_ARTIFACT_PATHS.adjudication)
    const checked = validateLeanAdjudication(adjudication, terminal)
    validateLeanEligibility(readJson(repoRoot, LEAN_ARTIFACT_PATHS.eligibility), checked)
  } else if (selector === "--check-final-tracking") {
    const invocation = validateLeanInvocation(readJson(repoRoot, LEAN_ARTIFACT_PATHS.invocation))
    const terminal = validateLeanTerminalArtifact(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal), invocation)
    const adjudication = validateLeanAdjudication(readJson(repoRoot, LEAN_ARTIFACT_PATHS.adjudication), terminal)
    const eligibility = validateLeanEligibility(readJson(repoRoot, LEAN_ARTIFACT_PATHS.eligibility), adjudication)
    const expected = eligibility.phase262Complete ? "satisfied_under_revised_contract" : "blocked"
    for (const trackingPath of [".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/STATE.md", ".planning/v1.38-CURRENT-STATUS.md", ".planning/v1.38-v1.38-MILESTONE-AUDIT.md"]) {
      const body = readFileSync(path.resolve(repoRoot, trackingPath), "utf8")
      if (!body.includes("ADMIT-03") || !body.includes(expected)) throw new TypeError(`LEAN_FINAL_TRACKING_DRIFT:${trackingPath}`)
    }
  } else throw new TypeError("LEAN_CHECK_SELECTOR_INVALID")
  process.stdout.write(`${JSON.stringify({ ok: true, selector, liveInvocationCount: 0, authority: LEAN_AUTHORITY_FALSE })}\n`)
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "LEAN_CHECK_FAILED"}\n`); process.exitCode = 1 }
}
