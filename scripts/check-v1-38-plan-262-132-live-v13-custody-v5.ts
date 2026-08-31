import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { closeSync, constants, fstatSync, openSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

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
const git = (root: string, args: readonly string[]): string =>
  execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim()
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", "cat-file", "blob",
    `${commit}:${repoPath}`], { cwd: root, stdio: ["ignore", "pipe", "pipe"] })
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
const isAncestor = (root: string, ancestor: string, descendant: string): boolean =>
  spawnSync("/usr/bin/git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd: root }).status === 0

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

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length === 1 && args[0] === "--check-source-only") {
    const history = authenticateV138Plan132V4InvalidHistoryForReview(root)
    process.stdout.write(`${JSON.stringify({ sourceOnly: true, v4Disposition: history.disposition,
      plan110Eligible: false, producerCalls: 0, readinessInvoked: false, liveInvoked: false,
      freshCharged: 0, freshAccepted: 0, authorizesExecution: false,
      downstreamAuthority: "denied" })}\n`)
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
