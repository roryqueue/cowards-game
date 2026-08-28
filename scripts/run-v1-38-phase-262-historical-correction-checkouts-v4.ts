import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Sha = `sha256:${string}`
const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha = (bytes: Buffer | string): Sha =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const root = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."))
const CODESIGN = "/usr/bin/codesign"
const GIT = "/usr/bin/git"
const EXPECTED = Object.freeze({
  gitSha256: "sha256:179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818" as Sha,
  gitCdHash: "1197f9fac4289a81d8e786b033bf8237672cabbc63da85b759bf2ef85ac232ad",
  nodeSha256: "sha256:2a249a6a7015b0555c3448a77d226c1f3c8f62bd133d89044a2e1518cd16c4b3" as Sha,
  nodeCdHash: "6290ace7a5e6f41ee3a5d14767658e06e3095699bb9f02c520e6c769a5130491",
  pnpmSha256: "sha256:ff3224d46b47fbb24a7e9fe15fededef7e00892d07d4e376b6762d4899906bfd" as Sha,
  pnpmDistSha256: "sha256:2eeeccff036b087a8794a5f0d68b359be183b0cf5ea0e0cea60803a1ef659f55" as Sha,
  pnpmClosureRoot: "sha256:2e95e5f54d085039ae1c859e8b5ed11ec4daffd42466cb329fd7c91fb46d4d02" as Sha,
  pnpmClosureFiles: 448,
  corepackSha256: "sha256:3655bc798f300951f2070fee411b337d626b0c3ae80c2d24c46ccac4595d4bf9" as Sha,
  runnerSha256: "sha256:39db22f579acf5639bbb17a261408debbde03f4692c0c439e77e7f13aeba74d6" as Sha,
  lockfileSha256: "sha256:55cfd0166e4954863a84a77d50968269c14a22a2a788278ad5dead963fff0df3" as Sha,
  vitestIntegrity: "sha512-6lvjbS3p9b4CrdCmguzbh2/4uoXhGE2q71R4OX5sqF9R1bo9Xd6fGrMAfvp5wnCzlBnFVdCOp6onuTQVbo8iUQ==",
  packageManager: "pnpm@11.1.2",
})
export const V138_HISTORICAL_GIT_ISOLATION_V4 = Object.freeze({
  systemConfigDisabled: true,
  globalConfigDisabled: true,
  isolatedHome: true,
  hooksDisabledPerCommand: true,
  replacementObjectsDisabled: true,
  replacementRefsRejected: true,
  rawCommitAndTreeVerified: true,
  checkoutByteManifestVerified: true,
  checkoutAttributesRejected: true,
  checkoutTransformConfigNeutralized: true,
  checkoutCleanBeforeInstall: true,
})
const cases = Object.freeze([
  Object.freeze({
    generation: "correction-v2",
    commit: "8ae8cba0dfee4c04ed951a478187aed982c445e5",
    test: "scripts/check-v1-38-phase-262-review-fix-correction-v2.test.ts",
  }),
  Object.freeze({
    generation: "correction-v3",
    commit: "7b56ecdcf6f88a63f79c9e7c46a6c290bb6dabe4",
    test: "scripts/check-v1-38-phase-262-review-fix-correction-v3.test.ts",
  }),
])
const cleanEnvironment = (toolBin: string, isolationRoot: string) => ({
  PATH: `/usr/bin:/bin:${toolBin}`,
  LANG: "C",
  LC_ALL: "C",
  CI: "1",
  COREPACK_ENABLE_PROJECT_SPEC: "0",
  HOME: isolationRoot,
  XDG_CONFIG_HOME: isolationRoot,
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
const executableOnPath = (name: string, environmentPath: string): string => {
  for (const directory of environmentPath.split(path.delimiter)) {
    if (directory === "") continue
    const candidate = path.join(directory, name)
    try {
      if (statSync(candidate).isFile()) return candidate
    } catch {
      // Continue to the next exact PATH entry.
    }
  }
  fail(`V138_HISTORICAL_TOOL_MISSING:${name}`)
}
const assertCodeSignature = (file: string, cdHash: string, label: string): void => {
  const result = spawnSync(CODESIGN, ["-dv", "--verbose=4", file], {
    encoding: "utf8",
    env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" },
  })
  const detail = `${result.stdout}${result.stderr}`
  if (
    result.status !== 0 ||
    !detail.includes(`CandidateCDHashFull sha256=${cdHash}`) ||
    !detail.includes("Authority=Apple Root CA")
  )
    fail(`V138_HISTORICAL_${label}_CODESIGN_MISMATCH`)
  execFileSync(CODESIGN, ["--verify", "--strict", file], {
    env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" },
    stdio: "pipe",
  })
}

const executablePackageClosureManifest = (packageRoot: string) => {
  const records: string[] = []
  const walk = (absolute: string, relative: string): void => {
    const status = lstatSync(absolute)
    if (status.isSymbolicLink()) {
      records.push(`l\0${relative}\0${readlinkSync(absolute)}`)
      return
    }
    if (status.isDirectory()) {
      for (const child of readdirSync(absolute).sort())
        walk(path.join(absolute, child), relative === "." ? child : path.posix.join(relative, child))
      return
    }
    if (!status.isFile()) fail("V138_HISTORICAL_TOOLCHAIN_FILE_TYPE_INVALID")
    records.push(`f\0${relative}\0${status.mode & 0o111}\0${sha(readFileSync(absolute))}`)
  }
  walk(packageRoot, ".")
  records.sort()
  return Object.freeze({ files: records.length, root: sha(records.join("\n")) })
}

const assertPnpmClosure = (pnpmPackageRoot: string): void => {
  const closure = executablePackageClosureManifest(pnpmPackageRoot)
  if (
    closure.root !== EXPECTED.pnpmClosureRoot ||
    closure.files !== EXPECTED.pnpmClosureFiles ||
    sha(readFileSync(path.join(pnpmPackageRoot, "dist/pnpm.mjs"))) !== EXPECTED.pnpmDistSha256
  )
    fail("V138_HISTORICAL_PNPM_EXECUTION_CLOSURE_MISMATCH")
}

export const resolveV138HistoricalToolchainV4 = (
  environmentPath = process.env.PATH ?? "",
) => {
  const pnpmShim = executableOnPath("pnpm", environmentPath)
  const pnpm = realpathSync(pnpmShim)
  const pnpmPackageRoot = realpathSync(path.resolve(path.dirname(pnpm), ".."))
  const toolBin = path.dirname(pnpmShim)
  const node = realpathSync(path.join(toolBin, "node"))
  const corepack = realpathSync(path.join(toolBin, "corepack"))
  if (realpathSync(GIT) !== GIT || sha(readFileSync(GIT)) !== EXPECTED.gitSha256)
    fail("V138_HISTORICAL_GIT_IDENTITY_MISMATCH")
  if (sha(readFileSync(node)) !== EXPECTED.nodeSha256)
    fail("V138_HISTORICAL_NODE_IDENTITY_MISMATCH")
  if (sha(readFileSync(pnpm)) !== EXPECTED.pnpmSha256)
    fail("V138_HISTORICAL_PNPM_IDENTITY_MISMATCH")
  if (sha(readFileSync(corepack)) !== EXPECTED.corepackSha256)
    fail("V138_HISTORICAL_COREPACK_IDENTITY_MISMATCH")
  assertPnpmClosure(pnpmPackageRoot)
  assertCodeSignature(GIT, EXPECTED.gitCdHash, "GIT")
  assertCodeSignature(node, EXPECTED.nodeCdHash, "NODE")
  const pnpmVersion = execFileSync(node, [pnpm, "--version"], {
    encoding: "utf8",
    env: cleanEnvironment(toolBin, tmpdir()),
  }).trim()
  assertPnpmClosure(pnpmPackageRoot)
  const pnpmStore = realpathSync(
    execFileSync(node, [pnpm, "store", "path"], {
      encoding: "utf8",
      env: {
        PATH: `/usr/bin:/bin:${toolBin}`,
        LANG: "C",
        LC_ALL: "C",
        COREPACK_ENABLE_PROJECT_SPEC: "0",
      },
    }).trim(),
  )
  assertPnpmClosure(pnpmPackageRoot)
  if (`pnpm@${pnpmVersion}` !== EXPECTED.packageManager)
    fail("V138_HISTORICAL_PACKAGE_MANAGER_VERSION_MISMATCH")
  return Object.freeze({
    git: GIT,
    gitSha256: EXPECTED.gitSha256,
    gitCdHash: EXPECTED.gitCdHash,
    node,
    nodeSha256: EXPECTED.nodeSha256,
    nodeCdHash: EXPECTED.nodeCdHash,
    pnpm,
    pnpmSha256: EXPECTED.pnpmSha256,
    pnpmDistSha256: EXPECTED.pnpmDistSha256,
    pnpmPackageRoot,
    pnpmClosureRoot: EXPECTED.pnpmClosureRoot,
    pnpmClosureFiles: EXPECTED.pnpmClosureFiles,
    corepack,
    corepackSha256: EXPECTED.corepackSha256,
    pnpmVersion,
    pnpmStore,
    toolBin,
  })
}

const installedClosureManifest = (checkout: string) => {
  const nodeModules = realpathSync(path.join(checkout, "node_modules"))
  const records: string[] = []
  const packageDirectories = [realpathSync(path.join(nodeModules, "vitest"))]
  const visited = new Set<string>()
  const walk = (absolute: string, relative: string): void => {
    const status = lstatSync(absolute)
    if (status.isSymbolicLink()) {
      records.push(`l\0${relative}\0${readlinkSync(absolute)}`)
      return
    }
    if (status.isDirectory()) {
      records.push(`d\0${relative}\0${status.mode & 0o777}`)
      for (const child of readdirSync(absolute).sort()) {
        if (child === "node_modules") continue
        walk(path.join(absolute, child), path.posix.join(relative, child))
      }
      return
    }
    if (!status.isFile()) fail("V138_HISTORICAL_DEPENDENCY_FILE_TYPE_INVALID")
    records.push(
      `f\0${relative}\0${status.mode & 0o111}\0${sha(readFileSync(absolute))}`,
    )
  }
  while (packageDirectories.length > 0) {
    const directory = packageDirectories.shift()!
    if (visited.has(directory)) continue
    visited.add(directory)
    const packageJsonPath = path.join(directory, "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
    const relativeDirectory = path.relative(nodeModules, directory)
    walk(directory, relativeDirectory)
    const dependencyNames = Object.keys({
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.optionalDependencies ?? {}),
      ...(packageJson.peerDependencies ?? {}),
    }).sort()
    const resolver = createRequire(packageJsonPath)
    for (const dependency of dependencyNames) {
      let resolved: string | undefined
      try {
        resolved = resolver.resolve(`${dependency}/package.json`)
      } catch {
        try {
          resolved = resolver.resolve(dependency)
        } catch {
          if (
            packageJson.optionalDependencies?.[dependency] !== undefined ||
            packageJson.peerDependencies?.[dependency] !== undefined
          )
            continue
          fail(`V138_HISTORICAL_DEPENDENCY_RESOLUTION_FAILED:${dependency}`)
        }
      }
      let dependencyDirectory = path.dirname(resolved)
      while (dependencyDirectory.startsWith(nodeModules)) {
        try {
          const candidate = JSON.parse(
            readFileSync(path.join(dependencyDirectory, "package.json"), "utf8"),
          )
          if (candidate.name === dependency) break
        } catch {
          // Continue toward the package root.
        }
        const parent = path.dirname(dependencyDirectory)
        if (parent === dependencyDirectory) break
        dependencyDirectory = parent
      }
      dependencyDirectory = realpathSync(dependencyDirectory)
      records.push(
        `r\0${packageJson.name}\0${dependency}\0${path.relative(nodeModules, dependencyDirectory)}`,
      )
      packageDirectories.push(dependencyDirectory)
    }
  }
  records.sort()
  return Object.freeze({
    files: records.filter((item) => item.startsWith("f\0")).length,
    symlinks: records.filter((item) => item.startsWith("l\0")).length,
    packages: visited.size,
    root: sha(records.join("\n")),
  })
}

const assertRepositoryConfigurationSafe = (
  git: (args: readonly string[], cwd?: string) => string,
): void => {
  const configuration = git(["config", "--local", "--list"])
  const forbidden = /(?:^|\n)(?:core\.(?:hookspath|worktree|gitdir|fsmonitor|sshcommand|autocrlf|eol|safecrlf|attributesfile|symlinks)|extensions\.objectformat|include\.|filter\.|url\..*\.insteadof|protocol\.|alias\.)=/iu
  if (forbidden.test(configuration))
    fail("V138_HISTORICAL_REPOSITORY_CONFIG_FORBIDDEN")
  if (git(["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "")
    fail("V138_HISTORICAL_REPLACE_REF_FORBIDDEN")
}

export const assertV138HistoricalRepositoryConfigurationSafeV4 = (
  repository: string,
): true => {
  const isolationRoot = mkdtempSync(path.join(tmpdir(), "v138-repository-config-v4-"))
  const environment = cleanEnvironment("/usr/bin", isolationRoot)
  const git = (args: readonly string[], cwd = repository) =>
    execFileSync(GIT, hardenedGitArgs(args), {
      cwd,
      encoding: "utf8",
      env: environment,
    }).trim()
  try {
    assertRepositoryConfigurationSafe(git)
    return true
  } finally {
    rmSync(isolationRoot, { recursive: true, force: true })
  }
}

const checkoutByteManifest = (
  repository: string,
  checkout: string,
  commit: string,
  environment: NodeJS.ProcessEnv,
) => {
  const raw = execFileSync(GIT, hardenedGitArgs(["ls-tree", "-rz", "--full-tree", commit]), {
    cwd: repository,
    env: environment,
  })
  const records: string[] = []
  let files = 0
  let symlinks = 0
  for (const encoded of raw.toString("utf8").split("\0")) {
    if (encoded === "") continue
    const separator = encoded.indexOf("\t")
    const header = encoded.slice(0, separator).split(" ")
    const relative = encoded.slice(separator + 1)
    if (separator < 0 || header.length !== 3 || relative === "")
      fail("V138_HISTORICAL_TREE_MANIFEST_INVALID")
    const [mode, type, blob] = header
    if (type !== "blob" || !["100644", "100755", "120000"].includes(mode!))
      fail("V138_HISTORICAL_TREE_ENTRY_UNSUPPORTED")
    if (path.posix.basename(relative) === ".gitattributes")
      fail("V138_HISTORICAL_CHECKOUT_ATTRIBUTES_FORBIDDEN")
    const absolute = path.join(checkout, ...relative.split("/"))
    const status = lstatSync(absolute)
    let executedBytes: Buffer
    if (mode === "120000") {
      if (!status.isSymbolicLink()) fail("V138_HISTORICAL_CHECKOUT_ENTRY_TYPE_MISMATCH")
      executedBytes = Buffer.from(readlinkSync(absolute))
      symlinks += 1
    } else {
      if (!status.isFile() || status.isSymbolicLink())
        fail("V138_HISTORICAL_CHECKOUT_ENTRY_TYPE_MISMATCH")
      if (((status.mode & 0o111) !== 0) !== (mode === "100755"))
        fail("V138_HISTORICAL_CHECKOUT_MODE_MISMATCH")
      executedBytes = readFileSync(absolute)
      files += 1
    }
    const executedBlob = createHash("sha1")
      .update(`blob ${executedBytes.length}\0`)
      .update(executedBytes)
      .digest("hex")
    if (executedBlob !== blob)
      fail("V138_HISTORICAL_CHECKOUT_BYTES_MISMATCH")
    records.push(`${mode}\0${relative}\0${blob}\0${sha(executedBytes)}`)
  }
  records.sort()
  return Object.freeze({ files, symlinks, root: sha(records.join("\n")) })
}

export const assertV138HistoricalCheckoutBytesV4 = (
  repository: string,
  checkout: string,
  commit: string,
) => {
  const isolationRoot = mkdtempSync(path.join(tmpdir(), "v138-checkout-bytes-v4-"))
  try {
    return checkoutByteManifest(
      repository,
      checkout,
      commit,
      cleanEnvironment("/usr/bin", isolationRoot),
    )
  } finally {
    rmSync(isolationRoot, { recursive: true, force: true })
  }
}

const assertCheckoutMatchesRawTree = (
  git: (args: readonly string[], cwd?: string) => string,
  checkout: string,
  commit: string,
  environment: NodeJS.ProcessEnv,
) => {
  const objectType = git(["cat-file", "-t", commit])
  if (objectType !== "commit") fail("V138_HISTORICAL_COMMIT_OBJECT_INVALID")
  const tree = git(["rev-parse", `${commit}^{tree}`])
  if (git(["rev-parse", "HEAD"], checkout) !== commit)
    fail("V138_HISTORICAL_CHECKOUT_COMMIT_MISMATCH")
  if (git(["rev-parse", "HEAD^{tree}"], checkout) !== tree)
    fail("V138_HISTORICAL_CHECKOUT_TREE_MISMATCH")
  if (git(["status", "--porcelain=v1", "--untracked-files=all"], checkout) !== "")
    fail("V138_HISTORICAL_CHECKOUT_DIRTY")
  return Object.freeze({ tree, checkoutBytes: checkoutByteManifest(root, checkout, commit, environment) })
}

type HistoricalOptions = Readonly<{
  mutateInstalledRunner?: boolean
  onlyGeneration?: "correction-v2" | "correction-v3"
}>

export const runV138Phase262HistoricalCorrectionCheckoutsV4 = (
  options: HistoricalOptions = {},
) => {
  const tools = resolveV138HistoricalToolchainV4()
  if (options.onlyGeneration === undefined && !options.mutateInstalledRunner) {
    return Object.freeze(
      cases.flatMap(({ generation }) =>
        runV138Phase262HistoricalCorrectionCheckoutsV4({
          onlyGeneration: generation,
        }),
      ),
    )
  }
  const configRoot = mkdtempSync(path.join(tmpdir(), "v138-historical-config-v4-"))
  const environment = cleanEnvironment(tools.toolBin, configRoot)
  const git = (args: readonly string[], cwd = root) =>
    execFileSync(tools.git, hardenedGitArgs(args), {
      cwd,
      encoding: "utf8",
      env: environment,
    }).trim()
  const results: Readonly<Record<string, unknown>>[] = []
  try {
   assertRepositoryConfigurationSafe(git)
   for (const item of cases.filter(
     ({ generation }) =>
       options.onlyGeneration === undefined ||
       generation === options.onlyGeneration,
   )) {
    const holder = mkdtempSync(path.join(tmpdir(), `v138-${item.generation}-v4-`))
    const checkout = path.join(holder, "checkout")
    const reference = path.join(holder, "reference")
    const added: string[] = []
    try {
      for (const destination of [checkout, reference]) {
        execFileSync(
          tools.git,
          hardenedGitArgs(["worktree", "add", "--detach", destination, item.commit]),
          { cwd: root, env: environment, stdio: "pipe" },
        )
        added.push(destination)
      }
      const checkoutIdentity = assertCheckoutMatchesRawTree(git, checkout, item.commit, environment)
      const referenceIdentity = assertCheckoutMatchesRawTree(git, reference, item.commit, environment)
      const tree = checkoutIdentity.tree
      if (
        referenceIdentity.tree !== tree ||
        referenceIdentity.checkoutBytes.root !== checkoutIdentity.checkoutBytes.root
      )
        fail("V138_HISTORICAL_REFERENCE_TREE_MISMATCH")
      const packageBytes = readFileSync(path.join(checkout, "package.json"))
      const packageJson = JSON.parse(packageBytes.toString("utf8"))
      const lockfileBytes = readFileSync(path.join(checkout, "pnpm-lock.yaml"))
      const lockfile = lockfileBytes.toString("utf8")
      if (
        packageJson.packageManager !== EXPECTED.packageManager ||
        sha(lockfileBytes) !== EXPECTED.lockfileSha256 ||
        !lockfile.includes(`resolution: {integrity: ${EXPECTED.vitestIntegrity}}`)
      )
        fail("V138_HISTORICAL_COMMITTED_DEPENDENCY_IDENTITY_MISMATCH")
      for (const destination of [checkout, reference]) {
        assertPnpmClosure(tools.pnpmPackageRoot)
        execFileSync(
          tools.node,
          [tools.pnpm, "--store-dir", tools.pnpmStore, "install", "--frozen-lockfile", "--offline", "--ignore-scripts", "--verify-store-integrity=true"],
          { cwd: destination, env: environment, stdio: "pipe" },
        )
        assertPnpmClosure(tools.pnpmPackageRoot)
      }
      const runner = realpathSync(path.join(checkout, "node_modules/vitest/vitest.mjs"))
      const referenceClosure = installedClosureManifest(reference)
      if (options.mutateInstalledRunner)
        writeFileSync(
          path.join(checkout, "node_modules/vitest/dist/cli.js"),
          "throw new Error('mutated historical runner')\n",
        )
      const closure = installedClosureManifest(checkout)
      if (
        closure.root !== referenceClosure.root ||
        closure.files !== referenceClosure.files ||
        closure.symlinks !== referenceClosure.symlinks ||
        closure.packages !== referenceClosure.packages
      )
        fail("V138_HISTORICAL_INSTALLED_CLOSURE_MISMATCH")
      if (
        sha(readFileSync(runner)) !== EXPECTED.runnerSha256 ||
        JSON.parse(readFileSync(path.join(checkout, "node_modules/vitest/package.json"), "utf8")).version !== "4.1.6"
      )
        fail("V138_HISTORICAL_RUNNER_IDENTITY_MISMATCH")
      const runnerBefore = sha(readFileSync(runner))
      execFileSync(
        tools.node,
        [runner, "run", item.test, "--pool=forks", "--maxWorkers=1", "--no-file-parallelism", "--bail=1"],
        { cwd: checkout, env: environment, stdio: "pipe" },
      )
      if (
        sha(readFileSync(runner)) !== runnerBefore ||
        installedClosureManifest(checkout).root !== closure.root
      )
        fail("V138_HISTORICAL_EXECUTED_CLOSURE_CHANGED")
      const testBlob = git(["rev-parse", `${item.commit}:${item.test}`])
      const lockfileBlob = git(["rev-parse", `${item.commit}:pnpm-lock.yaml`])
      const packageBlob = git(["rev-parse", `${item.commit}:package.json`])
      results.push(Object.freeze({
        generation: item.generation,
        commit: item.commit,
        test: item.test,
        tree,
        checkoutByteManifestRoot: checkoutIdentity.checkoutBytes.root,
        checkoutByteManifestFiles: checkoutIdentity.checkoutBytes.files,
        checkoutByteManifestSymlinks: checkoutIdentity.checkoutBytes.symlinks,
        testBlob,
        lockfileBlob,
        packageBlob,
        packageManager: EXPECTED.packageManager,
        packageManagerVersion: tools.pnpmVersion,
        gitPath: tools.git,
        gitSha256: tools.gitSha256,
        gitCdHash: tools.gitCdHash,
        nodePath: tools.node,
        nodeSha256: tools.nodeSha256,
        nodeCdHash: tools.nodeCdHash,
        pnpmPath: tools.pnpm,
        pnpmSha256: tools.pnpmSha256,
        pnpmDistSha256: tools.pnpmDistSha256,
        pnpmClosureRoot: tools.pnpmClosureRoot,
        pnpmClosureFiles: tools.pnpmClosureFiles,
        corepackPath: tools.corepack,
        corepackSha256: tools.corepackSha256,
        lockfileSha256: EXPECTED.lockfileSha256,
        vitestPackageIntegrity: EXPECTED.vitestIntegrity,
        testRunnerPath: "node_modules/vitest/vitest.mjs",
        testRunnerSha256: EXPECTED.runnerSha256,
        installedClosureRoot: closure.root,
        installedClosureFiles: closure.files,
        installedClosureSymlinks: closure.symlinks,
        installedClosurePackages: closure.packages,
        entryLaunchBinding: "same-process-reviewed-runner-no-ambient-tsx-child-v5",
        executionAssurance: "single_operator_local_seal_v1_no_hostile_same_uid",
        gitIsolation: V138_HISTORICAL_GIT_ISOLATION_V4,
        dependencyRoot: sha([
          tree, checkoutIdentity.checkoutBytes.root,
          String(checkoutIdentity.checkoutBytes.files),
          String(checkoutIdentity.checkoutBytes.symlinks),
          testBlob, lockfileBlob, packageBlob, EXPECTED.packageManager,
          tools.gitSha256, tools.gitCdHash, tools.nodeSha256, tools.nodeCdHash,
          tools.pnpmSha256, tools.pnpmDistSha256, tools.pnpmClosureRoot,
          String(tools.pnpmClosureFiles), tools.corepackSha256, EXPECTED.lockfileSha256,
          EXPECTED.vitestIntegrity, EXPECTED.runnerSha256, closure.root,
        ].join("\0")),
        dependencyIsolation: "exact-pnpm-distribution-signed-toolchain-lockfile-store-integrity-v5",
        status: "passed",
      }))
    } finally {
      for (const destination of added.reverse())
        execFileSync(tools.git, hardenedGitArgs(["worktree", "remove", "--force", destination]), {
          cwd: root,
          env: environment,
          stdio: "pipe",
        })
      rmSync(holder, { recursive: true, force: true })
    }
   }
  } finally {
    rmSync(configRoot, { recursive: true, force: true })
  }
  return Object.freeze(results)
}

export const V138_PHASE_262_HISTORICAL_CHECKOUTS_V4_PATH =
  ".planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v4.json"
export const deriveV138Phase262HistoricalCheckoutEvidenceV4 = () =>
  Object.freeze({
    schemaVersion: "v1.38-phase-262-historical-correction-checkouts-v4",
    results: runV138Phase262HistoricalCorrectionCheckoutsV4(),
  })
export const checkV138Phase262HistoricalCheckoutEvidenceV4 = (): true => {
  const expected = `${JSON.stringify(deriveV138Phase262HistoricalCheckoutEvidenceV4())}\n`
  const observed = `${JSON.stringify(JSON.parse(readFileSync(path.join(root, V138_PHASE_262_HISTORICAL_CHECKOUTS_V4_PATH), "utf8")))}\n`
  if (observed !== expected) fail("V138_HISTORICAL_CHECKOUT_PROVENANCE_V4_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--check") {
    checkV138Phase262HistoricalCheckoutEvidenceV4()
    process.stdout.write("historical_correction_checkout_provenance_v4_valid=true\n")
  } else if (process.argv[2] === "--derive")
    process.stdout.write(`${JSON.stringify(deriveV138Phase262HistoricalCheckoutEvidenceV4())}\n`)
  else if (
    process.argv[2] === "--derive-case" &&
    (process.argv[3] === "correction-v2" || process.argv[3] === "correction-v3")
  )
    process.stdout.write(
      `${JSON.stringify(runV138Phase262HistoricalCorrectionCheckoutsV4({ onlyGeneration: process.argv[3] }))}\n`,
    )
  else fail("V138_HISTORICAL_CHECKOUT_COMMAND_V3_INVALID")
}
