import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
} from "node:fs"
import { tmpdir } from "node:os"
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
  corepackSha256: "sha256:3655bc798f300951f2070fee411b337d626b0c3ae80c2d24c46ccac4595d4bf9" as Sha,
  runnerSha256: "sha256:39db22f579acf5639bbb17a261408debbde03f4692c0c439e77e7f13aeba74d6" as Sha,
  lockfileSha256: "sha256:55cfd0166e4954863a84a77d50968269c14a22a2a788278ad5dead963fff0df3" as Sha,
  vitestIntegrity: "sha512-6lvjbS3p9b4CrdCmguzbh2/4uoXhGE2q71R4OX5sqF9R1bo9Xd6fGrMAfvp5wnCzlBnFVdCOp6onuTQVbo8iUQ==",
  packageManager: "pnpm@11.1.2",
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
const cleanEnvironment = (toolBin: string) => ({
  PATH: `/usr/bin:/bin:${toolBin}`,
  LANG: "C",
  LC_ALL: "C",
  CI: "1",
  COREPACK_ENABLE_PROJECT_SPEC: "0",
})
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

export const resolveV138HistoricalToolchainV3 = (
  environmentPath = process.env.PATH ?? "",
) => {
  const pnpmShim = executableOnPath("pnpm", environmentPath)
  const pnpm = realpathSync(pnpmShim)
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
  assertCodeSignature(GIT, EXPECTED.gitCdHash, "GIT")
  assertCodeSignature(node, EXPECTED.nodeCdHash, "NODE")
  const pnpmVersion = execFileSync(node, [pnpm, "--version"], {
    encoding: "utf8",
    env: cleanEnvironment(toolBin),
  }).trim()
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
    corepack,
    corepackSha256: EXPECTED.corepackSha256,
    pnpmVersion,
    toolBin,
  })
}

export const runV138Phase262HistoricalCorrectionCheckoutsV3 = () => {
  const tools = resolveV138HistoricalToolchainV3()
  const environment = cleanEnvironment(tools.toolBin)
  const git = (args: readonly string[], cwd = root) =>
    execFileSync(tools.git, [...args], {
      cwd,
      encoding: "utf8",
      env: environment,
    }).trim()
  const results: Readonly<Record<string, unknown>>[] = []
  for (const item of cases) {
    const holder = mkdtempSync(path.join(tmpdir(), `v138-${item.generation}-v3-`))
    const checkout = path.join(holder, "checkout")
    let added = false
    try {
      execFileSync(tools.git, ["worktree", "add", "--detach", checkout, item.commit], {
        cwd: root,
        env: environment,
        stdio: "pipe",
      })
      added = true
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
      execFileSync(
        tools.node,
        [tools.pnpm, "install", "--frozen-lockfile", "--offline", "--ignore-scripts"],
        { cwd: checkout, env: environment, stdio: "pipe" },
      )
      const runner = realpathSync(path.join(checkout, "node_modules/vitest/vitest.mjs"))
      if (
        sha(readFileSync(runner)) !== EXPECTED.runnerSha256 ||
        JSON.parse(readFileSync(path.join(checkout, "node_modules/vitest/package.json"), "utf8")).version !== "4.1.6"
      )
        fail("V138_HISTORICAL_RUNNER_IDENTITY_MISMATCH")
      execFileSync(
        tools.node,
        [runner, "run", item.test, "--pool=forks", "--maxWorkers=1", "--no-file-parallelism", "--bail=1"],
        { cwd: checkout, env: environment, stdio: "pipe" },
      )
      const tree = git(["rev-parse", `${item.commit}^{tree}`])
      const testBlob = git(["rev-parse", `${item.commit}:${item.test}`])
      const lockfileBlob = git(["rev-parse", `${item.commit}:pnpm-lock.yaml`])
      const packageBlob = git(["rev-parse", `${item.commit}:package.json`])
      results.push(Object.freeze({
        generation: item.generation,
        commit: item.commit,
        test: item.test,
        tree,
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
        corepackPath: tools.corepack,
        corepackSha256: tools.corepackSha256,
        lockfileSha256: EXPECTED.lockfileSha256,
        vitestPackageIntegrity: EXPECTED.vitestIntegrity,
        testRunnerPath: "node_modules/vitest/vitest.mjs",
        testRunnerSha256: EXPECTED.runnerSha256,
        dependencyRoot: sha([
          tree, testBlob, lockfileBlob, packageBlob, EXPECTED.packageManager,
          tools.gitSha256, tools.gitCdHash, tools.nodeSha256, tools.nodeCdHash,
          tools.pnpmSha256, tools.corepackSha256, EXPECTED.lockfileSha256,
          EXPECTED.vitestIntegrity, EXPECTED.runnerSha256,
        ].join("\0")),
        dependencyIsolation: "exact-signed-toolchain-lockfile-store-integrity-v3",
        status: "passed",
      }))
    } finally {
      if (added)
        execFileSync(tools.git, ["worktree", "remove", "--force", checkout], {
          cwd: root,
          env: environment,
          stdio: "pipe",
        })
      rmSync(holder, { recursive: true, force: true })
    }
  }
  return Object.freeze(results)
}

export const V138_PHASE_262_HISTORICAL_CHECKOUTS_V3_PATH =
  ".planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v3.json"
export const deriveV138Phase262HistoricalCheckoutEvidenceV3 = () =>
  Object.freeze({
    schemaVersion: "v1.38-phase-262-historical-correction-checkouts-v3",
    results: runV138Phase262HistoricalCorrectionCheckoutsV3(),
  })
export const checkV138Phase262HistoricalCheckoutEvidenceV3 = (): true => {
  const expected = `${JSON.stringify(deriveV138Phase262HistoricalCheckoutEvidenceV3())}\n`
  const observed = `${JSON.stringify(JSON.parse(readFileSync(path.join(root, V138_PHASE_262_HISTORICAL_CHECKOUTS_V3_PATH), "utf8")))}\n`
  if (observed !== expected) fail("V138_HISTORICAL_CHECKOUT_PROVENANCE_V3_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--check") {
    checkV138Phase262HistoricalCheckoutEvidenceV3()
    process.stdout.write("historical_correction_checkout_provenance_v3_valid=true\n")
  } else if (process.argv[2] === "--derive")
    process.stdout.write(`${JSON.stringify(deriveV138Phase262HistoricalCheckoutEvidenceV3())}\n`)
  else fail("V138_HISTORICAL_CHECKOUT_COMMAND_V3_INVALID")
}
