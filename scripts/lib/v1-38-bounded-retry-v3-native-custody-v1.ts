import { createHash, randomBytes } from "node:crypto"
import { execFileSync, spawn, spawnSync } from "node:child_process"
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  deriveV138PairIntentV2,
  type V138DurablePairV2Input,
} from "./v1-38-durable-pair-successor-v2.js"
import {
  deriveV138LifecycleIntentV2,
  type V138LifecycleTransactionV2,
} from "./v1-38-restartable-lifecycle-successor-v2.js"
import {
  compileV138PrivateNativeV2,
  V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V2,
} from "./v1-38-private-native-bootstrap-v2.js"

type Sha = `sha256:${string}`
const GIT = "/usr/bin/git"
const EXPECTED_GIT_SHA256 =
  "179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818"
const sourceDirectory = path.dirname(fileURLToPath(import.meta.url))
const transactionSource = path.resolve(
  sourceDirectory,
  "../native/v1-38-successor-transaction-helper-v6.c",
)
const ownerLockSource = path.resolve(
  sourceDirectory,
  "../native/v1-38-bounded-retry-v3-owner-lock-v1.c",
)
const EXPECTED_TRANSACTION_SOURCE_SHA256 =
  "643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a"
const EXPECTED_OWNER_LOCK_SOURCE_SHA256 =
  "fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea"

const fail = (code: string): never => {
  throw new TypeError(code)
}
const shaHex = (value: Buffer | string): string =>
  createHash("sha256").update(value).digest("hex")
