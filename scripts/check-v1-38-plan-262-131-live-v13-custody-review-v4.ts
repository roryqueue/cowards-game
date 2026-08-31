import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
import {
  computeV138Plan114IndependentReproductionRoot,
  deriveV138Plan114IndependentPostSemantics,
  deriveV138Plan114IndependentReproductionSemantics,
} from "./lib/v1-38-plan-262-114-independent-semantics-v2.js"
import {
  checkV138PathStableCustodyForReview,
  computeV138PathStableLocalExecutionClosureRoot,
  deriveV138PathStableCustody,
  type V138PathStableCustody,
} from "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>
export type V138Plan131Finding = Readonly<{
  code: string
  severity: "critical" | "warning"
  subject: string
  detail: string
}>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const PLAN130_SOURCE = "scripts/check-v1-38-plan-262-130-live-v13-custody-v4.ts"
const PLAN130_TEST = "scripts/check-v1-38-plan-262-130-live-v13-custody-v4.test.ts"
const PLAN130_SUMMARY = `${PHASE}/262-130-SUMMARY.md`
const PLAN130_REVIEW = `${PHASE}/262-130-CODE-REVIEW-V4.md`
const PLAN130_SUBJECT_COMMIT = "6515ea1a2e372a71d9f9d161e395276cf163db76"
const PLAN130_SUBJECT_TREE = "ed9234c2aa309b22dc82c3d2740d3a33705c239a"
const PLAN130_SUBJECT_PARENT = "32ff6cb09fd5b3ed2360938c042c71cd9f20f687"
const PLAN130_SOURCE_BLOB = "e500acca54ad3e5feb9d5dcd0cd60843695278f5"
const PLAN130_TEST_BLOB = "18152164ef2e7486b2b85f379576f4ea1a2852c1"
const PLAN130_SOURCE_SHA256 = "sha256:99116f6ab89cc1dd6b980d37ff68072ee2be90b67121293ca7f1633046ee47a3"
const PLAN130_TEST_SHA256 = "sha256:72ff5610a9ca5f4ae09a2d52f3bedcef93ffabdd793083640cb6d551f9f2c674"
const PLAN130_CLOSEOUT_COMMIT = "bbbd52496f530ec7edcf3bd6e42baf702945a26b"
const PLAN130_CLOSEOUT_TREE = "2bdd37e2e9118009ed294d05c107b28df766a533"
const PLAN130_SUMMARY_BLOB = "22d0e6a741ffed1bb81a50820ab97dc55ae6db3e"
const PLAN130_SUMMARY_SHA256 = "sha256:4e5d1059001794bed6db32eacfc8eb4bb5893b1c78364b59beffde629bbfefac"
const PLAN130_CLEAN_REVIEW_COMMIT = "a93a545608cd16ca4ccca2b4e571d9b4861762b4"
const PLAN130_CLEAN_REVIEW_TREE = "84525b1661a72b2db51cfe8696a91bad74317e11"
const PLAN130_REVIEW_BLOB = "dc14ca164bd4ce563085d165aad9682c8d8aa974"
const PLAN130_REVIEW_SHA256 = "sha256:aa49252160ad53deb89e57908d969817834a41e8ea0eb2bd60c429607db81ce5"

const LIVE_SUBJECT_COMMIT = "3882cd5d3ec7a834e1de88254dd0daf955da12aa"
const LIVE_SOURCE_PATH = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts"
const LIVE_TEST_PATH = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.test.ts"
const LIVE_SOURCE_BLOB = "0d299dc98c3af22d6a2312a7bdc6062538bc1cd9"
const LIVE_SOURCE_SHA256 = "sha256:059fe04ce2f3a51db4636bd3bc0553cc6882c3095afd240f15a94e267f83e7bd"
const REVIEW_COMMIT = "73d1be605aa68a7789c53ce78b20f4922b8b7cec"
const REVIEW_TREE = "97fa619c4915b6690441d2e4a08cce52c62777ae"
const REVIEW_PARENT = "86d7f63ad5a963d706bd0d577ce72ce4eff6b9c0"
const REVIEW_PATH = `${PHASE}/262-122-CODE-REVIEW.md`
const REVIEW_BLOB = "4fc9c04dd5b249625d2d326786e53465dc838425"
const REVIEW_SHA256 = "sha256:f41d9871c7c5fea9f779ff26f8965c8f45fe16061a62ff8b8f033afb2f2f3b5d"
const V3_PUBLICATION_COMMIT = "65a7a246627a411c45ced95bfb3c0296f0f8e4eb"
const V3_CLOSEOUT_COMMIT = "2bbd45f85500b052022c81fda8c1c8a1c6536b1b"
const PLANNING_COMMIT = "86d7f63ad5a963d706bd0d577ce72ce4eff6b9c0"
const B331_COMMIT = "b331baad29053f523233558f66aa2855f2925b2b"

