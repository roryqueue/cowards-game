import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync,
  readFileSync, realpathSync, statSync, writeSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { inspectV138Plan142SemanticRuntimeForReview } from "./check-v1-38-plan-262-142-live-v13-custody-v10.js"
import { checkV138InactiveRetryV4Envelope } from "./lib/v1-38-bounded-retry-envelope-v4.js"

type Sha = `sha256:${string}`
type SourceFile = Readonly<{ path: string; mode: "100644" | "100755"; blob: string; sha256: Sha }>
type Review = Readonly<{ schema: "v1.38-plan-262-146-repair-review-v1"; sourceCommit: string;
  sourceFiles: readonly SourceFile[]; runtimeClosureRoot: Sha; envelopeSha256: Sha; sealSha256: Sha;
  nativeTestResults: Readonly<{ command: string; passed: true; ownerPairLifePair: true;
    competingOwnerExcluded: true; invalidLeasesRejected: true; boundedCleanup: true; outerDeadlineMilliseconds: 55000 }>;
  findingCount: 0; plan147Eligible: true; correctedInvocationLimit: 1; authorizesExecution: false }>
const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const IMPLEMENTATION_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fail = (code: string): never => { throw new TypeError(`V138_LIVE_V15_${code}`) }
const sha = (bytes: string | Uint8Array): Sha => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (v: unknown): string => `${JSON.stringify(normalize(v))}\n`
const normalize = (v: unknown): unknown => Array.isArray(v) ? v.map(normalize) : v && typeof v === "object"
  ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, normalize(x)])) : v
const equalKeys = (v: object, keys: readonly string[]) => canonical(Object.keys(v).sort()) === canonical([...keys].sort())
const isSha = (v: unknown): v is Sha => typeof v === "string" && /^sha256:[0-9a-f]{64}$/.test(v)
const isGit = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{40}$/.test(v)
const relative = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_.@/+\-[\]()]+$/.test(v) &&
  !v.startsWith("/") && !v.split("/").some(p => p === "" || p === "." || p === "..")
const freeze = <T>(v: T): T => { if (v && typeof v === "object") { for (const x of Object.values(v)) freeze(x); Object.freeze(v) } return v }
const pathKind = (root: string, repoPath: string): "absent" | "file" | "directory" => {
  if (!relative(repoPath)) fail("PATH_INVALID")
  let current = root
  const parts = repoPath.split("/")
  for (const [i, part] of parts.entries()) {
    current = path.join(current, part)
    try { const s = lstatSync(current); if (s.isSymbolicLink() || i < parts.length - 1 && !s.isDirectory()) fail("PATH_UNSAFE")
      if (i === parts.length - 1) return s.isFile() ? "file" : s.isDirectory() ? "directory" : fail("PATH_UNSAFE")
    } catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return "absent"; throw e }
  }
  return fail("PATH_INVALID")
}
const rootOf = (input: string): string => { const selected = path.resolve(input); const s = lstatSync(selected)
  if (!s.isDirectory() || s.isSymbolicLink()) fail("ROOT_INVALID"); return realpathSync(selected) }
