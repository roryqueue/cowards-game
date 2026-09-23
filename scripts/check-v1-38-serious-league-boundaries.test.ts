import { describe, expect, it } from "vitest"
import { checkSeriousLeagueBoundaries } from "./check-v1-38-serious-league-boundaries.js"

const base = {
  "packages/strategy-lab/package.json": JSON.stringify({ name: "@cowards/strategy-lab", private: true, exports: { ".": "./src/index.ts" }, dependencies: { "@cowards/spec": "workspace:*", "@cowards/engine": "workspace:*", "@cowards/replay": "workspace:*", "@cowards/runtime-js": "workspace:*" } }),
  "packages/strategy-lab/src/index.ts": 'export { repository } from "./league/repository.js"',
  "packages/strategy-lab/src/league/repository.ts": "export const repository = 1",
  "packages/strategy-lab/src/factory/contracts.ts": "export interface FactoryContract { readonly root: string }",
  "scripts/run-v1-38-serious-league.ts": 'import { repository } from "../packages/strategy-lab/src/league/repository.js"; void repository',
  "scripts/lib/v1-38-league-authoring.ts": 'export const authoring = "private"',
  "scripts/lib/v1-38-league-response-runtime.ts": 'export const response = "private"',
  "scripts/assess-v1-38-factory-independence.ts": 'export const historicalReader = "private"',
  "scripts/v1-38-factory-execution-evidence.ts": 'export const executionReader = "private"',
  "scripts/v1-38-factory-assessment-correction.ts": 'export const correctionReader = "private"',
} as const

describe("Phase 265 resolved league import/privacy boundary", () => {
  it("allows the reviewed factory contract and canonical engine bridge", () => {
    const files = { ...base, "packages/strategy-lab/src/league/bridge.ts": 'import type { FactoryContract } from "../factory/contracts.js"; import "@cowards/engine"; export type { FactoryContract }', "packages/engine/src/index.ts": "export const kernel = 1", "packages/engine/package.json": JSON.stringify({ name: "@cowards/engine", dependencies: { "@cowards/spec": "workspace:*" } }) }
    expect(checkSeriousLeagueBoundaries({ files }).ok).toBe(true)
  })
  it("permits the Darwin host probe only in the private league CLI", () => {
    const allowed = { ...base, "scripts/run-v1-38-serious-league.ts": 'import { spawnSync } from "node:child_process"; void spawnSync' }
    expect(checkSeriousLeagueBoundaries({ files: allowed }).ok).toBe(true)
    const denied = { ...allowed, "scripts/lib/v1-38-league-authoring.ts": 'import { spawnSync } from "node:child_process"; void spawnSync' }
    expect(checkSeriousLeagueBoundaries({ files: denied }).violations).toContainEqual(expect.objectContaining({ path: "scripts/lib/v1-38-league-authoring.ts", rule: "unresolved-private-loader" }))
    const transitive = { ...allowed, "scripts/lib/v1-38-league-authoring.ts": 'import { observeLeagueAvailableMemoryBytes } from "../run-v1-38-serious-league.js"; void observeLeagueAvailableMemoryBytes' }
    expect(checkSeriousLeagueBoundaries({ files: transitive }).violations).toContainEqual(expect.objectContaining({ path: "scripts/lib/v1-38-league-authoring.ts", rule: "unresolved-private-loader" }))
  })
  it.each([
    ["multi-hop innocent package barrel", { "apps/web/app/page.ts": 'import "@cowards/innocent-package"', "packages/innocent-package/package.json": JSON.stringify({ name: "@cowards/innocent-package", exports: "./src/index.ts" }), "packages/innocent-package/src/index.ts": 'export * from "./middle.js"', "packages/innocent-package/src/middle.ts": 'export * from "../../strategy-lab/src/league/repository.js"' }],
    ["transitive dynamic loader", { "apps/web/app/page.ts": 'import "../../../scripts/public-middle.js"', "scripts/public-middle.ts": 'const target = "../packages/strategy-lab/src/league/" + "repository.js"; void import(target)' }],
    ["manifest alias", { "apps/web/app/page.ts": 'import "@league-alias/report"', "tsconfig.json": JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@league-alias/*": ["packages/strategy-lab/src/league/*"] } } }), "packages/strategy-lab/src/league/report.ts": "export const report = 1" }],
    ["deployment root", { "deploy/service.ts": 'export * from "../packages/strategy-lab/src/league/repository.js"' }],
    ["restricted historical reader", { "apps/web/app/page.ts": 'import "../../../scripts/assess-v1-38-factory-independence.js"' }],
    ["private unresolved loader", { "scripts/lib/v1-38-league-authoring.ts": "void import(loader)" }],
    ["private unresolved module loader", { "scripts/lib/v1-38-league-authoring.ts": "module.require(target)" }],
    ["private unresolved property loader", { "scripts/lib/v1-38-league-authoring.ts": "loader.require(target)" }],
    ["private source execution", { "packages/strategy-lab/src/league/unsafe.ts": "const execute = new Function('return 1')" }],
  ])("rejects %s", (_name, files) => {
    const result = checkSeriousLeagueBoundaries({ files: { ...base, ...files } })
    expect(result.ok).toBe(false)
    expect(result.violations.map((entry) => `${entry.path}:${entry.rule}`)).not.toEqual([])
  })
})
