import { createHash, randomBytes } from "node:crypto"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { chmodSync, closeSync, constants, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync,
  readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
import { V138_BOUNDED_RETRY_V3_PATHS, runV138V3ProductionLive } from "./run-v1-38-bounded-retry-envelope-v3.js"
import { encodeV138RetryV3CanonicalJson, checkV138InactiveRetryV3Envelope, deriveV138RetryV3State,
  V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY } from "./lib/v1-38-bounded-retry-envelope-v3.js"
import { inspectV138Plan142SemanticRuntimeForReview } from "./check-v1-38-plan-262-142-live-v13-custody-v10.js"
import { readV138WorkspaceBatch } from "./lib/v1-38-secure-workspace-path-v6.js"
import { checkV138LiveV10PostRunOutputCustodyForReview, checkV138LiveV10ReproductionV17ForReview,
  computeV138LiveV10ReproductionV17ReceiptRoot } from "./run-v1-38-bounded-retry-envelope-v3-live-v10.js"
import { settleV138LiveV9ProducerOutcomeForReview } from "./run-v1-38-bounded-retry-envelope-v3-live-v9.js"

type Json = Record<string, any>
type Sha = `sha256:${string}`
type FileEntry = { path: string; mode: string; blob: string; sha256: Sha }
const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const SELF = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v14.ts"
const TEST = SELF.replace(/\.ts$/, ".test.ts")
const REVIEWER = "scripts/check-v1-38-plan-262-143-live-v13-custody-review-v10.ts"
const SOURCE142 = "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"
const FINAL142 = "61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3"
const SUMMARY142 = "53509033a03a7a6661cb519c76c70d437b6d86c3"
const TRACK142 = "7edcac4f5977ea8f006b1369536414c8006e64bd"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const AMENDMENT = "b331baad29053f523233558f66aa2855f2925b2b"
const IMPLEMENTATION_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const canonical = encodeV138RetryV3CanonicalJson
const sha = (bytes: string | Uint8Array): Sha => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const H = (suffix: string, value: unknown): Sha => sha(`v138-plan143-v10-${suffix}\0${canonical(value)}`)
const fail = (code: string): never => { throw new TypeError(`V138_LIVE_V14_${code}`) }
const equal = (a: unknown, b: unknown) => canonical(a) === canonical(b)
const isSha = (v: unknown): v is Sha => typeof v === "string" && /^sha256:[0-9a-f]{64}$/.test(v)
const isGit = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{40}$/.test(v)
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object") { for (const item of Object.values(value)) freeze(item); Object.freeze(value) }
  return value
}
const omit = (value: Json, ...keys: string[]): Json => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)))
const jsonData = (value: unknown, active = new Set<object>(), depth = 0): void => {
  if (depth > 32) fail("JSON_DEPTH")
  if (value === null || typeof value === "boolean" || typeof value === "string") return
  if (typeof value === "number" && Number.isFinite(value)) return
  if (!value || typeof value !== "object" || active.has(value)) fail("JSON_DATA_REQUIRED")
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail("JSON_DATA_REQUIRED")
  if (Object.getOwnPropertySymbols(value).length) fail("JSON_DATA_REQUIRED")
  active.add(value as object)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (Array.isArray(value) && key === "length") continue
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value") ||
      Array.isArray(value) && !/^(0|[1-9][0-9]*)$/.test(key)) fail("JSON_DATA_REQUIRED")
    jsonData(descriptor.value, active, depth + 1)
  }
  if (Array.isArray(value) && Object.keys(value).length !== value.length) fail("JSON_DATA_REQUIRED")
  active.delete(value as object)
}
function exact(value: unknown, keys: readonly string[]): asserts value is Json {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
    !equal(Object.keys(value).sort(), [...keys].sort())) fail("KEYS_INVALID")
}
const array = (v: unknown, min: number, max: number): any[] => {
  if (!Array.isArray(v) || v.length < min || v.length > max) fail("ARRAY_INVALID")
  return v as any[]
}
const relative = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length < 1024 &&
  /^[A-Za-z0-9_.@/+\-\[\]()]+$/.test(v) && !v.startsWith("/") && !v.split("/").some(p => p === "." || p === ".." || p === "")
const sortedUnique = (items: any[], field: string) => {
  if (items.some((v, i) => !relative(v[field]) || (i > 0 && items[i - 1][field] >= v[field]))) fail("ORDER_INVALID")
}

export const V138_LIVE_V14_PATHS = freeze({
  payload: ".planning/artifacts/v1.38-plan-262-143-live-v13-custody-review-payload-v10.json",
  review: `${PHASE}/262-143-REVIEW-v10.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-143-live-v13-custody-review-carrier-v10.json",
  summary: `${PHASE}/262-143-SUMMARY.md`,
})
export const V138_LIVE_V14_EFFECT_PATHS = freeze([
  V138_BOUNDED_RETRY_V3_PATHS.journal, `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
  V138_BOUNDED_RETRY_V3_PATHS.privateDir, V138_BOUNDED_RETRY_V3_PATHS.terminal, V138_BOUNDED_RETRY_V3_PATHS.reproduction,
  V138_BOUNDED_RETRY_V3_PATHS.receiptManifest, V138_BOUNDED_RETRY_V3_PATHS.disposition,
  V138_BOUNDED_RETRY_V3_PATHS.correction, V138_BOUNDED_RETRY_V3_PATHS.activation,
  V138_BOUNDED_RETRY_V3_PATHS.readiness, V138_BOUNDED_RETRY_V3_PATHS.lifecycle,
])
export const V138_LIVE_V14_REVIEW_MODES = freeze(["source-only", "prospective-custody", "post-no-effect",
  "non-pass-value", "bounded-success-value", "exact-reproduction-v17-value"] as const)
type ReviewMode = typeof V138_LIVE_V14_REVIEW_MODES[number]
const STATUSES = ["source_only_checked", "prospective_custody_checked", "post_run_no_effect_custody_checked",
  "bounded_non_pass_value_checked", "bounded_success_value_checked", "exact_reproduction_v17_value_checked"]
const NO_EFFECT = freeze({ downstreamAuthority: "denied", freshAccepted: 0, freshCharged: 0,
  liveInvoked: false, producerCalls: 0, readinessInvoked: false })
const REDUCED = freeze([NO_EFFECT, NO_EFFECT, NO_EFFECT, { classification: "non_pass", reproductionEligible: false },
  { classification: "bounded_success", reproductionEligible: true }, { acceptedCells: 540, exact: true, requiredAccepted: 540 }])
