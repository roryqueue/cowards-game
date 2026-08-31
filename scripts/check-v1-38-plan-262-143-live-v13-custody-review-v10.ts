import { execFileSync, spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { builtinModules, createRequire } from "node:module"
import { chmodSync, closeSync, constants, cpSync, fstatSync, lstatSync, mkdirSync, mkdtempSync,
  openSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync, type BigIntStats } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
// Only the independently pinned, pre-existing descriptor mechanism is shared.
// No Plan142/140 implementation, inventory, validator, verdict or cache is imported.
import { readV138WorkspaceBatch } from "./lib/v1-38-secure-workspace-path-v6.js"

type Json = Record<string, any>
type Entry = { identity: string; mode: "100644" | "100755"; size: number; sha256: string }
type Material = { entry: Entry; origin?: string; destination: string; template?: string }
const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const SELF = "scripts/check-v1-38-plan-262-143-live-v13-custody-review-v10.ts"
const SUBJECT = "scripts/check-v1-38-plan-262-142-live-v13-custody-v10.ts"
const ARCHIVE_SOURCE = "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.ts"
const ARCHIVE = "222cecd6c8f633e1cec5ae916f95389f9a5f7876"
const FINAL142 = "61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3"
const SUMMARY142 = "53509033a03a7a6661cb519c76c70d437b6d86c3"
const TRACK142 = "7edcac4f5977ea8f006b1369536414c8006e64bd"
const CURRENT = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v14.ts"
const FINAL144 = "80936682ec7f1d63f2ea5dfdd87c99ccb97966b7"
const SUMMARY144 = "8bb3dbb8093f2a1a6cf3a5a9322c40cd9abe15f0"
const TRACK144 = "3018ae8b80ab585bedace6a922a42bc8fb4ae04a"
const CURRENT_REPOSITORY = "sha256:25d8387b7fc87923c584dc85f6bc4f4856f65e2a76086eb2a615e127229335a8"
const CURRENT_RUNTIME = "sha256:23c3e69706042753c77e40d1b8ecc42416e2b59e2eb063504ab4c41061a3ceae"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const EXPECTED_RUNTIME = "sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e"
const EXPECTED_REPOSITORY = "sha256:46147f2e102e791da37f2f3b91672a046eb275552f73ad2d99de92c0f9c4fd3d"
export const V138_PLAN143_PATHS = Object.freeze({
  payload: ".planning/artifacts/v1.38-plan-262-143-live-v13-custody-review-payload-v10.json",
  review: `${PHASE}/262-143-REVIEW-v10.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-143-live-v13-custody-review-carrier-v10.json",
  summary: `${PHASE}/262-143-SUMMARY.md`,
})
export const V138_PLAN143_EFFECTS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v3.json",
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
])
const C_IDENTITIES = [
  { path: "scripts/native/v1-38-successor-transaction-helper-v6.c", mode: "100644",
    blob: "ca694310a8a99c30d7a4070a415b968d3e341409", sha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a" },
  { path: "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c", mode: "100644",
    blob: "99da3517ccb8b919759663daf713b4f20337b8b1", sha256: "sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea" },
]
const FILE_PINS = [
  [FINAL142, SUBJECT, "cf839872092ffa1a135a8b0a5452122a5957b5a6", "902fd55d157cba70b4933499c45a8855fc1df6bd373748bd3d7853daf70f22c1"],
  [FINAL142, SUBJECT.replace(/\.ts$/, ".test.ts"), "7a70bace6ed5833f2613389743d46a314d3a91d3", "b7bbdcc45a23c49a095d654509cf53db849c8fd1fd997ccd2a0eccd0dcf546ea"],
  [SUMMARY142, `${PHASE}/262-142-SUMMARY.md`, "000561d3d12e2d406cb8bbb9065242121578c1c6", "4d41980186211917f0f39a3154582e6daa753bc5aa1cbc12ceb9610d27ae98fb"],
  ["a70a84dcae82c37d5d47a1977768aa662285f985", `${PHASE}/262-142-CODE-REVIEW-V2.md`, "79aebdd0fb48c0846c37f37ff834d47abc976442", "9be5e6d15d8d5da7260dad21b7d1a0aa02352630aeb9d583406f53f0ab031b15"],
  ["cc25cd4aff330352787b34834bb71ca43c21b57e", `${PHASE}/262-140-CODE-REVIEW.md`, "c12befbdaab99287af49db0bbc03fb739f64d223", "3cbc24aa6f025f704f8dfbc56ff26fc3b4f103911b7dc68b965810293905dba9"],
  [ARCHIVE, ARCHIVE_SOURCE, "28f8500db03bd81c2cbfe17c54f8cc2cf946e807", "3bd4e8f2e5d994a45fe6a15659442ffe2e7e5b611ecf9205665597ef11fa43dc"],
  [ARCHIVE, ARCHIVE_SOURCE.replace(/\.ts$/, ".test.ts"), "dcf81600b80a0c07d2145d3c5eac030dab45765c", "cfd5f3787184f2b6db033bf2de619b61ac6eeb03aa92f3b201738d8dba592b98"],
] as const
const CURRENT_PINS = [
  [FINAL144, CURRENT, "45bf7bd7cb381a3bf6b6899ddd2dab3562e45f40", "8cd920e6c6af34fb09a24d03246bed2ed5f0f658090de1f5a17ad6a166b63807"],
  [FINAL144, CURRENT.replace(/\.ts$/, ".test.ts"), "ee2585a5ea555bc8221c825db9a10990cd1b9cc3", "2d26e6636868f79a262722736b09fa039252bc0cd3fc246223681a220097820e"],
  [SUMMARY144, `${PHASE}/262-144-SUMMARY.md`, "b53f4da46ad0b184e9cfbb8900168ba74c01154a", "88b477558ef3179b2a23d80cc7ec291a60c96ccc0bfd50248f97676d479cffe3"],
  ["0ac4c15d02f77801e36612e31829c1359f2865fa", `${PHASE}/262-144-CODE-REVIEW-V3.md`, "8333f00eb581819c8a5164144cb4899433a3584c", "bf82ff25bc8cf5d71bde1fcd83986020a3573a0a6f508117e606f582ee9d5224"],
] as const
const COMMITS = [
  ["3187775e4f1388361da3a7d3fb8d1ae7d6baaa7a", "758257882810ac00d402d51622f044ac1cd3a993", "963888f77d09be75df07d7c08bfb4411ec19ff27"],
  ["4c0821792fd646c62675b5e375af75ccd2ededb1", "c0e726bb482dc9aad92c6843ef3087769607d284", "3187775e4f1388361da3a7d3fb8d1ae7d6baaa7a"],
  [FINAL142, "2a9c91f3d17884529fc5bf0d3a5233dbbb844c62", "87466749708bc90bb829848bae14d792b9dc26aa"],
  ["a70a84dcae82c37d5d47a1977768aa662285f985", "d71991c13f4d95e868a76f20d28fd2425f9728b2", FINAL142],
  [SUMMARY142, "f97fe579e6f4b0e6a183beec322747724047443a", "a70a84dcae82c37d5d47a1977768aa662285f985"],
  [TRACK142, "d578e914b59cc66fadbfcfa00e23a59d73fcdf50", SUMMARY142],
  ["cc25cd4aff330352787b34834bb71ca43c21b57e", "7960c729366972a84d05bebbc889a01e5cce387f", "0ccfbae478a42a424643c1faa9ffbf4a20867db0"],
] as const
const MECHANISM = [
  ["scripts/lib/v1-38-secure-workspace-path-v6.ts", "f8a2959c2db6a9a80147f6d1ece13d30d9fec457d90354e711be0a49319e5f49"],
  ["scripts/lib/v1-38-private-native-bootstrap-v2.ts", "165bdefcc02fd9448b3f5d778888617f90d16e7e0801bc091726574ecfcfae78"],
  ["scripts/native/v1-38-secure-manifest-reader-v6.c", "fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1"],
] as const
function fail(code: string): never { throw new TypeError(`V138_PLAN143_${code}`) }
const canonical = (value: unknown): string => {
  const ordered = (v: any): any => Array.isArray(v) ? v.map(ordered) : v && typeof v === "object"
    ? Object.fromEntries(Object.keys(v).sort((a,b) => a.localeCompare(b)).map((k) => [k, ordered(v[k])])) : v
  return JSON.stringify(ordered(value)) + "\n"
}
const digest = (data: string | Uint8Array): string => "sha256:" + createHash("sha256").update(data).digest("hex")
const hash = (domain: string, data: unknown): string => digest(domain + "\0" + canonical(data))
const H = (suffix: string, data: unknown): string => hash("v138-plan143-v10-" + suffix, data)
const omit = (v: Json, ...names: string[]): Json => Object.fromEntries(Object.entries(v).filter(([k]) => !names.includes(k)))
const same = (a: unknown, b: unknown, code: string): void => { if (canonical(a) !== canonical(b)) fail(code) }
const keys = (v: unknown, wanted: string[], code: string): Json => {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(code)
  same(Object.keys(v).sort(), [...wanted].sort(), code); return v as Json
}
const freeze = <T>(v: T): T => {
  if (v && typeof v === "object") { Object.values(v).forEach(freeze); Object.freeze(v) }
  return v
}
const stamp = (s: BigIntStats): string => [s.dev, s.ino, s.mode, s.nlink, s.uid, s.gid, s.size, s.mtimeNs, s.ctimeNs].join(":")
const regular = (file: string): { bytes: Buffer; mode: "100644" | "100755" } => {
  const original = lstatSync(file, { bigint: true })
  if (!original.isFile() || original.isSymbolicLink() || (original.mode & 0o444n) === 0n || original.size > 512n * 1024n * 1024n) fail("REGULAR_REQUIRED")
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    same(stamp(fstatSync(fd, { bigint: true })), stamp(original), "FILE_REPLACED")
    const bytes = readFileSync(fd)
    same(stamp(fstatSync(fd, { bigint: true })), stamp(original), "FILE_CHANGED")
    same(stamp(lstatSync(file, { bigint: true })), stamp(original), "FILE_REPLACED")
    return { bytes, mode: (original.mode & 0o111n) === 0n ? "100644" : "100755" }
  } finally { closeSync(fd) }
}
const rootIdentity = (input: string) => {
  const supplied = path.resolve(input); const s = lstatSync(supplied, { bigint: true })
  if (!s.isDirectory() || s.isSymbolicLink() || (s.mode & 0o555n) === 0n) fail("ROOT_INVALID")
  return { canonical: realpathSync(supplied), dev: String(s.dev), ino: String(s.ino) }
}
const mechanism = () => { for (const [p, sha] of MECHANISM) {
  const value = regular(path.join(ROOT, p)); if (value.mode !== "100644" || digest(value.bytes) !== "sha256:" + sha) fail("MECHANISM_CHANGED")
} }
// Independent explicit component checks plus the pinned descriptor batch prevent
// pathname ABA at the final lookup. This is a checked snapshot, not perpetual absence.
export const checkV138Plan143Absence = (input: string): true => {
  const identity = rootIdentity(input); mechanism()
  const stamps = new Map<string, string>()
  for (const relative of V138_PLAN143_EFFECTS) {
    const components = relative.split("/"); let current = identity.canonical
    for (let i = 0; i < components.length; i++) {
      current = path.join(current, components[i]!)
      try {
        const s = lstatSync(current, { bigint: true })
        if (i === components.length - 1 || s.isSymbolicLink() || !s.isDirectory() || (s.mode & 0o555n) === 0n) fail("EFFECT_COMPONENT_INVALID")
        const value = stamp(s)
        if (stamps.has(current) && stamps.get(current) !== value) fail("EFFECT_COMPONENT_CHANGED")
        stamps.set(current, value)
      } catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT" || i !== components.length - 1) throw e }
    }
  }
  const snapshot = readV138WorkspaceBatch(identity.canonical, [], V138_PLAN143_EFFECTS)
  if (snapshot.identity.device !== identity.dev || snapshot.identity.inode !== identity.ino) fail("ROOT_CHANGED")
  for (const [p, value] of stamps) same(stamp(lstatSync(p, { bigint: true })), value, "EFFECT_COMPONENT_CHANGED")
  same(rootIdentity(input), identity, "ROOT_CHANGED"); mechanism(); return true
}
const ENV = { PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: "/dev/null", LANG: "C", LC_ALL: "C",
  GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_OPTIONAL_LOCKS: "0", GIT_NO_REPLACE_OBJECTS: "1" }
const git = (root: string, args: readonly string[], input?: Buffer): Buffer => execFileSync("/usr/bin/git",
  ["-C", root, "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args],
  { env: ENV, input, maxBuffer: 128 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] })
const textGit = (root: string, args: readonly string[]): string => git(root, args).toString("utf8").trim()
const metadata = (root: string): string => {
  // Validate the routing/config files before invoking Git, which otherwise reads
  // include directives before a CLI override can constrain them.
  const gitdir = path.join(root, ".git"); const status = lstatSync(gitdir, { bigint: true })
  if (!status.isDirectory() || status.isSymbolicLink()) fail("METADATA_DIRECTORY")
  const initial = readV138WorkspaceBatch(root, [".git/config", ".git/HEAD"], [".git/info/grafts", ".git/shallow", ".git/objects/info/alternates"])
  const rawConfig = initial.bytes[".git/config"]!.toString()
  if (/\[\s*(?:include|includeIf|alias|protocol|url)\b|(?:hookspath|fsmonitor|attributesfile|sshcommand|worktreeconfig)\s*=/iu.test(rawConfig)) fail("METADATA_CONFIG")
  const common = realpathSync(textGit(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]))
  const local = realpathSync(textGit(root, ["rev-parse", "--absolute-git-dir"]))
  if (common !== gitdir || local !== gitdir) fail("METADATA_ROUTING")
  const dirs = [gitdir, path.join(gitdir, "objects"), path.join(gitdir, "refs")].map(p => {
    const s = lstatSync(p, { bigint: true }); if (!s.isDirectory() || s.isSymbolicLink()) fail("METADATA_DIRECTORY")
    return [p, String(s.dev), String(s.ino)]
  })
  for (const relative of ["info/grafts", "shallow", "objects/info/alternates"]) {
    try { lstatSync(path.join(common, relative)); fail("METADATA_REDIRECTION") }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e }
  }
  if (textGit(root, ["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "") fail("REPLACE_REF")
  const config = textGit(root, ["config", "--local", "--list"])
  if (/(?:^|\n)(?:include[^=]*|alias\.[^=]*|protocol\.[^=]*|url\..*\.insteadof|core\.(?:hookspath|fsmonitor|attributesfile|sshcommand))=/iu.test(config)) fail("METADATA_CONFIG")
  if (textGit(root, ["rev-parse", "--show-object-format"]) !== "sha1") fail("OBJECT_FORMAT")
  const optional = (p: string): string => { try { return digest(regular(p).bytes) } catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return "absent"; throw e } }
  const refs = tree(path.join(gitdir, "refs")).map(p => [p, digest(regular(path.join(gitdir, "refs", p)).bytes)])
  const final = readV138WorkspaceBatch(root, [".git/config", ".git/HEAD"], [".git/info/grafts", ".git/shallow", ".git/objects/info/alternates"])
  same(initial.identity, final.identity, "METADATA_CHANGED")
  for (const p of [".git/config", ".git/HEAD"]) same(digest(initial.bytes[p]!), digest(final.bytes[p]!), "METADATA_CHANGED")
  return canonical({ common, local, dirs, refs, head: textGit(root, ["rev-parse", "HEAD^{commit}"]), config,
    headBytes: optional(path.join(local, "HEAD")), configBytes: optional(path.join(common, "config")),
    packed: optional(path.join(common, "packed-refs")), objects: realpathSync(path.join(common, "objects")) })
}
export const inspectV138Plan143Metadata = (root: string): string => digest(metadata(rootIdentity(root).canonical))
type History = { root: string; head: string; supplied: string; before: string; verify: () => void; dispose: () => void }
const history = (input: string): History => {
  const identity = rootIdentity(input); const before = metadata(identity.canonical)
  const head = textGit(identity.canonical, ["rev-parse", "HEAD^{commit}"])
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan143-history-")); chmodSync(owner, 0o700)
  const bare = path.join(owner, "objects.git")
  try {
    git(identity.canonical, ["clone", "--quiet", "--bare", "--no-local", identity.canonical, bare])
    writeFileSync(path.join(bare, "config"), "[core]\nrepositoryformatversion = 0\nbare = true\n", { mode: 0o600 })
    writeFileSync(path.join(bare, "HEAD"), head + "\n", { mode: 0o600 })
    const verify = () => { same(rootIdentity(input), identity, "ROOT_CHANGED"); same(metadata(identity.canonical), before, "METADATA_CHANGED") }
    verify(); same(textGit(bare, ["rev-parse", "HEAD^{commit}"]), head, "SNAPSHOT_HEAD")
    return { root: bare, head, supplied: identity.canonical, before, verify,
      dispose: () => { try { verify() } finally { rmSync(owner, { recursive: true, force: true }) } } }
  } catch (e) { rmSync(owner, { recursive: true, force: true }); throw e }
}
const ancestor = (h: History, a: string, b = h.head, strict = false): void => {
  if (strict && a === b) fail("STRICT_DESCENDANT_REQUIRED")
  try { git(h.root, ["merge-base", "--is-ancestor", a, b]) } catch { fail("ANCESTRY_INVALID") }
}
const scope = (h: History, commit: string, expected: string[]): void => same(
  textGit(h.root, ["diff-tree", "--no-commit-id", "--name-status", "-r", commit]).split("\n").sort(), expected.sort(), "COMMIT_SCOPE")
const custody = (h: History) => {
  ancestor(h, TRACK142)
  for (const [commit, tree, parent] of COMMITS) {
    same(textGit(h.root, ["show", "-s", "--format=%T %P", commit]), `${tree} ${parent}`, "COMMIT_IDENTITY")
    ancestor(h, commit)
  }
  const files = FILE_PINS.map(([commit, p, blob, sha]) => {
    same(textGit(h.root, ["ls-tree", commit, "--", p]), `100644 blob ${blob}\t${p}`, "SUBJECT_BLOB")
    if (digest(git(h.root, ["cat-file", "blob", `${commit}:${p}`])) !== "sha256:" + sha) fail("SUBJECT_SHA")
    if (textGit(h.root, ["log", "--format=%H", `${commit}..${h.head}`, "--", p]) !== "") fail("SUBJECT_REWRITTEN")
    const current = regular(path.join(h.supplied, p))
    if (current.mode !== "100644" || digest(current.bytes) !== "sha256:" + sha) fail("SUBJECT_WORKTREE")
    return { commit, path: p, mode: "100644", blob, sha256: "sha256:" + sha }
  })
  scope(h, SUMMARY142, [`A\t${PHASE}/262-142-SUMMARY.md`]); scope(h, TRACK142, ["M\t.planning/ROADMAP.md", "M\t.planning/STATE.md"])
  for (const p of [".planning/ROADMAP.md", ".planning/STATE.md"]) {
    const value = git(h.root, ["show", `${TRACK142}:${p}`]).toString()
    if (!value.includes('"source_commit":"' + FINAL142 + '"') || !value.includes('"summary_commit":"' + SUMMARY142 + '"') || !value.includes('"plan143_eligible":true')) fail("TRACKING_INVALID")
  }
  const body = { sourceCommit: FINAL142, summaryCommit: SUMMARY142, trackingCommit: TRACK142, commits: COMMITS, files }
  h.verify(); return freeze({ ...body, subjectCustodyRoot: hash("v138-plan-262-143-subject-custody-v10", body), plan110Eligible: false })
}
export const inspectV138Plan143Source = (input: string) => { const h = history(input); try { return custody(h) } finally { h.dispose() } }

// Resolution begins at the actual executor/test and runtime launch requirements.
// The dependency walk follows Node resolution, not a copied inventory or pnpm folder guess.
const resolvePackage = (from: string, name: string): string | undefined => {
  const req = createRequire(path.join(from, "package.json")); let resolved: string
  try { resolved = req.resolve(name + "/package.json") }
  catch (error) {
    if (!["MODULE_NOT_FOUND", "ERR_PACKAGE_PATH_NOT_EXPORTED"].includes((error as NodeJS.ErrnoException).code ?? "")) fail("PACKAGE_RESOLUTION_ERROR")
    try { resolved = req.resolve(name) }
    catch (fallback) { if ((fallback as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") return undefined; fail("PACKAGE_RESOLUTION_ERROR") }
  }
  let cursor: string
  try { cursor = path.dirname(realpathSync(resolved)) } catch { fail("PACKAGE_RESOLUTION_ERROR") }
  while (cursor !== path.dirname(cursor)) {
    try { if (JSON.parse(regular(path.join(cursor, "package.json")).bytes.toString()).name === name) return cursor }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") fail("PACKAGE_RESOLUTION_ERROR") }
    cursor = path.dirname(cursor)
  }
  fail("PACKAGE_OWNER")
}
const tree = (base: string): string[] => {
  const found: string[] = []
  const visit = (relative: string) => {
    const absolute = path.join(base, relative); const before = lstatSync(absolute, { bigint: true })
    if (before.isSymbolicLink()) fail("RUNTIME_SYMLINK")
    if (before.isFile()) { regular(absolute); found.push(relative); return }
    if (!before.isDirectory() || (before.mode & 0o555n) === 0n) fail("RUNTIME_DIRECTORY")
    const names = readdirSync(absolute).sort()
    for (const name of names) if (relative !== "" || name !== "node_modules") visit(relative ? relative + "/" + name : name)
    same(readdirSync(absolute).sort(), names, "RUNTIME_TREE_CHANGED")
    same(stamp(lstatSync(absolute, { bigint: true })), stamp(before), "RUNTIME_TREE_CHANGED")
  }
  visit(""); return found
}
const launcherTemplate = (root: string): string => {
  // Decode a literal from SHA-pinned raw source; no evaluation/import/constructor.
  const raw = regular(path.join(root, SUBJECT)).bytes
  if (digest(raw) !== "sha256:" + FILE_PINS[0]![3]) fail("SUBJECT_WORKTREE")
  const match = /const PRIVATE_TSX_LAUNCHER_TEMPLATE = `((?:[^`\\]|\\[\s\S])*)`/u.exec(raw.toString())
  if (!match || match[1]!.includes("${")) fail("LAUNCHER_LITERAL")
  return match[1]!.replace(/\\(\\|n|r|t|`)/gu, (_, c: string) => ({ "\\": "\\", n: "\n", r: "\r", t: "\t", "`": "`" })[c]!)
}
type PackageGraph = { packages: Array<{ name: string; version: string; root: string }>;
  edges: Array<{ from: string; name: string; to: string | null }> }
const resolvedPackageGraph = (root: string): PackageGraph => {
  // Node keeps resolution caches even when createRequire is constructed again.
  // A fresh process is required to observe a newly introduced shadow package.
  // This child reads package metadata only; it never loads a package entry point.
  const reader = `const {createRequire}=require('node:module');
const {readFileSync,realpathSync,lstatSync}=require('node:fs');const path=require('node:path');
const root=process.argv[1];const packages=new Map(),edges=[],queue=[];
function regular(p){const s=lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||!(s.mode&292))throw Error('PACKAGE_MANIFEST');return readFileSync(p,'utf8')}
function resolve(from,name){const req=createRequire(path.join(from,'package.json'));let found;
try{found=req.resolve(name+'/package.json')}catch(e){if(!['MODULE_NOT_FOUND','ERR_PACKAGE_PATH_NOT_EXPORTED'].includes(e.code))throw Error('PACKAGE_RESOLUTION_ERROR');try{found=req.resolve(name)}catch(fallback){if(fallback.code==='MODULE_NOT_FOUND')return null;throw Error('PACKAGE_RESOLUTION_ERROR')}}
let at;try{at=path.dirname(realpathSync(found))}catch{throw Error('PACKAGE_RESOLUTION_ERROR')}
while(at!==path.dirname(at)){try{if(JSON.parse(regular(path.join(at,'package.json'))).name===name)return at}catch(e){if(e.code!=='ENOENT')throw Error('PACKAGE_RESOLUTION_ERROR')}at=path.dirname(at)}throw Error('PACKAGE_OWNER')}
function edge(from,name,required){const to=resolve(from,name);edges.push({from,name,to});if(to)queue.push(to);else if(required)throw Error('PACKAGE_MISSING')}
try{for(const name of ['typescript','tsx','vitest','@cowards/spec','@cowards/golden'])edge(root,name,true);
queue.push(realpathSync(path.join(root,'apps/runtime-service')));
while(queue.length){const at=realpathSync(queue.shift()),m=JSON.parse(regular(path.join(at,'package.json')));
if(typeof m.name!=='string'||typeof m.version!=='string')throw Error('PACKAGE_MANIFEST');
const prior=packages.get(m.name);if(prior){if(prior.version!==m.version)throw Error('PACKAGE_VERSION_COLLISION');if(prior.root!==at)throw Error('PACKAGE_ROOT_COLLISION');continue}
packages.set(m.name,{name:m.name,version:m.version,root:at});
for(const name of Object.keys({...m.dependencies,...m.optionalDependencies,...m.peerDependencies}).sort())edge(at,name,!!m.dependencies?.[name]&&!m.optionalDependencies?.[name])}
process.stdout.write(JSON.stringify({packages:[...packages.values()],edges}));
}catch(e){process.stdout.write(JSON.stringify({error:e.message}));process.exitCode=1}`
  const result = spawnSync(process.execPath, ["-e", reader, root], { env: ENV, encoding: "utf8", timeout: 30000,
    maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
  let graph: any
  try { graph = JSON.parse(result.stdout) } catch { fail("PACKAGE_GRAPH_FAILED") }
  if (result.status !== 0) {
    if (["PACKAGE_ROOT_COLLISION", "PACKAGE_VERSION_COLLISION", "PACKAGE_MISSING", "PACKAGE_MANIFEST", "PACKAGE_OWNER", "PACKAGE_RESOLUTION_ERROR"].includes(graph?.error)) fail(graph.error)
    fail("PACKAGE_GRAPH_FAILED")
  }
  keys(graph, ["packages", "edges"], "PACKAGE_GRAPH_SCHEMA")
  if (!Array.isArray(graph.packages) || !Array.isArray(graph.edges) || graph.packages.length > 512 || graph.edges.length > 8192) fail("PACKAGE_GRAPH_SCHEMA")
  return graph as PackageGraph
}
const runtimeCapture = (input: string) => {
  const root = rootIdentity(input).canonical
  if (process.env.ESBUILD_BINARY_PATH !== undefined) fail("NATIVE_OVERRIDE")
  const graph = resolvedPackageGraph(root)
  const seen = new Map<string, { version: string; root: string }>()
  for (const selected of graph.packages) {
    const directory = realpathSync(selected.root)
    const manifest = JSON.parse(regular(path.join(directory, "package.json")).bytes.toString()) as Json
    if (typeof manifest.name !== "string" || !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/iu.test(manifest.name) ||
      typeof manifest.version !== "string" || !/^[a-z0-9.+_-]+$/iu.test(manifest.version)) fail("PACKAGE_MANIFEST")
    const prior = seen.get(manifest.name)
    if (prior) {
      if (prior.version !== manifest.version) fail("PACKAGE_VERSION_COLLISION")
      if (prior.root !== directory) fail("PACKAGE_ROOT_COLLISION")
      continue
    }
    same(selected, { name: manifest.name, version: manifest.version, root: directory }, "PACKAGE_GRAPH_CHANGED")
    seen.set(manifest.name, { version: manifest.version, root: directory })
  }
  const esbuild = seen.get("esbuild") ?? fail("ESBUILD_MISSING")
  const nativeName = `@esbuild/${process.platform}-${process.arch}`
  const selected = createRequire(path.join(esbuild.root, "package.json")).resolve(nativeName + "/bin/esbuild")
  if (!seen.has(nativeName) || realpathSync(selected) !== realpathSync(path.join(seen.get(nativeName)!.root, "bin/esbuild"))) fail("NATIVE_SELECTION")
  const materials: Material[] = []
  const add = (identity: string, origin: string, destination: string) => {
    const { bytes, mode } = regular(origin); materials.push({ entry: { identity, mode, size: bytes.length, sha256: digest(bytes) }, origin, destination })
  }
  add("runtime/node/executable", realpathSync(process.execPath), ".runtime/bin/node")
  const pnpm = realpathSync(path.join(path.dirname(process.execPath), "pnpm")); const pnpmRoot = path.resolve(path.dirname(pnpm), "..")
  add("runtime/launcher/pnpm", pnpm, ".runtime/bin/pnpm")
  add("runtime/launcher/tsx", path.join(root, "node_modules/.bin/tsx"), ".runtime/original-tsx-launcher")
  const template = launcherTemplate(root)
  materials.push({ entry: { identity: "runtime/launcher/private-tsx", mode: "100755", size: Buffer.byteLength(template), sha256: digest(template) },
    destination: "node_modules/.bin/tsx", template })
  const trees: Array<{ root: string; files: string[] }> = []
  const collect = (directory: string, prefix: string, destination: string) => {
    const files = tree(directory); trees.push({ root: directory, files })
    for (const relative of files) add(prefix + "/" + relative, path.join(directory, relative), destination + "/" + relative)
  }
  const pnpmManifest = JSON.parse(regular(path.join(pnpmRoot, "package.json")).bytes.toString()) as Json
  collect(pnpmRoot, `runtime/distribution/${pnpmManifest.name}@${pnpmManifest.version}`, ".runtime")
  for (const [name, pkg] of seen) collect(pkg.root, `runtime/package/${name}@${pkg.version}`, `node_modules/${name}`)
  materials.sort((a, b) => a.entry.identity < b.entry.identity ? -1 : a.entry.identity > b.entry.identity ? 1 : 0)
  if (new Set(materials.map((f) => f.entry.identity)).size !== materials.length || new Set(materials.map((f) => f.destination)).size !== materials.length) fail("RUNTIME_DUPLICATE")
  const body = { nodeVersion: process.version, v8Version: process.versions.v8, modulesAbi: process.versions.modules,
    platform: process.platform, arch: process.arch, entries: materials.map((f) => f.entry) }
  const publicValue = freeze({ ...body, semanticRuntimeRoot: hash("v138-plan-262-142-semantic-runtime-v10", body) })
  if (publicValue.entries.length !== 3931 || publicValue.semanticRuntimeRoot !== EXPECTED_RUNTIME) fail("RUNTIME_PIN")
  const verify = () => {
    same(resolvedPackageGraph(root), graph, "PACKAGE_RESOLUTION_CHANGED")
    for (const f of materials) if (f.origin) {
      const value = regular(f.origin); if (value.mode !== f.entry.mode || value.bytes.length !== f.entry.size || digest(value.bytes) !== f.entry.sha256) fail("RUNTIME_CHANGED")
    }
    for (const t of trees) same(tree(t.root), t.files, "RUNTIME_TREE_CHANGED")
  }
  verify(); return { public: publicValue, materials, verify, graph }
}
export const inspectV138Plan143Runtime = (root: string) => runtimeCapture(root).public
export const retainV138Plan143RuntimeForReview = (root: string) => {
  const captured = runtimeCapture(root)
  return Object.freeze({ runtime: captured.public, recheck: () => captured.verify() })
}
const copyRuntime = (capture: ReturnType<typeof runtimeCapture>, destination: string) => {
  for (const f of capture.materials) {
    const file = path.join(destination, f.destination); mkdirSync(path.dirname(file), { recursive: true })
    const raw = f.template === undefined ? regular(f.origin!).bytes : Buffer.from(f.template)
    if (digest(raw) !== f.entry.sha256 || raw.length !== f.entry.size) fail("RUNTIME_CHANGED")
    const bytes = f.template === undefined ? raw : Buffer.from(f.template.replace("<PRIVATE_NODE>", path.join(destination, ".runtime/bin/node"))
      .replace("<PRIVATE_INVENTORY>", JSON.stringify(capture.materials.map(({ entry, destination: d }) => ({ entry, destination: d })))))
    writeFileSync(file, bytes, { flag: "wx", mode: f.entry.mode === "100755" ? 0o755 : 0o644 })
    same(digest(regular(file).bytes), digest(bytes), "RUNTIME_COPY")
  }
}

const repository = (h: History) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan143-archive-")); chmodSync(owner, 0o700)
  try {
    const listing = textGit(h.root, ["ls-tree", "-r", ARCHIVE]).split("\n")
    const parsed = listing.map((line) => {
      const m = /^(100644|100755) blob ([0-9a-f]{40})\t([^\n]+)$/u.exec(line)
      if (!m || path.posix.normalize(m[3]!) !== m[3] || m[3]!.startsWith("/") || m[3]!.split("/").includes("..")) fail("ARCHIVE_ENTRY")
      return { path: m[3]!, mode: m[1]!, blob: m[2]! }
    })
    execFileSync("/usr/bin/tar", ["-x", "-C", owner], { input: git(h.root, ["archive", "--format=tar", ARCHIVE]), env: ENV })
    const entries = parsed.map((p) => ({ ...p, sha256: digest(regular(path.join(owner, p.path)).bytes) })).sort((a, b) => a.path.localeCompare(b.path))
    for (const c of C_IDENTITIES) same(entries.find((e) => e.path === c.path), c, "NATIVE_TUPLE")
    const body = { executorCommit: ARCHIVE, entries }
    const result = freeze({ ...body, repositoryClosureRoot: hash("v138-plan-262-142-repository-closure-v10", body) })
    if (result.entries.length !== 4429 || result.repositoryClosureRoot !== EXPECTED_REPOSITORY) fail("ARCHIVE_PIN")
    return result
  } finally { rmSync(owner, { recursive: true, force: true }) }
}

// Current source discovery is separate from the immutable historical archive.
// Parse literal protected inputs, then traverse live import edges ourselves.
type FileEntry = { path: string; mode: string; blob: string; sha256: string }
const relativePath = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length < 1024 &&
  /^[A-Za-z0-9_.@/+\-\[\]()]+$/u.test(v) && !v.startsWith("/") && !v.split("/").some(p => !p || p === "." || p === "..")
const walkAst = (n: ts.Node, visit: (n: ts.Node) => void): void => { visit(n); ts.forEachChild(n, child => walkAst(child, visit)) }
const astOf = (file: string, text: string) => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
const secureFiles = (root: string, paths: readonly string[]): Record<string, Buffer> => {
  mechanism(); const binding = rootIdentity(root); const ancestors = new Map<string, string>(); const result: Record<string, Buffer> = {}
  for (let offset = 0; offset < paths.length; offset += 256) {
    const batch = readV138WorkspaceBatch(root, paths.slice(offset, offset + 256))
    same(batch.identity, { device: binding.dev, inode: binding.ino }, "ROOT_CHANGED")
    for (const [p, value] of Object.entries(batch.ancestorIdentities)) {
      if (ancestors.has(p)) same(ancestors.get(p), canonical(value), "ANCESTOR_CHANGED")
      ancestors.set(p, canonical(value))
    }
    Object.assign(result, batch.bytes)
  }
  same(rootIdentity(root), binding, "ROOT_CHANGED"); return result
}
const protectedInputPins = (root: string): readonly (readonly string[])[] => {
  const source = secureFiles(root, ["scripts/lib/v1-38-bounded-retry-envelope-v3.ts"])["scripts/lib/v1-38-bounded-retry-envelope-v3.ts"]!
  let found: string[][] | undefined
  walkAst(astOf("model.ts", source.toString()), n => {
    if (!ts.isPropertyAssignment(n) || n.name.getText() !== "protectedFiles" || !ts.isCallExpression(n.initializer)) return
    let a = n.initializer.arguments[0]; if (a && ts.isAsExpression(a)) a = a.expression
    if (!a || !ts.isArrayLiteralExpression(a)) fail("PROTECTED_INPUT_SCHEMA")
    found = a.elements.map(e => {
      if (!ts.isArrayLiteralExpression(e)) fail("PROTECTED_INPUT_SCHEMA")
      return e.elements.map(item => ts.isStringLiteral(item) ? item.text : fail("PROTECTED_INPUT_SCHEMA"))
    })
  })
  if (!found || found.length !== 17) fail("PROTECTED_INPUT_SCHEMA")
  return found
}
const dataInputs = [
  ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
  `${PHASE}/262-98-SUMMARY.md`, ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
  `${PHASE}/262-101-REVIEW.md`, "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl",
  ".planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts",
  ".planning/artifacts/v2.0-core-rules-audit/README.md", ".planning/artifacts/v1.38-historical-matrix-expectation.json",
]
export const inspectV138Plan143Imports = (source: string): readonly string[] => {
  const imports: string[] = []
  walkAst(astOf("input.ts", source), n => {
    if ((ts.isImportDeclaration(n) && !n.importClause?.isTypeOnly || ts.isExportDeclaration(n) && !n.isTypeOnly) &&
      n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) imports.push(n.moduleSpecifier.text)
    else if (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword ||
      ts.isIdentifier(n.expression) && n.expression.text === "require") && n.arguments.length === 1 && ts.isStringLiteral(n.arguments[0]!)) imports.push(n.arguments[0]!.text)
  })
  return imports
}
const discoverRepository = (root: string, source: string) => {
  const pinned = protectedInputPins(root)
  const pending: Array<{ p: string; execute: boolean }> = [source, source.replace(/\.ts$/, ".test.ts")].map(p => ({ p, execute: true }))
  for (const p of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json",
    ...C_IDENTITIES.map(n => n.path), "scripts/native/v1-38-secure-manifest-reader-v6.c", ...pinned.map(p => p[0]!), ...dataInputs]) pending.push({ p, execute: false })
  const files = new Map<string, FileEntry>(); const parsed = new Set<string>(); const edges = new Map<string, { from: string; to: string }>()
  const opts = { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, allowJs: true, resolveJsonModule: true }
  const resolver = ts.createModuleResolutionCache(root, p => p, opts)
  const historical = new Set(textGit(root, ["ls-tree", "-r", "--name-only", FINAL142]).split("\n"))
  for (let i = 0; i < pending.length; i++) {
    const { p, execute } = pending[i]!
    if (!relativePath(p)) fail("DEPENDENCY_PATH")
    if (files.has(p) && (!execute || parsed.has(p))) continue
    const current = regular(path.join(root, p)); const bytes = current.bytes
    const file = { path: p, mode: current.mode, blob: createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"), sha256: digest(bytes) }
    if (files.has(p)) same(files.get(p), file, "DEPENDENCY_CHANGED")
    files.set(p, file)
    if (!execute || !/\.[cm]?[jt]sx?$/u.test(p)) continue
    parsed.add(p)
    const add = (to: string, live: boolean) => { edges.set(p + "\0" + to, { from: p, to }); pending.push({ p: to, execute: live }) }
    for (const spec of inspectV138Plan143Imports(bytes.toString())) {
      if (spec.startsWith("node:") || builtinModules.includes(spec)) continue
      const resolved = ts.resolveModuleName(spec, path.join(root, p), opts, ts.sys, resolver).resolvedModule
      if (!resolved) fail("UNRESOLVED_IMPORT")
      if (!resolved.resolvedFileName.includes("/node_modules/")) add(path.relative(root, resolved.resolvedFileName).split(path.sep).join("/"), true)
    }
    walkAst(astOf(p, bytes.toString()), n => {
      if (!ts.isStringLiteral(n)) return
      if (/^scripts\/native\/[A-Za-z0-9_.-]+\.c$/u.test(n.text)) add(n.text, false)
      else if (/^\.\.?\/.*\.c$/u.test(n.text)) {
        const to = path.posix.normalize(path.posix.join(path.posix.dirname(p), n.text)); if (historical.has(to)) add(to, false)
      }
    })
  }
  const entries = [...files.values()].sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  const orderedEdges = [...edges.values()].sort((a,b) => a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : 0)
  const snapshot = secureFiles(root, entries.map(e => e.path))
  for (const e of entries) if (digest(snapshot[e.path]!) !== e.sha256) fail("DEPENDENCY_CHANGED")
  for (const [p, sha] of pinned) if (digest(snapshot[p!]!) !== sha) fail("PROTECTED_INPUT_CHANGED")
  const body = { files: entries, edges: orderedEdges }
  return freeze({ ...body, repositoryClosureRoot: H("repository-closure", body) })
}
const subjectAt = (h: History, commit: string, source: string, plan: string) => {
  ancestor(h, commit)
  const closure = discoverRepository(h.supplied, source)
  for (const e of closure.files) {
    if (textGit(h.root, ["ls-tree", commit, "--", e.path]) !== `${e.mode} blob ${e.blob}\t${e.path}`) fail("SUBJECT_CLOSURE_COMMIT")
  }
  const [tree, parent, ...others] = textGit(h.root, ["show", "-s", "--format=%T %P", commit]).split(" ")
  if (others.length || !parent) fail("SUBJECT_PARENT")
  const body = { plan, commit, tree, parent, files: closure.files, repositoryClosureRoot: closure.repositoryClosureRoot }
  return freeze({ ...body, subjectRoot: H("subject", body) })
}
const currentCustody = (h: History) => {
  custody(h); ancestor(h, TRACK144)
  for (const [commit, tree, parent] of [
    [FINAL144, "b375e61bca63af1043b0b597304e88a046c05cc5", "26601a5ec094f9524cacc4c89ad2ae3955ba3b89"],
    ["0ac4c15d02f77801e36612e31829c1359f2865fa", "2d9a023d4a058c0fb30408a60f0b6a4ed3952204", FINAL144],
    [TRACK144, "6d2f76ec2dfd1f61a88b8b1a466c54833c04a6f8", SUMMARY144],
  ]) {
    same(textGit(h.root, ["show", "-s", "--format=%T %P", commit!]), `${tree} ${parent}`, "CURRENT_COMMIT")
    ancestor(h, commit!)
  }
  const pinBytes = secureFiles(h.supplied, CURRENT_PINS.map(p => p[1]))
  for (const [commit, p, blob, sha] of CURRENT_PINS) {
    same(textGit(h.root, ["ls-tree", commit, "--", p]), `100644 blob ${blob}\t${p}`, "CURRENT_BLOB")
    if (digest(git(h.root, ["show", `${commit}:${p}`])) !== "sha256:" + sha ||
      digest(pinBytes[p]!) !== "sha256:" + sha) fail("CURRENT_BYTES")
    if (textGit(h.root, ["log", "--format=%H", `${commit}..${h.head}`, "--", p])) fail("CURRENT_REWRITE")
  }
  scope(h, SUMMARY144, [`A\t${PHASE}/262-144-SUMMARY.md`])
  scope(h, TRACK144, ["M\t.planning/ROADMAP.md", "M\t.planning/STATE.md"])
  if (textGit(h.root, ["rev-parse", `${SUMMARY144}^`]) !== CURRENT_PINS[3][0]) fail("CURRENT_SUMMARY_PARENT")
  for (const p of [".planning/ROADMAP.md", ".planning/STATE.md"]) {
    const doc = git(h.root, ["show", `${TRACK144}:${p}`]).toString()
    for (const ref of [FINAL144, SUMMARY144]) if (!doc.includes(ref)) fail("CURRENT_TRACKING")
  }
  const consumerSubject = subjectAt(h, FINAL144, CURRENT, "262-144")
  if (consumerSubject.repositoryClosureRoot !== CURRENT_REPOSITORY) fail("CURRENT_CLOSURE")
  h.verify(); return consumerSubject
}
export const inspectV138Plan143CurrentSource = (root: string) => {
  const h = history(root)
  try { return freeze({ consumerSubject: currentCustody(h), historical142: historicalValues(), plan110Eligible: false }) }
  finally { h.verify(); h.dispose() }
}

export const inspectV138Plan143ProducerBoundary = (source: string) => {
  const syntax = astOf(CURRENT, source); const names: ts.Identifier[] = []; const imports: ts.ImportSpecifier[] = []; const calls: ts.CallExpression[] = []
  walkAst(syntax, n => {
    if (ts.isIdentifier(n) && n.text === "runV138V3ProductionLive") names.push(n)
    if (ts.isImportSpecifier(n) && n.name.text === "runV138V3ProductionLive") imports.push(n)
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "runV138V3ProductionLive") calls.push(n)
  })
  if (names.length !== 2 || imports.length !== 1 || calls.length !== 1 || imports[0]!.propertyName) fail("PRODUCER_BOUNDARY")
  const declaration = imports[0]!.parent.parent.parent
  if (!ts.isImportDeclaration(declaration) || !ts.isStringLiteral(declaration.moduleSpecifier) ||
    declaration.moduleSpecifier.text !== "./run-v1-38-bounded-retry-envelope-v3.js") fail("PRODUCER_IMPORT")
  let parent: ts.Node = calls[0]!
  while (parent.parent && !ts.isTryStatement(parent)) parent = parent.parent
  if (!ts.isTryStatement(parent) || !parent.finallyBlock || !parent.finallyBlock.getText(syntax).includes("authenticateV138LiveV14ImmutableCustody(root)")) fail("PRODUCER_FINALLY")
  // This literal is the frozen transform protocol, not executable subject logic.
  const guard = '\nconst guardedProducerMustNotRun = async (..._args: unknown[]) => { const p = new URL("../.producer-guard", import.meta.url); const n = Number(readFileSync(p,"utf8")); writeFileSync(p,String(n+1)); throw new Error("V138_LIVE_V14_PRODUCER_GUARD_TRIPPED") }\n'
  const prefix = source.substring(0, imports[0]!.getStart(syntax)).replace(/,\s*$/u, " ")
  const transformed = prefix + source.substring(imports[0]!.getEnd(), calls[0]!.expression.getStart(syntax)) +
    "guardedProducerMustNotRun" + source.substring(calls[0]!.expression.getEnd()) + guard
  const body = { originalSourceSha256: digest(source), producerImport: declaration.moduleSpecifier.text,
    producerCall: "runV138V3ProductionLive", transformedSourceSha256: digest(transformed) }
  return freeze({ ...body, guardTransformRoot: H("guard-transform", body), transformed })
}

const MODES = [
  ["--check-source-only", "source_only_checked"], ["--check-prospective-custody", "prospective_custody_checked"],
  ["--check-post-run-custody", "post_run_no_effect_custody_checked"], ["--check-non-pass-value", "bounded_non_pass_value_checked"],
  ["--check-bounded-success-value", "bounded_success_value_checked"], ["--check-exact-reproduction-v17-value", "exact_reproduction_v17_value_checked"],
]
const ZERO = { downstreamAuthority: "denied", freshAccepted: 0, freshCharged: 0, liveInvoked: false, producerCalls: 0, readinessInvoked: false }
const REDUCED = [ZERO, ZERO, ZERO, { classification: "non_pass", reproductionEligible: false },
  { classification: "bounded_success", reproductionEligible: true }, { acceptedCells: 540, exact: true, requiredAccepted: 540 }]
const CURRENT_MODES = ["source-only", "prospective-custody", "post-no-effect", "non-pass-value", "bounded-success-value", "exact-reproduction-v17-value"]
const COUNTERS = { producerCalls: 0, readinessCalls: 0, liveCalls: 0, freshCharged: 0, freshAccepted: 0 }
const DISPOSITIONS = [
  ["v3", "262-122", "process_invalid_false_clean_custody"],
  ["v4", "262-131", "process_invalid_descendant_and_observation_validation"],
  ["v5", "262-133", "process_invalid_authority_carrier_validation"],
  ["v6", "262-134", "process_invalid_cross_root_cache_and_absolute_path_evidence"],
  ["v7", "262-136", "process_invalid_genuine_to_stable_native_mapping"],
  ["v8", "262-138", "process_invalid_unauthenticated_executor_metadata_and_effect_gate"],
  ["v9", "262-140", "process_invalid_incomplete_runtime_cross_root_laundering_and_ancestor_symlink_gate"],
].map(([version, plan, disposition]) => ({ version, plan, disposition, eligible: false }))
const historicalValues = () => {
  const records = MODES.map(([mode], ordinal) => {
    const body = { repositoryClosureRoot: EXPECTED_REPOSITORY, semanticRuntimeRoot: EXPECTED_RUNTIME,
      nativeIdentities: C_IDENTITIES, mode, ordinal, reducedValue: REDUCED[ordinal], producerGuardCount: 0 }
    return { ...body, stableRecordRoot: hash("v138-plan-262-142-stable-execution-record-v10", body) }
  })
  return { sourceCommit: FINAL142, summaryCommit: SUMMARY142, trackingCommit: TRACK142,
    sourceRoot: "sha256:" + FILE_PINS[0][3], semanticRuntimeClosureRoot: EXPECTED_RUNTIME, repositoryClosureRoot: EXPECTED_REPOSITORY,
    observationsRoot: hash("v138-plan-262-142-stable-observations-v10", records), plan110Eligible: false }
}
const shaLike = (s: unknown): boolean => typeof s === "string" && /^sha256:[a-f0-9]{64}$/u.test(s)
const jsonSafe = (value: unknown, active = new Set<object>(), depth = 0): void => {
  if (depth > 32) fail("JSON_DEPTH")
  if (value === null || typeof value === "boolean" || typeof value === "string" || typeof value === "number" && Number.isFinite(value)) return
  if (!value || typeof value !== "object" || active.has(value) || Object.getOwnPropertySymbols(value).length) fail("JSON_ONLY")
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail("JSON_ONLY")
  active.add(value)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (const [name, d] of Object.entries(descriptors)) {
    if (Array.isArray(value) && name === "length") continue
    if (!d.enumerable || !Object.hasOwn(d, "value") || Array.isArray(value) && !/^(0|[1-9][0-9]*)$/u.test(name)) fail("JSON_ONLY")
    jsonSafe(d.value, active, depth + 1)
  }
  if (Array.isArray(value) && Object.keys(value).length !== value.length) fail("JSON_ONLY")
  active.delete(value)
}
const boundedArray = (v: unknown, min: number, max: number): any[] => {
  if (!Array.isArray(v) || v.length < min || v.length > max) fail("ARRAY_BOUNDS")
  return v
}
const checkSubjectValue = (v: unknown, current: boolean) => {
  const s = keys(v, ["plan", "commit", "tree", "parent", "files", "repositoryClosureRoot", "subjectRoot"], "SUBJECT_SCHEMA")
  const source = current ? CURRENT : SELF
  if (s.plan !== (current ? "262-144" : "262-143") || ![s.commit, s.tree, s.parent].every(x => typeof x === "string" && /^[0-9a-f]{40}$/u.test(x)) ||
    !shaLike(s.repositoryClosureRoot)) fail("SUBJECT_IDENTITY")
  const files = boundedArray(s.files, 2, 20000)
  for (const [i, input] of files.entries()) {
    const f = keys(input, ["path", "mode", "blob", "sha256"], "FILE_SCHEMA")
    if (!relativePath(f.path) || !["100644", "100755"].includes(f.mode) || !/^[0-9a-f]{40}$/u.test(f.blob) || !shaLike(f.sha256) ||
      i > 0 && files[i - 1].path >= f.path) fail("FILE_IDENTITY")
  }
  if (![source, source.replace(/\.ts$/, ".test.ts")].every(p => files.some(f => f.path === p))) fail("SUBJECT_PAIR")
  if (current) {
    same([s.commit, s.tree, s.parent, s.repositoryClosureRoot], [FINAL144, "b375e61bca63af1043b0b597304e88a046c05cc5", "26601a5ec094f9524cacc4c89ad2ae3955ba3b89", CURRENT_REPOSITORY], "CURRENT_SUBJECT")
    for (const [, p, blob, sha] of CURRENT_PINS.slice(0, 2)) same(files.find(f => f.path === p), { path: p, mode: "100644", blob, sha256: "sha256:" + sha }, "CURRENT_FILE_PIN")
  }
  same(s.subjectRoot, H("subject", omit(s, "subjectRoot")), "SUBJECT_FORMULA"); return s
}
export const renderV138Plan143Review = (p: Json): string => [
  "# Plan 262-143 live-v14 custody review v10", "", `Payload: ${V138_PLAN143_PATHS.payload}`,
  `Payload SHA-256: ${digest(canonical(p))}`, `Payload root: ${p.payloadRoot}`,
  `Consumer subject: ${p.consumerSubject.subjectRoot}`, `Reviewer subject: ${p.reviewerSubject.subjectRoot}`,
  "Findings: 0", "Privacy findings: 0", "Authorizes execution: false", "Downstream authority: denied", "",
  "Limitations: private single-operator snapshot; no continuing absence or hostile-same-UID isolation.", "",
].join("\n")

/** Pure strict contract check: it authenticates no object, root, or publication. */
export const validateV138Plan143PublishedContract = (input: unknown): true => {
  jsonSafe(input)
  const all = keys(input, ["payload", "review", "carrier"], "TRIO_SCHEMA")
  const p = keys(all.payload, ["schemaVersion", "consumerVersion", "consumerPlan", "consumerSubject", "reviewerSubject", "historical142",
    "historicalDispositions", "canonicalCustody", "currentExecution", "reproductionProof", "findings", "findingCount", "privacyFindingCount",
    "plan110Eligible", "authorizesExecution", "downstreamAuthority", "counters", "requiredAccepted", "payloadRoot"], "PAYLOAD_SCHEMA")
  const c = keys(all.carrier, ["schemaVersion", "consumerVersion", "consumerPlan", "payloadPath", "payloadSha256", "payloadRoot", "reviewPath", "reviewSha256",
    "consumerSubjectRoot", "reviewerSubjectRoot", "semanticRuntimeClosureRoot", "currentObservationsRoot", "findingCount", "privacyFindingCount",
    "plan110Eligible", "authorizesExecution", "downstreamAuthority", "counters", "requiredAccepted", "carrierRoot"], "CARRIER_SCHEMA")
  for (const [v, schema] of [[p, "payload"], [c, "carrier"]] as const) {
    same(v.schemaVersion, `v1.38-plan-262-143-live-v14-custody-review-${schema}-v10`, "SCHEMA_VERSION")
    for (const [name, expected] of Object.entries({ consumerVersion: "live-v14", consumerPlan: "262-144", findingCount: 0,
      privacyFindingCount: 0, plan110Eligible: true, authorizesExecution: false, downstreamAuthority: "denied", counters: COUNTERS, requiredAccepted: 540 })) same(v[name], expected, "FALSE_AUTHORITY")
  }
  same(p.findings, [], "LITERAL_FINDINGS"); same(p.historical142, historicalValues(), "HISTORICAL142")
  same(p.historicalDispositions, DISPOSITIONS, "HISTORICAL_DISPOSITIONS")
  const consumer = checkSubjectValue(p.consumerSubject, true), reviewer = checkSubjectValue(p.reviewerSubject, false)
  const k = keys(p.canonicalCustody, ["repositoryClosureRoot", "semanticRuntimeInventory", "semanticRuntimeClosureRoot", "nativeIdentities", "nativeIdentityRoot",
    "canonicalLocalExecutionClosureRoot", "metadataPredicate", "provenancePredicate"], "CUSTODY_SCHEMA")
  const inventory = boundedArray(k.semanticRuntimeInventory, 3931, 3931)
  for (const [i, item] of inventory.entries()) {
    const e = keys(item, ["identity", "mode", "size", "sha256"], "RUNTIME_SCHEMA")
    if (!relativePath(e.identity) || !e.identity.startsWith("runtime/") || !["100644", "100755"].includes(e.mode) ||
      !Number.isSafeInteger(e.size) || e.size < 0 || !shaLike(e.sha256) || i > 0 && inventory[i - 1].identity >= e.identity) fail("RUNTIME_ENTRY")
  }
  same(k.semanticRuntimeClosureRoot, CURRENT_RUNTIME, "RUNTIME_PIN")
  same(k.semanticRuntimeClosureRoot, H("runtime-closure", inventory), "RUNTIME_FORMULA")
  same(k.repositoryClosureRoot, consumer.repositoryClosureRoot, "CUSTODY_SUBJECT")
  same(k.nativeIdentities, C_IDENTITIES, "NATIVE_IDENTITY"); same(k.nativeIdentityRoot, H("native-identities", C_IDENTITIES), "NATIVE_ROOT")
  same([k.metadataPredicate, k.provenancePredicate], ["private_bound_bare_snapshot_v1", "fresh_root_bound_private_transcript_v1"], "CUSTODY_PREDICATES")
  same(k.canonicalLocalExecutionClosureRoot, H("canonical-custody", omit(k, "canonicalLocalExecutionClosureRoot")), "CUSTODY_FORMULA")
  const e = keys(p.currentExecution, ["subjectRoot", "observations", "actualModesPassed", "observationsRoot", "guardTransformRoot", "producerGuardCount"], "EXECUTION_SCHEMA")
  same([e.subjectRoot, e.actualModesPassed, e.producerGuardCount], [consumer.subjectRoot, 6, 0], "EXECUTION_VALUES")
  same(e.guardTransformRoot, "sha256:b95b2684fbb275039a6325a3c816af05d91bd0c7f24ae557f7d0eac71338ffcd", "GUARD_ROOT")
  for (const [i, record] of boundedArray(e.observations, 6, 6).entries()) {
    const r = keys(record, ["subjectRoot", "mode", "ordinal", "status", "reducedValue", "repositoryClosureRoot", "semanticRuntimeClosureRoot", "nativeIdentityRoot", "executionRoot", "observationRoot"], "OBSERVATION_SCHEMA")
    same(omit(r, "executionRoot", "observationRoot"), { subjectRoot: consumer.subjectRoot, mode: CURRENT_MODES[i], ordinal: i, status: MODES[i]![1], reducedValue: REDUCED[i],
      repositoryClosureRoot: k.repositoryClosureRoot, semanticRuntimeClosureRoot: k.semanticRuntimeClosureRoot, nativeIdentityRoot: k.nativeIdentityRoot }, "OBSERVATION_SEMANTICS")
    same(r.executionRoot, H("execution", omit(r, "executionRoot", "observationRoot")), "EXECUTION_FORMULA")
    same(r.observationRoot, H("observation", omit(r, "observationRoot")), "OBSERVATION_FORMULA")
  }
  same(e.observationsRoot, H("observations", e.observations), "OBSERVATIONS_FORMULA")
  same(p.reproductionProof, { processCount: 2, rootCount: 2, normalizedEvidenceRoots: [H("reproduction", e), H("reproduction", e)], equal: true }, "PROCESS_REPRODUCTION")
  same(p.payloadRoot, H("payload", omit(p, "payloadRoot")), "PAYLOAD_ROOT")
  same(all.review, renderV138Plan143Review(p), "REVIEW_BYTES")
  for (const [name, expected] of Object.entries({ payloadPath: V138_PLAN143_PATHS.payload, payloadSha256: digest(canonical(p)), payloadRoot: p.payloadRoot,
    reviewPath: V138_PLAN143_PATHS.review, reviewSha256: digest(all.review), consumerSubjectRoot: consumer.subjectRoot, reviewerSubjectRoot: reviewer.subjectRoot,
    semanticRuntimeClosureRoot: k.semanticRuntimeClosureRoot, currentObservationsRoot: e.observationsRoot })) same(c[name], expected, "CARRIER_LINK")
  same(c.carrierRoot, H("carrier", omit(c, "carrierRoot")), "CARRIER_ROOT"); privacy(all); return true
}
export const validateV138Plan143EffectValues = (input: unknown): true => {
  jsonSafe(input)
  const v = keys(input, ["stage", "journalPresent", "privateDirectoryPresent", "terminalPresent", "lockPresent", "reproductionPresent", "downstreamPresent", "outcome"], "STAGE_SCHEMA")
  if (!["pre", "post"].includes(v.stage)) fail("STAGE")
  const names = ["journalPresent", "privateDirectoryPresent", "terminalPresent", "lockPresent", "reproductionPresent"]
  if (names.some(k => typeof v[k] !== "boolean")) fail("EFFECT_TYPE")
  same(v.downstreamPresent, Array(6).fill(false), "DOWNSTREAM_EFFECT")
  if (v.lockPresent || v.stage === "pre" && names.some(k => v[k])) fail("STAGE_EFFECT")
  if (!names.some(k => v[k])) { same(v.outcome, null, "NO_EFFECT_OUTCOME"); return true }
  const o = keys(v.outcome, ["disposition", "journalRoot", "stateRoot", "completeCleanup", "reproductionPresent", "downstreamAuthority"], "OUTCOME_SCHEMA")
  if (!v.journalPresent || !v.privateDirectoryPresent || !v.terminalPresent || !["succeeded", "terminal_failure", "exhausted"].includes(o.disposition) ||
    !shaLike(o.journalRoot) || !shaLike(o.stateRoot) || o.completeCleanup !== true || o.downstreamAuthority !== "denied" ||
    o.reproductionPresent !== v.reproductionPresent || v.reproductionPresent !== (o.disposition === "succeeded")) fail("POST_BRANCH")
  return true
}
export const validateV138Plan143Execution = (input: unknown, repositoryClosureRoot: string, semanticRuntimeRoot: string) => {
  if (!shaLike(repositoryClosureRoot) || !shaLike(semanticRuntimeRoot)) fail("MAPPING_ROOT")
  const value = keys(input, ["actualModesPassed", "authorizesExecution", "canonicalAfter", "canonicalBefore", "downstreamAuthority", "findings",
    "freshAccepted", "freshCharged", "liveInvoked", "observations", "observationsRoot", "producerCalls", "readinessInvoked"], "EXECUTION_SCHEMA")
  for (const [k, v] of Object.entries({ ...ZERO, actualModesPassed: 6, authorizesExecution: false, findings: [] })) same(value[k], v, "EXECUTION_SEMANTICS")
  same(value.canonicalBefore, value.canonicalAfter, "CANONICAL_DRIFT")
  const custodyFields = ["reviewedClosureRoot", "localInstalledClosureRoot", "localGitObjectRoot", "localNativeSourcesRoot", "localExecutionClosureRoot"]
  const canonicalCustody = keys(value.canonicalBefore, custodyFields, "CANONICAL_SCHEMA")
  if (custodyFields.some((k) => !shaLike(canonicalCustody[k]))) fail("CANONICAL_ROOT")
  const { localExecutionClosureRoot, ...canonicalBody } = canonicalCustody
  same(localExecutionClosureRoot, hash("v138-retry-v3-path-stable-local-execution-closure-v1", canonicalBody), "CANONICAL_FORMULA")
  if (!Array.isArray(value.observations) || value.observations.length !== 6) fail("SIX_MODES_REQUIRED")
  same(value.observationsRoot, hash("v138-plan-262-133-observations-v5", value.observations), "OBSERVATION_AGGREGATE")
  const records = value.observations.map((inputRecord: unknown, ordinal: number) => {
    const r = keys(inputRecord, ["disposableLocalExecutionClosureRoot", "disposableLocalGitObjectRoot", "disposableLocalInstalledClosureRoot",
      "disposableLocalNativeSourcePaths", "disposableLocalNativeSourcesRoot", "disposableReviewedClosureRoot", "mode", "observationRoot",
      "producerGuardCount", "reducedValue", "status"], "OBSERVATION_SCHEMA")
    same([r.mode, r.status], MODES[ordinal], "MODE_ORDINAL"); same(r.reducedValue, REDUCED[ordinal], "REDUCED_SEMANTICS")
    same(r.producerGuardCount, 0, "PRODUCER_GUARD")
    const { observationRoot, ...body } = r
    same(observationRoot, hash("v138-plan-262-133-mode-observation-v5", body), "OBSERVATION_FORMULA")
    if (!Array.isArray(r.disposableLocalNativeSourcePaths) || r.disposableLocalNativeSourcePaths.length !== 2) fail("NATIVE_COUNT")
    let prefix = ""
    for (let index = 0; index < 2; index++) {
      const p = r.disposableLocalNativeSourcePaths[index]; const suffix = C_IDENTITIES[index]!.path
      if (typeof p !== "string" || !path.isAbsolute(p) || path.normalize(p) !== p || !p.endsWith("/" + suffix)) fail("NATIVE_PATH")
      const base = p.slice(0, -suffix.length)
      if (!base.endsWith("/repo/") || !base.includes(`/v138-plan133-mode-${ordinal}-`) || (index && base !== prefix)) fail("NATIVE_ORDINAL")
      prefix = base
    }
    same(r.disposableLocalNativeSourcesRoot, digest(canonical(r.disposableLocalNativeSourcePaths.map((p: string, i: number) => [p, C_IDENTITIES[i]!.sha256]))), "NATIVE_FORMULA")
    const executionBody = { reviewedClosureRoot: r.disposableReviewedClosureRoot, localInstalledClosureRoot: r.disposableLocalInstalledClosureRoot,
      localGitObjectRoot: r.disposableLocalGitObjectRoot, localNativeSourcesRoot: r.disposableLocalNativeSourcesRoot }
    for (const k of ["reviewedClosureRoot", "localInstalledClosureRoot", "localGitObjectRoot"]) same(executionBody[k as keyof typeof executionBody], canonicalCustody[k], "GENUINE_CUSTODY")
    same(r.disposableLocalExecutionClosureRoot, hash("v138-retry-v3-path-stable-local-execution-closure-v1", executionBody), "EXECUTION_FORMULA")
    const stable = { repositoryClosureRoot, semanticRuntimeRoot, nativeIdentities: C_IDENTITIES, mode: r.mode, ordinal,
      reducedValue: structuredClone(r.reducedValue), producerGuardCount: 0 }
    return { ...stable, stableRecordRoot: hash("v138-plan-262-143-stable-execution-record-v10", stable) }
  })
  return freeze({ records, observationsRoot: hash("v138-plan-262-143-stable-observations-v10", records), plan110Eligible: false })
}
const executeArchive = (h: History, runtime: ReturnType<typeof runtimeCapture>): unknown => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan143-execution-")); chmodSync(owner, 0o700)
  const checkout = path.join(owner, "repo")
  try {
    git(h.root, ["clone", "--quiet", "--no-local", h.root, checkout]); git(checkout, ["checkout", "--quiet", "--detach", ARCHIVE])
    copyRuntime(runtime, checkout)
    const runner = path.join(checkout, "scripts/.plan143-runner.ts")
    writeFileSync(runner, `import { executeV138Plan133DisposableObservationsForReview as measured } from ${JSON.stringify(pathToFileURL(path.join(checkout, ARCHIVE_SOURCE)).href)}; process.stdout.write(JSON.stringify(measured(${JSON.stringify(checkout)})));`, { mode: 0o600, flag: "wx" })
    const node = path.join(checkout, ".runtime/bin/node")
    const result = spawnSync(node, [path.join(checkout, "node_modules/.bin/tsx"), runner], { cwd: checkout,
      env: { PATH: `${path.dirname(node)}:/usr/bin:/bin`, HOME: owner, LANG: "C", LC_ALL: "C" },
      encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 420_000, stdio: ["ignore", "pipe", "pipe"] })
    if (result.status !== 0) fail("MEASURED_EXECUTOR_FAILED")
    runtime.verify(); h.verify(); checkV138Plan143Absence(h.supplied)
    for (const f of runtime.materials) {
      const copy = regular(path.join(checkout, f.destination)); let bytes = copy.bytes
      if (f.template) bytes = Buffer.from(bytes.toString().replace(/^#![^\n]+/u, "#!<PRIVATE_NODE>")
        .replace(/const INVENTORY = [^\n]*;\nconst BASE/u, "const INVENTORY = <PRIVATE_INVENTORY>;\nconst BASE"))
      if (copy.mode !== f.entry.mode || digest(bytes) !== f.entry.sha256 || bytes.length !== f.entry.size) fail("PRIVATE_RUNTIME_CHANGED")
    }
    return JSON.parse(result.stdout)
  } finally { rmSync(owner, { recursive: true, force: true }) }
}

type Provenance = { root: ReturnType<typeof rootIdentity>; head: string; metadata: string; runtime: string; digest: string; nonce: string }
const provenance = new WeakMap<object, Provenance>()
const reviewerSubject = (h: History) => {
  const commit = textGit(h.root, ["log", "-1", "--format=%H", h.head, "--", SELF, SELF.replace(/\.ts$/, ".test.ts")])
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("REVIEWER_UNCOMMITTED")
  ancestor(h, TRACK144, commit, true)
  const subject = subjectAt(h, commit, SELF, "262-143")
  const actual = secureFiles(ROOT, subject.files.map(e => e.path))
  for (const e of subject.files) if (digest(actual[e.path]!) !== e.sha256) fail("EXECUTING_REVIEWER_CHANGED")
  return subject
}
type PrivateFile = { path: string; mode: string; sha256: string }
const privateRuntime = (captured: ReturnType<typeof runtimeCapture>, root: string): { inventory: PrivateFile[]; graph: PackageGraph } => {
  const inventory: PrivateFile[] = []
  for (const f of captured.materials) {
    const id = f.entry.identity
    const destination = id === "runtime/node/executable" ? ".runtime-node/node" : id === "runtime/launcher/pnpm" ? ".runtime-launchers/pnpm" :
      id === "runtime/launcher/tsx" ? "node_modules/.bin/tsx" : id === "runtime/launcher/private-tsx" ? ".runtime-launchers/private-tsx-template" :
      id.startsWith("runtime/distribution/") ? ".runtime-pnpm/" + f.destination.slice(".runtime/".length) : f.destination
    const bytes = f.template === undefined ? regular(f.origin!).bytes : Buffer.from(f.template)
    if (digest(bytes) !== f.entry.sha256 || bytes.length !== f.entry.size) fail("RUNTIME_MATERIAL")
    const target = path.join(root, destination); mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, bytes, { flag: "wx", mode: f.entry.mode === "100755" ? 0o755 : 0o644 })
    inventory.push({ path: destination, mode: f.entry.mode, sha256: f.entry.sha256 })
  }
  const launcher = inventory.find(e => e.path === ".runtime-launchers/pnpm")!
  const distribution = inventory.filter(e => e.path.startsWith(".runtime-pnpm/") && e.sha256 === launcher.sha256)
  if (distribution.length !== 1) fail("PNPM_RESOLUTION")
  symlinkSync("../" + distribution[0]!.path, path.join(root, ".runtime-node/pnpm"))
  const originalRoot = captured.graph.edges[0]!.from
  const mapped = new Map<string, string>([[originalRoot, root]])
  for (const p of captured.graph.packages) mapped.set(p.root, p.root === path.join(originalRoot, "apps/runtime-service")
    ? path.join(root, "apps/runtime-service") : path.join(root, "node_modules", p.name))
  const translate = (p: string): string => mapped.get(p) ?? fail("PRIVATE_PACKAGE_MAPPING")
  const graph = { packages: captured.graph.packages.map(p => ({ ...p, root: translate(p.root) })),
    edges: captured.graph.edges.map(e => ({ ...e, from: translate(e.from), to: e.to === null ? null : translate(e.to) })) }
  same(resolvedPackageGraph(root), graph, "PRIVATE_PACKAGE_RESOLUTION_CHANGED")
  return { inventory, graph }
}
const checkPrivateFiles = (root: string, inventory: PrivateFile[], graph: PackageGraph): void => {
  same(resolvedPackageGraph(root), graph, "PRIVATE_PACKAGE_RESOLUTION_CHANGED")
  for (const e of inventory) {
    const current = regular(path.join(root, e.path))
    if (current.mode !== e.mode || digest(current.bytes) !== e.sha256) fail("PRIVATE_MATERIAL_CHANGED")
  }
  const launcher = inventory.find(e => e.path === ".runtime-launchers/pnpm")!
  const target = inventory.filter(e => e.path.startsWith(".runtime-pnpm/") && e.sha256 === launcher.sha256)
  if (target.length !== 1 || realpathSync(path.join(root, ".runtime-node/pnpm")) !== path.join(root, target[0]!.path)) fail("PRIVATE_PNPM_CHANGED")
}
export const checkV138Plan143PrivateRuntimeCopyForReview = (input: string) => {
  const captured = runtimeCapture(input)
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "v138-plan143-runtime-smoke-")))
  chmodSync(root, 0o700)
  try {
    mkdirSync(path.join(root, "apps"))
    cpSync(path.join(input, "apps/runtime-service"), path.join(root, "apps/runtime-service"), {
      recursive: true, filter: file => path.basename(file) !== "node_modules",
    })
    const { inventory, graph } = privateRuntime(captured, root)
    checkPrivateFiles(root, inventory, graph); captured.verify()
    return freeze({ entries: captured.public.entries.length, semanticRuntimeRoot: captured.public.semanticRuntimeRoot,
      resolutionGraphMatched: true, producerCalls: 0, readinessCalls: 0, liveCalls: 0 })
  } finally { rmSync(root, { recursive: true, force: true }) }
}
const currentExecution = (consumer: Json, runtime: string, native: string, guard: string): Json => {
  const observations = CURRENT_MODES.map((mode, ordinal) => {
    const body = { subjectRoot: consumer.subjectRoot, mode, ordinal, status: MODES[ordinal]![1], reducedValue: REDUCED[ordinal],
      repositoryClosureRoot: consumer.repositoryClosureRoot, semanticRuntimeClosureRoot: runtime, nativeIdentityRoot: native }
    const execution = { ...body, executionRoot: H("execution", body) }
    return { ...execution, observationRoot: H("observation", execution) }
  })
  return { subjectRoot: consumer.subjectRoot, observations, actualModesPassed: observations.length,
    observationsRoot: H("observations", observations), guardTransformRoot: guard, producerGuardCount: 0 }
}

// This bootstrap calls only the subject's six incapable API modes. It checks raw
// bytes and raw returned records; no subject inventory/hash/verdict is our oracle.
const executeCurrentRoots = (h: History, consumer: Json, runtime: ReturnType<typeof runtimeCapture>) => {
  const source = secureFiles(h.supplied, [CURRENT])[CURRENT]!.toString()
  const guard = inspectV138Plan143ProducerBoundary(source)
  const owners: string[] = []; const copies: Array<{ root: string; owner: string; inventory: PrivateFile[]; graph: PackageGraph; closure: ReturnType<typeof discoverRepository> }> = []
  const evidenceRoots: string[] = []
  try {
    for (let n = 0; n < 2; n++) {
      const owner = realpathSync(mkdtempSync(path.join(tmpdir(), "v138-independent143-"))); owners.push(owner); chmodSync(owner, 0o700)
      const root = path.join(owner, "repo")
      git(h.root, ["clone", "--quiet", "--no-local", h.root, root])
      const { inventory, graph } = privateRuntime(runtime, root)
      writeFileSync(path.join(root, CURRENT), guard.transformed)
      writeFileSync(path.join(root, ".producer-guard"), "0", { flag: "wx", mode: 0o600 })
      const closure = discoverRepository(root, CURRENT)
      inventory.push(...closure.files.map(f => ({ path: f.path, sha256: f.sha256, mode: f.mode })))
      checkPrivateFiles(root, inventory, graph); copies.push({ root, owner, inventory, graph, closure })
    }
    same(copies[0]!.closure, copies[1]!.closure, "PRIVATE_CLOSURE_NONDETERMINISTIC")
    for (const [index, copy] of copies.entries()) {
      const { root, owner, inventory, graph, closure } = copy
      const nonce = randomBytes(32).toString("hex"), binding = rootIdentity(root), expectedHead = textGit(root, ["rev-parse", "HEAD"])
      const other = copies[1 - index]!.root
      const bootstrap = `import {readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const list=${JSON.stringify(inventory)}; const initial=lstatSync(process.cwd(),{bigint:true});
function verify(){for(const f of list){let p=process.cwd();const parts=f.path.split('/');for(let i=0;i<parts.length;i++){p=path.join(p,parts[i]);const s=lstatSync(p);if(s.isSymbolicLink()||(i<parts.length-1&&!s.isDirectory()))throw Error('component');if(i===parts.length-1&&(!s.isFile()||(s.mode&73?'100755':'100644')!==f.mode||'sha256:'+createHash('sha256').update(readFileSync(p)).digest('hex')!==f.sha256))throw Error('bytes')}}if(readFileSync('.producer-guard','utf8')!=='0')throw Error('guard')}
const no=(fn)=>{try{fn();return false}catch{return true}};
verify();const s=await import('./${CURRENT}');const values=[];
for(const mode of ${JSON.stringify(CURRENT_MODES)}){verify();values.push(s.executeV138LiveV14ReviewMode(process.cwd(),mode));verify()}
s.authenticateV138LiveV14ReviewModeBatchForReview(process.cwd(),values);
const replay=no(()=>s.authenticateV138LiveV14ReviewModeBatchForReview(process.cwd(),JSON.parse(JSON.stringify(values))));
const other=${JSON.stringify(other)};const otherValue=s.executeV138LiveV14ReviewMode(other,'source-only');
const cross=no(()=>s.authenticateV138LiveV14ReviewModeBatchForReview(other,values));
const mixed=no(()=>s.authenticateV138LiveV14ReviewModeBatchForReview(process.cwd(),[otherValue,...values.slice(1)]));
const immutable=values.every(v=>Object.isFrozen(v)&&!Reflect.set(v,'status','changed'));
const file=path.join(other,${JSON.stringify(dataInputs[0])});const original=readFileSync(file);let drift=false;
try{writeFileSync(file,Buffer.concat([original,Buffer.from(' ')]));drift=no(()=>s.executeV138LiveV14ReviewMode(other,'source-only'))}finally{writeFileSync(file,original)}
if(![replay,cross,mixed,immutable,drift].every(Boolean))throw Error('provenance');verify();
const final=lstatSync(process.cwd(),{bigint:true});if(initial.dev!==final.dev||initial.ino!==final.ino)throw Error('root');
process.stdout.write(JSON.stringify({nonce:${JSON.stringify(nonce)},device:String(final.dev),inode:String(final.ino),pid:process.pid,
head:execFileSync('/usr/bin/git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),observations:values,attacks:{replay,cross,mixed,immutable,drift}})+'\\n');`
      const bootstrapPath = path.join(root, ".plan143-current-proof.mjs")
      writeFileSync(bootstrapPath, bootstrap, { flag: "wx", mode: 0o600 })
      const checkBootstrap = () => { if (digest(regular(bootstrapPath).bytes) !== digest(bootstrap)) fail("BOOTSTRAP_CHANGED") }
      checkBootstrap(); checkPrivateFiles(root, inventory, graph)
      const result = spawnSync(path.join(root, ".runtime-node/node"), ["--import", "tsx", ".plan143-current-proof.mjs"], {
        cwd: root, env: { PATH: `${path.join(root, ".runtime-node") }:/usr/bin:/bin`, HOME: owner, TMPDIR: owner,
          TSX_DISABLE_CACHE: "1", LANG: "C", LC_ALL: "C", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" },
        encoding: "utf8", timeout: 250000, maxBuffer: 8 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
      checkBootstrap(); checkPrivateFiles(root, inventory, graph)
      if (result.status !== 0) fail("CURRENT_CHILD_FAILED")
      const transcript = keys(JSON.parse(result.stdout), ["nonce", "device", "inode", "pid", "head", "observations", "attacks"], "TRANSCRIPT_SCHEMA")
      same([transcript.nonce, transcript.device, transcript.inode, transcript.head], [nonce, binding.dev, binding.ino, expectedHead], "TRANSCRIPT_BINDING")
      if (!Number.isSafeInteger(transcript.pid) || transcript.pid <= 0 || transcript.pid !== result.pid) fail("PROCESS_BINDING")
      same(transcript.attacks, { replay: true, cross: true, mixed: true, immutable: true, drift: true }, "PROVENANCE_ATTACK")
      boundedArray(transcript.observations, 6, 6).forEach((r, i) => same(r, { mode: CURRENT_MODES[i], status: MODES[i]![1], reducedValue: REDUCED[i],
        repositoryClosureRoot: closure.repositoryClosureRoot, semanticRuntimeClosureRoot: CURRENT_RUNTIME,
        nativeIdentityRoot: H("native-identities", C_IDENTITIES), sourceRoot: guard.transformedSourceSha256 }, "GENUINE_CURRENT_OBSERVATION"))
      same(rootIdentity(root), binding, "PRIVATE_ROOT_CHANGED")
      if (regular(path.join(root, ".producer-guard")).bytes.toString() !== "0") fail("PRODUCER_GUARD")
      const execution = currentExecution(consumer, CURRENT_RUNTIME, H("native-identities", C_IDENTITIES), guard.guardTransformRoot)
      evidenceRoots.push(H("reproduction", execution))
    }
    for (const c of copies) { checkPrivateFiles(c.root, c.inventory, c.graph); checkV138Plan143Absence(c.root) }
    runtime.verify(); h.verify(); same(subjectAt(h, FINAL144, CURRENT, "262-144"), consumer, "CANONICAL_CHANGED")
    same(evidenceRoots[0], evidenceRoots[1], "PROCESS_NONDETERMINISM")
    return { execution: currentExecution(consumer, CURRENT_RUNTIME, H("native-identities", C_IDENTITIES), guard.guardTransformRoot),
      reproduction: { processCount: 2, rootCount: 2, normalizedEvidenceRoots: evidenceRoots, equal: true } }
  } finally { for (const owner of owners) rmSync(owner, { recursive: true, force: true }) }
}

export const buildV138Plan143Review = (input: string) => {
  checkV138Plan143Absence(input); const h = history(input)
  try {
    const consumerSubject = currentCustody(h), reviewer = reviewerSubject(h), runtime = runtimeCapture(input)
    // Historical control authenticates the archive's exact entries and retained
    // closed142 proof; it is not relabeled as any current144 observation.
    repository(h)
    const measured = executeCurrentRoots(h, consumerSubject, runtime)
    const custodyBody = { repositoryClosureRoot: consumerSubject.repositoryClosureRoot, semanticRuntimeInventory: runtime.public.entries,
      semanticRuntimeClosureRoot: H("runtime-closure", runtime.public.entries), nativeIdentities: C_IDENTITIES,
      nativeIdentityRoot: H("native-identities", C_IDENTITIES), metadataPredicate: "private_bound_bare_snapshot_v1", provenancePredicate: "fresh_root_bound_private_transcript_v1" }
    const body = { schemaVersion: "v1.38-plan-262-143-live-v14-custody-review-payload-v10", consumerVersion: "live-v14", consumerPlan: "262-144",
      consumerSubject, reviewerSubject: reviewer, historical142: historicalValues(), historicalDispositions: DISPOSITIONS,
      canonicalCustody: { ...custodyBody, canonicalLocalExecutionClosureRoot: H("canonical-custody", custodyBody) },
      currentExecution: measured.execution, reproductionProof: measured.reproduction, findings: [], findingCount: 0, privacyFindingCount: 0,
      plan110Eligible: true, authorizesExecution: false, downstreamAuthority: "denied", counters: COUNTERS, requiredAccepted: 540 }
    const payload = { ...body, payloadRoot: H("payload", body) }, review = renderV138Plan143Review(payload)
    const carrierBody = { schemaVersion: "v1.38-plan-262-143-live-v14-custody-review-carrier-v10", consumerVersion: "live-v14", consumerPlan: "262-144",
      payloadPath: V138_PLAN143_PATHS.payload, payloadSha256: digest(canonical(payload)), payloadRoot: payload.payloadRoot,
      reviewPath: V138_PLAN143_PATHS.review, reviewSha256: digest(review), consumerSubjectRoot: consumerSubject.subjectRoot,
      reviewerSubjectRoot: reviewer.subjectRoot, semanticRuntimeClosureRoot: custodyBody.semanticRuntimeClosureRoot,
      currentObservationsRoot: measured.execution.observationsRoot, findingCount: 0, privacyFindingCount: 0, plan110Eligible: true,
      authorizesExecution: false, downstreamAuthority: "denied", counters: COUNTERS, requiredAccepted: 540 }
    const result = freeze({ payload, review, carrier: { ...carrierBody, carrierRoot: H("carrier", carrierBody) } })
    validateV138Plan143PublishedContract(result); h.verify(); runtime.verify(); checkV138Plan143Absence(input)
    same(reviewerSubject(h), reviewer, "REVIEWER_CHANGED")
    provenance.set(result, { root: rootIdentity(input), head: h.head, metadata: digest(h.before), runtime: runtime.public.semanticRuntimeRoot,
      digest: digest(canonical(result)), nonce: randomBytes(32).toString("hex") })
    return result
  } finally { h.dispose() }
}
const publicCode = (error: unknown): string => error instanceof Error ? /^V138_PLAN143_[A-Z_]+/u.exec(error.message)?.[0] ?? "V138_PLAN143_REJECTED" : "V138_PLAN143_REJECTED"
export const authenticateV138Plan143Batch = (values: readonly unknown[], input: string) => {
  if (values.length === 0) fail("EMPTY_BATCH")
  if (values.some(v => !v || typeof v !== "object" || !provenance.has(v))) return freeze(values.map(() => ({ accepted: false })))
  let h: History | undefined
  try {
    checkV138Plan143Absence(input); h = history(input); currentCustody(h); reviewerSubject(h)
    const runtime = runtimeCapture(input); const identity = rootIdentity(input)
    const results = values.map((v) => {
      if (!v || typeof v !== "object") return { accepted: false }
      const p = provenance.get(v)
      const accepted = !!p && canonical(p.root) === canonical(identity) && p.head === h!.head && p.metadata === digest(h!.before) &&
        p.runtime === runtime.public.semanticRuntimeRoot && p.digest === digest(canonical(v)) && /^[a-f0-9]{64}$/u.test(p.nonce)
      if (accepted) validateV138Plan143PublishedContract(v)
      return { accepted }
    })
    runtime.verify(); h.verify(); checkV138Plan143Absence(input)
    return freeze(results.every(r => r.accepted) ? results : values.map(() => ({ accepted: false })))
  } catch (e) { return values.map(() => freeze({ accepted: false, code: publicCode(e) })) }
  finally { h?.dispose() }
}
const privacy = (value: unknown): void => {
  const bytes = canonical(value)
  if (bytes.includes(ROOT) || /(?:file:\/\/|"\/(?:Users|home|private|tmp|var)\/|[A-Za-z]:\\\\|"(?:transcriptNonce|canonicalRoot|rootDev|rootIno)"\s*:)/u.test(bytes)) fail("PRIVACY")
}
const addedAt = (h: History, file: string): string => {
  const additions = textGit(h.root, ["log", "--diff-filter=A", "--format=%H", h.head, "--", file]).split("\n").filter(Boolean)
  if (additions.length !== 1 || !/^[0-9a-f]{40}$/u.test(additions[0]!)) fail("PUBLICATION_MISSING_OR_REPLACED")
  return additions[0]!
}
const unchangedFiles = (h: History, commit: string, files: readonly string[]): Record<string, Buffer> => {
  ancestor(h, commit)
  if (textGit(h.root, ["log", "--format=%H", `${commit}..${h.head}`, "--", ...files])) fail("PUBLICATION_REWRITTEN")
  const bytes = secureFiles(h.supplied, files)
  for (const p of files) {
    const current = regular(path.join(h.supplied, p))
    const blob = createHash("sha1").update(`blob ${bytes[p]!.length}\0`).update(bytes[p]!).digest("hex")
    same(textGit(h.root, ["ls-tree", commit, "--", p]), `${current.mode} blob ${blob}\t${p}`, "COMMITTED_PUBLICATION_BYTES")
    same(digest(git(h.root, ["show", `${commit}:${p}`])), digest(bytes[p]!), "COMMITTED_PUBLICATION_BYTES")
  }
  return bytes
}
const checkIndependentApproval = (h: History, subject: Json, before?: string): string => {
  const candidates = textGit(h.root, ["ls-tree", "-r", "--name-only", h.head, "--", PHASE]).split("\n")
    .filter(p => /^262-143-CODE-REVIEW(?:-V[1-9][0-9]*)?\.md$/u.test(path.posix.basename(p)))
  const expected = { sourceCommit: subject.commit, sourceSha256: subject.files.find((f: FileEntry) => f.path === SELF).sha256,
    testSha256: subject.files.find((f: FileEntry) => f.path === SELF.replace(/\.ts$/, ".test.ts")).sha256, findings: [] }
  const eligible: string[] = []
  for (const file of candidates) {
    const commit = addedAt(h, file); const report = unchangedFiles(h, commit, [file])[file]!.toString()
    const markers = [...report.matchAll(/<!-- plan143-independent-review (\{[^\n]*\}) -->/gu)]
    if (markers.length !== 1) continue
    let value: unknown; try { value = JSON.parse(markers[0]![1]!) } catch { fail("INDEPENDENT_REVIEW_SCHEMA") }
    if (canonical(value) !== canonical(expected)) continue
    ancestor(h, subject.commit, commit, true)
    if (before) ancestor(h, commit, before, true)
    eligible.push(commit)
  }
  if (eligible.length !== 1) fail("CLEAN_INDEPENDENT_REVIEW_REQUIRED")
  return eligible[0]!
}
const parseJsonBytes = (bytes: Buffer): Json => {
  const value = JSON.parse(bytes.toString()); jsonSafe(value)
  if (!bytes.equals(Buffer.from(canonical(value)))) fail("CANONICAL_JSON_REQUIRED")
  return value
}
export const checkV138Plan143PublishedReview = (root: string, mode: "publication-only" | "immutable" | "pre" = "pre") => {
  if (!["publication-only", "immutable", "pre"].includes(mode)) fail("PUBLICATION_MODE")
  if (mode !== "immutable") checkV138Plan143Absence(root)
  const h = history(root)
  try {
    const consumer = currentCustody(h), reviewer = reviewerSubject(h), runtime = runtimeCapture(root)
    const paths = [V138_PLAN143_PATHS.payload, V138_PLAN143_PATHS.review, V138_PLAN143_PATHS.carrier]
    const publication = addedAt(h, paths[0]!); scope(h, publication, paths.map(p => `A\t${p}`))
    const bytes = unchangedFiles(h, publication, paths)
    const stored = { payload: parseJsonBytes(bytes[paths[0]!]!), review: bytes[paths[1]!]!.toString(), carrier: parseJsonBytes(bytes[paths[2]!]!) }
    validateV138Plan143PublishedContract(stored)
    const p = stored.payload
    same(p.consumerSubject, consumer, "CURRENT_SUBJECT_CHANGED"); same(p.reviewerSubject, reviewer, "REVIEWER_SUBJECT_CHANGED")
    same(p.canonicalCustody.semanticRuntimeInventory, runtime.public.entries, "RUNTIME_CHANGED")
    ancestor(h, consumer.commit, reviewer.commit, true); ancestor(h, reviewer.commit, publication, true)
    checkIndependentApproval(h, reviewer, publication)
    const guard = inspectV138Plan143ProducerBoundary(secureFiles(root, [CURRENT])[CURRENT]!.toString())
    same(p.currentExecution.guardTransformRoot, guard.guardTransformRoot, "GUARD_CHANGED")
    let summaryCommit: string | null = null, trackingCommit: string | null = null
    if (mode !== "publication-only") {
      summaryCommit = addedAt(h, V138_PLAN143_PATHS.summary)
      scope(h, summaryCommit, [`A\t${V138_PLAN143_PATHS.summary}`])
      same(textGit(h.root, ["rev-parse", `${summaryCommit}^`]), publication, "SUMMARY_DIRECT_CHILD")
      ancestor(h, summaryCommit, h.head, true)
      const summary = unchangedFiles(h, summaryCommit, [V138_PLAN143_PATHS.summary])[V138_PLAN143_PATHS.summary]!.toString()
      for (const ref of [publication, consumer.commit, reviewer.commit, p.payloadRoot]) if (!summary.includes(ref)) fail("SUMMARY_BINDING")
      const descendants = textGit(h.root, ["rev-list", "--reverse", "--ancestry-path", `${summaryCommit}..${h.head}`]).split("\n")
      const tracks = descendants.filter(commit => {
        if (textGit(h.root, ["diff-tree", "--no-commit-id", "--name-status", "-r", commit]) !== "M\t.planning/ROADMAP.md\nM\t.planning/STATE.md") return false
        return [".planning/ROADMAP.md", ".planning/STATE.md"].every(file => {
          const text = git(h.root, ["show", `${commit}:${file}`]).toString(); return text.includes(publication) && text.includes(summaryCommit!)
        })
      })
      if (!tracks.length) fail("TRACKING_REQUIRED")
      trackingCommit = tracks[0]!
    }
    runtime.verify(); h.verify(); if (mode !== "immutable") checkV138Plan143Absence(root)
    const result = freeze({ status: mode === "publication-only" ? "publication_only_checked" : "independent_custody_checked",
      publicationCommit: publication, summaryCommit, trackingCommit, payloadRoot: p.payloadRoot,
      consumerSubjectRoot: consumer.subjectRoot, reviewerSubjectRoot: reviewer.subjectRoot,
      semanticRuntimeClosureRoot: p.canonicalCustody.semanticRuntimeClosureRoot, currentObservationsRoot: p.currentExecution.observationsRoot,
      findingCount: 0, privacyFindingCount: 0, plan110Eligible: mode !== "publication-only", authorizesExecution: false,
      downstreamAuthority: "denied", counters: COUNTERS, requiredAccepted: 540 })
    privacy(result); return result
  } finally { h.dispose() }
}
export const writeV138Plan143Review = (root: string) => {
  // No test fixture/caller-supplied verdict can enter publication. The only input
  // is the supplied root; closed independent review precedes fresh measurements.
  const before = history(root)
  try {
    currentCustody(before); checkIndependentApproval(before, reviewerSubject(before))
    readV138WorkspaceBatch(root, [], [V138_PLAN143_PATHS.payload, V138_PLAN143_PATHS.review, V138_PLAN143_PATHS.carrier])
  } finally { before.dispose() }
  const result = buildV138Plan143Review(root)
  if (!authenticateV138Plan143Batch([result], root).every(v => v.accepted)) fail("PUBLICATION_PROVENANCE")
  const destinations = [V138_PLAN143_PATHS.payload, V138_PLAN143_PATHS.review, V138_PLAN143_PATHS.carrier]
  readV138WorkspaceBatch(root, [], [...V138_PLAN143_EFFECTS, ...destinations])
  const parentDescriptors = new Map<string, { fd: number; stamp: string }>()
  const created: Array<{ path: string; dev: bigint; ino: bigint }> = []
  try {
    for (const p of destinations) {
      const parent = path.join(root, path.dirname(p))
      if (!parentDescriptors.has(parent)) {
        const fd = openSync(parent, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW)
        parentDescriptors.set(parent, { fd, stamp: stamp(fstatSync(fd, { bigint: true })) })
      }
    }
    const values = [canonical(result.payload), result.review, canonical(result.carrier)]
    for (const [i, p] of destinations.entries()) {
      const parent = path.join(root, path.dirname(p)), retained = parentDescriptors.get(parent)!
      // Directory size/mtime changes from our previous write are expected; inode
      // continuity is checked around each add, as is regular exclusive creation.
      const s = fstatSync(retained.fd, { bigint: true }), pathname = lstatSync(parent, { bigint: true })
      if (s.dev !== pathname.dev || s.ino !== pathname.ino || pathname.isSymbolicLink()) fail("PUBLICATION_PARENT_CHANGED")
      const file = path.join(root, p), fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o644)
      try {
        const identity = fstatSync(fd, { bigint: true }); created.push({ path: file, dev: identity.dev, ino: identity.ino })
        writeFileSync(fd, values[i]!)
      } finally { closeSync(fd) }
      if (digest(regular(file).bytes) !== digest(values[i]!) || lstatSync(parent, { bigint: true }).ino !== s.ino) fail("PUBLICATION_WRITE_CHANGED")
    }
    checkV138Plan143Absence(root)
    return freeze({ status: "review_written", payloadRoot: result.payload.payloadRoot, plan110Eligible: false, authorizesExecution: false })
  } catch (e) {
    // Remove only exact regular inodes created by this invocation. Never erase a
    // substituted path. No failed write can become an eligible publication.
    for (const file of created.reverse()) {
      try {
        const current = lstatSync(file.path, { bigint: true })
        if (current.isFile() && !current.isSymbolicLink() && current.dev === file.dev && current.ino === file.ino) unlinkSync(file.path)
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error }
    }
    throw e
  } finally { for (const p of parentDescriptors.values()) closeSync(p.fd) }
}
// No operational/readiness/live selector exists in this independent reviewer.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [mode, supplied, ...extra] = process.argv.slice(2)
    if (extra.length || !["--check-source-only", "--emit-review", "--write-review", "--check-review", "--check-publication-only", "--check-immutable-review-custody"].includes(mode!)) fail("ARGUMENTS")
    const root = supplied ?? ROOT
    const result = mode === "--check-source-only" ? inspectV138Plan143CurrentSource(root) : mode === "--emit-review" ? buildV138Plan143Review(root) :
      mode === "--write-review" ? writeV138Plan143Review(root) : checkV138Plan143PublishedReview(root,
        mode === "--check-publication-only" ? "publication-only" : mode === "--check-immutable-review-custody" ? "immutable" : "pre")
    process.stdout.write(canonical(result))
  } catch (e) { process.stderr.write(publicCode(e) + "\n"); process.exitCode = 1 }
}