const readRegular = (root: string, repoPath: string): Buffer => {
  if (pathKind(root, repoPath) !== "file") fail("FILE_REQUIRED")
  const target = path.join(root, repoPath); const before = lstatSync(target); const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { const now = fstatSync(fd); if (before.dev !== now.dev || before.ino !== now.ino || now.size > 512 * 1024 * 1024) fail("FILE_CHANGED")
    const bytes = readFileSync(fd); const after = fstatSync(fd); if (now.size !== after.size || now.mtimeMs !== after.mtimeMs) fail("FILE_CHANGED"); return bytes
  } finally { closeSync(fd) }
}
const git = (root: string, args: readonly string[]): string => execFileSync("/usr/bin/git", ["-C", root, "-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false", ...args], { env: { PATH: "/usr/bin:/bin", HOME: "/dev/null", GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null", GIT_NO_REPLACE_OBJECTS: "1", GIT_TERMINAL_PROMPT: "0" }, timeout: 30_000,
    maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }).toString().trim()

export const V138_LIVE_V15_PATHS = freeze({
  model: "scripts/lib/v1-38-bounded-retry-envelope-v4.ts", producer: "scripts/run-v1-38-bounded-retry-envelope-v4.ts",
  custody: "scripts/lib/v1-38-bounded-retry-v4-native-custody-v1.ts", bootstrap: "scripts/lib/v1-38-private-native-bootstrap-v3.ts",
  custodyTest: "scripts/lib/v1-38-bounded-retry-v4-native-custody-v1.test.ts", modelTest: "scripts/lib/v1-38-bounded-retry-envelope-v4.test.ts",
  producerTest: "scripts/run-v1-38-bounded-retry-envelope-v4.test.ts", self: "scripts/run-v1-38-bounded-retry-envelope-v4-live-v15.ts",
  selfTest: "scripts/run-v1-38-bounded-retry-envelope-v4-live-v15.test.ts", envelope: ".planning/artifacts/v1.38-plan-262-145-retry-envelope-v4.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v14.json", review: `${PHASE}/262-146-REVIEW.md`,
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v4.jsonl", privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v4",
  invocation: ".planning/artifacts/v1.38-current-matrix-retry-private-v4/corrected-invocation-v1.json",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v4.json", reproduction: ".planning/artifacts/v1.38-current-matrix-reproduction-v18.json",
  aggregate: ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v4.json", disposition: ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v4.json",
  correction: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v12.json", activation: ".planning/artifacts/v1.38-plan-262-route-12-activation-v1.json",
  readiness: ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v4.json", lifecycle: ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v4.json",
})
export const V138_LIVE_V15_SOURCE_FILES = freeze([V138_LIVE_V15_PATHS.model, V138_LIVE_V15_PATHS.producer,
  V138_LIVE_V15_PATHS.custody, V138_LIVE_V15_PATHS.bootstrap, V138_LIVE_V15_PATHS.custodyTest, V138_LIVE_V15_PATHS.modelTest,
  V138_LIVE_V15_PATHS.producerTest, V138_LIVE_V15_PATHS.self, V138_LIVE_V15_PATHS.selfTest] as const)

export const validateV138LiveV15Review = (value: unknown): Review => {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("REVIEW_INVALID")
  const v = value as Record<string, any>
  if (!equalKeys(v, ["schema", "sourceCommit", "sourceFiles", "runtimeClosureRoot", "envelopeSha256", "sealSha256", "nativeTestResults",
    "findingCount", "plan147Eligible", "correctedInvocationLimit", "authorizesExecution"]) || v.schema !== "v1.38-plan-262-146-repair-review-v1" ||
    !isGit(v.sourceCommit) || !isSha(v.runtimeClosureRoot) || !isSha(v.envelopeSha256) || !isSha(v.sealSha256) || v.findingCount !== 0 ||
    v.plan147Eligible !== true || v.correctedInvocationLimit !== 1 || v.authorizesExecution !== false || !Array.isArray(v.sourceFiles) || !v.sourceFiles.length) fail("REVIEW_INVALID")
  let previous = ""
  for (const f of v.sourceFiles) { if (!f || typeof f !== "object" || !equalKeys(f, ["path", "mode", "blob", "sha256"]) || !relative(f.path) ||
    f.path <= previous || !["100644", "100755"].includes(f.mode) || !isGit(f.blob) || !isSha(f.sha256)) fail("REVIEW_INVALID"); previous = f.path }
  const n = v.nativeTestResults
  if (!n || !equalKeys(n, ["command", "passed", "ownerPairLifePair", "competingOwnerExcluded", "invalidLeasesRejected", "boundedCleanup", "outerDeadlineMilliseconds"]) ||
    typeof n.command !== "string" || n.command.length < 1 || n.passed !== true || n.ownerPairLifePair !== true || n.competingOwnerExcluded !== true ||
    n.invalidLeasesRejected !== true || n.boundedCleanup !== true || n.outerDeadlineMilliseconds !== 55_000) fail("REVIEW_INVALID")
  return freeze(v as Review)
}
const parseReview = (text: string): Review => { const match = text.match(/^```json\n([^]*?)\n```(?:\n|$)/)
  if (!match) fail("REVIEW_HEADER_REQUIRED"); try { return validateV138LiveV15Review(JSON.parse(match[1]!)) } catch { return fail("REVIEW_INVALID") } }
const currentSources = (root: string, commit: string): SourceFile[] => V138_LIVE_V15_SOURCE_FILES.map(repoPath => {
  const line = git(root, ["ls-tree", commit, "--", repoPath]); const m = line.match(/^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/)
  if (!m || m[3] !== repoPath) fail("SOURCE_NOT_COMMITTED"); const bytes = readRegular(root, repoPath)
  if (createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex") !== m![2]) fail("SOURCE_CHANGED")
  return { path: repoPath, mode: m![1] as SourceFile["mode"], blob: m![2]!, sha256: sha(bytes) }
}).sort((a, b) => a.path.localeCompare(b.path))

export const authenticateV138LiveV15ImmutableCustody = (rootInput: string) => {
  const root = rootOf(rootInput); const review = parseReview(readRegular(root, V138_LIVE_V15_PATHS.review).toString())
  if (canonical(currentSources(root, review.sourceCommit)) !== canonical(review.sourceFiles)) fail("REVIEWED_SOURCE_CHANGED")
  const runtime = inspectV138Plan142SemanticRuntimeForReview(root)
  if (runtime.semanticRuntimeRoot !== review.runtimeClosureRoot) fail("RUNTIME_CHANGED")
  const envelopeBytes = readRegular(root, V138_LIVE_V15_PATHS.envelope); const sealBytes = readRegular(root, V138_LIVE_V15_PATHS.seal)
  if (sha(envelopeBytes) !== review.envelopeSha256 || sha(sealBytes) !== review.sealSha256) fail("PAIR_CHANGED")
  const envelope = JSON.parse(envelopeBytes.toString()); const seal = JSON.parse(sealBytes.toString())
  if (envelope.schemaVersion !== "retry-envelope:v4" || envelope.status !== "sealed_inactive" || seal.schemaVersion !== "v1.38-successor-source-seal-v14" ||
    seal.sourceCommit !== review.sourceCommit || envelope.sourceRoot !== seal.sourceRoot || envelope.sealRoot !== seal.sealRoot ||
    seal.runtimeClosureRoot !== review.runtimeClosureRoot || seal.failedPlan110?.liveInvocations !== 1 || seal.failedPlan110?.freshAccepted !== 0 ||
    seal.correctedInvocationLimit !== 1 || seal.authorizesExecution !== false || seal.downstreamAuthority !== "denied") fail("PAIR_INVALID")
  return freeze({ review, envelope, seal, runtimeClosureRoot: runtime.semanticRuntimeRoot })
}
export const checkV138LiveV15PublishedPair = (rootInput: string) => {
  const root = rootOf(rootInput); const envelope = checkV138InactiveRetryV4Envelope(JSON.parse(readRegular(root, V138_LIVE_V15_PATHS.envelope).toString()))
  const seal = JSON.parse(readRegular(root, V138_LIVE_V15_PATHS.seal).toString())
  if (envelope.schemaVersion !== "retry-envelope:v4" || envelope.status !== "sealed_inactive" || seal.schemaVersion !== "v1.38-successor-source-seal-v14" ||
    envelope.sourceRoot !== seal.sourceRoot || envelope.sealRoot !== seal.sealRoot || seal.correctedInvocationLimit !== 1 ||
    seal.authorizesExecution !== false || seal.downstreamAuthority !== "denied") fail("PAIR_INVALID")
  return freeze({ envelope, seal })
}

export const consumeV138LiveV15Invocation = (rootInput: string, reviewedSourceRoot: Sha): void => {
  const root = rootOf(rootInput); if (!isSha(reviewedSourceRoot) || pathKind(root, V138_LIVE_V15_PATHS.privateDir) !== "absent") fail("INVOCATION_ALREADY_CONSUMED")
  const dir = path.join(root, V138_LIVE_V15_PATHS.privateDir); mkdirSync(dir, { mode: 0o700 })
  const body = freeze({ schemaVersion: "v1.38-corrected-live-invocation-v1", correctedInvocationLimit: 1, reviewedSourceRoot,
    producerEntryRecorded: true, priorFailedInvocationCount: 1, authorizesExecution: false, downstreamAuthority: "denied" })
  const fd = openSync(path.join(root, V138_LIVE_V15_PATHS.invocation), constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeSync(fd, canonical(body)); fsyncSync(fd) } finally { closeSync(fd) }
  const dfd = openSync(dir, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW); try { fsyncSync(dfd) } finally { closeSync(dfd) }
}
export const checkV138LiveV15EffectState = (rootInput: string, stage: "pre" | "post") => {
  const root = rootOf(rootInput); const downstream = [V138_LIVE_V15_PATHS.aggregate, V138_LIVE_V15_PATHS.disposition, V138_LIVE_V15_PATHS.correction,
    V138_LIVE_V15_PATHS.activation, V138_LIVE_V15_PATHS.readiness, V138_LIVE_V15_PATHS.lifecycle]
  if (stage === "pre") { for (const p of [V138_LIVE_V15_PATHS.journal, V138_LIVE_V15_PATHS.privateDir, V138_LIVE_V15_PATHS.terminal,
    V138_LIVE_V15_PATHS.reproduction, ...downstream]) if (pathKind(root, p) !== "absent") fail("FRESH_EFFECT_PRESENT")
    return freeze({ stage, status: "fresh_inactive", authorizesExecution: false }) }
  if (stage !== "post" || pathKind(root, V138_LIVE_V15_PATHS.invocation) !== "file") fail("INVOCATION_MARKER_REQUIRED")
  const terminalKind = pathKind(root, V138_LIVE_V15_PATHS.terminal)
  if (terminalKind === "absent") fail("TERMINAL_ABSENT_BOOTSTRAP_FAILURE")
  if (terminalKind !== "file" || pathKind(root, V138_LIVE_V15_PATHS.journal) !== "file" || pathKind(root, V138_LIVE_V15_PATHS.reproduction) === "directory") fail("POST_STATE_INVALID")
  return freeze({ stage, status: "producer_terminal_present", reproductionPresent: pathKind(root, V138_LIVE_V15_PATHS.reproduction) === "file", downstreamAuthority: "denied" })
}

export const executeV138LiveV15Cli = async (args: readonly string[]): Promise<void> => {
  if (args.length !== 1) fail("ARGUMENTS_INVALID")
  if (args[0] === "--check-immutable-review-custody") { const v = authenticateV138LiveV15ImmutableCustody(IMPLEMENTATION_ROOT); process.stdout.write(canonical({ status: "immutable_review_custody_checked", sourceCommit: v.review.sourceCommit, authorizesExecution: false })); return }
  if (args[0] === "--check-reviewed-live-ready") { const v = authenticateV138LiveV15ImmutableCustody(IMPLEMENTATION_ROOT); checkV138LiveV15EffectState(IMPLEMENTATION_ROOT, "pre"); process.stdout.write(canonical({ status: "reviewed_live_ready", sourceCommit: v.review.sourceCommit, correctedInvocationLimit: 1, authorizesExecution: false })); return }
  if (args[0] === "--check-post-run-custody") { authenticateV138LiveV15ImmutableCustody(IMPLEMENTATION_ROOT); checkV138LiveV15EffectState(IMPLEMENTATION_ROOT, "post"); process.stdout.write(canonical({ status: "post_run_custody_checked", downstreamAuthority: "denied" })); return }
  if (args[0] === "--run-reviewed-bounded-live-envelope") {
    const v = authenticateV138LiveV15ImmutableCustody(IMPLEMENTATION_ROOT); checkV138LiveV15EffectState(IMPLEMENTATION_ROOT, "pre")
    consumeV138LiveV15Invocation(IMPLEMENTATION_ROOT, v.seal.sourceRoot)
    const producer = await import("./run-v1-38-bounded-retry-envelope-v4.js")
    await producer.runV138V4ProductionLive(IMPLEMENTATION_ROOT, { validateInputs: false, checkPair: () => ({ seal: v.seal, envelope: v.envelope }) })
    authenticateV138LiveV15ImmutableCustody(IMPLEMENTATION_ROOT); checkV138LiveV15EffectState(IMPLEMENTATION_ROOT, "post"); return
  }
  fail("ARGUMENTS_INVALID")
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  executeV138LiveV15Cli(process.argv.slice(2)).catch(() => { process.stderr.write("V138_LIVE_V15_CHECK_FAILED\n"); process.exitCode = 1 })