const sha = (value: Buffer | string): Sha => `sha256:${shaHex(value)}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}
const cleanEnvironment = (home: string): NodeJS.ProcessEnv => ({
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  HOME: home,
  XDG_CONFIG_HOME: home,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
})
const hardenedGitArgs = (args: readonly string[]) => [
  "-c",
  "core.hooksPath=/dev/null",
  "-c",
  "core.fsmonitor=false",
  "-c",
  "core.autocrlf=false",
  "-c",
  "core.eol=lf",
  "-c",
  "core.safecrlf=true",
  "-c",
  "core.attributesFile=/dev/null",
  "-c",
  "core.symlinks=true",
  "-c",
  "advice.detachedHead=false",
  ...args,
]

export const runV138RetryV3IsolatedGit = (
  repoRoot: string,
  args: readonly string[],
  _ambientEnvironment: NodeJS.ProcessEnv = process.env,
): string => {
  if (realpathSync(GIT) !== GIT || shaHex(readFileSync(GIT)) !== EXPECTED_GIT_SHA256)
    fail("V138_RETRY_V3_GIT_EXECUTABLE_MISMATCH")
  const isolation = mkdtempSync(path.join(tmpdir(), "v138-retry-v3-git-"))
  try {
    const result = execFileSync(GIT, hardenedGitArgs(args), {
      cwd: repoRoot,
      encoding: "utf8",
      env: cleanEnvironment(isolation),
      maxBuffer: 64 * 1024 * 1024,
    })
    return result.trim()
  } finally {
    rmSync(isolation, { recursive: true, force: true })
  }
}

const assertRepositoryConfigurationSafe = (repoRoot: string): void => {
  const config = runV138RetryV3IsolatedGit(repoRoot, [
    "config",
    "--local",
    "--list",
  ])
  if (
    /(?:^|\n)(?:core\.(?:hookspath|worktree|gitdir|fsmonitor|sshcommand|autocrlf|eol|safecrlf|attributesfile|symlinks)|extensions\.objectformat|include\.|filter\.|url\..*\.insteadof|protocol\.|alias\.)=/iu.test(
      config,
    )
  )
    fail("V138_RETRY_V3_REPOSITORY_CONFIG_FORBIDDEN")
  if (
    runV138RetryV3IsolatedGit(repoRoot, [
      "for-each-ref",
      "--format=%(refname)",
      "refs/replace",
    ]) !== ""
  )
    fail("V138_RETRY_V3_REPLACE_REF_FORBIDDEN")
}

const installedClosureManifest = (repoRoot: string) => {
  const records: string[] = []
  const visited = new Set<string>()
  const queue: string[] = []
  const requireFromRepo = createRequire(path.join(repoRoot, "package.json"))
  for (const name of ["vitest", "tsx"])
    queue.push(realpathSync(path.dirname(requireFromRepo.resolve(`${name}/package.json`))))
  const walk = (absolute: string, relative: string): void => {
    const status = lstatSync(absolute)
    if (status.isSymbolicLink()) {
      records.push(`l\0${relative}\0${readlinkSync(absolute)}`)
      return
    }
    if (status.isDirectory()) {
      records.push(`d\0${relative}\0${status.mode & 0o777}`)
      for (const child of readdirSync(absolute).sort()) {
        if (child !== "node_modules") walk(path.join(absolute, child), `${relative}/${child}`)
      }
      return
    }
    if (!status.isFile()) fail("V138_RETRY_V3_INSTALLED_ENTRY_INVALID")
    records.push(`f\0${relative}\0${status.mode & 0o777}\0${sha(readFileSync(absolute))}`)
  }
  while (queue.length > 0) {
    const packageRoot = queue.shift()!
    if (visited.has(packageRoot)) continue
    visited.add(packageRoot)
    const packageJsonPath = path.join(packageRoot, "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      name: string
      dependencies?: Record<string, string>
      optionalDependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    walk(packageRoot, `package:${packageJson.name}`)
    const resolver = createRequire(packageJsonPath)
    for (const dependency of Object.keys({
      ...packageJson.dependencies,
      ...packageJson.optionalDependencies,
      ...packageJson.peerDependencies,
    }).sort()) {
      try {
        let resolved: string
        try {
          resolved = resolver.resolve(`${dependency}/package.json`)
        } catch {
          resolved = resolver.resolve(dependency)
        }
        let dependencyRoot = path.dirname(resolved)
        while (dependencyRoot !== path.dirname(dependencyRoot)) {
          try {
            const candidate = JSON.parse(
              readFileSync(path.join(dependencyRoot, "package.json"), "utf8"),
            ) as { name?: string }
            if (candidate.name === dependency) break
          } catch {
            // Continue toward the owning package root.
          }
          dependencyRoot = path.dirname(dependencyRoot)
        }
        dependencyRoot = realpathSync(dependencyRoot)
        records.push(`r\0${packageJson.name}\0${dependency}\0${dependencyRoot}`)
        queue.push(dependencyRoot)
      } catch {
        if (
          packageJson.optionalDependencies?.[dependency] === undefined &&
          packageJson.peerDependencies?.[dependency] === undefined
        )
          fail(`V138_RETRY_V3_DEPENDENCY_RESOLUTION_FAILED:${dependency}`)
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
  return Object.freeze({
    root: sha(records.join("\n")),
    files: records.filter((record) => record.startsWith("f\0")).length,
    symlinks: records.filter((record) => record.startsWith("l\0")).length,
    packages: visited.size,
    nodeSha256: sha(readFileSync(node)),
    pnpmDistributionSha256: sha(records.filter((record) => record.startsWith("f\0runtime:pnpm-distribution")).join("\n")),
  })
}

const checkoutManifest = (
  repoRoot: string,
  sourceCommit: string,
  checkoutPaths: readonly string[],
) => {
  const records: string[] = []
  for (const repoPath of [...new Set(checkoutPaths)].sort()) {
    if (path.isAbsolute(repoPath) || repoPath.split("/").some((part) => !part || part === "." || part === ".."))
      fail("V138_RETRY_V3_CHECKOUT_PATH_INVALID")
    const tree = runV138RetryV3IsolatedGit(repoRoot, [
      "ls-tree",
      sourceCommit,
      "--",
      repoPath,
    ])
    const match = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/u.exec(tree)
    if (match === null || match[3] !== repoPath)
      fail(`V138_RETRY_V3_CHECKOUT_TREE_ENTRY_INVALID:${repoPath}`)
    const [, mode, blob] = match
    const absolute = path.join(repoRoot, ...repoPath.split("/"))
    const status = lstatSync(absolute)
    const expectedBlob = runV138RetryV3IsolatedGit(repoRoot, [
      "hash-object",
      "--no-filters",
      "--",
      repoPath,
    ])
    if (expectedBlob !== blob) fail(`V138_RETRY_V3_CHECKOUT_BYTES_MISMATCH:${repoPath}`)
    if (
      (mode === "120000") !== status.isSymbolicLink() ||
      (mode !== "120000" && !status.isFile()) ||
      (mode === "100755") !== ((status.mode & 0o111) !== 0)
    )
      fail(`V138_RETRY_V3_CHECKOUT_MODE_MISMATCH:${repoPath}`)
    const bytes = status.isSymbolicLink()
      ? Buffer.from(readlinkSync(absolute))
      : readFileSync(absolute)
    records.push(`${mode}\0${repoPath}\0${blob}\0${sha(bytes)}`)
  }
  return Object.freeze({ root: sha(records.join("\n")), records: Object.freeze(records) })
}

export type V138RetryV3ExecutionClosure = Readonly<{
  schemaVersion: "v1.38-retry-v3-execution-closure-v1"
  gitExecutable: "/usr/bin/git"
  gitExecutableSha256: Sha
  gitIsolationRoot: Sha
  gitObjectRoot: Sha
  sourceCommit: string
  sourceTree: string
  sourceParent: string
  checkoutByteManifestRoot: Sha
  installedClosureRoot: Sha
  nodeSha256: Sha
  pnpmDistributionSha256: Sha
  nativeSourcesRoot: Sha
  pathnameLaunchReplacementResistanceClaimed: false
  executionClosureRoot: Sha
}>

export const authenticateV138RetryV3ExecutionClosure = (
  repoRootInput: string,
  expected: Readonly<{
    sourceCommit: string
    checkoutPaths: readonly string[]
    executionClosureRoot?: Sha
  }>,
): V138RetryV3ExecutionClosure => {
  const repoRoot = realpathSync(repoRootInput)
  assertRepositoryConfigurationSafe(repoRoot)
  const head = runV138RetryV3IsolatedGit(repoRoot, ["rev-parse", "HEAD"])
  try {
    runV138RetryV3IsolatedGit(repoRoot, [
      "merge-base",
      "--is-ancestor",
      expected.sourceCommit,
      head,
    ])
  } catch {
    fail("V138_RETRY_V3_SOURCE_COMMIT_NOT_ANCESTOR")
  }
  const sourceCommit = expected.sourceCommit
  const sourceTree = runV138RetryV3IsolatedGit(repoRoot, [
    "rev-parse",
    `${sourceCommit}^{tree}`,
  ])
  const sourceParent = runV138RetryV3IsolatedGit(repoRoot, [
    "rev-parse",
    `${sourceCommit}^`,
  ])
  const commonDir = realpathSync(
    path.resolve(repoRoot, runV138RetryV3IsolatedGit(repoRoot, ["rev-parse", "--git-common-dir"])),
  )
  const objectRoot = realpathSync(path.join(commonDir, "objects"))
  const objectStatus = statSync(objectRoot)
  const checkout = checkoutManifest(repoRoot, sourceCommit, expected.checkoutPaths)
  const installed = installedClosureManifest(repoRoot)
  const nativeSourcesRoot = sha(
    canonical([
      [transactionSource, sha(readFileSync(transactionSource))],
      [ownerLockSource, sha(readFileSync(ownerLockSource))],
    ]),
  )
  const body = {
    schemaVersion: "v1.38-retry-v3-execution-closure-v1" as const,
    gitExecutable: GIT as "/usr/bin/git",
    gitExecutableSha256: sha(readFileSync(GIT)),
    gitIsolationRoot: sha(canonical(hardenedGitArgs([]))),
    gitObjectRoot: sha(`${objectRoot}\0${objectStatus.dev}\0${objectStatus.ino}`),
    sourceCommit,
    sourceTree,
    sourceParent,
    checkoutByteManifestRoot: checkout.root,
    installedClosureRoot: installed.root,
    nodeSha256: installed.nodeSha256,
    pnpmDistributionSha256: installed.pnpmDistributionSha256,
    nativeSourcesRoot,
    pathnameLaunchReplacementResistanceClaimed: false as const,
  }
  const result = Object.freeze({
    ...body,
    executionClosureRoot: sha(`v138-retry-v3-execution-closure-v1\0${canonical(body)}`),
  })
  if (
    expected.executionClosureRoot !== undefined &&
    result.executionClosureRoot !== expected.executionClosureRoot
  )
    fail("V138_RETRY_V3_EXECUTION_CLOSURE_MISMATCH")
  return result
}

const hex = (value: string): string => Buffer.from(value).toString("hex")
const rootIdentity = (rootInput: string) => {
  const root = realpathSync(rootInput)
  const status = lstatSync(root)
  if (!status.isDirectory() || status.isSymbolicLink()) fail("V138_RETRY_V3_NATIVE_ROOT_INVALID")
  return Object.freeze({ path: root, device: String(status.dev), inode: String(status.ino) })
}

const invokeTransactionNative = (
  rootInput: string,
  input: string,
  locks: readonly string[],
  crashBoundary?: string,
): void => {
  const root = rootIdentity(rootInput)
  const normalizedLocks = [...new Set(locks)].sort()
  const token = randomBytes(32).toString("hex")
  const nonce = randomBytes(32).toString("hex")
  const built = compileV138PrivateNativeV2({
    source: transactionSource,
    expectedSourceSha256: EXPECTED_TRANSACTION_SOURCE_SHA256,
    prefix: "cowards-v138-retry-v3-transaction-",
    defines: [`-DV138_CONTROLLER_TOKEN_HEX=\"${token}\"`],
    testSubstitution: crashBoundary === "force-compiler-substitution",
  })
  let capabilityDescriptor: number | undefined
  let rootDescriptor: number | undefined
  try {
    const capabilityPath = path.join(built.directory, "controller.capability")
    const capability = [
      "V138CAP2",
      token,
      nonce,
      shaHex(input),
      shaHex(normalizedLocks.map((item) => `${item}\n`).join("")),
      root.device,
      root.inode,
      EXPECTED_TRANSACTION_SOURCE_SHA256,
      built.compilerSha256,
      built.executableSha256,
    ].join("\t") + "\n"
    writeFileSync(capabilityPath, capability, { flag: "wx", mode: 0o600 })
    capabilityDescriptor = openSync(capabilityPath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    rootDescriptor = openSync(root.path, constants.O_RDONLY | (constants.O_DIRECTORY ?? 0) | (constants.O_NOFOLLOW ?? 0))
    if (shaHex(readFileSync(built.executable)) !== built.executableSha256)
      fail("V138_RETRY_V3_NATIVE_LAUNCH_DIGEST_MISMATCH")
    const result = spawnSync(
      crashBoundary === "force-spawn-failure"
        ? path.join(built.directory, "missing-helper")
        : built.executable,
      [],
      {
        cwd: root.path,
        input,
        encoding: "utf8",
        stdio: ["pipe", "ignore", "pipe", capabilityDescriptor, rootDescriptor, "pipe"],
        env: {
          PATH: "/usr/bin:/bin",
          LANG: "C",
          LC_ALL: "C",
          TMPDIR: built.directory,
          ...(crashBoundary === undefined ? {} : { V138_NATIVE_TEST_BARRIER: crashBoundary }),
        },
      },
    )
    if (result.status !== 0)
      fail(
        `V138_RETRY_V3_NATIVE_FAILED:${result.status}:${result.error?.message ?? ""}:${result.stderr ?? ""}`,
      )
  } finally {
    if (capabilityDescriptor !== undefined) closeSync(capabilityDescriptor)
    if (rootDescriptor !== undefined) closeSync(rootDescriptor)
    built.cleanup()
  }
}

