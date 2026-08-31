import { execFileSync, spawnSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import {
  chmodSync, closeSync, constants, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync,
  readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync,
  type BigIntStats,
} from "node:fs"
import { tmpdir } from "node:os"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { readV138WorkspaceBatch } from "./lib/v1-38-secure-workspace-path-v6.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>
type RuntimeEntry = Readonly<{
  identity: string
  mode: "100644" | "100755"
  size: number
  sha256: Sha
}>
type RuntimeFile = Readonly<{
  entry: RuntimeEntry
  absolute?: string
  destination: string
  generatedLauncherTemplate?: string
}>
type PathIdentity = Readonly<{ path: string; dev: string; ino: string; mode: number; nlink: string
  uid: string; gid: string; size: string; mtimeNs: string; ctimeNs: string }>

const SOURCE = "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.ts"
const TEST = "scripts/check-v1-38-plan-262-133-live-v13-custody-review-v5.test.ts"
const EXECUTOR_COMMIT = "222cecd6c8f633e1cec5ae916f95389f9a5f7876"
const EXECUTOR_SOURCE_BLOB = "28f8500db03bd81c2cbfe17c54f8cc2cf946e807"
const EXECUTOR_TEST_BLOB = "dcf81600b80a0c07d2145d3c5eac030dab45765c"
const EXECUTOR_SOURCE_SHA = "sha256:3bd4e8f2e5d994a45fe6a15659442ffe2e7e5b611ecf9205665597ef11fa43dc"
const EXECUTOR_TEST_SHA = "sha256:cfd5f3787184f2b6db033bf2de619b61ac6eeb03aa92f3b201738d8dba592b98"
const EXPECTED_RUNTIME_ENTRY_COUNT = 3931
const EXPECTED_RUNTIME_ROOT = "sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e"
const PRIVATE_TSX_LAUNCHER_TEMPLATE = `#!<PRIVATE_NODE>
import { constants, openSync, closeSync, fstatSync, readFileSync, lstatSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const INVENTORY = <PRIVATE_INVENTORY>;
const BASE = fileURLToPath(new URL("../../", import.meta.url));
const digest = (bytes) => "sha256:" + createHash("sha256").update(bytes).digest("hex");
const changed = () => { throw new Error("V138_PLAN142_PRIVATE_CHILD_RUNTIME_CHANGED"); };
const identity = (stat) => [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeNs, stat.ctimeNs].join(":");
function verify() {
  const found = [];
  function walk(relative) {
    const absolute = path.join(BASE, relative);
    const before = lstatSync(absolute, { bigint: true });
    if (before.isSymbolicLink()) changed();
    if (before.isDirectory()) {
      for (const child of readdirSync(absolute).sort()) walk(relative + "/" + child);
    } else if (before.isFile()) found.push(relative);
    else changed();
    if (identity(lstatSync(absolute, { bigint: true })) !== identity(before)) changed();
  }
  walk("node_modules"); walk(".runtime");
  if (JSON.stringify(found.sort()) !== JSON.stringify(INVENTORY.map((file) => file.destination).sort())) changed();
  for (const file of INVENTORY) {
    const descriptor = openSync(path.join(BASE, file.destination), constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const before = fstatSync(descriptor, { bigint: true });
      if (!before.isFile() || (before.mode & 0o444n) === 0n) changed();
      let bytes = readFileSync(descriptor);
      if (identity(fstatSync(descriptor, { bigint: true })) !== identity(before)) changed();
      if (file.entry.identity === "runtime/launcher/private-tsx") {
        bytes = Buffer.from(bytes.toString("utf8")
          .replace(/^#![^\\n]+/u, "#!<PRIVATE_" + "NODE>")
          .replace(/const INVENTORY = [^\\n]*;\\nconst BASE/u, "const INVENTORY = <PRIVATE_" + "INVENTORY>;\\nconst BASE"));
      }
      if (bytes.length !== file.entry.size || digest(bytes) !== file.entry.sha256 ||
          ((before.mode & 0o111n) === 0n ? "100644" : "100755") !== file.entry.mode) changed();
    } finally { closeSync(descriptor); }
  }
}
verify();
process.on("exit", () => { try { verify(); } catch { process.stderr.write("V138_PLAN142_PRIVATE_CHILD_RUNTIME_CHANGED\\n"); process.exitCode = 1; } });
process.env.TSX_DISABLE_CACHE = "1";
void import("../tsx/dist/cli.mjs");
`

export const V138_PLAN142_EFFECT_PATHS = Object.freeze([
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
const NATIVE_IDENTITIES = Object.freeze([
  Object.freeze({ path: "scripts/native/v1-38-successor-transaction-helper-v6.c", mode: "100644",
    blob: "ca694310a8a99c30d7a4070a415b968d3e341409",
    sha256: "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a" }),
  Object.freeze({ path: "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c", mode: "100644",
    blob: "99da3517ccb8b919759663daf713b4f20337b8b1",
    sha256: "sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea" }),
] as const)
// Existing executor-era reader/bootstrap only; this adds no native authority.
const ABSENCE_READER_IDENTITIES = Object.freeze([
  { path: "scripts/lib/v1-38-secure-workspace-path-v6.ts", mode: "100644",
    blob: "418b006ca59423d50ab263c45f675656c0de0b3f",
    sha256: "sha256:f8a2959c2db6a9a80147f6d1ece13d30d9fec457d90354e711be0a49319e5f49" },
  { path: "scripts/lib/v1-38-private-native-bootstrap-v2.ts", mode: "100644",
    blob: "1ffaf47aa29100f937a335c621ee45ab1e262b61",
    sha256: "sha256:165bdefcc02fd9448b3f5d778888617f90d16e7e0801bc091726574ecfcfae78" },
  { path: "scripts/native/v1-38-secure-manifest-reader-v6.c", mode: "100644",
    blob: "ffc03862525739b58ee7cc9ffae8f598a0b5e19e",
    sha256: "sha256:fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1" },
] as const)
const IMPLEMENTATION_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const fail: (code: string) => never = (code) => { throw new TypeError(code) }
const publicErrorCode = (error: unknown): string => error instanceof Error
  ? /^V138_PLAN142_[A-Z_]+/u.exec(error.message)?.[0] ?? "V138_PLAN142_AUTHENTICATION_FAILED"
  : "V138_PLAN142_AUTHENTICATION_FAILED"
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
const isSha = (value: unknown): value is Sha =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
function exactKeys(value: unknown, keys: readonly string[], code: string): asserts value is Json {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code)
}
const gitEnv = Object.freeze({ PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, HOME: "/dev/null",
  LANG: "C", LC_ALL: "C", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_OPTIONAL_LOCKS: "0", GIT_NO_REPLACE_OBJECTS: "1" })
const git = (root: string, args: readonly string[]): string => execFileSync("git", ["-C", root,
  "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-c", "filter.lfs.smudge=",
  ...args], { encoding: "utf8", env: gitEnv }).trim()
const gitBytes = (root: string, args: readonly string[]): Buffer => execFileSync("git", ["-C", root,
  "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-c", "filter.lfs.smudge=",
  ...args], { env: gitEnv, maxBuffer: 128 * 1024 * 1024 })

const readRegularNoFollow = (absolute: string, code: string, maximum = 512 * 1024 * 1024): Buffer => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor, { bigint: true })
    if (!before.isFile() || before.size > BigInt(maximum) || (before.mode & 0o444n) === 0n) fail(code)
    const bytes = readFileSync(descriptor); const after = fstatSync(descriptor, { bigint: true })
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mode !== after.mode || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs)
      fail(`${code}_CHANGED`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN142_")) throw error
    fail(code)
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
}
const modeOf = (absolute: string): "100644" | "100755" =>
  (lstatSync(absolute, { bigint: true }).mode & 0o111n) === 0n ? "100644" : "100755"

