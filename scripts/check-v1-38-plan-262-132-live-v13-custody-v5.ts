import { createHash } from "node:crypto"
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { computeV138PathStableLocalExecutionClosureRoot } from
  "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"
import { runV138RetryV3IsolatedGit, runV138RetryV3IsolatedGitBytes } from
  "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>
const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const PUBLICATION = "b80782214eeb323023287b4589049f0139befdd5"
const SUMMARY = "6a82901a8e73a4c2b8be92ba1b8d606919678784"
const REVIEW = "f45ee38d529ba79d63e0b54995ed90d947811dd4"
const REVIEW_TREE = "9592d1ccbad47e7ef58957c25321eac7c41deb0b"
const REVIEW_PARENT = "ca21e28b8dc7c9de4c1691d03601c95ef473ffe3"
const REVIEW_PATH = `${PHASE}/262-131-CODE-REVIEW.md`
const REVIEW_BLOB = "94c76818f17cc473d36acf4946a834c78e210540"
const REVIEW_SHA = "sha256:dee7fd56dedaf18f758a3b7b9a5797c9d3698a31036baa2b0770e492b18b0936"
const SUMMARY_PATH = `${PHASE}/262-131-SUMMARY.md`
const V4_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-131-live-v13-custody-review-carrier-v4.json",
  ".planning/artifacts/v1.38-plan-262-131-live-v13-custody-review-payload-v4.json",
  `${PHASE}/262-131-REVIEW-v4.md`,
] as const)
const V4_BLOBS = Object.freeze([
  "4c574c185c42638a94185ff769ae556eff8f2311",
  "0a0d770e3b6c6c4b77aacb3bc382793677179360",
  "42a15e8459d21d52cda4f75c00ce997a3b41741a",
] as const)
const V4_SHAS = Object.freeze([
  "sha256:493e30c4c20d9f696fc4dd12b24c47374cdb4ff4d4325a39c6ffc0c4641ae9a4",
  "sha256:6c0baf8917d70ed6d273df08e0f9c2bd1dfde545dc04575b2465e480cab6a9d9",
  "sha256:1b161530e400d5cb6d808afed1ea2c872fa0fac9d69fcbd0dd0aef653cf46c36",
] as const)
const SUMMARY_BLOB = "53e9fea0967f4886ee31479d11f3db56382396ba"
const SUMMARY_SHA = "sha256:56b91ace004ce601f48d677264fde925518fa5d910c6dcf49e5eac64cb74a0f9"
const OBSERVATION_KEYS = Object.freeze([
  "disposableLocalExecutionClosureRoot", "disposableLocalGitObjectRoot",
  "disposableLocalInstalledClosureRoot", "disposableLocalNativeSourcePaths",
  "disposableLocalNativeSourcesRoot", "disposableReviewedClosureRoot", "mode",
  "observationRoot", "producerGuardCount", "reducedValue", "status",
].sort())
const MODES = Object.freeze([
  ["--check-source-only", "source_only_checked"],
  ["--check-prospective-custody", "prospective_custody_checked"],
  ["--check-post-run-custody", "post_run_no_effect_custody_checked"],
  ["--check-non-pass-value", "bounded_non_pass_value_checked"],
  ["--check-bounded-success-value", "bounded_success_value_checked"],
  ["--check-exact-reproduction-v17-value", "exact_reproduction_v17_value_checked"],
] as const)
const NATIVE_SUFFIXES = Object.freeze([
  "scripts/native/v1-38-successor-transaction-helper-v6.c",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
] as const)
const EFFECT_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-current-matrix-retry-private-receipt-manifest-v3.json",
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
] as const)
const NO_EFFECT_VALUE = Object.freeze({ downstreamAuthority: "denied", freshAccepted: 0,
  freshCharged: 0, liveInvoked: false, producerCalls: 0, readinessInvoked: false })
const REDUCED_VALUES = Object.freeze([
  NO_EFFECT_VALUE, NO_EFFECT_VALUE, NO_EFFECT_VALUE,
  Object.freeze({ classification: "non_pass", reproductionEligible: false }),
  Object.freeze({ classification: "bounded_success", reproductionEligible: true }),
  Object.freeze({ acceptedCells: 540, exact: true, requiredAccepted: 540 }),
] as const)

