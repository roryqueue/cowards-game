import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync, closeSync, constants, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync,
  readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"

type Sha = `sha256:${string}`
type Json = Record<string, any>
type ClosureEntry = Readonly<{ path: string; mode: "100644" | "100755"; blob: string; sha256: Sha }>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const SOURCE = "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.ts"
const TEST = "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.test.ts"
export const V138_PLAN140_EXECUTOR = Object.freeze({
  commit: "222cecd6c8f633e1cec5ae916f95389f9a5f7876",
  source: SOURCE, sourceMode: "100644", sourceBlob: "28f8500db03bd81c2cbfe17c54f8cc2cf946e807",
  sourceSha256: "sha256:3bd4e8f2e5d994a45fe6a15659442ffe2e7e5b611ecf9205665597ef11fa43dc",
  test: TEST, testMode: "100644", testBlob: "dcf81600b80a0c07d2145d3c5eac030dab45765c",
  testSha256: "sha256:cfd5f3787184f2b6db033bf2de619b61ac6eeb03aa92f3b201738d8dba592b98",
} as const)
export const V138_PLAN140_NATIVE_IDENTITIES = Object.freeze([
  Object.freeze({ path: "scripts/native/v1-38-successor-transaction-helper-v6.c", mode: "100644",
    blob: "ca694310a8a99c30d7a4070a415b968d3e341409",
    sha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a" }),
  Object.freeze({ path: "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c", mode: "100644",
    blob: "99da3517ccb8b919759663daf713b4f20337b8b1",
    sha256: "sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea" }),
] as const)
export const V138_PLAN140_EFFECT_PATHS = Object.freeze([
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
const exactKeys = (value: unknown, keys: readonly string[], code: string): asserts value is Json => {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code)
}
const isSha = (value: unknown): value is Sha =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const gitEnv = Object.freeze({ PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: "/dev/null",
  LANG: "C", LC_ALL: "C", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_OPTIONAL_LOCKS: "0", GIT_NO_REPLACE_OBJECTS: "1" })
const git = (root: string, args: readonly string[]): string => execFileSync("git", ["-C", root,
  "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-c", "filter.lfs.smudge=",
  ...args], { encoding: "utf8", env: gitEnv }).trim()
const gitBytes = (root: string, args: readonly string[]): Buffer => execFileSync("git", ["-C", root,
  "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-c", "filter.lfs.smudge=",
  ...args], { env: gitEnv, maxBuffer: 256 * 1024 * 1024 })

const readNoFollow = (absolute: string, mode?: number): Buffer => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor)
    if (!before.isFile() || (mode !== undefined && (before.mode & 0o7777) !== mode) ||
        before.size > 256 * 1024 * 1024) fail("V138_PLAN140_CURRENT_ENTRY_INVALID")
    const bytes = readFileSync(descriptor); const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail("V138_PLAN140_CURRENT_ENTRY_CHANGED")
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN140_")) throw error
    fail("V138_PLAN140_CURRENT_ENTRY_INVALID")
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
}
const absent = (absolute: string, code: string): void => {
  try { lstatSync(absolute); fail(code) }
  catch (error) {
    if (error instanceof Error && error.message === code) throw error
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") fail(code)
  }
}
export const checkV138Plan140EffectPathsAbsentForReview = (rootInput: string): true => {
  const root = path.resolve(rootInput)
  for (const repoPath of V138_PLAN140_EFFECT_PATHS) {
    const absolute = target(root, repoPath)
    try { lstatSync(absolute); fail(`V138_PLAN140_EFFECT_PATH_OCCUPIED:${repoPath}`) }
    catch (error) {
      if (error instanceof Error && error.message.startsWith("V138_PLAN140_")) throw error
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        fail(`V138_PLAN140_EFFECT_PATH_LOOKUP_FAILED:${repoPath}`)
    }
  }
  return true
}

type History = Readonly<{ root: string; head: string; git: (args: readonly string[]) => string
  gitBytes: (args: readonly string[]) => Buffer; dispose: () => void }>
const metadataState = (root: string): string => {
  const gitDir = realpathSync(git(root, ["rev-parse", "--absolute-git-dir"]))
  const common = realpathSync(git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]))
  const objects = realpathSync(path.join(common, "objects"))
  const optional = (absolute: string): string => {
    try { const stat = lstatSync(absolute); return `${stat.mode}:${stat.size}:${sha(readNoFollow(absolute))}` }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"; throw error }
  }
  return canonical({ gitDir, common, objects, head: git(root, ["rev-parse", "HEAD"]),
    format: git(root, ["rev-parse", "--show-object-format"]),
    config: git(root, ["config", "--local", "--list"]),
    replaces: git(root, ["for-each-ref", "--format=%(refname):%(objectname)", "refs/replace"]),
    grafts: optional(path.join(common, "info/grafts")), shallow: optional(path.join(common, "shallow")),
    alternates: optional(path.join(objects, "info/alternates")),
    packedRefs: optional(path.join(common, "packed-refs")), gitHead: optional(path.join(gitDir, "HEAD")) })
}
const assertMetadataSafe = (root: string): void => {
  if (git(root, ["rev-parse", "--show-object-format"]) !== "sha1")
    fail("V138_PLAN140_OBJECT_FORMAT_UNSUPPORTED")
  const config = git(root, ["config", "--local", "--list"])
  if (/(?:^|\n)(?:include\.[^=]*|includeif\.[^=]*|alias\.[^=]*|protocol\.[^=]*|url\..*\.insteadof|core\.(?:hooksPath|fsmonitor|attributesfile|sshcommand)|extensions\.objectformat)=/iu.test(config))
    fail("V138_PLAN140_REPOSITORY_CONFIG_FORBIDDEN")
  if (git(root, ["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "")
    fail("V138_PLAN140_REPLACE_REF_FORBIDDEN")
  const common = realpathSync(git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]))
  const objects = realpathSync(path.join(common, "objects"))
  absent(path.join(common, "info/grafts"), "V138_PLAN140_GRAFTS_FORBIDDEN")
  absent(path.join(common, "shallow"), "V138_PLAN140_SHALLOW_FORBIDDEN")
  absent(path.join(objects, "info/alternates"), "V138_PLAN140_ALTERNATES_FORBIDDEN")
}
const createHistory = (rootInput: string): History => {
  const root = realpathSync(path.resolve(rootInput)); assertMetadataSafe(root)
  const before = metadataState(root); const head = git(root, ["rev-parse", "--verify", "HEAD^{commit}"])
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan140-history-")); chmodSync(owner, 0o700)
  const snapshot = path.join(owner, "bare.git")
  try {
    execFileSync("git", ["clone", "--quiet", "--bare", "--no-local", root, snapshot], { env: gitEnv })
    if (metadataState(root) !== before) fail("V138_PLAN140_REPOSITORY_METADATA_CHANGED")
    assertMetadataSafe(root)
    writeFileSync(path.join(snapshot, "config"), "[core]\n\trepositoryformatversion = 0\n\tbare = true\n",
      { mode: 0o600 })
    writeFileSync(path.join(snapshot, "HEAD"), `${head}\n`, { mode: 0o600 })
    const snapshotGit = (args: readonly string[]): string => git(snapshot, ["--git-dir", snapshot, ...args])
    const snapshotBytes = (args: readonly string[]): Buffer => gitBytes(snapshot,
      ["--git-dir", snapshot, ...args])
    if (snapshotGit(["rev-parse", "--verify", "HEAD^{commit}"]) !== head ||
        snapshotGit(["rev-parse", "--show-object-format"]) !== "sha1")
      fail("V138_PLAN140_HISTORY_SNAPSHOT_INVALID")
    return Object.freeze({ root: snapshot, head, git: snapshotGit, gitBytes: snapshotBytes,
      dispose: () => rmSync(owner, { recursive: true, force: true }) })
  } catch (error) { rmSync(owner, { recursive: true, force: true }); throw error }
}
const assertAncestor = (history: History, ancestor: string): void => {
  try { history.git(["merge-base", "--is-ancestor", ancestor, history.head]) }
  catch { fail("V138_PLAN140_HEAD_NOT_DESCENDANT") }
}
const entryAt = (history: History, commit: string, repoPath: string): ClosureEntry => {
  const line = history.git(["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(line)
  if (match === null || match[3] !== repoPath) fail(`V138_PLAN140_CLOSURE_ENTRY_INVALID:${repoPath}`)
  const bytes = history.gitBytes(["cat-file", "blob", `${commit}:${repoPath}`])
  return Object.freeze({ path: repoPath, mode: match[1] as "100644" | "100755", blob: match[2]!, sha256: sha(bytes) })
}
const importPaths = (repoPath: string, bytes: Buffer): string[] => {
  if (!/\.[cm]?tsx?$/u.test(repoPath)) return []
  const file = ts.createSourceFile(repoPath, bytes.toString("utf8"), ts.ScriptTarget.Latest, true,
    repoPath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const found: string[] = []
  const add = (specifier: string): void => {
    if (!specifier.startsWith(".")) return
    const raw = path.posix.normalize(path.posix.join(path.posix.dirname(repoPath), specifier))
    found.push(raw.replace(/\.js$/u, ".ts").replace(/\.mjs$/u, ".mts"))
  }
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined &&
        ts.isStringLiteral(node.moduleSpecifier)) add(node.moduleSpecifier.text)
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]!)) add(node.arguments[0]!.text)
    ts.forEachChild(node, visit)
  }
  visit(file); return found
}
const declaredPaths = (bytes: Buffer): string[] => {
  const source = bytes.toString("utf8")
  const expected = [
    "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
    "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
    "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
    "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
    "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.test.ts",
    "scripts/native/v1-38-successor-transaction-helper-v6.c",
  ]
  for (const repoPath of expected) if (!source.includes(repoPath))
    fail(`V138_PLAN140_DECLARED_CLOSURE_PATH_MISSING:${repoPath}`)
  return expected
}
const installedRuntime = (root: string) => {
  const identities: Json[] = []
  const addFile = (label: string, absolute: string): void => {
    const resolved = realpathSync(absolute); const bytes = readNoFollow(resolved)
    identities.push(Object.freeze({ label, sha256: sha(bytes), size: bytes.length }))
  }
  addFile("node-executable", process.execPath)
  addFile("tsx-launcher", target(root, "node_modules/.bin/tsx"))
  addFile("tsx-package", target(root, "node_modules/tsx/package.json"))
  addFile("typescript-package", target(root, "node_modules/typescript/package.json"))
  const body = Object.freeze({ node: process.version, v8: process.versions.v8,
    modules: process.versions.modules, platform: process.platform, arch: process.arch,
    files: Object.freeze(identities) })
  return Object.freeze({ ...body, installedRuntimeRoot: rooted("v138-plan-262-140-installed-runtime-v9", body) })
}
const authenticateClosure = (root: string, history: History) => {
  assertAncestor(history, V138_PLAN140_EXECUTOR.commit)
  const paths = new Set<string>([SOURCE, TEST]); const queue = [SOURCE, TEST]
  const sourceBytes = history.gitBytes(["cat-file", "blob", `${V138_PLAN140_EXECUTOR.commit}:${SOURCE}`])
  for (const repoPath of declaredPaths(sourceBytes)) { if (!paths.has(repoPath)) { paths.add(repoPath); queue.push(repoPath) } }
  while (queue.length > 0) {
    const repoPath = queue.shift()!; const entry = entryAt(history, V138_PLAN140_EXECUTOR.commit, repoPath)
    const bytes = history.gitBytes(["cat-file", "blob", `${V138_PLAN140_EXECUTOR.commit}:${repoPath}`])
    for (const imported of importPaths(repoPath, bytes)) {
      if (paths.has(imported)) continue
      try { entryAt(history, V138_PLAN140_EXECUTOR.commit, imported) }
      catch { fail(`V138_PLAN140_UNRESOLVED_LOCAL_EDGE:${repoPath}:${imported}`) }
      paths.add(imported); queue.push(imported)
    }
    if (entry.path === SOURCE && (entry.mode !== V138_PLAN140_EXECUTOR.sourceMode ||
        entry.blob !== V138_PLAN140_EXECUTOR.sourceBlob || entry.sha256 !== V138_PLAN140_EXECUTOR.sourceSha256))
      fail("V138_PLAN140_EXECUTOR_SOURCE_INVALID")
    if (entry.path === TEST && (entry.mode !== V138_PLAN140_EXECUTOR.testMode ||
        entry.blob !== V138_PLAN140_EXECUTOR.testBlob || entry.sha256 !== V138_PLAN140_EXECUTOR.testSha256))
      fail("V138_PLAN140_EXECUTOR_TEST_INVALID")
  }
  const entries = Object.freeze([...paths].sort().map((repoPath) => entryAt(history,
    V138_PLAN140_EXECUTOR.commit, repoPath)))
  for (const identity of V138_PLAN140_NATIVE_IDENTITIES) {
    const actual = entries.find(({ path: repoPath }) => repoPath === identity.path)
    if (actual === undefined || canonical(actual) !== canonical(identity))
      fail(`V138_PLAN140_NATIVE_IDENTITY_INVALID:${identity.path}`)
  }
  const runtime = installedRuntime(root)
  const body = Object.freeze({ executorCommit: V138_PLAN140_EXECUTOR.commit, entries, runtime })
  return Object.freeze({ ...body, executorClosureRoot: rooted("v138-plan-262-140-executor-closure-v9", body) })
}
const linkDependencies = (sourceRoot: string, linkedRoot: string): void => {
  symlinkSync(path.join(sourceRoot, "node_modules"), path.join(linkedRoot, "node_modules"), "dir")
  for (const workspace of ["apps/runtime-service", "apps/web", "apps/worker", "packages/engine",
    "packages/golden", "packages/map-configs", "packages/persistence", "packages/replay",
    "packages/runtime-js", "packages/runtime-python", "packages/runtime-supervisor",
    "packages/runtime-wasm-wasi", "packages/service", "packages/spec", "packages/test-utils"]) {
    const source = path.join(sourceRoot, workspace, "node_modules")
    try { realpathSync(source) } catch { continue }
    const destination = path.join(linkedRoot, workspace, "node_modules")
    mkdirSync(path.dirname(destination), { recursive: true }); symlinkSync(source, destination, "dir")
  }
}
const runExactExecutor = (root: string, history: History, closure: ReturnType<typeof authenticateClosure>) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan140-executor-")); const checkout = path.join(owner, "repo")
  mkdirSync(checkout, { mode: 0o700 })
  try {
    const archive = history.gitBytes(["archive", "--format=tar", V138_PLAN140_EXECUTOR.commit,
      ...closure.entries.map(({ path: repoPath }) => repoPath)])
    execFileSync("tar", ["-x", "-C", checkout], { input: archive, env: gitEnv })
    for (const entry of closure.entries) {
      const bytes = readNoFollow(target(checkout, entry.path), entry.mode === "100755" ? 0o755 : 0o644)
      if (sha(bytes) !== entry.sha256) fail(`V138_PLAN140_EXTRACTED_CLOSURE_INVALID:${entry.path}`)
    }
    linkDependencies(root, checkout)
    const runner = target(checkout, "scripts/.plan140-runner.ts")
    writeFileSync(runner, `import { executeV138Plan133DisposableObservationsForReview } from ${JSON.stringify(pathToFileURL(target(checkout, SOURCE)).href)}; const value=executeV138Plan133DisposableObservationsForReview(${JSON.stringify(root)}); process.stdout.write(JSON.stringify(value));`, { mode: 0o600, flag: "wx" })
    const result = spawnSync(target(checkout, "node_modules/.bin/tsx"), [runner], { cwd: checkout,
      encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: 340_000,
      env: { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: owner, LANG: "C", LC_ALL: "C" },
      stdio: ["ignore", "pipe", "pipe"] })
    if (result.status !== 0) fail(`V138_PLAN140_EXECUTOR_FAILED:${result.stderr.trim()}`)
    return JSON.parse(result.stdout) as Json
  } finally { rmSync(owner, { recursive: true, force: true }) }
}
export const computeV138Plan140StableRecordRootForReview = (input: {
  executorClosureRoot: Sha; nativeIdentities: readonly Json[]; mode: string; ordinal: number
  reducedValue: Json; producerGuardCount: number
}): Sha => rooted("v138-plan-262-140-stable-execution-record-v9", input)

