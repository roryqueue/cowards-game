import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync, closeSync, constants, existsSync, fstatSync, lstatSync, mkdirSync,
  mkdtempSync, openSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync,
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
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>
export type V138Plan133Finding = Readonly<{
  code: string
  severity: "critical" | "warning"
  subject: string
  detail: string
}>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const PLAN132_SOURCE = "scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts"
const PLAN132_TEST = "scripts/check-v1-38-plan-262-132-live-v13-custody-v5.test.ts"
const PLAN132_SUMMARY = `${PHASE}/262-132-SUMMARY.md`
const PLAN132_CLEAN_REVIEW = `${PHASE}/262-132-CODE-REVIEW-V3.md`
const PLAN132_SUBJECT = "52d35eb88db55e31d7203abb64735d12a53bbcf3"
const PLAN132_TREE = "a62b646a89079729f0b65f79d21e48e29bd30cd2"
const PLAN132_PARENT = "26ffbcd9f13861533f6782c4da184eef583960dd"
const PLAN132_SOURCE_BLOB = "825772873b7feb81b0ccf19acbb27435b12b6a03"
const PLAN132_TEST_BLOB = "a974a881b7cecba0fcdb3a4490cbe148948e02aa"
const PLAN132_SOURCE_SHA = "sha256:95dc05e015d4f0fb94766469072ab7780e46fe94d05c558f3a0e46737cde6188"
const PLAN132_TEST_SHA = "sha256:bee16865276c18f88a88aee19538660ab64dfceaaa14e6d510969502727a771f"
const PLAN132_CLOSEOUT = "3932bfee47ef6316fcaba59182960a831ef455a0"
const PLAN132_CLOSEOUT_TREE = "85390c136606e2ade0cca0043c5fa4f35822f3ef"
const PLAN132_SUMMARY_BLOB = "e388e086fb55dbee4655007b15df6701c51e5249"
const PLAN132_SUMMARY_SHA = "sha256:681f543a17261cc50f2056995e6b19539249665ebb777b1b1fa854b4ecd486c5"
const PLAN132_CLEAN_REVIEW_COMMIT = "2c6c73fbe6ba2f1796853f421c1eeb2debaf813a"
const PLAN132_CLEAN_REVIEW_TREE = "5dd43460ecff656bb8e7f9b3bb1e1c66f9d50360"
const PLAN132_CLEAN_REVIEW_BLOB = "42b07044cbcf795e4e481054f221d8ebf0172d9c"
const PLAN132_CLEAN_REVIEW_SHA = "sha256:f7b098f4c404847e244c1c9d5363437ad2964b38f5550546a0128b1e583daec1"
const PLAN131_REVIEW = "f45ee38d529ba79d63e0b54995ed90d947811dd4"
const PLAN131_REVIEW_TREE = "9592d1ccbad47e7ef58957c25321eac7c41deb0b"
const PLAN131_REVIEW_PARENT = "ca21e28b8dc7c9de4c1691d03601c95ef473ffe3"
const PLAN131_REVIEW_PATH = `${PHASE}/262-131-CODE-REVIEW.md`
const PLAN131_REVIEW_BLOB = "94c76818f17cc473d36acf4946a834c78e210540"
const PLAN131_REVIEW_SHA = "sha256:dee7fd56dedaf18f758a3b7b9a5797c9d3698a31036baa2b0770e492b18b0936"
const V4_PUBLICATION = "b80782214eeb323023287b4589049f0139befdd5"
const V4_SUMMARY = "6a82901a8e73a4c2b8be92ba1b8d606919678784"
const V4_SUMMARY_PATH = `${PHASE}/262-131-SUMMARY.md`
const V4_SUMMARY_BLOB = "53e9fea0967f4886ee31479d11f3db56382396ba"
const V4_SUMMARY_SHA = "sha256:56b91ace004ce601f48d677264fde925518fa5d910c6dcf49e5eac64cb74a0f9"
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
const V3_PUBLICATION = "65a7a246627a411c45ced95bfb3c0296f0f8e4eb"
const V3_CLOSEOUT = "2bbd45f85500b052022c81fda8c1c8a1c6536b1b"
const V3_REVIEW = "73d1be605aa68a7789c53ce78b20f4922b8b7cec"
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
const B331 = "b331baad29053f523233558f66aa2855f2925b2b"
const LIVE_SUBJECT = "3882cd5d3ec7a834e1de88254dd0daf955da12aa"
const LIVE_SOURCE = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts"
const LIVE_TEST = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.test.ts"
const LIVE_SOURCE_BLOB = "0d299dc98c3af22d6a2312a7bdc6062538bc1cd9"
const LIVE_SOURCE_SHA = "sha256:059fe04ce2f3a51db4636bd3bc0553cc6882c3095afd240f15a94e267f83e7bd"

