import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync, statSync } from "node:fs"
import path from "node:path"
import ts from "typescript"
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
type Entry = Readonly<{
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
const NATIVE_PATHS = Object.freeze([
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
const validPath = (value: string): boolean =>
  !path.isAbsolute(value) && value.split("/").every((part) => part !== "" && part !== "." && part !== "..")
const target = (root: string, repoPath: string): string => path.join(root, ...repoPath.split("/"))
const git = (root: string, args: readonly string[]): string => runV138RetryV3IsolatedGit(root, args)

const entry = (root: string, commit: string, repoPath: string): Entry => {
  if (!validPath(repoPath)) fail("V138_PLAN114_INDEPENDENT_PATH_INVALID")
  const raw = git(root, ["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/u.exec(raw)
  if (match === null || match[3] !== repoPath) fail(`V138_PLAN114_INDEPENDENT_TREE_INVALID:${repoPath}`)
  const mode = match[1] as Entry["mode"]
  const bytes = runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
  const status = lstatSync(target(root, repoPath))
  const current = status.isSymbolicLink()
    ? Buffer.from(readlinkSync(target(root, repoPath)))
    : readFileSync(target(root, repoPath))
  if (!current.equals(bytes)) fail(`V138_PLAN114_INDEPENDENT_CURRENT_BYTES_INVALID:${repoPath}`)
  if ((mode === "120000") !== status.isSymbolicLink() ||
      (mode !== "120000" && !status.isFile()) ||
      (mode === "100755") !== ((status.mode & 0o111) !== 0))
    fail(`V138_PLAN114_INDEPENDENT_CURRENT_MODE_INVALID:${repoPath}`)
  return Object.freeze({ path: repoPath, mode, blob: match[2]!, sha256: sha(bytes), bytes })
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail("V138_PLAN114_INDEPENDENT_SUCCESSOR_REWRITE")
}
const resolveImport = (root: string, commit: string, owner: string, specifier: string): string => {
  const raw = path.posix.normalize(path.posix.join(path.posix.dirname(owner), specifier))
  const candidates = raw.endsWith(".js")
    ? [`${raw.slice(0, -3)}.ts`, `${raw.slice(0, -3)}.tsx`]
    : [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}/index.ts`]
  for (const candidate of candidates)
    if (validPath(candidate) && /^(100644|100755) blob/u.test(git(root, ["ls-tree", commit, "--", candidate])))
      return candidate
  fail(`V138_PLAN114_INDEPENDENT_IMPORT_UNRESOLVED:${owner}:${specifier}`)
}
const recursiveManifest = (root: string, commit: string, paths: readonly string[]) => {
  const queue = paths.filter((repoPath) => /\.tsx?$/u.test(repoPath)) as string[]
  const visited = new Set<string>()
  const records: Entry[] = []
  while (queue.length > 0) {
    const repoPath = queue.shift()!
    if (visited.has(repoPath)) continue
    visited.add(repoPath)
    const record = entry(root, commit, repoPath)
    records.push(record)
    const imports = ts.preProcessFile(record.bytes.toString("utf8"), true, true).importedFiles
      .map(({ fileName }) => fileName).filter((fileName) => fileName.startsWith("."))
    for (const specifier of [...new Set(imports)].sort()) queue.push(resolveImport(root, commit, repoPath, specifier))
  }
  records.sort((a, b) => a.path.localeCompare(b.path))
  noRewrite(root, commit, records.map(({ path: repoPath }) => repoPath))
  const manifest = records.map(({ bytes: _bytes, ...record }) => record)
  return Object.freeze({
    root: sha(`v138-path-stable-recursive-dependency-v1\0${canonical(manifest)}`),
    count: manifest.length,
  })
}

const portableInstalled = (repoRoot: string) => {
  const records: string[] = []
  const visited = new Set<string>()
  const queue: string[] = []
  const fromRepo = createRequire(path.join(repoRoot, "package.json"))
  for (const name of ["vitest", "tsx"]) queue.push(realpathSync(path.dirname(fromRepo.resolve(`${name}/package.json`))))
  const walk = (packageRoot: string, absolute: string, relative: string): void => {
    const status = lstatSync(absolute)
    if (status.isSymbolicLink()) {
      const rawTarget = readlinkSync(absolute)
      if (path.isAbsolute(rawTarget)) fail("V138_PLAN114_INDEPENDENT_INSTALLED_ABSOLUTE_LINK")
      const relativeTarget = path.relative(packageRoot, path.resolve(path.dirname(absolute), rawTarget)).split(path.sep).join("/")
      if (relativeTarget === ".." || relativeTarget.startsWith("../"))
        fail("V138_PLAN114_INDEPENDENT_INSTALLED_ESCAPING_LINK")
      records.push(`l\0${relative}\0${relativeTarget}`)
      return
    }
    if (status.isDirectory()) {
      records.push(`d\0${relative}\0${status.mode & 0o777}`)
      for (const child of readdirSync(absolute).sort())
        if (child !== "node_modules") walk(packageRoot, path.join(absolute, child), `${relative}/${child}`)
      return
    }
    if (!status.isFile()) fail("V138_PLAN114_INDEPENDENT_INSTALLED_TYPE_INVALID")
    records.push(`f\0${relative}\0${status.mode & 0o777}\0${sha(readFileSync(absolute))}`)
  }
  while (queue.length > 0) {
    const packageRoot = queue.shift()!
    if (visited.has(packageRoot)) continue
    visited.add(packageRoot)
    const packageJsonPath = path.join(packageRoot, "package.json")
    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      name: string; version: string; dependencies?: Record<string, string>
      optionalDependencies?: Record<string, string>; peerDependencies?: Record<string, string>
    }
    if (typeof manifest.name !== "string" || typeof manifest.version !== "string")
      fail("V138_PLAN114_INDEPENDENT_PACKAGE_IDENTITY_INVALID")
    const identity = `${manifest.name}@${manifest.version}`
    walk(packageRoot, packageRoot, `package:${identity}`)
    const resolver = createRequire(packageJsonPath)
    for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies,
      ...manifest.peerDependencies }).sort()) {
      try {
        let resolved: string
        try { resolved = resolver.resolve(`${dependency}/package.json`) }
        catch { resolved = resolver.resolve(dependency) }
        let dependencyRoot = path.dirname(resolved)
        let dependencyManifest: { name?: string; version?: string } | undefined
        while (dependencyRoot !== path.dirname(dependencyRoot)) {
          try {
            const candidate = JSON.parse(readFileSync(path.join(dependencyRoot, "package.json"), "utf8")) as {
              name?: string; version?: string
            }
            if (candidate.name === dependency) { dependencyManifest = candidate; break }
          } catch { /* keep walking */ }
          dependencyRoot = path.dirname(dependencyRoot)
        }
        if (dependencyManifest?.version === undefined) fail("V138_PLAN114_INDEPENDENT_DEPENDENCY_IDENTITY_INVALID")
        dependencyRoot = realpathSync(dependencyRoot)
        records.push(`r\0${identity}\0${dependency}\0${dependencyManifest.name}@${dependencyManifest.version}`)
        queue.push(dependencyRoot)
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("V138_PLAN114_")) throw error
        if (manifest.optionalDependencies?.[dependency] === undefined && manifest.peerDependencies?.[dependency] === undefined)
          fail(`V138_PLAN114_INDEPENDENT_DEPENDENCY_RESOLUTION_FAILED:${dependency}`)
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

const localInstalled = (repoRoot: string) => {
  const records: string[] = []
  const visited = new Set<string>()
  const queue: string[] = []
  const fromRepo = createRequire(path.join(repoRoot, "package.json"))
  for (const name of ["vitest", "tsx"]) queue.push(realpathSync(path.dirname(fromRepo.resolve(`${name}/package.json`))))
  const walk = (absolute: string, relative: string): void => {
    const status = lstatSync(absolute)
    if (status.isSymbolicLink()) { records.push(`l\0${relative}\0${readlinkSync(absolute)}`); return }
    if (status.isDirectory()) {
      records.push(`d\0${relative}\0${status.mode & 0o777}`)
      for (const child of readdirSync(absolute).sort())
        if (child !== "node_modules") walk(path.join(absolute, child), `${relative}/${child}`)
      return
    }
    if (!status.isFile()) fail("V138_PLAN114_INDEPENDENT_LOCAL_INSTALLED_TYPE_INVALID")
    records.push(`f\0${relative}\0${status.mode & 0o777}\0${sha(readFileSync(absolute))}`)
  }
  while (queue.length > 0) {
    const packageRoot = queue.shift()!
    if (visited.has(packageRoot)) continue
    visited.add(packageRoot)
    const packageJsonPath = path.join(packageRoot, "package.json")
    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      name: string; dependencies?: Record<string, string>; optionalDependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    walk(packageRoot, `package:${manifest.name}`)
    const resolver = createRequire(packageJsonPath)
    for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies,
      ...manifest.peerDependencies }).sort()) {
      try {
        let resolved: string
        try { resolved = resolver.resolve(`${dependency}/package.json`) }
        catch { resolved = resolver.resolve(dependency) }
        let dependencyRoot = path.dirname(resolved)
        while (dependencyRoot !== path.dirname(dependencyRoot)) {
          try {
            const candidate = JSON.parse(readFileSync(path.join(dependencyRoot, "package.json"), "utf8")) as { name?: string }
            if (candidate.name === dependency) break
          } catch { /* keep walking */ }
          dependencyRoot = path.dirname(dependencyRoot)
        }
        dependencyRoot = realpathSync(dependencyRoot)
        records.push(`r\0${manifest.name}\0${dependency}\0${dependencyRoot}`)
        queue.push(dependencyRoot)
      } catch {
        if (manifest.optionalDependencies?.[dependency] === undefined && manifest.peerDependencies?.[dependency] === undefined)
          fail(`V138_PLAN114_INDEPENDENT_LOCAL_DEPENDENCY_FAILED:${dependency}`)
      }
    }
  }
  const node = realpathSync(process.execPath)
  const pnpm = realpathSync(path.join(path.dirname(node), "pnpm"))
  const pnpmRoot = realpathSync(path.resolve(path.dirname(pnpm), ".."))
  walk(node, "runtime:node")
  walk(pnpm, "runtime:pnpm-entrypoint")
  walk(pnpmRoot, "runtime:pnpm-distribution")
  records.sort()
  return sha(records.join("\n"))
}

export type V138Plan114IndependentCustody = Readonly<{
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

export const deriveV138Plan114IndependentCustody = (
  repoRootInput: string,
  expected: Readonly<{ sourceCommit: string; checkoutPaths: readonly string[] }>,
): V138Plan114IndependentCustody => {
  const root = realpathSync(repoRootInput)
  if (!/^[0-9a-f]{40}$/u.test(expected.sourceCommit) || expected.checkoutPaths.length === 0 ||
      expected.checkoutPaths.some((repoPath) => !validPath(repoPath))) fail("V138_PLAN114_INDEPENDENT_INPUT_INVALID")
  git(root, ["merge-base", "--is-ancestor", expected.sourceCommit, "HEAD"])
  const checkout = expected.checkoutPaths.map((repoPath) => entry(root, expected.sourceCommit, repoPath))
  noRewrite(root, expected.sourceCommit, expected.checkoutPaths)
  const native = NATIVE_PATHS.map((repoPath) => entry(root, expected.sourceCommit, repoPath))
  noRewrite(root, expected.sourceCommit, NATIVE_PATHS)
  const recursive = recursiveManifest(root, expected.sourceCommit, expected.checkoutPaths)
  const installed = portableInstalled(root)
  const sourceTree = git(root, ["rev-parse", `${expected.sourceCommit}^{tree}`])
  const sourceParent = git(root, ["rev-parse", `${expected.sourceCommit}^`])
  const checkoutManifest = checkout.map(({ bytes: _bytes, ...record }) => record)
    .sort((a, b) => a.path.localeCompare(b.path))
  const nativeManifest = native.map(({ bytes: _bytes, ...record }) => record)
    .sort((a, b) => a.path.localeCompare(b.path))
  const reviewedBody = {
    schemaVersion: "v1.38-retry-v3-path-stable-custody-v1" as const,
    gitExecutable: GIT as "/usr/bin/git",
    gitExecutableSha256: sha(readFileSync(GIT)),
    hardenedGitArgumentsRoot: sha(`v138-retry-v3-hardened-git-arguments-v1\0${canonical(HARDENED_GIT_ARGUMENTS)}`),
    sourceCommit: expected.sourceCommit,
    sourceTree,
    sourceParent,
    checkoutPaths: Object.freeze([...expected.checkoutPaths]),
    checkoutManifestRoot: sha(`v138-path-stable-checkout-manifest-v1\0${canonical(checkoutManifest)}`),
    recursiveDependencyRoot: recursive.root,
    recursiveDependencyCount: recursive.count,
    installedClosureRoot: installed.root,
    nodeSha256: installed.nodeSha256,
    pnpmDistributionSha256: installed.pnpmDistributionSha256,
    pathStableNativeSourcesRoot: sha(`v138-path-stable-native-sources-v1\0${canonical(nativeManifest)}`),
    pathnameLaunchReplacementResistanceClaimed: false as const,
  }
  const reviewedClosureRoot = sha(`v138-retry-v3-path-stable-reviewed-closure-v1\0${canonical(reviewedBody)}`)
  const commonDir = realpathSync(path.resolve(root, git(root, ["rev-parse", "--git-common-dir"])))
  const objectRoot = realpathSync(path.join(commonDir, "objects"))
  const objectStatus = statSync(objectRoot)
  const localBody = {
    reviewedClosureRoot,
    localInstalledClosureRoot: localInstalled(root),
    localGitObjectRoot: sha(`${objectRoot}\0${objectStatus.dev}\0${objectStatus.ino}`),
    localNativeSourcesRoot: sha(canonical(NATIVE_PATHS.slice().reverse().map((repoPath) => [
      target(root, repoPath), sha(readFileSync(target(root, repoPath))),
    ]))),
  }
  return Object.freeze({
    ...reviewedBody,
    reviewedClosureRoot,
    ...localBody,
    localExecutionClosureRoot: sha(`v138-retry-v3-path-stable-local-execution-closure-v1\0${canonical(localBody)}`),
  })
}