export const V138_PLAN132_PUBLICATION_SCOPE = Object.freeze(
  V4_PATHS.map((repoPath) => `A\t${repoPath}`).sort(),
)
export const V138_PLAN132_SUMMARY_SCOPE = Object.freeze([`A\t${SUMMARY_PATH}`])

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const sha = (bytes: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const git = (root: string, args: readonly string[]): string =>
  runV138RetryV3IsolatedGit(root, args)
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
const readNoFollow = (root: string, repoPath: string): Buffer => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(path.join(root, ...repoPath.split("/")), constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor)
    if (!before.isFile() || (before.mode & 0o7777) !== 0o644 || before.size > 8 * 1024 * 1024)
      fail(`V138_PLAN132_CURRENT_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_PLAN132_CURRENT_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN132_")) throw error
    fail(`V138_PLAN132_CURRENT_ENTRY_INVALID:${repoPath}`)
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
}
const isAncestor = (root: string, ancestor: string, descendant: string): boolean => {
  try {
    git(root, ["merge-base", "--is-ancestor", ancestor, descendant])
    return true
  } catch { return false }
}
const assertPathAbsent = (absolute: string, code: string): void => {
  try {
    lstatSync(absolute)
    fail(code)
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error
  }
}
const assertRepositoryMetadataSafe = (root: string): void => {
  const config = git(root, ["config", "--local", "--list"])
  if (/(?:^|\n)(?:core\.(?:hookspath|worktree|gitdir|fsmonitor|sshcommand|autocrlf|eol|safecrlf|attributesfile|symlinks)|extensions\.objectformat|include\.|filter\.|url\..*\.insteadof|protocol\.|alias\.)=/iu.test(config))
    fail("V138_PLAN132_REPOSITORY_CONFIG_FORBIDDEN")
  if (git(root, ["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "")
    fail("V138_PLAN132_REPLACE_REF_FORBIDDEN")
  assertPathAbsent(git(root, ["rev-parse", "--path-format=absolute", "--git-path", "info/grafts"]),
    "V138_PLAN132_GRAFTS_FORBIDDEN")
  assertPathAbsent(git(root, ["rev-parse", "--path-format=absolute", "--git-path", "shallow"]),
    "V138_PLAN132_SHALLOW_HISTORY_FORBIDDEN")
}
const assertEffectsAbsent = (root: string): void => {
  for (const repoPath of EFFECT_PATHS) {
    try {
      lstatSync(path.join(root, ...repoPath.split("/")))
      fail(`V138_PLAN132_EFFECT_PRESENT:${repoPath}`)
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error
    }
  }
}

export const assertV138Plan132ExactScopeForReview = (
  actualInput: readonly string[],
  expected: readonly string[],
  label: "PUBLICATION" | "SUMMARY",
) => {
  const actual = [...actualInput].sort()
  if (canonical(actual) !== canonical([...expected].sort())) fail(`V138_PLAN132_${label}_SCOPE_INVALID`)
  return Object.freeze(actual)
}

export const assertV138Plan132StrictSummaryDescendantForReview = (
  summaryCommit: string,
  headCommit: string,
  ancestry: boolean,
): true => {
  if (!/^[0-9a-f]{40}$/u.test(summaryCommit) || !/^[0-9a-f]{40}$/u.test(headCommit) ||
      summaryCommit === headCommit || !ancestry)
    fail("V138_PLAN132_HEAD_NOT_STRICT_SUMMARY_DESCENDANT")
  return true
}

const exactFile = (root: string, commit: string, repoPath: string, blob: string, expectedSha: Sha): Buffer => {
  if (git(root, ["ls-tree", commit, "--", repoPath]) !== `100644 blob ${blob}\t${repoPath}`)
    fail(`V138_PLAN132_COMMITTED_ENTRY_INVALID:${repoPath}`)
  const bytes = gitBytes(root, commit, repoPath)
  if (sha(bytes) !== expectedSha || !readNoFollow(root, repoPath).equals(bytes))
    fail(`V138_PLAN132_COMMITTED_BYTES_INVALID:${repoPath}`)
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath]) !== "")
    fail(`V138_PLAN132_PROTECTED_REWRITE:${repoPath}`)
  return bytes
}

export const authenticateV138Plan132V4InvalidHistoryForReview = (
  rootInput: string,
  headRef = "HEAD",
) => {
  const root = path.resolve(rootInput)
  assertRepositoryMetadataSafe(root)
  const head = git(root, ["rev-parse", headRef])
  assertV138Plan132StrictSummaryDescendantForReview(SUMMARY, head, isAncestor(root, SUMMARY, head))
  if (git(root, ["rev-parse", `${SUMMARY}^`]) !== PUBLICATION)
    fail("V138_PLAN132_SUMMARY_PARENT_INVALID")
  const summaryCommits = git(root, ["log", "--diff-filter=A", "--format=%H", "--", SUMMARY_PATH])
    .split("\n").filter(Boolean)
  if (summaryCommits.length !== 1 || summaryCommits[0] !== SUMMARY)
    fail("V138_PLAN132_SUMMARY_IDENTITY_INVALID")
  assertV138Plan132ExactScopeForReview(
    git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", PUBLICATION])
      .split("\n").filter(Boolean), V138_PLAN132_PUBLICATION_SCOPE, "PUBLICATION")
  assertV138Plan132ExactScopeForReview(
    git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", SUMMARY])
      .split("\n").filter(Boolean), V138_PLAN132_SUMMARY_SCOPE, "SUMMARY")
  if (git(root, ["rev-parse", `${REVIEW}^{tree}`]) !== REVIEW_TREE ||
      git(root, ["rev-parse", `${REVIEW}^`]) !== REVIEW_PARENT)
    fail("V138_PLAN132_REVIEW_LINEAGE_INVALID")
  exactFile(root, REVIEW, REVIEW_PATH, REVIEW_BLOB, REVIEW_SHA)
  const bytes = V4_PATHS.map((repoPath, index) =>
    exactFile(root, PUBLICATION, repoPath, V4_BLOBS[index]!, V4_SHAS[index]!))
  exactFile(root, SUMMARY, SUMMARY_PATH, SUMMARY_BLOB, SUMMARY_SHA)
  const payload = JSON.parse(bytes[1]!.toString("utf8")) as Json
  const carrier = JSON.parse(bytes[0]!.toString("utf8")) as Json
  if (payload.plan110Eligible !== true || payload.findingCount !== 0 ||
      payload.actualModesPassed !== 6 || carrier.plan110Eligible !== true)
    fail("V138_PLAN132_V4_STORED_SEMANTICS_INVALID")
  return Object.freeze({ publicationCommit: PUBLICATION, summaryCommit: SUMMARY, reviewCommit: REVIEW,
    headCommit: head, storedPlan110Eligible: true as const, currentPlan110Eligible: false as const,
    disposition: "process_invalid_descendant_and_observation_validation" as const,
    payload: Object.freeze(payload), carrier: Object.freeze(carrier) })
}

const exactKeys = (value: Json, expected: readonly string[]): boolean =>
  canonical(Object.keys(value).sort()) === canonical([...expected].sort())
const isSha = (value: unknown): value is Sha =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)

const validateAuthenticatedObservations = (
  observationsInput: unknown,
  authenticatedPayload: Json,
) => {
  if (!Array.isArray(observationsInput) || observationsInput.length !== MODES.length ||
      !Array.isArray(authenticatedPayload.observations) || authenticatedPayload.observations.length !== MODES.length)
    fail("V138_PLAN132_OBSERVATIONS_INVALID")
  const observations = observationsInput as Json[]
  const seen = new Set<string>()
  for (const [index, observation] of observations.entries()) {
    if (observation === null || typeof observation !== "object" || Array.isArray(observation) ||
        !exactKeys(observation, OBSERVATION_KEYS)) fail("V138_PLAN132_OBSERVATIONS_INVALID")
    const [mode, status] = MODES[index]!
    if (observation.mode !== mode || observation.status !== status || seen.has(observation.mode) ||
        observation.producerGuardCount !== 0) fail("V138_PLAN132_OBSERVATIONS_INVALID")
    seen.add(observation.mode)
    const roots = [observation.disposableLocalExecutionClosureRoot,
      observation.disposableLocalGitObjectRoot, observation.disposableLocalInstalledClosureRoot,
      observation.disposableLocalNativeSourcesRoot, observation.disposableReviewedClosureRoot,
      observation.observationRoot]
    if (roots.some((root) => !isSha(root)) ||
        observation.disposableReviewedClosureRoot !== authenticatedPayload.canonicalReviewedClosureRoot ||
        observation.disposableLocalInstalledClosureRoot !== authenticatedPayload.canonicalLocalInstalledClosureRoot ||
        observation.disposableLocalGitObjectRoot !== authenticatedPayload.canonicalLocalGitObjectRoot ||
        observation.disposableLocalNativeSourcesRoot === authenticatedPayload.canonicalLocalNativeSourcesRoot ||
        canonical(observation.reducedValue) !== canonical(REDUCED_VALUES[index]))
      fail("V138_PLAN132_OBSERVATIONS_INVALID")
    if (!Array.isArray(observation.disposableLocalNativeSourcePaths) ||
        observation.disposableLocalNativeSourcePaths.length !== NATIVE_SUFFIXES.length)
      fail("V138_PLAN132_OBSERVATIONS_INVALID")
    let disposableRoot: string | undefined
    for (const [nativeIndex, nativePathValue] of observation.disposableLocalNativeSourcePaths.entries()) {
      if (typeof nativePathValue !== "string" || !path.isAbsolute(nativePathValue) ||
          path.normalize(nativePathValue) !== nativePathValue || !nativePathValue.endsWith(NATIVE_SUFFIXES[nativeIndex]!))
        fail("V138_PLAN132_OBSERVATIONS_INVALID")
      const candidateRoot = nativePathValue.slice(0, -NATIVE_SUFFIXES[nativeIndex]!.length)
      if (!candidateRoot.endsWith("/repo/") ||
          !candidateRoot.includes(`/v138-plan131-mode-${index}-`) ||
          (disposableRoot !== undefined && disposableRoot !== candidateRoot))
        fail("V138_PLAN132_OBSERVATIONS_INVALID")
      disposableRoot = candidateRoot
    }
    const localBody = { reviewedClosureRoot: observation.disposableReviewedClosureRoot,
      localInstalledClosureRoot: observation.disposableLocalInstalledClosureRoot,
      localGitObjectRoot: observation.disposableLocalGitObjectRoot,
      localNativeSourcesRoot: observation.disposableLocalNativeSourcesRoot }
    const { observationRoot, ...observationBody } = observation
    if (observation.disposableLocalExecutionClosureRoot !==
          computeV138PathStableLocalExecutionClosureRoot(localBody) ||
        observationRoot !== rooted("v138-plan-262-131-mode-observation-v4", observationBody) ||
        canonical(observation) !== canonical(authenticatedPayload.observations[index]))
      fail("V138_PLAN132_OBSERVATIONS_INVALID")
  }
  const observationsRoot = rooted("v138-plan-262-131-observations-v4", observations)
  if (observationsRoot !== authenticatedPayload.observationsRoot)
    fail("V138_PLAN132_OBSERVATIONS_INVALID")
  return Object.freeze({ actualModesPassed: observations.length, observationsRoot })
}

export const validateV138Plan132ObservationsForReview = (
  rootInput: string,
  observationsInput: unknown,
) => {
  if (typeof rootInput !== "string") fail("V138_PLAN132_OBSERVATIONS_INVALID")
  const history = authenticateV138Plan132V4InvalidHistoryForReview(rootInput)
  return validateAuthenticatedObservations(observationsInput, history.payload)
}

export const renderV138Plan132SourceCorrectionForReview = (
  root: string,
  input: Json,
) => {
  if (input === null || typeof input !== "object" || Array.isArray(input) ||
      !exactKeys(input, ["findings", "observations"])) fail("V138_PLAN132_INPUT_KEYS_INVALID")
  const history = authenticateV138Plan132V4InvalidHistoryForReview(root)
  assertEffectsAbsent(path.resolve(root))
  if (!Array.isArray(input.findings) || input.findings.length !== 0)
    fail("V138_PLAN132_FINDINGS_INVALID")
  const aggregate = validateAuthenticatedObservations(input.observations, history.payload)
  assertEffectsAbsent(path.resolve(root))
  return Object.freeze({ ...aggregate, findingCount: input.findings.length, plan133Eligible: false,
    plan110Eligible: false, v4Disposition: history.disposition, producerCalls: 0,
    readinessInvoked: false, liveInvoked: false, freshCharged: 0, freshAccepted: 0,
    authorizesExecution: false, downstreamAuthority: "denied" as const })
}

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length === 1 && args[0] === "--check-source-only") {
    const history = authenticateV138Plan132V4InvalidHistoryForReview(root)
    const correction = renderV138Plan132SourceCorrectionForReview(root,
      { observations: history.payload.observations, findings: history.payload.findings })
    process.stdout.write(`${JSON.stringify({ sourceOnly: true, ...correction })}\n`)
    return
  }
  fail("V138_PLAN132_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
