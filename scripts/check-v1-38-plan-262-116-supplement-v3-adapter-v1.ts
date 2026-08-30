import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>
export type V138Plan116Finding = Readonly<{
  code: string
  severity: "critical" | "high"
  detail: string
}>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const SUBJECT_COMMIT = "bb1d639ac4ba92c9a23ecd0356bc5c139ed4ea48"
const SUBJECT_TREE = "0f55d28d514e1e5e37ffcdcada88fe606e87ccd3"
const SUBJECT_PARENT = "a2a5170ad0eb2ff0d8919aa9b78361ec5e34b076"
const SUBJECT_ENTRIES = Object.freeze([
  Object.freeze({
    path: "scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts",
    mode: "100644", blob: "de32acd9a664a1efde3390827b59121231e384ee",
  }),
  Object.freeze({
    path: "scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts",
    mode: "100644", blob: "2fa32f8c69a5515f4d1e0e31b9c93a23c9c3a21f",
  }),
  Object.freeze({
    path: "scripts/native/v1-38-plan-262-115-exclusive-writer-v1.c",
    mode: "100644", blob: "a733b6ce9239d02e522a78ad83930037e644a4d0",
  }),
] as const)
const ADAPTER_PATH = SUBJECT_ENTRIES[0].path
const NATIVE_PATH = SUBJECT_ENTRIES[2].path
const PLAN114_V2_COMMIT = "34bc94ec4e348f71e6055a091d60a505cffc0d79"
const PLAN114_V1_COMMIT = "ab539ab2b3706981aaeb053b3fafce6b46532b40"
const PLAN114_V2_ROOTS = Object.freeze({
  payload: "sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac",
  review: "sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee",
  carrier: "sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26",
})
const LIVE_SOURCE_COMMIT = "ba1f8ddb4d701762d5d443f41edcbb691bb0eda5"
const REVIEWED_CLOSURE_ROOT = "sha256:8929dd2d2d8c9c72c293a7b9e41e722ef274a1296160e877685ce0956969b852"
const REVIEWED_LOCAL_ROOT = "sha256:9e69dca582dd49f119cde283491173d0c3fd7c5aca40dfaf95e53c99dec5ee0c"
const CORRECTED_COMMIT = "2639ff3b42e2a238919a3104c9fa8c785c69b93d"
const PLAN112_V1_COMMIT = "29d4cf5c942d63fd767f658ec2506a5764ff19fa"
const PLAN112_V2_COMMIT = "5b5ec60154bb82a3cfa3b25a03f8a2379010c829"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT = "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT = "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT = "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const ZERO_COUNTERS = Object.freeze({
  acceptedCells: 0,
  calibrationIdentitiesCharged: 0,
  preflightObservationsConsumed: 0,
  reproductionIdentitiesCharged: 0,
  routeStartsConsumed: 0,
})
const PATHS = Object.freeze({
  payload: ".planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v2.json",
  review: `${PHASE}/262-116-REVIEW-v2.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v2.json",
  transaction: ".planning/.v138-plan116-review-v2-transaction.json",
  plan114Payload: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v2.json",
  plan114Review: `${PHASE}/262-114-REVIEW-v2.md`,
  plan114Carrier: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v2.json",
  finalReview: `${PHASE}/262-114-FINAL-CLEAN-REVIEW.md`,
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  supplement1: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
  supplement2: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json",
  supplement3: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json",
})
const V1_PUBLICATION_COMMIT = "e1e75fc6ef177a8213d903f1ec365d86f37cf62a"
const V1_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v1.json",
  `${PHASE}/262-116-REVIEW.md`,
  ".planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v1.json",
])
const V1_BLOBS = Object.freeze([
  "8500f0e16a1b10f8b35bcdfcfb09abfba13f20d3",
  "f1f5f043d02cdd42359b6eebd5d11b47c677e57a",
  "85368a06e58b0e18fcdde5bafe6d5482fd131070",
])
const REVIEW_PATHS = Object.freeze([PATHS.payload, PATHS.review, PATHS.carrier])
const SECURE_PATHS = Object.freeze([PATHS.seal, PATHS.envelope])
const ORDINARY_PATHS = Object.freeze([PATHS.plan114Payload, PATHS.plan114Review,
  PATHS.plan114Carrier, PATHS.finalReview])
const EFFECT_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
])
const MODE_NAMES = Object.freeze([
  "shared_source_only",
  "disposable_source_only",
  "exclusive_write",
  "exact_one_path_commit",
  "committed_check",
  "repeat_check",
  "parent_swap_rejected",
  "preseeded_cache_rejected",
  "representative_mutations_rejected",
] as const)
const SOURCE_SELECTOR = ["--check", "source-only"].join("-")
const WRITE_SELECTOR = ["--write", "supplement-v3"].join("-")
const COMMITTED_SELECTOR = ["--check", "supplement-v3"].join("-")
const nativeTransactionSource = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "native/v1-38-plan-262-116-review-transaction-v1.c")

class V138Plan116ProcessIntegrityError extends Error {}
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
const target = (rootInput: string, repoPath: string): string => {
  const root = path.resolve(rootInput)
  const absolute = path.resolve(root, repoPath)
  if (!absolute.startsWith(`${root}${path.sep}`)) fail("V138_PLAN116_PATH_INVALID")
  return absolute
}
const git = (root: string, args: readonly string[]): string =>
  runV138RetryV3IsolatedGit(root, args)
const gitProbe = (root: string, args: readonly string[]): boolean => {
  try { git(root, args); return true }
  catch (error) {
    if (error instanceof Error && "status" in error &&
        typeof (error as Error & { status?: unknown }).status === "number" &&
        (error as Error & { status: number }).status !== 0) return false
    throw error
  }
}
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
const pathPresent = (root: string, repoPath: string): boolean => {
  try { lstatSync(target(root, repoPath)); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
    throw error
  }
}
const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (pathPresent(root, repoPath))
    fail(`V138_PLAN116_FORBIDDEN_PRESENT:${repoPath}`)
}
const expectedMode = (repoPath: string): number => SECURE_PATHS.includes(repoPath as never) ? 0o600 : 0o644
const readRegularNoFollow = (root: string, repoPath: string): Buffer => {
  const absolute = target(root, repoPath)
  const expected = expectedMode(repoPath)
  const before = lstatSync(absolute)
  if (!before.isFile() || before.isSymbolicLink() || (before.mode & 0o7777) !== expected)
    fail(`V138_PLAN116_CURRENT_MODE_INVALID:${repoPath}`)
  const descriptor = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(descriptor)
    if (!opened.isFile() || (opened.mode & 0o7777) !== expected || opened.dev !== before.dev ||
        opened.ino !== before.ino || opened.size !== before.size)
      fail(`V138_PLAN116_CURRENT_IDENTITY_INVALID:${repoPath}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (after.dev !== opened.dev || after.ino !== opened.ino || after.size !== opened.size ||
        after.mode !== opened.mode)
      fail(`V138_PLAN116_CURRENT_CHANGED:${repoPath}`)
    return bytes
  } finally { closeSync(descriptor) }
}
const ancestor = (root: string, commit: string): void => {
  if (!gitProbe(root, ["merge-base", "--is-ancestor", commit, "HEAD"]))
    fail(`V138_PLAN116_ANCESTRY_INVALID:${commit}`)
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail(`V138_PLAN116_SUCCESSOR_REWRITE:${paths.join(",")}`)
}
const committed = (root: string, commit: string, repoPath: string, compareCurrent = true) => {
  const entry = git(root, ["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
  if (match === null || match[3] !== repoPath) fail(`V138_PLAN116_ENTRY_INVALID:${repoPath}`)
  const bytes = gitBytes(root, commit, repoPath)
  if (compareCurrent && !readRegularNoFollow(root, repoPath).equals(bytes))
    fail(`V138_PLAN116_CURRENT_BYTES_INVALID:${repoPath}`)
  return Object.freeze({ path: repoPath, mode: match[1]!, blob: match[2]!, sha256: sha(bytes), bytes })
}
const jsonAt = (root: string, commit: string, repoPath: string): Json => {
  const bytes = gitBytes(root, commit, repoPath)
  const value = JSON.parse(bytes.toString("utf8")) as Json
  if (!bytes.equals(Buffer.from(canonical(value)))) fail(`V138_PLAN116_NONCANONICAL:${repoPath}`)
  return value
}
const exactPublication = (root: string, commit: string, paths: readonly string[]): void => {
  ancestor(root, commit)
  const actual = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", commit])
    .split("\n").filter(Boolean).sort()
  const expected = paths.map((repoPath) => `A\t${repoPath}`).sort()
  if (canonical(actual) !== canonical(expected)) fail("V138_PLAN116_PUBLICATION_SCOPE_INVALID")
  for (const repoPath of paths) {
    const record = committed(root, commit, repoPath)
    if (record.mode !== "100644") fail(`V138_PLAN116_PUBLICATION_MODE_INVALID:${repoPath}`)
  }
  noRewrite(root, commit, paths)
}
const authenticateHistoricalV1 = (root: string): void => {
  exactPublication(root, V1_PUBLICATION_COMMIT, V1_PATHS)
  for (const [index, repoPath] of V1_PATHS.entries()) {
    const record = committed(root, V1_PUBLICATION_COMMIT, repoPath)
    if (record.mode !== "100644" || record.blob !== V1_BLOBS[index])
      fail("V138_PLAN116_V1_CUSTODY_INVALID")
  }
}
const command = (program: string, args: readonly string[], cwd: string, env?: NodeJS.ProcessEnv): string => {
  const result = spawnSync(program, args, {
    cwd, env: env ?? process.env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  })
  if (result.error !== undefined || result.status === null)
    throw new V138Plan116ProcessIntegrityError(`V138_PLAN116_PROCESS_INTEGRITY:${program}`)
  if (result.status !== 0) throw new V138Plan116ProcessIntegrityError(
    result.stderr.trim() || `V138_PLAN116_COMMAND_FAILED:${program}`)
  return result.stdout.trim()
}
const commandRejected = (program: string, args: readonly string[], cwd: string,
  expected: RegExp, env?: NodeJS.ProcessEnv): void => {
  const result = spawnSync(program, args, {
    cwd, env: env ?? process.env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  })
  if (result.error !== undefined || result.status === null)
    throw new V138Plan116ProcessIntegrityError(`V138_PLAN116_PROCESS_INTEGRITY:${program}`)
  if (result.status === 0 || !expected.test(result.stderr))
    fail(`V138_PLAN116_EXPECTED_REJECTION_MISSING:${result.stderr.trim()}`)
}
const withNativeTransaction = <T>(run: (executable: string) => T): T => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan116-native-"))
  chmodSync(owner, 0o700)
  const executable = path.join(owner, "transaction")
  try {
    command("/usr/bin/clang", ["-std=c11", "-Wall", "-Wextra", "-Werror",
      nativeTransactionSource, "-o", executable], owner)
    chmodSync(executable, 0o700)
    const status = lstatSync(executable)
    if (!status.isFile() || status.isSymbolicLink() || (status.mode & 0o7777) !== 0o700 ||
        status.nlink !== 1 || status.uid !== process.getuid())
      throw new V138Plan116ProcessIntegrityError("V138_PLAN116_NATIVE_EXECUTABLE_INVALID")
    return run(executable)
  } finally { rmSync(owner, { recursive: true, force: true }) }
}
const nativeFileOperation = (executable: string, root: string, action: "create" | "remove",
  repoPath: string, bytes: Buffer, env?: NodeJS.ProcessEnv): void => {
  const identity = lstatSync(root)
  if (!identity.isDirectory() || identity.isSymbolicLink())
    throw new V138Plan116ProcessIntegrityError("V138_PLAN116_NATIVE_ROOT_INVALID")
  const result = spawnSync(executable,
    [root, String(identity.dev), String(identity.ino), action, repoPath], {
      cwd: root, input: bytes, encoding: "utf8", env: env ?? process.env,
      stdio: ["pipe", "ignore", "pipe"],
    })
  if (result.error !== undefined || result.status === null)
    throw new V138Plan116ProcessIntegrityError("V138_PLAN116_NATIVE_PROCESS_INTEGRITY")
  if (result.status !== 0) throw new V138Plan116ProcessIntegrityError(
    result.stderr.trim() || `V138_PLAN116_NATIVE_FAILED:${String(result.status)}`)
}
export const writeV138Plan116RetainedFileForReview = (root: string, repoPath: string,
  bytes: Buffer): void => withNativeTransaction((executable) =>
    nativeFileOperation(executable, path.resolve(root), "create", repoPath, bytes))

const independentlyRenderSupplement = (): Json => {
  const body = {
    schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v3",
    supersessionScope: "executable_source_custody_only",
    plan114PublicationCommit: PLAN114_V2_COMMIT,
    plan114PayloadRoot: PLAN114_V2_ROOTS.payload,
    plan114ReviewRoot: PLAN114_V2_ROOTS.review,
    plan114CarrierRoot: PLAN114_V2_ROOTS.carrier,
    reviewedSourceCommit: LIVE_SOURCE_COMMIT,
    reviewedClosureRoot: REVIEWED_CLOSURE_ROOT,
    reviewedLocalExecutionClosureRoot: REVIEWED_LOCAL_ROOT,
    correctedPublicationCommit: CORRECTED_COMMIT,
    plan112V1PublicationCommit: PLAN112_V1_COMMIT,
    plan112V2PublicationCommit: PLAN112_V2_COMMIT,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    counters: ZERO_COUNTERS,
    createsEnvelope: false,
    createsCapacity: false,
    resetsCounters: false,
    authorizesExecution: false,
    phase263PlanningAuthorized: false,
    candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    productAuthorized: false,
    productionAuthorized: false,
    downstreamAuthority: "denied",
  }
  return Object.freeze({ ...body, supplementRoot: rooted(
    "v138-successor-source-seal-v13-executable-custody-supplement-v3", body,
  ) })
}

const resolveRelativeImport = (from: string, specifier: string): string => {
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier))
  return resolved.endsWith(".js") ? `${resolved.slice(0, -3)}.ts` : resolved
}
const objectExists = (root: string, commit: string, repoPath: string): boolean =>
  gitProbe(root, ["cat-file", "-e", `${commit}:${repoPath}`])
