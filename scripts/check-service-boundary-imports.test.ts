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
  "apps/web/app/players/[handle]/page.tsx",
  "apps/web/app/ladder/[seasonId]/page.tsx",
  "apps/web/app/account/page.tsx",
  "apps/web/app/api/auth/session/route.ts",
  "apps/web/app/exhibitions/new/page.tsx",
  "apps/web/lib/public-service-boundary.ts",
  "apps/web/lib/account-service-boundary.ts",
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

  it("fails strict migrated files on broad web server facades", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      strictFiles[1],
      "import { competitiveServer } from '../../../competitive/server.js'\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([
      {
        path: strictFiles[1],
        line: 1,
        pattern: "competitive/server",
      },
    ])
    expect(result.exitCode).toBe(1)
  })

  it("fails strict local dependencies on forbidden imports", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      strictFiles[1],
      "import { load } from '../../../../lib/unsafe-helper.js'\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/web/lib/unsafe-helper.ts",
      "import { createDatabasePool } from '@cowards/persistence/db'\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([
      {
        path: "apps/web/lib/unsafe-helper.ts",
        line: 1,
        pattern: "@cowards/persistence",
      },
    ])
    expect(result.exitCode).toBe(1)
  })

  it("allows the approved public service adapter to own local persistence bridging", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      strictFiles[1],
      "import { read } from '../../../../lib/public-service-boundary.js'\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/web/lib/public-service-boundary.ts",
      "import { adapter } from './public-service-adapter.js'\nexport const read = adapter\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/web/lib/public-service-adapter.ts",
      "import { createDatabasePool } from '@cowards/persistence/db'\nexport const adapter = createDatabasePool\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([])
    expect(result.exitCode).toBe(0)
  })

  it("fails the approved public service adapter on non-persistence forbidden imports", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      strictFiles[1],
      "import { read } from '../../../../lib/public-service-boundary.js'\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/web/lib/public-service-boundary.ts",
      "import { adapter } from './public-service-adapter.js'\nexport const read = adapter\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/web/lib/public-service-adapter.ts",
      "import { runWorkerOnce } from '@cowards/worker'\nexport const adapter = runWorkerOnce\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([
      {
        path: "apps/web/lib/public-service-adapter.ts",
        line: 1,
        pattern: "@cowards/worker",
      },
    ])
    expect(result.exitCode).toBe(1)
  })
})
