import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const fail = (code: string): never => { throw new TypeError(code) }
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim()
const cases = Object.freeze([
  Object.freeze({ generation: "correction-v2", commit: "8ae8cba0dfee4c04ed951a478187aed982c445e5", test: "scripts/check-v1-38-phase-262-review-fix-correction-v2.test.ts" }),
  Object.freeze({ generation: "correction-v3", commit: "7b56ecdcf6f88a63f79c9e7c46a6c290bb6dabe4", test: "scripts/check-v1-38-phase-262-review-fix-correction-v3.test.ts" }),
])

export const runV138Phase262HistoricalCorrectionCheckouts = (): readonly Readonly<Record<string, string>>[] => {
  const results: Readonly<Record<string, string>>[] = []
  for (const item of cases) {
    const holder = mkdtempSync(path.join(tmpdir(), `v138-${item.generation}-`))
    const checkout = path.join(holder, "checkout")
    let added = false
    try {
      execFileSync("git", ["worktree", "add", "--detach", checkout, item.commit], { cwd: root, stdio: "pipe" }); added = true
      if (!existsSync(path.join(checkout, item.test))) fail(`V138_HISTORICAL_TEST_MISSING:${item.generation}`)
      symlinkSync(path.join(root, "node_modules"), path.join(checkout, "node_modules"), "dir")
      const vitest = path.join(root, "node_modules/.bin/vitest")
      execFileSync(vitest, ["run", item.test, "--pool=forks", "--maxWorkers=1", "--no-file-parallelism", "--bail=1"], {
        cwd: checkout,
        env: { PATH: `/usr/bin:/bin:${path.dirname(process.execPath)}`, LANG: "C", LC_ALL: "C" },
        stdio: "inherit",
      })
      results.push(Object.freeze({ generation: item.generation, commit: item.commit, test: item.test, status: "passed" }))
    } finally {
      if (added) execFileSync("git", ["worktree", "remove", "--force", checkout], { cwd: root, stdio: "pipe" })
      rmSync(holder, { recursive: true, force: true })
    }
  }
  if (results.length !== cases.length) fail("V138_HISTORICAL_CHECKOUT_RESULT_MISSING")
  return Object.freeze(results)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify({ schemaVersion: "v1.38-phase-262-historical-correction-checkouts-v1", results: runV138Phase262HistoricalCorrectionCheckouts() })}\n`)
}
