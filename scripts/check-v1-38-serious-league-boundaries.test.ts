import { describe, expect, it } from "vitest"
import { checkSeriousLeagueBoundaries } from "./check-v1-38-serious-league-boundaries.js"

const base = {
  "packages/strategy-lab/package.json": JSON.stringify({ name: "@cowards/strategy-lab", private: true, exports: { ".": "./src/index.ts" } }),
  "packages/strategy-lab/src/index.ts": 'export { createLeagueRepository } from "./league/repository.js"',
  "packages/strategy-lab/src/league/repository.ts": "export const repository = 1",
  "scripts/run-v1-38-serious-league.ts": 'import { repository } from "../packages/strategy-lab/src/league/repository.js"; void repository',
} as const

describe("Phase 265 league import/privacy boundary", () => {
  it("allows the narrow factory/league contract bridge", () => {
    expect(checkSeriousLeagueBoundaries({ files: base }).ok).toBe(true)
  })
  it.each([
    ["direct public import", { "apps/web/app/page.tsx": 'import "@cowards/strategy-lab"' }],
    ["barrel public import", { "apps/web/lib/private.ts": 'export * from "../../../packages/strategy-lab/src/league/report.js"' }],
    ["dynamic loader", { "packages/strategy-lab/src/league/loader.ts": "import(load())" }],
    ["manifest subpath", { "packages/strategy-lab/package.json": JSON.stringify({ private: true, exports: { "./league": "./src/league/index.ts" } }) }],
    ["private source execution", { "packages/strategy-lab/src/league/unsafe.ts": "const execute = new Function('return 1')" }],
    ["report payload leak", { "packages/strategy-lab/src/league/report.ts": "const projection = { StrategyMemory: 'secret' }" }],
  ])("rejects %s", (_name, files) => {
    expect(checkSeriousLeagueBoundaries({ files: { ...base, ...files } }).ok).toBe(false)
  })
})
