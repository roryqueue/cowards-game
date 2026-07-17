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
  "apps/web/app/matches/[matchId]/replay/page.tsx",
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

  it("fails strict migrated files on direct WASM/WASI runtime imports", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      strictFiles[1],
      "import { validateWasmWasiStrategySource } from '@cowards/runtime-wasm-wasi'\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([
      {
        path: strictFiles[1],
        line: 1,
        pattern: "@cowards/runtime-wasm-wasi",
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

  it("checks the selected replay page dependency chain strictly", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      "apps/web/app/matches/[matchId]/replay/page.tsx",
      "import { getMatchReplay } from '../../server.js'\nexport const Page = getMatchReplay\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/web/app/matches/server.ts",
      "import { runWorkerOnce } from '@cowards/worker'\nexport const getMatchReplay = runWorkerOnce\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([
      {
        path: "apps/web/app/matches/server.ts",
        line: 1,
        pattern: "@cowards/worker",
      },
    ])
    expect(result.exitCode).toBe(1)
  })

  it("fails selected replay helpers on non-quarantine persistence imports", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      "apps/web/app/matches/[matchId]/replay/page.tsx",
      "import { getMatchReplay } from '../../server.js'\nexport const Page = getMatchReplay\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/web/app/matches/server.ts",
      "import { buildPublicMatchSetResultDto } from '@cowards/persistence/competition'\nexport const getMatchReplay = buildPublicMatchSetResultDto\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([
      {
        path: "apps/web/app/matches/server.ts",
        line: 1,
        pattern: "@cowards/persistence",
      },
    ])
    expect(result.exitCode).toBe(1)
  })

  it("allows selected replay helpers only on explicit quarantine persistence imports", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    for (const file of strictFiles) {
      writeRepoFile(repoRoot, file, "export const ok = true\n")
    }
    writeRepoFile(
      repoRoot,
      "apps/web/app/matches/[matchId]/replay/page.tsx",
      "import { getMatchReplay } from '../../server.js'\nexport const Page = getMatchReplay\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/web/app/matches/server.ts",
      [
        "import { createDatabasePool } from '@cowards/persistence/db'",
        "import { createPostgresChronicleStore } from '@cowards/persistence/quarantine-lifecycle'",
        "import type { Queryable } from '@cowards/persistence/repositories'",
        "export const getMatchReplay = () => [createDatabasePool, createPostgresChronicleStore]",
      ].join("\n"),
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.strictOffenses).toEqual([])
    expect(result.exitCode).toBe(0)
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

  it("fails Phase 260 consumers that import Strategy execution or evaluator ownership", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    writeRepoFile(
      repoRoot,
      "packages/replay/src/unsafe-execution.ts",
      "import { executeMatch } from '@cowards/engine'\nexport const replay = executeMatch\n",
    )
    writeRepoFile(
      repoRoot,
      "packages/persistence/src/unsafe-evaluator.ts",
      "import { evaluateStrategy } from '@cowards/runtime-js'\nexport const evaluate = evaluateStrategy\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.ownershipOffenses).toEqual([
      {
        path: "packages/persistence/src/unsafe-evaluator.ts",
        line: 1,
        pattern: "strategy-execution-ownership:evaluateStrategy",
      },
      {
        path: "packages/replay/src/unsafe-execution.ts",
        line: 1,
        pattern: "strategy-execution-ownership:executeMatch",
      },
    ])
    expect(result.exitCode).toBe(1)
  })

  it("fails non-kernel observation derivation and seed-encoded fairness", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    writeRepoFile(
      repoRoot,
      "packages/persistence/src/derived-observations.ts",
      [
        "export const observe = (seed: string, roundNumber: number, events: readonly string[]) => ({",
        "  initialInitiativePlayerId: seed.endsWith(':first') ? 'player:a' : 'player:b',",
        "  roundInitiativePlayerId: roundNumber % 2 === 0 ? 'player:a' : 'player:b',",
        "  hasAdvancedThisActivation: events.includes('MOVE_ADVANCED'),",
        "})",
      ].join("\n"),
    )
    writeRepoFile(
      repoRoot,
      "packages/persistence/src/candidate-fairness.ts",
      [
        "export const candidate = { semanticAuthorityKey: 'runtime-v1.19' }",
        "export const fairness = (seed: string) => seed.endsWith(':mirror')",
      ].join("\n"),
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.ownershipOffenses.map(({ pattern }) => pattern)).toEqual([
      "set-fairness-from-seed",
      "kernel-observation-derivation:initialInitiativePlayerId",
      "kernel-observation-derivation:roundInitiativePlayerId",
      "kernel-observation-derivation:hasAdvancedThisActivation",
    ])
    expect(result.exitCode).toBe(1)
  })

  it("fails handwritten successor geometry, Go rules ownership, and current-selector bypass", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    writeRepoFile(
      repoRoot,
      "apps/web/app/candidate-arena.ts",
      [
        "export const arena = {",
        "  semanticAuthorityKey: 'runtime-v1.19',",
        "  id: 'arena:smoke:v1',",
        "  initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },",
        "  terrainStones: [],",
        "}",
      ].join("\n"),
    )
    writeRepoFile(
      repoRoot,
      "apps/web/app/current-semantic-authority.ts",
      "export const CURRENT_SEMANTIC_AUTHORITY_KEY = 'runtime-v1.19'\n",
    )
    writeRepoFile(
      repoRoot,
      "apps/go-backend/candidate_rules.go",
      [
        "package main",
        "func candidateRules() string {",
        "  authority := \"runtime-v1.19\"",
        "  _ = resolveBackstab()",
        "  return authority",
        "}",
      ].join("\n"),
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.ownershipOffenses.map(({ pattern }) => pattern)).toEqual([
      "go-gameplay-ownership:resolveBackstab",
      "handwritten-successor-arena-geometry",
      "current-selector-bypass",
    ])
    expect(result.exitCode).toBe(1)
  })

  it("allows exact spec projections, transport-only consumers, and historical dispatch", () => {
    repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-boundary-"))
    writeRepoFile(
      repoRoot,
      "packages/spec/src/arena-catalog-v1-37.ts",
      [
        "export const arena = {",
        "  id: 'arena:smoke:v1',",
        "  initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },",
        "  terrainStones: [],",
        "}",
      ].join("\n"),
    )
    writeRepoFile(
      repoRoot,
      "packages/replay/src/candidate-transport.ts",
      [
        "import { CANONICAL_ARENA_CATALOG_V1_37 } from '@cowards/spec'",
        "export const transport = (input: { initialInitiativePlayerId: string }) => ({",
        "  catalog: CANONICAL_ARENA_CATALOG_V1_37,",
        "  initialInitiativePlayerId: input.initialInitiativePlayerId,",
        "})",
      ].join("\n"),
    )
    writeRepoFile(
      repoRoot,
      "packages/replay/src/historical-v1-4-transition.ts",
      "export const historical = { seed: 'seed:old:mirror' }\n",
    )

    const result = analyzeServiceBoundaryImports({ repoRoot })

    expect(result.ownershipOffenses).toEqual([])
    expect(result.exitCode).toBe(0)
  })
})