export const probeV138Plan116GitObjectForReview =
  (root: string, commit: string, repoPath: string): boolean => objectExists(root, commit, repoPath)
const deriveRecursiveClosure = (root: string) => {
  const pending = SUBJECT_ENTRIES.filter(({ path: repoPath }) => repoPath.endsWith(".ts"))
    .map(({ path: repoPath }) => repoPath)
  const paths = new Set<string>()
  const nativePaths = new Set<string>([NATIVE_PATH])
  while (pending.length > 0) {
    const repoPath = pending.shift()!
    if (paths.has(repoPath)) continue
    const bytes = gitBytes(root, SUBJECT_COMMIT, repoPath)
    paths.add(repoPath)
    const source = bytes.toString("utf8")
    for (const match of source.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/gu)) {
      const candidate = resolveRelativeImport(repoPath, match[1]!)
      if (objectExists(root, SUBJECT_COMMIT, candidate) && !paths.has(candidate)) pending.push(candidate)
    }
    for (const match of source.matchAll(/["'](\.\.\/native\/[^"']+\.c)["']/gu)) {
      const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(repoPath), match[1]!))
      if (objectExists(root, SUBJECT_COMMIT, candidate)) nativePaths.add(candidate)
    }
  }
  const manifest = [...paths].sort().map((repoPath) => {
    const record = committed(root, SUBJECT_COMMIT, repoPath, false)
    return { path: repoPath, mode: record.mode, blob: record.blob, sha256: record.sha256 }
  })
  const nativeManifest = [...nativePaths].sort().map((repoPath) => {
    const record = committed(root, SUBJECT_COMMIT, repoPath, false)
    return { path: repoPath, mode: record.mode, blob: record.blob, sha256: record.sha256 }
  })
  return Object.freeze({
    recursiveDependencyCount: manifest.length,
    recursiveDependencyRoot: rooted("v138-plan-262-116-recursive-dependencies-v1", manifest),
    nativeInputRoot: rooted("v138-plan-262-116-native-inputs-v1", nativeManifest),
    manifest: Object.freeze(manifest),
    nativeManifest: Object.freeze(nativeManifest),
  })
}
const localFileIdentity = (absolute: string) => {
  const real = realpathSync(absolute)
  const status = lstatSync(real)
  if (!status.isFile() || status.isSymbolicLink()) fail("V138_PLAN116_TOOLCHAIN_FILE_UNSAFE")
  return Object.freeze({
    path: real,
    device: status.dev,
    inode: status.ino,
    mode: status.mode & 0o7777,
    sha256: sha(readFileSync(real)),
  })
}
const captureSubjectClosure = (rootInput: string) => {
  const root = path.resolve(rootInput)
  ancestor(root, SUBJECT_COMMIT)
  if (git(root, ["rev-parse", `${SUBJECT_COMMIT}^{tree}`]) !== SUBJECT_TREE ||
      git(root, ["rev-parse", `${SUBJECT_COMMIT}^`]) !== SUBJECT_PARENT)
    fail("V138_PLAN116_SUBJECT_IDENTITY_INVALID")
  const entries = SUBJECT_ENTRIES.map((expected) => {
    const actual = committed(root, SUBJECT_COMMIT, expected.path)
    if (actual.mode !== expected.mode || actual.blob !== expected.blob)
      fail(`V138_PLAN116_SUBJECT_ENTRY_INVALID:${expected.path}`)
    return Object.freeze({ path: actual.path, mode: actual.mode, blob: actual.blob, sha256: actual.sha256 })
  })
  noRewrite(root, SUBJECT_COMMIT, SUBJECT_ENTRIES.map(({ path: repoPath }) => repoPath))
  const recursive = deriveRecursiveClosure(root)
  const packageManifest = ["package.json", "pnpm-lock.yaml"].map((repoPath) => {
    const record = committed(root, SUBJECT_COMMIT, repoPath)
    if (record.mode !== "100644") fail(`V138_PLAN116_DEPENDENCY_MODE_INVALID:${repoPath}`)
    return { path: repoPath, mode: record.mode, blob: record.blob, sha256: record.sha256 }
  })
  for (const record of [...recursive.manifest, ...recursive.nativeManifest]) {
    const current = committed(root, SUBJECT_COMMIT, record.path)
    if (current.mode !== "100644" || current.blob !== record.blob)
      fail(`V138_PLAN116_DEPENDENCY_MODE_INVALID:${record.path}`)
  }
  const completeClosurePaths = [...new Set([
    ...recursive.manifest.map(({ path: repoPath }) => repoPath),
    ...recursive.nativeManifest.map(({ path: repoPath }) => repoPath),
    ...packageManifest.map(({ path: repoPath }) => repoPath),
  ])]
  noRewrite(root, SUBJECT_COMMIT, completeClosurePaths)
  const portable = Object.freeze({
    subjectCommit: SUBJECT_COMMIT,
    subjectTree: SUBJECT_TREE,
    subjectParent: SUBJECT_PARENT,
    subjectEntries: entries,
    recursiveDependencyRoot: recursive.recursiveDependencyRoot,
    recursiveDependencyCount: recursive.recursiveDependencyCount,
    recursiveDependencyManifest: recursive.manifest,
    nativeInputRoot: recursive.nativeInputRoot,
    nativeInputManifest: recursive.nativeManifest,
    packageManifest: Object.freeze(packageManifest),
    packageManifestRoot: rooted("v138-plan-262-116-package-manifest-v1", packageManifest),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
  })
  const reviewedClosureRoot = rooted("v138-plan-262-116-reviewed-closure-v1", portable)
  const tsx = target(root, "node_modules/.bin/tsx")
  const local = Object.freeze({
    reviewedClosureRoot,
    checkoutRoot: realpathSync(root),
    node: localFileIdentity(process.execPath),
    tsx: localFileIdentity(tsx),
    git: localFileIdentity("/usr/bin/git"),
    clang: localFileIdentity("/usr/bin/clang"),
  })
  return Object.freeze({
    ...portable,
    reviewedClosureRoot,
    localExecutionClosureRoot: rooted("v138-plan-262-116-local-execution-closure-v1", local),
  })
}

