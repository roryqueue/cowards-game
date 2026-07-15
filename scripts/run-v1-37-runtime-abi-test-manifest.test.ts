import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

type TestManifest = {
  schemaVersion?: string
  tests?: Array<{
    id?: string
    stage?: string
    command?: readonly string[]
    namedResult?: string
    database?: { dsnEnvironmentVariable?: string; skipAllowed?: boolean }
  }>
}

const manifest = (): TestManifest =>
  JSON.parse(
    readFileSync(
      "packages/spec/artifacts/runtime-abi-v1.17-test-manifest.json",
      "utf8",
    ),
  ) as TestManifest

describe("Phase 258 exact runtime ABI test manifest", () => {
  it("owns exact named Go default, route, mixed, and historical cases", () => {
    const document = manifest()
    expect(document.schemaVersion).toBe("runtime-abi-v1.17-test-manifest-v1")
    const names = new Set(document.tests?.map(({ namedResult }) => namedResult))
    for (const name of [
      "TestPhase258CurrentDefaultRuntimeServiceContract",
      "TestPhase258CurrentDefaultRoutes",
      "TestPhase258MixedRuntimeContractFailsClosed",
      "TestPhase258HistoricalV116Dispatch",
    ]) {
      expect(names.has(name), name).toBe(true)
    }
  })

  it("requires exact commands and forbids skip for every named DB test", () => {
    const tests = manifest().tests ?? []
    expect(tests.length).toBeGreaterThan(0)
    for (const test of tests) {
      expect(test.id).toMatch(/^[a-z0-9][a-z0-9._:-]+$/u)
      expect(test.stage).toMatch(/^(preactivation|activation|postactivation)$/u)
      expect(test.command?.length).toBeGreaterThan(2)
      expect(test.command?.join(" ")).not.toMatch(/^pnpm (?:run )?test$/u)
      if (test.command?.[0] === "go" && test.command[1] === "test") {
        expect(test.command).toEqual(expect.arrayContaining(["-run"]))
      }
      expect(test.namedResult).toBeTruthy()
      if (test.database !== undefined) {
        expect(test.database.dsnEnvironmentVariable).toBeTruthy()
        expect(test.database.skipAllowed).toBe(false)
      }
    }
  })
})
