import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const fail = (code: string): never => {
  throw new TypeError(code)
}
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim()
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

export const runV138Phase262HistoricalCorrectionCheckouts =
  (): readonly Readonly<Record<string, unknown>>[] => {
    const results: Readonly<Record<string, unknown>>[] = []
    const sha = (bytes: Buffer | string) =>
      `sha256:${createHash("sha256").update(bytes).digest("hex")}`
    const git = (args: readonly string[], cwd = root) =>
      execFileSync("git", [...args], { cwd, encoding: "utf8" }).trim()
    const packageManager = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).packageManager
    const pnpmVersion = execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim()
    const runtimePath = realpathSync(process.execPath)
    const runtimeSha256 = sha(readFileSync(runtimePath))
    for (const item of cases) {
      const holder = mkdtempSync(
        path.join(tmpdir(), `v138-${item.generation}-`),
      )
      const checkout = path.join(holder, "checkout")
      let added = false
      try {
        execFileSync(
          "git",
          ["worktree", "add", "--detach", checkout, item.commit],
          { cwd: root, stdio: "pipe" },
        )
        added = true
        if (!existsSync(path.join(checkout, item.test)))
          fail(`V138_HISTORICAL_TEST_MISSING:${item.generation}`)
        execFileSync("pnpm", ["install", "--frozen-lockfile", "--offline", "--ignore-scripts"], {
          cwd: checkout,
          env: { ...process.env, CI: "1" },
          stdio: "pipe",
        })
        const testRunnerPath = "node_modules/vitest/vitest.mjs"
        const vitest = realpathSync(path.join(checkout, testRunnerPath))
        const tree = git(["rev-parse", `${item.commit}^{tree}`])
        const testBlob = git(["rev-parse", `${item.commit}:${item.test}`])
        const lockfileBlob = git(["rev-parse", `${item.commit}:pnpm-lock.yaml`])
        const packageBlob = git(["rev-parse", `${item.commit}:package.json`])
        const lockfileSha256 = sha(readFileSync(path.join(checkout, "pnpm-lock.yaml")))
        const runnerSha256 = sha(readFileSync(vitest))
        execFileSync(
          process.execPath,
          [
            vitest,
            "run",
            item.test,
            "--pool=forks",
            "--maxWorkers=1",
            "--no-file-parallelism",
            "--bail=1",
          ],
          {
            cwd: checkout,
            env: {
              PATH: `/usr/bin:/bin:${path.dirname(process.execPath)}`,
              LANG: "C",
              LC_ALL: "C",
            },
            stdio: "inherit",
          },
        )
        results.push(
          Object.freeze({
            generation: item.generation,
            commit: item.commit,
            test: item.test,
            tree,
            testBlob,
            lockfileBlob,
            packageBlob,
            packageManager,
            pnpmVersion,
            runtimeVersion: process.version,
            runtimePath,
            runtimeSha256,
            testRunnerPath,
            testRunnerSha256: runnerSha256,
            lockfileSha256,
            dependencyRoot: sha(
              [tree, testBlob, lockfileBlob, packageBlob, packageManager, pnpmVersion, process.version, runtimeSha256, runnerSha256, lockfileSha256].join("\0"),
            ),
            dependencyIsolation: "detached-worktree-frozen-lockfile-offline-v1",
            status: "passed",
          }),
        )
      } finally {
        if (added)
          execFileSync("git", ["worktree", "remove", "--force", checkout], {
            cwd: root,
            stdio: "pipe",
          })
        rmSync(holder, { recursive: true, force: true })
      }
    }
    if (results.length !== cases.length)
      fail("V138_HISTORICAL_CHECKOUT_RESULT_MISSING")
    return Object.freeze(results)
  }

export const V138_PHASE_262_HISTORICAL_CHECKOUTS_V2_PATH =
  ".planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v2.json"
export const deriveV138Phase262HistoricalCheckoutEvidenceV2 = () =>
  Object.freeze({
    schemaVersion: "v1.38-phase-262-historical-correction-checkouts-v2",
    results: runV138Phase262HistoricalCorrectionCheckouts(),
  })
export const checkV138Phase262HistoricalCheckoutEvidenceV2 = (): true => {
  const expected = `${JSON.stringify(deriveV138Phase262HistoricalCheckoutEvidenceV2())}\n`
  const observed = `${JSON.stringify(JSON.parse(readFileSync(path.join(root, V138_PHASE_262_HISTORICAL_CHECKOUTS_V2_PATH), "utf8")))}\n`
  if (observed !== expected) fail("V138_HISTORICAL_CHECKOUT_PROVENANCE_MISMATCH")
  return true
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "--check") {
    checkV138Phase262HistoricalCheckoutEvidenceV2()
    process.stdout.write("historical_correction_checkout_provenance_v2_valid=true\n")
  } else if (process.argv[2] === "--derive")
    process.stdout.write(`${JSON.stringify(deriveV138Phase262HistoricalCheckoutEvidenceV2())}\n`)
  else fail("V138_HISTORICAL_CHECKOUT_COMMAND_INVALID")
}