const authenticateIndependentUpstream = (rootInput: string): void => {
  const root = path.resolve(rootInput)
  for (const commit of [PLAN114_V2_COMMIT, PLAN114_V1_COMMIT, LIVE_SOURCE_COMMIT,
    CORRECTED_COMMIT, PLAN112_V1_COMMIT, PLAN112_V2_COMMIT, PAIR_COMMIT]) ancestor(root, commit)
  for (const repoPath of [...SECURE_PATHS, ...ORDINARY_PATHS]) readRegularNoFollow(root, repoPath)
  exactPublication(root, PLAN114_V2_COMMIT,
    [PATHS.plan114Payload, PATHS.plan114Review, PATHS.plan114Carrier])
  const payload = jsonAt(root, PLAN114_V2_COMMIT, PATHS.plan114Payload)
  const carrier = jsonAt(root, PLAN114_V2_COMMIT, PATHS.plan114Carrier)
  if (payload.schemaVersion !== "v1.38-plan-262-114-live-v10-custody-review-payload-v2" ||
      payload.supersedesPublicationCommit !== PLAN114_V1_COMMIT ||
      payload.payloadRoot !== PLAN114_V2_ROOTS.payload || carrier.reviewRoot !== PLAN114_V2_ROOTS.review ||
      carrier.carrierRoot !== PLAN114_V2_ROOTS.carrier || payload.findingCount !== 0 ||
      canonical(payload.findings) !== canonical([]) || payload.actualModesPassed !== 6 ||
      payload.plan109Eligible !== true || payload.authorizesExecution !== false ||
      payload.liveInvoked !== false || payload.freshCharged !== 0 || payload.freshAccepted !== 0 ||
      payload.downstreamAuthority !== "denied" || carrier.payloadRoot !== payload.payloadRoot ||
      carrier.authorizesExecution !== false)
    fail("V138_PLAN116_PLAN114_V2_INVALID")
  const seal = jsonAt(root, PAIR_COMMIT, PATHS.seal)
  const envelope = jsonAt(root, PAIR_COMMIT, PATHS.envelope)
  const sealEntry = committed(root, PAIR_COMMIT, PATHS.seal)
  const envelopeEntry = committed(root, PAIR_COMMIT, PATHS.envelope)
  if (sealEntry.mode !== "100644" || envelopeEntry.mode !== "100644" ||
      seal.sealRoot !== SEAL_ROOT || seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      envelope.sealRoot !== SEAL_ROOT || envelope.envelopeRoot !== ENVELOPE_ROOT ||
      envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT || envelope.status !== "sealed_inactive" ||
      canonical(envelope.counters) !== canonical(ZERO_COUNTERS) ||
      seal.productionAuthorized !== false || envelope.policy.productionAuthorized !== false)
    fail("V138_PLAN116_PAIR_INVALID")
  assertAbsent(root, [PATHS.supplement1, PATHS.supplement2, PATHS.supplement3, ...EFFECT_PATHS])
}
const authenticateSupplementSemantics = (): void => {
  const expected = independentlyRenderSupplement()
  if (expected.createsEnvelope !== false || expected.createsCapacity !== false ||
      expected.resetsCounters !== false || expected.authorizesExecution !== false ||
      expected.downstreamAuthority !== "denied") fail("V138_PLAN116_SUPPLEMENT_SEMANTICS_INVALID")
}