const validateGenuine = (execution: Json, closure: ReturnType<typeof authenticateClosure>) => {
  exactKeys(execution, ["actualModesPassed", "authorizesExecution", "canonicalAfter", "canonicalBefore",
    "downstreamAuthority", "findings", "freshAccepted", "freshCharged", "liveInvoked", "observations",
    "observationsRoot", "producerCalls", "readinessInvoked"], "V138_PLAN140_EXECUTION_SCHEMA_INVALID")
  if (!Array.isArray(execution.observations) || execution.observations.length !== MODES.length ||
      !Array.isArray(execution.findings) || execution.findings.length !== 0 ||
      execution.actualModesPassed !== 6 || execution.authorizesExecution !== false ||
      execution.downstreamAuthority !== "denied" || execution.producerCalls !== 0 ||
      execution.readinessInvoked !== false || execution.liveInvoked !== false ||
      execution.freshCharged !== 0 || execution.freshAccepted !== 0)
    fail("V138_PLAN140_EXECUTION_SEMANTICS_INVALID")
  const stable = execution.observations.map((item: unknown, ordinal: number) => {
    exactKeys(item, ["disposableLocalExecutionClosureRoot", "disposableLocalGitObjectRoot",
      "disposableLocalInstalledClosureRoot", "disposableLocalNativeSourcePaths",
      "disposableLocalNativeSourcesRoot", "disposableReviewedClosureRoot", "mode", "observationRoot",
      "producerGuardCount", "reducedValue", "status"], "V138_PLAN140_GENUINE_SCHEMA_INVALID")
    const [mode, status] = MODES[ordinal]!
    if (item.mode !== mode || item.status !== status || item.producerGuardCount !== 0 ||
        canonical(item.reducedValue) !== canonical(REDUCED[ordinal]) ||
        !isSha(item.observationRoot) || !isSha(item.disposableLocalExecutionClosureRoot))
      fail("V138_PLAN140_GENUINE_SEMANTICS_INVALID")
    if (!Array.isArray(item.disposableLocalNativeSourcePaths) ||
        item.disposableLocalNativeSourcePaths.length !== V138_PLAN140_NATIVE_IDENTITIES.length)
      fail("V138_PLAN140_GENUINE_NATIVE_INVALID")
    for (const [nativeOrdinal, absolute] of item.disposableLocalNativeSourcePaths.entries()) {
      const expected = V138_PLAN140_NATIVE_IDENTITIES[nativeOrdinal]!.path
      if (typeof absolute !== "string" || !path.isAbsolute(absolute) || !absolute.endsWith(expected) ||
          !absolute.includes(`/v138-plan133-mode-${ordinal}-`) || !absolute.slice(0, -expected.length).endsWith("/repo/"))
        fail("V138_PLAN140_GENUINE_NATIVE_INVALID")
    }
    const { observationRoot, ...body } = item
    if (observationRoot !== rooted("v138-plan-262-133-mode-observation-v5", body))
      fail("V138_PLAN140_GENUINE_ROOT_INVALID")
    const recordBody = Object.freeze({ executorClosureRoot: closure.executorClosureRoot,
      nativeIdentities: V138_PLAN140_NATIVE_IDENTITIES, mode, ordinal,
      reducedValue: structuredClone(item.reducedValue), producerGuardCount: 0 })
    return Object.freeze({ ...recordBody,
      stableRecordRoot: computeV138Plan140StableRecordRootForReview(recordBody) })
  })
  return Object.freeze(stable)
}