export const publishV138RetryV3NativePair = (
  rootInput: string,
  input: V138DurablePairV2Input,
  crashBoundary = 0,
): void => {
  const identity = rootIdentity(rootInput)
  const derived = deriveV138PairIntentV2(identity, input)
  const nativeInput = [
    "PAIR",
    input.transactionId,
    input.intentPath,
    derived.namespace,
    derived.members[0].target,
    hex(derived.members[0].bytes),
    derived.members[1].target,
    hex(derived.members[1].bytes),
    hex(derived.intentBytes),
    "pair-v2",
    String(crashBoundary),
  ].join("\t") + "\n"
  invokeTransactionNative(
    identity.path,
    nativeInput,
    [input.intentPath, ...input.members.map(({ target }) => target)],
  )
}

export const applyV138RetryV3NativeLifecycle = (
  rootInput: string,
  input: V138LifecycleTransactionV2,
  crashBoundary = 0,
): void => {
  const identity = rootIdentity(rootInput)
  const derived = deriveV138LifecycleIntentV2(identity, input)
  const nativeInput = [
    [
      "LIFE",
      input.transactionId,
      derived.intentPath,
      derived.namespace,
      derived.lifecycle.target,
      hex(derived.lifecycle.bytes),
      String(derived.steps.length),
      String(crashBoundary),
      hex(derived.intentBytes),
      "lifecycle-v2",
    ].join("\t"),
    ...derived.steps.map((step) =>
      [step.id, step.target, step.beforeSha256.slice(7), hex(step.afterBytes)].join("\t"),
    ),
  ].join("\n") + "\n"
  invokeTransactionNative(identity.path, nativeInput, [
    derived.intentPath,
    derived.lifecycle.target,
    ...derived.steps.map(({ target }) => target),
  ])
}