export const captureV138Plan116FoundationForReview = (rootInput: string) => {
  const closure = captureSubjectClosure(rootInput)
  authenticateIndependentUpstream(rootInput)
  authenticateSupplementSemantics()
  return Object.freeze({
    ...closure,
    secureCurrentMode: "0600" as const,
    ordinaryCurrentMode: "0644" as const,
    upstreamAuthenticated: true as const,
    supplementSemanticsAuthenticated: true as const,
    supplementRoot: independentlyRenderSupplement().supplementRoot,
    producerCalls: 0 as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    downstreamAuthority: "denied" as const,
  })
}
export const observeV138Plan116FoundationForReview = (rootInput: string) => {
  let closure: ReturnType<typeof captureSubjectClosure>
  try {
    closure = captureSubjectClosure(rootInput)
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    return Object.freeze({
      foundation: undefined,
      closure: undefined,
      authentication: Object.freeze({
        subjectAuthenticated: false, upstreamAuthenticated: false,
        supplementSemanticsAuthenticated: false, failedBoundary: "subject" as const,
      }),
      findings: Object.freeze([Object.freeze({
        code: "FOUNDATION_SUBJECT_REJECTED", severity: "critical" as const, detail: error.message,
      })]),
    })
  }
  try {
    authenticateIndependentUpstream(rootInput)
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    return Object.freeze({
      foundation: undefined,
      closure,
      authentication: Object.freeze({
        subjectAuthenticated: true, upstreamAuthenticated: false,
        supplementSemanticsAuthenticated: false, failedBoundary: "upstream" as const,
      }),
      findings: Object.freeze([Object.freeze({
        code: "FOUNDATION_SUBJECT_REJECTED", severity: "critical" as const, detail: error.message,
      })]),
    })
  }
  try {
    authenticateSupplementSemantics()
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    return Object.freeze({
      foundation: undefined,
      closure,
      authentication: Object.freeze({
        subjectAuthenticated: true, upstreamAuthenticated: true,
        supplementSemanticsAuthenticated: false, failedBoundary: "supplement" as const,
      }),
      findings: Object.freeze([Object.freeze({
        code: "FOUNDATION_SUBJECT_REJECTED", severity: "critical" as const, detail: error.message,
      })]),
    })
  }
  return Object.freeze({
    foundation: Object.freeze({
      ...closure,
      secureCurrentMode: "0600" as const,
      ordinaryCurrentMode: "0644" as const,
      upstreamAuthenticated: true as const,
      supplementSemanticsAuthenticated: true as const,
      supplementRoot: independentlyRenderSupplement().supplementRoot,
      producerCalls: 0 as const,
      freshCharged: 0 as const,
      freshAccepted: 0 as const,
      downstreamAuthority: "denied" as const,
    }),
    closure,
    authentication: Object.freeze({
      subjectAuthenticated: true, upstreamAuthenticated: true,
      supplementSemanticsAuthenticated: true, failedBoundary: null,
    }),
    findings: Object.freeze([] as V138Plan116Finding[]),
  })
}