const walkFiles = (root: string, relative = ""): string[] => {
  const absolute = relative === "" ? root : target(root, relative)
  let stat: ReturnType<typeof lstatSync>
  try { stat = lstatSync(absolute) } catch { fail("V138_PLAN142_RUNTIME_ENTRY_LOOKUP_FAILED") }
  if (stat.isSymbolicLink()) fail("V138_PLAN142_RUNTIME_SYMLINK_FORBIDDEN")
  if (stat.isFile()) return [relative]
  if (!stat.isDirectory()) fail("V138_PLAN142_RUNTIME_TYPE_INVALID")
  const result: string[] = []
  for (const name of readdirSync(absolute).sort()) {
    if (relative === "" && name === "node_modules") continue
    const child = relative === "" ? name : `${relative}/${name}`
    result.push(...walkFiles(root, child))
  }
  return result
}
const locatePnpmPackage = (root: string, directoryPattern: RegExp, scopedPath: string,
  code: string): string => {
  const pnpm = target(root, "node_modules/.pnpm")
  const found: string[] = []
  for (const directory of readdirSync(pnpm).sort()) {
    if (!directoryPattern.test(directory)) continue
    const candidate = path.join(pnpm, directory, "node_modules", ...scopedPath.split("/"))
    try { if (lstatSync(candidate).isDirectory()) found.push(realpathSync(candidate)) }
    catch { /* rejected below */ }
  }
  const unique = [...new Set(found)]
  if (unique.length !== 1) fail(code)
  return unique[0]!
}
const packageRoot = (root: string, name: "typescript" | "tsx" | "esbuild"): string => {
  if (name !== "esbuild") {
    const resolved = realpathSync(target(root, `node_modules/${name}`))
    return resolved
  }
  try { return realpathSync(target(root, "node_modules/esbuild")) }
  catch { return locatePnpmPackage(root, /^esbuild@[^/]+$/u, "esbuild",
    "V138_PLAN142_ESBUILD_PACKAGE_INVALID") }
}
const nativeRoot = (root: string): string => {
  const platformPackage = `${process.platform}-${process.arch}`
  try {
    return realpathSync(target(root, `node_modules/@esbuild/${platformPackage}`))
  } catch { /* pnpm lookup below */ }
  const escaped = platformPackage.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  return locatePnpmPackage(root, new RegExp(`^@esbuild\\+${escaped}@[^/]+$`, "u"),
    `@esbuild/${platformPackage}`, "V138_PLAN142_NATIVE_PACKAGE_INVALID")
}
const packageVersion = (root: string): string => {
  const value = JSON.parse(readRegularNoFollow(path.join(root, "package.json"),
    "V138_PLAN142_PACKAGE_MANIFEST_INVALID").toString("utf8")) as Json
  if (typeof value.name !== "string" || typeof value.version !== "string" ||
      !/^[A-Za-z0-9@._/-]+$/u.test(value.name) || !/^[A-Za-z0-9._+-]+$/u.test(value.version))
    fail("V138_PLAN142_PACKAGE_IDENTITY_INVALID")
  return `${value.name}@${value.version}`
}
type PackageIdentity = Readonly<{ name: string; version: string; root: string }>
const readPackageIdentity = (packageRootInput: string): PackageIdentity => {
  const root = realpathSync(packageRootInput)
  const value = JSON.parse(readRegularNoFollow(path.join(root, "package.json"),
    "V138_PLAN142_PACKAGE_MANIFEST_INVALID").toString("utf8")) as Json
  if (typeof value.name !== "string" || typeof value.version !== "string" ||
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/iu.test(value.name) ||
      !/^[A-Za-z0-9._+-]+$/u.test(value.version))
    fail("V138_PLAN142_PACKAGE_IDENTITY_INVALID")
  return Object.freeze({ name: value.name, version: value.version, root })
}
const resolveDependencyRoot = (packageRootInput: string, dependency: string): string | undefined => {
  const resolver = createRequire(path.join(packageRootInput, "package.json"))
  let resolved: string
  try {
    try { resolved = resolver.resolve(`${dependency}/package.json`) }
    catch { resolved = resolver.resolve(dependency) }
  } catch { return undefined }
  let current = path.dirname(resolved)
  while (current !== path.dirname(current)) {
    try {
      const identity = readPackageIdentity(current)
      if (identity.name === dependency) return identity.root
    } catch { /* keep walking to the owning package */ }
    current = path.dirname(current)
  }
  fail("V138_PLAN142_DEPENDENCY_PACKAGE_INVALID")
}
const collectRuntimePackages = (root: string): readonly PackageIdentity[] => {
  let serviceRoot: string
  try { serviceRoot = realpathSync(target(root, "node_modules/@cowards/runtime-service")) }
  catch { serviceRoot = realpathSync(target(root, "apps/runtime-service")) }
  const queue = [packageRoot(root, "typescript"), packageRoot(root, "tsx"),
    packageRoot(root, "esbuild"), nativeRoot(root),
    realpathSync(path.dirname(createRequire(path.join(root, "package.json")).resolve("vitest/package.json"))),
    realpathSync(target(root, "node_modules/@cowards/spec")),
    realpathSync(target(root, "node_modules/@cowards/golden")),
    serviceRoot]
  const byVersion = new Map<string, PackageIdentity>()
  const versionByName = new Map<string, string>()
  while (queue.length > 0) {
    const identity = readPackageIdentity(queue.shift()!)
    const key = `${identity.name}@${identity.version}`
    if (byVersion.has(key)) continue
    const priorVersion = versionByName.get(identity.name)
    if (priorVersion !== undefined && priorVersion !== identity.version)
      fail("V138_PLAN142_DUPLICATE_PACKAGE_VERSION")
    byVersion.set(key, identity); versionByName.set(identity.name, identity.version)
    const manifest = JSON.parse(readRegularNoFollow(path.join(identity.root, "package.json"),
      "V138_PLAN142_PACKAGE_MANIFEST_INVALID").toString("utf8")) as Json
    const dependencies = Object.keys({ ...(manifest.dependencies ?? {}),
      ...(manifest.optionalDependencies ?? {}), ...(manifest.peerDependencies ?? {}) }).sort()
    for (const dependency of dependencies) {
      const dependencyRoot = resolveDependencyRoot(identity.root, dependency)
      if (dependencyRoot !== undefined) queue.push(dependencyRoot)
      else if (manifest.dependencies?.[dependency] !== undefined &&
          manifest.optionalDependencies?.[dependency] === undefined)
        fail("V138_PLAN142_REQUIRED_DEPENDENCY_MISSING")
    }
  }
  return Object.freeze([...byVersion.values()].sort((a, b) =>
    `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)))
}
type RuntimeCapture = Readonly<{
  public: Readonly<{ entries: readonly RuntimeEntry[]; semanticRuntimeRoot: Sha }>
  files: readonly RuntimeFile[]
}>
const captureRuntime = (rootInput: string): RuntimeCapture => {
  const supplied = path.resolve(rootInput); const suppliedStat = lstatSync(supplied)
  if (suppliedStat.isSymbolicLink() || !suppliedStat.isDirectory()) fail("V138_PLAN142_ROOT_INVALID")
  const root = realpathSync(supplied); const files: RuntimeFile[] = []
  const add = (identity: string, absolute: string, destination: string): void => {
    if (path.posix.normalize(identity) !== identity || identity.startsWith("/") || identity.includes(".."))
      fail("V138_PLAN142_RUNTIME_IDENTITY_INVALID")
    const bytes = readRegularNoFollow(absolute, "V138_PLAN142_RUNTIME_ENTRY_INVALID")
    const entry = Object.freeze({ identity, mode: modeOf(absolute), size: bytes.length,
      sha256: sha(bytes) })
    files.push(Object.freeze({ entry, absolute, destination }))
  }
  add("runtime/node/executable", realpathSync(process.execPath), ".runtime/bin/node")
  const pnpmEntry = realpathSync(path.join(path.dirname(process.execPath), "pnpm"))
  const pnpmRoot = path.resolve(path.dirname(pnpmEntry), "..")
  add("runtime/launcher/pnpm", pnpmEntry, ".runtime/bin/pnpm")
  add("runtime/launcher/tsx", target(root, "node_modules/.bin/tsx"), ".runtime/original-tsx-launcher")
  files.push(Object.freeze({ entry: Object.freeze({ identity: "runtime/launcher/private-tsx",
    mode: "100755", size: Buffer.byteLength(PRIVATE_TSX_LAUNCHER_TEMPLATE),
    sha256: sha(PRIVATE_TSX_LAUNCHER_TEMPLATE) }), destination: "node_modules/.bin/tsx",
    generatedLauncherTemplate: PRIVATE_TSX_LAUNCHER_TEMPLATE }))
  if (process.env.ESBUILD_BINARY_PATH !== undefined) fail("V138_PLAN142_ESBUILD_OVERRIDE_FORBIDDEN")
  const packages = collectRuntimePackages(root).map((pkg) =>
    [pkg.root, `node_modules/${pkg.name}`] as const)
  const packageInventories: Array<readonly [string, readonly string[]]> = []
  const pnpmFiles = walkFiles(pnpmRoot)
  packageInventories.push(Object.freeze([pnpmRoot, Object.freeze(pnpmFiles)]))
  for (const relative of pnpmFiles)
    add(`runtime/distribution/${packageVersion(pnpmRoot)}/${relative}`, target(pnpmRoot, relative), `.runtime/${relative}`)
  for (const [absoluteRoot, destinationRoot] of packages) {
    const versioned = packageVersion(absoluteRoot)
    const relativeFiles = walkFiles(absoluteRoot)
    packageInventories.push(Object.freeze([absoluteRoot, Object.freeze(relativeFiles)]))
    for (const relative of relativeFiles)
      add(`runtime/package/${versioned}/${relative}`, target(absoluteRoot, relative),
        `${destinationRoot}/${relative}`)
  }
  files.sort((a, b) => a.entry.identity < b.entry.identity ? -1 : a.entry.identity > b.entry.identity ? 1 : 0)
  if (new Set(files.map(({ entry }) => entry.identity)).size !== files.length)
    fail("V138_PLAN142_RUNTIME_DUPLICATE_IDENTITY")
  const entries = Object.freeze(files.map(({ entry }) => entry))
  const body = Object.freeze({ nodeVersion: process.version, v8Version: process.versions.v8,
    modulesAbi: process.versions.modules, platform: process.platform, arch: process.arch, entries })
  const publicValue = Object.freeze({ ...body,
    semanticRuntimeRoot: rooted("v138-plan-262-142-semantic-runtime-v10", body) })
  if (entries.length !== EXPECTED_RUNTIME_ENTRY_COUNT ||
      publicValue.semanticRuntimeRoot !== EXPECTED_RUNTIME_ROOT)
    fail(`V138_PLAN142_RUNTIME_PIN_MISMATCH:${entries.length}:${publicValue.semanticRuntimeRoot}`)
  for (const file of files) {
    if (file.generatedLauncherTemplate !== undefined) continue
    const bytes = readRegularNoFollow(file.absolute!, "V138_PLAN142_RUNTIME_ENTRY_INVALID")
    if (bytes.length !== file.entry.size || sha(bytes) !== file.entry.sha256 ||
        modeOf(file.absolute!) !== file.entry.mode) fail("V138_PLAN142_RUNTIME_CHANGED")
  }
  for (const [absoluteRoot, expectedFiles] of packageInventories)
    if (canonical(walkFiles(absoluteRoot)) !== canonical(expectedFiles))
      fail("V138_PLAN142_RUNTIME_TREE_CHANGED")
  return Object.freeze({ public: publicValue, files: Object.freeze(files) })
}
export const inspectV138Plan142SemanticRuntimeForReview = (rootInput: string) =>
  captureRuntime(rootInput).public

const componentIdentity = (absolute: string, relative: string, directory: boolean): PathIdentity => {
  let stat: BigIntStats
  try { stat = lstatSync(absolute, { bigint: true }) }
  catch { fail(`V138_PLAN142_EFFECT_COMPONENT_LOOKUP_FAILED:${relative}`) }
  if (stat.isSymbolicLink() || (directory ? !stat.isDirectory() : true))
    fail(`V138_PLAN142_EFFECT_COMPONENT_INVALID:${relative}`)
  return Object.freeze({ path: relative, dev: String(stat.dev), ino: String(stat.ino),
    mode: Number(stat.mode), nlink: String(stat.nlink), uid: String(stat.uid), gid: String(stat.gid),
    size: String(stat.size), mtimeNs: String(stat.mtimeNs), ctimeNs: String(stat.ctimeNs) })
}
const authenticateAbsenceReaderBytes = (root: string): void => {
  for (const identity of ABSENCE_READER_IDENTITIES)
    if (modeOf(target(root, identity.path)) !== identity.mode ||
        sha(readRegularNoFollow(target(root, identity.path), "V138_PLAN142_ABSENCE_READER_INVALID")) !== identity.sha256)
      fail("V138_PLAN142_ABSENCE_READER_INVALID")
}
const checkEffectPathsAbsent = (rootInput: string,
  expected?: Readonly<{ rootDev: string; rootIno: string }>): true => {
  const root = path.resolve(rootInput)
  // Reject the supplied root itself if symlinked, before the helper canonicalizes it.
  const before = componentIdentity(root, ".", true)
  authenticateAbsenceReaderBytes(IMPLEMENTATION_ROOT)
  try {
    const batch = readV138WorkspaceBatch(root, [], V138_PLAN142_EFFECT_PATHS)
    if (batch.identity.device !== before.dev || batch.identity.inode !== before.ino ||
        (expected !== undefined && (batch.identity.device !== expected.rootDev || batch.identity.inode !== expected.rootIno)) ||
        canonical(componentIdentity(root, ".", true)) !== canonical(before))
      fail("V138_PLAN142_EFFECT_COMPONENT_CHANGED")
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN142_")) throw error
    fail("V138_PLAN142_EFFECT_DESCRIPTOR_BATCH_FAILED")
  }
  authenticateAbsenceReaderBytes(IMPLEMENTATION_ROOT)
  // Descriptor-bound checked snapshot, not a promise of absence after return.
  // The existing bootstrap's single-operator local-seal limitations still apply.
  return true
}
export const checkV138Plan142EffectPathsAbsentForReview = (rootInput: string): true =>
  checkEffectPathsAbsent(rootInput)

type History = Readonly<{ root: string; sourceRoot: string; head: string; metadataRoot: Sha
  sourceMetadata: string
  git: (args: readonly string[]) => string; gitBytes: (args: readonly string[]) => Buffer
  dispose: () => void }>
const optionalMetadata = (absolute: string): string => {
  try { const stat = lstatSync(absolute); return `${stat.mode}:${stat.size}:${sha(readRegularNoFollow(absolute,
    "V138_PLAN142_METADATA_ENTRY_INVALID"))}` }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"; throw error }
}
const metadataState = (root: string): string => {
  const gitDir = realpathSync(git(root, ["rev-parse", "--absolute-git-dir"]))
  const common = realpathSync(git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]))
  const objects = realpathSync(path.join(common, "objects"))
  return canonical({ gitDir, common, objects, head: git(root, ["rev-parse", "HEAD"]),
    format: git(root, ["rev-parse", "--show-object-format"]),
    config: git(root, ["config", "--local", "--list"]),
    replaces: git(root, ["for-each-ref", "--format=%(refname):%(objectname)", "refs/replace"]),
    grafts: optionalMetadata(path.join(common, "info/grafts")),
    shallow: optionalMetadata(path.join(common, "shallow")),
    alternates: optionalMetadata(path.join(objects, "info/alternates")),
    packedRefs: optionalMetadata(path.join(common, "packed-refs")),
    gitHead: optionalMetadata(path.join(gitDir, "HEAD")) })
}
const assertMetadataSafe = (root: string): void => {
  if (git(root, ["rev-parse", "--show-object-format"]) !== "sha1")
    fail("V138_PLAN142_OBJECT_FORMAT_UNSUPPORTED")
  const config = git(root, ["config", "--local", "--list"])
  if (/(?:^|\n)(?:include\.[^=]*|includeif\.[^=]*|alias\.[^=]*|protocol\.[^=]*|url\..*\.insteadof|core\.(?:hookspath|fsmonitor|attributesfile|sshcommand))=/iu.test(config))
    fail("V138_PLAN142_REPOSITORY_CONFIG_FORBIDDEN")
  if (git(root, ["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "")
    fail("V138_PLAN142_REPLACE_REF_FORBIDDEN")
  const common = realpathSync(git(root, ["rev-parse", "--path-format=absolute", "--git-common-dir"]))
  for (const absolute of [path.join(common, "info/grafts"), path.join(common, "shallow"),
    path.join(common, "objects/info/alternates")]) {
    try { lstatSync(absolute); fail("V138_PLAN142_METADATA_REDIRECTION_FORBIDDEN") }
    catch (error) {
      if (error instanceof Error && error.message.startsWith("V138_PLAN142_")) throw error
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        fail("V138_PLAN142_METADATA_LOOKUP_FAILED")
    }
  }
}
const createHistory = (rootInput: string): History => {
  const sourceRoot = realpathSync(path.resolve(rootInput)); assertMetadataSafe(sourceRoot)
  const before = metadataState(sourceRoot); const head = git(sourceRoot, ["rev-parse", "--verify", "HEAD^{commit}"])
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan142-history-")); chmodSync(owner, 0o700)
  const snapshot = path.join(owner, "bare.git")
  try {
    execFileSync("git", ["clone", "--quiet", "--bare", "--no-local", sourceRoot, snapshot], { env: gitEnv })
    if (metadataState(sourceRoot) !== before) fail("V138_PLAN142_REPOSITORY_METADATA_CHANGED")
    assertMetadataSafe(sourceRoot)
    writeFileSync(path.join(snapshot, "config"), "[core]\n\trepositoryformatversion = 0\n\tbare = true\n", { mode: 0o600 })
    writeFileSync(path.join(snapshot, "HEAD"), `${head}\n`, { mode: 0o600 })
    const snapshotGit = (args: readonly string[]): string => git(snapshot, ["--git-dir", snapshot, ...args])
    const snapshotBytes = (args: readonly string[]): Buffer => gitBytes(snapshot, ["--git-dir", snapshot, ...args])
    if (snapshotGit(["rev-parse", "HEAD^{commit}"]) !== head) fail("V138_PLAN142_HISTORY_SNAPSHOT_INVALID")
    const metadataRoot = rooted("v138-plan-262-142-private-metadata-v10", {
      head, tree: snapshotGit(["rev-parse", "HEAD^{tree}"]), objectFormat: "sha1", sourceMetadataDigest: sha(before) })
    return Object.freeze({ root: snapshot, sourceRoot, head, metadataRoot, sourceMetadata: before, git: snapshotGit,
      gitBytes: snapshotBytes, dispose: () => rmSync(owner, { recursive: true, force: true }) })
  } catch (error) { rmSync(owner, { recursive: true, force: true }); throw error }
}
const authenticateRepositoryClosure = (history: History) => {
  try { history.git(["merge-base", "--is-ancestor", EXECUTOR_COMMIT, history.head]) }
  catch { fail("V138_PLAN142_HEAD_NOT_DESCENDANT") }
  const sourceLine = history.git(["ls-tree", EXECUTOR_COMMIT, "--", SOURCE])
  const testLine = history.git(["ls-tree", EXECUTOR_COMMIT, "--", TEST])
  if (sourceLine !== `100644 blob ${EXECUTOR_SOURCE_BLOB}\t${SOURCE}` ||
      testLine !== `100644 blob ${EXECUTOR_TEST_BLOB}\t${TEST}` ||
      sha(history.gitBytes(["cat-file", "blob", `${EXECUTOR_COMMIT}:${SOURCE}`])) !== EXECUTOR_SOURCE_SHA ||
      sha(history.gitBytes(["cat-file", "blob", `${EXECUTOR_COMMIT}:${TEST}`])) !== EXECUTOR_TEST_SHA)
    fail("V138_PLAN142_EXECUTOR_IDENTITY_INVALID")
  if (history.git(["log", "--format=%H", `${EXECUTOR_COMMIT}..${history.head}`, "--", SOURCE, TEST]) !== "")
    fail("V138_PLAN142_EXECUTOR_HISTORY_REWRITTEN")
  if (sha(readRegularNoFollow(target(history.sourceRoot, SOURCE), "V138_PLAN142_EXECUTOR_SOURCE_INVALID")) !== EXECUTOR_SOURCE_SHA ||
      sha(readRegularNoFollow(target(history.sourceRoot, TEST), "V138_PLAN142_EXECUTOR_TEST_INVALID")) !== EXECUTOR_TEST_SHA)
    fail("V138_PLAN142_EXECUTOR_WORKING_BYTES_CHANGED")
  const lines = history.git(["ls-tree", "-r", EXECUTOR_COMMIT]).split("\n").filter(Boolean)
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan142-repository-closure-"))
  let entries: readonly Readonly<{ path: string; mode: string; blob: string; sha256: Sha }>[]
  try {
    const archive = history.gitBytes(["archive", "--format=tar", EXECUTOR_COMMIT])
    execFileSync("tar", ["-x", "-C", owner], { input: archive, env: gitEnv })
    entries = Object.freeze(lines.map((line) => {
      const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(line)
      if (match === null) fail("V138_PLAN142_REPOSITORY_CLOSURE_ENTRY_INVALID")
      const bytes = readRegularNoFollow(target(owner, match[3]!),
        "V138_PLAN142_REPOSITORY_CLOSURE_ENTRY_INVALID")
      return Object.freeze({ path: match[3]!, mode: match[1]!, blob: match[2]!, sha256: sha(bytes) })
    }).sort((a, b) => a.path.localeCompare(b.path)))
  } finally { rmSync(owner, { recursive: true, force: true }) }
  for (const identity of [...NATIVE_IDENTITIES, ...ABSENCE_READER_IDENTITIES]) {
    const actual = entries.find((entry) => entry.path === identity.path)
    if (actual === undefined || canonical(actual) !== canonical(identity))
      fail("V138_PLAN142_NATIVE_IDENTITY_INVALID")
  }
  authenticateAbsenceReaderBytes(history.sourceRoot)
  const body = Object.freeze({ executorCommit: EXECUTOR_COMMIT, entries })
  return Object.freeze({ ...body,
    repositoryClosureRoot: rooted("v138-plan-262-142-repository-closure-v10", body) })
}
const materializeRuntime = (capture: RuntimeCapture, checkout: string): void => {
  for (const file of capture.files) {
    const destination = target(checkout, file.destination); mkdirSync(path.dirname(destination), { recursive: true })
    const bytes = file.generatedLauncherTemplate !== undefined
      ? Buffer.from(file.generatedLauncherTemplate)
      : readRegularNoFollow(file.absolute!, "V138_PLAN142_RUNTIME_ENTRY_INVALID")
    if (sha(bytes) !== file.entry.sha256 || bytes.length !== file.entry.size)
      fail("V138_PLAN142_RUNTIME_CHANGED")
    const materialized = file.generatedLauncherTemplate !== undefined
      ? Buffer.from(materializedLauncher(capture, checkout)) : bytes
    writeFileSync(destination, materialized, { mode: file.entry.mode === "100755" ? 0o755 : 0o644, flag: "wx" })
    const copied = readRegularNoFollow(destination, "V138_PLAN142_RUNTIME_COPY_INVALID")
    if (!copied.equals(materialized)) fail("V138_PLAN142_RUNTIME_COPY_INVALID")
  }
}
const materializedLauncher = (capture: RuntimeCapture, checkout: string): string =>
  PRIVATE_TSX_LAUNCHER_TEMPLATE.replace("<PRIVATE_NODE>", target(checkout, ".runtime/bin/node"))
    .replace("<PRIVATE_INVENTORY>", JSON.stringify(capture.files.map(({ entry, destination }) => ({ entry, destination }))))
const runExactExecutor = (history: History, capture: RuntimeCapture) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan142-executor-")); chmodSync(owner, 0o700)
  const checkout = path.join(owner, "repo")
  try {
    execFileSync("git", ["clone", "--quiet", "--no-local", history.root, checkout], { env: gitEnv })
    git(checkout, ["checkout", "--quiet", "--detach", EXECUTOR_COMMIT])
    materializeRuntime(capture, checkout)
    const runner = target(checkout, "scripts/.plan142-runner.ts")
    writeFileSync(runner, `import { executeV138Plan133DisposableObservationsForReview } from ${JSON.stringify(pathToFileURL(target(checkout, SOURCE)).href)}; const value=executeV138Plan133DisposableObservationsForReview(${JSON.stringify(checkout)}); process.stdout.write(JSON.stringify(value));`, { mode: 0o600, flag: "wx" })
    const node = target(checkout, ".runtime/bin/node")
    const cli = target(checkout, "node_modules/.bin/tsx")
    const result = spawnSync(node, [cli, runner], { cwd: checkout, encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024, timeout: 420_000,
      env: { PATH: `${path.dirname(node)}:/usr/bin:/bin`, HOME: owner, LANG: "C", LC_ALL: "C" },
      stdio: ["ignore", "pipe", "pipe"] })
    if (result.status !== 0) fail(`V138_PLAN142_EXECUTOR_FAILED:${result.stderr.trim()}`)
    for (const file of capture.files) {
      const bytes = file.generatedLauncherTemplate !== undefined ? Buffer.from(file.generatedLauncherTemplate)
        : readRegularNoFollow(file.absolute!, "V138_PLAN142_RUNTIME_ENTRY_INVALID")
      if (sha(bytes) !== file.entry.sha256 || (file.absolute !== undefined && modeOf(file.absolute) !== file.entry.mode))
        fail("V138_PLAN142_RUNTIME_CHANGED")
      const copied = target(checkout, file.destination)
      const copiedBytes = readRegularNoFollow(copied, "V138_PLAN142_RUNTIME_COPY_INVALID")
      const expectedCopy = file.generatedLauncherTemplate !== undefined
        ? Buffer.from(materializedLauncher(capture, checkout)) : bytes
      if (!copiedBytes.equals(expectedCopy) || modeOf(copied) !== file.entry.mode)
        fail("V138_PLAN142_RUNTIME_COPY_CHANGED")
    }
    if (captureRuntime(history.sourceRoot).public.semanticRuntimeRoot !== capture.public.semanticRuntimeRoot)
      fail("V138_PLAN142_RUNTIME_CHANGED")
    if (metadataState(history.sourceRoot) !== history.sourceMetadata)
      fail("V138_PLAN142_REPOSITORY_METADATA_CHANGED")
    return JSON.parse(result.stdout) as Json
  } finally { rmSync(owner, { recursive: true, force: true }) }
}
const validateExecution = (execution: Json, repositoryClosureRoot: Sha, semanticRuntimeRoot: Sha) => {
  exactKeys(execution, ["actualModesPassed", "authorizesExecution", "canonicalAfter", "canonicalBefore",
    "downstreamAuthority", "findings", "freshAccepted", "freshCharged", "liveInvoked", "observations",
    "observationsRoot", "producerCalls", "readinessInvoked"], "V138_PLAN142_EXECUTION_SCHEMA_INVALID")
  if (!Array.isArray(execution.observations) || execution.observations.length !== 6 ||
      !Array.isArray(execution.findings) || execution.findings.length !== 0 || execution.actualModesPassed !== 6 ||
      execution.producerCalls !== 0 || execution.readinessInvoked !== false || execution.liveInvoked !== false ||
      execution.freshCharged !== 0 || execution.freshAccepted !== 0 || execution.authorizesExecution !== false ||
      execution.downstreamAuthority !== "denied") fail("V138_PLAN142_EXECUTION_SEMANTICS_INVALID")
  if (canonical(execution.canonicalBefore) !== canonical(execution.canonicalAfter) ||
      execution.observationsRoot !== rooted("v138-plan-262-133-observations-v5", execution.observations))
    fail("V138_PLAN142_GENUINE_AGGREGATE_INVALID")
  return Object.freeze(execution.observations.map((item: Json, ordinal: number) => {
    exactKeys(item, ["disposableLocalExecutionClosureRoot", "disposableLocalGitObjectRoot",
      "disposableLocalInstalledClosureRoot", "disposableLocalNativeSourcePaths",
      "disposableLocalNativeSourcesRoot", "disposableReviewedClosureRoot", "mode", "observationRoot",
      "producerGuardCount", "reducedValue", "status"], "V138_PLAN142_OBSERVATION_SCHEMA_INVALID")
    const [mode, status] = MODES[ordinal]!
    if (item.mode !== mode || item.status !== status || item.producerGuardCount !== 0 ||
        canonical(item.reducedValue) !== canonical(REDUCED[ordinal]) || !isSha(item.observationRoot))
      fail("V138_PLAN142_OBSERVATION_INVALID")
    const { observationRoot, ...genuineBody } = item
    if (observationRoot !== rooted("v138-plan-262-133-mode-observation-v5", genuineBody) ||
        !Array.isArray(item.disposableLocalNativeSourcePaths) || item.disposableLocalNativeSourcePaths.length !== 2)
      fail("V138_PLAN142_GENUINE_MAPPING_INVALID")
    let nativeRootPrefix: string | undefined
    for (const [index, absolute] of item.disposableLocalNativeSourcePaths.entries()) {
      const suffix = NATIVE_IDENTITIES[index]!.path
      if (typeof absolute !== "string" || !path.isAbsolute(absolute) || path.normalize(absolute) !== absolute ||
          !absolute.endsWith(suffix)) fail("V138_PLAN142_GENUINE_NATIVE_INVALID")
      const prefix = absolute.slice(0, -suffix.length)
      if (!prefix.endsWith("/repo/") || !prefix.includes(`/v138-plan133-mode-${ordinal}-`) ||
          (nativeRootPrefix !== undefined && prefix !== nativeRootPrefix))
        fail("V138_PLAN142_GENUINE_NATIVE_INVALID")
      nativeRootPrefix = prefix
    }
    const nativeRoot = sha(canonical(item.disposableLocalNativeSourcePaths.map((absolute: string, index: number) =>
      [absolute, NATIVE_IDENTITIES[index]!.sha256])))
    const genuineExecution = { reviewedClosureRoot: item.disposableReviewedClosureRoot,
      localInstalledClosureRoot: item.disposableLocalInstalledClosureRoot,
      localGitObjectRoot: item.disposableLocalGitObjectRoot,
      localNativeSourcesRoot: item.disposableLocalNativeSourcesRoot }
    if (Object.values(genuineExecution).some((value) => !isSha(value)) ||
        item.disposableLocalNativeSourcesRoot !== nativeRoot ||
        item.disposableReviewedClosureRoot !== execution.canonicalBefore.reviewedClosureRoot ||
        item.disposableLocalInstalledClosureRoot !== execution.canonicalBefore.localInstalledClosureRoot ||
        item.disposableLocalGitObjectRoot !== execution.canonicalBefore.localGitObjectRoot ||
        item.disposableLocalExecutionClosureRoot !== rooted("v138-retry-v3-path-stable-local-execution-closure-v1", genuineExecution))
      fail("V138_PLAN142_GENUINE_MAPPING_INVALID")
    const body = Object.freeze({ repositoryClosureRoot, semanticRuntimeRoot, nativeIdentities: NATIVE_IDENTITIES,
      mode, ordinal, reducedValue: Object.freeze(structuredClone(item.reducedValue)), producerGuardCount: 0 })
    return Object.freeze({ ...body,
      stableRecordRoot: rooted("v138-plan-262-142-stable-execution-record-v10", body) })
  }))
}

type Provenance = Readonly<{ canonicalRoot: string; rootDev: string; rootIno: string; head: string
  metadataRoot: Sha; semanticRuntimeRoot: Sha; transcriptNonce: string; transcriptDigest: Sha }>
const provenanceByRoot = new Map<string, WeakMap<object, Provenance>>()
const rootIdentity = (rootInput: string) => {
  const canonicalRoot = realpathSync(path.resolve(rootInput)); const stat = statSync(canonicalRoot, { bigint: true })
  if (!stat.isDirectory()) fail("V138_PLAN142_ROOT_INVALID")
  return Object.freeze({ canonicalRoot, rootDev: String(stat.dev), rootIno: String(stat.ino) })
}
const authenticateRoot = (rootInput: string) => {
  const identity = rootIdentity(rootInput)
  checkEffectPathsAbsent(rootInput, identity)
  const history = createHistory(identity.canonicalRoot)
  try {
    const repository = authenticateRepositoryClosure(history); const runtime = captureRuntime(identity.canonicalRoot)
    checkEffectPathsAbsent(identity.canonicalRoot, identity)
    return Object.freeze({ identity, head: history.head, metadataRoot: history.metadataRoot,
      repository, runtime, history })
  } catch (error) { history.dispose(); throw error }
}
export const buildV138Plan142ProspectiveV10ForReview = (rootInput: string) => {
  const authenticated = authenticateRoot(rootInput)
  try {
    const execution = runExactExecutor(authenticated.history, authenticated.runtime)
    const observations = validateExecution(execution, authenticated.repository.repositoryClosureRoot,
      authenticated.runtime.public.semanticRuntimeRoot)
    checkEffectPathsAbsent(authenticated.identity.canonicalRoot, authenticated.identity)
    const observationsRoot = rooted("v138-plan-262-142-stable-observations-v10", observations)
    const payloadBody = Object.freeze({ schemaVersion: "v1.38-plan-262-142-live-v13-custody-v10",
      protocol: "semantic-runtime-root-provenance-component-walk-v10",
      executorCommit: EXECUTOR_COMMIT, repositoryClosure: authenticated.repository,
      semanticRuntime: authenticated.runtime.public, nativeIdentities: NATIVE_IDENTITIES,
      mappingDomain: "v138-plan-262-142-stable-execution-record-v10", observations, observationsRoot,
      plan140Disposition: "process_invalid_incomplete_runtime_cross_root_laundering_and_ancestor_symlink_gate",
      plan141Executed: false, plan141Eligible: false, plan143Eligible: true, plan110Eligible: false,
      producerCalls: 0, readinessInvoked: false, liveInvoked: false, freshCharged: 0,
      freshAccepted: 0, authorizesExecution: false, downstreamAuthority: "denied" })
    const payload = Object.freeze({ ...payloadBody,
      payloadRoot: rooted("v138-plan-262-142-prospective-payload-v10", payloadBody) })
    const carrierBody = Object.freeze({ schemaVersion: "v1.38-plan-262-142-live-v13-custody-carrier-v10",
      payloadRoot: payload.payloadRoot, observationsRoot,
      repositoryClosureRoot: authenticated.repository.repositoryClosureRoot,
      semanticRuntimeRoot: authenticated.runtime.public.semanticRuntimeRoot,
      plan143Eligible: true, plan110Eligible: false, authorizesExecution: false,
      downstreamAuthority: "denied" })
    const carrier = Object.freeze({ ...carrierBody,
      carrierRoot: rooted("v138-plan-262-142-prospective-carrier-v10", carrierBody) })
    const result = Object.freeze({ payload, carrier })
    const key = authenticated.identity.canonicalRoot
    const table = provenanceByRoot.get(key) ?? new WeakMap<object, Provenance>()
    provenanceByRoot.set(key, table)
    table.set(result, Object.freeze({ ...authenticated.identity, head: authenticated.head,
      metadataRoot: authenticated.metadataRoot,
      semanticRuntimeRoot: authenticated.runtime.public.semanticRuntimeRoot,
      transcriptNonce: randomBytes(32).toString("hex"), transcriptDigest: sha(canonical(result)) }))
    return result
  } finally { authenticated.history.dispose() }
}
const validateCandidate = (value: unknown): void => {
  exactKeys(value, ["carrier", "payload"], "V138_PLAN142_PROSPECTIVE_SCHEMA_INVALID")
  exactKeys(value.payload, ["authorizesExecution", "downstreamAuthority", "executorCommit", "freshAccepted",
    "freshCharged", "liveInvoked", "mappingDomain", "nativeIdentities", "observations", "observationsRoot",
    "payloadRoot", "plan110Eligible", "plan140Disposition", "plan141Eligible", "plan141Executed",
    "plan143Eligible", "producerCalls", "protocol", "readinessInvoked", "repositoryClosure",
    "schemaVersion", "semanticRuntime"], "V138_PLAN142_PAYLOAD_SCHEMA_INVALID")
  const { payloadRoot, ...payloadBody } = value.payload
  if (payloadRoot !== rooted("v138-plan-262-142-prospective-payload-v10", payloadBody) ||
      value.payload.plan143Eligible !== true || value.payload.plan110Eligible !== false ||
      value.payload.authorizesExecution !== false || value.payload.downstreamAuthority !== "denied" ||
      !Array.isArray(value.payload.observations) || value.payload.observations.length !== 6)
    fail("V138_PLAN142_PAYLOAD_INVALID")
  exactKeys(value.carrier, ["authorizesExecution", "carrierRoot", "downstreamAuthority", "observationsRoot",
    "payloadRoot", "plan110Eligible", "plan143Eligible", "repositoryClosureRoot", "schemaVersion",
    "semanticRuntimeRoot"], "V138_PLAN142_CARRIER_SCHEMA_INVALID")
  const { carrierRoot, ...carrierBody } = value.carrier
  if (carrierRoot !== rooted("v138-plan-262-142-prospective-carrier-v10", carrierBody) ||
      value.carrier.payloadRoot !== payloadRoot || value.carrier.observationsRoot !== value.payload.observationsRoot ||
      value.carrier.repositoryClosureRoot !== value.payload.repositoryClosure.repositoryClosureRoot ||
      value.carrier.semanticRuntimeRoot !== value.payload.semanticRuntime.semanticRuntimeRoot)
    fail("V138_PLAN142_CARRIER_INVALID")
}
export const authenticateV138Plan142ProspectiveV10BatchForReview = (
  values: readonly unknown[], rootInput: string,
) => {
  let authenticated: ReturnType<typeof authenticateRoot>
  try { authenticated = authenticateRoot(rootInput) }
  catch (error) {
    const code = publicErrorCode(error)
    return values.map(() => Object.freeze({ accepted: false as const, code }))
  }
  try {
    const table = provenanceByRoot.get(authenticated.identity.canonicalRoot)
    return values.map((value) => {
      try {
        validateCandidate(value)
        if (value === null || typeof value !== "object") fail("V138_PLAN142_UNTRUSTED_TRANSCRIPT")
        const provenance = table?.get(value)
        if (provenance === undefined || provenance.canonicalRoot !== authenticated.identity.canonicalRoot ||
            provenance.rootDev !== authenticated.identity.rootDev || provenance.rootIno !== authenticated.identity.rootIno ||
            provenance.head !== authenticated.head || provenance.metadataRoot !== authenticated.metadataRoot ||
            provenance.semanticRuntimeRoot !== authenticated.runtime.public.semanticRuntimeRoot ||
            provenance.transcriptDigest !== sha(canonical(value)) || provenance.transcriptNonce.length !== 64)
          fail("V138_PLAN142_ROOT_PROVENANCE_MISMATCH")
        checkEffectPathsAbsent(authenticated.identity.canonicalRoot, authenticated.identity)
        return Object.freeze({ accepted: true as const })
      } catch (error) { return Object.freeze({ accepted: false as const,
        code: publicErrorCode(error) }) }
    })
  } finally { authenticated.history.dispose() }
}
export const checkV138Plan142SourceOnlyForReview = (rootInput: string) => {
  const authenticated = authenticateRoot(rootInput)
  try { return Object.freeze({ sourceOnly: true,
    repositoryClosureRoot: authenticated.repository.repositoryClosureRoot,
    repositoryClosureEntryCount: authenticated.repository.entries.length,
    semanticRuntimeRoot: authenticated.runtime.public.semanticRuntimeRoot,
    semanticRuntimeEntryCount: authenticated.runtime.public.entries.length,
    plan143Eligible: false, plan110Eligible: false, producerCalls: 0, readinessInvoked: false,
    liveInvoked: false, freshCharged: 0, freshAccepted: 0, authorizesExecution: false,
    downstreamAuthority: "denied" as const })
  } finally { authenticated.history.dispose() }
}

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length === 1 && args[0] === "--check-source-only") {
    process.stdout.write(`${JSON.stringify(checkV138Plan142SourceOnlyForReview(root))}\n`); return
  }
  if (args.length === 2 && args[0] === "--emit-prospective") {
    process.stdout.write(canonical(buildV138Plan142ProspectiveV10ForReview(args[1]!))); return
  }
  fail("V138_PLAN142_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) { process.stderr.write(`${publicErrorCode(error)}\n`); process.exitCode = 1 }
}