const ZERO = freeze({ producerCalls: 0, readinessCalls: 0, liveCalls: 0, freshCharged: 0, freshAccepted: 0 })
const NATIVES = freeze([
  { path: "scripts/native/v1-38-successor-transaction-helper-v6.c", mode: "100644", blob: "ca694310a8a99c30d7a4070a415b968d3e341409", sha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a" },
  { path: "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c", mode: "100644", blob: "99da3517ccb8b919759663daf713b4f20337b8b1", sha256: "sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea" },
])
const HISTORY = freeze([
  ["v3", "262-122", "process_invalid_false_clean_custody"],
  ["v4", "262-131", "process_invalid_descendant_and_observation_validation"],
  ["v5", "262-133", "process_invalid_authority_carrier_validation"],
  ["v6", "262-134", "process_invalid_cross_root_cache_and_absolute_path_evidence"],
  ["v7", "262-136", "process_invalid_genuine_to_stable_native_mapping"],
  ["v8", "262-138", "process_invalid_unauthenticated_executor_metadata_and_effect_gate"],
  ["v9", "262-140", "process_invalid_incomplete_runtime_cross_root_laundering_and_ancestor_symlink_gate"],
].map(([version, plan, disposition]) => ({ version, plan, disposition, eligible: false })))
const historical142ObservationsRoot = (): Sha => {
  const modes = ["--check-source-only", "--check-prospective-custody", "--check-post-run-custody", "--check-non-pass-value",
    "--check-bounded-success-value", "--check-exact-reproduction-v17-value"]
  const records = modes.map((mode, ordinal) => {
    const body = { repositoryClosureRoot: "sha256:46147f2e102e791da37f2f3b91672a046eb275552f73ad2d99de92c0f9c4fd3d",
      semanticRuntimeRoot: "sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e",
      nativeIdentities: NATIVES, mode, ordinal, reducedValue: REDUCED[ordinal], producerGuardCount: 0 }
    return { ...body, stableRecordRoot: sha(`v138-plan-262-142-stable-execution-record-v10\0${canonical(body)}`) }
  })
  return sha(`v138-plan-262-142-stable-observations-v10\0${canonical(records)}`)
}
const checkFiles = (files: unknown): FileEntry[] => {
  const entries = array(files, 1, 20000)
  for (const e of entries) {
    exact(e, ["path", "mode", "blob", "sha256"])
    if (!relative(e.path) || !["100644", "100755"].includes(e.mode) || !isGit(e.blob) || !isSha(e.sha256)) fail("FILE_INVALID")
  }
  sortedUnique(entries, "path"); return entries as FileEntry[]
}
const checkSubject = (s: unknown, plan: string, source: string): Json => {
  exact(s, ["plan", "commit", "tree", "parent", "files", "repositoryClosureRoot", "subjectRoot"])
  const files = checkFiles(s.files)
  if (s.plan !== plan || !isGit(s.commit) || !isGit(s.tree) || !isGit(s.parent) ||
    !isSha(s.repositoryClosureRoot) || s.subjectRoot !== H("subject", omit(s, "subjectRoot")) ||
    !files.some(e => e.path === source) || !files.some(e => e.path === source.replace(/\.ts$/, ".test.ts"))) fail("SUBJECT_INVALID")
  return s
}
const reviewText = (p: Json): string => `# Plan 262-143 live-v14 custody review v10\n\nPayload: ${V138_LIVE_V14_PATHS.payload}\nPayload SHA-256: ${sha(canonical(p))}\nPayload root: ${p.payloadRoot}\nConsumer subject: ${p.consumerSubject.subjectRoot}\nReviewer subject: ${p.reviewerSubject.subjectRoot}\nFindings: 0\nPrivacy findings: 0\nAuthorizes execution: false\nDownstream authority: denied\n\nLimitations: private single-operator snapshot; no continuing absence or hostile-same-UID isolation.\n`

/** Values only. This never creates root provenance, readiness, or execution authority. */
export const validateV138LiveV14PublishedContractForReview = (input: unknown): true => {
  jsonData(input)
  exact(input, ["payload", "carrier", "review"])
  const p = input.payload; const c = input.carrier
  exact(p, ["schemaVersion", "consumerVersion", "consumerPlan", "consumerSubject", "reviewerSubject", "historical142",
    "historicalDispositions", "canonicalCustody", "currentExecution", "reproductionProof", "findings", "findingCount",
    "privacyFindingCount", "plan110Eligible", "authorizesExecution", "downstreamAuthority", "counters", "requiredAccepted", "payloadRoot"])
  exact(c, ["schemaVersion", "consumerVersion", "consumerPlan", "payloadPath", "payloadSha256", "payloadRoot", "reviewPath",
    "reviewSha256", "consumerSubjectRoot", "reviewerSubjectRoot", "semanticRuntimeClosureRoot", "currentObservationsRoot",
    "findingCount", "privacyFindingCount", "plan110Eligible", "authorizesExecution", "downstreamAuthority", "counters", "requiredAccepted", "carrierRoot"])
  if (p.schemaVersion !== "v1.38-plan-262-143-live-v14-custody-review-payload-v10" ||
    c.schemaVersion !== "v1.38-plan-262-143-live-v14-custody-review-carrier-v10") fail("SCHEMA_INVALID")
  for (const v of [p, c]) if (v.consumerVersion !== "live-v14" || v.consumerPlan !== "262-144" || v.findingCount !== 0 ||
    v.privacyFindingCount !== 0 || v.plan110Eligible !== true || v.authorizesExecution !== false ||
    v.downstreamAuthority !== "denied" || !equal(v.counters, ZERO) || v.requiredAccepted !== 540) fail("AUTHORITY_INVALID")
  if (!equal(p.findings, []) || !equal(p.historicalDispositions, HISTORY)) fail("HISTORY_INVALID")
  const consumer = checkSubject(p.consumerSubject, "262-144", SELF)
  const reviewer = checkSubject(p.reviewerSubject, "262-143", REVIEWER)
  const historical = p.historical142
  exact(historical, ["sourceCommit", "summaryCommit", "trackingCommit", "sourceRoot", "semanticRuntimeClosureRoot",
    "repositoryClosureRoot", "observationsRoot", "plan110Eligible"])
  if (historical.sourceCommit !== FINAL142 || historical.summaryCommit !== SUMMARY142 || historical.trackingCommit !== TRACK142 ||
    historical.plan110Eligible !== false || historical.sourceRoot !== "sha256:902fd55d157cba70b4933499c45a8855fc1df6bd373748bd3d7853daf70f22c1" ||
    historical.semanticRuntimeClosureRoot !== "sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e" ||
    historical.repositoryClosureRoot !== "sha256:46147f2e102e791da37f2f3b91672a046eb275552f73ad2d99de92c0f9c4fd3d" ||
    historical.observationsRoot !== historical142ObservationsRoot()) fail("HISTORICAL142_INVALID")
  const k = p.canonicalCustody
  exact(k, ["repositoryClosureRoot", "semanticRuntimeInventory", "semanticRuntimeClosureRoot", "nativeIdentities", "nativeIdentityRoot",
    "canonicalLocalExecutionClosureRoot", "metadataPredicate", "provenancePredicate"])
  const entries = array(k.semanticRuntimeInventory, 1, 20000)
  for (const entry of entries) {
    exact(entry, ["identity", "mode", "size", "sha256"])
    if (!relative(entry.identity) || !entry.identity.startsWith("runtime/") || !["100644", "100755"].includes(entry.mode) ||
      !Number.isSafeInteger(entry.size) || entry.size < 0 || !isSha(entry.sha256)) fail("RUNTIME_INVALID")
  }
  sortedUnique(entries, "identity")
  if (k.repositoryClosureRoot !== consumer.repositoryClosureRoot || k.semanticRuntimeClosureRoot !== H("runtime-closure", entries) ||
    !equal(k.nativeIdentities, NATIVES) || k.nativeIdentityRoot !== H("native-identities", NATIVES) ||
    k.metadataPredicate !== "private_bound_bare_snapshot_v1" || k.provenancePredicate !== "fresh_root_bound_private_transcript_v1" ||
    k.canonicalLocalExecutionClosureRoot !== H("canonical-custody", omit(k, "canonicalLocalExecutionClosureRoot"))) fail("CUSTODY_INVALID")
  const e = p.currentExecution
  exact(e, ["subjectRoot", "observations", "actualModesPassed", "observationsRoot", "guardTransformRoot", "producerGuardCount"])
  if (e.subjectRoot !== consumer.subjectRoot || e.actualModesPassed !== 6 || e.producerGuardCount !== 0 || !isSha(e.guardTransformRoot)) fail("EXECUTION_INVALID")
  const observations = array(e.observations, 6, 6)
  for (const [i, o] of observations.entries()) {
    exact(o, ["subjectRoot", "mode", "ordinal", "status", "reducedValue", "repositoryClosureRoot", "semanticRuntimeClosureRoot",
      "nativeIdentityRoot", "executionRoot", "observationRoot"])
    if (o.subjectRoot !== consumer.subjectRoot || o.mode !== V138_LIVE_V14_REVIEW_MODES[i] || o.ordinal !== i || o.status !== STATUSES[i] ||
      !equal(o.reducedValue, REDUCED[i]) || o.repositoryClosureRoot !== k.repositoryClosureRoot ||
      o.semanticRuntimeClosureRoot !== k.semanticRuntimeClosureRoot || o.nativeIdentityRoot !== k.nativeIdentityRoot ||
      o.executionRoot !== H("execution", omit(o, "executionRoot", "observationRoot")) ||
      o.observationRoot !== H("observation", omit(o, "observationRoot"))) fail("OBSERVATION_INVALID")
  }
  if (e.observationsRoot !== H("observations", observations)) fail("OBSERVATIONS_INVALID")
  const r = p.reproductionProof
  exact(r, ["processCount", "rootCount", "normalizedEvidenceRoots", "equal"])
  if (r.processCount !== 2 || r.rootCount !== 2 || r.equal !== true ||
    !equal(r.normalizedEvidenceRoots, [H("reproduction", e), H("reproduction", e)])) fail("REPRODUCTION_INVALID")
  if (p.payloadRoot !== H("payload", omit(p, "payloadRoot")) || input.review !== reviewText(p) ||
    c.payloadPath !== V138_LIVE_V14_PATHS.payload || c.reviewPath !== V138_LIVE_V14_PATHS.review ||
    c.payloadSha256 !== sha(canonical(p)) || c.payloadRoot !== p.payloadRoot || c.reviewSha256 !== sha(input.review) ||
    c.consumerSubjectRoot !== consumer.subjectRoot || c.reviewerSubjectRoot !== reviewer.subjectRoot ||
    c.semanticRuntimeClosureRoot !== k.semanticRuntimeClosureRoot || c.currentObservationsRoot !== e.observationsRoot ||
    c.carrierRoot !== H("carrier", omit(c, "carrierRoot"))) fail("PUBLICATION_INVALID")
  return true
}

// Git reads use a private object copy bound to the supplied root and HEAD. No
// ambient replacements, include directives, alternates, or mutable cache verdict.
const gitEnv = Object.freeze({ PATH: "/usr/bin:/bin", HOME: "/dev/null", GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null", GIT_NO_REPLACE_OBJECTS: "1", GIT_TERMINAL_PROMPT: "0" })
const gitBytes = (root: string, args: readonly string[]) => execFileSync("/usr/bin/git", ["-C", root,
  "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args],
{ env: gitEnv, timeout: 120000, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
const git = (root: string, args: readonly string[]) => gitBytes(root, args).toString("utf8").trim()
const identity = (s: ReturnType<typeof lstatSync>) => [s.dev, s.ino, s.mode, s.size, s.mtimeMs, s.ctimeMs].join(":")
const regular = (absolute: string): Buffer => {
  const before = lstatSync(absolute)
  if (!before.isFile() || before.isSymbolicLink() || before.size > 512 * 1024 * 1024) fail("REGULAR_REQUIRED")
  const fd = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    if (identity(fstatSync(fd)) !== identity(before)) fail("READ_RACE")
    const bytes = readFileSync(fd)
    if (identity(fstatSync(fd)) !== identity(before) || identity(lstatSync(absolute)) !== identity(before)) fail("READ_RACE")
    return bytes
  } finally { closeSync(fd) }
}
const rootIdentity = (rootInput: string) => {
  const root = path.resolve(rootInput); const stat = lstatSync(root)
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(root) !== root) fail("ROOT_INVALID")
  return { root, device: String(stat.dev), inode: String(stat.ino) }
}
const metadata = (root: string): string => {
  const common = git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"])
  const local = git(root, ["rev-parse", "--absolute-git-dir"])
  const config = regular(path.join(common, "config")).toString()
  if (/\[\s*(?:include|includeIf|alias|protocol|url)\b|(?:hooksPath|fsmonitor|attributesfile|sshcommand)\s*=/i.test(config)) fail("METADATA_CONFIG")
  for (const name of ["info/grafts", "shallow", "objects/info/alternates"]) {
    try { lstatSync(path.join(common, name)); fail("METADATA_REDIRECTION") }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error }
  }
  if (git(root, ["rev-parse", "--show-object-format"]) !== "sha1" ||
    git(root, ["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "") fail("METADATA_REPLACEMENT")
  const dirs = [common, local, path.join(common, "objects")].map(p => {
    const s = lstatSync(p); if (!s.isDirectory() || s.isSymbolicLink()) fail("METADATA_DIRECTORY")
    return [p, s.dev, s.ino]
  })
  return canonical({ dirs, config, head: git(root, ["rev-parse", "HEAD"]), headFile: sha(regular(path.join(local, "HEAD"))) })
}
type History = { root: string; head: string; rootBinding: ReturnType<typeof rootIdentity>; metadataDigest: Sha;
  git: (args: readonly string[]) => string; bytes: (args: readonly string[]) => Buffer; finish: () => void }
const historySnapshot = (rootInput: string): History => {
  const rootBinding = rootIdentity(rootInput); const before = metadata(rootBinding.root)
  const head = git(rootBinding.root, ["rev-parse", "HEAD^{commit}"])
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live14-history-")); chmodSync(owner, 0o700)
  const snapshot = path.join(owner, "bare.git")
  try {
    execFileSync("/usr/bin/git", ["clone", "--quiet", "--bare", "--no-local", rootBinding.root, snapshot],
      { env: gitEnv, timeout: 120000, stdio: ["ignore", "pipe", "pipe"] })
    writeFileSync(path.join(snapshot, "config"), "[core]\nrepositoryformatversion = 0\nbare = true\n", { mode: 0o600 })
    writeFileSync(path.join(snapshot, "HEAD"), `${head}\n`, { mode: 0o600 })
    if (metadata(rootBinding.root) !== before || !equal(rootIdentity(rootBinding.root), rootBinding)) fail("METADATA_CHANGED")
    return { root: rootBinding.root, head, rootBinding, metadataDigest: sha(before),
      git: args => git(snapshot, args), bytes: args => gitBytes(snapshot, args),
      finish: () => {
        try { if (metadata(rootBinding.root) !== before || !equal(rootIdentity(rootBinding.root), rootBinding)) fail("METADATA_CHANGED") }
        finally { rmSync(owner, { recursive: true, force: true }) }
      } }
  } catch (error) { rmSync(owner, { recursive: true, force: true }); throw error }
}
const ancestor = (h: History, a: string, b = h.head): void => {
  if (!isGit(a) || !isGit(b)) fail("ANCESTRY_INVALID")
  try { h.git(["merge-base", "--is-ancestor", a, b]) } catch { fail("ANCESTRY_INVALID") }
}
const scope = (h: History, commit: string, entries: string[][]) => {
  const actual = h.git(["diff-tree", "--no-commit-id", "--name-status", "-r", commit]).split("\n").filter(Boolean).map(s => s.split("\t"))
  if (!equal(actual.sort((a,b) => a[1].localeCompare(b[1])), [...entries].sort((a,b) => a[1].localeCompare(b[1])))) fail("COMMIT_SCOPE")
}
const locate = (h: History, p: string): string => {
  const commits = h.git(["log", "--diff-filter=A", "--format=%H", h.head, "--", p]).split("\n").filter(Boolean)
  if (commits.length !== 1 || !isGit(commits[0])) fail("PUBLICATION_MISSING")
  return commits[0]
}
const repositoryBatch = (root: string, paths: readonly string[]) => {
  const bytes: Record<string, Buffer> = {}; const ancestors: Record<string, unknown> = {}
  const bound = rootIdentity(root)
  for (let offset = 0; offset < paths.length; offset += 256) {
    const batch = readV138WorkspaceBatch(root, paths.slice(offset, offset + 256))
    if (!equal(batch.identity, { device: bound.device, inode: bound.inode })) fail("ROOT_CHANGED")
    for (const [p, value] of Object.entries(batch.ancestorIdentities)) {
      if (ancestors[p] && !equal(ancestors[p], value)) fail("ANCESTOR_CHANGED")
      ancestors[p] = value
    }
    Object.assign(bytes, batch.bytes)
  }
  if (!equal(bound, rootIdentity(root))) fail("ROOT_CHANGED")
  return { bytes, identity: { device: bound.device, inode: bound.inode } }
}
const committed = (h: History, commit: string, paths: readonly string[], noRewrite = true): Record<string, Buffer> => {
  ancestor(h, commit)
  if (noRewrite && h.git(["log", "--format=%H", `${commit}..${h.head}`, "--", ...paths]) !== "") fail("HISTORY_REWRITE")
  const batch = repositoryBatch(h.root, paths)
  if (!equal(batch.identity, { device: h.rootBinding.device, inode: h.rootBinding.inode })) fail("ROOT_CHANGED")
  for (const p of paths) {
    if (!/^100(?:644|755) blob [0-9a-f]{40}\t/.test(h.git(["ls-tree", commit, "--", p])) ||
      !batch.bytes[p].equals(h.bytes(["show", `${commit}:${p}`]))) fail("COMMITTED_BYTES_CHANGED")
  }
  return batch.bytes as Record<string, Buffer>
}
const parseCanonical = (bytes: Buffer): Json => {
  const value = JSON.parse(bytes.toString("utf8"))
  if (!bytes.equals(Buffer.from(canonical(value)))) fail("NONCANONICAL_JSON")
  return value
}
const fixedHistory = (h: History) => {
  for (const commit of [FINAL142, SUMMARY142, TRACK142, AMENDMENT, PAIR_COMMIT]) ancestor(h, commit)
  if (h.git(["rev-parse", `${TRACK142}^`]) !== SUMMARY142 ||
    h.git(["rev-parse", `${AMENDMENT}^`]) !== "b6cd3ec13aa25c6b1a5416a264ddf17855c19bad") fail("HISTORY_PARENT")
  scope(h, SUMMARY142, [["A", `${PHASE}/262-142-SUMMARY.md`]])
  scope(h, TRACK142, [["M", ".planning/ROADMAP.md"], ["M", ".planning/STATE.md"]])
  scope(h, AMENDMENT, [["M", ".planning/ROADMAP.md"], ["M", ".planning/STATE.md"], ["M", `${PHASE}/262-110-PLAN.md`],
    ["A", `${PHASE}/262-120-SUMMARY.md`], ["M", `${PHASE}/262-122-PLAN.md`], ["M", `${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`], ["A", `${PHASE}/262-93-SUMMARY.md`]])
  const pins = [
    [FINAL142, SOURCE142, "sha256:902fd55d157cba70b4933499c45a8855fc1df6bd373748bd3d7853daf70f22c1"],
    [FINAL142, SOURCE142.replace(/\.ts$/, ".test.ts"), "sha256:b7bbdcc45a23c49a095d654509cf53db849c8fd1fd997ccd2a0eccd0dcf546ea"],
    [SUMMARY142, `${PHASE}/262-142-SUMMARY.md`, "sha256:4d41980186211917f0f39a3154582e6daa753bc5aa1cbc12ceb9610d27ae98fb"],
  ]
  for (const [commit, p, digest] of pins) if (sha(committed(h, commit, [p])[p]) !== digest) fail("HISTORY_PIN")
  for (const [p, blob] of [[`${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`, "d540a5a7b0f7200ed86287a3744e46ebd66987bd"],
    [`${PHASE}/262-93-SUMMARY.md`, "e2db03c938d23305527bcad6ab0c479fbadd0bd3"],
    [`${PHASE}/262-120-SUMMARY.md`, "86621b8f8ac5546b66265b2cc5ca3f6b80468be7"]]) {
    committed(h, AMENDMENT, [p]); if (h.git(["rev-parse", `${AMENDMENT}:${p}`]) !== blob) fail("AMENDMENT_PIN")
  }
  for (const n of NATIVES) {
    const bytes = committed(h, FINAL142, [n.path])[n.path]
    if (sha(bytes) !== n.sha256 || h.git(["rev-parse", `${FINAL142}:${n.path}`]) !== n.blob) fail("NATIVE_PIN")
  }
  const pairPaths = [V138_BOUNDED_RETRY_V3_PATHS.seal, V138_BOUNDED_RETRY_V3_PATHS.envelope]
  scope(h, PAIR_COMMIT, pairPaths.map(p => ["A", p]))
  const pair = committed(h, PAIR_COMMIT, pairPaths)
  const seal = parseCanonical(pair[pairPaths[0]]); const envelope = checkV138InactiveRetryV3Envelope(parseCanonical(pair[pairPaths[1]]))
  const protectedFiles = V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedFiles
  const protectedBatch = readV138WorkspaceBatch(h.root, protectedFiles.map(([p]) => p))
  for (const [p, digest] of protectedFiles) if (sha(protectedBatch.bytes[p]) !== digest) fail("PROTECTED_HISTORY_CHANGED")
  const requiredInputs = [V138_BOUNDED_RETRY_V3_PATHS.sourceSummary, V138_BOUNDED_RETRY_V3_PATHS.sourceController,
    V138_BOUNDED_RETRY_V3_PATHS.sourceModel, V138_BOUNDED_RETRY_V3_PATHS.sourceTests,
    V138_BOUNDED_RETRY_V3_PATHS.sourceReview, V138_BOUNDED_RETRY_V3_PATHS.sourceReviewReport,
    V138_BOUNDED_RETRY_V3_PATHS.localSeal, V138_BOUNDED_RETRY_V3_PATHS.protectedHistoryCorrection,
    V138_BOUNDED_RETRY_V3_PATHS.historicalReceiptManifest, V138_BOUNDED_RETRY_V3_PATHS.historicalEnvelope,
    V138_BOUNDED_RETRY_V3_PATHS.historicalJournal, V138_BOUNDED_RETRY_V3_PATHS.historicalTerminal,
    V138_BOUNDED_RETRY_V3_PATHS.historicalSeal, V138_BOUNDED_RETRY_V3_PATHS.historicalDisposition,
    V138_BOUNDED_RETRY_V3_PATHS.historicalLifecycle]
  const inputs = committed(h, FINAL142, requiredInputs)
  const localSeal = JSON.parse(inputs[V138_BOUNDED_RETRY_V3_PATHS.localSeal].toString())
  if (localSeal.verificationRoot !== seal.localSealVerificationRoot || localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    localSeal.satisfiesRevisedSeal01 !== true || localSeal.independentCustodyClaimed !== false) fail("LOCAL_SEAL_INVALID")
  if (seal.sealRoot !== "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752" ||
    envelope.envelopeRoot !== "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a" ||
    seal.productionAuthorized !== false || seal.downstreamAuthority !== "denied") fail("PAIR_INVALID")
  return freeze({ seal, envelope })
}

/** Actual module resolution plus native/config dependencies, not archive133. */
const repositoryClosure = (root: string, roots: readonly string[]) => {
  const historicalPaths = new Set(git(root, ["ls-tree", "-r", "--name-only", FINAL142]).split("\n"))
  const pending = [...roots, "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json",
    ...NATIVES.map(n => n.path), "scripts/native/v1-38-secure-manifest-reader-v6.c",
    ...V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedFiles.map(([p]) => p),
    V138_BOUNDED_RETRY_V3_PATHS.localSeal, V138_BOUNDED_RETRY_V3_PATHS.sourceSummary, V138_BOUNDED_RETRY_V3_PATHS.sourceReview,
    V138_BOUNDED_RETRY_V3_PATHS.sourceReviewReport, V138_BOUNDED_RETRY_V3_PATHS.sourceTests,
    V138_BOUNDED_RETRY_V3_PATHS.historicalJournal,
    ".planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts",
    ".planning/artifacts/v2.0-core-rules-audit/README.md",
    ".planning/artifacts/v1.38-historical-matrix-expectation.json"]
  const seen = new Set<string>(); const executed = new Set(roots); const parsed = new Set<string>()
  const edges = new Map<string, {from: string; to: string}>(); const entries: FileEntry[] = []
  const options: ts.CompilerOptions = { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
    resolveJsonModule: true, allowJs: true }
  const resolutionCache = ts.createModuleResolutionCache(root, p => p, options)
  while (pending.length) {
    const p = pending.shift()!; if (seen.has(p) && (!executed.has(p) || parsed.has(p))) continue
    if (!relative(p)) fail("DEPENDENCY_PATH")
    const fresh = !seen.has(p); seen.add(p); const absolute = path.join(root, p)
    const bytes = regular(absolute)
    if (fresh) entries.push({ path: p, mode: lstatSync(absolute).mode & 0o111 ? "100755" : "100644",
      blob: createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"), sha256: sha(bytes) })
    const add = (to: string, execute = false) => {
      if (!relative(to)) fail(`DEPENDENCY_PATH:${to}`)
      if (execute) executed.add(to)
      edges.set(`${p}\0${to}`, { from: p, to }); pending.push(to)
    }
    if (executed.has(p) && /\.[cm]?[jt]sx?$/.test(p)) {
      parsed.add(p)
      const text = bytes.toString("utf8"); const ast = ts.createSourceFile(p, text, ts.ScriptTarget.Latest, true)
      const visit = (node: ts.Node) => {
        let spec: string | undefined
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) spec = node.moduleSpecifier.text
        if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          ts.isIdentifier(node.expression) && node.expression.text === "require") && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) spec = node.arguments[0].text
        if (spec && !spec.startsWith("node:") && !["fs", "path", "crypto", "os", "url", "util", "events", "stream", "buffer", "child_process"].includes(spec)) {
          const resolved = ts.resolveModuleName(spec, absolute, options, ts.sys, resolutionCache).resolvedModule
          if (!resolved) fail(`DEPENDENCY_UNRESOLVED:${p}:${spec}`)
          const filename = resolved.resolvedFileName
          if (!filename.includes("/node_modules/")) add(path.relative(root, filename).split(path.sep).join("/"), true)
        }
        if (ts.isStringLiteral(node)) {
          if (/^scripts\/native\/[A-Za-z0-9_.-]+\.c$/.test(node.text)) add(node.text)
          else if (/^\.\.?\/.*\.c$/.test(node.text)) {
            const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(p), node.text))
            if (historicalPaths.has(candidate)) add(candidate)
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(ast)
    }
  }
  entries.sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  const orderedEdges = [...edges.values()].sort((a,b) => a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : 0)
  const batch = repositoryBatch(root, entries.map(e => e.path))
  for (const e of entries) if (sha(batch.bytes[e.path]) !== e.sha256) fail("DEPENDENCY_CHANGED")
  return freeze({ files: entries, edges: orderedEdges, repositoryClosureRoot: H("repository-closure", { files: entries, edges: orderedEdges }) })
}
const recheckRepository = (root: string, repository: ReturnType<typeof repositoryClosure>): void => {
  const batch = repositoryBatch(root, repository.files.map(e => e.path))
  for (const e of repository.files) {
    if (sha(batch.bytes[e.path]) !== e.sha256 || (lstatSync(path.join(root, e.path)).mode & 0o111 ? "100755" : "100644") !== e.mode)
      fail("DEPENDENCY_CHANGED")
  }
}
const sourceAdmission = (root: string, h: History) => {
  const pair = fixedHistory(h)
  const repository = repositoryClosure(root, [SELF, TEST])
  const executing = regular(fileURLToPath(import.meta.url))
  if (!executing.equals(readV138WorkspaceBatch(root, [SELF]).bytes[SELF])) fail("EXECUTING_SOURCE_CHANGED")
  // Also compare imported implementation dependencies with supplied-root bytes.
  for (const e of repository.files) if (e.path !== TEST && sha(regular(path.join(IMPLEMENTATION_ROOT, e.path))) !== e.sha256) fail("EXECUTING_DEPENDENCY_CHANGED")
  const runtime = inspectV138Plan142SemanticRuntimeForReview(root)
  return { pair, repository, runtime, semanticRuntimeClosureRoot: H("runtime-closure", runtime.entries) }
}

const authenticateSubject = (h: History, value: Json, source: string) => {
  ancestor(h, value.commit)
  if (h.git(["rev-parse", `${value.commit}^{tree}`]) !== value.tree ||
    h.git(["rev-parse", `${value.commit}^`]) !== value.parent) fail("SUBJECT_COMMIT")
  const closure = repositoryClosure(h.root, [source, source.replace(/\.ts$/, ".test.ts")])
  if (!equal(closure.files, value.files) || closure.repositoryClosureRoot !== value.repositoryClosureRoot) fail("SUBJECT_CLOSURE")
  committed(h, value.commit, value.files.map((e: FileEntry) => e.path), false)
  for (const e of value.files) if (h.git(["ls-tree", value.commit, "--", e.path]) !== `${e.mode} blob ${e.blob}\t${e.path}`) fail("SUBJECT_ENTRY")
  return closure
}

/** Deterministic review-only transform; operational source never reads guard options. */
export const inspectV138LiveV14ProducerGuardForReview = (source: string) => {
  const ast = ts.createSourceFile(SELF, source, ts.ScriptTarget.Latest, true)
  const identifiers: ts.Identifier[] = []; const imports: ts.ImportSpecifier[] = []; const calls: ts.CallExpression[] = []
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n) && n.text === "runV138V3ProductionLive") identifiers.push(n)
    if (ts.isImportSpecifier(n) && n.name.text === "runV138V3ProductionLive") imports.push(n)
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "runV138V3ProductionLive") calls.push(n)
    ts.forEachChild(n, visit)
  }; visit(ast)
  if (identifiers.length !== 2 || imports.length !== 1 || calls.length !== 1 || imports[0].propertyName) fail("PRODUCER_BOUNDARY")
  const declaration = imports[0].parent.parent.parent as ts.ImportDeclaration
  if (!ts.isStringLiteral(declaration.moduleSpecifier) || declaration.moduleSpecifier.text !== "./run-v1-38-bounded-retry-envelope-v3.js") fail("PRODUCER_IMPORT")
  const importStart = imports[0].getStart(ast); const importEnd = imports[0].getEnd()
  const callStart = calls[0].expression.getStart(ast); const callEnd = calls[0].expression.getEnd()
  const guardFunction = '\nconst guardedProducerMustNotRun = async (..._args: unknown[]) => { const p = new URL("../.producer-guard", import.meta.url); const n = Number(readFileSync(p,"utf8")); writeFileSync(p,String(n+1)); throw new Error("V138_LIVE_V14_PRODUCER_GUARD_TRIPPED") }\n'
  // The import clause remains syntactically valid because PATHS precedes producer.
  const transformed = source.slice(0, importStart).replace(/,\s*$/, " ") + source.slice(importEnd, callStart) +
    "guardedProducerMustNotRun" + source.slice(callEnd) + guardFunction
  const body = { originalSourceSha256: sha(source), producerImport: (declaration.moduleSpecifier as ts.StringLiteral).text,
    producerCall: "runV138V3ProductionLive", transformedSourceSha256: sha(transformed) }
  return freeze({ ...body, guardTransformRoot: H("guard-transform", body), transformed })
}

/** Immutable custody deliberately contains no effect-absence requirement. */
export const authenticateV138LiveV14ImmutableCustody = (rootInput: string) => {
  const h = historySnapshot(rootInput)
  try {
    const admission = sourceAdmission(h.root, h)
    const paths = [V138_LIVE_V14_PATHS.payload, V138_LIVE_V14_PATHS.review, V138_LIVE_V14_PATHS.carrier]
    const publicationCommit = locate(h, paths[0]); scope(h, publicationCommit, paths.map(p => ["A", p]))
    const bytes = committed(h, publicationCommit, paths)
    const input = { payload: parseCanonical(bytes[paths[0]]), review: bytes[paths[1]].toString(), carrier: parseCanonical(bytes[paths[2]]) }
    validateV138LiveV14PublishedContractForReview(input)
    const p = input.payload
    authenticateSubject(h, p.consumerSubject, SELF); authenticateSubject(h, p.reviewerSubject, REVIEWER)
    ancestor(h, p.consumerSubject.commit, p.reviewerSubject.commit); ancestor(h, p.reviewerSubject.commit, publicationCommit)
    if (p.consumerSubject.commit === p.reviewerSubject.commit || p.reviewerSubject.commit === publicationCommit) fail("SUBJECT_ORDER")
    const summaryCommit = locate(h, V138_LIVE_V14_PATHS.summary)
    scope(h, summaryCommit, [["A", V138_LIVE_V14_PATHS.summary]])
    if (h.git(["rev-parse", `${summaryCommit}^`]) !== publicationCommit || h.head === summaryCommit) fail("SUMMARY_ORDER")
    const summary = committed(h, summaryCommit, [V138_LIVE_V14_PATHS.summary])[V138_LIVE_V14_PATHS.summary].toString()
    for (const ref of [publicationCommit, p.consumerSubject.commit, p.reviewerSubject.commit, p.payloadRoot]) if (!summary.includes(ref)) fail("SUMMARY_BINDING")
    const descendants = h.git(["rev-list", "--reverse", "--ancestry-path", `${summaryCommit}..${h.head}`]).split("\n").filter(Boolean)
    const trackingCommit = descendants.find(commit => {
      const changed = h.git(["diff-tree", "--no-commit-id", "--name-status", "-r", commit])
      return changed === "M\t.planning/ROADMAP.md\nM\t.planning/STATE.md"
    })
    if (!trackingCommit) fail("TRACKING_MISSING")
    for (const name of [".planning/ROADMAP.md", ".planning/STATE.md"]) {
      const text = h.bytes(["show", `${trackingCommit}:${name}`]).toString()
      if (!text.includes(summaryCommit) || !text.includes(publicationCommit)) fail("TRACKING_BINDING")
    }
    const consumerSummaryPath = `${PHASE}/262-144-SUMMARY.md`
    const consumerSummaryCommit = locate(h, consumerSummaryPath)
    scope(h, consumerSummaryCommit, [["A", consumerSummaryPath]])
    ancestor(h, p.consumerSubject.commit, consumerSummaryCommit); ancestor(h, consumerSummaryCommit, p.reviewerSubject.commit)
    const consumerSummary = committed(h, consumerSummaryCommit, [consumerSummaryPath])[consumerSummaryPath].toString()
    if (!consumerSummary.includes(p.consumerSubject.commit)) fail("CONSUMER_SUMMARY_BINDING")
    const k = p.canonicalCustody
    if (!equal(k.semanticRuntimeInventory, admission.runtime.entries) || k.semanticRuntimeClosureRoot !== admission.semanticRuntimeClosureRoot ||
      k.repositoryClosureRoot !== admission.repository.repositoryClosureRoot ||
      p.currentExecution.guardTransformRoot !== inspectV138LiveV14ProducerGuardForReview(bytesForSelf(h.root)).guardTransformRoot) fail("CURRENT_CUSTODY_DRIFT")
    // Root and transcript identities stay private. They are recreated on every
    // authentication; persisted JSON never reconstructs a WeakMap capability.
    const transcript = randomBytes(32)
    const result = freeze({ publicationCommit, summaryCommit, trackingCommit, payloadRoot: p.payloadRoot as Sha,
      canonicalLocalExecutionClosureRoot: k.canonicalLocalExecutionClosureRoot as Sha,
      sourceRoot: p.consumerSubject.subjectRoot as Sha, runtimeRoot: admission.semanticRuntimeClosureRoot,
      pair: admission.pair, plan110Eligible: true as const, authorizesExecution: false as const, downstreamAuthority: "denied" as const })
    provenance.set(result, { ...h.rootBinding, head: h.head, metadataDigest: h.metadataDigest,
      transcript: sha(transcript), value: sha(canonical(result)) })
    return result
  } finally { h.finish() }
}
const bytesForSelf = (root: string) => readV138WorkspaceBatch(root, [SELF]).bytes[SELF].toString()
const provenance = new WeakMap<object, { root: string; device: string; inode: string; head: string; metadataDigest: Sha; transcript: Sha; value: Sha }>()
export const checkV138LiveV14RootBoundCustodyForReview = (rootInput: string, value: unknown): true => {
  if (!value || typeof value !== "object") fail("PROVENANCE_MISSING")
  const bound = provenance.get(value as object)
  if (!bound || !isSha(bound.transcript) || bound.value !== sha(canonical(value)) ||
    !equal(rootIdentity(rootInput), { root: bound.root, device: bound.device, inode: bound.inode }) ||
    sha(metadata(bound.root)) !== bound.metadataDigest || git(bound.root, ["rev-parse", "HEAD"]) !== bound.head) fail("PROVENANCE_INVALID")
  const fresh = authenticateV138LiveV14ImmutableCustody(rootInput)
  if (!equal(fresh, value)) fail("PROVENANCE_CHANGED")
  return true
}

export const validateV138LiveV14EffectValuesForReview = (input: unknown) => {
  exact(input, ["stage", "journalPresent", "privateDirectoryPresent", "terminalPresent", "lockPresent", "reproductionPresent", "downstreamPresent", "outcome"])
  if (input.stage !== "pre" && input.stage !== "post") fail("STAGE_INVALID")
  for (const key of ["journalPresent", "privateDirectoryPresent", "terminalPresent", "lockPresent", "reproductionPresent"])
    if (typeof input[key] !== "boolean") fail("EFFECT_TYPE")
  const downstream = array(input.downstreamPresent, 6, 6)
  if (downstream.some(v => typeof v !== "boolean" || v)) fail("DOWNSTREAM_PRESENT")
  if (input.stage === "pre" && [input.journalPresent, input.privateDirectoryPresent, input.terminalPresent, input.lockPresent, input.reproductionPresent].some(Boolean)) fail("PRE_EFFECT_PRESENT")
  if (input.stage === "pre" && input.outcome !== null) fail("PRE_OUTCOME")
  if (input.outcome !== null) {
    exact(input.outcome, ["disposition", "journalRoot", "stateRoot", "completeCleanup", "reproductionPresent", "downstreamAuthority"])
    if (!["active", "succeeded", "terminal_failure", "exhausted"].includes(input.outcome.disposition) ||
      !isSha(input.outcome.journalRoot) || !isSha(input.outcome.stateRoot) || typeof input.outcome.completeCleanup !== "boolean" ||
      typeof input.outcome.reproductionPresent !== "boolean" || input.outcome.downstreamAuthority !== "denied") fail("OUTCOME_INVALID")
  }
  return checkV138LiveV10PostRunOutputCustodyForReview({ journalPresent: input.journalPresent,
    privateDirectoryPresent: input.privateDirectoryPresent, terminalPresent: input.terminalPresent,
    lockPresent: input.lockPresent, reproductionPresent: input.reproductionPresent,
    adjudicationOrDownstreamPresent: false, outcome: input.outcome ?? undefined })
}
const pathKind = (root: string, relativePath: string): "absent" | "file" | "directory" => {
  let current = root
  for (const [i, part] of relativePath.split("/").entries()) {
    current = path.join(current, part)
    try {
      const stat = lstatSync(current)
      if (stat.isSymbolicLink() || i < relativePath.split("/").length - 1 && !stat.isDirectory()) fail("PATH_COMPONENT")
      if (i === relativePath.split("/").length - 1) {
        if (stat.isFile()) return "file"
        if (stat.isDirectory()) return "directory"
        fail("PATH_TYPE")
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT" && i === relativePath.split("/").length - 1) return "absent"
      throw error
    }
  }
  return fail("PATH_INVALID")
}
export const checkV138LiveV14EffectState = (rootInput: string, stage: "pre" | "post") => {
  const root = rootIdentity(rootInput).root
  if (stage !== "pre" && stage !== "post") fail("STAGE_INVALID")
  if (stage === "pre") {
    readV138WorkspaceBatch(root, [], V138_LIVE_V14_EFFECT_PATHS)
    return freeze({ status: "no_effects", producerCalls: 0, downstreamAuthority: "denied" })
  }
  const forbidden = [V138_LIVE_V14_EFFECT_PATHS[1], ...V138_LIVE_V14_EFFECT_PATHS.slice(5)]
  readV138WorkspaceBatch(root, [], forbidden)
  const [journalKind, , privateKind, terminalKind, reproductionKind] = V138_LIVE_V14_EFFECT_PATHS.slice(0, 5).map(p => pathKind(root, p))
  if (journalKind === "absent" && privateKind === "absent" && terminalKind === "absent" && reproductionKind === "absent") {
    readV138WorkspaceBatch(root, [], V138_LIVE_V14_EFFECT_PATHS)
    return freeze({ status: "no_effects", producerCalls: 0, downstreamAuthority: "denied" })
  }
  if (journalKind !== "file" || terminalKind !== "file" || privateKind !== "directory" || reproductionKind === "directory") fail("POST_COMBINATION")
  const privatePath = path.join(root, V138_BOUNDED_RETRY_V3_PATHS.privateDir)
  const fd = openSync(privatePath, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW)
  try {
    const beforePrivate = fstatSync(fd)
    if ((beforePrivate.mode & 0o777) !== 0o700) fail("PRIVATE_MODE")
    const initial = readV138WorkspaceBatch(root, [V138_BOUNDED_RETRY_V3_PATHS.journal, V138_BOUNDED_RETRY_V3_PATHS.terminal], forbidden)
    const journal = initial.bytes[V138_BOUNDED_RETRY_V3_PATHS.journal]
    const lines = journal.toString().split("\n")
    if (lines.pop() !== "" || !lines.length || lines.length > 10000) fail("JOURNAL_INVALID")
    const records = lines.map(line => { const v = JSON.parse(line); if (canonical(v).trimEnd() !== line) fail("JOURNAL_INVALID"); return v })
    const envelope = parseCanonical(readV138WorkspaceBatch(root, [V138_BOUNDED_RETRY_V3_PATHS.envelope]).bytes[V138_BOUNDED_RETRY_V3_PATHS.envelope])
    if (envelope.envelopeRoot !== "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a") fail("PAIR_INVALID")
    const state = deriveV138RetryV3State(envelope, records)
    if (state.disposition === "active") fail("TERMINAL_REQUIRED")
    const receipts = records.map(r => `${V138_BOUNDED_RETRY_V3_PATHS.privateDir}/journal-record-${String(r.ordinal).padStart(4, "0")}.json`)
    const reads = [V138_BOUNDED_RETRY_V3_PATHS.journal, V138_BOUNDED_RETRY_V3_PATHS.terminal, ...receipts,
      ...(reproductionKind === "file" ? [V138_BOUNDED_RETRY_V3_PATHS.reproduction] : [])]
    const final = readV138WorkspaceBatch(root, reads, [...forbidden, ...(reproductionKind === "absent" ? [V138_BOUNDED_RETRY_V3_PATHS.reproduction] : [])])
    if (!journal.equals(final.bytes[V138_BOUNDED_RETRY_V3_PATHS.journal]) || !equal(initial.identity, final.identity) ||
      identity(fstatSync(fd)) !== identity(beforePrivate) || identity(lstatSync(privatePath)) !== identity(beforePrivate) ||
      !equal(final.ancestorIdentities[V138_BOUNDED_RETRY_V3_PATHS.privateDir], { device: String(beforePrivate.dev), inode: String(beforePrivate.ino) })) fail("POST_CHANGED")
    for (const [i, receipt] of receipts.entries()) if (!final.bytes[receipt].equals(Buffer.from(canonical(records[i]))) ||
      (lstatSync(path.join(root, receipt)).mode & 0o777) !== 0o600) fail("PRIVATE_RECEIPT")
    const terminal = { schemaVersion: "v1.38-current-matrix-retry-terminal-v3", terminalReason: state.terminalReason,
      journalRoot: state.journalRoot, stateRoot: state.stateRoot, disposition: state.disposition,
      counters: { preflightObservationsConsumed: state.preflightObservationsConsumed, routeStartsConsumed: state.routeStartsConsumed,
        calibrationIdentitiesCharged: state.calibrationIdentitiesCharged, reproductionIdentitiesCharged: state.reproductionIdentitiesCharged,
        acceptedCells: state.acceptedCells }, freshAccepted: state.acceptedCells, completeCleanup: state.completeCleanup,
      downstreamAuthority: "denied", productionAuthorized: false }
    if (!final.bytes[V138_BOUNDED_RETRY_V3_PATHS.terminal].equals(Buffer.from(canonical(terminal)))) fail("TERMINAL_INVALID")
    const outcome = { disposition: state.disposition, journalRoot: state.journalRoot, stateRoot: state.stateRoot,
      completeCleanup: state.completeCleanup, reproductionPresent: reproductionKind === "file", downstreamAuthority: "denied" as const }
    const result = validateV138LiveV14EffectValuesForReview({ stage: "post", journalPresent: true, privateDirectoryPresent: true,
      terminalPresent: true, lockPresent: false, reproductionPresent: reproductionKind === "file", downstreamPresent: Array(6).fill(false), outcome })
    if (reproductionKind === "file") checkV138LiveV10ReproductionV17ForReview({ artifact: parseCanonical(final.bytes[V138_BOUNDED_RETRY_V3_PATHS.reproduction]), journalRecords: records, outcome })
    return result
  } finally { closeSync(fd) }
}

export async function runV138ReviewedBoundedLiveEnvelopeV14(root: string): Promise<void> {
  const ready = authenticateV138LiveV14ImmutableCustody(root)
  checkV138LiveV14EffectState(root, "pre")
  let producerError: unknown
  let postError: unknown
  try {
    await runV138V3ProductionLive(root, { validateInputs: false, checkPair: () => ready.pair as never })
  } catch (error) { producerError = error }
  finally {
    try {
      const after = authenticateV138LiveV14ImmutableCustody(root)
      if (!equal(after, ready)) fail("IMMUTABLE_CUSTODY_CHANGED")
      checkV138LiveV14EffectState(root, "post")
    } catch (error) { postError = error }
  }
  settleV138LiveV9ProducerOutcomeForReview(producerError, postError)
}

const valueFixture = (index: number): unknown => {
  const outcome = { disposition: index === 3 ? "exhausted" : "succeeded", journalRoot: `sha256:${"1".repeat(64)}`,
    stateRoot: `sha256:${"2".repeat(64)}`, completeCleanup: true, reproductionPresent: index !== 3, downstreamAuthority: "denied" }
  if (index < 5) return validateV138LiveV14EffectValuesForReview({ stage: "post", journalPresent: true, privateDirectoryPresent: true,
    terminalPresent: true, lockPresent: false, reproductionPresent: index === 4, downstreamPresent: Array(6).fill(false), outcome })
  const body = { schemaVersion: "v1.38-current-matrix-reproduction-v17", status: "passed_exact",
    admittedCalibrationRoot: `sha256:${"3".repeat(64)}`, chargedAttemptCount: 540, acceptedCellCount: 540,
    completeCleanup: true, executionRoot: `sha256:${"4".repeat(64)}`, runtimeRoute: "v1.18/v1.19/MATCH_KERNEL",
    samplingMilliseconds: 200, partialAcceptedEvidenceReusable: false,
    privacyProjection: { strategySourceIncluded: false, strategyMemoryIncluded: false, soldierMemoryIncluded: false,
      objectivePayloadIncluded: false, rawDiagnosticsIncluded: false }, phase263PlanningAuthorized: false,
    candidateSearchAuthorized: false, formationMaterializationAuthorized: false, holdoutOpeningAuthorized: false,
    publicAuthorized: false, productAuthorized: false, productionAuthorized: false }
  const receiptRoot = computeV138LiveV10ReproductionV17ReceiptRoot(body)
  return checkV138LiveV10ReproductionV17ForReview({ artifact: { ...body, receiptRoot }, journalRecords: [
    { kind: "finish_calibration", routeIdentity: "route:v3:0", owner: "owner", status: "admitted", completeCleanup: true, supervisionRoot: body.admittedCalibrationRoot },
    { kind: "finish_reproduction", routeIdentity: "route:v3:0", owner: "owner", status: "passed_exact", acceptedCells: 540,
      completeCleanup: true, reproductionRoot: receiptRoot, recordRoot: outcome.journalRoot },
  ], outcome } as never)
}

/** Closed incapable API: no operational selector or caller verdict is accepted. */
export const executeV138LiveV14ReviewMode = (rootInput: string, mode: ReviewMode) => {
  const index = V138_LIVE_V14_REVIEW_MODES.indexOf(mode)
  if (index < 0) fail("REVIEW_MODE_INVALID")
  const h = historySnapshot(rootInput)
  try {
    const admitted = sourceAdmission(h.root, h)
    checkV138LiveV14EffectState(h.root, "pre")
    if (index === 2) checkV138LiveV14EffectState(h.root, "post")
    if (index >= 3) {
      const checked = valueFixture(index) as Json
      if (index === 3 && checked.status !== "bounded_terminal" || index === 4 && checked.status !== "bounded_success" ||
        index === 5 && (checked.acceptedCells !== 540 || checked.exact !== true)) fail("VALUE_SEMANTICS")
    }
    // Source/prospective checks attest the current implementation only. They do
    // not fabricate the future independent reviewer's identity or publication.
    recheckRepository(h.root, admitted.repository)
    if (!equal(inspectV138Plan142SemanticRuntimeForReview(h.root), admitted.runtime)) fail("REVIEW_CUSTODY_CHANGED")
    checkV138LiveV14EffectState(h.root, "pre")
    const result = freeze({ mode, status: STATUSES[index], reducedValue: REDUCED[index],
      repositoryClosureRoot: admitted.repository.repositoryClosureRoot, semanticRuntimeClosureRoot: admitted.semanticRuntimeClosureRoot,
      nativeIdentityRoot: H("native-identities", NATIVES), sourceRoot: sha(bytesForSelf(h.root)) })
    provenance.set(result, { ...h.rootBinding, head: h.head, metadataDigest: h.metadataDigest,
      transcript: sha(randomBytes(32)), value: sha(canonical(result)) })
    return result
  } finally { h.finish() }
}

export const authenticateV138LiveV14ReviewModeBatchForReview = (rootInput: string, candidates: unknown): true => {
  const items = array(candidates, 6, 6); const root = rootIdentity(rootInput)
  for (const candidate of items) {
    const bound = candidate && typeof candidate === "object" ? provenance.get(candidate) : undefined
    if (!bound || !equal(root, { root: bound.root, device: bound.device, inode: bound.inode })) fail("REVIEW_PROVENANCE_INVALID")
  }
  const h = historySnapshot(root.root)
  try {
    const current = sourceAdmission(root.root, h)
    checkV138LiveV14EffectState(root.root, "pre")
    for (const [i, value] of items.entries()) {
      exact(value, ["mode", "status", "reducedValue", "repositoryClosureRoot", "semanticRuntimeClosureRoot", "nativeIdentityRoot", "sourceRoot"])
      const bound = provenance.get(value)
      if (!bound || !equal(root, { root: bound.root, device: bound.device, inode: bound.inode }) || bound.head !== h.head ||
        bound.metadataDigest !== h.metadataDigest || bound.value !== sha(canonical(value)) ||
        value.mode !== V138_LIVE_V14_REVIEW_MODES[i] || value.status !== STATUSES[i] || !equal(value.reducedValue, REDUCED[i]) ||
        value.repositoryClosureRoot !== current.repository.repositoryClosureRoot || value.semanticRuntimeClosureRoot !== current.semanticRuntimeClosureRoot ||
        value.nativeIdentityRoot !== H("native-identities", NATIVES) || value.sourceRoot !== sha(bytesForSelf(root.root))) fail("REVIEW_PROVENANCE_INVALID")
    }
    return true
  } finally { h.finish() }
}

type RuntimeMaterial = { identity: string; mode: string; size: number; sha256: Sha; origin?: string; destination: string; bytes?: Buffer }
const resolvePackage = (base: string, name: string): string | undefined => {
  const resolver = createRequire(path.join(base, "package.json"))
  let found: string
  try { try { found = resolver.resolve(`${name}/package.json`) } catch { found = resolver.resolve(name) } }
  catch { return undefined }
  let at = path.dirname(found)
  while (at !== path.dirname(at)) {
    try { if (JSON.parse(regular(path.join(at, "package.json")).toString()).name === name) return realpathSync(at) }
    catch { /* walk only to find the actual owning manifest */ }
    at = path.dirname(at)
  }
  return undefined
}
const runtimeMaterials = (root: string, runtime: ReturnType<typeof inspectV138Plan142SemanticRuntimeForReview>): RuntimeMaterial[] => {
  const queue = ["typescript", "tsx", "vitest", "@cowards/spec", "@cowards/golden"].map(name => resolvePackage(root, name) ?? fail("RUNTIME_PACKAGE"))
  queue.push(path.join(root, "apps/runtime-service"))
  const packages = new Map<string, { root: string; name: string }>()
  while (queue.length) {
    const at = queue.shift()!; const m = JSON.parse(regular(path.join(at, "package.json")).toString())
    const key = `${m.name}@${m.version}`; if (packages.has(key)) continue
    packages.set(key, { root: at, name: m.name })
    for (const name of Object.keys({ ...m.dependencies, ...m.optionalDependencies, ...m.peerDependencies })) {
      const dependency = resolvePackage(at, name)
      if (dependency) queue.push(dependency)
      else if (m.dependencies?.[name] && !m.optionalDependencies?.[name]) fail("RUNTIME_DEPENDENCY")
    }
  }
  const pnpm = realpathSync(path.join(path.dirname(process.execPath), "pnpm")); const pnpmRoot = path.resolve(path.dirname(pnpm), "..")
  const pnpmManifest = JSON.parse(regular(path.join(pnpmRoot, "package.json")).toString())
  const prefix = `runtime/distribution/${pnpmManifest.name}@${pnpmManifest.version}/`
  const ast = ts.createSourceFile(SOURCE142, regular(path.join(root, SOURCE142)).toString(), ts.ScriptTarget.Latest, true)
  let template: string | undefined
  const findTemplate = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === "PRIVATE_TSX_LAUNCHER_TEMPLATE" &&
      n.initializer && ts.isNoSubstitutionTemplateLiteral(n.initializer)) template = n.initializer.text
    ts.forEachChild(n, findTemplate)
  }; findTemplate(ast)
  return runtime.entries.map(entry => {
    let origin: string | undefined; let destination: string; let bytes: Buffer | undefined
    if (entry.identity === "runtime/node/executable") { origin = realpathSync(process.execPath); destination = ".runtime-node/node" }
    else if (entry.identity === "runtime/launcher/pnpm") { origin = pnpm; destination = ".runtime-launchers/pnpm" }
    else if (entry.identity === "runtime/launcher/tsx") { origin = path.join(root, "node_modules/.bin/tsx"); destination = "node_modules/.bin/tsx" }
    else if (entry.identity === "runtime/launcher/private-tsx") {
      if (!template) fail("RUNTIME_TEMPLATE")
      bytes = Buffer.from(template); destination = ".runtime-launchers/private-tsx-template"
    } else if (entry.identity.startsWith(prefix)) {
      const p = entry.identity.slice(prefix.length); origin = path.join(pnpmRoot, p); destination = `.runtime-pnpm/${p}`
    } else {
      const item = [...packages.entries()].find(([key]) => entry.identity.startsWith(`runtime/package/${key}/`))
      if (!item) fail("RUNTIME_ENTRY_UNRESOLVED")
      const [key, pkg] = item!; const p = entry.identity.slice(`runtime/package/${key}/`.length)
      origin = path.join(pkg.root, p); destination = `node_modules/${pkg.name}/${p}`
    }
    const actual = bytes ?? regular(origin!)
    if (actual.length !== entry.size || sha(actual) !== entry.sha256 || origin &&
      (lstatSync(origin).mode & 0o111 ? "100755" : "100644") !== entry.mode) fail("RUNTIME_MATERIAL_CHANGED")
    return { ...entry, origin, destination, bytes }
  })
}
const materialize = (root: string, materials: RuntimeMaterial[]) => {
  for (const m of materials) {
    const target = path.join(root, m.destination); mkdirSync(path.dirname(target), { recursive: true })
    const bytes = m.bytes ?? regular(m.origin!)
    if (sha(bytes) !== m.sha256) fail("RUNTIME_MATERIAL_CHANGED")
    writeFileSync(target, bytes, { mode: m.mode === "100755" ? 0o755 : 0o644, flag: "wx" })
  }
  // Only this resolver link is needed by the pinned inspector; all implementation
  // bytes are owned regular copies and the link itself is checked around children.
  symlinkSync("../.runtime-pnpm/bin/pnpm.cjs", path.join(root, ".runtime-node/pnpm"))
}
const verifyMaterial = (root: string, inventory: readonly { path: string; sha256: Sha; mode: string }[]) => {
  for (const e of inventory) {
    const absolute = path.join(root, e.path)
    if (sha(regular(absolute)) !== e.sha256 || (lstatSync(absolute).mode & 0o111 ? "100755" : "100644") !== e.mode) fail("PRIVATE_BYTES_CHANGED")
  }
  if (realpathSync(path.join(root, ".runtime-node/pnpm")) !== path.join(root, ".runtime-pnpm/bin/pnpm.cjs")) fail("PRIVATE_RESOLVER_CHANGED")
}

/** Heavy source proof: two actual private roots/processes, no operational API. */
export const buildV138LiveV14GuardedProofForReview = (rootInput: string) => {
  const root = rootIdentity(rootInput).root
  const history = historySnapshot(root)
  const owned: string[] = []
  try {
    const admitted = sourceAdmission(root, history)
    checkV138LiveV14EffectState(root, "pre")
    const source = bytesForSelf(root); const guard = inspectV138LiveV14ProducerGuardForReview(source)
    const materials = runtimeMaterials(root, admitted.runtime)
    const runs: Json[][] = []
    const copies: Array<{ owner: string; checkout: string; transformedClosure: ReturnType<typeof repositoryClosure>;
      inventory: Array<{ path: string; mode: string; sha256: Sha }> }> = []
    for (let repeat = 0; repeat < 2; repeat++) {
      const owner = realpathSync(mkdtempSync(path.join(tmpdir(), "v138-live14-proof-"))); owned.push(owner); chmodSync(owner, 0o700)
      const checkout = path.join(owner, "repo")
        execFileSync("/usr/bin/git", ["clone", "--quiet", "--no-local", root, checkout],
          { env: gitEnv, timeout: 120000, stdio: ["ignore", "pipe", "pipe"] })
        const sourceBatch = repositoryBatch(root, admitted.repository.files.map(e => e.path))
        for (const entry of admitted.repository.files) {
          const target = path.join(checkout, entry.path); mkdirSync(path.dirname(target), { recursive: true })
          if (sha(sourceBatch.bytes[entry.path]) !== entry.sha256) fail("SOURCE_CHANGED")
          writeFileSync(target, sourceBatch.bytes[entry.path])
          chmodSync(target, entry.mode === "100755" ? 0o755 : 0o644)
        }
        materialize(checkout, materials)
        writeFileSync(path.join(checkout, SELF), guard.transformed)
        writeFileSync(path.join(checkout, ".producer-guard"), "0", { mode: 0o600, flag: "wx" })
        const transformedClosure = repositoryClosure(checkout, [SELF, TEST])
        const inventory = [...transformedClosure.files.map(e => ({ path: e.path, mode: e.mode, sha256: e.sha256 })),
          ...materials.map(m => ({ path: m.destination, mode: m.mode, sha256: m.sha256 }))]
        copies.push({ owner, checkout, transformedClosure, inventory })
    }
    for (const [index, copy] of copies.entries()) {
        const { owner, checkout, transformedClosure, inventory } = copy
        const other = copies[1 - index].checkout
        const bootstrap = `import {readFileSync,lstatSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const inventory=${JSON.stringify(inventory)};
function verify(){for(const e of inventory){const p=new URL(e.path,import.meta.url);const s=lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||'sha256:'+createHash('sha256').update(readFileSync(p)).digest('hex')!==e.sha256||(s.mode&0o111?'100755':'100644')!==e.mode)throw new Error('PRIVATE_CHANGED')}}
verify(); const subject=await import('./${SELF}'); const observations=[];
for(const mode of ${JSON.stringify(V138_LIVE_V14_REVIEW_MODES)}){verify();observations.push(subject.executeV138LiveV14ReviewMode(process.cwd(),mode));verify()}
subject.authenticateV138LiveV14ReviewModeBatchForReview(process.cwd(),observations);
const rejects=(fn)=>{try{fn();return false}catch{return true}};
const replayRejected=rejects(()=>subject.authenticateV138LiveV14ReviewModeBatchForReview(process.cwd(),JSON.parse(JSON.stringify(observations))));
const otherRoot=${JSON.stringify(other)};
const otherValue=subject.executeV138LiveV14ReviewMode(otherRoot,'source-only');
const crossRootRejected=rejects(()=>subject.authenticateV138LiveV14ReviewModeBatchForReview(otherRoot,observations));
const mixedRejected=rejects(()=>subject.authenticateV138LiveV14ReviewModeBatchForReview(process.cwd(),[otherValue,...observations.slice(1)]));
const mutationRejected=Object.isFrozen(observations[0])&&!Reflect.set(observations[0],'status','forged');
const sealPath=otherRoot+${JSON.stringify(`/${V138_BOUNDED_RETRY_V3_PATHS.localSeal}`)};
const before=readFileSync(sealPath);let driftRejected=false;
try{writeFileSync(sealPath,Buffer.concat([before,Buffer.from(' ')]));driftRejected=rejects(()=>subject.executeV138LiveV14ReviewMode(otherRoot,'source-only'))}finally{writeFileSync(sealPath,before)}
if(![replayRejected,crossRootRejected,mixedRejected,mutationRejected,driftRejected].every(Boolean))throw new Error('PROVENANCE_ACCEPTED');
verify(); process.stdout.write(JSON.stringify({observations,replayRejected,crossRootRejected,mixedRejected,mutationRejected,driftRejected})+'\\n');`
        writeFileSync(path.join(checkout, ".proof-bootstrap.mjs"), bootstrap, { mode: 0o600, flag: "wx" })
        verifyMaterial(checkout, inventory)
        const stdout = execFileSync(path.join(checkout, ".runtime-node/node"), ["--import", "tsx", ".proof-bootstrap.mjs"],
          { cwd: checkout, env: { PATH: `${path.join(checkout, ".runtime-node") }:/usr/bin:/bin`, HOME: owner,
            TMPDIR: owner, TSX_DISABLE_CACHE: "1" }, timeout: 240000, maxBuffer: 8 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
        verifyMaterial(checkout, inventory)
        if (regular(path.join(checkout, ".producer-guard")).toString() !== "0") fail("PRODUCER_GUARD_NONZERO")
        const child = JSON.parse(stdout.toString())
        if (![child.replayRejected, child.crossRootRejected, child.mixedRejected, child.mutationRejected, child.driftRejected].every(v => v === true) ||
          !Array.isArray(child.observations) || child.observations.length !== 6) fail("CHILD_TRANSCRIPT")
        const normalized = child.observations.map((record: Json, i: number) => {
          const expected = { mode: V138_LIVE_V14_REVIEW_MODES[i], status: STATUSES[i], reducedValue: REDUCED[i],
            repositoryClosureRoot: transformedClosure.repositoryClosureRoot, semanticRuntimeClosureRoot: admitted.semanticRuntimeClosureRoot,
            nativeIdentityRoot: H("native-identities", NATIVES), sourceRoot: guard.transformedSourceSha256 }
          if (!equal(record, expected)) fail("CHILD_OBSERVATION")
          return { ...record, sourceRoot: sha(source), repositoryClosureRoot: admitted.repository.repositoryClosureRoot }
        })
        runs.push(normalized)
    }
    for (const copy of copies) {
      verifyMaterial(copy.checkout, copy.inventory)
      if (regular(path.join(copy.checkout, ".producer-guard")).toString() !== "0") fail("PRODUCER_GUARD_NONZERO")
    }
    if (!equal(runs[0], runs[1]) || !equal(sourceAdmission(root, history).repository, admitted.repository) ||
      !equal(inspectV138Plan142SemanticRuntimeForReview(root), admitted.runtime)) fail("CANONICAL_CHANGED")
    checkV138LiveV14EffectState(root, "pre")
    return freeze({ runs, normalizedEvidenceRoots: runs.map(run => H("reproduction", run)),
      guardTransformRoot: guard.guardTransformRoot, sourceRoot: sha(source), repositoryClosureRoot: admitted.repository.repositoryClosureRoot,
      semanticRuntimeClosureRoot: admitted.semanticRuntimeClosureRoot, nativeIdentityRoot: H("native-identities", NATIVES),
      producerGuardCount: 0, actualModesPassed: 6, rootCount: 2, processCount: 2,
      provenanceAttacks: { serializedReplayRejected: true, genuineCrossRootRejected: true, mixedBatchRejected: true,
        storedMutationRejected: true, validToInvalidRootRejected: true },
      authorizesExecution: false, downstreamAuthority: "denied", counters: ZERO })
  } finally { for (const owner of owned) rmSync(owner, { recursive: true, force: true }); history.finish() }
}

export const executeV138LiveV14Cli = async (args: readonly string[]): Promise<void> => {
  if (args.length !== 1) fail("ARGUMENTS_INVALID")
  const selector = args[0]
  const reviewSelectors = ["--check-source-only", "--check-prospective-custody", "--check-post-no-effect",
    "--check-non-pass-value", "--check-bounded-success-value", "--check-exact-reproduction-v17-value"]
  const reviewIndex = reviewSelectors.indexOf(selector)
  if (reviewIndex >= 0) {
    process.stdout.write(canonical(executeV138LiveV14ReviewMode(IMPLEMENTATION_ROOT, V138_LIVE_V14_REVIEW_MODES[reviewIndex])))
    return
  }
  if (selector === "--run-reviewed-bounded-live-envelope") {
    await runV138ReviewedBoundedLiveEnvelopeV14(IMPLEMENTATION_ROOT)
    process.stdout.write(canonical({ status: "reviewed_bounded_live_complete" })); return
  }
  if (selector !== "--check-reviewed-live-ready" && selector !== "--check-post-run-custody") fail("ARGUMENTS_INVALID")
  const admitted = authenticateV138LiveV14ImmutableCustody(IMPLEMENTATION_ROOT)
  checkV138LiveV14EffectState(IMPLEMENTATION_ROOT, selector === "--check-post-run-custody" ? "post" : "pre")
  process.stdout.write(canonical({ status: selector === "--check-post-run-custody" ? "post_run_custody_checked" : "reviewed_live_ready",
    payloadRoot: admitted.payloadRoot, authorizesExecution: false, downstreamAuthority: "denied" }))
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  executeV138LiveV14Cli(process.argv.slice(2)).catch(() => {
    process.stderr.write("V138_LIVE_V14_CHECK_FAILED\n"); process.exitCode = 1
  })
}