const prepareWorktree = (repoRoot: string, owner: string, name: string): string => {
  const worktree = path.join(owner, name)
  command("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", worktree, SUBJECT_COMMIT], repoRoot)
  symlinkSync(realpathSync(path.join(repoRoot, "node_modules")), path.join(worktree, "node_modules"), "dir")
  for (const repoPath of SECURE_PATHS) chmodSync(target(worktree, repoPath), 0o600)
  for (const repoPath of ORDINARY_PATHS) chmodSync(target(worktree, repoPath), 0o644)
  return worktree
}
const removeWorktree = (repoRoot: string, worktree: string): void => {
  command("/usr/bin/git", ["worktree", "remove", "--force", worktree], repoRoot)
}
const runAdapter = (root: string, selector: string, env?: NodeJS.ProcessEnv): Json => {
  const output = command(path.join(root, "node_modules/.bin/tsx"), [ADAPTER_PATH, selector], root, env)
  let value: unknown
  try { value = JSON.parse(output) }
  catch { throw new Error(`V138_PLAN116_PROCESS_INTEGRITY:json:${selector}`) }
  if (typeof value !== "object" || value === null) throw new Error("V138_PLAN116_PROCESS_INTEGRITY:shape")
  return value as Json
}
const observation = (mode: string, detail: Json = {}) => Object.freeze({
  mode, status: "passed" as const, detail,
  observationRoot: rooted("v138-plan-262-116-mode-observation-v1", { mode, detail }),
})
const runParentSwapMode = (repoRoot: string, owner: string): void => {
  const worktree = prepareWorktree(repoRoot, owner, "parent-swap")
  const driver = path.join(owner, "parent-swap-driver.mjs")
  const external = path.join(owner, "external")
  const artifacts = path.join(worktree, ".planning/artifacts")
  const retained = path.join(worktree, ".planning/artifacts-retained")
  const ready = path.join(worktree, ".v138-plan115-ready-plan116")
  const proceed = path.join(worktree, ".v138-plan115-continue-plan116")
  writeFileSync(driver, [
    "import { spawn } from 'node:child_process'",
    "import { existsSync, mkdirSync, renameSync, symlinkSync, writeFileSync, unlinkSync } from 'node:fs'",
    "const [root,tsx,adapter,selector,external,artifacts,retained,ready,proceed]=process.argv.slice(2)",
    "mkdirSync(external,{recursive:true})",
    "const child=spawn(tsx,[adapter,selector],{cwd:root,env:{...process.env,V138_PLAN115_NATIVE_TEST_BARRIER:'plan116'},stdio:['ignore','ignore','pipe']})",
    "let stderr=''; child.stderr.setEncoding('utf8').on('data',(chunk)=>{stderr+=chunk})",
    "for(let i=0;i<5000&&!existsSync(ready);i++) await new Promise((resolve)=>setTimeout(resolve,1))",
    "if(!existsSync(ready)) process.exit(21)",
    "renameSync(artifacts,retained); symlinkSync(external,artifacts,'dir'); writeFileSync(proceed,'continue\\n')",
    "const status=await new Promise((resolve)=>child.once('exit',resolve))",
    "unlinkSync(artifacts); renameSync(retained,artifacts)",
    "if(status===0||!stderr.includes('V138_PLAN115_NATIVE_PARENT_CHANGED')) process.exit(22)",
  ].join("\n"), { mode: 0o600 })
  try {
    command(process.execPath, [driver, worktree, path.join(worktree, "node_modules/.bin/tsx"),
      ADAPTER_PATH, WRITE_SELECTOR, external, artifacts, retained, ready, proceed], owner)
    if (existsSync(target(worktree, PATHS.supplement3)) || existsSync(path.join(external, path.basename(PATHS.supplement3))))
      fail("V138_PLAN116_PARENT_SWAP_ESCAPED")
  } finally { removeWorktree(repoRoot, worktree) }
}
const runCacheMode = (repoRoot: string, owner: string): void => {
  const worktree = prepareWorktree(repoRoot, owner, "cache")
  const cache = mkdtempSync("/tmp/v138-p116-cache-")
  const nativeDigest = createHash("sha256").update(readFileSync(target(repoRoot, NATIVE_PATH))).digest("hex")
  const legacy = path.join(cache, `cowards-v138-plan115-writer-${nativeDigest}`)
  const marker = path.join(cache, "poison-executed")
  writeFileSync(legacy, `#!/bin/sh\nprintf poison > ${JSON.stringify(marker)}\nexit 0\n`, { mode: 0o700, flag: "wx" })
  try {
    const value = runAdapter(worktree, WRITE_SELECTOR, { ...process.env, TMPDIR: cache })
    if (value.status !== "supplement_v3_written" || existsSync(marker)) fail("V138_PLAN116_CACHE_POISON_EXECUTED")
  } finally {
    removeWorktree(repoRoot, worktree)
    rmSync(cache, { recursive: true, force: true })
  }
}

