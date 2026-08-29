import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync } from "node:fs"
import path from "node:path"
import ts from "typescript"
import {
  authenticateV138RetryV3ExecutionClosure,
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
type CommittedRecord = Readonly<{
  path: string
  mode: "100644" | "100755" | "120000"
  blob: string
  sha256: Sha
  bytes: Buffer
}>

const GIT = "/usr/bin/git"
const HARDENED_GIT_ARGUMENTS = Object.freeze([
  "-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false",
  "-c", "core.autocrlf=false",
  "-c", "core.eol=lf",
  "-c", "core.safecrlf=true",
  "-c", "core.attributesFile=/dev/null",
  "-c", "core.symlinks=true",
  "-c", "advice.detachedHead=false",
])
const PATH_STABLE_NATIVE_SOURCES = Object.freeze([
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/native/v1-38-successor-transaction-helper-v6.c",
])

const fail = (code: string): never => { throw new TypeError(code) }
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const exactKeys = (value: Record<string, unknown>, keys: readonly string[], code: string): void => {
  if (canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code)
}
const validRepoPath = (value: string): boolean =>
  !path.isAbsolute(value) && value.split("/").every((part) => part !== "" && part !== "." && part !== "..")
const target = (root: string, repoPath: string): string =>
  path.join(root, ...repoPath.split("/"))
const git = (root: string, args: readonly string[]): string =>
  runV138RetryV3IsolatedGit(root, args)

const requireAncestor = (root: string, commit: string): void => {
  try { git(root, ["merge-base", "--is-ancestor", commit, "HEAD"]) }
  catch { fail("V138_PATH_STABLE_SOURCE_NOT_ANCESTOR") }
}
const noRewrite = (root: string, commit: string, repoPaths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...repoPaths]) !== "")
    fail("V138_PATH_STABLE_SUCCESSOR_REWRITE")
}
const committed = (root: string, commit: string, repoPath: string): CommittedRecord => {
  if (!validRepoPath(repoPath)) fail("V138_PATH_STABLE_REPO_PATH_INVALID")
  const entry = git(root, ["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
  if (match === null || match[3] !== repoPath)
    fail(`V138_PATH_STABLE_TREE_ENTRY_INVALID:${repoPath}`)
  const mode = match[1] as CommittedRecord["mode"]
  const bytes = runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
  const absolute = target(root, repoPath)
  const status = lstatSync(absolute)
  const current = status.isSymbolicLink()
    ? Buffer.from(readlinkSync(absolute))
    : readFileSync(absolute)
  if (
    !current.equals(bytes) ||
    (mode === "120000") !== status.isSymbolicLink() ||
    (mode !== "120000" && !status.isFile()) ||
    (mode === "100755") !== ((status.mode & 0o111) !== 0)
  ) fail(`V138_PATH_STABLE_CURRENT_ENTRY_INVALID:${repoPath}`)
  return Object.freeze({ path: repoPath, mode, blob: match[2]!, sha256: sha(bytes), bytes })
}

const resolveImport = (root: string, commit: string, owner: string, specifier: string): string => {
  const raw = path.posix.normalize(path.posix.join(path.posix.dirname(owner), specifier))
  const candidates = raw.endsWith(".js")
    ? [`${raw.slice(0, -3)}.ts`, `${raw.slice(0, -3)}.tsx`]
    : [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}/index.ts`]
  for (const candidate of candidates) {
    if (!validRepoPath(candidate)) continue
    if (/^(100644|100755) blob/u.test(git(root, ["ls-tree", commit, "--", candidate])))
      return candidate
  }
  fail(`V138_PATH_STABLE_IMPORT_UNRESOLVED:${owner}:${specifier}`)
}

const recursiveManifest = (
  root: string,
  commit: string,
  checkoutPaths: readonly string[],
): Readonly<{ root: Sha; count: number }> => {
  const queue = checkoutPaths.filter((repoPath) => repoPath.endsWith(".ts") || repoPath.endsWith(".tsx")) as string[]
  const visited = new Set<string>()
  const records: CommittedRecord[] = []
  while (queue.length > 0) {
    const repoPath = queue.shift()!
    if (visited.has(repoPath)) continue
    visited.add(repoPath)
    const record = committed(root, commit, repoPath)
    records.push(record)
    const imports = ts.preProcessFile(record.bytes.toString("utf8"), true, true).importedFiles
      .map(({ fileName }) => fileName)
      .filter((fileName) => fileName.startsWith("."))
    for (const specifier of [...new Set(imports)].sort())
      queue.push(resolveImport(root, commit, repoPath, specifier))
  }
  records.sort((a, b) => a.path.localeCompare(b.path))
  noRewrite(root, commit, records.map(({ path: repoPath }) => repoPath))
  const manifest = records.map(({ bytes: _bytes, ...record }) => record)
  return Object.freeze({
    root: sha(`v138-path-stable-recursive-dependency-v1\0${canonical(manifest)}`),
    count: manifest.length,
  })
}

const pathStableInstalledManifest = (repoRoot: string) => {
  const records: string[] = []
  const visited = new Set<string>()
  const queue: string[] = []
  const requireFromRepo = createRequire(path.join(repoRoot, "package.json"))
  for (const name of ["vitest", "tsx"])
    queue.push(realpathSync(path.dirname(requireFromRepo.resolve(`${name}/package.json`))))
  const walk = (packageRoot: string, absolute: string, relative: string): void => {
    const status = lstatSync(absolute)
    if (status.isSymbolicLink()) {
      const rawTarget = readlinkSync(absolute)
      if (path.isAbsolute(rawTarget)) fail("V138_PATH_STABLE_INSTALLED_ABSOLUTE_SYMLINK")
      const resolvedTarget = path.resolve(path.dirname(absolute), rawTarget)
      const relativeTarget = path.relative(packageRoot, resolvedTarget).split(path.sep).join("/")
      if (relativeTarget === ".." || relativeTarget.startsWith("../"))
        fail("V138_PATH_STABLE_INSTALLED_ESCAPING_SYMLINK")
      records.push(`l\0${relative}\0${relativeTarget}`)
      return
    }
    if (status.isDirectory()) {
      records.push(`d\0${relative}\0${status.mode & 0o777}`)
      for (const child of readdirSync(absolute).sort()) {
        if (child !== "node_modules")
          walk(packageRoot, path.join(absolute, child), `${relative}/${child}`)
      }
      return
    }
    if (!status.isFile()) fail("V138_PATH_STABLE_INSTALLED_ENTRY_INVALID")
    records.push(`f\0${relative}\0${status.mode & 0o777}\0${sha(readFileSync(absolute))}`)
  }
  while (queue.length > 0) {
    const packageRoot = queue.shift()!
    if (visited.has(packageRoot)) continue
    visited.add(packageRoot)
    const packageJsonPath = path.join(packageRoot, "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      name: string
      version: string
      dependencies?: Record<string, string>
      optionalDependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    if (typeof packageJson.name !== "string" || typeof packageJson.version !== "string")
      fail("V138_PATH_STABLE_INSTALLED_PACKAGE_IDENTITY_INVALID")
    const identity = `${packageJson.name}@${packageJson.version}`
    walk(packageRoot, packageRoot, `package:${identity}`)
    const resolver = createRequire(packageJsonPath)
    for (const dependency of Object.keys({
      ...packageJson.dependencies,
      ...packageJson.optionalDependencies,
      ...packageJson.peerDependencies,
    }).sort()) {
      try {
        let resolved: string
        try { resolved = resolver.resolve(`${dependency}/package.json`) }
        catch { resolved = resolver.resolve(dependency) }
        let dependencyRoot = path.dirname(resolved)
        let dependencyPackage: { name?: string; version?: string } | undefined
        while (dependencyRoot !== path.dirname(dependencyRoot)) {
          try {
            const candidate = JSON.parse(readFileSync(path.join(dependencyRoot, "package.json"), "utf8")) as {
              name?: string
              version?: string
            }
            if (candidate.name === dependency) { dependencyPackage = candidate; break }
          } catch { /* continue toward the owning package root */ }
          dependencyRoot = path.dirname(dependencyRoot)
        }
        if (dependencyPackage?.version === undefined)
          fail(`V138_PATH_STABLE_DEPENDENCY_IDENTITY_INVALID:${dependency}`)
        dependencyRoot = realpathSync(dependencyRoot)
        records.push(`r\0${identity}\0${dependency}\0${dependencyPackage.name}@${dependencyPackage.version}`)
        queue.push(dependencyRoot)
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("V138_PATH_STABLE_")) throw error
        if (packageJson.optionalDependencies?.[dependency] === undefined &&
            packageJson.peerDependencies?.[dependency] === undefined)
          fail(`V138_PATH_STABLE_DEPENDENCY_RESOLUTION_FAILED:${dependency}`)
      }
    }
  }
  const node = realpathSync(process.execPath)
  const pnpm = realpathSync(path.join(path.dirname(node), "pnpm"))
  const pnpmRoot = realpathSync(path.resolve(path.dirname(pnpm), ".."))
  walk(node, node, "runtime:node")
  walk(pnpm, pnpm, "runtime:pnpm-entrypoint")
  walk(pnpmRoot, pnpmRoot, "runtime:pnpm-distribution")
  records.sort()
  return Object.freeze({
    root: sha(`v138-path-stable-installed-manifest-v1\0${records.join("\n")}`),
    nodeSha256: sha(readFileSync(node)),
    pnpmDistributionSha256: sha(records.filter((record) =>
      record.startsWith("f\0runtime:pnpm-distribution")).join("\n")),
  })
}

export type V138PathStableCustody = Readonly<{
  schemaVersion: "v1.38-retry-v3-path-stable-custody-v1"
  gitExecutable: "/usr/bin/git"
  gitExecutableSha256: Sha
  hardenedGitArgumentsRoot: Sha
  sourceCommit: string
  sourceTree: string
  sourceParent: string
  checkoutPaths: readonly string[]
  checkoutManifestRoot: Sha
  recursiveDependencyRoot: Sha
  recursiveDependencyCount: number
  installedClosureRoot: Sha
  nodeSha256: Sha
  pnpmDistributionSha256: Sha
  pathStableNativeSourcesRoot: Sha
  pathnameLaunchReplacementResistanceClaimed: false
  reviewedClosureRoot: Sha
  localInstalledClosureRoot: Sha
  localGitObjectRoot: Sha
  localNativeSourcesRoot: Sha
  localExecutionClosureRoot: Sha
}>

const reviewedBodyFrom = (value: Omit<V138PathStableCustody,
  "reviewedClosureRoot" | "localInstalledClosureRoot" | "localGitObjectRoot" |
  "localNativeSourcesRoot" | "localExecutionClosureRoot"
>): Record<string, unknown> => ({ ...value })
const localBodyFrom = (value: Pick<V138PathStableCustody,
  "reviewedClosureRoot" | "localInstalledClosureRoot" | "localGitObjectRoot" | "localNativeSourcesRoot"
>): Record<string, unknown> => ({ ...value })

export const computeV138PathStableReviewedClosureRoot = (
  body: Record<string, unknown>,
): Sha => sha(`v138-retry-v3-path-stable-reviewed-closure-v1\0${canonical(body)}`)
export const computeV138PathStableLocalExecutionClosureRoot = (
  body: Record<string, unknown>,
): Sha => sha(`v138-retry-v3-path-stable-local-execution-closure-v1\0${canonical(body)}`)

export const deriveV138PathStableCustody = (
  repoRootInput: string,
  expected: Readonly<{ sourceCommit: string; checkoutPaths: readonly string[] }>,
): V138PathStableCustody => {
  const root = realpathSync(repoRootInput)
  if (!/^[0-9a-f]{40}$/u.test(expected.sourceCommit) ||
      expected.checkoutPaths.length === 0 || expected.checkoutPaths.some((repoPath) => !validRepoPath(repoPath)))
    fail("V138_PATH_STABLE_INPUT_INVALID")
  requireAncestor(root, expected.sourceCommit)
  const checkoutRecords = expected.checkoutPaths.map((repoPath) =>
    committed(root, expected.sourceCommit, repoPath))
  noRewrite(root, expected.sourceCommit, expected.checkoutPaths)
  const nativeRecords = PATH_STABLE_NATIVE_SOURCES.map((repoPath) =>
    committed(root, expected.sourceCommit, repoPath))
  noRewrite(root, expected.sourceCommit, PATH_STABLE_NATIVE_SOURCES)
  const recursive = recursiveManifest(root, expected.sourceCommit, expected.checkoutPaths)
  const native = authenticateV138RetryV3ExecutionClosure(root, expected)
  const installed = pathStableInstalledManifest(root)
  const checkoutManifest = checkoutRecords
    .map(({ bytes: _bytes, ...record }) => record)
    .sort((a, b) => a.path.localeCompare(b.path))
  const stableNativeManifest = nativeRecords
    .map(({ bytes: _bytes, ...record }) => record)
    .sort((a, b) => a.path.localeCompare(b.path))
  const reviewedBody = {
    schemaVersion: "v1.38-retry-v3-path-stable-custody-v1" as const,
    gitExecutable: GIT as "/usr/bin/git",
    gitExecutableSha256: native.gitExecutableSha256,
    hardenedGitArgumentsRoot: sha(`v138-retry-v3-hardened-git-arguments-v1\0${canonical(HARDENED_GIT_ARGUMENTS)}`),
    sourceCommit: native.sourceCommit,
    sourceTree: native.sourceTree,
    sourceParent: native.sourceParent,
    checkoutPaths: Object.freeze([...expected.checkoutPaths]),
    checkoutManifestRoot: sha(`v138-path-stable-checkout-manifest-v1\0${canonical(checkoutManifest)}`),
    recursiveDependencyRoot: recursive.root,
    recursiveDependencyCount: recursive.count,
    installedClosureRoot: installed.root,
    nodeSha256: installed.nodeSha256,
    pnpmDistributionSha256: installed.pnpmDistributionSha256,
    pathStableNativeSourcesRoot: sha(`v138-path-stable-native-sources-v1\0${canonical(stableNativeManifest)}`),
    pathnameLaunchReplacementResistanceClaimed: false as const,
  }
  const reviewedClosureRoot = computeV138PathStableReviewedClosureRoot(reviewedBody)
  const localBody = {
    reviewedClosureRoot,
    localInstalledClosureRoot: native.installedClosureRoot,
    localGitObjectRoot: native.gitObjectRoot,
    localNativeSourcesRoot: native.nativeSourcesRoot,
  }
  return Object.freeze({
    ...reviewedBody,
    reviewedClosureRoot,
    ...localBody,
    localExecutionClosureRoot: computeV138PathStableLocalExecutionClosureRoot(localBody),
  })
}

export const checkV138PathStableCustodyForReview = (
  expected: V138PathStableCustody,
  candidate: V138PathStableCustody,
): true => {
  exactKeys(candidate as Record<string, unknown>, Object.keys(expected), "V138_PATH_STABLE_KEYS_INVALID")
  const {
    reviewedClosureRoot,
    localInstalledClosureRoot,
    localGitObjectRoot,
    localNativeSourcesRoot,
    localExecutionClosureRoot,
    ...candidateReviewedBody
  } = candidate
  if (
    computeV138PathStableReviewedClosureRoot(reviewedBodyFrom(candidateReviewedBody)) !== reviewedClosureRoot ||
    computeV138PathStableLocalExecutionClosureRoot(localBodyFrom({
      reviewedClosureRoot, localInstalledClosureRoot, localGitObjectRoot, localNativeSourcesRoot,
    })) !== localExecutionClosureRoot ||
    canonical(candidate) !== canonical(expected)
  ) fail("V138_PATH_STABLE_CUSTODY_INVALID")
  return true
}