const V3_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-carrier-v3.json",
  ".planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-payload-v3.json",
  `${PHASE}/262-122-REVIEW-v3.md`,
] as const)
const V3_BLOBS = Object.freeze([
  "d9b456a89151c3b9f0e6fa810badc19f89ac66f5",
  "7f68c4fc19b942ddc0e99e207b70751587273cc2",
  "5ea309e2e1d9c3aecf8df7bcd4987bab0ff61f3a",
] as const)
const OUTPUT_PATHS = Object.freeze({
  payload: ".planning/artifacts/v1.38-plan-262-131-live-v13-custody-review-payload-v4.json",
  review: `${PHASE}/262-131-REVIEW-v4.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-131-live-v13-custody-review-carrier-v4.json",
  summary: `${PHASE}/262-131-SUMMARY.md`,
})
const REVIEW_PATHS = Object.freeze([OUTPUT_PATHS.payload, OUTPUT_PATHS.review, OUTPUT_PATHS.carrier])
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
])
const CHECKOUT_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
  LIVE_SOURCE_PATH,
  LIVE_TEST_PATH,
] as const)
const LOCAL_NATIVE_PATHS = Object.freeze([
  "scripts/native/v1-38-successor-transaction-helper-v6.c",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
] as const)
const MODES = Object.freeze([
  "--check-source-only",
  "--check-prospective-custody",
  "--check-post-run-custody",
  "--check-non-pass-value",
  "--check-bounded-success-value",
  "--check-exact-reproduction-v17-value",
] as const)
const STATUSES = Object.freeze([
  "source_only_checked",
  "prospective_custody_checked",
  "post_run_no_effect_custody_checked",
  "bounded_non_pass_value_checked",
  "bounded_success_value_checked",
  "exact_reproduction_v17_value_checked",
] as const)

export const V138_PLAN131_B331_SCOPE = Object.freeze([
  `A\t${PHASE}/262-120-SUMMARY.md`,
  `A\t${PHASE}/262-93-SUMMARY.md`,
  "M\t.planning/ROADMAP.md",
  "M\t.planning/STATE.md",
  `M\t${PHASE}/262-110-PLAN.md`,
  `M\t${PHASE}/262-122-PLAN.md`,
  `M\t${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`,
].sort())

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
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const target = (root: string, repoPath: string): string => path.join(root, ...repoPath.split("/"))
const git = (root: string, args: readonly string[], allowFailure = false): string => {
  const result = spawnSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  })
  if (result.status !== 0) {
    if (allowFailure) return ""
    fail(`V138_PLAN131_GIT_FAILED:${args[0] ?? "unknown"}`)
  }
  return result.stdout.trim()
}
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", "cat-file", "blob", `${commit}:${repoPath}`],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] })
const present = (root: string, repoPath: string): boolean => {
  try { lstatSync(target(root, repoPath)); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
    throw error
  }
}
const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (present(root, repoPath)) fail(`V138_PLAN131_FORBIDDEN_PRESENT:${repoPath}`)
}
const readNoFollow = (root: string, repoPath: string, expectedMode = 0o644): Buffer => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target(root, repoPath), constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor)
    if (!before.isFile() || (before.mode & 0o7777) !== expectedMode || before.size > 8 * 1024 * 1024)
      fail(`V138_PLAN131_CURRENT_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_PLAN131_CURRENT_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN131_")) throw error
    fail(`V138_PLAN131_CURRENT_ENTRY_INVALID:${repoPath}`)
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
}
const jsonBytes = (bytes: Buffer, code: string): Json => {
  try {
    const value = JSON.parse(bytes.toString("utf8")) as Json
    if (!bytes.equals(Buffer.from(canonical(value)))) fail(code)
    return value
  } catch (error) {
    if (error instanceof Error && error.message === code) throw error
    fail(code)
  }
}
const ancestor = (root: string, commit: string): void => {
  const result = spawnSync("/usr/bin/git", ["merge-base", "--is-ancestor", commit, "HEAD"], { cwd: root })
  if (result.status !== 0) fail(`V138_PLAN131_ANCESTRY_INVALID:${commit}`)
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail(`V138_PLAN131_SUCCESSOR_REWRITE:${paths[0]}`)
}

export const assertV138Plan131ExactB331ScopeForReview = (entries: readonly string[]) => {
  const actual = [...entries].sort()
  if (canonical(actual) !== canonical(V138_PLAN131_B331_SCOPE)) fail("V138_PLAN131_B331_SCOPE_INVALID")
  return Object.freeze(actual)
}

export const assertV138Plan131StrictLaterHeadForReview = (
  publicationCommit: string,
  headCommit: string,
  isAncestor: boolean,
): true => {
  if (!/^[0-9a-f]{40}$/u.test(publicationCommit) || !/^[0-9a-f]{40}$/u.test(headCommit) ||
      publicationCommit === headCommit || !isAncestor)
    fail("V138_PLAN131_PUBLICATION_NOT_STRICT_ANCESTOR")
  return true
}

const exactCommitFile = (
  root: string,
  commit: string,
  repoPath: string,
  blob: string,
  expectedSha: Sha,
): void => {
  if (git(root, ["ls-tree", commit, "--", repoPath]) !== `100644 blob ${blob}\t${repoPath}` ||
      sha(gitBytes(root, commit, repoPath)) !== expectedSha)
    fail(`V138_PLAN131_COMMITTED_FILE_INVALID:${repoPath}`)
}

export const authenticateV138Plan131Plan130SourceForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  if (git(root, ["rev-parse", `${PLAN130_SUBJECT_COMMIT}^{tree}`]) !== PLAN130_SUBJECT_TREE ||
      git(root, ["rev-parse", `${PLAN130_SUBJECT_COMMIT}^`]) !== PLAN130_SUBJECT_PARENT ||
      git(root, ["rev-parse", `${PLAN130_CLOSEOUT_COMMIT}^{tree}`]) !== PLAN130_CLOSEOUT_TREE ||
      git(root, ["rev-parse", `${PLAN130_CLOSEOUT_COMMIT}^`]) !== PLAN130_SUBJECT_COMMIT ||
      git(root, ["rev-parse", `${PLAN130_CLEAN_REVIEW_COMMIT}^{tree}`]) !== PLAN130_CLEAN_REVIEW_TREE ||
      git(root, ["rev-parse", `${PLAN130_CLEAN_REVIEW_COMMIT}^`]) !== PLAN130_CLOSEOUT_COMMIT)
    fail("V138_PLAN131_PLAN130_LINEAGE_INVALID")
  exactCommitFile(root, PLAN130_SUBJECT_COMMIT, PLAN130_SOURCE, PLAN130_SOURCE_BLOB, PLAN130_SOURCE_SHA256)
  exactCommitFile(root, PLAN130_SUBJECT_COMMIT, PLAN130_TEST, PLAN130_TEST_BLOB, PLAN130_TEST_SHA256)
  exactCommitFile(root, PLAN130_CLOSEOUT_COMMIT, PLAN130_SUMMARY, PLAN130_SUMMARY_BLOB, PLAN130_SUMMARY_SHA256)
  exactCommitFile(root, PLAN130_CLEAN_REVIEW_COMMIT, PLAN130_REVIEW, PLAN130_REVIEW_BLOB, PLAN130_REVIEW_SHA256)
  for (const [commit, repoPath] of [[PLAN130_SUBJECT_COMMIT, PLAN130_SOURCE],
    [PLAN130_SUBJECT_COMMIT, PLAN130_TEST], [PLAN130_CLOSEOUT_COMMIT, PLAN130_SUMMARY],
    [PLAN130_CLEAN_REVIEW_COMMIT, PLAN130_REVIEW]] as const) {
    ancestor(root, commit)
    noRewrite(root, commit, [repoPath])
    if (!readNoFollow(root, repoPath).equals(gitBytes(root, commit, repoPath)))
      fail(`V138_PLAN131_CURRENT_BYTES_INVALID:${repoPath}`)
  }
  return Object.freeze({ subjectCommit: PLAN130_SUBJECT_COMMIT, subjectTree: PLAN130_SUBJECT_TREE,
    subjectParent: PLAN130_SUBJECT_PARENT, sourceBlob: PLAN130_SOURCE_BLOB, testBlob: PLAN130_TEST_BLOB,
    sourceSha256: PLAN130_SOURCE_SHA256, testSha256: PLAN130_TEST_SHA256,
    closeoutCommit: PLAN130_CLOSEOUT_COMMIT, cleanReviewCommit: PLAN130_CLEAN_REVIEW_COMMIT })
}

export const inspectV138Plan131ApprovedLiveSourceForReview = (source: string) => {
  if (sha(source) !== LIVE_SOURCE_SHA256) fail("V138_PLAN131_LIVE_SOURCE_BYTES_INVALID")
  const sourceFile = ts.createSourceFile("live-v13.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let imports = 0
  let references = 0
  let callSites = 0
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text === "./run-v1-38-bounded-retry-envelope-v3.js") imports += 1
    if (ts.isIdentifier(node) && node.text === "runV138V3ProductionLive") references += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138V3ProductionLive") callSites += 1
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  if (imports !== 1 || references !== 2 || callSites !== 1)
    fail("V138_PLAN131_LIVE_SOURCE_AST_INVALID")
  return Object.freeze({ producerCallSites: 1 as const, producerCalls: 0 as const,
    readinessInvoked: false as const, liveInvoked: false as const, authorizesExecution: false as const,
    downstreamAuthority: "denied" as const })
}

export const authenticateV138Plan131V3InvalidHistoryForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const scope = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", V3_PUBLICATION_COMMIT])
    .split("\n").filter(Boolean).sort()
  if (canonical(scope) !== canonical(V3_PATHS.map((repoPath) => `A\t${repoPath}`).sort()))
    fail("V138_PLAN131_V3_PUBLICATION_SCOPE_INVALID")
  for (const [index, repoPath] of V3_PATHS.entries()) {
    if (git(root, ["ls-tree", V3_PUBLICATION_COMMIT, "--", repoPath]) !==
        `100644 blob ${V3_BLOBS[index]}\t${repoPath}`)
      fail(`V138_PLAN131_V3_BYTES_INVALID:${repoPath}`)
    noRewrite(root, V3_PUBLICATION_COMMIT, [repoPath])
  }
  if (git(root, ["rev-parse", `${V3_CLOSEOUT_COMMIT}^`]) !== V3_PUBLICATION_COMMIT ||
      git(root, ["rev-parse", `${REVIEW_COMMIT}^`]) !== PLANNING_COMMIT ||
      git(root, ["rev-parse", `${REVIEW_COMMIT}^{tree}`]) !== REVIEW_TREE || REVIEW_PARENT !== PLANNING_COMMIT)
    fail("V138_PLAN131_V3_LINEAGE_INVALID")
  exactCommitFile(root, REVIEW_COMMIT, REVIEW_PATH, REVIEW_BLOB, REVIEW_SHA256)
  ancestor(root, V3_CLOSEOUT_COMMIT)
  ancestor(root, REVIEW_COMMIT)
  const payload = jsonBytes(gitBytes(root, V3_PUBLICATION_COMMIT, V3_PATHS[1]),
    "V138_PLAN131_V3_PAYLOAD_INVALID")
  const carrier = jsonBytes(gitBytes(root, V3_PUBLICATION_COMMIT, V3_PATHS[0]),
    "V138_PLAN131_V3_CARRIER_INVALID")
  if (payload.plan110Eligible !== true || payload.findingCount !== 0 || payload.actualModesPassed !== 6 ||
      carrier.plan110Eligible !== true || carrier.payloadRoot !== payload.payloadRoot)
    fail("V138_PLAN131_V3_STORED_SEMANTICS_INVALID")
  return Object.freeze({ publicationCommit: V3_PUBLICATION_COMMIT, closeoutCommit: V3_CLOSEOUT_COMMIT,
    reviewCommit: REVIEW_COMMIT, planningCommit: PLANNING_COMMIT, storedPlan110Eligible: true as const,
    supersededV3Plan110Eligible: false as const,
    disposition: "process_invalid_false_clean_custody" as const,
    payloadRoot: payload.payloadRoot as Sha, reviewRoot: carrier.reviewRoot as Sha,
    carrierRoot: carrier.carrierRoot as Sha })
}