const OUTPUT = Object.freeze({
  payload: ".planning/artifacts/v1.38-plan-262-133-live-v13-custody-review-payload-v5.json",
  review: `${PHASE}/262-133-REVIEW-v5.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-133-live-v13-custody-review-carrier-v5.json",
  summary: `${PHASE}/262-133-SUMMARY.md`,
})
const REVIEW_PATHS = Object.freeze([OUTPUT.payload, OUTPUT.review, OUTPUT.carrier])
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
const CHECKOUT_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
  LIVE_SOURCE,
  LIVE_TEST,
] as const)
const LOCAL_NATIVE_PATHS = Object.freeze([
  "scripts/native/v1-38-successor-transaction-helper-v6.c",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
] as const)
const MODES = Object.freeze([
  ["--check-source-only", "source_only_checked"],
  ["--check-prospective-custody", "prospective_custody_checked"],
  ["--check-post-run-custody", "post_run_no_effect_custody_checked"],
  ["--check-non-pass-value", "bounded_non_pass_value_checked"],
  ["--check-bounded-success-value", "bounded_success_value_checked"],
  ["--check-exact-reproduction-v17-value", "exact_reproduction_v17_value_checked"],
] as const)
const NO_EFFECT = Object.freeze({ downstreamAuthority: "denied", freshAccepted: 0,
  freshCharged: 0, liveInvoked: false, producerCalls: 0, readinessInvoked: false })
const REDUCED = Object.freeze([
  NO_EFFECT, NO_EFFECT, NO_EFFECT,
  Object.freeze({ classification: "non_pass", reproductionEligible: false }),
  Object.freeze({ classification: "bounded_success", reproductionEligible: true }),
  Object.freeze({ acceptedCells: 540, exact: true, requiredAccepted: 540 }),
] as const)
const OBSERVATION_KEYS = Object.freeze([
  "disposableLocalExecutionClosureRoot", "disposableLocalGitObjectRoot",
  "disposableLocalInstalledClosureRoot", "disposableLocalNativeSourcePaths",
  "disposableLocalNativeSourcesRoot", "disposableReviewedClosureRoot", "mode",
  "observationRoot", "producerGuardCount", "reducedValue", "status",
].sort())

export const V138_PLAN133_B331_SCOPE = Object.freeze([
  `A\t${PHASE}/262-120-SUMMARY.md`,
  `A\t${PHASE}/262-93-SUMMARY.md`,
  "M\t.planning/ROADMAP.md", "M\t.planning/STATE.md",
  `M\t${PHASE}/262-110-PLAN.md`, `M\t${PHASE}/262-122-PLAN.md`,
  `M\t${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`,
].sort())
export const V138_PLAN133_PUBLICATION_SCOPE = Object.freeze(
  V4_PATHS.map((repoPath) => `A\t${repoPath}`).sort(),
)
export const V138_PLAN133_SUMMARY_SCOPE = Object.freeze([`A\t${V4_SUMMARY_PATH}`])

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item) ? item.map(normalize)
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
const exactKeys = (value: Json, expected: readonly string[]): boolean =>
  canonical(Object.keys(value).sort()) === canonical([...expected].sort())
const isSha = (value: unknown): value is Sha =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const git = (root: string, args: readonly string[]): string => runV138RetryV3IsolatedGit(root, args)
const gitBytes = (root: string, args: readonly string[]): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, args)
const present = (root: string, repoPath: string): boolean => {
  try { lstatSync(target(root, repoPath)); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
    throw error
  }
}
const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (present(root, repoPath))
    fail(`V138_PLAN133_FORBIDDEN_PRESENT:${repoPath}`)
}
const readNoFollow = (root: string, repoPath: string, expectedMode = 0o644): Buffer => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target(root, repoPath), constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor)
    if (!before.isFile() || (before.mode & 0o7777) !== expectedMode || before.size > 8 * 1024 * 1024)
      fail(`V138_PLAN133_CURRENT_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_PLAN133_CURRENT_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN133_")) throw error
    fail(`V138_PLAN133_CURRENT_ENTRY_INVALID:${repoPath}`)
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
const assertPathAbsent = (absolute: string, code: string): void => {
  try { lstatSync(absolute); fail(code) }
  catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error
  }
}
const assertRepositoryMetadataSafe = (root: string): void => {
  const config = git(root, ["config", "--local", "--list"])
  if (/(?:^|\n)(?:core\.(?:hookspath|worktree|gitdir|fsmonitor|sshcommand|autocrlf|eol|safecrlf|attributesfile|symlinks)|extensions\.objectformat|include\.|filter\.|url\..*\.insteadof|protocol\.|alias\.)=/iu.test(config))
    fail("V138_PLAN133_REPOSITORY_CONFIG_FORBIDDEN")
  if (git(root, ["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "")
    fail("V138_PLAN133_REPLACE_REF_FORBIDDEN")
  assertPathAbsent(git(root, ["rev-parse", "--path-format=absolute", "--git-path", "info/grafts"]),
    "V138_PLAN133_GRAFTS_FORBIDDEN")
  assertPathAbsent(git(root, ["rev-parse", "--path-format=absolute", "--git-path", "shallow"]),
    "V138_PLAN133_SHALLOW_HISTORY_FORBIDDEN")
}
type HistoryView = Readonly<{ root: string; head: string
  git: (args: readonly string[]) => string
  gitBytes: (args: readonly string[]) => Buffer
  dispose: () => void }>
const createHistoryView = (rootInput: string, headRef = "HEAD"): HistoryView => {
  const root = path.resolve(rootInput)
  assertRepositoryMetadataSafe(root)
  const top = realpathSync(git(root, ["rev-parse", "--show-toplevel"]))
  const common = realpathSync(git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]))
  const objects = realpathSync(path.join(common, "objects"))
  const head = git(root, ["rev-parse", "--verify", `${headRef}^{commit}`])
  if (top !== realpathSync(root) || !/^[0-9a-f]{40}$/u.test(head))
    fail("V138_PLAN133_REPOSITORY_IDENTITY_INVALID")
  assertPathAbsent(path.join(objects, "info", "alternates"),
    "V138_PLAN133_OBJECT_ALTERNATES_FORBIDDEN")
  assertRepositoryMetadataSafe(root)
  const snapshot = mkdtempSync(path.join(tmpdir(), "v138-plan133-metadata-"))
  try {
    mkdirSync(path.join(snapshot, "objects", "info"), { recursive: true, mode: 0o700 })
    mkdirSync(path.join(snapshot, "refs", "heads"), { recursive: true, mode: 0o700 })
    writeFileSync(path.join(snapshot, "config"),
      "[core]\n\trepositoryformatversion = 0\n\tbare = true\n", { mode: 0o600 })
    writeFileSync(path.join(snapshot, "HEAD"), `${head}\n`, { mode: 0o600 })
    writeFileSync(path.join(snapshot, "objects", "info", "alternates"), `${objects}\n`, { mode: 0o600 })
    const snapshotGit = (args: readonly string[]) => git(snapshot, [`--git-dir=${snapshot}`, ...args])
    const snapshotBytes = (args: readonly string[]) => gitBytes(snapshot,
      [`--git-dir=${snapshot}`, ...args])
    if (snapshotGit(["rev-parse", "--verify", `${head}^{commit}`]) !== head)
      fail("V138_PLAN133_HISTORY_SNAPSHOT_INVALID")
    return Object.freeze({ root: snapshot, head, git: snapshotGit, gitBytes: snapshotBytes,
      dispose: () => rmSync(snapshot, { recursive: true, force: true }) })
  } catch (error) {
    rmSync(snapshot, { recursive: true, force: true })
    throw error
  }
}
const isAncestor = (history: HistoryView, ancestor: string, descendant: string): boolean => {
  try { history.git(["merge-base", "--is-ancestor", ancestor, descendant]); return true }
  catch { return false }
}
export const assertV138Plan133StrictDescendantForReview = (
  ancestor: string, descendant: string, ancestry: boolean,
): true => {
  if (!/^[0-9a-f]{40}$/u.test(ancestor) || !/^[0-9a-f]{40}$/u.test(descendant) ||
      ancestor === descendant || !ancestry) fail("V138_PLAN133_HEAD_NOT_STRICT_DESCENDANT")
  return true
}
export const assertV138Plan133ExactScopeForReview = (
  actualInput: readonly string[], expectedInput: readonly string[],
  label: "B331" | "PUBLICATION" | "SUMMARY",
) => {
  const actual = [...actualInput].sort()
  if (canonical(actual) !== canonical([...expectedInput].sort()))
    fail(`V138_PLAN133_${label}_SCOPE_INVALID`)
  return Object.freeze(actual)
}
const exactFile = (history: HistoryView, root: string, commit: string, repoPath: string,
  blob: string, expectedSha: Sha, current = true): Buffer => {
  if (history.git(["ls-tree", commit, "--", repoPath]) !== `100644 blob ${blob}\t${repoPath}`)
    fail(`V138_PLAN133_COMMITTED_ENTRY_INVALID:${repoPath}`)
  const bytes = history.gitBytes(["cat-file", "blob", `${commit}:${repoPath}`])
  if (sha(bytes) !== expectedSha) fail(`V138_PLAN133_COMMITTED_BYTES_INVALID:${repoPath}`)
  if (history.git(["log", "--format=%H", `${commit}..${history.head}`, "--", repoPath]) !== "")
    fail(`V138_PLAN133_PROTECTED_REWRITE:${repoPath}`)
  if (current && !readNoFollow(root, repoPath).equals(bytes))
    fail(`V138_PLAN133_CURRENT_BYTES_INVALID:${repoPath}`)
  return bytes
}
const exactScope = (history: HistoryView, commit: string, expected: readonly string[],
  label: "B331" | "PUBLICATION" | "SUMMARY"): void => {
  assertV138Plan133ExactScopeForReview(history.git(
    ["diff-tree", "--no-commit-id", "--name-status", "-r", commit]).split("\n").filter(Boolean),
  expected, label)
}

const authenticateV3InvalidHistory = (history: HistoryView, root: string) => {
  const expected = V3_PATHS.map((repoPath) => `A\t${repoPath}`).sort()
  const actual = history.git(["diff-tree", "--no-commit-id", "--name-status", "-r", V3_PUBLICATION])
    .split("\n").filter(Boolean).sort()
  if (canonical(actual) !== canonical(expected)) fail("V138_PLAN133_V3_SCOPE_INVALID")
  for (const [index, repoPath] of V3_PATHS.entries()) {
    if (history.git(["ls-tree", V3_PUBLICATION, "--", repoPath]) !==
        `100644 blob ${V3_BLOBS[index]}\t${repoPath}`)
      fail(`V138_PLAN133_V3_ENTRY_INVALID:${repoPath}`)
    if (history.git(["log", "--format=%H", `${V3_PUBLICATION}..${history.head}`, "--", repoPath]) !== "")
      fail(`V138_PLAN133_V3_REWRITE:${repoPath}`)
  }
  for (const commit of [V3_PUBLICATION, V3_CLOSEOUT, V3_REVIEW])
    assertV138Plan133StrictDescendantForReview(commit, history.head,
      isAncestor(history, commit, history.head))
  const payload = jsonBytes(history.gitBytes(["cat-file", "blob", `${V3_PUBLICATION}:${V3_PATHS[1]}`]),
    "V138_PLAN133_V3_PAYLOAD_INVALID")
  const carrier = jsonBytes(history.gitBytes(["cat-file", "blob", `${V3_PUBLICATION}:${V3_PATHS[0]}`]),
    "V138_PLAN133_V3_CARRIER_INVALID")
  if (payload.plan110Eligible !== true || carrier.plan110Eligible !== true ||
      payload.findingCount !== 0 || payload.actualModesPassed !== 6)
    fail("V138_PLAN133_V3_STORED_SEMANTICS_INVALID")
  return Object.freeze({ publicationCommit: V3_PUBLICATION, closeoutCommit: V3_CLOSEOUT,
    reviewCommit: V3_REVIEW, disposition: "process_invalid_false_clean_custody" as const,
    storedPlan110Eligible: true as const, currentPlan110Eligible: false as const,
    payloadRoot: payload.payloadRoot as Sha, reviewRoot: carrier.reviewRoot as Sha,
    carrierRoot: carrier.carrierRoot as Sha })
}

const inspectCorrectedSource = (source: string): void => {
  if (sha(source) !== PLAN132_SOURCE_SHA) fail("V138_PLAN133_PLAN132_SOURCE_BYTES_INVALID")
  const file = ts.createSourceFile("plan132.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const identifiers = new Map<string, number>()
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) identifiers.set(node.text, (identifiers.get(node.text) ?? 0) + 1)
    ts.forEachChild(node, visit)
  }
  visit(file)
  for (const required of ["createIsolatedHistoryView", "validateAuthenticatedObservations",
    "assertV138Plan132StrictSummaryDescendantForReview", "validateV138Plan132ObservationsForReview"])
    if ((identifiers.get(required) ?? 0) < 1) fail(`V138_PLAN133_PLAN132_SOURCE_AST_INVALID:${required}`)
  if (!source.includes("mkdtempSync(path.join(tmpdir(), \"v138-plan132-metadata-\"))") ||
      !source.includes("canonical(observation) !== canonical(authenticatedPayload.observations[index])") ||
      !source.includes("!exactKeys(input, [\"findings\", \"observations\"])") ||
      !source.includes("history.dispose()")) fail("V138_PLAN133_PLAN132_CORRECTIONS_MISSING")
}

export const authenticateV138Plan133Plan132SourceForReview = (
  rootInput: string, headRef = "HEAD",
) => {
  const root = path.resolve(rootInput)
  const history = createHistoryView(root, headRef)
  try {
    for (const commit of [V4_SUMMARY, PLAN132_SUBJECT, PLAN132_CLOSEOUT,
      PLAN132_CLEAN_REVIEW_COMMIT])
      assertV138Plan133StrictDescendantForReview(commit, history.head,
        isAncestor(history, commit, history.head))
    if (history.git(["rev-parse", `${PLAN132_SUBJECT}^{tree}`]) !== PLAN132_TREE ||
        history.git(["rev-parse", `${PLAN132_SUBJECT}^`]) !== PLAN132_PARENT ||
        history.git(["rev-parse", `${PLAN132_CLOSEOUT}^{tree}`]) !== PLAN132_CLOSEOUT_TREE ||
        history.git(["rev-parse", `${PLAN132_CLOSEOUT}^`]) !== PLAN132_SUBJECT ||
        history.git(["rev-parse", `${PLAN132_CLEAN_REVIEW_COMMIT}^{tree}`]) !== PLAN132_CLEAN_REVIEW_TREE ||
        history.git(["rev-parse", `${PLAN132_CLEAN_REVIEW_COMMIT}^`]) !== PLAN132_CLOSEOUT)
      fail("V138_PLAN133_PLAN132_LINEAGE_INVALID")
    const sourceScope = history.git(["diff-tree", "--no-commit-id", "--name-status", "-r", PLAN132_SUBJECT])
    if (sourceScope !== `M\t${PLAN132_SOURCE}`) fail("V138_PLAN133_PLAN132_SUBJECT_SCOPE_INVALID")
    const closeoutScope = history.git(["diff-tree", "--no-commit-id", "--name-status", "-r", PLAN132_CLOSEOUT])
      .split("\n").filter(Boolean).sort()
    if (canonical(closeoutScope) !== canonical([
      "M\t.planning/ROADMAP.md", "M\t.planning/STATE.md", `M\t${PLAN132_SUMMARY}`,
    ].sort())) fail("V138_PLAN133_PLAN132_CLOSEOUT_SCOPE_INVALID")
    if (history.git(["diff-tree", "--no-commit-id", "--name-status", "-r", PLAN132_CLEAN_REVIEW_COMMIT]) !==
        `A\t${PLAN132_CLEAN_REVIEW}`) fail("V138_PLAN133_PLAN132_REVIEW_SCOPE_INVALID")
    const source = exactFile(history, root, PLAN132_SUBJECT, PLAN132_SOURCE,
      PLAN132_SOURCE_BLOB, PLAN132_SOURCE_SHA)
    exactFile(history, root, PLAN132_SUBJECT, PLAN132_TEST, PLAN132_TEST_BLOB, PLAN132_TEST_SHA)
    exactFile(history, root, PLAN132_CLOSEOUT, PLAN132_SUMMARY,
      PLAN132_SUMMARY_BLOB, PLAN132_SUMMARY_SHA)
    exactFile(history, root, PLAN132_CLEAN_REVIEW_COMMIT, PLAN132_CLEAN_REVIEW,
      PLAN132_CLEAN_REVIEW_BLOB, PLAN132_CLEAN_REVIEW_SHA)
    inspectCorrectedSource(source.toString("utf8"))
    if (history.git(["rev-parse", `${PLAN131_REVIEW}^{tree}`]) !== PLAN131_REVIEW_TREE ||
        history.git(["rev-parse", `${PLAN131_REVIEW}^`]) !== PLAN131_REVIEW_PARENT)
      fail("V138_PLAN133_PLAN131_REVIEW_LINEAGE_INVALID")
    exactFile(history, root, PLAN131_REVIEW, PLAN131_REVIEW_PATH,
      PLAN131_REVIEW_BLOB, PLAN131_REVIEW_SHA)
    exactScope(history, B331, V138_PLAN133_B331_SCOPE, "B331")
    exactScope(history, V4_PUBLICATION, V138_PLAN133_PUBLICATION_SCOPE, "PUBLICATION")
    exactScope(history, V4_SUMMARY, V138_PLAN133_SUMMARY_SCOPE, "SUMMARY")
    if (history.git(["rev-parse", `${V4_SUMMARY}^`]) !== V4_PUBLICATION)
      fail("V138_PLAN133_V4_SUMMARY_PARENT_INVALID")
    const v4Bytes = V4_PATHS.map((repoPath, index) => exactFile(history, root, V4_PUBLICATION,
      repoPath, V4_BLOBS[index]!, V4_SHAS[index]!))
    exactFile(history, root, V4_SUMMARY, V4_SUMMARY_PATH, V4_SUMMARY_BLOB, V4_SUMMARY_SHA)
    const v4Payload = jsonBytes(v4Bytes[1]!, "V138_PLAN133_V4_PAYLOAD_INVALID")
    const v4Carrier = jsonBytes(v4Bytes[0]!, "V138_PLAN133_V4_CARRIER_INVALID")
    if (v4Payload.findingCount !== 0 || v4Payload.actualModesPassed !== 6 ||
        v4Payload.plan110Eligible !== true || v4Carrier.plan110Eligible !== true)
      fail("V138_PLAN133_V4_STORED_SEMANTICS_INVALID")
    const v3 = authenticateV3InvalidHistory(history, root)
    return Object.freeze({ subjectCommit: PLAN132_SUBJECT, subjectTree: PLAN132_TREE,
      subjectParent: PLAN132_PARENT, sourceBlob: PLAN132_SOURCE_BLOB, testBlob: PLAN132_TEST_BLOB,
      sourceSha256: PLAN132_SOURCE_SHA, testSha256: PLAN132_TEST_SHA,
      closeoutCommit: PLAN132_CLOSEOUT, cleanReviewCommit: PLAN132_CLEAN_REVIEW_COMMIT,
      reviewCommit: PLAN131_REVIEW, v4PublicationCommit: V4_PUBLICATION,
      v4SummaryCommit: V4_SUMMARY, v4Payload, v4Carrier,
      v4Disposition: "process_invalid_descendant_and_observation_validation" as const,
      v4StoredPlan110Eligible: true as const, supersededV4Plan110Eligible: false as const,
      v3, headCommit: history.head })
  } finally { history.dispose() }
}

const inspectLiveSource = (source: string): void => {
  if (sha(source) !== LIVE_SOURCE_SHA) fail("V138_PLAN133_LIVE_SOURCE_BYTES_INVALID")
  const file = ts.createSourceFile("live-v13.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let imports = 0; let references = 0; let calls = 0
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text === "./run-v1-38-bounded-retry-envelope-v3.js") imports += 1
    if (ts.isIdentifier(node) && node.text === "runV138V3ProductionLive") references += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138V3ProductionLive") calls += 1
    ts.forEachChild(node, visit)
  }
  visit(file)
  if (imports !== 1 || references !== 2 || calls !== 1) fail("V138_PLAN133_LIVE_SOURCE_AST_INVALID")
}
const computeNativeCustody = (rootInput: string) => {
  const root = realpathSync(rootInput)
  const paths = LOCAL_NATIVE_PATHS.map((repoPath) => target(root, repoPath))
  return Object.freeze({ paths: Object.freeze(paths),
    root: sha(canonical(paths.map((absolute) => [absolute, sha(readFileSync(absolute))] as const))) })
}
const deriveCustody = (root: string): V138PathStableCustody => {
  const imported = deriveV138PathStableCustody(root, { sourceCommit: LIVE_SUBJECT,
    checkoutPaths: CHECKOUT_PATHS })
  const native = computeNativeCustody(root)
  const body = { reviewedClosureRoot: imported.reviewedClosureRoot,
    localInstalledClosureRoot: imported.localInstalledClosureRoot,
    localGitObjectRoot: imported.localGitObjectRoot,
    localNativeSourcesRoot: native.root }
  const custody = Object.freeze({ ...imported, ...body,
    localExecutionClosureRoot: computeV138PathStableLocalExecutionClosureRoot(body) })
  checkV138PathStableCustodyForReview(custody, custody)
  return custody
}
const authenticateExactHistory = (root: string): void => {
  authenticateV138Plan133Plan132SourceForReview(root)
  const history = createHistoryView(root)
  try {
    if (history.git(["ls-tree", LIVE_SUBJECT, "--", LIVE_SOURCE]) !==
        `100644 blob ${LIVE_SOURCE_BLOB}\t${LIVE_SOURCE}`)
      fail("V138_PLAN133_LIVE_SOURCE_ENTRY_INVALID")
    const bytes = history.gitBytes(["cat-file", "blob", `${LIVE_SUBJECT}:${LIVE_SOURCE}`])
    if (sha(bytes) !== LIVE_SOURCE_SHA || !readNoFollow(root, LIVE_SOURCE).equals(bytes) ||
        history.git(["log", "--format=%H", `${LIVE_SUBJECT}..${history.head}`, "--", LIVE_SOURCE]) !== "")
      fail("V138_PLAN133_LIVE_SOURCE_CUSTODY_INVALID")
    inspectLiveSource(bytes.toString("utf8"))
  } finally { history.dispose() }
}
const reauthenticateCanonical = (root: string, expected: V138PathStableCustody) => {
  authenticateExactHistory(root)
  checkV138PathStableCustodyForReview(expected, expected)
  const native = computeNativeCustody(root)
  if (native.root !== expected.localNativeSourcesRoot ||
      computeV138PathStableLocalExecutionClosureRoot({
        reviewedClosureRoot: expected.reviewedClosureRoot,
        localInstalledClosureRoot: expected.localInstalledClosureRoot,
        localGitObjectRoot: expected.localGitObjectRoot,
        localNativeSourcesRoot: native.root,
      }) !== expected.localExecutionClosureRoot)
    fail("V138_PLAN133_CANONICAL_CUSTODY_CHANGED")
  return expected
}
const deriveDisposableCustody = (rootInput: string, canonicalCustody: V138PathStableCustody,
  canonicalRoot: string): V138PathStableCustody => {
  const root = realpathSync(rootInput)
  if (git(root, ["rev-parse", "HEAD"]) !== LIVE_SUBJECT) fail("V138_PLAN133_DISPOSABLE_HEAD_INVALID")
  for (const repoPath of CHECKOUT_PATHS) {
    const entry = git(root, ["ls-tree", LIVE_SUBJECT, "--", repoPath])
    const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
    if (match === null || match[3] !== repoPath ||
        git(root, ["hash-object", "--no-filters", "--", repoPath]) !== match[2])
      fail(`V138_PLAN133_DISPOSABLE_CHECKOUT_INVALID:${repoPath}`)
  }
  if (realpathSync(path.join(root, "node_modules")) !== realpathSync(path.join(canonicalRoot, "node_modules")))
    fail("V138_PLAN133_DISPOSABLE_INSTALLED_INPUT_INVALID")
  const common = realpathSync(path.resolve(root, git(root, ["rev-parse", "--git-common-dir"])))
  const objects = realpathSync(path.join(common, "objects")); const status = statSync(objects)
  const localGitObjectRoot = sha(`${objects}\0${status.dev}\0${status.ino}`)
  const native = computeNativeCustody(root)
  const body = { reviewedClosureRoot: canonicalCustody.reviewedClosureRoot,
    localInstalledClosureRoot: canonicalCustody.localInstalledClosureRoot,
    localGitObjectRoot, localNativeSourcesRoot: native.root }
  const custody = Object.freeze({ ...canonicalCustody, ...body,
    localExecutionClosureRoot: computeV138PathStableLocalExecutionClosureRoot(body) })
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
    mkdirSync(path.dirname(destination), { recursive: true }); symlinkSync(source, destination, "dir")
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
  if (index === 2 || index === 3) return {
    expression: `subject.checkV138LiveV13PostRunOutputCustodyForReview(${JSON.stringify(nonPass)})`,
    expected: deriveV138Plan114IndependentPostSemantics(nonPass as never) }
  if (index === 4) return {
    expression: `subject.checkV138LiveV13PostRunOutputCustodyForReview(${JSON.stringify(success)})`,
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

const trustedModes = new WeakSet<object>()
export const executeV138Plan133DisposableObservationsForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  authenticateExactHistory(root); assertAbsent(root, EFFECT_PATHS)
  const canonicalBefore = deriveCustody(root)
  const findings: V138Plan133Finding[] = []; const observations: Json[] = []
  for (const [index, [mode, expectedStatus]] of MODES.entries()) {
    reauthenticateCanonical(root, canonicalBefore)
    const owner = mkdtempSync(path.join(tmpdir(), `v138-plan133-mode-${index}-`))
    const linked = path.join(owner, "repo"); const guardPath = path.join(owner, "producer-guard.jsonl")
    let added = false
    try {
      git(root, ["worktree", "add", "--quiet", "--detach", linked, LIVE_SUBJECT]); added = true
      linkDependencies(root, linked)
      const disposable = deriveDisposableCustody(linked, canonicalBefore, root)
      const native = computeNativeCustody(linked)
      if (disposable.reviewedClosureRoot !== canonicalBefore.reviewedClosureRoot ||
          native.paths.some((entry) => !entry.startsWith(`${realpathSync(linked)}/`)) ||
          native.root !== disposable.localNativeSourcesRoot ||
          native.root === canonicalBefore.localNativeSourcesRoot)
        fail(`V138_PLAN133_DISPOSABLE_CUSTODY_INVALID:${mode}`)
      chmodSync(target(linked, ".planning/artifacts/v1.38-successor-source-seal-v13.json"), 0o600)
      chmodSync(target(linked, ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json"), 0o600)
      const source = readNoFollow(linked, LIVE_SOURCE).toString("utf8"); inspectLiveSource(source)
      const aliased = source.replace("  runV138V3ProductionLive,\n",
        "  runV138V3ProductionLive as importedRunV138V3ProductionLive,\n")
      const guarded = aliased.replace("type Sha = `sha256:${string}`",
        `import { appendFileSync as appendV138Plan133Guard } from "node:fs"\nconst runV138V3ProductionLive: typeof importedRunV138V3ProductionLive = async (..._args) => { appendV138Plan133Guard(${JSON.stringify(guardPath)}, "invoked\\n", { mode: 0o600 }); throw new Error("V138_PLAN133_PRODUCER_GUARD_TRIPPED") }\n\ntype Sha = \`sha256:\${string}\``)
      if (aliased === source || guarded === aliased) fail("V138_PLAN133_GUARD_INSTRUMENTATION_INVALID")
      const guardedPath = target(linked, "scripts/.plan133-live-v13-guarded.ts")
      writeFileSync(guardedPath, guarded, { mode: 0o600, flag: "wx" })
      let reducedValue: Json; let valid = true
      if (index < 2) {
        const result = spawnSync(target(linked, "node_modules/.bin/tsx"),
          [path.relative(linked, guardedPath), mode], { cwd: linked, encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"], env: { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
            HOME: owner, LANG: "C", LC_ALL: "C" } })
        if (result.status !== 0) { valid = false; reducedValue = { detail: result.stderr.trim() } }
        else {
          const value = JSON.parse(result.stdout.trim()) as Json
          valid = value.status === expectedStatus && value.producerCalls === 0 &&
            value.readinessInvoked === false && value.liveInvoked === false &&
            value.freshCharged === 0 && value.freshAccepted === 0 &&
            value.downstreamAuthority === "denied"
          reducedValue = { producerCalls: value.producerCalls, readinessInvoked: value.readinessInvoked,
            liveInvoked: value.liveInvoked, freshCharged: value.freshCharged,
            freshAccepted: value.freshAccepted, downstreamAuthority: value.downstreamAuthority }
        }
      } else {
        const fixture = reducedFixture(index); const runner = target(linked, `scripts/.plan133-mode-${index}.ts`)
        writeFileSync(runner,
          `import * as subject from ${JSON.stringify(pathToFileURL(guardedPath).href)}; const value=${fixture.expression}; process.stdout.write(JSON.stringify(value));`,
          { mode: 0o600, flag: "wx" })
        const result = spawnSync(target(linked, "node_modules/.bin/tsx"), [runner], {
          cwd: linked, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
          env: { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: owner,
            LANG: "C", LC_ALL: "C" } })
        if (result.status !== 0) { valid = false; reducedValue = { detail: result.stderr.trim() } }
        else {
          const value = JSON.parse(result.stdout.trim()) as Json
          valid = canonical(value) === canonical(fixture.expected)
          reducedValue = index === 2 ? { ...NO_EFFECT }
            : index === 3 ? { classification: "non_pass", reproductionEligible: false }
            : index === 4 ? { classification: "bounded_success", reproductionEligible: true }
            : { acceptedCells: 540, requiredAccepted: 540, exact: true }
        }
      }
      const producerGuardCount = existsSync(guardPath)
        ? readFileSync(guardPath, "utf8").split("\n").filter(Boolean).length : 0
      if (producerGuardCount !== 0 || EFFECT_PATHS.some((repoPath) => present(linked, repoPath))) valid = false
      if (!valid) findings.push({ code: `MODE_${index + 1}_FAILED`, severity: "critical",
        subject: mode, detail: canonical(reducedValue).trim() })
      const body = Object.freeze({ mode, status: valid ? expectedStatus : "failed",
        producerGuardCount, reducedValue,
        disposableReviewedClosureRoot: disposable.reviewedClosureRoot,
        disposableLocalInstalledClosureRoot: disposable.localInstalledClosureRoot,
        disposableLocalGitObjectRoot: disposable.localGitObjectRoot,
        disposableLocalNativeSourcesRoot: disposable.localNativeSourcesRoot,
        disposableLocalNativeSourcePaths: native.paths,
        disposableLocalExecutionClosureRoot: disposable.localExecutionClosureRoot })
      observations.push(Object.freeze({ ...body,
        observationRoot: rooted("v138-plan-262-133-mode-observation-v5", body) }))
    } finally {
      if (added) git(root, ["worktree", "remove", "--force", linked])
      rmSync(owner, { recursive: true, force: true })
    }
    reauthenticateCanonical(root, canonicalBefore)
  }
  const canonicalAfter = reauthenticateCanonical(root, canonicalBefore)
  const sorted = [...findings].sort((a, b) => `${a.code}\0${a.subject}\0${a.detail}`
    .localeCompare(`${b.code}\0${b.subject}\0${b.detail}`))
  const result = Object.freeze({ canonicalBefore, canonicalAfter,
    observations: Object.freeze(observations), findings: Object.freeze(sorted),
    actualModesPassed: observations.filter(({ status }) => status !== "failed").length,
    observationsRoot: rooted("v138-plan-262-133-observations-v5", observations),
    producerCalls: 0 as const, readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const, authorizesExecution: false as const,
    downstreamAuthority: "denied" as const })
  trustedModes.add(result)
  return result
}

export const validateV138Plan133ObservationsForReview = (
  rootInput: string, observationsInput: unknown, canonicalCustody: V138PathStableCustody,
) => {
  const root = path.resolve(rootInput)
  if (!Array.isArray(observationsInput) || observationsInput.length !== MODES.length)
    fail("V138_PLAN133_OBSERVATIONS_INVALID")
  const observations = observationsInput as Json[]; const seenModes = new Set<string>()
  const seenRoots = new Set<string>()
  for (const [index, observation] of observations.entries()) {
    if (observation === null || typeof observation !== "object" || Array.isArray(observation) ||
        !exactKeys(observation, OBSERVATION_KEYS)) fail("V138_PLAN133_OBSERVATIONS_INVALID")
    const [mode, status] = MODES[index]!
    if (observation.mode !== mode || observation.status !== status || seenModes.has(mode) ||
        seenRoots.has(observation.observationRoot) || observation.producerGuardCount !== 0 ||
        canonical(observation.reducedValue) !== canonical(REDUCED[index]))
      fail("V138_PLAN133_OBSERVATIONS_INVALID")
    seenModes.add(mode); seenRoots.add(observation.observationRoot)
    const roots = [observation.disposableReviewedClosureRoot,
      observation.disposableLocalInstalledClosureRoot, observation.disposableLocalGitObjectRoot,
      observation.disposableLocalNativeSourcesRoot, observation.disposableLocalExecutionClosureRoot,
      observation.observationRoot]
    if (roots.some((value) => !isSha(value)) ||
        observation.disposableReviewedClosureRoot !== canonicalCustody.reviewedClosureRoot ||
        observation.disposableLocalInstalledClosureRoot !== canonicalCustody.localInstalledClosureRoot ||
        observation.disposableLocalGitObjectRoot !== canonicalCustody.localGitObjectRoot ||
        observation.disposableLocalNativeSourcesRoot === canonicalCustody.localNativeSourcesRoot ||
        !Array.isArray(observation.disposableLocalNativeSourcePaths) ||
        observation.disposableLocalNativeSourcePaths.length !== LOCAL_NATIVE_PATHS.length)
      fail("V138_PLAN133_OBSERVATIONS_INVALID")
    const paths = observation.disposableLocalNativeSourcePaths as unknown[]
    let disposableRoot: string | undefined
    for (const [nativeIndex, absolute] of paths.entries()) {
      const suffix = LOCAL_NATIVE_PATHS[nativeIndex]!
      if (typeof absolute !== "string" || !path.isAbsolute(absolute) ||
          path.normalize(absolute) !== absolute || !absolute.endsWith(suffix))
        fail("V138_PLAN133_OBSERVATIONS_INVALID")
      const candidateRoot = absolute.slice(0, -suffix.length)
      if (!candidateRoot.endsWith("/repo/") ||
          !candidateRoot.includes(`/v138-plan133-mode-${index}-`) ||
          (disposableRoot !== undefined && disposableRoot !== candidateRoot))
        fail("V138_PLAN133_OBSERVATIONS_INVALID")
      disposableRoot = candidateRoot
    }
    const expectedNative = sha(canonical(paths.map((absolute, nativeIndex) =>
      [absolute, sha(readFileSync(target(root, LOCAL_NATIVE_PATHS[nativeIndex]!)))])))
    const body = { reviewedClosureRoot: observation.disposableReviewedClosureRoot,
      localInstalledClosureRoot: observation.disposableLocalInstalledClosureRoot,
      localGitObjectRoot: observation.disposableLocalGitObjectRoot,
      localNativeSourcesRoot: observation.disposableLocalNativeSourcesRoot }
    const { observationRoot, ...observationBody } = observation
    if (observation.disposableLocalNativeSourcesRoot !== expectedNative ||
        observation.disposableLocalExecutionClosureRoot !==
          computeV138PathStableLocalExecutionClosureRoot(body) ||
        observationRoot !== rooted("v138-plan-262-133-mode-observation-v5", observationBody))
      fail("V138_PLAN133_OBSERVATIONS_INVALID")
  }
  return Object.freeze({ actualModesPassed: observations.length,
    observationsRoot: rooted("v138-plan-262-133-observations-v5", observations) })
}

const renderEvidence = (root: string, findingsInput: readonly V138Plan133Finding[],
  modes: ReturnType<typeof executeV138Plan133DisposableObservationsForReview>) => {
  const source = authenticateV138Plan133Plan132SourceForReview(root)
  const aggregate = validateV138Plan133ObservationsForReview(root, modes.observations,
    modes.canonicalBefore)
  const findings = [...findingsInput, ...modes.findings].sort((a, b) =>
    `${a.code}\0${a.subject}\0${a.detail}`.localeCompare(`${b.code}\0${b.subject}\0${b.detail}`))
  const eligible = findings.length === 0 && aggregate.actualModesPassed === 6
  const payloadBody = {
    schemaVersion: "v1.38-plan-262-133-live-v13-custody-review-payload-v5",
    protocol: "independent-live-v13-custody-review-v5",
    subjectCommit: source.subjectCommit, subjectTree: source.subjectTree,
    subjectParent: source.subjectParent, sourceBlob: source.sourceBlob, testBlob: source.testBlob,
    sourceSha256: source.sourceSha256, testSha256: source.testSha256,
    closeoutCommit: source.closeoutCommit, cleanReviewCommit: source.cleanReviewCommit,
    plan131ReviewCommit: source.reviewCommit, v4PublicationCommit: source.v4PublicationCommit,
    v4SummaryCommit: source.v4SummaryCommit,
    v4Disposition: source.v4Disposition, v4StoredPlan110Eligible: true,
    supersededV4Plan110Eligible: false,
    supersededV4PayloadRoot: source.v4Payload.payloadRoot,
    supersededV4ReviewRoot: source.v4Carrier.reviewRoot,
    supersededV4CarrierRoot: source.v4Carrier.carrierRoot,
    v3PublicationCommit: source.v3.publicationCommit, v3Disposition: source.v3.disposition,
    supersededV3Plan110Eligible: false, supersededV3PayloadRoot: source.v3.payloadRoot,
    supersededV3ReviewRoot: source.v3.reviewRoot, supersededV3CarrierRoot: source.v3.carrierRoot,
    b331Commit: B331, b331Scope: V138_PLAN133_B331_SCOPE,
    canonicalReviewedClosureRoot: modes.canonicalBefore.reviewedClosureRoot,
    canonicalLocalInstalledClosureRoot: modes.canonicalBefore.localInstalledClosureRoot,
    canonicalLocalGitObjectRoot: modes.canonicalBefore.localGitObjectRoot,
    canonicalLocalNativeSourcesRoot: modes.canonicalBefore.localNativeSourcesRoot,
    canonicalLocalExecutionClosureRoot: modes.canonicalBefore.localExecutionClosureRoot,
    recursiveDependencyRoot: modes.canonicalBefore.recursiveDependencyRoot,
    recursiveDependencyCount: modes.canonicalBefore.recursiveDependencyCount,
    installedClosureRoot: modes.canonicalBefore.installedClosureRoot,
    findings, findingCount: findings.length, actualModesPassed: aggregate.actualModesPassed,
    observations: modes.observations, observationsRoot: aggregate.observationsRoot,
    plan110Eligible: eligible, authorizesExecution: false, createsCapacity: false,
    resetsCounters: false, authorizationLiteralCreated: false,
    readinessInvoked: false, liveInvoked: false, producerCalls: 0,
    freshCharged: 0, freshAccepted: 0,
    counters: { acceptedCells: 0, calibrationIdentitiesCharged: 0,
      preflightObservationsConsumed: 0, reproductionIdentitiesCharged: 0, routeStartsConsumed: 0 },
    phase263PlanningAuthorized: false, candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false, holdoutOpeningAuthorized: false,
    publicAuthorized: false, productAuthorized: false, productionAuthorized: false,
    downstreamAuthority: "denied",
  }
  const payload = Object.freeze({ ...payloadBody,
    payloadRoot: rooted("v138-plan-262-133-live-v13-custody-review-payload-v5", payloadBody) })
  const status = eligible ? "zero_findings" : "blocked"
  const reviewBody = `# Phase 262 Plan 133 Independent Live-v13 Custody Review v5\n\n` +
    `**${eligible ? "ZERO FINDINGS" : "BLOCKED"}.** Six independently authenticated genuine observations passed: ${eligible ? "yes" : "no"}. ` +
    `Plan131 v4 disposition: \`process_invalid_descendant_and_observation_validation\`. ` +
    `Plan131 v4 current eligibility: false. Only revised Plan 110 eligibility: ${eligible ? "true" : "false"}. ` +
    `Authorizes execution: false. Producer calls: 0. Readiness/live invoked: false. ` +
    `Fresh charged/accepted: 0/0. Downstream authority: denied.\n`
  const reviewRoot = rooted("v138-plan-262-133-live-v13-custody-review-v5", { status,
    findingCount: findings.length, actualModesPassed: aggregate.actualModesPassed,
    payloadRoot: payload.payloadRoot, reviewBody })
  const reviewBytes = Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "133"\nreview_type: independent_live_v13_custody_v5\nstatus: ${status}\nfinding_count: ${findings.length}\nreview_root: ${reviewRoot}\n---\n\n${reviewBody}`)
  const carrierBody = { schemaVersion: "v1.38-plan-262-133-live-v13-custody-review-carrier-v5",
    protocol: "nonrecursive-external-review-carrier-v5", subjectCommit: PLAN132_SUBJECT,
    payloadMode: "100644", payloadRoot: payload.payloadRoot,
    payloadSha256: sha(Buffer.from(canonical(payload))), reviewMode: "100644", reviewRoot,
    reviewSha256: sha(reviewBytes), findingCount: findings.length,
    actualModesPassed: aggregate.actualModesPassed, supersededV4Plan110Eligible: false,
    plan110Eligible: eligible, authorizesExecution: false, createsCapacity: false,
    resetsCounters: false, authorizationLiteralCreated: false, producerCalls: 0,
    readinessInvoked: false, liveInvoked: false, freshCharged: 0, freshAccepted: 0,
    downstreamAuthority: "denied" }
  const carrier = Object.freeze({ ...carrierBody,
    carrierRoot: rooted("v138-plan-262-133-live-v13-custody-review-carrier-v5", carrierBody) })
  return Object.freeze({ payload, reviewBytes, carrier })
}

export const renderV138Plan133EvidenceForReview = (
  rootInput: string, findings: readonly V138Plan133Finding[],
  modes: ReturnType<typeof executeV138Plan133DisposableObservationsForReview>,
) => {
  if (modes === null || typeof modes !== "object" || !trustedModes.has(modes))
    fail("V138_PLAN133_MODES_INPUT_INVALID")
  return renderEvidence(path.resolve(rootInput), findings, modes)
}
export const writeV138Plan133ReviewForReview = (rootInput: string): void => {
  const root = path.resolve(rootInput); assertAbsent(root, [...REVIEW_PATHS, ...EFFECT_PATHS])
  const modes = executeV138Plan133DisposableObservationsForReview(root)
  const evidence = renderV138Plan133EvidenceForReview(root, modes.findings, modes)
  for (const [repoPath, bytes] of [[OUTPUT.payload, Buffer.from(canonical(evidence.payload))],
    [OUTPUT.review, evidence.reviewBytes],
    [OUTPUT.carrier, Buffer.from(canonical(evidence.carrier))]] as const) {
    mkdirSync(path.dirname(target(root, repoPath)), { recursive: true })
    writeFileSync(target(root, repoPath), bytes, { mode: 0o644, flag: "wx" })
  }
}

const authenticateGenerated = (root: string, committed: boolean) => {
  const current = REVIEW_PATHS.map((repoPath) => readNoFollow(root, repoPath))
  const payload = jsonBytes(current[0]!, "V138_PLAN133_GENERATED_PAYLOAD_INVALID")
  const carrier = jsonBytes(current[2]!, "V138_PLAN133_GENERATED_CARRIER_INVALID")
  if (!Array.isArray(payload.findings) || payload.findings.length !== payload.findingCount ||
      !Array.isArray(payload.observations) || payload.observations.length !== 6)
    fail("V138_PLAN133_GENERATED_EVIDENCE_INVALID")
  const canonicalCustody = Object.freeze({
    reviewedClosureRoot: payload.canonicalReviewedClosureRoot,
    localInstalledClosureRoot: payload.canonicalLocalInstalledClosureRoot,
    localGitObjectRoot: payload.canonicalLocalGitObjectRoot,
    localNativeSourcesRoot: payload.canonicalLocalNativeSourcesRoot,
    localExecutionClosureRoot: payload.canonicalLocalExecutionClosureRoot,
    recursiveDependencyRoot: payload.recursiveDependencyRoot,
    recursiveDependencyCount: payload.recursiveDependencyCount,
    installedClosureRoot: payload.installedClosureRoot,
  }) as V138PathStableCustody
  const aggregate = validateV138Plan133ObservationsForReview(root, payload.observations, canonicalCustody)
  const { payloadRoot, ...payloadBody } = payload
  if (payloadRoot !== rooted("v138-plan-262-133-live-v13-custody-review-payload-v5", payloadBody) ||
      aggregate.actualModesPassed !== payload.actualModesPassed ||
      aggregate.observationsRoot !== payload.observationsRoot || payload.findingCount !== 0 ||
      payload.plan110Eligible !== true || payload.supersededV4Plan110Eligible !== false ||
      carrier.payloadRoot !== payloadRoot || carrier.payloadSha256 !== sha(current[0]!) ||
      carrier.reviewSha256 !== sha(current[1]!) || carrier.plan110Eligible !== true ||
      carrier.supersededV4Plan110Eligible !== false)
    fail("V138_PLAN133_GENERATED_SEMANTICS_INVALID")
  const status = "zero_findings"; const reviewBody = current[1]!.toString("utf8").split("---\n\n")[1]
  if (typeof reviewBody !== "string" || carrier.reviewRoot !== rooted(
    "v138-plan-262-133-live-v13-custody-review-v5", { status,
      findingCount: 0, actualModesPassed: 6, payloadRoot, reviewBody }))
    fail("V138_PLAN133_GENERATED_REVIEW_INVALID")
  let publicationCommit: string | undefined; let summaryCommit: string | undefined
  if (committed) {
    const history = createHistoryView(root)
    try {
      const publications = history.git(["log", "--diff-filter=A", "--format=%H", "--", OUTPUT.payload])
        .split("\n").filter(Boolean)
      const summaries = history.git(["log", "--diff-filter=A", "--format=%H", "--", OUTPUT.summary])
        .split("\n").filter(Boolean)
      if (publications.length !== 1 || summaries.length !== 1) fail("V138_PLAN133_PUBLICATION_IDENTITY_INVALID")
      publicationCommit = publications[0]!; summaryCommit = summaries[0]!
      assertV138Plan133StrictDescendantForReview(publicationCommit, history.head,
        isAncestor(history, publicationCommit, history.head))
      assertV138Plan133StrictDescendantForReview(summaryCommit, history.head,
        isAncestor(history, summaryCommit, history.head))
      if (history.git(["rev-parse", `${summaryCommit}^`]) !== publicationCommit)
        fail("V138_PLAN133_SUMMARY_PARENT_INVALID")
      const publicationScope = history.git(["diff-tree", "--no-commit-id", "--name-status", "-r",
        publicationCommit]).split("\n").filter(Boolean).sort()
      if (canonical(publicationScope) !== canonical(REVIEW_PATHS.map((repoPath) => `A\t${repoPath}`).sort()))
        fail("V138_PLAN133_V5_PUBLICATION_SCOPE_INVALID")
      if (history.git(["diff-tree", "--no-commit-id", "--name-status", "-r", summaryCommit]) !==
          `A\t${OUTPUT.summary}`) fail("V138_PLAN133_V5_SUMMARY_SCOPE_INVALID")
      for (const [index, repoPath] of REVIEW_PATHS.entries()) {
        const committedBytes = history.gitBytes(["cat-file", "blob", `${publicationCommit}:${repoPath}`])
        if (!current[index]!.equals(committedBytes) ||
            history.git(["log", "--format=%H", `${publicationCommit}..${history.head}`, "--", repoPath]) !== "")
          fail(`V138_PLAN133_V5_PUBLICATION_BYTES_INVALID:${repoPath}`)
      }
      const summaryBytes = history.gitBytes(["cat-file", "blob", `${summaryCommit}:${OUTPUT.summary}`])
      if (!readNoFollow(root, OUTPUT.summary).equals(summaryBytes) ||
          history.git(["log", "--format=%H", `${summaryCommit}..${history.head}`, "--", OUTPUT.summary]) !== "")
        fail("V138_PLAN133_V5_SUMMARY_BYTES_INVALID")
    } finally { history.dispose() }
    const fresh = executeV138Plan133DisposableObservationsForReview(root)
    const freshAggregate = validateV138Plan133ObservationsForReview(root, fresh.observations,
      fresh.canonicalBefore)
    if (fresh.findings.length !== 0 || fresh.actualModesPassed !== 6 ||
        freshAggregate.actualModesPassed !== 6) fail("V138_PLAN133_FRESH_REVIEW_INVALID")
    assertAbsent(root, EFFECT_PATHS)
  }
  return Object.freeze({ publicationCommit, summaryCommit, findingCount: 0 as const,
    actualModesPassed: 6 as const, plan110Eligible: true as const,
    supersededV4Plan110Eligible: false as const, payloadRoot,
    reviewRoot: carrier.reviewRoot, carrierRoot: carrier.carrierRoot,
    authorizesExecution: false as const, createsCapacity: false as const,
    resetsCounters: false as const, authorizationLiteralCreated: false as const,
    producerCalls: 0 as const, readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const, downstreamAuthority: "denied" as const })
}
export const authenticateV138Plan133GeneratedReview = (rootInput: string) =>
  authenticateGenerated(path.resolve(rootInput), false)
export const authenticateV138Plan133PublishedReview = (rootInput: string) =>
  authenticateGenerated(path.resolve(rootInput), true)

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1) fail("V138_PLAN133_ARGUMENTS_INVALID")
  if (args[0] === "--write-review") { writeV138Plan133ReviewForReview(root); return }
  if (args[0] === "--check-generated-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan133GeneratedReview(root))}\n`); return
  }
  if (args[0] === "--check-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan133PublishedReview(root))}\n`); return
  }
  if (args[0] === "--check-observations") {
    process.stdout.write(`${JSON.stringify(executeV138Plan133DisposableObservationsForReview(root))}\n`); return
  }
  fail("V138_PLAN133_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
