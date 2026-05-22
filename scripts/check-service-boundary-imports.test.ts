import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { analyzeServiceBoundaryImports } from "./check-service-boundary-imports.ts"

const strictFiles = [
  "apps/web/app/api/service/health/route.ts",
  "apps/web/app/api/matchsets/[matchSetId]/route.ts",
  "apps/web/app/matchsets/[matchSetId]/page.tsx",
  "apps/web/app/api/replays/[matchId]/metadata/route.ts",
  "apps/web/app/strategies/[strategyId]/page.tsx",
] as const

const writeRepoFile = (
  repoRoot: string,
  repoPath: string,
  source: string,
): void => {
  const absolutePath = path.join(repoRoot, repoPath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, source)
}

describe("service boundary import guard", () => {
  let repoRoot: string | undefined

  afterEach(() => {
    if (repoRoot) {
      rmSync(repoRoot, { force: true, recursive: true })
      repoRoot = undefined
    }
  })

  it("fails strict migrated files on forbidden direct imports only", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      strictFiles[0],
      [
        "import { createDatabasePool } from '@cowards/persistence'",
        "const comment = '// import { runWorkerOnce } from \"../apps/worker\"'",
        "const text = 'import StrategyExecutionAdapter from nowhere'",
        "export const ok = true",
      ].join("\n"),
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([
      {
        path: strictFiles[0],
        line: 1,
        pattern: "@cowards/persistence",
      },
    ])
    expect(result.exitCode).toBe(1)
  })

  it("reports broad app findings without failing when strict files are clean", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      "apps/web/app/legacy/server.ts",
      "export { runWorkerOnce } from '../../../../apps/worker/src/runner.ts'\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([])
    expect(result.reportOnlyOffenses).toEqual([
      {
        path: "apps/web/app/legacy/server.ts",
        line: 1,
        pattern: "apps/worker",
      },
    ])
    expect(result.exitCode).toBe(0)
  })
})