export const acquireV138RetryV3NativeOwnerLease = async (
  rootInput: string,
): Promise<Readonly<{
  pid: number
  waitForExit: () => Promise<number | null>
  release: () => Promise<void>
}>> => {
  const root = rootIdentity(rootInput)
  const built = compileV138PrivateNativeV2({
    source: ownerLockSource,
    expectedSourceSha256: EXPECTED_OWNER_LOCK_SOURCE_SHA256,
    prefix: "cowards-v138-retry-v3-owner-",
  })
  let capabilityDescriptor: number | undefined
  let rootDescriptor: number | undefined
  try {
    const capabilityPath = path.join(built.directory, "owner.capability")
    writeFileSync(
      capabilityPath,
      `V138OWNER1\t${root.device}\t${root.inode}\t${randomBytes(32).toString("hex")}\n`,
      { flag: "wx", mode: 0o600 },
    )
    capabilityDescriptor = openSync(capabilityPath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    rootDescriptor = openSync(root.path, constants.O_RDONLY | (constants.O_DIRECTORY ?? 0) | (constants.O_NOFOLLOW ?? 0))
    if (shaHex(readFileSync(built.executable)) !== built.executableSha256)
      fail("V138_RETRY_V3_OWNER_LAUNCH_DIGEST_MISMATCH")
    const child = spawn(built.executable, [], {
      cwd: root.path,
      stdio: ["pipe", "pipe", "pipe", capabilityDescriptor, rootDescriptor],
      env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", TMPDIR: built.directory },
    })
    const exit = new Promise<number | null>((resolve) => child.once("exit", resolve))
    await new Promise<void>((resolve, reject) => {
      let stdout = "", stderr = "", settled = false
      const finish = (error?: Error) => {
        if (settled) return
        settled = true
        if (error) reject(error)
        else resolve()
      }
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
        stdout += chunk
        if (stdout.includes("acquired\n")) finish()
      })
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk })
      child.once("error", (error) => finish(error))
      child.once("exit", () => finish(new TypeError(`V138_RETRY_OWNER_LOCK_ACTIVE:${stderr.trim()}`)))
    })
    let released = false
    return Object.freeze({
      pid: child.pid ?? fail("V138_RETRY_OWNER_LOCK_ACTIVE"),
      waitForExit: () => exit,
      release: async () => {
        if (released) fail("V138_RETRY_OWNER_LOCK_RELEASE_INVALID")
        released = true
        child.stdin.end()
        const code = await exit
        built.cleanup()
        if (code !== 0) fail("V138_RETRY_OWNER_LOCK_RELEASE_INVALID")
      },
    })
  } catch (error) {
    built.cleanup()
    throw error
  } finally {
    if (capabilityDescriptor !== undefined) closeSync(capabilityDescriptor)
    if (rootDescriptor !== undefined) closeSync(rootDescriptor)
  }
}

export const V138_RETRY_V3_NATIVE_CUSTODY_ASSURANCE = Object.freeze({
  executionAssurance: V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V2,
  retainedRootDescriptor: true,
  privateReproducedNativeBytes: true,
  nativePairAndLifecycleOnly: true,
  pathnameLaunchReplacementResistanceClaimed: false,
})