const authenticateExactHistory = (root: string): void => {
  authenticateV138Plan131Plan130SourceForReview(root)
  authenticateV138Plan131V3InvalidHistoryForReview(root)
  assertV138Plan131ExactB331ScopeForReview(
    git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", B331_COMMIT])
      .split("\n").filter(Boolean),
  )
  exactCommitFile(root, LIVE_SUBJECT_COMMIT, LIVE_SOURCE_PATH, LIVE_SOURCE_BLOB, LIVE_SOURCE_SHA256)
  noRewrite(root, LIVE_SUBJECT_COMMIT, [LIVE_SOURCE_PATH])
  if (!readNoFollow(root, LIVE_SOURCE_PATH).equals(gitBytes(root, LIVE_SUBJECT_COMMIT, LIVE_SOURCE_PATH)))
    fail("V138_PLAN131_LIVE_SOURCE_CURRENT_BYTES_INVALID")
  inspectV138Plan131ApprovedLiveSourceForReview(readNoFollow(root, LIVE_SOURCE_PATH).toString("utf8"))
}

const computeRootRelativeNativeCustody = (rootInput: string) => {
  const root = realpathSync(rootInput)
  const paths = LOCAL_NATIVE_PATHS.map((repoPath) => target(root, repoPath))
  const manifest = paths.map((absolute) => [absolute, sha(readFileSync(absolute))] as const)
  return Object.freeze({ paths: Object.freeze(paths), root: sha(canonical(manifest)) })
}
const deriveCustody = (root: string): V138PathStableCustody => {
  const imported = deriveV138PathStableCustody(root, { sourceCommit: LIVE_SUBJECT_COMMIT,
    checkoutPaths: CHECKOUT_PATHS })
  const native = computeRootRelativeNativeCustody(root)
  const body = { reviewedClosureRoot: imported.reviewedClosureRoot,
    localInstalledClosureRoot: imported.localInstalledClosureRoot,
    localGitObjectRoot: imported.localGitObjectRoot,
    localNativeSourcesRoot: native.root }
  const custody = Object.freeze({ ...imported, ...body,
    localExecutionClosureRoot: computeV138PathStableLocalExecutionClosureRoot(body) })
  checkV138PathStableCustodyForReview(custody, custody)
  return custody
}
const reauthenticateCanonicalSnapshot = (root: string, expected: V138PathStableCustody) => {
  authenticateExactHistory(root)
  checkV138PathStableCustodyForReview(expected, expected)
  const native = computeRootRelativeNativeCustody(root)
  if (native.root !== expected.localNativeSourcesRoot ||
      computeV138PathStableLocalExecutionClosureRoot({
        reviewedClosureRoot: expected.reviewedClosureRoot,
        localInstalledClosureRoot: expected.localInstalledClosureRoot,
        localGitObjectRoot: expected.localGitObjectRoot,
        localNativeSourcesRoot: native.root,
      }) !== expected.localExecutionClosureRoot)
    fail("V138_PLAN131_CANONICAL_CUSTODY_CHANGED")
  return expected
}
const deriveDisposableCustody = (
  rootInput: string,
  canonicalCustody: V138PathStableCustody,
  canonicalRoot: string,
): V138PathStableCustody => {
  const root = realpathSync(rootInput)
  if (git(root, ["rev-parse", "HEAD"]) !== LIVE_SUBJECT_COMMIT)
    fail("V138_PLAN131_DISPOSABLE_HEAD_INVALID")
  for (const repoPath of CHECKOUT_PATHS) {
    const entry = git(root, ["ls-tree", LIVE_SUBJECT_COMMIT, "--", repoPath])
    const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
    if (match === null || match[3] !== repoPath ||
        git(root, ["hash-object", "--no-filters", "--", repoPath]) !== match[2])
      fail(`V138_PLAN131_DISPOSABLE_CHECKOUT_INVALID:${repoPath}`)
  }
  if (realpathSync(path.join(root, "node_modules")) !== realpathSync(path.join(canonicalRoot, "node_modules")))
    fail("V138_PLAN131_DISPOSABLE_INSTALLED_INPUT_INVALID")
  const commonDir = realpathSync(path.resolve(root, git(root, ["rev-parse", "--git-common-dir"])))
  const objectRoot = realpathSync(path.join(commonDir, "objects"))
  const objectStatus = statSync(objectRoot)
  const localGitObjectRoot = sha(`${objectRoot}\0${objectStatus.dev}\0${objectStatus.ino}`)
  const native = computeRootRelativeNativeCustody(root)
  const localBody = {
    reviewedClosureRoot: canonicalCustody.reviewedClosureRoot,
    localInstalledClosureRoot: canonicalCustody.localInstalledClosureRoot,
    localGitObjectRoot,
    localNativeSourcesRoot: native.root,
  }
  const custody = Object.freeze({ ...canonicalCustody, ...localBody,
    localExecutionClosureRoot: computeV138PathStableLocalExecutionClosureRoot(localBody) })
  checkV138PathStableCustodyForReview(custody, custody)
  return custody
}
const linkDependencies = (sourceRoot: string, linkedRoot: string): void => {
  symlinkSync(path.join(sourceRoot, "node_modules"), path.join(linkedRoot, "node_modules"), "dir")
  for (const workspace of ["apps/runtime-service", "apps/web", "apps/worker", "packages/engine",
    "packages/golden", "packages/map-configs", "packages/persistence", "packages/replay",
    "packages/runtime-js", "packages/runtime-python", "packages/runtime-supervisor",
    "packages/runtime-wasm-wasi", "packages/service", "packages/spec", "packages/test-utils"]) {
    const source = path.join(sourceRoot, workspace, "node_modules")
    if (!existsSync(source)) continue
    const destination = path.join(linkedRoot, workspace, "node_modules")
    mkdirSync(path.dirname(destination), { recursive: true })
    symlinkSync(source, destination, "dir")
  }
}
const reducedFixture = (index: number): { expression: string; expected: Json } => {
  const nonPass = { journalPresent: true, privateDirectoryPresent: true, terminalPresent: true,
    lockPresent: false, reproductionPresent: false, adjudicationOrDownstreamPresent: false,
    outcome: { disposition: "exhausted", journalRoot: `sha256:${"1".repeat(64)}`,
      stateRoot: `sha256:${"2".repeat(64)}`, completeCleanup: true,
      reproductionPresent: false, downstreamAuthority: "denied" } }
  const success = { ...nonPass, reproductionPresent: true,
    outcome: { ...nonPass.outcome, disposition: "succeeded", reproductionPresent: true } }
  if (index === 2 || index === 3) return { expression: `subject.checkV138LiveV13PostRunOutputCustodyForReview(${JSON.stringify(nonPass)})`,
    expected: deriveV138Plan114IndependentPostSemantics(nonPass as never) }
  if (index === 4) return { expression: `subject.checkV138LiveV13PostRunOutputCustodyForReview(${JSON.stringify(success)})`,
    expected: deriveV138Plan114IndependentPostSemantics(success as never) }
  const body = { schemaVersion: "v1.38-current-matrix-reproduction-v17", status: "passed_exact",
    admittedCalibrationRoot: `sha256:${"3".repeat(64)}`, chargedAttemptCount: 540,
    acceptedCellCount: 540, completeCleanup: true, executionRoot: `sha256:${"4".repeat(64)}`,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL", samplingMilliseconds: 200,
    partialAcceptedEvidenceReusable: false,
    privacyProjection: { strategySourceIncluded: false, strategyMemoryIncluded: false,
      soldierMemoryIncluded: false, objectivePayloadIncluded: false, rawDiagnosticsIncluded: false },
    phase263PlanningAuthorized: false, candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false, holdoutOpeningAuthorized: false,
    publicAuthorized: false, productAuthorized: false, productionAuthorized: false }
  const receiptRoot = computeV138Plan114IndependentReproductionRoot(body)
  const reproduction = { artifact: { ...body, receiptRoot }, journalRecords: [
    { kind: "finish_calibration", routeIdentity: "route:v3:0", owner: "owner", status: "admitted",
      completeCleanup: true, supervisionRoot: body.admittedCalibrationRoot },
    { kind: "finish_reproduction", routeIdentity: "route:v3:0", owner: "owner", status: "passed_exact",
      acceptedCells: 540, completeCleanup: true, reproductionRoot: receiptRoot,
      recordRoot: `sha256:${"5".repeat(64)}` },
  ], outcome: { disposition: "succeeded", journalRoot: `sha256:${"5".repeat(64)}`,
    stateRoot: `sha256:${"6".repeat(64)}`, completeCleanup: true,
    reproductionPresent: true, downstreamAuthority: "denied" } }
  return { expression: `subject.checkV138LiveV13ReproductionV17ForReview(${JSON.stringify(reproduction)})`,
    expected: deriveV138Plan114IndependentReproductionSemantics(reproduction as never) }
}