export const executeV138Plan116DisposableModes = (repoRootInput: string) => {
  const repoRoot = path.resolve(repoRootInput)
  const initial = captureV138Plan116FoundationForReview(repoRoot)
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan116-review-"))
  chmodSync(owner, 0o700)
  const observations: Array<ReturnType<typeof observation>> = []
  let primary = ""
  try {
    const shared = runAdapter(repoRoot, SOURCE_SELECTOR)
    if (shared.status !== "source_only_checked" || shared.liveInvoked !== false ||
        shared.freshCharged !== 0 || shared.freshAccepted !== 0)
      fail("MODE_SHARED_SOURCE_ONLY_FAILED")
    observations.push(observation(MODE_NAMES[0], { status: shared.status }))

    primary = prepareWorktree(repoRoot, owner, "primary")
    const source = runAdapter(primary, SOURCE_SELECTOR)
    if (source.status !== "source_only_checked") fail("MODE_DISPOSABLE_SOURCE_ONLY_FAILED")
    observations.push(observation(MODE_NAMES[1], {
      status: source.status,
      subjectCommit: git(primary, ["rev-parse", "HEAD"]),
    }))
    const written = runAdapter(primary, WRITE_SELECTOR)
    if (written.status !== "supplement_v3_written" ||
        canonical(JSON.parse(readFileSync(target(primary, PATHS.supplement3), "utf8"))) !==
          canonical(independentlyRenderSupplement())) fail("MODE_EXCLUSIVE_WRITE_FAILED")
    observations.push(observation(MODE_NAMES[2], { supplementRoot: written.supplementRoot }))

    command("/usr/bin/git", ["add", "--", PATHS.supplement3], primary)
    command("/usr/bin/git", ["-c", "user.name=Plan 116 Disposable",
      "-c", "user.email=plan116@example.invalid", "commit", "--quiet", "-m",
      "disposable supplement v3"], primary)
    const publicationCommit = git(primary, ["rev-parse", "HEAD"])
    const scope = git(primary, ["diff-tree", "--no-commit-id", "--name-status", "-r", publicationCommit])
    if (scope !== `A\t${PATHS.supplement3}` ||
        !git(primary, ["ls-tree", publicationCommit, "--", PATHS.supplement3]).startsWith("100644 blob "))
      fail("MODE_EXACT_ONE_PATH_COMMIT_FAILED")
    observations.push(observation(MODE_NAMES[3], { publicationCommit }))
    const first = runAdapter(primary, COMMITTED_SELECTOR)
    if (first.status !== "supplement_v3_committed_checked") fail("MODE_COMMITTED_CHECK_FAILED")
    observations.push(observation(MODE_NAMES[4], { publicationCommit: first.publicationCommit }))
    const second = runAdapter(primary, COMMITTED_SELECTOR)
    if (canonical(first) !== canonical(second)) fail("MODE_REPEAT_CHECK_FAILED")
    observations.push(observation(MODE_NAMES[5], { publicationCommit: second.publicationCommit }))

    runParentSwapMode(repoRoot, owner)
    observations.push(observation(MODE_NAMES[6]))
    runCacheMode(repoRoot, owner)
    observations.push(observation(MODE_NAMES[7]))

    const supplementBytes = readFileSync(target(primary, PATHS.supplement3))
    writeFileSync(target(primary, PATHS.supplement3), "{}\n")
    commandRejected(path.join(primary, "node_modules/.bin/tsx"), [ADAPTER_PATH, COMMITTED_SELECTOR], primary,
      /CURRENT_BYTES_INVALID|SUPPLEMENT_INVALID/u)
    writeFileSync(target(primary, PATHS.supplement3), supplementBytes)
    chmodSync(target(primary, PATHS.supplement3), 0o755)
    commandRejected(path.join(primary, "node_modules/.bin/tsx"), [ADAPTER_PATH, COMMITTED_SELECTOR], primary,
      /FILE_UNSAFE/u)
    chmodSync(target(primary, PATHS.supplement3), 0o644)
    const ordinaryMode = lstatSync(target(primary, PATHS.plan114Payload)).mode & 0o7777
    chmodSync(target(primary, PATHS.plan114Payload), 0o600)
    commandRejected(path.join(primary, "node_modules/.bin/tsx"), [ADAPTER_PATH, COMMITTED_SELECTOR], primary,
      /FILE_UNSAFE/u)
    chmodSync(target(primary, PATHS.plan114Payload), ordinaryMode)
    observations.push(observation(MODE_NAMES[8], { mutationsRejected: 3 }))

    if (observations.length !== MODE_NAMES.length) fail("V138_PLAN116_MODE_COUNT_INVALID")
    const final = captureV138Plan116FoundationForReview(repoRoot)
    if (final.reviewedClosureRoot !== initial.reviewedClosureRoot ||
        final.localExecutionClosureRoot !== initial.localExecutionClosureRoot)
      throw new Error("V138_PLAN116_PROCESS_INTEGRITY:FOUNDATION_CHANGED")
    return Object.freeze({
      modeNames: MODE_NAMES,
      actualModesPassed: observations.length,
      producerCalls: 0 as const,
      readinessInvoked: false as const,
      liveInvoked: false as const,
      freshCharged: 0 as const,
      freshAccepted: 0 as const,
      findings: Object.freeze([] as V138Plan116Finding[]),
      observations: Object.freeze(observations),
      observationRoot: rooted("v138-plan-262-116-observations-v1", observations),
      disposableExecutionClosureRoot: captureSubjectClosure(primary).localExecutionClosureRoot,
      downstreamAuthority: "denied" as const,
    })
  } finally {
    if (primary !== "" && existsSync(primary)) {
      try { removeWorktree(repoRoot, primary) } catch { /* retain primary observation */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

type ModeResult = ReturnType<typeof executeV138Plan116DisposableModes>
const validSha = (value: unknown): value is Sha =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const validateModeEvidence = (modes: {
  modeNames: unknown
  actualModesPassed: unknown
  observations: unknown
  observationRoot: unknown
  disposableExecutionClosureRoot: unknown
  findings: unknown
  producerCalls: unknown
  readinessInvoked: unknown
  liveInvoked: unknown
  freshCharged: unknown
  freshAccepted: unknown
}): readonly Json[] => {
  if (canonical(modes.modeNames) !== canonical(MODE_NAMES) ||
      modes.actualModesPassed !== MODE_NAMES.length || !Array.isArray(modes.observations) ||
      modes.observations.length !== MODE_NAMES.length || !Array.isArray(modes.findings) ||
      modes.findings.length !== 0 || modes.producerCalls !== 0 || modes.readinessInvoked !== false ||
      modes.liveInvoked !== false || modes.freshCharged !== 0 || modes.freshAccepted !== 0 ||
      !validSha(modes.disposableExecutionClosureRoot)) fail("V138_PLAN116_MODE_EVIDENCE_INVALID")
  const roots = new Set<string>()
  for (const [index, item] of modes.observations.entries()) {
    if (typeof item !== "object" || item === null) fail("V138_PLAN116_MODE_EVIDENCE_INVALID")
    const record = item as Json
    const detail = record.detail
    if (record.mode !== MODE_NAMES[index] || record.status !== "passed" ||
        typeof detail !== "object" || detail === null || Array.isArray(detail) ||
        record.observationRoot !== rooted("v138-plan-262-116-mode-observation-v1",
          { mode: record.mode, detail }) || roots.has(record.observationRoot))
      fail("V138_PLAN116_MODE_EVIDENCE_INVALID")
    roots.add(record.observationRoot)
  }
  if (modes.observationRoot !== rooted("v138-plan-262-116-observations-v1", modes.observations))
    fail("V138_PLAN116_MODE_EVIDENCE_INVALID")
  return modes.observations as readonly Json[]
}
const sortedFindings = (findings: readonly V138Plan116Finding[]) =>
  [...findings].sort((a, b) => `${a.code}\0${a.detail}`.localeCompare(`${b.code}\0${b.detail}`))
export const classifyV138Plan116ModeFailureForReview = (error: unknown): V138Plan116Finding => {
  if (error instanceof TypeError && /^(?:MODE_[A-Z0-9_]+_FAILED|V138_SUPPLEMENT_ADAPTER_(?:FILE_UNSAFE|CURRENT_BYTES_INVALID|SUPPLEMENT_INVALID))(?::|$)/u.test(error.message))
    return Object.freeze({
      code: "ACTUAL_MODE_SUBJECT_REJECTED",
      severity: "critical" as const,
      detail: error.message,
    })
  throw error
}
const renderContracts = (input: {
  closure?: ReturnType<typeof captureSubjectClosure>
  authentication: Readonly<{
    subjectAuthenticated: boolean
    upstreamAuthenticated: boolean
    supplementSemanticsAuthenticated: boolean
    failedBoundary: "subject" | "upstream" | "supplement" | null
  }>
  findings: readonly V138Plan116Finding[]
  actualModesPassed: number
  observations: readonly Json[]
  observationRoot?: Sha
  disposableExecutionClosureRoot?: Sha
  modeEvidenceAuthenticated?: boolean
}) => {
  const findings = sortedFindings(input.findings)
  const zero = findings.length === 0
  const plan109Eligible = zero && input.modeEvidenceAuthenticated === true &&
    input.authentication.subjectAuthenticated && input.authentication.upstreamAuthenticated &&
    input.authentication.supplementSemanticsAuthenticated
  const supplement = independentlyRenderSupplement()
  const body = {
    schemaVersion: "v1.38-plan-262-116-supplement-v3-adapter-review-payload-v2",
    protocol: "independent-source-separated-adapter-review-v2",
    supersedesPublicationCommit: V1_PUBLICATION_COMMIT,
    supersededV1Plan109Eligible: false,
    subjectCommit: SUBJECT_COMMIT,
    subjectTree: SUBJECT_TREE,
    subjectParent: SUBJECT_PARENT,
    subjectEntries: input.closure?.subjectEntries ?? SUBJECT_ENTRIES,
    recursiveDependencyRoot: input.closure?.recursiveDependencyRoot ?? null,
    recursiveDependencyCount: input.closure?.recursiveDependencyCount ?? 0,
    nativeInputRoot: input.closure?.nativeInputRoot ?? null,
    packageManifestRoot: input.closure?.packageManifestRoot ?? null,
    reviewedClosureRoot: input.closure?.reviewedClosureRoot ?? null,
    localExecutionClosureRoot: input.closure?.localExecutionClosureRoot ?? null,
    disposableExecutionClosureRoot: input.disposableExecutionClosureRoot ?? null,
    subjectAuthenticated: input.authentication.subjectAuthenticated,
    upstreamAuthenticated: input.authentication.upstreamAuthenticated,
    supplementSemanticsAuthenticated: input.authentication.supplementSemanticsAuthenticated,
    failedBoundary: input.authentication.failedBoundary,
    supplementRoot: supplement.supplementRoot,
    secureCurrentMode: "0600",
    ordinaryCurrentMode: "0644",
    reviewStatus: zero ? "zero_findings" : "blocked",
    findings,
    findingCount: findings.length,
    findingCodes: findings.map(({ code }) => code),
    findingRoot: rooted("v138-plan-262-116-findings-v1", findings),
    actualModeNames: MODE_NAMES,
    actualModesPassed: input.actualModesPassed,
    observations: input.observations,
    observationRoot: input.observationRoot ?? rooted("v138-plan-262-116-observations-v1", []),
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    counters: ZERO_COUNTERS,
    supplementPublished: false,
    plan109Eligible,
    authorizesExecution: false,
    phase263PlanningAuthorized: false,
    candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    productAuthorized: false,
    productionAuthorized: false,
    downstreamAuthority: "denied",
  }
  const payload = Object.freeze({ ...body, payloadRoot: rooted(
    "v138-plan-262-116-supplement-v3-adapter-review-payload-v2", body,
  ) })
  const reviewBody = {
    payloadRoot: payload.payloadRoot,
    reviewStatus: payload.reviewStatus,
    findingRoot: payload.findingRoot,
    actualModesPassed: payload.actualModesPassed,
    plan109Eligible,
    producerCalls: 0,
    freshCharged: 0,
    freshAccepted: 0,
    downstreamAuthority: "denied",
  }
  const reviewRoot = rooted("v138-plan-262-116-supplement-v3-adapter-review-markdown-v2", reviewBody)
  const reviewBytes = zero
    ? Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "116"\nreview_type: independent_supplement_v3_adapter_review_v2\nstatus: zero_findings\nfinding_count: 0\nreview_root: ${reviewRoot}\n---\n\n# Phase 262 Plan 116: Corrected Supplement-v3 Adapter Review\n\n**ZERO FINDINGS.** All nine distinct, rooted actual observations and the disposable closure authenticated. The original v1 trio is immutable superseded history and ineligible. Only revised Plan 109 is eligible. Supplement published: false. Producer calls: 0. Fresh charged/accepted: 0/0. Live/readiness invoked: false. Downstream authority: denied.\n`)
    : Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "116"\nreview_type: independent_supplement_v3_adapter_review_v2\nstatus: blocked\nfinding_count: ${findings.length}\nreview_root: ${reviewRoot}\n---\n\n# Phase 262 Plan 116: Corrected Supplement-v3 Adapter Review\n\n**BLOCKED.** Finding codes: ${findings.map(({ code }) => code).join(", ")}. Failed boundary: ${input.authentication.failedBoundary ?? "actual_modes"}. The original v1 trio and revised Plan 109 are ineligible. Supplement published: false. Producer calls: 0. Fresh charged/accepted: 0/0. Live/readiness invoked: false. Downstream authority: denied.\n`)
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v2",
    protocol: "nonrecursive-external-review-carrier-v2",
    supersedesPublicationCommit: V1_PUBLICATION_COMMIT,
    supersededV1Plan109Eligible: false,
    payloadRoot: payload.payloadRoot,
    reviewRoot,
    findingCount: findings.length,
    actualModesPassed: input.actualModesPassed,
    subjectCommit: SUBJECT_COMMIT,
    supplementRoot: supplement.supplementRoot,
    plan109Eligible,
    supplementPublished: false,
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...carrierBody, carrierRoot: rooted(
    "v138-plan-262-116-supplement-v3-adapter-review-carrier-v2", carrierBody,
  ) })
  return Object.freeze({ payload, reviewBytes, reviewRoot, carrier, plan109Eligible })
}

export const renderV138Plan116EvidenceForReview = (
  repoRootInput: string,
  findings: readonly V138Plan116Finding[],
  modes?: ModeResult,
  observed?: ReturnType<typeof observeV138Plan116FoundationForReview>,
) => {
  const captured = observed ?? observeV138Plan116FoundationForReview(repoRootInput)
  const closure = captured.closure
  const authentication = captured.authentication
  if (findings.length === 0 && modes === undefined) fail("V138_PLAN116_ZERO_REQUIRES_ACTUAL_MODES")
  const modeEvidenceAuthenticated = findings.length === 0
    ? (validateModeEvidence(modes!), true)
    : modes === undefined ? false : (validateModeEvidence(modes), true)
  return renderContracts({
    closure,
    authentication,
    findings,
    actualModesPassed: modes?.actualModesPassed ?? 0,
    observations: (modes?.observations ?? []) as readonly Json[],
    observationRoot: modes?.observationRoot,
    disposableExecutionClosureRoot: modes?.disposableExecutionClosureRoot,
    modeEvidenceAuthenticated,
  })
}

const locatePublicationCommit = (root: string): string => {
  const commits = git(root, ["log", "--diff-filter=A", "--format=%H", "--", PATHS.payload])
    .split("\n").filter(Boolean)
  if (commits.length === 0) fail("V138_PLAN116_PUBLICATION_ABSENT")
  if (commits.length !== 1 || !/^[0-9a-f]{40}$/u.test(commits[0]!))
    fail("V138_PLAN116_PUBLICATION_AMBIGUOUS")
  return commits[0]!
}
export const authenticateV138Plan116PublishedReview = (repoRootInput: string) => {
  const root = path.resolve(repoRootInput)
  if (!REVIEW_PATHS.every((repoPath) => pathPresent(root, repoPath)))
    fail("V138_PLAN116_PUBLICATION_PARTIAL_OR_ABSENT")
  const publicationCommit = locatePublicationCommit(root)
  exactPublication(root, publicationCommit, REVIEW_PATHS)
  const payload = jsonAt(root, publicationCommit, PATHS.payload)
  const carrier = jsonAt(root, publicationCommit, PATHS.carrier)
  const reviewBytes = gitBytes(root, publicationCommit, PATHS.review)
  const closure = captureSubjectClosure(root)
  authenticateIndependentUpstream(root)
  const findings = payload.findings as V138Plan116Finding[]
  if (!Array.isArray(findings) || payload.findingCount !== findings.length ||
      canonical(payload.findingCodes) !== canonical(findings.map(({ code }) => code)))
    fail("V138_PLAN116_FINDINGS_INVALID")
  const exact = renderContracts({
    closure,
    authentication: Object.freeze({
      subjectAuthenticated: true, upstreamAuthenticated: true,
      supplementSemanticsAuthenticated: true, failedBoundary: null,
    }),
    findings,
    actualModesPassed: payload.actualModesPassed,
    observations: payload.observations,
    observationRoot: payload.observationRoot,
    disposableExecutionClosureRoot: payload.disposableExecutionClosureRoot,
    modeEvidenceAuthenticated: (validateModeEvidence({
      modeNames: payload.actualModeNames,
      actualModesPassed: payload.actualModesPassed,
      observations: payload.observations,
      observationRoot: payload.observationRoot,
      disposableExecutionClosureRoot: payload.disposableExecutionClosureRoot,
      findings,
      producerCalls: payload.producerCalls,
      readinessInvoked: payload.readinessInvoked,
      liveInvoked: payload.liveInvoked,
      freshCharged: payload.freshCharged,
      freshAccepted: payload.freshAccepted,
    }), true),
  })
  if (canonical(payload) !== canonical(exact.payload) || !reviewBytes.equals(exact.reviewBytes) ||
      canonical(carrier) !== canonical(exact.carrier)) fail("V138_PLAN116_PUBLICATION_RERENDER_INVALID")
  assertAbsent(root, [PATHS.supplement1, PATHS.supplement2, PATHS.supplement3, ...EFFECT_PATHS])
  return Object.freeze({
    publicationCommit,
    payloadRoot: payload.payloadRoot,
    reviewRoot: carrier.reviewRoot,
    carrierRoot: carrier.carrierRoot,
    findingCount: findings.length,
    actualModesPassed: payload.actualModesPassed,
    plan109Eligible: exact.plan109Eligible,
    supplementPublished: false as const,
    producerCalls: 0 as const,
    readinessInvoked: false as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    downstreamAuthority: "denied" as const,
  })
}

export const writeV138Plan116ReviewForReview = (repoRootInput: string): void => {
  const root = path.resolve(repoRootInput)
  assertAbsent(root, [...REVIEW_PATHS, PATHS.supplement1, PATHS.supplement2, PATHS.supplement3,
    ...EFFECT_PATHS])
  const initial = observeV138Plan116FoundationForReview(root)
  let evidence: ReturnType<typeof renderContracts>
  if (initial.foundation === undefined) {
    evidence = renderV138Plan116EvidenceForReview(root, initial.findings, undefined, initial)
  } else {
    try {
      const modes = executeV138Plan116DisposableModes(root)
      evidence = renderV138Plan116EvidenceForReview(root, modes.findings, modes)
    } catch (error) {
      evidence = renderV138Plan116EvidenceForReview(root, [
        classifyV138Plan116ModeFailureForReview(error),
      ])
    }
  }
  const written: string[] = []
  try {
    for (const [repoPath, bytes] of [
      [PATHS.payload, Buffer.from(canonical(evidence.payload))],
      [PATHS.review, evidence.reviewBytes],
      [PATHS.carrier, Buffer.from(canonical(evidence.carrier))],
    ] as const) {
      writeFileSync(target(root, repoPath), bytes, { mode: 0o644, flag: "wx" })
      chmodSync(target(root, repoPath), 0o644)
      written.push(repoPath)
    }
  } catch (error) {
    for (const repoPath of written) rmSync(target(root, repoPath), { force: true })
    throw error
  }
}

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1) fail("V138_PLAN116_ARGUMENTS_INVALID")
  if (args[0] === "--write-review") { writeV138Plan116ReviewForReview(root); return }
  if (args[0] === "--check-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan116PublishedReview(root))}\n`)
    return
  }
  if (args[0] === "--check-observations") {
    process.stdout.write(`${JSON.stringify(executeV138Plan116DisposableModes(root))}\n`)
    return
  }
  fail("V138_PLAN116_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
