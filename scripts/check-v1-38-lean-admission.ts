import { execFileSync } from "node:child_process"
import { closeSync, constants, existsSync, fsyncSync, openSync, readFileSync, writeSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { LEAN_AUTHORITY_FALSE, createLeanManifest, hashLeanValue, reduceLeanExecutions, validateLeanManifest, type LeanManifest, type LeanTerminal } from "./lib/v1-38-lean-runner-feasibility.js"

export const LEAN_ARTIFACT_PATHS = Object.freeze({
  manifest: ".planning/artifacts/v1.38-lean-runner-manifest.json",
  sourceReview: ".planning/artifacts/v1.38-lean-runner-source-review-v1.json",
  readiness: ".planning/artifacts/v1.38-lean-runner-readiness-v1.json",
  invocation: ".planning/artifacts/v1.38-lean-runner-invocation-v1.json",
  terminal: ".planning/artifacts/v1.38-lean-runner-terminal.json",
  adjudication: ".planning/artifacts/v1.38-lean-runner-adjudication-v1.json",
} as const)

export const LEAN_MANIFEST_PATH = LEAN_ARTIFACT_PATHS.manifest
export const LEAN_INVOCATION_PATH = LEAN_ARTIFACT_PATHS.invocation
export const LEAN_TERMINAL_PATH = LEAN_ARTIFACT_PATHS.terminal
export const LEAN_READINESS_PATH = LEAN_ARTIFACT_PATHS.readiness
export const LEAN_ADJUDICATION_PATH = LEAN_ARTIFACT_PATHS.adjudication

/** Minimum executable closure: gate sources plus direct rules/runtime/fixture owners. */
export const LEAN_EXECUTABLE_CLOSURE_PATHS = Object.freeze([
  "scripts/lib/v1-38-lean-runner-feasibility.ts",
  "scripts/lib/v1-38-lean-runner-feasibility.test.ts",
  "scripts/run-v1-38-lean-runner-feasibility.ts",
  "scripts/run-v1-38-lean-runner-feasibility.test.ts",
  "scripts/check-v1-38-lean-admission.ts",
  "scripts/check-v1-38-lean-admission.test.ts",
  "apps/runtime-service/src/execute-match.ts",
  "apps/runtime-service/src/runtime-execution-current-match.test-support.ts",
  "apps/runtime-service/src/runtime-execution-evidence.test-support.ts",
  "apps/runtime-service/src/runtime-config.ts",
  "packages/engine/src/kernel/driver.ts",
  "packages/engine/src/kernel/step.ts",
  "packages/engine/src/kernel/validate.ts",
  "packages/engine/src/kernel/types.ts",
  "packages/persistence/src/starter-strategies.ts",
  "packages/persistence/src/advanced-strategies.ts",
  "packages/runtime-js/src/executor.ts",
  "packages/runtime-js/src/abi-bridge.ts",
  "packages/runtime-js/src/worker-thread-adapter.ts",
  "packages/spec/src/arena-catalog-v1-37.ts",
  "packages/spec/src/constants.ts",
  "packages/spec/src/runtime.ts",
  "packages/spec/src/runtime-execution-service.ts",
  "packages/spec/src/runtime-execution-service-v1-18.ts",
  "packages/spec/src/schemas.ts",
  "packages/spec/src/set-condition-policy-v1-37.ts",
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

const git = (repoRoot: string, args: readonly string[]): string => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value)
const isSha = (value: unknown): value is `sha256:${string}` => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const isOid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)
const exactFalseAuthority = (value: unknown): boolean => isObject(value) && Object.keys(value).sort().join("\0") === Object.keys(LEAN_AUTHORITY_FALSE).sort().join("\0") && Object.values(value).every((flag) => flag === false)
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
  if (!isObject(value) || value.schemaVersion !== "v1.38-lean-runner-source-review-v1" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || !Number.isSafeInteger(value.findingCount) || (value.findingCount as number) < 0 || !Array.isArray(value.findings) || value.findings.length !== value.findingCount || value.admitsExecution !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_SOURCE_REVIEW_INVALID")
  return globalThis.structuredClone(value) as unknown as LeanSourceReview
}
export const checkLeanReadiness = (manifest: LeanManifest, reviewValue: unknown, value: unknown): LeanReadiness => {
  const review = checkLeanSourceReview(manifest, reviewValue)
  if (review.findingCount !== 0 || !isObject(value) || value.schemaVersion !== "v1.38-lean-runner-readiness-v1" || value.sourceCommit !== manifest.source.commit || value.manifestRoot !== hashLeanValue(manifest) || value.sourceReviewRoot !== hashLeanValue(review) || value.findingCount !== 0 || value.plan151Eligible !== true || value.liveInvocationLimit !== 1 || value.liveInvocationsConsumed !== 0 || value.correctiveRerunAuthorized !== false || !exactFalseAuthority(value.authority)) throw new TypeError("LEAN_READINESS_INVALID")
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
  if (!isObject(value)) throw new TypeError("LEAN_TERMINAL_INVALID")
  const records = value.records
  if (Array.isArray(records)) return reduceLeanExecutions(records as never)
  const terminal = value as unknown as LeanTerminal
  if (terminal.schemaVersion !== "v1.38-lean-runner-feasibility-v1" || !["pass", "non_pass", "invalid"].includes(terminal.result) || terminal.formationMaterialized !== false || !exactFalseAuthority(terminal.authority) || terminal.schedule.chargedExecutions !== 24) throw new TypeError("LEAN_TERMINAL_INVALID")
  return globalThis.structuredClone(terminal)
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
export const createExclusiveLeanTerminal = (repoRoot: string, terminal: LeanTerminal): void => writeExclusiveDurable(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.terminal), checkTerminalValue(terminal))

const main = (): void => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const selector = process.argv[2]
  if (selector === "--render-manifest") { process.stdout.write(`${JSON.stringify(renderLeanManifest(repoRoot, process.argv[3] ?? "HEAD"), null, 2)}\n`); return }
  if (selector === "--check-manifest") { checkLeanSourcePreconditions(repoRoot); checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest)) }
  else if (selector === "--check-source-review") {
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview])
    const manifest = checkLeanManifest(repoRoot, readJson(repoRoot, LEAN_ARTIFACT_PATHS.manifest)); checkLeanSourceReview(manifest, readJson(repoRoot, LEAN_ARTIFACT_PATHS.sourceReview))
  } else if (selector === "--check-reviewed-ready") { loadAndCheckLeanReviewedReady(repoRoot) }
  else if (selector === "--check-terminal" || selector === "--check-post-run") {
    assertForbiddenScopeAbsent(repoRoot, [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal])
    loadAndCheckLeanReviewedReady(
      repoRoot,
      [LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal],
      [LEAN_ARTIFACT_PATHS.manifest, LEAN_ARTIFACT_PATHS.sourceReview, LEAN_ARTIFACT_PATHS.readiness, LEAN_ARTIFACT_PATHS.invocation, LEAN_ARTIFACT_PATHS.terminal],
    )
    if (!existsSync(path.resolve(repoRoot, LEAN_ARTIFACT_PATHS.invocation))) throw new TypeError("LEAN_INVOCATION_MISSING")
    const terminal = checkTerminalValue(readJson(repoRoot, LEAN_ARTIFACT_PATHS.terminal))
    if (selector === "--check-post-run" && !terminal.completeCleanup) throw new TypeError("LEAN_CLEANUP_INCOMPLETE")
  } else if (selector === "--check-adjudication") {
    assertForbiddenScopeAbsent(repoRoot, Object.values(LEAN_ARTIFACT_PATHS))
    const adjudication = readJson(repoRoot, LEAN_ARTIFACT_PATHS.adjudication)
    if (!isObject(adjudication) || !exactFalseAuthority(adjudication.authority)) throw new TypeError("LEAN_ADJUDICATION_INVALID")
  } else throw new TypeError("LEAN_CHECK_SELECTOR_INVALID")
  process.stdout.write(`${JSON.stringify({ ok: true, selector, liveInvocationCount: 0, authority: LEAN_AUTHORITY_FALSE })}\n`)
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "LEAN_CHECK_FAILED"}\n`); process.exitCode = 1 }
}