export const executeV138Plan131DisposableModesForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  authenticateExactHistory(root)
  assertAbsent(root, EFFECT_PATHS)
  const canonicalBefore = deriveCustody(root)
  const findings: V138Plan131Finding[] = []
  const observations: Json[] = []
  for (const [index, mode] of MODES.entries()) {
    reauthenticateCanonicalSnapshot(root, canonicalBefore)
    const owner = mkdtempSync(path.join(tmpdir(), `v138-plan131-mode-${index}-`))
    const linked = path.join(owner, "repo")
    const guardPath = path.join(owner, "producer-guard.jsonl")
    let added = false
    try {
      git(root, ["worktree", "add", "--quiet", "--detach", linked, LIVE_SUBJECT_COMMIT])
      added = true
      linkDependencies(root, linked)
      const disposable = deriveDisposableCustody(linked, canonicalBefore, root)
      if (disposable.reviewedClosureRoot !== canonicalBefore.reviewedClosureRoot)
        fail(`V138_PLAN131_DISPOSABLE_PORTABLE_CUSTODY_INVALID:${mode}`)
      const native = computeRootRelativeNativeCustody(linked)
      if (native.root !== disposable.localNativeSourcesRoot ||
          native.paths.some((entry) => !entry.startsWith(`${realpathSync(linked)}/`)) ||
          disposable.localNativeSourcesRoot === canonicalBefore.localNativeSourcesRoot)
        fail(`V138_PLAN131_DISPOSABLE_LOCAL_CUSTODY_INVALID:${mode}`)
      chmodSync(target(linked, ".planning/artifacts/v1.38-successor-source-seal-v13.json"), 0o600)
      chmodSync(target(linked, ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json"), 0o600)
      const source = readNoFollow(linked, LIVE_SOURCE_PATH).toString("utf8")
      inspectV138Plan131ApprovedLiveSourceForReview(source)
      const aliased = source.replace("  runV138V3ProductionLive,\n",
        "  runV138V3ProductionLive as importedRunV138V3ProductionLive,\n")
      const guarded = aliased.replace("type Sha = `sha256:${string}`",
        `import { appendFileSync as appendV138Plan131Guard } from "node:fs"\nconst runV138V3ProductionLive: typeof importedRunV138V3ProductionLive = async (..._args) => { appendV138Plan131Guard(${JSON.stringify(guardPath)}, "invoked\\n", { mode: 0o600 }); throw new Error("V138_PLAN131_PRODUCER_GUARD_TRIPPED") }\n\ntype Sha = \`sha256:\${string}\``)
      if (aliased === source || guarded === aliased) fail("V138_PLAN131_GUARD_INSTRUMENTATION_INVALID")
      const guardedPath = target(linked, "scripts/.plan131-live-v13-guarded.ts")
      writeFileSync(guardedPath, guarded, { mode: 0o600, flag: "wx" })
      let reducedValue: Json
      let valid = true
      if (index < 2) {
        const result = spawnSync(target(linked, "node_modules/.bin/tsx"),
          [path.relative(linked, guardedPath), mode], {
          cwd: linked, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
          env: { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: owner,
            LANG: "C", LC_ALL: "C" },
        })
        if (result.status !== 0) {
          valid = false
          reducedValue = { detail: result.stderr.trim() || `exit:${String(result.status)}` }
        } else {
          const value = JSON.parse(result.stdout.trim()) as Json
          valid = value.status === STATUSES[index] && value.producerCalls === 0 &&
            value.readinessInvoked === false && value.liveInvoked === false &&
            value.freshCharged === 0 && value.freshAccepted === 0 &&
            value.downstreamAuthority === "denied"
          reducedValue = { producerCalls: value.producerCalls, readinessInvoked: value.readinessInvoked,
            liveInvoked: value.liveInvoked, freshCharged: value.freshCharged,
            freshAccepted: value.freshAccepted, downstreamAuthority: value.downstreamAuthority }
        }
      } else {
        const fixture = reducedFixture(index)
        const runner = path.join(linked, `scripts/.plan131-mode-${index}.ts`)
        writeFileSync(runner,
          `import * as subject from ${JSON.stringify(pathToFileURL(guardedPath).href)}; const value=${fixture.expression}; process.stdout.write(JSON.stringify(value));`,
          { mode: 0o600, flag: "wx" })
        const result = spawnSync(target(linked, "node_modules/.bin/tsx"), [runner], {
          cwd: linked, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
          env: { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: owner,
            LANG: "C", LC_ALL: "C" },
        })
        if (result.status !== 0) {
          valid = false
          reducedValue = { detail: result.stderr.trim() || `exit:${String(result.status)}` }
        } else {
          const value = JSON.parse(result.stdout.trim()) as Json
          valid = canonical(value) === canonical(fixture.expected)
          reducedValue = index === 2 ? { producerCalls: 0, readinessInvoked: false,
            liveInvoked: false, freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied" }
            : index === 3 ? { classification: "non_pass", reproductionEligible: false }
            : index === 4 ? { classification: "bounded_success", reproductionEligible: true }
              : { acceptedCells: 540, requiredAccepted: 540, exact: true }
        }
      }
      const guardCount = existsSync(guardPath)
        ? readFileSync(guardPath, "utf8").split("\n").filter(Boolean).length : 0
      if (guardCount !== 0) valid = false
      for (const repoPath of EFFECT_PATHS) if (present(linked, repoPath)) valid = false
      if (!valid) findings.push({ code: `MODE_${index + 1}_FAILED`, severity: "critical",
        subject: mode, detail: canonical(reducedValue).trim() })
      const body = Object.freeze({ mode, status: valid ? STATUSES[index] : "failed",
        producerGuardCount: guardCount, reducedValue,
        disposableReviewedClosureRoot: disposable.reviewedClosureRoot,
        disposableLocalInstalledClosureRoot: disposable.localInstalledClosureRoot,
        disposableLocalGitObjectRoot: disposable.localGitObjectRoot,
        disposableLocalNativeSourcesRoot: disposable.localNativeSourcesRoot,
        disposableLocalNativeSourcePaths: native.paths,
        disposableLocalExecutionClosureRoot: disposable.localExecutionClosureRoot })
      observations.push(Object.freeze({ ...body,
        observationRoot: rooted("v138-plan-262-131-mode-observation-v4", body) }))
    } finally {
      if (added) git(root, ["worktree", "remove", "--force", linked])
      rmSync(owner, { recursive: true, force: true })
    }
    const canonicalCurrent = reauthenticateCanonicalSnapshot(root, canonicalBefore)
    if (canonical(canonicalCurrent) !== canonical(canonicalBefore))
      fail(`V138_PLAN131_CANONICAL_CUSTODY_CHANGED:${mode}`)
  }
  const canonicalAfter = reauthenticateCanonicalSnapshot(root, canonicalBefore)
  const sorted = [...findings].sort((a, b) => `${a.code}\0${a.subject}\0${a.detail}`
    .localeCompare(`${b.code}\0${b.subject}\0${b.detail}`))
  return Object.freeze({ modeNames: MODES, actualModesPassed: observations.filter(({ status }) => status !== "failed").length,
    observations: Object.freeze(observations), observationsRoot: rooted("v138-plan-262-131-observations-v4", observations),
    findings: Object.freeze(sorted), canonicalBefore, canonicalAfter,
    producerCalls: 0 as const, readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const, authorizesExecution: false as const,
    downstreamAuthority: "denied" as const })
}

const renderEvidence = (root: string, findings: readonly V138Plan131Finding[], modes?: ReturnType<typeof executeV138Plan131DisposableModesForReview>) => {
  const plan130 = authenticateV138Plan131Plan130SourceForReview(root)
  const v3 = authenticateV138Plan131V3InvalidHistoryForReview(root)
  const canonicalCustody = modes?.canonicalBefore ?? deriveCustody(root)
  const sorted = [...findings].sort((a, b) => `${a.code}\0${a.subject}\0${a.detail}`
    .localeCompare(`${b.code}\0${b.subject}\0${b.detail}`))
  const actualModesPassed = modes?.actualModesPassed ?? 0
  const eligible = sorted.length === 0 && actualModesPassed === 6 && modes?.findings.length === 0
  const payloadBody = {
    schemaVersion: "v1.38-plan-262-131-live-v13-custody-review-payload-v4",
    protocol: "independent-live-v13-executable-custody-review-v4",
    subjectCommit: plan130.subjectCommit, subjectTree: plan130.subjectTree,
    subjectParent: plan130.subjectParent, sourceBlob: plan130.sourceBlob, testBlob: plan130.testBlob,
    sourceSha256: plan130.sourceSha256, testSha256: plan130.testSha256,
    closeoutCommit: plan130.closeoutCommit, cleanReviewCommit: plan130.cleanReviewCommit,
    liveSubjectCommit: LIVE_SUBJECT_COMMIT, liveSourceBlob: LIVE_SOURCE_BLOB,
    liveSourceSha256: LIVE_SOURCE_SHA256, b331Commit: B331_COMMIT, b331Scope: V138_PLAN131_B331_SCOPE,
    v3PublicationCommit: v3.publicationCommit, v3CloseoutCommit: v3.closeoutCommit,
    v3ReviewCommit: v3.reviewCommit, v3Disposition: v3.disposition,
    v3StoredPlan110Eligible: v3.storedPlan110Eligible,
    supersededV3Plan110Eligible: v3.supersededV3Plan110Eligible,
    supersededV3PayloadRoot: v3.payloadRoot, supersededV3ReviewRoot: v3.reviewRoot,
    supersededV3CarrierRoot: v3.carrierRoot,
    supersededV2Disposition: "process_invalid_local_context_misbinding",
    supersededV2Plan110Eligible: false,
    supersededV2PayloadRoot: "sha256:a5338bfa3150a685cb35f2b402a35e80a0b78ff98df165998bc5c4581ea5f9da",
    supersededV2ReviewRoot: "sha256:a5bf40478f1f9ba4eb7e0403407ba8bb2a1146c7ee139cc0820dacdcbdc765df",
    supersededV2CarrierRoot: "sha256:699a0250fc3b4fff916601e50ad19b764319ce9a629198e93525f4dca62f78ab",
    canonicalReviewedClosureRoot: canonicalCustody.reviewedClosureRoot,
    canonicalLocalInstalledClosureRoot: canonicalCustody.localInstalledClosureRoot,
    canonicalLocalGitObjectRoot: canonicalCustody.localGitObjectRoot,
    canonicalLocalNativeSourcesRoot: canonicalCustody.localNativeSourcesRoot,
    canonicalLocalExecutionClosureRoot: canonicalCustody.localExecutionClosureRoot,
    recursiveDependencyRoot: canonicalCustody.recursiveDependencyRoot,
    recursiveDependencyCount: canonicalCustody.recursiveDependencyCount,
    installedClosureRoot: canonicalCustody.installedClosureRoot,
    findings: sorted, findingCount: sorted.length, actualModesPassed,
    observations: modes?.observations ?? [],
    observationsRoot: modes?.observationsRoot ?? rooted("v138-plan-262-131-observations-v4", []),
    plan110Eligible: eligible, authorizesExecution: false, createsCapacity: false,
    resetsCounters: false, authorizationLiteralCreated: false,
    readinessInvoked: false, liveInvoked: false, producerCalls: 0, freshCharged: 0, freshAccepted: 0,
    counters: { acceptedCells: 0, calibrationIdentitiesCharged: 0, preflightObservationsConsumed: 0,
      reproductionIdentitiesCharged: 0, routeStartsConsumed: 0 },
    phase263PlanningAuthorized: false, candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false, holdoutOpeningAuthorized: false,
    publicAuthorized: false, productAuthorized: false, productionAuthorized: false,
    downstreamAuthority: "denied",
  }
  const payload = Object.freeze({ ...payloadBody,
    payloadRoot: rooted("v138-plan-262-131-live-v13-custody-review-payload-v4", payloadBody) })
  const status = eligible ? "zero_findings" : "blocked"
  const reviewBody = `# Phase 262 Plan 131 Independent Live-v13 Executable-Custody Review v4\n\n` +
    `**${eligible ? "ZERO FINDINGS" : "BLOCKED"}.** Six genuine producer-incapable modes passed: ${actualModesPassed === 6 && sorted.length === 0 ? "yes" : "no"}. ` +
    `Plan122 v3 disposition: \`process_invalid_false_clean_custody\`. Plan122 v3 current eligibility: false. ` +
    `Only revised Plan 110 eligibility: ${eligible ? "true" : "false"}. Authorizes execution: false. ` +
    `Producer calls: 0. Readiness/live invoked: false. Fresh charged/accepted: 0/0. Downstream authority: denied.\n`
  const reviewRoot = rooted("v138-plan-262-131-live-v13-custody-review-v4", { status,
    findingCount: sorted.length, actualModesPassed, payloadRoot: payload.payloadRoot, reviewBody })
  const reviewBytes = Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "131"\nreview_type: independent_live_v13_executable_custody_v4\nstatus: ${status}\nfinding_count: ${sorted.length}\nreview_root: ${reviewRoot}\n---\n\n${reviewBody}`)
  const carrierBody = { schemaVersion: "v1.38-plan-262-131-live-v13-custody-review-carrier-v4",
    protocol: "nonrecursive-external-review-carrier-v4", subjectCommit: PLAN130_SUBJECT_COMMIT,
    payloadMode: "100644", payloadRoot: payload.payloadRoot,
    payloadSha256: sha(Buffer.from(canonical(payload))), reviewMode: "100644", reviewRoot,
    reviewSha256: sha(reviewBytes), findingCount: sorted.length, actualModesPassed,
    supersededV3Plan110Eligible: false, plan110Eligible: eligible,
    authorizesExecution: false, createsCapacity: false, resetsCounters: false,
    authorizationLiteralCreated: false, producerCalls: 0, readinessInvoked: false,
    liveInvoked: false, freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied" }
  const carrier = Object.freeze({ ...carrierBody,
    carrierRoot: rooted("v138-plan-262-131-live-v13-custody-review-carrier-v4", carrierBody) })
  return Object.freeze({ payload, reviewBytes, carrier })
}

export const renderV138Plan131EvidenceForReview = (
  rootInput: string,
  findings: readonly V138Plan131Finding[],
  modes?: ReturnType<typeof executeV138Plan131DisposableModesForReview>,
) => {
  if (findings.length === 0 && modes === undefined) fail("V138_PLAN131_ZERO_REQUIRES_EXECUTED_MODES")
  if (findings.length === 0 && (modes!.actualModesPassed !== 6 || modes!.findings.length !== 0))
    fail("V138_PLAN131_ZERO_REQUIRES_SIX_CLEAN_MODES")
  return renderEvidence(path.resolve(rootInput), findings, modes)
}

export const writeV138Plan131ReviewForReview = (rootInput: string): void => {
  const root = path.resolve(rootInput)
  assertAbsent(root, [...REVIEW_PATHS, ...EFFECT_PATHS])
  const modes = executeV138Plan131DisposableModesForReview(root)
  const evidence = renderV138Plan131EvidenceForReview(root, modes.findings, modes)
  for (const [repoPath, bytes] of [[OUTPUT_PATHS.payload, Buffer.from(canonical(evidence.payload))],
    [OUTPUT_PATHS.review, evidence.reviewBytes],
    [OUTPUT_PATHS.carrier, Buffer.from(canonical(evidence.carrier))]] as const) {
    mkdirSync(path.dirname(target(root, repoPath)), { recursive: true })
    writeFileSync(target(root, repoPath), bytes, { mode: 0o644, flag: "wx" })
  }
}

const authenticateGenerated = (root: string, committed = false) => {
  const currentBytes = REVIEW_PATHS.map((repoPath) => readNoFollow(root, repoPath))
  let publicationCommit: string | undefined
  if (committed) {
    const commits = git(root, ["log", "--diff-filter=A", "--format=%H", "--", OUTPUT_PATHS.payload])
      .split("\n").filter(Boolean)
    if (commits.length !== 1 || !/^[0-9a-f]{40}$/u.test(commits[0]!)) fail("V138_PLAN131_PUBLICATION_INVALID")
    publicationCommit = commits[0]!
    const head = git(root, ["rev-parse", "HEAD"])
    const isStrictAncestor = spawnSync("/usr/bin/git", ["merge-base", "--is-ancestor", publicationCommit, head],
      { cwd: root }).status === 0
    assertV138Plan131StrictLaterHeadForReview(publicationCommit, head, isStrictAncestor)
    const scope = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", publicationCommit])
      .split("\n").filter(Boolean).sort()
    if (canonical(scope) !== canonical(REVIEW_PATHS.map((repoPath) => `A\t${repoPath}`).sort()))
      fail("V138_PLAN131_PUBLICATION_SCOPE_INVALID")
    if (git(root, ["rev-parse", "HEAD^"]) !== publicationCommit ||
        git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD"]) !== `A\t${OUTPUT_PATHS.summary}`)
      fail("V138_PLAN131_SUMMARY_DESCENDANT_INVALID")
    for (const [index, repoPath] of REVIEW_PATHS.entries()) {
      if (!currentBytes[index]!.equals(gitBytes(root, publicationCommit, repoPath)))
        fail(`V138_PLAN131_PUBLICATION_BYTES_INVALID:${repoPath}`)
      noRewrite(root, publicationCommit, [repoPath])
    }
  }
  const payload = jsonBytes(currentBytes[0]!, "V138_PLAN131_GENERATED_PAYLOAD_INVALID")
  const carrier = jsonBytes(currentBytes[2]!, "V138_PLAN131_GENERATED_CARRIER_INVALID")
  const findings = payload.findings as V138Plan131Finding[]
  const observations = payload.observations as Json[]
  if (!Array.isArray(findings) || findings.length !== payload.findingCount ||
      !Array.isArray(observations) || observations.length !== 6 ||
      payload.observationsRoot !== rooted("v138-plan-262-131-observations-v4", observations) ||
      observations.some((observation) => {
        const { observationRoot, ...body } = observation
        return observation.producerGuardCount !== 0 ||
          observation.disposableLocalNativeSourcesRoot === payload.canonicalLocalNativeSourcesRoot ||
          !Array.isArray(observation.disposableLocalNativeSourcePaths) ||
          observation.disposableLocalNativeSourcePaths.length !== 2 ||
          observationRoot !== rooted("v138-plan-262-131-mode-observation-v4", body)
      })) fail("V138_PLAN131_GENERATED_OBSERVATIONS_INVALID")
  const syntheticModes = { canonicalBefore: deriveCustody(root), actualModesPassed: payload.actualModesPassed,
    findings: Object.freeze(findings), observations: Object.freeze(observations),
    observationsRoot: payload.observationsRoot } as ReturnType<typeof executeV138Plan131DisposableModesForReview>
  const rerendered = renderEvidence(root, findings, syntheticModes)
  if (canonical(payload) !== canonical(rerendered.payload) ||
      !currentBytes[1]!.equals(rerendered.reviewBytes) || canonical(carrier) !== canonical(rerendered.carrier))
    fail("V138_PLAN131_GENERATED_RERENDER_INVALID")
  if (committed) {
    const fresh = executeV138Plan131DisposableModesForReview(root)
    if (fresh.actualModesPassed !== 6 || fresh.findings.length !== 0 || payload.findingCount !== 0 ||
        payload.plan110Eligible !== true || carrier.plan110Eligible !== true ||
        payload.supersededV3Plan110Eligible !== false || carrier.supersededV3Plan110Eligible !== false)
      fail("V138_PLAN131_FRESH_REVIEW_INVALID")
    assertAbsent(root, EFFECT_PATHS)
  }
  return Object.freeze({ publicationCommit, findingCount: payload.findingCount,
    actualModesPassed: payload.actualModesPassed, plan110Eligible: payload.plan110Eligible,
    supersededV3Plan110Eligible: payload.supersededV3Plan110Eligible,
    payloadRoot: payload.payloadRoot, reviewRoot: carrier.reviewRoot, carrierRoot: carrier.carrierRoot,
    authorizesExecution: false as const, createsCapacity: false as const, resetsCounters: false as const,
    authorizationLiteralCreated: false as const, producerCalls: 0 as const,
    readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const, downstreamAuthority: "denied" as const })
}

export const authenticateV138Plan131GeneratedReview = (rootInput: string) =>
  authenticateGenerated(path.resolve(rootInput), false)
export const authenticateV138Plan131PublishedReview = (rootInput: string) =>
  authenticateGenerated(path.resolve(rootInput), true)

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1) fail("V138_PLAN131_ARGUMENTS_INVALID")
  if (args[0] === "--write-review") { writeV138Plan131ReviewForReview(root); return }
  if (args[0] === "--check-generated-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan131GeneratedReview(root))}\n`); return
  }
  if (args[0] === "--check-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan131PublishedReview(root))}\n`); return
  }
  if (args[0] === "--check-observations") {
    process.stdout.write(`${JSON.stringify(executeV138Plan131DisposableModesForReview(root))}\n`); return
  }
  fail("V138_PLAN131_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