const trusted = new WeakSet<object>()
export const buildV138Plan140ProspectiveV9ForReview = (rootInput: string) => {
  const root = realpathSync(path.resolve(rootInput)); checkV138Plan140EffectPathsAbsentForReview(root)
  const history = createHistory(root)
  try {
    const closure = authenticateClosure(root, history); const execution = runExactExecutor(root, history, closure)
    const observations = validateGenuine(execution, closure)
    checkV138Plan140EffectPathsAbsentForReview(root)
    const observationsRoot = rooted("v138-plan-262-140-stable-observations-v9", observations)
    const payloadBody = Object.freeze({ schemaVersion: "v1.38-plan-262-140-live-v13-custody-v9",
      protocol: "authenticated-executor-closure-stable-evidence-v9",
      executorCommit: V138_PLAN140_EXECUTOR.commit, executorClosure: closure,
      nativeIdentities: V138_PLAN140_NATIVE_IDENTITIES,
      mappingDomain: "v138-plan-262-140-stable-execution-record-v9",
      observations, observationsRoot,
      plan138Disposition: "process_invalid_unauthenticated_executor_metadata_and_effect_gate",
      plan139Executed: false, plan139Eligible: false, plan141Eligible: true, plan110Eligible: false,
      producerCalls: 0, readinessInvoked: false, liveInvoked: false, freshCharged: 0,
      freshAccepted: 0, authorizesExecution: false, downstreamAuthority: "denied" })
    const payload = Object.freeze({ ...payloadBody,
      payloadRoot: rooted("v138-plan-262-140-prospective-payload-v9", payloadBody) })
    const carrierBody = Object.freeze({ schemaVersion: "v1.38-plan-262-140-live-v13-custody-carrier-v9",
      payloadRoot: payload.payloadRoot, observationsRoot, executorClosureRoot: closure.executorClosureRoot,
      plan141Eligible: true, plan110Eligible: false, authorizesExecution: false,
      downstreamAuthority: "denied" })
    const carrier = Object.freeze({ ...carrierBody,
      carrierRoot: rooted("v138-plan-262-140-prospective-carrier-v9", carrierBody) })
    const result = Object.freeze({ payload, carrier }); trusted.add(result)
    return result
  } finally { history.dispose() }
}
const validateProspective = (value: unknown): void => {
  exactKeys(value, ["carrier", "payload"], "V138_PLAN140_PROSPECTIVE_SCHEMA_INVALID")
  exactKeys(value.payload, ["authorizesExecution", "downstreamAuthority", "executorClosure",
    "executorCommit", "freshAccepted", "freshCharged", "liveInvoked", "mappingDomain",
    "nativeIdentities", "observations", "observationsRoot", "payloadRoot", "plan110Eligible",
    "plan138Disposition", "plan139Eligible", "plan139Executed", "plan141Eligible", "producerCalls",
    "protocol", "readinessInvoked", "schemaVersion"], "V138_PLAN140_PAYLOAD_SCHEMA_INVALID")
  const { payloadRoot, ...payloadBody } = value.payload
  if (payloadRoot !== rooted("v138-plan-262-140-prospective-payload-v9", payloadBody) ||
      value.payload.executorCommit !== V138_PLAN140_EXECUTOR.commit ||
      value.payload.mappingDomain !== "v138-plan-262-140-stable-execution-record-v9" ||
      canonical(value.payload.nativeIdentities) !== canonical(V138_PLAN140_NATIVE_IDENTITIES) ||
      !Array.isArray(value.payload.observations) || value.payload.observations.length !== 6 ||
      value.payload.plan141Eligible !== true || value.payload.plan110Eligible !== false ||
      value.payload.authorizesExecution !== false || value.payload.downstreamAuthority !== "denied")
    fail("V138_PLAN140_PAYLOAD_INVALID")
  exactKeys(value.payload.executorClosure, ["entries", "executorClosureRoot", "executorCommit", "runtime"],
    "V138_PLAN140_CLOSURE_SCHEMA_INVALID")
  const { executorClosureRoot, ...closureBody } = value.payload.executorClosure
  if (!Array.isArray(closureBody.entries) || closureBody.entries.length < 11 ||
      executorClosureRoot !== rooted("v138-plan-262-140-executor-closure-v9", closureBody))
    fail("V138_PLAN140_CLOSURE_INVALID")
  for (const [ordinal, observation] of value.payload.observations.entries()) {
    exactKeys(observation, ["executorClosureRoot", "mode", "nativeIdentities", "ordinal",
      "producerGuardCount", "reducedValue", "stableRecordRoot"], "V138_PLAN140_RECORD_SCHEMA_INVALID")
    const [mode] = MODES[ordinal]!
    if (observation.mode !== mode || observation.ordinal !== ordinal || observation.producerGuardCount !== 0 ||
        observation.executorClosureRoot !== executorClosureRoot ||
        canonical(observation.nativeIdentities) !== canonical(V138_PLAN140_NATIVE_IDENTITIES) ||
        canonical(observation.reducedValue) !== canonical(REDUCED[ordinal]) ||
        observation.stableRecordRoot !== computeV138Plan140StableRecordRootForReview({
          executorClosureRoot, nativeIdentities: observation.nativeIdentities, mode,
          ordinal, reducedValue: observation.reducedValue, producerGuardCount: 0 }))
      fail("V138_PLAN140_RECORD_INVALID")
  }
  if (value.payload.observationsRoot !== rooted("v138-plan-262-140-stable-observations-v9",
    value.payload.observations)) fail("V138_PLAN140_OBSERVATIONS_ROOT_INVALID")
  exactKeys(value.carrier, ["authorizesExecution", "carrierRoot", "downstreamAuthority",
    "executorClosureRoot", "observationsRoot", "payloadRoot", "plan110Eligible", "plan141Eligible",
    "schemaVersion"], "V138_PLAN140_CARRIER_SCHEMA_INVALID")
  const { carrierRoot, ...carrierBody } = value.carrier
  if (carrierRoot !== rooted("v138-plan-262-140-prospective-carrier-v9", carrierBody) ||
      value.carrier.payloadRoot !== payloadRoot || value.carrier.observationsRoot !== value.payload.observationsRoot ||
      value.carrier.executorClosureRoot !== executorClosureRoot || value.carrier.plan141Eligible !== true ||
      value.carrier.plan110Eligible !== false || value.carrier.authorizesExecution !== false)
    fail("V138_PLAN140_CARRIER_INVALID")
}
export const authenticateV138Plan140ProspectiveV9BatchForReview = (
  values: readonly unknown[], rootInput: string,
) => values.map((value) => {
  try {
    checkV138Plan140EffectPathsAbsentForReview(rootInput); validateProspective(value)
    if (value === null || typeof value !== "object" || !trusted.has(value))
      fail("V138_PLAN140_UNTRUSTED_EXECUTION_TRANSCRIPT")
    return Object.freeze({ accepted: true as const })
  } catch (error) { return Object.freeze({ accepted: false as const,
    code: error instanceof Error ? error.message : "V138_PLAN140_UNKNOWN" }) }
})
export const checkV138Plan140SourceOnlyForReview = (rootInput: string) => {
  const root = realpathSync(path.resolve(rootInput)); checkV138Plan140EffectPathsAbsentForReview(root)
  const history = createHistory(root)
  try {
    const closure = authenticateClosure(root, history)
    return Object.freeze({ sourceOnly: true, executorClosureRoot: closure.executorClosureRoot,
      closureEntryCount: closure.entries.length, plan141Eligible: false, plan110Eligible: false,
      producerCalls: 0, readinessInvoked: false, liveInvoked: false, freshCharged: 0,
      freshAccepted: 0, authorizesExecution: false, downstreamAuthority: "denied" as const })
  } finally { history.dispose() }
}

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length === 1 && args[0] === "--check-source-only") {
    process.stdout.write(`${JSON.stringify(checkV138Plan140SourceOnlyForReview(root))}\n`); return
  }
  if (args.length === 2 && args[0] === "--emit-prospective") {
    process.stdout.write(`${canonical(buildV138Plan140ProspectiveV9ForReview(args[1]!))}`); return
  }
  fail("V138_PLAN140_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
